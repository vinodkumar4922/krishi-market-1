const mongoose = require('mongoose');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Dispute = require('../models/Dispute');
const AuditLog = require('../models/AuditLog');
const { connectDB, disconnectDB } = require('./db');

const seedFullDemoData = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    console.log('🌾 Starting comprehensive realistic demo dataset seeding...');

    // 1. Admin (Support both .demo and .org domain aliases)
    const adminEmails = ['admin@krishimarket.demo', 'admin@krishimarket.org'];
    let admin = null;
    for (const email of adminEmails) {
      let a = await User.findOne({ email });
      if (!a) {
        a = await User.create({
          name: 'Krishi Market SuperAdmin',
          email,
          phone: '+91 9876543210',
          passwordHash: 'Admin@123456',
          role: 'ADMIN',
          accountStatus: 'ACTIVE',
        });
      }
      if (!admin) admin = a;
    }

    // 2. Categories
    const categoryData = [
      { name: 'Vegetables', icon: 'Carrot', description: 'Fresh farm harvested vegetables' },
      { name: 'Fruits', icon: 'Apple', description: 'Naturally ripened seasonal orchard fruits' },
      { name: 'Dairy', icon: 'Milk', description: 'Pure A2 farm fresh dairy products' },
      { name: 'Grains', icon: 'Wheat', description: 'Unpolished heritage grains & millets' },
      { name: 'Pulses', icon: 'CircleDot', description: 'High protein unpolished pulses' },
      { name: 'Organic Produce', icon: 'Sprout', description: '100% chemical free certified organic' },
      { name: 'Leafy Vegetables', icon: 'Salad', description: 'Greens harvested daily' },
      { name: 'Exotic Herbs', icon: 'Flame', description: 'Seasonal herbs (Inactive)', isActive: false },
    ];

    const categoryMap = {};
    for (const cat of categoryData) {
      let existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        existing = await Category.create(cat);
      }
      categoryMap[cat.name] = existing._id;
    }

    // 3. Farmers (5 required realistic profiles)
    const farmersSeed = [
      {
        name: 'Ramesh Patil',
        email: 'ramesh.patil@krishimarket.demo',
        phone: '+91 9845012345',
        location: { address: 'Post Tikota, Farm 14', district: 'Vijayapura', state: 'Karnataka', pincode: '586130' },
        farmingMethod: 'ORGANIC',
        status: 'APPROVED',
        crops: ['Grapes', 'Pomegranate', 'Red Onions', 'Jowar'],
        acres: 12,
        exp: 15,
        rating: 4.9,
        reviewsCount: 32,
      },
      {
        name: 'Ramesh Patel',
        email: 'ramesh.farmer@krishi.org',
        phone: '+91 9845012346',
        location: { address: 'Green Valley Farm', district: 'Vijayapura', state: 'Karnataka', pincode: '586130' },
        farmingMethod: 'ORGANIC',
        status: 'APPROVED',
        crops: ['Grapes', 'Pomegranate', 'Tomatoes'],
        acres: 10,
        exp: 12,
        rating: 4.9,
        reviewsCount: 20,
      },
      {
        name: 'Ramesh Patil',
        email: 'ramesh.patil@farmer.demo',
        phone: '+91 9845012347',
        location: { address: 'Farm Zone 2', district: 'Vijayapura', state: 'Karnataka', pincode: '586130' },
        farmingMethod: 'ORGANIC',
        status: 'APPROVED',
        crops: ['Organic Grapes', 'Pomegranate'],
        acres: 8,
        exp: 10,
        rating: 4.8,
        reviewsCount: 15,
      },
      {
        name: 'Suresh Gowda',
        email: 'suresh.gowda@krishimarket.demo',
        phone: '+91 9845123456',
        location: { address: 'Doddaballapur Road', district: 'Bengaluru Rural', state: 'Karnataka', pincode: '561203' },
        farmingMethod: 'CONVENTIONAL',
        status: 'APPROVED',
        crops: ['Carrots', 'Cabbage', 'Tomatoes', 'Capsicum'],
        acres: 6,
        exp: 9,
        rating: 4.6,
        reviewsCount: 18,
      },
      {
        name: 'Mahesh Biradar',
        email: 'mahesh.biradar@krishimarket.demo',
        phone: '+91 9845234567',
        location: { address: 'Bilagi Taluk', district: 'Bagalkot', state: 'Karnataka', pincode: '587116' },
        farmingMethod: 'ORGANIC',
        status: 'APPROVED',
        crops: ['Toor Dal', 'Groundnut', 'Sunflower', 'Cow Milk'],
        acres: 10,
        exp: 14,
        rating: 4.8,
        reviewsCount: 22,
      },
      {
        name: 'Lakshmi Devi',
        email: 'lakshmi.devi@krishimarket.demo',
        phone: '+91 9845345678',
        location: { address: 'Saptapur Farm Zone', district: 'Dharwad', state: 'Karnataka', pincode: '580001' },
        farmingMethod: 'ORGANIC',
        status: 'APPROVED',
        crops: ['Spinach', 'Fenugreek', 'Coriander', 'Buffalo Ghee'],
        acres: 4,
        exp: 8,
        rating: 5.0,
        reviewsCount: 41,
      },
      {
        name: 'Basavaraj Jangam',
        email: 'basavaraj.jangam@krishimarket.demo',
        phone: '+91 9845456789',
        location: { address: 'Chikodi Road', district: 'Belagavi', state: 'Karnataka', pincode: '591201' },
        farmingMethod: 'CONVENTIONAL',
        status: 'PENDING', // Demonstrated PENDING verification
        crops: ['Sugarcane', 'Sweet Corn', 'Green Chilli'],
        acres: 15,
        exp: 20,
        rating: 0,
        reviewsCount: 0,
      },
    ];

    const farmerDocs = [];
    for (const f of farmersSeed) {
      let u = await User.findOne({ email: f.email });
      if (!u) {
        u = await User.create({
          name: f.name,
          email: f.email,
          phone: f.phone,
          passwordHash: 'Farmer@123456',
          role: 'FARMER',
          accountStatus: 'ACTIVE',
        });
      }

      let farmerDoc = await Farmer.findOne({ user: u._id });
      if (!farmerDoc) {
        farmerDoc = await Farmer.create({
          user: u._id,
          farmLocation: f.location,
          cropTypes: f.crops,
          farmingMethod: f.farmingMethod,
          verificationStatus: f.status,
          verificationDate: f.status === 'APPROVED' ? new Date() : null,
          verifiedBy: f.status === 'APPROVED' ? admin._id : null,
          farmSizeAcres: f.acres,
          experienceYears: f.exp,
          rating: { average: f.rating, count: f.reviewsCount },
          bio: `Dedicated grower cultivating premium farm crops with sustainable agriculture methods in ${f.location.district}.`,
        });
      }
      farmerDocs.push(farmerDoc);
    }

    // 4. Consumers
    const consumersSeed = [
      { name: 'Anita Sharma', email: 'consumer1@krishimarket.demo', phone: '+91 9880011223' },
      { name: 'Anita Sharma', email: 'anita.consumer@gmail.com', phone: '+91 9880011224' },
      { name: 'Anita Sharma', email: 'anita.sharma@consumer.demo', phone: '+91 9880011225' },
      { name: 'Vikram Joshi', email: 'consumer2@krishimarket.demo', phone: '+91 9880022334' },
      { name: 'Meera Nambiar', email: 'consumer3@krishimarket.demo', phone: '+91 9880033445' },
    ];

    const consumerDocs = [];
    for (const c of consumersSeed) {
      let u = await User.findOne({ email: c.email });
      if (!u) {
        u = await User.create({
          name: c.name,
          email: c.email,
          phone: c.phone,
          passwordHash: 'Consumer@123456',
          role: 'CONSUMER',
          accountStatus: 'ACTIVE',
        });
      }
      consumerDocs.push(u);
    }

    // 5. Products (22 realistic agricultural listings across categories & stock states)
    const approvedFarmers = farmerDocs.filter((f) => f.verificationStatus === 'APPROVED');
    const f0 = approvedFarmers[0]; // Ramesh Patil (Vijayapura)
    const f1 = approvedFarmers[1]; // Suresh Gowda (Bengaluru Rural)
    const f2 = approvedFarmers[2]; // Mahesh Biradar (Bagalkot)
    const f3 = approvedFarmers[3]; // Lakshmi Devi (Dharwad)

    const productCatalog = [
      // Vegetables
      { name: 'Organic Red Onions', category: categoryMap['Vegetables'], price: 35, unit: 'kg', quantity: 250, farmer: f0, method: 'ORGANIC', organic: true, featured: true, rating: 4.8 },
      { name: 'Vine Ripe Country Tomatoes', category: categoryMap['Vegetables'], price: 28, unit: 'kg', quantity: 180, farmer: f1, method: 'CONVENTIONAL', organic: false, featured: true, rating: 4.6 },
      { name: 'Fresh Farm Potatoes', category: categoryMap['Vegetables'], price: 30, unit: 'kg', quantity: 300, farmer: f1, method: 'CONVENTIONAL', organic: false, featured: false, rating: 4.5 },
      { name: 'Ooty Hybrid Carrots', category: categoryMap['Vegetables'], price: 45, unit: 'kg', quantity: 85, farmer: f1, method: 'CONVENTIONAL', organic: false, featured: true, rating: 4.7 },
      { name: 'Spicy Green Chillies', category: categoryMap['Vegetables'], price: 60, unit: 'kg', quantity: 4, farmer: f1, method: 'CONVENTIONAL', organic: false, featured: false, rating: 4.4 }, // Demonstrates LOW STOCK (4 kg)
      { name: 'Purple Country Brinjal', category: categoryMap['Vegetables'], price: 32, unit: 'kg', quantity: 0, farmer: f1, method: 'CONVENTIONAL', organic: false, featured: false, rating: 4.3 }, // Demonstrates OUT OF STOCK (0 kg)
      { name: 'Crisp Green Cabbage', category: categoryMap['Vegetables'], price: 25, unit: 'kg', quantity: 70, farmer: f1, method: 'CONVENTIONAL', organic: false, featured: false, rating: 4.5 },

      // Leafy Greens
      { name: 'Farm Fresh Palak (Spinach)', category: categoryMap['Leafy Vegetables'], price: 20, unit: 'bunch', quantity: 95, farmer: f3, method: 'ORGANIC', organic: true, featured: true, rating: 4.9 },
      { name: 'Fresh Methi (Fenugreek)', category: categoryMap['Leafy Vegetables'], price: 22, unit: 'bunch', quantity: 60, farmer: f3, method: 'ORGANIC', organic: true, featured: false, rating: 4.8 },
      { name: 'Aromatic Coriander Bunch', category: categoryMap['Leafy Vegetables'], price: 15, unit: 'bunch', quantity: 80, farmer: f3, method: 'ORGANIC', organic: true, featured: false, rating: 4.9 },

      // Fruits
      { name: 'Organic Royal Pomegranate', category: categoryMap['Fruits'], price: 140, unit: 'kg', quantity: 120, farmer: f0, method: 'ORGANIC', organic: true, featured: true, rating: 5.0 },
      { name: 'Sweet Yelakki Bananas', category: categoryMap['Fruits'], price: 65, unit: 'dozen', quantity: 45, farmer: f0, method: 'ORGANIC', organic: true, featured: true, rating: 4.9 },
      { name: 'Fresh Pink Guava', category: categoryMap['Fruits'], price: 70, unit: 'kg', quantity: 3, farmer: f0, method: 'ORGANIC', organic: true, featured: false, rating: 4.7 }, // Demonstrates LOW STOCK
      { name: 'Alphonso Mangoes (Seasonal)', category: categoryMap['Fruits'], price: 450, unit: 'dozen', quantity: 60, farmer: f0, method: 'ORGANIC', organic: true, featured: true, rating: 5.0 },

      // Dairy
      { name: 'A2 Gir Cow Fresh Raw Milk', category: categoryMap['Dairy'], price: 75, unit: 'litre', quantity: 50, farmer: f2, method: 'ORGANIC', organic: true, featured: true, rating: 4.9 },
      { name: 'Traditional Desi Buffalo Bilona Ghee', category: categoryMap['Dairy'], price: 850, unit: 'litre', quantity: 25, farmer: f3, method: 'ORGANIC', organic: true, featured: true, rating: 5.0 },
      { name: 'Pure Farm Thick Curd', category: categoryMap['Dairy'], price: 45, unit: 'packet', quantity: 40, farmer: f2, method: 'ORGANIC', organic: true, featured: false, rating: 4.8 },

      // Grains & Pulses
      { name: 'Stone Ground Sharbati Wheat', category: categoryMap['Grains'], price: 55, unit: 'kg', quantity: 500, farmer: f2, method: 'ORGANIC', organic: true, featured: false, rating: 4.8 },
      { name: 'Organic Sona Masoori Unpolished Rice', category: categoryMap['Grains'], price: 85, unit: 'kg', quantity: 400, farmer: f2, method: 'ORGANIC', organic: true, featured: true, rating: 4.9 },
      { name: 'Heritage Malkhedi Jowar (Sorghum)', category: categoryMap['Grains'], price: 48, unit: 'kg', quantity: 220, farmer: f0, method: 'ORGANIC', organic: true, featured: false, rating: 4.7 },
      { name: 'Unpolished Organic Toor Dal', category: categoryMap['Pulses'], price: 165, unit: 'kg', quantity: 150, farmer: f2, method: 'ORGANIC', organic: true, featured: true, rating: 4.9 },
      { name: 'Roasted Desi Groundnuts', category: categoryMap['Pulses'], price: 130, unit: 'kg', quantity: 90, farmer: f2, method: 'ORGANIC', organic: true, featured: false, rating: 4.6 },
    ];

    const productDocs = [];
    for (const p of productCatalog) {
      let existing = await Product.findOne({ name: p.name });
      if (!existing) {
        existing = await Product.create({
          name: p.name,
          category: p.category,
          farmer: p.farmer._id,
          description: `Directly harvested from ${p.farmer.farmLocation.district}. Grown with certified ${p.method.toLowerCase()} techniques. Free from harmful chemicals and harvested at peak freshness.`,
          price: p.price,
          unit: p.unit,
          quantity: p.quantity,
          minOrderQuantity: 1,
          harvestDate: new Date(Date.now() - Math.floor(Math.random() * 5) * 86400000),
          farmingMethod: p.method,
          isOrganic: p.organic,
          isFeatured: p.featured,
          location: {
            district: p.farmer.farmLocation.district,
            state: p.farmer.farmLocation.state,
          },
          images: [
            `https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80`,
          ],
          rating: { average: p.rating, count: Math.floor(10 + Math.random() * 25) },
        });
      }
      productDocs.push(existing);
    }

    // 6. Orders across all major statuses
    const sampleOrderStatuses = [
      'DELIVERED',
      'DELIVERED',
      'OUT_FOR_DELIVERY',
      'READY_FOR_DELIVERY',
      'PREPARING',
      'CONFIRMED',
      'PLACED',
      'CANCELLED',
    ];

    let createdOrders = [];
    for (let i = 0; i < sampleOrderStatuses.length; i++) {
      const status = sampleOrderStatuses[i];
      const consumer = consumerDocs[i % consumerDocs.length];
      const prod1 = productDocs[i % productDocs.length];
      const prod2 = productDocs[(i + 3) % productDocs.length];

      const item1Total = prod1.price * 2;
      const item2Total = prod2.price * 1;
      const subtotal = item1Total + item2Total;
      const deliveryFee = 40;
      const total = subtotal + deliveryFee;

      const orderNumber = `KM-${1000 + i}-${Math.floor(100 + Math.random() * 900)}`;
      let existingOrder = await Order.findOne({ orderNumber });
      if (!existingOrder) {
        existingOrder = await Order.create({
          orderNumber,
          consumer: consumer._id,
          items: [
            {
              product: prod1._id,
              farmer: prod1.farmer,
              name: prod1.name,
              unit: prod1.unit,
              price: prod1.price,
              quantity: 2,
              itemTotal: item1Total,
            },
            {
              product: prod2._id,
              farmer: prod2.farmer,
              name: prod2.name,
              unit: prod2.unit,
              price: prod2.price,
              quantity: 1,
              itemTotal: item2Total,
            },
          ],
          subtotal,
          deliveryFee,
          total,
          deliveryAddress: {
            fullName: consumer.name,
            phone: consumer.phone,
            street: 'Flat 402, Sunshine Residency, Outer Ring Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560103',
          },
          deliveryDate: new Date().toISOString().split('T')[0],
          deliverySlot: '08:00 AM – 10:00 AM',
          status,
          statusHistory: [
            { status: 'PLACED', timestamp: new Date(Date.now() - 36000000) },
            { status, timestamp: new Date(), comment: `Order marked as ${status}` },
          ],
          farmersInvolved: [prod1.farmer, prod2.farmer],
        });
      }
      createdOrders.push(existingOrder);
    }

    // 7. Legitimate Verified Reviews on DELIVERED Orders
    const deliveredOrder = createdOrders.find((o) => o.status === 'DELIVERED');
    if (deliveredOrder) {
      const item = deliveredOrder.items[0];
      const existingReview = await Review.findOne({ order: deliveredOrder._id, product: item.product });
      if (!existingReview) {
        await Review.create({
          consumer: deliveredOrder.consumer,
          order: deliveredOrder._id,
          product: item.product,
          farmer: item.farmer,
          productRating: 5,
          farmerRating: 5,
          comment:
            'Exceptional freshness! Arrived straight from the farmer within 24 hours of harvest. Will definitely order again.',
        });
      }
    }

    // 8. Demo Dispute (Product Quality issue for inspection)
    const existingDispute = await Dispute.findOne({ reason: 'PRODUCT_QUALITY' });
    if (!existingDispute && deliveredOrder) {
      await Dispute.create({
        order: deliveredOrder._id,
        user: deliveredOrder.consumer,
        reason: 'PRODUCT_QUALITY',
        description: 'One bunch of greens had wilting leaves due to transit heat. Requesting partial credit.',
        status: 'OPEN',
      });
    }

    console.log('✅ Realistic Demo Dataset loaded successfully!');
  } catch (err) {
    console.error('❌ Demo seeding error:', err);
  }
};

if (require.main === module) {
  seedFullDemoData().then(() => disconnectDB().then(() => process.exit(0)));
}

module.exports = { seedFullDemoData };
