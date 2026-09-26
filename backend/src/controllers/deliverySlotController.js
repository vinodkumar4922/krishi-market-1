const DeliverySlot = require('../models/DeliverySlot');
const Order = require('../models/Order');

const REQUIRED_SLOTS = [
  { slotName: '08:00–10:00', startTime: '08:00', endTime: '10:00', maxCapacity: 20 },
  { slotName: '10:00–12:00', startTime: '10:00', endTime: '12:00', maxCapacity: 20 },
  { slotName: '12:00–14:00', startTime: '12:00', endTime: '14:00', maxCapacity: 20 },
  { slotName: '16:00–18:00', startTime: '16:00', endTime: '18:00', maxCapacity: 20 },
  { slotName: '18:00–20:00', startTime: '18:00', endTime: '20:00', maxCapacity: 20 },
];

/**
 * Get all active delivery slots with capacity and availability for a specified date
 */
const getActiveDeliverySlots = async (req, res, next) => {
  try {
    const { date } = req.query;

    let slots = await DeliverySlot.find({ isActive: true }).sort({ startTime: 1 });

    // Seed or ensure the 5 exact required slots exist
    if (slots.length === 0) {
      slots = await DeliverySlot.insertMany(REQUIRED_SLOTS);
    } else {
      for (const reqSlot of REQUIRED_SLOTS) {
        const exists = slots.some((s) => s.slotName === reqSlot.slotName);
        if (!exists) {
          const created = await DeliverySlot.create(reqSlot);
          slots.push(created);
        }
      }
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    // If date is provided, calculate bookedCount and remainingCapacity
    const slotsWithCapacity = await Promise.all(
      slots.map(async (slot) => {
        let bookedCount = 0;
        if (date) {
          bookedCount = await Order.countDocuments({
            deliveryDate: date,
            deliverySlot: slot.slotName,
            status: { $ne: 'CANCELLED' },
          });
        }
        const remainingCapacity = Math.max(0, slot.maxCapacity - bookedCount);
        return {
          _id: slot._id,
          slotName: slot.slotName,
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxCapacity: slot.maxCapacity,
          bookedCount,
          remainingCapacity,
          isAvailable: remainingCapacity > 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: slotsWithCapacity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveDeliverySlots,
  REQUIRED_SLOTS,
};
