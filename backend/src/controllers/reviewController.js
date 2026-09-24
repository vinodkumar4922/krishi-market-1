const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');

const createReview = async (req, res, next) => {
  try {
    const { orderId, productId, productRating, farmerRating, comment } = req.body;

    if (!orderId || !productId || !productRating || !farmerRating || !comment) {
      return res.status(400).json({ success: false, message: 'All review fields are required.' });
    }

    // Step 1: Server-side purchase verification
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Verification 1: Order must belong to this consumer
    if (order.consumer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only review products from your own purchases.',
      });
    }

    // Verification 2: Order must be completed/DELIVERED
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted after your order has been successfully DELIVERED.',
      });
    }

    // Verification 3: Product must be part of this order
    const itemInOrder = order.items.find((item) => item.product.toString() === productId);
    if (!itemInOrder) {
      return res.status(400).json({
        success: false,
        message: 'This product was not purchased in the specified order.',
      });
    }

    // Verification 4: Duplicate review guard
    const existingReview = await Review.findOne({
      consumer: req.user._id,
      order: orderId,
      product: productId,
    });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a review for this product in this order.',
      });
    }

    const review = new Review({
      consumer: req.user._id,
      order: orderId,
      product: productId,
      farmer: itemInOrder.farmer,
      productRating: Number(productRating),
      farmerRating: Number(farmerRating),
      comment,
    });

    await review.save();

    // Recalculate and update Product rating
    const productReviews = await Review.find({ product: productId });
    const productAvg =
      productReviews.reduce((sum, r) => sum + r.productRating, 0) / productReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: { average: Number(productAvg.toFixed(1)), count: productReviews.length },
    });

    // Recalculate and update Farmer rating
    const farmerReviews = await Review.find({ farmer: itemInOrder.farmer });
    const farmerAvg =
      farmerReviews.reduce((sum, r) => sum + r.farmerRating, 0) / farmerReviews.length;
    await Farmer.findByIdAndUpdate(itemInOrder.farmer, {
      rating: { average: Number(farmerAvg.toFixed(1)), count: farmerReviews.length },
    });

    await AuditLog.create({
      actor: req.user._id,
      action: 'REVIEW_SUBMITTED',
      resourceType: 'Review',
      resourceId: review._id.toString(),
      details: { productRating, farmerRating },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'Review verified and posted successfully!',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('consumer', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

const getFarmerReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ farmer: req.params.farmerId })
      .populate('consumer', 'name')
      .populate('product', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getFarmerReviews,
};
