const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const DeliverySlot = require('../models/DeliverySlot');
const Farmer = require('../models/Farmer');

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

/**
 * Authoritative Server-Side Cart Validation & Financials Calculation
 */
const validateCart = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    let subtotal = 0;
    const validatedItems = [];
    const issues = [];
    let isValid = true;

    for (const item of items) {
      if (!item.productId) {
        isValid = false;
        issues.push({ productId: null, type: 'INVALID_ITEM', message: 'Missing product ID.' });
        continue;
      }

      const product = await Product.findById(item.productId).populate('farmer');
      if (!product || !product.isActive) {
        isValid = false;
        issues.push({
          productId: item.productId,
          type: 'UNAVAILABLE',
          message: `Product is no longer active or available.`,
        });
        continue;
      }

      if (!product.farmer || product.farmer.verificationStatus !== 'APPROVED') {
        isValid = false;
        issues.push({
          productId: item.productId,
          type: 'FARMER_UNAPPROVED',
          message: `Producer is not yet approved to list harvest products.`,
        });
        continue;
      }

      const requestedQty = Number(item.quantity);
      if (requestedQty <= 0 || !Number.isInteger(requestedQty)) {
        isValid = false;
        issues.push({
          productId: item.productId,
          type: 'INVALID_QUANTITY',
          message: `Quantity must be a positive integer.`,
        });
        continue;
      }

      let effectiveQty = requestedQty;
      if (product.quantity < requestedQty) {
        isValid = false;
        effectiveQty = product.quantity;
        issues.push({
          productId: item.productId,
          type: 'INSUFFICIENT_STOCK',
          message: `Only ${product.quantity} ${product.unit} available for "${product.name}".`,
          availableQuantity: product.quantity,
        });
      }

      if (item.price && Number(item.price) !== product.price) {
        issues.push({
          productId: item.productId,
          type: 'PRICE_CHANGED',
          message: `Price for "${product.name}" updated from ₹${item.price} to ₹${product.price}.`,
          oldPrice: item.price,
          newPrice: product.price,
        });
      }

      const itemTotal = product.price * effectiveQty;
      subtotal += itemTotal;

      validatedItems.push({
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          images: product.images,
          quantity: product.quantity,
          isOrganic: product.isOrganic,
          farmer: {
            _id: product.farmer._id,
            farmName: product.farmer.farmName,
            farmLocation: product.farmer.farmLocation,
            farmingMethod: product.farmer.farmingMethod,
          },
        },
        quantity: effectiveQty,
        itemTotal,
      });
    }

    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const total = subtotal + deliveryFee;

    return res.status(200).json({
      success: true,
      data: {
        isValid,
        issues,
        items: validatedItems,
        subtotal,
        deliveryFee,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Order with Authoritative Calculation, Slot Validation & Atomic Inventory Deduction
 */
const createOrder = async (req, res, next) => {
  try {
    const { items, deliveryAddress, deliveryDate, deliverySlot } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
    }

    if (!deliveryAddress || !deliveryDate || !deliverySlot) {
      return res.status(400).json({ success: false, message: 'Delivery details are mandatory.' });
    }

    // Validate delivery address fields
    const { fullName, phone, street, city, state, pincode } = deliveryAddress;
    if (!fullName || !phone || !street || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'Complete delivery address is required.' });
    }

    // Step 0: Validate Delivery Slot Availability & Prevent Overbooking
    const slotDoc = await DeliverySlot.findOne({ slotName: deliverySlot, isActive: true });
    if (slotDoc) {
      const activeBookings = await Order.countDocuments({
        deliveryDate,
        deliverySlot,
        status: { $ne: 'CANCELLED' },
      });
      if (activeBookings >= slotDoc.maxCapacity) {
        return res.status(400).json({
          success: false,
          message: `Delivery slot "${deliverySlot}" is fully booked for ${deliveryDate}. Please choose an alternative slot.`,
        });
      }
    }

    // Step 1: Server-Side Authoritative Recalculation & Producer Verification
    let subtotal = 0;
    const authoritativeItems = [];
    const farmersSet = new Set();

    for (const item of items) {
      if (!item.productId || !item.quantity || Number(item.quantity) <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid product or quantity specified.' });
      }

      // Fetch fresh authoritative product from database with farmer
      const product = await Product.findById(item.productId).populate('farmer');
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.name || item.productId}" is currently unavailable.`,
        });
      }

      // Enforce farmer approval
      if (!product.farmer || product.farmer.verificationStatus !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" belongs to an unapproved producer.`,
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
      farmersSet.add(product.farmer._id.toString());

      authoritativeItems.push({
        product: product._id,
        farmer: product.farmer._id,
        name: product.name,
        unit: product.unit,
        price: product.price, // Authoritative price from DB
        quantity: requestedQty,
        itemTotal,
      });
    }

    // Step 2: Atomic Stock Decrement with Concurrency Guard & Rollback Capability
    const successfullyDecremented = [];
    for (const item of authoritativeItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback already deducted items if concurrency race occurred
        for (const prev of successfullyDecremented) {
          await Product.findByIdAndUpdate(prev.product, { $inc: { quantity: prev.quantity } });
        }
        return res.status(409).json({
          success: false,
          message: `Stock for "${item.name}" changed simultaneously. Please review cart and retry.`,
        });
      }

      successfullyDecremented.push(item);

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
      details: { orderNumber, total, itemsCount: authoritativeItems.length, farmersCount: farmersSet.size },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Create In-App Notification for Consumer
    await Notification.create({
      recipient: req.user._id,
      title: 'Order Confirmed!',
      message: `Your order #${orderNumber} for ₹${total} has been placed successfully.`,
      type: 'ORDER',
      link: `/consumer/orders/${order._id}`,
    });

    // Notify each involved Farmer
    for (const farmerId of farmersSet) {
      const fDoc = await Farmer.findById(farmerId);
      if (fDoc && fDoc.user) {
        await Notification.create({
          recipient: fDoc.user,
          title: 'New Harvest Order Received!',
          message: `Order #${orderNumber} contains produce from your farm. Please review and prepare items.`,
          type: 'ORDER',
          link: `/farmer/orders/${order._id}`,
        });
      }
    }

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
      .populate('items.farmer', 'farmLocation farmName rating')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getFarmerOrders = async (req, res, next) => {
  try {
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

    // Role-based state transition authorization
    if (req.user.role === 'FARMER') {
      const farmerDoc = await Farmer.findOne({ user: req.user._id });
      if (!farmerDoc || !order.farmersInvolved.map((f) => f.toString()).includes(farmerDoc._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to update an order that does not belong to your harvest.',
        });
      }

      if (['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) && status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: 'Orders cannot be cancelled once out for delivery or delivered.',
        });
      }
    }

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

    // Restore inventory atomically if order is cancelled
    if (status === 'CANCELLED') {
      for (const item of order.items) {
        const prod = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: item.quantity } },
          { new: true }
        );
        if (prod && prod.availabilityStatus === 'OUT_OF_STOCK' && prod.quantity > 0) {
          prod.availabilityStatus = prod.quantity <= 5 ? 'LOW_STOCK' : 'IN_STOCK';
          await prod.save();
        }
      }
    }

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

/**
 * Consumer Controlled Cancellation Prior to Preparation
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Check ownership
    const isOwner = order.consumer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this order.' });
    }

    if (!['PLACED', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in "${order.status}" status. Cancellation is only permitted prior to preparation.`,
      });
    }

    order.status = 'CANCELLED';
    order.statusHistory.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      comment: reason ? `Consumer cancelled: ${reason}` : 'Cancelled by consumer',
    });
    await order.save();

    // Restore inventory atomically
    for (const item of order.items) {
      const prod = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } },
        { new: true }
      );
      if (prod && prod.availabilityStatus === 'OUT_OF_STOCK' && prod.quantity > 0) {
        prod.availabilityStatus = prod.quantity <= 5 ? 'LOW_STOCK' : 'IN_STOCK';
        await prod.save();
      }
    }

    // Notify Consumer
    await Notification.create({
      recipient: order.consumer,
      title: 'Order Cancelled',
      message: `Your order #${order.orderNumber} has been successfully cancelled. Stock has been restored.`,
      type: 'ORDER',
      link: `/consumer/orders/${order._id}`,
    });

    // Notify involved Farmers
    for (const farmerId of order.farmersInvolved) {
      const fDoc = await Farmer.findById(farmerId);
      if (fDoc && fDoc.user) {
        await Notification.create({
          recipient: fDoc.user,
          title: 'Order Cancelled by Customer',
          message: `Order #${order.orderNumber} was cancelled by the customer. Reserved inventory has been restored.`,
          type: 'ORDER',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and inventory restored.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate Professional Order Invoice / Summary
 */
const getOrderInvoice = async (req, res, next) => {
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
      const farmer = await Farmer.findOne({ user: req.user._id });
      if (farmer && order.farmersInvolved.map((f) => f.toString()).includes(farmer._id.toString())) {
        isFarmerInvolved = true;
      }
    }

    if (!isOwner && !isAdmin && !isFarmerInvolved) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorization to view this invoice.',
      });
    }

    const invoice = {
      invoiceNumber: `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      consumer: {
        name: order.consumer.name,
        email: order.consumer.email,
        phone: order.consumer.phone,
      },
      deliveryAddress: order.deliveryAddress,
      deliverySlot: order.deliverySlot,
      deliveryDate: order.deliveryDate,
      status: order.status,
      items: order.items.map((it) => ({
        productName: it.name,
        farmerName: it.farmer?.user?.name || 'Local Farmer',
        farmLocation: it.farmer?.farmLocation?.district || 'Regional',
        unit: it.unit,
        quantity: it.quantity,
        unitPrice: it.price,
        itemTotal: it.itemTotal,
      })),
      financials: {
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        platformCommission: order.platformCommission,
        total: order.total,
      },
      generatedAt: new Date().toISOString(),
    };

    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCart,
  createOrder,
  getConsumerOrders,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderInvoice,
};
