const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

const validateConsumerSignup = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').trim().isEmail().withMessage('Valid email address required').normalizeEmail({ gmail_remove_dots: false }),
  body('phone').trim().notEmpty().withMessage('Phone number is required').matches(/^[0-9+-\s]{8,20}$/).withMessage('Valid phone format required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors,
];

const validateFarmerSignup = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email address required').normalizeEmail({ gmail_remove_dots: false }),
  body('phone').trim().notEmpty().withMessage('Phone number is required').matches(/^[0-9+-\s]{8,20}$/).withMessage('Valid phone format required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('farmLocation.address').trim().notEmpty().withMessage('Farm address is required'),
  body('farmLocation.district').trim().notEmpty().withMessage('Farm district is required'),
  body('farmLocation.state').trim().notEmpty().withMessage('Farm state is required'),
  body('farmLocation.pincode').trim().notEmpty().withMessage('Farm pincode is required'),
  body('cropTypes').isArray({ min: 1 }).withMessage('At least one crop type is required'),
  body('farmingMethod')
    .isIn(['ORGANIC', 'NATURAL', 'CONVENTIONAL', 'HYDROPONIC', 'PERMACULTURE'])
    .withMessage('Valid farming method required'),
  handleValidationErrors,
];

const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail({ gmail_remove_dots: false }),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

module.exports = {
  validateConsumerSignup,
  validateFarmerSignup,
  validateLogin,
};
