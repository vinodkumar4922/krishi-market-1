const Farmer = require('../models/Farmer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Public Farmer Profile
 * Displays: Name, Verified badge, Farm location, Farming method, Crop types, Description, Products, Ratings, Reviews, Joined date.
 * Never exposes private phone numbers or email addresses to the general public.
 */
const getFarmerProfile = async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.params.id)
      .populate('user', 'name createdAt')
      .populate('verifiedBy', 'name');

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found.' });
    }

    // Active public products
    const products = await Product.find({
      farmer: farmer._id,
      isActive: true,
      availabilityStatus: { $ne: 'UNAVAILABLE' },
    }).populate('category', 'name slug');

    // Recent reviews for this farmer
    const reviews = await Review.find({ farmer: farmer._id })
      .populate('consumer', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: {
        farmer,
        products,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List Approved Farmers with filters and search
 */
const getFarmersList = async (req, res, next) => {
  try {
    const { district, state, farmingMethod, search } = req.query;
    const query = { verificationStatus: 'APPROVED' };

    if (district) query['farmLocation.district'] = { $regex: district, $options: 'i' };
    if (state) query['farmLocation.state'] = { $regex: state, $options: 'i' };
    if (farmingMethod) query.farmingMethod = farmingMethod;

    let farmers = await Farmer.find(query)
      .populate('user', 'name createdAt')
      .sort({ 'rating.average': -1, createdAt: -1 });

    if (search) {
      const term = search.toLowerCase();
      farmers = farmers.filter(
        (f) =>
          f.user?.name?.toLowerCase().includes(term) ||
          f.farmName?.toLowerCase().includes(term) ||
          f.farmLocation?.district?.toLowerCase().includes(term) ||
          f.cropTypes?.some((c) => c.toLowerCase().includes(term))
      );
    }

    return res.status(200).json({ success: true, data: farmers });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated farmer's profile
 */
const updateFarmerProfile = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found.' });
    }

    const {
      farmName,
      bio,
      farmLocation,
      cropTypes,
      farmingMethod,
      experienceYears,
      farmSizeAcres,
      profileImage,
    } = req.body;

    if (farmName !== undefined) farmer.farmName = farmName;
    if (bio !== undefined) farmer.bio = bio;
    if (farmingMethod !== undefined) farmer.farmingMethod = farmingMethod;
    if (experienceYears !== undefined) farmer.experienceYears = Number(experienceYears);
    if (farmSizeAcres !== undefined) farmer.farmSizeAcres = Number(farmSizeAcres);
    if (profileImage !== undefined) farmer.profileImage = profileImage;

    if (cropTypes && Array.isArray(cropTypes)) {
      farmer.cropTypes = cropTypes;
    }

    if (farmLocation && typeof farmLocation === 'object') {
      farmer.farmLocation = {
        ...farmer.farmLocation.toObject(),
        ...farmLocation,
      };
    }

    await farmer.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'FARMER_PROFILE_UPDATED',
      resourceType: 'Farmer',
      resourceId: farmer._id.toString(),
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      message: 'Farmer profile updated successfully.',
      data: farmer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Farmer Dashboard Telemetry & KPI aggregation
 */
const getFarmerDashboardStats = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found.' });

    const totalProducts = await Product.countDocuments({ farmer: farmer._id, isActive: true });
    const lowStockCount = await Product.countDocuments({
      farmer: farmer._id,
      isActive: true,
      quantity: { $gt: 0, $lte: 5 },
    });
    const outOfStockCount = await Product.countDocuments({
      farmer: farmer._id,
      isActive: true,
      quantity: 0,
    });

    // Orders involving this farmer
    const orders = await Order.find({ farmersInvolved: farmer._id }).sort({ createdAt: -1 });

    const activeOrders = orders.filter((o) =>
      ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'].includes(o.status)
    );
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

    // Revenue realized directly by this farmer without APMC intermediary markups
    let totalSales = 0;
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.farmer.toString() === farmer._id.toString()) {
          totalSales += item.itemTotal;
        }
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        farmer,
        metrics: {
          totalProducts,
          lowStockCount,
          outOfStockCount,
          totalOrders: orders.length,
          activeOrdersCount: activeOrders.length,
          completedOrdersCount: completedOrders.length,
          totalSalesRevenue: totalSales,
          totalSales: totalSales,
        },
        recentOrders: orders.slice(0, 8),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFarmerProfile,
  getFarmersList,
  updateFarmerProfile,
  getFarmerDashboardStats,
};
