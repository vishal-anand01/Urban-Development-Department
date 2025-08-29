const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.FRONT_AES_KEY; // Must be 32 bytes


function decryptAES(encryptedData, ivHex) {
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedData, "base64");

  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString()); // 🧠 Will throw if key/iv wrong
}

// async function run() {
//   const adminPass = await bcrypt.hash("admin123", 10);
//   const userPass = await bcrypt.hash("user123", 10);
//   console.log("Admin:", adminPass);
//   console.log("User:", userPass);
// }

// run();

exports.login = async (req, res) => {
  const { content, iv } = req.body;

  let decrypted;
  try {
    decrypted = decryptAES(content, iv);
  } catch (err) {
    return res.status(400).json({ message: "Decryption failed" });
  }

  const { username, password } = decrypted;
  // console.log("🛠 Decrypted Username:", username);
  // console.log("🛠 Decrypted Password:", password);
  // console.log("🔐 Received IV:", iv);
  // console.log("🔐 Received content:", content);

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const sessionId = crypto.randomUUID();
    await pool.query("UPDATE users SET session_id=$1 WHERE username=$2", [sessionId, username]);

    const token = jwt.sign(
      { username: user.username, role: user.role, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ token });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
