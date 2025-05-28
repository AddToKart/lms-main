const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/profile', protect, authController.getProfile);
router.post('/change-password', protect, authController.changePassword);

module.exports = router;
