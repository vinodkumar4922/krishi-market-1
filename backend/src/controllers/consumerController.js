const Wishlist = require('../models/Wishlist');
const Notification = require('../models/Notification');
const Product = require('../models/Product');

const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ consumer: req.user._id }).populate({
      path: 'products',
      populate: { path: 'farmer', select: 'farmLocation farmingMethod rating' },
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ consumer: req.user._id, products: [] });
    }

    return res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ consumer: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({ consumer: req.user._id, products: [productId] });
    } else {
      const index = wishlist.products.map((id) => id.toString()).indexOf(productId.toString());
      if (index > -1) {
        wishlist.products.splice(index, 1);
      } else {
        wishlist.products.push(productId);
      }
    }

    await wishlist.save();
    return res.status(200).json({ success: true, message: 'Wishlist updated', data: wishlist });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    let wishlist = await Wishlist.findOne({ consumer: req.user._id });

    if (wishlist) {
      wishlist.products = wishlist.products.filter((id) => id.toString() !== productId.toString());
      await wishlist.save();
    }

    return res.status(200).json({ success: true, message: 'Item removed from wishlist', data: wishlist });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(30),
      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ]);

    return res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const markSingleNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
  getNotifications,
  markNotificationRead,
  markSingleNotificationRead,
};
