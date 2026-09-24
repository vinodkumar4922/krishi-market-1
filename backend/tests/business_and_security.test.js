const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Farmer = require('../src/models/Farmer');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Review = require('../src/models/Review');

let mongoServer;
let adminToken, farmerTokenA, farmerTokenB, consumerToken;
let farmerDocA, farmerDocB, productA, category;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Create Admin
  const adminRes = await request(app)
    .post('/api/auth/signup/consumer')
    .send({ name: 'Admin', email: 'adm@test.com', phone: '11111111', password: 'password123' });
  await User.findByIdAndUpdate(adminRes.body.data.user._id, { role: 'ADMIN' });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'adm@test.com', password: 'password123' });
  adminToken = adminLogin.body.data.accessToken;

  // 2. Create Category
  category = await Category.create({ name: 'Fresh Veggies', slug: 'fresh-veggies' });

  // 3. Create Farmer A & Farmer B
  const fARes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Farmer A',
    email: 'fa@test.com',
    phone: '22222222',
    password: 'password123',
    farmLocation: { address: 'Addr A', district: 'Nashik', state: 'MH', pincode: '422001' },
    cropTypes: ['Onions'],
    farmingMethod: 'ORGANIC',
  });
  farmerTokenA = fARes.body.data.accessToken;
  farmerDocA = fARes.body.data.farmer;

  // Approve Farmer A
  await Farmer.findByIdAndUpdate(farmerDocA._id, { verificationStatus: 'APPROVED' });

  const fBRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Farmer B',
    email: 'fb@test.com',
    phone: '33333333',
    password: 'password123',
    farmLocation: { address: 'Addr B', district: 'Pune', state: 'MH', pincode: '411001' },
    cropTypes: ['Tomatoes'],
    farmingMethod: 'ORGANIC',
  });
  farmerTokenB = fBRes.body.data.accessToken;
  farmerDocB = fBRes.body.data.farmer;
  await Farmer.findByIdAndUpdate(farmerDocB._id, { verificationStatus: 'APPROVED' });

  // 4. Create Consumer
  const consRes = await request(app).post('/api/auth/signup/consumer').send({
    name: 'Consumer 1',
    email: 'c1@test.com',
    phone: '44444444',
    password: 'password123',
  });
  consumerToken = consRes.body.data.accessToken;

  // 5. Create Product owned by Farmer A with 10 units
  const pRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${farmerTokenA}`)
    .send({
      name: 'Organic Red Onions',
      category: category._id,
      description: 'Sweet fresh red onions',
      price: 50,
      unit: 'kg',
      quantity: 10,
      harvestDate: new Date(),
    });
  productA = pRes.body.data;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Security & Business Logic Protections', () => {
  test('BOLA / IDOR: Farmer B cannot edit or delete Farmer A’s product', async () => {
    const editRes = await request(app)
      .put(`/api/products/${productA._id}`)
      .set('Authorization', `Bearer ${farmerTokenB}`)
      .send({ price: 20 });

    expect(editRes.statusCode).toBe(403);
    expect(editRes.body.success).toBe(false);
  });

  test('RBAC: Consumer cannot access Admin verification endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/pending-farmers')
      .set('Authorization', `Bearer ${consumerToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('Atomic Inventory: Rejects purchase exceeding available quantity', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [{ productId: productA._id, quantity: 25 }], // only 10 available
        deliveryAddress: { fullName: 'C1', phone: '44444444', street: 'S1', city: 'C1', state: 'MH', pincode: '400001' },
        deliveryDate: '2026-09-20',
        deliverySlot: '08:00 AM – 10:00 AM',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Insufficient stock');
  });

  test('Server-side Pricing: Client cannot tamper price during checkout', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [{ productId: productA._id, quantity: 2, price: 5 }], // Tampered price ₹5 instead of ₹50
        deliveryAddress: { fullName: 'C1', phone: '44444444', street: 'S1', city: 'C1', state: 'MH', pincode: '400001' },
        deliveryDate: '2026-09-20',
        deliverySlot: '08:00 AM – 10:00 AM',
      });

    expect(res.statusCode).toBe(201);
    // Subtotal must be authoritative: 2 * 50 = 100 + 40 (fee) = 140
    expect(res.body.data.subtotal).toBe(100);
    expect(res.body.data.total).toBe(140);
  });

  test('Purchase-Gated Reviews: Consumer cannot review a product before delivery', async () => {
    // Create new un-delivered order
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [{ productId: productA._id, quantity: 1 }],
        deliveryAddress: { fullName: 'C1', phone: '44444444', street: 'S1', city: 'C1', state: 'MH', pincode: '400001' },
        deliveryDate: '2026-09-20',
        deliverySlot: '08:00 AM – 10:00 AM',
      });

    const newOrderId = orderRes.body.data._id;

    const reviewRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        orderId: newOrderId,
        productId: productA._id,
        productRating: 5,
        farmerRating: 5,
        comment: 'Attempted premature review',
      });

    expect(reviewRes.statusCode).toBe(400);
    expect(reviewRes.body.message).toContain('DELIVERED');
  });
});
