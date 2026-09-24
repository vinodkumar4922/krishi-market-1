const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: [true, 'Farmer reference is required'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [120, 'Product name cannot exceed 120 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be greater than 0'],
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      enum: ['kg', 'g', 'bunch', 'dozen', 'litre', 'packet'],
      default: 'kg',
    },
    quantity: {
      type: Number,
      required: [true, 'Inventory quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: [1, 'Minimum order quantity must be at least 1'],
    },
    harvestDate: {
      type: Date,
      required: [true, 'Harvest date is required'],
    },
    farmingMethod: {
      type: String,
      enum: ['ORGANIC', 'NATURAL', 'CONVENTIONAL', 'HYDROPONIC', 'PERMACULTURE'],
      default: 'ORGANIC',
      index: true,
    },
    isOrganic: {
      type: Boolean,
      default: true,
      index: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      district: { type: String, required: true, trim: true, index: true },
      state: { type: String, required: true, trim: true, index: true },
    },
    availabilityStatus: {
      type: String,
      enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'UNAVAILABLE'],
      default: 'IN_STOCK',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Dynamic stock status synchronization hook
productSchema.pre('save', function (next) {
  if (this.quantity <= 0) {
    this.availabilityStatus = 'OUT_OF_STOCK';
  } else if (this.quantity <= 5) {
    this.availabilityStatus = 'LOW_STOCK';
  } else {
    this.availabilityStatus = 'IN_STOCK';
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
