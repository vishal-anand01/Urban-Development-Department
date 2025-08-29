const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");
const dashboardController = require("../controllers/dashboardController");
const auth = require("../middleware/auth");

router.post("/login", loginController.login);
router.get("/dashboard", auth, dashboardController.getDashboardData);

module.exports = router;
