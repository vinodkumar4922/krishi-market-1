const Product = require('../models/Product');
const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');

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
      query.isOrganic = isOrganic === 'true';
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

    if (availability) {
      query.availabilityStatus = availability;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { 'rating.average': -1 };
    else if (sort === 'harvest') sortOption = { harvestDate: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('farmer', 'farmLocation farmingMethod verificationStatus rating user experienceYears')
      .populate({
        path: 'farmer',
        populate: { path: 'user', select: 'name phone email' },
      })
      .populate('category', 'name slug icon')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('farmer', 'farmLocation farmingMethod verificationStatus rating user')
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

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer')
      .populate({
        path: 'farmer',
        populate: { path: 'user', select: 'name email phone' },
      })
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

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
        message: 'Your account is pending verification. Only approved farmers can list products.',
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
    } = req.body;

    const product = new Product({
      farmer: farmer._id,
      category,
      name,
      description,
      price: Number(price),
      unit: unit || 'kg',
      quantity: Number(quantity),
      minOrderQuantity: Number(minOrderQuantity) || 1,
      harvestDate,
      farmingMethod: farmingMethod || farmer.farmingMethod,
      isOrganic: isOrganic !== undefined ? isOrganic : farmer.farmingMethod === 'ORGANIC',
      images: images || [],
      location: {
        district: farmer.farmLocation.district,
        state: farmer.farmLocation.state,
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

    return res.status(201).json({ success: true, message: 'Product published', data: product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) return res.status(403).json({ success: false, message: 'Farmer profile not found.' });

    // Object-level authorization check: Farmer A cannot modify Farmer B's product
    if (product.farmer.toString() !== farmer._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify another farmer’s product.',
      });
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
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

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

    return res.status(200).json({ success: true, message: 'Product updated', data: product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const farmer = await Farmer.findOne({ user: req.user._id });
    if (product.farmer.toString() !== farmer._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete another farmer’s product.',
      });
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

    return res.status(200).json({ success: true, message: 'Product deactivated' });
  } catch (error) {
    next(error);
  }
};

const getFarmerProducts = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found' });

    const products = await Product.find({ farmer: farmer._id }).populate('category', 'name').sort({ createdAt: -1 });
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
