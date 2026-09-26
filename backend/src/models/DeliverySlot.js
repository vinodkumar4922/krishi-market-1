const mongoose = require('mongoose');

const deliverySlotSchema = new mongoose.Schema(
  {
    slotName: {
      type: String,
      required: [true, 'Slot name is required'],
      unique: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm)'],
      trim: true,
    },
    maxCapacity: {
      type: Number,
      default: 50,
      min: [1, 'Maximum capacity must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DeliverySlot', deliverySlotSchema);
