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
let adminToken, farmerTokenA, farmerTokenB, pendingFarmerToken, consumerToken, consumerTokenB;
let farmerDocA, farmerDocB, productA, category, orderA;

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

  // 3. Create Farmer A & Farmer B (Approved)
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

  // 4. Create Pending Farmer (Not approved)
  const fPendingRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Pending Farmer',
    email: 'pending.farmer@test.com',
    phone: '44445555',
    password: 'password123',
    farmLocation: { address: 'Addr C', district: 'Satara', state: 'MH', pincode: '415001' },
    cropTypes: ['Ginger'],
    farmingMethod: 'ORGANIC',
  });
  pendingFarmerToken = fPendingRes.body.data.accessToken;

  // 5. Create Consumer 1 & Consumer 2
  const consRes = await request(app).post('/api/auth/signup/consumer').send({
    name: 'Consumer 1',
    email: 'c1@test.com',
    phone: '44444444',
    password: 'password123',
  });
  consumerToken = consRes.body.data.accessToken;

  const consBRes = await request(app).post('/api/auth/signup/consumer').send({
    name: 'Consumer 2',
    email: 'c2@test.com',
    phone: '55555555',
    password: 'password123',
  });
  consumerTokenB = consBRes.body.data.accessToken;

  // 6. Create Product owned by Farmer A with 10 units
  const pRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${farmerTokenA}`)
    .send({
      name: 'Organic Red Onions',
      category: category._id.toString(),
      description: 'Sweet fresh red onions directly from farm',
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
  // 1. BOLA / IDOR on Product
  test('BOLA / IDOR: Farmer B cannot edit Farmer A’s product', async () => {
    const editRes = await request(app)
      .put(`/api/products/${productA._id}`)
      .set('Authorization', `Bearer ${farmerTokenB}`)
      .send({ price: 20 });

    expect(editRes.statusCode).toBe(403);
    expect(editRes.body.success).toBe(false);
  });

  // 2. Pending Farmer Barrier
  test('Pending farmer cannot create public products before Admin approval', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${pendingFarmerToken}`)
      .send({
        name: 'Fresh Ginger',
        category: category._id.toString(),
        description: 'Unapproved farmer test product',
        price: 80,
        unit: 'kg',
        quantity: 10,
        harvestDate: new Date(),
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('pending verification');
  });

  // 3. RBAC Barrier on Admin endpoints
  test('RBAC: Consumer cannot access Admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/pending-farmers')
      .set('Authorization', `Bearer ${consumerToken}`);

    expect(res.statusCode).toBe(403);
  });

  // 4. RBAC Barrier on Product listing
  test('RBAC: Consumer cannot create products', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        name: 'Consumer Fake Product',
        category: category._id.toString(),
        description: 'Should be rejected by role check',
        price: 50,
        unit: 'kg',
        quantity: 10,
        harvestDate: new Date(),
      });

    expect(res.statusCode).toBe(403);
  });

  // 5. Atomic Inventory Check
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

  // 6. Server-side Pricing Authoritative Recalculation
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
    orderA = res.body.data;
  });

  // 7. Order Ownership Barrier (Consumer B cannot access Consumer A's order)
  test('BOLA / IDOR: Consumer B cannot access Consumer A’s order details', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderA._id}`)
      .set('Authorization', `Bearer ${consumerTokenB}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('cannot access another consumer’s order');
  });

  // 8. Purchase-Gated Reviews
  test('Purchase-Gated Reviews: Consumer cannot review a product before delivery', async () => {
    const reviewRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        orderId: orderA._id,
        productId: productA._id,
        productRating: 5,
        farmerRating: 5,
        comment: 'Attempted premature review before delivery',
      });

    expect(reviewRes.statusCode).toBe(400);
    expect(reviewRes.body.message).toContain('DELIVERED');
  });

  // 9. Schema Validation: Product with invalid/negative price or quantity
  test('Schema Validation: Rejects product creation with negative price or negative quantity', async () => {
    const negativePriceRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({
        name: 'Invalid Price Veggie',
        category: category._id.toString(),
        description: 'Should fail validation',
        price: -10, // Invalid negative
        unit: 'kg',
        quantity: 5,
        harvestDate: new Date(),
      });

    expect(negativePriceRes.statusCode).toBe(400);
    expect(negativePriceRes.body.message).toContain('Validation failed');

    const negativeQtyRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({
        name: 'Invalid Qty Veggie',
        category: category._id.toString(),
        description: 'Should fail validation',
        price: 50,
        unit: 'kg',
        quantity: -5, // Invalid negative
        harvestDate: new Date(),
      });

    expect(negativeQtyRes.statusCode).toBe(400);
  });

  // 10. Schema Validation: Empty items in order
  test('Schema Validation: Rejects order creation with empty items array', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [],
        deliveryAddress: { fullName: 'C1', phone: '44444444', street: 'S1', city: 'C1', state: 'MH', pincode: '400001' },
        deliveryDate: '2026-09-20',
        deliverySlot: '08:00 AM – 10:00 AM',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Validation failed');
  });

  // 11. Error Handling: CastError on invalid ObjectId
  test('Error Handling: Malformed resource ObjectId returns 400 Bad Request safely', async () => {
    const res = await request(app).get('/api/products/invalid-object-id-format');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid format for resource identifier');
  });

  // 12. Delivery Slots Endpoint
  test('GET /api/delivery-slots should return active delivery windows', async () => {
    const res = await request(app).get('/api/delivery-slots');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
