const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    farmLocation: {
      address: { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    cropTypes: [
      {
        type: String,
        trim: true,
      },
    ],
    farmingMethod: {
      type: String,
      enum: ['ORGANIC', 'NATURAL', 'CONVENTIONAL', 'HYDROPONIC', 'PERMACULTURE'],
      default: 'ORGANIC',
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    verificationNotes: {
      type: String,
      default: '',
    },
    verificationDate: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    experienceYears: {
      type: Number,
      default: 1,
      min: 0,
    },
    farmSizeAcres: {
      type: Number,
      default: 1,
      min: 0.1,
    },
    bio: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    farmName: {
      type: String,
      trim: true,
      default: '',
    },
    profileImage: {
      type: String,
      trim: true,
      default: '',
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

module.exports = mongoose.model('Farmer', farmerSchema);
