const Farmer = require('../models/Farmer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

const getFarmerProfile = async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.params.id)
      .populate('user', 'name phone email createdAt')
      .populate('verifiedBy', 'name');

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    const products = await Product.find({
      farmer: farmer._id,
      isActive: true,
      availabilityStatus: { $ne: 'UNAVAILABLE' },
    }).populate('category', 'name');

    return res.status(200).json({
      success: true,
      data: {
        farmer,
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getFarmersList = async (req, res, next) => {
  try {
    const { district, state, farmingMethod } = req.query;
    const query = { verificationStatus: 'APPROVED' };

    if (district) query['farmLocation.district'] = { $regex: district, $options: 'i' };
    if (state) query['farmLocation.state'] = { $regex: state, $options: 'i' };
    if (farmingMethod) query.farmingMethod = farmingMethod;

    const farmers = await Farmer.find(query).populate('user', 'name email').sort({ 'rating.average': -1 });
    return res.status(200).json({ success: true, data: farmers });
  } catch (error) {
    next(error);
  }
};

const getFarmerDashboardStats = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });

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

    // Orders that include items from this farmer
    const orders = await Order.find({ farmersInvolved: farmer._id }).sort({ createdAt: -1 });

    const activeOrders = orders.filter((o) =>
      ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'].includes(o.status)
    );
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

    // Calculate revenue realized directly by this farmer
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
        },
        recentOrders: orders.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFarmerProfile,
  getFarmersList,
  getFarmerDashboardStats,
};
