const Product = require('../models/Product');
const Farmer = require('../models/Farmer');
const Order = require('../models/Order');

/**
 * Middleware: Requires the authenticated user to be an APPROVED farmer.
 * Blocks PENDING and REJECTED farmers from creating or listing products.
 */
const requireApprovedFarmer = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'FARMER') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access restricted to registered farmers.',
      });
    }

    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(403).json({
        success: false,
        message: 'Farmer profile not found for this account.',
      });
    }

    if (farmer.verificationStatus !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: 'Account pending verification. Only approved farmers can list products.',
        verificationStatus: farmer.verificationStatus,
      });
    }

    req.farmer = farmer;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Ensures the authenticated farmer owns the product being modified/deleted,
 * or the authenticated user is an ADMIN.
 */
const requireProductOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Admins bypass ownership check
    if (req.user.role === 'ADMIN') {
      req.product = product;
      return next();
    }

    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer || product.farmer.toString() !== farmer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify another farmer’s product.',
      });
    }

    req.farmer = farmer;
    req.product = product;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Ensures the authenticated consumer owns the order,
 * or the farmer is involved in the order, or user is ADMIN.
 */
const requireOrderAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (req.user.role === 'ADMIN') {
      req.order = order;
      return next();
    }

    if (req.user.role === 'CONSUMER') {
      if (order.consumer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot access another consumer’s order.',
        });
      }
      req.order = order;
      return next();
    }

    if (req.user.role === 'FARMER') {
      const farmer = await Farmer.findOne({ user: req.user._id });
      if (!farmer || !order.farmersInvolved.some((f) => f.toString() === farmer._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have access to this order.',
        });
      }
      req.farmer = farmer;
      req.order = order;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access denied.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireApprovedFarmer,
  requireProductOwnership,
  requireOrderAccess,
};
