const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./validationHelper');

const validateVerifyFarmer = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Farmer ID format'),
  body('status')
    .notEmpty()
    .withMessage('Verification status is required')
    .isIn(['APPROVED', 'REJECTED', 'PENDING'])
    .withMessage('Status must be APPROVED, REJECTED, or PENDING'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Verification notes cannot exceed 1000 characters'),
  handleValidationErrors,
];

module.exports = {
  validateVerifyFarmer,
};
