const Product = require('../models/Product');
const Farmer = require('../models/Farmer');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');

/**
 * Get products with backend search, filtering, sorting, and pagination
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      farmingMethod,
      isOrganic,
      minPrice,
      maxPrice,
      district,
      state,
      farmerId,
      availability,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.district': { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (farmingMethod) {
      query.farmingMethod = farmingMethod;
    }

    if (isOrganic !== undefined) {
      query.isOrganic = isOrganic === 'true' || isOrganic === true;
    }

    if (farmerId) {
      query.farmer = farmerId;
    }

    if (district) {
      query['location.district'] = { $regex: district, $options: 'i' };
    }

    if (state) {
      query['location.state'] = { $regex: state, $options: 'i' };
    }

    if (availability && availability !== 'ALL') {
      query.availabilityStatus = availability;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc' || sort === 'price_low') sortOption = { price: 1 };
    else if (sort === 'price_desc' || sort === 'price_high') sortOption = { price: -1 };
    else if (sort === 'rating' || sort === 'highest_rated') sortOption = { 'rating.average': -1, 'rating.count': -1 };
    else if (sort === 'popular' || sort === 'most_popular') sortOption = { 'rating.count': -1, 'rating.average': -1 };
    else if (sort === 'harvest' || sort === 'recently_harvested') sortOption = { harvestDate: -1 };

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('farmer', 'farmLocation farmName profileImage farmingMethod verificationStatus rating user experienceYears')
      .populate({
        path: 'farmer',
        populate: { path: 'user', select: 'name' }, // Strictly sanitize: never expose farmer email/phone to public
      })
      .populate('category', 'name slug icon')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured products for landing & showcase
 */
const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('farmer', 'farmLocation farmName farmingMethod verificationStatus rating user')
      .populate({
        path: 'farmer',
        populate: { path: 'user', select: 'name' },
      })
      .populate('category', 'name')
      .limit(8);

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID with full transparency & farmer details
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'farmLocation farmName profileImage farmingMethod verificationStatus rating user experienceYears bio')
      .populate({
        path: 'farmer',
        populate: { path: 'user', select: 'name createdAt' }, // Sanitized: name and joined date only
      })
      .populate('category', 'name slug');

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or inactive' });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new product listing (Only APPROVED farmers)
 */
const createProduct = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(403).json({ success: false, message: 'Farmer profile not found.' });
    }

    // Specification: Only APPROVED farmers can publish products
    if (farmer.verificationStatus !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: 'Account pending verification. Only approved farmers can list products.',
        verificationStatus: farmer.verificationStatus,
      });
    }

    const {
      name,
      category,
      description,
      price,
      unit,
      quantity,
      minOrderQuantity,
      harvestDate,
      farmingMethod,
      isOrganic,
      images,
      isFeatured,
    } = req.body;

    // Validate Category existence
    const categoryDoc = await Category.findOne({ _id: category, isActive: true });
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive category selected.',
      });
    }

    const productMethod = farmingMethod || farmer.farmingMethod || 'ORGANIC';
    const computedOrganic = isOrganic !== undefined ? Boolean(isOrganic) : productMethod === 'ORGANIC';

    const product = new Product({
      farmer: farmer._id,
      category: categoryDoc._id,
      name,
      description,
      price: Number(price),
      unit: unit || 'kg',
      quantity: Number(quantity),
      minOrderQuantity: Number(minOrderQuantity) || 1,
      harvestDate: harvestDate ? new Date(harvestDate) : new Date(),
      farmingMethod: productMethod,
      isOrganic: computedOrganic,
      images: Array.isArray(images) && images.length > 0 ? images : [],
      isFeatured: Boolean(isFeatured),
      location: {
        district: farmer.farmLocation?.district || 'Regional',
        state: farmer.farmLocation?.state || 'Regional',
      },
    });

    await product.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'PRODUCT_CREATED',
      resourceType: 'Product',
      resourceId: product._id.toString(),
      details: { name: product.name, price: product.price, quantity: product.quantity },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, message: 'Product published successfully', data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product (Farmer owner or Admin moderation)
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Object-level authorization check: Farmer A cannot modify Farmer B's product
    if (req.user.role !== 'ADMIN') {
      const farmer = await Farmer.findOne({ user: req.user._id });
      if (!farmer || product.farmer.toString() !== farmer._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to modify another farmer’s product.',
        });
      }
    }

    const allowedUpdates = [
      'name',
      'description',
      'price',
      'unit',
      'quantity',
      'minOrderQuantity',
      'harvestDate',
      'farmingMethod',
      'isOrganic',
      'images',
      'isActive',
      'isFeatured',
      'availabilityStatus',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'price' || field === 'quantity' || field === 'minOrderQuantity') {
          product[field] = Number(req.body[field]);
        } else {
          product[field] = req.body[field];
        }
      }
    });

    // Synchronize stock availability automatically
    if (product.quantity <= 0) {
      product.availabilityStatus = 'OUT_OF_STOCK';
    } else if (product.quantity <= 5) {
      product.availabilityStatus = 'LOW_STOCK';
    } else if (product.availabilityStatus === 'OUT_OF_STOCK' || product.availabilityStatus === 'LOW_STOCK') {
      product.availabilityStatus = 'IN_STOCK';
    }

    await product.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'PRODUCT_UPDATED',
      resourceType: 'Product',
      resourceId: product._id.toString(),
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate / Delete product (Farmer owner or Admin moderation)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (req.user.role !== 'ADMIN') {
      const farmer = await Farmer.findOne({ user: req.user._id });
      if (!farmer || product.farmer.toString() !== farmer._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to delete another farmer’s product.',
        });
      }
    }

    // Soft delete to preserve order history and referential integrity
    product.isActive = false;
    product.availabilityStatus = 'UNAVAILABLE';
    await product.save();

    await AuditLog.create({
      actor: req.user._id,
      action: 'PRODUCT_DELETED',
      resourceType: 'Product',
      resourceId: product._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({ success: true, message: 'Product deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products listed by the authenticated farmer
 */
const getFarmerProducts = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });

    const products = await Product.find({ farmer: farmer._id, isActive: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFarmerProducts,
};
