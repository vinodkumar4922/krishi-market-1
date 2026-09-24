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
      const index = wishlist.products.indexOf(productId);
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

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({ success: true, data: notifications });
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

module.exports = {
  getWishlist,
  toggleWishlist,
  getNotifications,
  markNotificationRead,
};
