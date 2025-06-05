const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db/database");

const router = express.Router();

// Token refresh route
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Check if user exists
    const [users] = await pool.query(
      "SELECT id, username, role FROM users WHERE id = ? AND status = 'active'",
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const user = users[0];

    // Generate new access token
    const newToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
});

module.exports = router;
