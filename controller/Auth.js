// // controller/Auth.js
// const jwt = require('jsonwebtoken');
// const Admin = require("../model/Admin");

// exports.loginAdmin = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const admin = await Admin.validateCredentials(email, password);

//     if (!admin) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const token = jwt.sign({ email: admin.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     return res.json({
//       message: 'Login successful',
//       token: token
//     });

//   } catch (error) {
//     return res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// exports.dashboard = (req, res) => {
//   res.json({ message: 'Welcome to the Admin Dashboard!' });
// };

// controller/Auth.js
const jwt = require("jsonwebtoken");
const Admin = require("../model/Admin");

// Store refresh tokens (in DB or cache ideally)
let refreshTokens = [];

exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.validateCredentials(email, password);

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Access token (short life)
    const accessToken = jwt.sign(
      { email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // 15 minutes
    );

    // Refresh token (long life)
    const refreshToken = jwt.sign(
      { email: admin.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" } // 7 days
    );

    refreshTokens.push(refreshToken);

    return res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Generate new access token using refresh token
exports.refreshToken = (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "No token provided" });

  if (!refreshTokens.includes(token)) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, admin) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    const newAccessToken = jwt.sign(
      { email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });
  });
};

// Logout – remove refresh token
exports.logoutAdmin = (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.json({ message: "Logged out successfully" });
};

exports.dashboard = (req, res) => {
  res.json({ message: "Welcome to the Admin Dashboard!" });
};

