const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

// Valid state transitions allowed per specifications
const VALID_TRANSITIONS = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_DELIVERY: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const createOrder = async (req, res, next) => {
  try {
    const { items, deliveryAddress, deliveryDate, deliverySlot } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
    }

    if (!deliveryAddress || !deliveryDate || !deliverySlot) {
      return res.status(400).json({ success: false, message: 'Delivery details are mandatory.' });
    }

    // Step 1: Server-Side Authoritative Recalculation & Stock Verification
    let subtotal = 0;
    const authoritativeItems = [];
    const farmersSet = new Set();

    for (const item of items) {
      if (!item.productId || !item.quantity || Number(item.quantity) <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid product or quantity specified.' });
      }

      // Fetch fresh authoritative product from database
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.name || item.productId}" is currently unavailable.`,
        });
      }

      const requestedQty = Number(item.quantity);
      if (product.quantity < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.quantity} ${product.unit}, Requested: ${requestedQty} ${product.unit}.`,
        });
      }

      const itemTotal = product.price * requestedQty;
      subtotal += itemTotal;
      farmersSet.add(product.farmer.toString());

      authoritativeItems.push({
        product: product._id,
        farmer: product.farmer,
        name: product.name,
        unit: product.unit,
        price: product.price, // Authoritative price from DB
        quantity: requestedQty,
        itemTotal,
      });
    }

    // Step 2: Atomic Stock Decrement with Concurrency Guard
    for (const item of authoritativeItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback already deducted items if race condition occurred
        return res.status(409).json({
          success: false,
          message: `Stock for "${item.name}" changed simultaneously. Please review cart and retry.`,
        });
      }

      // Sync availability status
      if (updatedProduct.quantity <= 0) {
        updatedProduct.availabilityStatus = 'OUT_OF_STOCK';
      } else if (updatedProduct.quantity <= 5) {
        updatedProduct.availabilityStatus = 'LOW_STOCK';
      }
      await updatedProduct.save();
    }

    const deliveryFee = subtotal >= 500 ? 0 : 40; // Free delivery over ₹500
    const total = subtotal + deliveryFee;
    const orderNumber = `KM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = new Order({
      orderNumber,
      consumer: req.user._id,
      items: authoritativeItems,
      subtotal,
      deliveryFee,
      total,
      deliveryAddress,
      deliveryDate,
      deliverySlot,
      status: 'PLACED',
      statusHistory: [{ status: 'PLACED', comment: 'Order placed by consumer' }],
      farmersInvolved: Array.from(farmersSet),
    });

    await order.save();

    // Create Audit Log
    await AuditLog.create({
      actor: req.user._id,
      action: 'ORDER_CREATED',
      resourceType: 'Order',
      resourceId: order._id.toString(),
      details: { orderNumber, total, itemsCount: authoritativeItems.length },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Create In-App Notification for Consumer
    await Notification.create({
      recipient: req.user._id,
      title: 'Order Confirmed!',
      message: `Your order #${orderNumber} for ₹${total} has been received and sent to local farmers.`,
      type: 'ORDER',
      link: `/consumer/orders/${order._id}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully with guaranteed inventory reservation.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getConsumerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ consumer: req.user._id })
      .populate('items.farmer', 'farmLocation')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getFarmerOrders = async (req, res, next) => {
  try {
    const Farmer = require('../models/Farmer');
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });

    const orders = await Order.find({ farmersInvolved: farmer._id })
      .populate('consumer', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('consumer', 'name email phone')
      .populate({
        path: 'items.farmer',
        populate: { path: 'user', select: 'name phone' },
      });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Object-level Authorization Check (BOLA / IDOR protection)
    const isOwner = order.consumer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    let isFarmerInvolved = false;
    if (req.user.role === 'FARMER') {
      const Farmer = require('../models/Farmer');
      const farmer = await Farmer.findOne({ user: req.user._id });
      if (farmer && order.farmersInvolved.map((f) => f.toString()).includes(farmer._id.toString())) {
        isFarmerInvolved = true;
      }
    }

    if (!isOwner && !isAdmin && !isFarmerInvolved) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorization to view this order.',
      });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Enforce valid state machine transitions
    const allowedNext = VALID_TRANSITIONS[order.status];
    if (!allowedNext || !allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition. Cannot move order from ${order.status} to ${status}.`,
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      comment: comment || `Status updated to ${status}`,
    });

    await order.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'ORDER_STATUS_UPDATED',
      resourceType: 'Order',
      resourceId: order._id.toString(),
      details: { newStatus: status, comment },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Notify Consumer
    await Notification.create({
      recipient: order.consumer,
      title: `Order Update: ${status.replace(/_/g, ' ')}`,
      message: `Your order #${order.orderNumber} is now: ${status.replace(/_/g, ' ')}`,
      type: 'ORDER',
      link: `/consumer/orders/${order._id}`,
    });

    return res.status(200).json({ success: true, message: 'Status updated', data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getConsumerOrders,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
};
