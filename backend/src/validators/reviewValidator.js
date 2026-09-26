const { body } = require('express-validator');
const { handleValidationErrors } = require('./validationHelper');

const validateCreateReview = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid Order ID format'),
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid Product ID format'),
  body('productRating')
    .notEmpty()
    .withMessage('Product rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Product rating must be an integer between 1 and 5'),
  body('farmerRating')
    .notEmpty()
    .withMessage('Farmer rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Farmer rating must be an integer between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 3, max: 1000 })
    .withMessage('Comment must be between 3 and 1000 characters'),
  handleValidationErrors,
];

module.exports = {
  validateCreateReview,
};
