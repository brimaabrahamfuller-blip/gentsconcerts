const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration & Login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Email verification
router.get('/verify/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Password management
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
