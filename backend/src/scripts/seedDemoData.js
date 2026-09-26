const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const DeliverySlot = require('../models/DeliverySlot');
const Review = require('../models/Review');
const Dispute = require('../models/Dispute');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { REQUIRED_SLOTS } = require('../controllers/deliverySlotController');

const isReset = process.argv.includes('--reset');

const seedDemoData = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('⛔ FATAL: Demo seed script blocked in production environment!');
    process.exit(1);
  }

  console.log('🌾 Initializing Krishi Market Demo Seed Script...');
  await connectDB();

  if (isReset) {
    console.log('🧹 Purging existing demo collections safely...');
    await Promise.all([
      User.deleteMany({ email: { $regex: /@.*\.demo$/ } }),
      Farmer.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      DeliverySlot.deleteMany({}),
      Review.deleteMany({}),
      Dispute.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('✨ Purge completed.');
  }

  const defaultPassword = 'DemoPassword123!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  // 1. Seed Admin
  console.log('1. Seeding Demo Admin...');
  let admin = await User.findOne({ email: 'admin@krishimarket.demo' });
  if (!admin) {
    admin = await User.create({
      name: 'Krishi Market Admin',
      email: 'admin@krishimarket.demo',
      phone: '+91 9900000001',
      passwordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
    });
  }

  // 2. Seed Delivery Slots
  console.log('2. Seeding Delivery Slots...');
  for (const s of REQUIRED_SLOTS) {
    await DeliverySlot.findOneAndUpdate({ slotName: s.slotName }, s, { upsert: true, new: true });
  }

  // 3. Seed Standard Categories
  console.log('3. Seeding Categories...');
  const categoryDefs = [
    { name: 'Vegetables', slug: 'vegetables', icon: 'Carrot', description: 'Fresh farm-picked greens and vegetables' },
    { name: 'Fruits', slug: 'fruits', icon: 'Apple', description: 'Orchard-grown seasonal and exotic fruits' },
    { name: 'Dairy', slug: 'dairy', icon: 'Milk', description: 'Fresh milk, butter, ghee and curd from local dairies' },
    { name: 'Grains', slug: 'grains', icon: 'Wheat', description: 'Staple crops, unpolished rice and organic millets' },
    { name: 'Pulses', slug: 'pulses', icon: 'CircleDot', description: 'Protein-packed regional lentils and beans' },
    { name: 'Organic Produce', slug: 'organic-produce', icon: 'Sprout', description: '100% Certified organic harvested produce' },
    { name: 'Leafy Vegetables', slug: 'leafy-vegetables', icon: 'Leaf', description: 'Crisp green leaves rich in vitamins' },
  ];

  const catMap = {};
  for (const c of categoryDefs) {
    const catDoc = await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
    catMap[c.name] = catDoc;
  }

  // 4. Seed Farmers
  console.log('4. Seeding Demo Farmers...');
  const farmerDefs = [
    {
      name: 'Ramesh Patil',
      email: 'ramesh.patil@farmer.demo',
      phone: '+91 9845000001',
      farmName: 'Patil Organic Agro Farms',
      farmLocation: { address: 'Plot 14, Indi Road', district: 'Vijayapura', state: 'Karnataka', pincode: '586101' },
      cropTypes: ['Onion', 'Tomato', 'Jowar', 'Pomegranate'],
      farmingMethod: 'ORGANIC',
      status: 'APPROVED',
      bio: 'Pioneer of organic dryland farming in North Karnataka with 15+ years of pure vermicompost experience.',
    },
    {
      name: 'Suresh Gowda',
      email: 'suresh.gowda@farmer.demo',
      phone: '+91 9845000002',
      farmName: 'Gowda Natural Plantation',
      farmLocation: { address: 'Survey 48, Devanahalli', district: 'Bengaluru Rural', state: 'Karnataka', pincode: '562110' },
      cropTypes: ['Carrot', 'Potato', 'Cow Milk', 'Cabbage'],
      farmingMethod: 'CONVENTIONAL',
      status: 'APPROVED',
      bio: 'Supplying fresh perishables and dairy to Greater Bengaluru daily with zero cold-storage holding.',
    },
    {
      name: 'Mahesh Biradar',
      email: 'mahesh.biradar@farmer.demo',
      phone: '+91 9845000003',
      farmName: 'Biradar Organic Groves',
      farmLocation: { address: 'Krishna River Basin', district: 'Bagalkot', state: 'Karnataka', pincode: '587101' },
      cropTypes: ['Banana', 'Guava', 'Wheat', 'Toor Dal'],
      farmingMethod: 'ORGANIC',
      status: 'APPROVED',
      bio: 'Award-winning sustainable farmer utilizing solar-drip irrigation for heritage bananas and pulses.',
    },
    {
      name: 'Lakshmi Devi',
      email: 'lakshmi.devi@farmer.demo',
      phone: '+91 9845000004',
      farmName: 'Devi Agro & Dairy Cooperative',
      farmLocation: { address: 'Malaprabha Valley', district: 'Dharwad', state: 'Karnataka', pincode: '580001' },
      cropTypes: ['Mango', 'Buffalo Milk', 'Ghee', 'Spinach'],
      farmingMethod: 'ORGANIC',
      status: 'APPROVED',
      bio: 'Leading a 30-woman farmer collective harvesting sweet Alphonso mangoes and artisanal A2 bilona ghee.',
    },
    {
      name: 'Basavaraj Jangam',
      email: 'basavaraj.jangam@farmer.demo',
      phone: '+91 9845000005',
      farmName: 'Jangam Vegetable Fields',
      farmLocation: { address: 'Ghataprabha Sector', district: 'Belagavi', state: 'Karnataka', pincode: '590001' },
      cropTypes: ['Green Chilli', 'Brinjal', 'Groundnut'],
      farmingMethod: 'CONVENTIONAL',
      status: 'PENDING',
      bio: 'Multi-generational horticulture grower in Belagavi awaiting field soil test verification.',
    },
    {
      name: 'Shivanand Kulkarni',
      email: 'shivanand.k@farmer.demo',
      phone: '+91 9845000006',
      farmName: 'Kulkarni Agri Venture',
      farmLocation: { address: 'Sedam Road', district: 'Kalaburagi', state: 'Karnataka', pincode: '585101' },
      cropTypes: ['Toor Dal'],
      farmingMethod: 'CONVENTIONAL',
      status: 'REJECTED',
      bio: 'Rejected application due to non-verifiable land title documentation.',
    },
  ];

  const farmerMap = {};
  for (const f of farmerDefs) {
    let user = await User.findOne({ email: f.email });
    if (!user) {
      user = await User.create({
        name: f.name,
        email: f.email,
        phone: f.phone,
        passwordHash,
        role: 'FARMER',
        accountStatus: 'ACTIVE',
      });
    }

    const farmer = await Farmer.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        farmName: f.farmName,
        farmLocation: f.farmLocation,
        cropTypes: f.cropTypes,
        farmingMethod: f.farmingMethod,
        farmDescription: f.bio,
        verificationStatus: f.status,
        verificationNotes: f.status === 'APPROVED' ? 'Field inspection certified' : f.status === 'REJECTED' ? 'Incomplete land registry papers' : '',
        rating: { average: 4.8, count: 12 },
      },
      { upsert: true, new: true }
    );
    farmerMap[f.name] = { user, farmer };
  }

  // 5. Seed Consumers
  console.log('5. Seeding Demo Consumers...');
  const consumerDefs = [
    { name: 'Anita Sharma', email: 'anita.sharma@consumer.demo', phone: '+91 9880011223' },
    { name: 'Vikram Rao', email: 'vikram.rao@consumer.demo', phone: '+91 9880011224' },
    { name: 'Priya Nair', email: 'priya.nair@consumer.demo', phone: '+91 9880011225' },
  ];

  const consumers = [];
  for (const c of consumerDefs) {
    let u = await User.findOne({ email: c.email });
    if (!u) {
      u = await User.create({
        name: c.name,
        email: c.email,
        phone: c.phone,
        passwordHash,
        role: 'CONSUMER',
        accountStatus: 'ACTIVE',
      });
    }
    consumers.push(u);
  }

  // 6. Seed 22+ Realistic Products Across 4 Inventory States
  console.log('6. Seeding Products & Realistic Inventory...');
  const productDefs = [
    // Ramesh Patil (Vijayapura - Organic)
    {
      name: 'Organic Country Tomatoes',
      farmer: farmerMap['Ramesh Patil'].farmer._id,
      category: catMap['Vegetables']._id,
      price: 38,
      unit: 'kg',
      quantity: 45, // IN_STOCK
      isOrganic: true,
      description: 'Naturally vine-ripened, tangy and rich in lycopene. Grown without synthetic pesticides.',
      images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Vijayapura', state: 'Karnataka' },
      isFeatured: true,
    },
    {
      name: 'Vijayapura Red Onions',
      farmer: farmerMap['Ramesh Patil'].farmer._id,
      category: catMap['Vegetables']._id,
      price: 45,
      unit: 'kg',
      quantity: 60, // IN_STOCK
      isOrganic: true,
      description: 'Dryland pungent red onions with excellent shelf life and crisp texture.',
      images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Vijayapura', state: 'Karnataka' },
      isFeatured: false,
    },
    {
      name: 'Organic Shalu Jowar (Sorghum)',
      farmer: farmerMap['Ramesh Patil'].farmer._id,
      category: catMap['Grains']._id,
      price: 65,
      unit: 'kg',
      quantity: 4, // LOW_STOCK
      isOrganic: true,
      description: 'Heritage white sorghum grain, high fiber, gluten-free, ground fresh for soft jowar rotis.',
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Vijayapura', state: 'Karnataka' },
      isFeatured: true,
    },
    {
      name: 'Organic Bhagawa Pomegranate',
      farmer: farmerMap['Ramesh Patil'].farmer._id,
      category: catMap['Fruits']._id,
      price: 180,
      unit: 'kg',
      quantity: 0, // OUT_OF_STOCK
      isOrganic: true,
      description: 'Ruby red arils packed with sweet antioxidant-rich juice.',
      images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Vijayapura', state: 'Karnataka' },
      isFeatured: false,
    },

    // Suresh Gowda (Bengaluru Rural - Conventional)
    {
      name: 'Ooty Carrots',
      farmer: farmerMap['Suresh Gowda'].farmer._id,
      category: catMap['Vegetables']._id,
      price: 55,
      unit: 'kg',
      quantity: 35, // IN_STOCK
      isOrganic: false,
      description: 'Sweet, vibrant orange crunchy carrots harvested in the morning mist.',
      images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Bengaluru Rural', state: 'Karnataka' },
      isFeatured: true,
    },
    {
      name: 'Baby Potatoes',
      farmer: farmerMap['Suresh Gowda'].farmer._id,
      category: catMap['Vegetables']._id,
      price: 40,
      unit: 'kg',
      quantity: 50, // IN_STOCK
      isOrganic: false,
      description: 'Tender baby potatoes perfect for roasting, curries, and dum aloo.',
      images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Bengaluru Rural', state: 'Karnataka' },
      isFeatured: false,
    },
    {
      name: 'Pure Desi Cow Milk (A2)',
      farmer: farmerMap['Suresh Gowda'].farmer._id,
      category: catMap['Dairy']._id,
      price: 75,
      unit: 'litre',
      quantity: 20, // IN_STOCK
      isOrganic: false,
      description: 'Raw chilled whole milk from free-grazing Hallikar cows. Delivered unpasteurized within 4 hours.',
      images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Bengaluru Rural', state: 'Karnataka' },
      isFeatured: true,
    },
    {
      name: 'Green Cabbage',
      farmer: farmerMap['Suresh Gowda'].farmer._id,
      category: catMap['Vegetables']._id,
      price: 30,
      unit: 'kg',
      quantity: 3, // LOW_STOCK
      isOrganic: false,
      description: 'Compact, crisp leaves ideal for salads and stir fries.',
      images: ['https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Bengaluru Rural', state: 'Karnataka' },
      isFeatured: false,
    },

    // Mahesh Biradar (Bagalkot - Organic)
    {
      name: 'Yellaki Bananas',
      farmer: farmerMap['Mahesh Biradar'].farmer._id,
      category: catMap['Fruits']._id,
      price: 60,
      unit: 'dozen',
      quantity: 25, // IN_STOCK
      isOrganic: true,
      description: 'Aromatic small table bananas with thin skin and naturally honey-sweet pulp.',
      images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Bagalkot', state: 'Karnataka' },
      isFeatured: true,
    },
    {
      name: 'Taiwan White Guava',
      farmer: farmerMap['Mahesh Biradar'].farmer._id,
      category: catMap['Fruits']._id,
      price: 90,
      unit: 'kg',
      quantity: 15, // IN_STOCK
      isOrganic: true,
      description: 'Crunchy white flesh with minimal seeds and citrusy sweetness.',
      images: ['https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Bagalkot', state: 'Karnataka' },
      isFeatured: false,
    },
    {
      name: 'Unpolished Bansi Wheat',
      farmer: farmerMap['Mahesh Biradar'].farmer._id,
      category: catMap['Grains']._id,
      price: 70,
      unit: 'kg',
      quantity: 50, // IN_STOCK
      isOrganic: true,
      description: 'Traditional golden bansi durum wheat with high gluten elasticity and nutty aroma.',
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Bagalkot', state: 'Karnataka' },
      isFeatured: false,
    },
    {
      name: 'GI-Tagged Organic Toor Dal',
      farmer: farmerMap['Mahesh Biradar'].farmer._id,
      category: catMap['Pulses']._id,
      price: 165,
      unit: 'kg',
      quantity: 2, // LOW_STOCK
      isOrganic: true,
      description: 'Unpolished pigeon peas from black cotton soil. Cooks into a thick, aromatic dal.',
      images: ['https://images.unsplash.com/photo-1585994192700-4e16104b5ea2?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Bagalkot', state: 'Karnataka' },
      isFeatured: true,
    },

    // Lakshmi Devi (Dharwad - Organic)
    {
      name: 'Alphonso Mangoes (Devgad Grafted)',
      farmer: farmerMap['Lakshmi Devi'].farmer._id,
      category: catMap['Fruits']._id,
      price: 450,
      unit: 'dozen',
      quantity: 30, // IN_STOCK
      isOrganic: true,
      description: 'Naturally carbide-free ripened king of mangoes. Unmatched saffron aroma and silky pulp.',
      images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Dharwad', state: 'Karnataka' },
      isFeatured: true,
    },
    {
      name: 'Traditional Cultured Cow Ghee (Bilona)',
      farmer: farmerMap['Lakshmi Devi'].farmer._id,
      category: catMap['Dairy']._id,
      price: 850,
      unit: 'litre',
      quantity: 12, // IN_STOCK
      isOrganic: true,
      description: 'Hand-churned from curd using wooden churners. Golden granular texture and divine fragrance.',
      images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Dharwad', state: 'Karnataka' },
      isFeatured: true,
    },
    {
      name: 'Fresh Farm Curd (Dahi)',
      farmer: farmerMap['Lakshmi Devi'].farmer._id,
      category: catMap['Dairy']._id,
      price: 50,
      unit: 'litre',
      quantity: 18, // IN_STOCK
      isOrganic: true,
      description: 'Thick, creamy probiotic dahi set naturally in earthen pots.',
      images: ['https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Dharwad', state: 'Karnataka' },
      isFeatured: false,
    },
    {
      name: 'Organic Palak (Spinach)',
      farmer: farmerMap['Lakshmi Devi'].farmer._id,
      category: catMap['Leafy Vegetables']._id,
      price: 25,
      unit: 'bunch',
      quantity: 40, // IN_STOCK
      isOrganic: true,
      description: 'Tender dark green spinach leaves harvested hours before delivery.',
      images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Dharwad', state: 'Karnataka' },
      isFeatured: false,
    },
    {
      name: 'Sona Masoori Raw Rice (Aged 1 Year)',
      farmer: farmerMap['Lakshmi Devi'].farmer._id,
      category: catMap['Grains']._id,
      price: 68,
      unit: 'kg',
      quantity: 0, // OUT_OF_STOCK
      isOrganic: true,
      description: 'Aged lightweight aromatic rice with low starch content.',
      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Dharwad', state: 'Karnataka' },
      isFeatured: false,
    },

    // Inactive / Moderated Demo Product
    {
      name: 'Experimental Hydroponic Strawberries',
      farmer: farmerMap['Suresh Gowda'].farmer._id,
      category: catMap['Fruits']._id,
      price: 220,
      unit: 'packet',
      quantity: 10,
      isOrganic: false,
      isActive: false, // UNAVAILABLE / DEACTIVATED by admin
      description: 'Pilot test crop pending admin organic lab certification.',
      images: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80'],
      location: { district: 'Bengaluru Rural', state: 'Karnataka' },
      isFeatured: false,
    },
  ];

  const seededProducts = [];
  for (const p of productDefs) {
    let avail = 'IN_STOCK';
    if (!p.isActive && p.isActive === false) avail = 'UNAVAILABLE';
    else if (p.quantity === 0) avail = 'OUT_OF_STOCK';
    else if (p.quantity <= 5) avail = 'LOW_STOCK';

    const prodDoc = await Product.findOneAndUpdate(
      { name: p.name, farmer: p.farmer },
      {
        ...p,
        harvestDate: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 5 + 1)),
        availabilityStatus: avail,
        rating: { average: 4.9, count: 8 },
      },
      { upsert: true, new: true }
    );
    seededProducts.push(prodDoc);
  }

  // 7. Seed Orders Covering All 7 Lifecycle States
  console.log('7. Seeding Real Orders & State Pipeline...');
  const orderStatuses = [
    'PLACED',
    'CONFIRMED',
    'PREPARING',
    'READY_FOR_DELIVERY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ];

  const seededOrders = [];
  let orderSeq = 101;

  for (const status of orderStatuses) {
    const consumer = consumers[orderSeq % consumers.length];
    const item1 = seededProducts[0]; // Tomatoes
    const item2 = seededProducts[4]; // Carrots
    const item3 = seededProducts[12]; // Mangoes

    const orderItems = [
      {
        product: item1._id,
        farmer: item1.farmer,
        name: item1.name,
        unit: item1.unit,
        price: item1.price,
        quantity: 2,
        itemTotal: item1.price * 2,
      },
      {
        product: item2._id,
        farmer: item2.farmer,
        name: item2.name,
        unit: item2.unit,
        price: item2.price,
        quantity: 1,
        itemTotal: item2.price * 1,
      },
    ];

    if (status === 'DELIVERED') {
      orderItems.push({
        product: item3._id,
        farmer: item3.farmer,
        name: item3.name,
        unit: item3.unit,
        price: item3.price,
        quantity: 1,
        itemTotal: item3.price * 1,
      });
    }

    const subtotal = orderItems.reduce((acc, it) => acc + it.itemTotal, 0);
    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const total = subtotal + deliveryFee;

    const farmersSet = Array.from(new Set(orderItems.map((it) => it.farmer.toString())));

    const history = [{ status: 'PLACED', timestamp: new Date(Date.now() - 3600000 * 24), comment: 'Order placed by consumer' }];
    if (status !== 'PLACED') {
      history.push({ status: 'CONFIRMED', timestamp: new Date(Date.now() - 3600000 * 20), comment: 'Farmer confirmed order' });
    }
    if (['PREPARING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      history.push({ status: 'PREPARING', timestamp: new Date(Date.now() - 3600000 * 15), comment: 'Harvest packed' });
    }
    if (['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      history.push({ status: 'READY_FOR_DELIVERY', timestamp: new Date(Date.now() - 3600000 * 8), comment: 'Handed to dispatch' });
    }
    if (['OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      history.push({ status: 'OUT_FOR_DELIVERY', timestamp: new Date(Date.now() - 3600000 * 4), comment: 'Out for delivery' });
    }
    if (status === 'DELIVERED') {
      history.push({ status: 'DELIVERED', timestamp: new Date(Date.now() - 3600000 * 1), comment: 'Delivered to customer' });
    }
    if (status === 'CANCELLED') {
      history.push({ status: 'CANCELLED', timestamp: new Date(Date.now() - 3600000 * 18), comment: 'Customer requested cancellation' });
    }

    const orderDoc = await Order.create({
      orderNumber: `KM-DEMO-${orderSeq++}`,
      consumer: consumer._id,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      deliveryAddress: {
        fullName: consumer.name,
        phone: consumer.phone,
        street: '12th Cross, 4th Main Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
      },
      deliveryDate: '2026-09-28',
      deliverySlot: REQUIRED_SLOTS[orderSeq % REQUIRED_SLOTS.length].slotName,
      status,
      statusHistory: history,
      farmersInvolved: farmersSet,
    });
    seededOrders.push(orderDoc);
  }

  // 8. Seed Verified Purchases Reviews (on DELIVERED order)
  console.log('8. Seeding Legitimate Verified Purchase Reviews...');
  const deliveredOrder = seededOrders.find((o) => o.status === 'DELIVERED');
  if (deliveredOrder) {
    const item1 = deliveredOrder.items[0];
    const item2 = deliveredOrder.items[1];

    await Review.findOneAndUpdate(
      { consumer: deliveredOrder.consumer, order: deliveredOrder._id, product: item1.product },
      {
        consumer: deliveredOrder.consumer,
        order: deliveredOrder._id,
        product: item1.product,
        farmer: item1.farmer,
        productRating: 5,
        farmerRating: 5,
        comment: 'Exceptional farm-fresh produce! Crispy texture and wonderful natural aroma. Arrived within 3 hours of harvest.',
      },
      { upsert: true }
    );

    await Review.findOneAndUpdate(
      { consumer: deliveredOrder.consumer, order: deliveredOrder._id, product: item2.product },
      {
        consumer: deliveredOrder.consumer,
        order: deliveredOrder._id,
        product: item2.product,
        farmer: item2.farmer,
        productRating: 4,
        farmerRating: 5,
        comment: 'Very good quality carrots, sweet and juicy. Packaging was completely biodegradable.',
      },
      { upsert: true }
    );
  }

  // 9. Seed Disputes (OPEN, UNDER_REVIEW, RESOLVED)
  console.log('9. Seeding Demo Disputes...');
  const disputeDefs = [
    {
      order: seededOrders[0]._id,
      user: seededOrders[0].consumer,
      reason: 'DELIVERY_ISSUE',
      description: 'Delivery vehicle arrived 30 minutes after scheduled 08:00–10:00 AM window.',
      status: 'OPEN',
    },
    {
      order: seededOrders[1]._id,
      user: seededOrders[1].consumer,
      reason: 'QUANTITY_ISSUE',
      description: 'One bunch of spinach was missing from the carton.',
      status: 'UNDER_REVIEW',
    },
    {
      order: seededOrders[5]._id,
      user: seededOrders[5].consumer,
      reason: 'PRODUCT_QUALITY',
      description: 'Two tomatoes were slightly bruised during transit.',
      status: 'RESOLVED',
      resolutionNotes: 'Immediate wallet credit of ₹40 issued by admin. Consumer satisfied.',
      resolvedBy: admin._id,
      resolvedAt: new Date(),
    },
  ];

  for (const d of disputeDefs) {
    await Dispute.create(d);
  }

  // 10. Seed Notifications & Audit Logs
  console.log('10. Seeding Notifications & Security Audit Records...');
  for (const c of consumers) {
    await Notification.create({
      recipient: c._id,
      title: 'Welcome to Krishi Market!',
      message: 'Your direct farmer-to-consumer farmgate connectivity account is now active.',
      type: 'SYSTEM',
    });
  }

  const auditEvents = [
    { actor: admin._id, action: 'FARMER_APPROVED', resourceType: 'Farmer', resourceId: farmerMap['Ramesh Patil'].farmer._id.toString(), details: { farmer: 'Ramesh Patil', notes: 'Inspection certified' } },
    { actor: admin._id, action: 'FARMER_REJECTED', resourceType: 'Farmer', resourceId: farmerMap['Shivanand Kulkarni'].farmer._id.toString(), details: { farmer: 'Shivanand Kulkarni', notes: 'Incomplete land papers' } },
    { actor: admin._id, action: 'DISPUTE_RESOLVED', resourceType: 'Dispute', resourceId: 'DISP-DEMO-01', details: { resolutionNotes: 'Credit approved' } },
    { actor: admin._id, action: 'LOGIN_FAILURE', resourceType: 'Auth', resourceId: 'SECURITY', details: { attemptedEmail: 'hacker@malicious.com', reason: 'Invalid credentials' }, ipAddress: '192.168.1.105' },
    { actor: admin._id, action: 'UNAUTHORIZED_ACCESS', resourceType: 'Auth', resourceId: 'API_GATEWAY', details: { path: '/api/admin/secrets', blockedRole: 'CONSUMER' }, ipAddress: '10.0.0.12' },
  ];

  for (const a of auditEvents) {
    await AuditLog.create(a);
  }

  console.log('==================================================');
  console.log('✅ Krishi Market Demo Dataset Successfully Seeded!');
  console.log('==================================================');
  console.log('Credentials:');
  console.log('👑 Admin:    admin@krishimarket.demo / DemoPassword123!');
  console.log('🌾 Farmer:   ramesh.patil@farmer.demo / DemoPassword123!');
  console.log('🛒 Consumer: anita.sharma@consumer.demo / DemoPassword123!');
  console.log('==================================================');

  if (require.main === module) {
    await mongoose.disconnect();
    process.exit(0);
  }
};

if (require.main === module) {
  seedDemoData().catch((err) => {
    console.error('Seed execution error:', err);
    process.exit(1);
  });
}

module.exports = { seedDemoData };
