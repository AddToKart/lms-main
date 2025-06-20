const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/database");

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find user by username - check if is_active column exists, if not exclude it
    let selectQuery =
      "SELECT id, username, email, password_hash, first_name, last_name, role, last_login, created_at FROM users WHERE username = ?";

    // Try to check if is_active column exists
    try {
      const [columnCheck] = await pool.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'"
      );

      if (columnCheck.length > 0) {
        selectQuery =
          "SELECT id, username, email, password_hash, first_name, last_name, role, is_active, last_login, created_at FROM users WHERE username = ?";
      }
    } catch (columnCheckError) {
      console.log("Column check failed, proceeding without is_active");
    }

    const [users] = await pool.execute(selectQuery, [username]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = users[0];

    // Check if user is active (only if is_active column exists)
    if (user.hasOwnProperty("is_active") && !user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    // Check password - your password column has the hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    await pool.execute(
      "UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = ?",
      [user.id]
    );

    // Generate token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // Remove password from response and add full_name for compatibility
    const { password_hash: userPassword, ...userWithoutPassword } = user;
    userWithoutPassword.full_name = `${user.first_name} ${user.last_name}`;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Register
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name, role = "officer" } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Split full_name into first_name and last_name
    const nameParts = full_name.trim().split(" ");
    const first_name = nameParts[0] || "";
    const last_name = nameParts.slice(1).join(" ") || "";

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user - using correct column names
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [username, email, hashedPassword, first_name, last_name, role, 1]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: result.insertId,
        username,
        email,
        full_name,
        role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if is_active column exists
    let selectQuery =
      "SELECT id, username, email, first_name, last_name, role, last_login, created_at FROM users WHERE id = ?";

    try {
      const [columnCheck] = await pool.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'"
      );

      if (columnCheck.length > 0) {
        selectQuery =
          "SELECT id, username, email, first_name, last_name, role, is_active, last_login, created_at FROM users WHERE id = ?";
      }
    } catch (columnCheckError) {
      console.log("Column check failed, proceeding without is_active");
    }

    const [users] = await pool.execute(selectQuery, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];
    user.full_name = `${user.first_name} ${user.last_name}`;

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Get current password hash
    const [users] = await pool.execute(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      users[0].password_hash
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.execute(
      "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Database diagnostic function
exports.checkDatabaseStructure = async (req, res) => {
  try {
    // Check if users table exists
    const [tables] = await pool.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
    );

    if (tables.length === 0) {
      return res.json({
        success: false,
        message: "Users table does not exist",
        suggestion: "Run database initialization",
      });
    }

    // Check users table structure
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
       ORDER BY ORDINAL_POSITION`
    );

    // Check if we have the admin user
    const [adminUsers] = await pool.execute(
      "SELECT id, username, email, role FROM users WHERE role = ? LIMIT 1",
      ["admin"]
    );

    res.json({
      success: true,
      message: "Database structure check complete",
      data: {
        tables_found: tables.map((t) => t.TABLE_NAME),
        users_columns: columns,
        admin_user_exists: adminUsers.length > 0,
        admin_user: adminUsers.length > 0 ? adminUsers[0] : null,
      },
    });
  } catch (error) {
    console.error("Database check error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking database structure",
      error: error.message,
    });
  }
};
