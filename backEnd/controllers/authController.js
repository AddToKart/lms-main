const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const pool = require("../db/database");

// Login controller
exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Validate request
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  try {
    // Check if user exists
    const [users] = await pool.query(
      "SELECT * FROM users WHERE username = ? AND status = 'active'",
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = users[0];

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return user info and token
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: `${user.first_name} ${user.last_name}`,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, username, email, role, first_name, last_name, last_login FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: `${user.first_name} ${user.last_name}`,
        lastLogin: user.last_login,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message,
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate request
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required",
    });
  }

  try {
    // Get user from database
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    // Verify current password
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      hashedPassword,
      req.user.id,
    ]);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while changing password",
      error: error.message,
    });
  }
};

// Logout controller (optional - mainly clears server-side sessions if using them)
exports.logout = async (req, res) => {
  try {
    // Since we're using JWT tokens, logout is mainly handled on the client side
    // by removing the token from localStorage. But we can track logout time if needed.

    if (req.user && req.user.id) {
      await pool.query("UPDATE users SET last_logout = NOW() WHERE id = ?", [
        req.user.id,
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message,
    });
  }
};

// Register controller (admin only - for creating new users)
exports.register = async (req, res) => {
  const {
    username,
    email,
    password,
    role = "officer",
    first_name,
    last_name,
  } = req.body;

  // Validate request
  if (!username || !email || !password || !first_name || !last_name) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this username or email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password_hash, role, first_name, last_name, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())",
      [username, email, hashedPassword, role, first_name, last_name]
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: result.insertId,
        username,
        email,
        role,
        fullName: `${first_name} ${last_name}`,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};
