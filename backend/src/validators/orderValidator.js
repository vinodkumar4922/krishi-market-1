const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./validationHelper');

const validateCreateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isFloat({ min: 1 })
    .withMessage('Item quantity must be at least 1'),
  body('deliveryAddress.fullName')
    .trim()
    .notEmpty()
    .withMessage('Recipient full name is required'),
  body('deliveryAddress.phone')
    .trim()
    .notEmpty()
    .withMessage('Delivery contact phone is required')
    .matches(/^[0-9+-\s]{8,20}$/)
    .withMessage('Valid phone number format required'),
  body('deliveryAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('deliveryAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('deliveryAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('deliveryAddress.pincode')
    .trim()
    .notEmpty()
    .withMessage('Postal code / pincode is required')
    .matches(/^[0-9A-Za-z\s-]{4,10}$/)
    .withMessage('Valid postal code format required'),
  body('deliveryDate')
    .trim()
    .notEmpty()
    .withMessage('Delivery date is required'),
  body('deliverySlot')
    .trim()
    .notEmpty()
    .withMessage('Delivery slot selection is required'),
  handleValidationErrors,
];

const validateUpdateOrderStatus = [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID format'),
  body('status')
    .isIn([
      'PLACED',
      'CONFIRMED',
      'PREPARING',
      'READY_FOR_DELIVERY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ])
    .withMessage('Invalid order status'),
  handleValidationErrors,
];

module.exports = {
  validateCreateOrder,
  validateUpdateOrderStatus,
};
