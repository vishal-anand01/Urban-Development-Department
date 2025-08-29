const jwt = require("jsonwebtoken");
const pool = require("../db");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { username, sessionId } = decoded;

    const result = await pool.query("SELECT session_id FROM users WHERE username=$1", [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid session" });
    }

    const dbSession = result.rows[0].session_id;

    // 🛑 Token session mismatch → logout
    if (sessionId !== dbSession) {
      return res.status(401).json({ message: "Session expired or reused" });
    }

    req.user = decoded; // attach user info
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
