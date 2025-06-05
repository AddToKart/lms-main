const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.post("/login", authController.login);
router.post("/register", authController.register);

// Protected routes
router.use(protect); // Apply to all routes below
router.get("/profile", authController.getProfile);
router.post("/change-password", authController.changePassword);
router.post("/logout", authController.logout);

module.exports = router;
