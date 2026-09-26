const Product = require('../models/Product');
const Farmer = require('../models/Farmer');
const Category = require('../models/Category');

/**
 * Global Search endpoint querying products, farmers, and categories concurrently
 */
const globalSearch = async (req, res, next) => {
  try {
    const { q = '', limit = 10 } = req.query;
    const query = String(q).trim();

    if (!query) {
      return res.status(200).json({
        success: true,
        data: {
          products: [],
          farmers: [],
          categories: [],
          totalResults: 0,
        },
      });
    }

    const regex = { $regex: query, $options: 'i' };
    const limitNum = Math.min(25, Number(limit) || 10);

    const [products, categories, farmersRaw] = await Promise.all([
      // 1. Search Active Products
      Product.find({
        isActive: true,
        $or: [{ name: regex }, { description: regex }, { 'location.district': regex }],
      })
        .populate('farmer', 'farmLocation farmName rating verificationStatus')
        .populate('category', 'name slug')
        .limit(limitNum),

      // 2. Search Active Categories
      Category.find({
        isActive: true,
        $or: [{ name: regex }, { description: regex }],
      }).limit(5),

      // 3. Search Approved Farmers
      Farmer.find({
        verificationStatus: 'APPROVED',
        $or: [
          { farmName: regex },
          { 'farmLocation.district': regex },
          { 'farmLocation.state': regex },
          { cropTypes: regex },
          { bio: regex },
        ],
      })
        .populate('user', 'name')
        .limit(limitNum),
    ]);

    // Also check if farmer user name matched
    const userMatchedFarmers = await Farmer.find({ verificationStatus: 'APPROVED' })
      .populate({
        path: 'user',
        match: { name: regex },
        select: 'name',
      })
      .limit(limitNum);

    const validUserMatched = userMatchedFarmers.filter((f) => f.user !== null);

    // Merge and deduplicate farmers by ID
    const farmerMap = new Map();
    [...farmersRaw, ...validUserMatched].forEach((f) => {
      farmerMap.set(f._id.toString(), f);
    });
    const uniqueFarmers = Array.from(farmerMap.values()).slice(0, limitNum);

    const totalResults = products.length + categories.length + uniqueFarmers.length;

    return res.status(200).json({
      success: true,
      data: {
        products,
        farmers: uniqueFarmers,
        categories,
        totalResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch,
};
