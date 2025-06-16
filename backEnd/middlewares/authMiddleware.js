const jwt = require("jsonwebtoken");
const pool = require("../db/database");

const protect = async (req, res, next) => {
  let token;

  console.log(
    "[AuthMiddleware] Incoming request to protected route:",
    req.method,
    req.originalUrl
  );
  console.log(
    "[AuthMiddleware] Headers:",
    JSON.stringify(req.headers, null, 2)
  );

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];
      console.log("[AuthMiddleware] Token found in header:", token);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[AuthMiddleware] Token decoded:", decoded);

      // Get user from the token
      let userQuery = "SELECT id, username, role FROM users WHERE id = ?";

      // Check if is_active column exists and add it to query if it does
      try {
        const [columnCheck] = await pool.execute(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'"
        );

        if (columnCheck.length > 0) {
          userQuery =
            "SELECT id, username, role, is_active FROM users WHERE id = ?";
        }
      } catch (columnCheckError) {
        console.log("Column check failed, proceeding without is_active");
      }

      const [users] = await pool.execute(userQuery, [decoded.id]);

      if (users.length === 0) {
        console.log("[AuthMiddleware] User not found for ID:", decoded.id);
        return res.status(401).json({
          success: false,
          message: "User belonging to this token does no longer exist.",
        });
      }

      const user = users[0];

      // Check if user is active (only if is_active column exists)
      if (user.hasOwnProperty("is_active") && !user.is_active) {
        console.log("[AuthMiddleware] User not active for ID:", decoded.id);
        return res.status(401).json({
          success: false,
          message: "User account is not active.",
        });
      }

      req.user = user;
      console.log(
        "[AuthMiddleware] User attached to request:",
        req.user.username,
        req.user.role
      );
      next();
    } catch (error) {
      console.error(
        "[AuthMiddleware] Token verification failed:",
        error.message
      );
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token. Please log in again.",
        });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Your session has expired. Please log in again.",
          errorType: "TOKEN_EXPIRED", // Custom error type for frontend to handle
        });
      }
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed. Please log in again.",
      });
    }
  }

  if (!token) {
    console.log("[AuthMiddleware] No token found in authorization header.");
    return res.status(401).json({
      success: false,
      message: "You are not logged in! Please log in to get access.",
    });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log("[AuthMiddleware] Restricting to roles:", roles);
    console.log(
      "[AuthMiddleware] User role for restriction check:",
      req.user ? req.user.role : "No user"
    );
    if (!req.user || !roles.includes(req.user.role)) {
      console.log(
        "[AuthMiddleware] Access denied. User role:",
        req.user ? req.user.role : "No user",
        "Required roles:",
        roles
      );
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    console.log("[AuthMiddleware] Access granted for role:", req.user.role);
    next();
  };
};

module.exports = { protect, restrictTo };
