const Dispute = require('../models/Dispute');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const createDispute = async (req, res, next) => {
  try {
    const { orderId, reason, description } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.consumer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only raise disputes for orders you placed.',
      });
    }

    const dispute = new Dispute({
      order: orderId,
      user: req.user._id,
      reason,
      description,
      status: 'OPEN',
    });

    await dispute.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'DISPUTE_CREATED',
      resourceType: 'Dispute',
      resourceId: dispute._id.toString(),
      details: { orderId, reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, message: 'Dispute raised successfully', data: dispute });
  } catch (error) {
    next(error);
  }
};

const getUserDisputes = async (req, res, next) => {
  try {
    const disputes = await Dispute.find({ user: req.user._id }).populate('order').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    next(error);
  }
};

const getAllDisputesAdmin = async (req, res, next) => {
  try {
    const disputes = await Dispute.find()
      .populate('user', 'name email phone')
      .populate('order')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    next(error);
  }
};

const resolveDisputeAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    const dispute = await Dispute.findById(id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    dispute.status = status;
    dispute.resolutionNotes = resolutionNotes;
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'DISPUTE_RESOLVED',
      resourceType: 'Dispute',
      resourceId: dispute._id.toString(),
      details: { status, resolutionNotes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await Notification.create({
      recipient: dispute.user,
      title: `Dispute ${status}`,
      message: `Your dispute resolution: ${resolutionNotes}`,
      type: 'DISPUTE',
    });

    return res.status(200).json({ success: true, message: 'Dispute updated', data: dispute });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDispute,
  getUserDisputes,
  getAllDisputesAdmin,
  resolveDisputeAdmin,
};
