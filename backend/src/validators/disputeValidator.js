const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./validationHelper');

const validateCreateDispute = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid Order ID format'),
  body('reason')
    .notEmpty()
    .withMessage('Dispute reason is required')
    .isIn(['PRODUCT_QUALITY', 'QUANTITY_ISSUE', 'DELIVERY_ISSUE', 'OTHER'])
    .withMessage('Invalid dispute reason'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Dispute description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  handleValidationErrors,
];

const validateResolveDispute = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Dispute ID format'),
  body('status')
    .notEmpty()
    .withMessage('Dispute resolution status is required')
    .isIn(['UNDER_REVIEW', 'RESOLVED', 'CLOSED'])
    .withMessage('Invalid resolution status'),
  body('resolutionNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Resolution notes cannot exceed 2000 characters'),
  handleValidationErrors,
];

module.exports = {
  validateCreateDispute,
  validateResolveDispute,
};
