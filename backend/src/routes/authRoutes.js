const express = require('express');
const router = express.Router();
const {
  registerConsumer,
  registerFarmer,
  login,
  getCurrentUser,
} = require('../controllers/authController');
const {
  validateConsumerSignup,
  validateFarmerSignup,
  validateLogin,
} = require('../validators/authValidator');
const { authenticate } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Rate-limited auth routes
router.post('/signup/consumer', authLimiter, validateConsumerSignup, registerConsumer);
router.post('/signup/farmer', authLimiter, validateFarmerSignup, registerFarmer);
router.post('/login', authLimiter, validateLogin, login);

// Authenticated user profile
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
