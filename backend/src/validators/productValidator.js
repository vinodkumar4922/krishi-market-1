const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./validationHelper');

const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Product name must be between 2 and 120 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid Category ID format'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Description must be between 5 and 2000 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ gt: 0 })
    .withMessage('Price must be greater than 0'),
  body('unit')
    .notEmpty()
    .withMessage('Unit of measurement is required')
    .isIn(['kg', 'g', 'bunch', 'dozen', 'litre', 'packet'])
    .withMessage('Unit must be one of: kg, g, bunch, dozen, litre, packet'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isFloat({ min: 0 })
    .withMessage('Quantity cannot be negative'),
  body('minOrderQuantity')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Minimum order quantity must be at least 1'),
  body('harvestDate')
    .notEmpty()
    .withMessage('Harvest date is required'),
  body('farmingMethod')
    .optional()
    .isIn(['ORGANIC', 'NATURAL', 'CONVENTIONAL', 'HYDROPONIC', 'PERMACULTURE'])
    .withMessage('Invalid farming method specified'),
  body('isOrganic')
    .optional()
    .isBoolean()
    .withMessage('isOrganic must be a boolean value'),
  handleValidationErrors,
];

const validateUpdateProduct = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Product name must be between 2 and 120 characters'),
  body('price')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Price must be greater than 0'),
  body('quantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quantity cannot be negative'),
  body('unit')
    .optional()
    .isIn(['kg', 'g', 'bunch', 'dozen', 'litre', 'packet'])
    .withMessage('Invalid unit of measurement'),
  handleValidationErrors,
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
};
