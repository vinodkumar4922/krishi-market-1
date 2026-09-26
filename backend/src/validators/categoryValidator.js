const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./validationHelper');

const validateCreateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('icon')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Icon cannot be empty'),
  handleValidationErrors,
];

const validateUpdateCategory = [
  param('id')
    .isMongoId()
    .withMessage('Invalid category ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  handleValidationErrors,
];

module.exports = {
  validateCreateCategory,
  validateUpdateCategory,
};
