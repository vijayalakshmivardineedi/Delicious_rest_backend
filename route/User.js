const express = require("express");
const router = express.Router();
const {
  sendOTP,
  register,
  login,
  getCurrentUser,
  sendLoginOTP,
} = require("../controller/User");

const verifyToken = require("../Middleware/verifyToken");

router.post("/send-otp", sendOTP);
router.post("/sendLoginOTP", sendLoginOTP);
router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, getCurrentUser);

module.exports = router;
