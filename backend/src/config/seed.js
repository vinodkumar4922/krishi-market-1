const mongoose = require('mongoose');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const { connectDB, disconnectDB } = require('./db');

const seedAdminAndData = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    console.log('🌱 Checking seed data...');

    // 1. Seed Admin User
    const adminEmail = 'admin@krishimarket.org';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Krishi Market SuperAdmin',
        email: adminEmail,
        phone: '+91 9876543210',
        passwordHash: 'Admin@123456',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
      });
      console.log('✅ Admin user created: admin@krishimarket.org / Admin@123456');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    // 2. Seed Verified Demo Farmer
    const farmerEmail = 'ramesh.farmer@krishi.org';
    let farmerUser = await User.findOne({ email: farmerEmail });
    if (!farmerUser) {
      farmerUser = await User.create({
        name: 'Ramesh Kumar Patel',
        email: farmerEmail,
        phone: '+91 9811223344',
        passwordHash: 'Farmer@123456',
        role: 'FARMER',
        accountStatus: 'ACTIVE',
      });

      await Farmer.create({
        user: farmerUser._id,
        farmLocation: {
          address: 'Plot 42, Green Valley Farm',
          district: 'Nashik',
          state: 'Maharashtra',
          pincode: '422003',
        },
        cropTypes: ['Organic Alphonso Mangoes', 'Red Onions', 'Fresh Spinach', 'Pomegranate'],
        farmingMethod: 'ORGANIC',
        verificationStatus: 'APPROVED',
        verificationDate: new Date(),
        verifiedBy: admin._id,
        experienceYears: 12,
        farmSizeAcres: 8.5,
        bio: 'Dedicated 3rd-generation natural organic farmer practicing soil regeneration and chemical-free horticulture.',
        rating: { average: 4.9, count: 18 },
      });
      console.log('✅ Approved Demo Farmer created: ramesh.farmer@krishi.org / Farmer@123456');
    }

    // 3. Seed Demo Consumer
    const consumerEmail = 'anita.consumer@gmail.com';
    let consumerUser = await User.findOne({ email: consumerEmail });
    if (!consumerUser) {
      consumerUser = await User.create({
        name: 'Anita Sharma',
        email: consumerEmail,
        phone: '+91 9899887766',
        passwordHash: 'Consumer@123456',
        role: 'CONSUMER',
        accountStatus: 'ACTIVE',
      });
      console.log('✅ Demo Consumer created: anita.consumer@gmail.com / Consumer@123456');
    }

    console.log('🌱 Seeding process complete!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
};

if (require.main === module) {
  seedAdminAndData().then(() => {
    disconnectDB().then(() => process.exit(0));
  });
}

module.exports = { seedAdminAndData };
