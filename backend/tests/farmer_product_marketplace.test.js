const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');
const app = require('../src/server');
const User = require('../src/models/User');
const Farmer = require('../src/models/Farmer');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Wishlist = require('../src/models/Wishlist');

let mongoServer;
let adminToken, farmerTokenA, farmerTokenB, pendingFarmerToken, consumerToken;
let farmerDocA, farmerDocB, pendingFarmerDoc, categoryVeg, categoryFruits;
let productA;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Create Admin
  const adminRes = await request(app)
    .post('/api/auth/signup/consumer')
    .send({ name: 'Super Admin', email: 'admin@market.test', phone: '99990000', password: 'AdminPassword123' });
  await User.findByIdAndUpdate(adminRes.body.data.user._id, { role: 'ADMIN' });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@market.test', password: 'AdminPassword123' });
  adminToken = adminLogin.body.data.accessToken;

  // 2. Create Categories
  categoryVeg = await Category.create({ name: 'Vegetables', slug: 'vegetables', icon: 'Carrot' });
  categoryFruits = await Category.create({ name: 'Fruits', slug: 'fruits', icon: 'Apple' });

  // 3. Create Approved Farmer A
  const fARes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Ramesh Farmer',
    email: 'ramesh@agri.test',
    phone: '9845011111',
    password: 'Password123',
    farmLocation: { address: 'Plot 4, Agro Zone', district: 'Vijayapura', state: 'Karnataka', pincode: '586101' },
    cropTypes: ['Onions', 'Tomatoes'],
    farmingMethod: 'ORGANIC',
  });
  farmerTokenA = fARes.body.data.accessToken;
  farmerDocA = fARes.body.data.farmer;
  await Farmer.findByIdAndUpdate(farmerDocA._id, { verificationStatus: 'APPROVED' });

  // 4. Create Approved Farmer B
  const fBRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Suresh Farmer',
    email: 'suresh@agri.test',
    phone: '9845022222',
    password: 'Password123',
    farmLocation: { address: 'Survey 12', district: 'Dharwad', state: 'Karnataka', pincode: '580001' },
    cropTypes: ['Mangoes', 'Grapes'],
    farmingMethod: 'NATURAL',
  });
  farmerTokenB = fBRes.body.data.accessToken;
  farmerDocB = fBRes.body.data.farmer;
  await Farmer.findByIdAndUpdate(farmerDocB._id, { verificationStatus: 'APPROVED' });

  // 5. Create Pending Farmer
  const fPRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Pending Farmer',
    email: 'pending@agri.test',
    phone: '9845033333',
    password: 'Password123',
    farmLocation: { address: 'Survey 99', district: 'Belagavi', state: 'Karnataka', pincode: '590001' },
    cropTypes: ['Sugarcane'],
    farmingMethod: 'CONVENTIONAL',
  });
  pendingFarmerToken = fPRes.body.data.accessToken;
  pendingFarmerDoc = fPRes.body.data.farmer;

  // 6. Create Consumer
  const cRes = await request(app).post('/api/auth/signup/consumer').send({
    name: 'Neha Sharma',
    email: 'neha@consumer.test',
    phone: '9876543210',
    password: 'Password123',
  });
  consumerToken = cRes.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Part 2: Farmer, Product, Inventory & Marketplace Suite', () => {
  // ==========================================
  // 1. Farmer Registration & Verification Lifecycle
  // ==========================================
  test('Pending farmer cannot publish products before Admin verification', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${pendingFarmerToken}`)
      .send({
        name: 'Unverified Sugarcane',
        category: categoryVeg._id.toString(),
        description: 'Should be blocked by middleware',
        price: 30,
        unit: 'kg',
        quantity: 100,
        harvestDate: new Date(),
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('pending verification');
  });

  test('Admin can review and approve a pending farmer', async () => {
    const res = await request(app)
      .patch(`/api/admin/verify-farmer/${pendingFarmerDoc._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED',
        notes: 'Land survey verified by agricultural inspector',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verificationStatus).toBe('APPROVED');

    // Verification check in DB
    const updatedFarmer = await Farmer.findById(pendingFarmerDoc._id);
    expect(updatedFarmer.verificationStatus).toBe('APPROVED');
  });

  // ==========================================
  // 2. Product CRUD & Ownership Authorization
  // ==========================================
  test('Approved farmer can create a product with valid category', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({
        name: 'Organic Red Onions',
        category: categoryVeg._id.toString(),
        description: 'Pungent, sweet farm fresh red onions with zero chemical sprays.',
        price: 45,
        unit: 'kg',
        quantity: 20,
        minOrderQuantity: 1,
        farmingMethod: 'ORGANIC',
        harvestDate: new Date(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Organic Red Onions');
    expect(res.body.data.isOrganic).toBe(true);
    expect(res.body.data.availabilityStatus).toBe('IN_STOCK');
    productA = res.body.data;
  });

  test('Product creation rejects invalid/inactive category ID', async () => {
    const fakeCategoryId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({
        name: 'Ghost Produce',
        category: fakeCategoryId.toString(),
        description: 'Should fail due to missing category',
        price: 50,
        unit: 'kg',
        quantity: 10,
        harvestDate: new Date(),
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Invalid or inactive category');
  });

  test('Farmer A can update their own product and stock auto-syncs status', async () => {
    // Update quantity to 3 (Low stock threshold is <= 5)
    const res = await request(app)
      .put(`/api/products/${productA._id}`)
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({
        price: 48,
        quantity: 3,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.price).toBe(48);
    expect(res.body.data.quantity).toBe(3);
    expect(res.body.data.availabilityStatus).toBe('LOW_STOCK');
  });

  test('BOLA / IDOR: Farmer B cannot update Farmer A’s product', async () => {
    const res = await request(app)
      .put(`/api/products/${productA._id}`)
      .set('Authorization', `Bearer ${farmerTokenB}`)
      .send({ price: 10 });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Admin moderation: Admin can update any farmer’s product', async () => {
    const res = await request(app)
      .put(`/api/products/${productA._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isFeatured: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.isFeatured).toBe(true);
  });

  // ==========================================
  // 3. Public Farmer Profile & Privacy
  // ==========================================
  test('Public farmer profile returns active produce and ratings without leaking phone/email', async () => {
    const res = await request(app).get(`/api/farmers/${farmerDocA._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    expect(res.body.data.farmer.user.name).toBe('Ramesh Farmer');
    // Privacy: never expose private credentials to public
    expect(res.body.data.farmer.user.phone).toBeUndefined();
    expect(res.body.data.farmer.user.email).toBeUndefined();
    expect(Array.isArray(res.body.data.products)).toBe(true);
    expect(res.body.data.products.length).toBeGreaterThan(0);
  });

  // ==========================================
  // 4. Secure Image Upload & Magic Bytes
  // ==========================================
  test('Image upload accepts genuine PNG binary and assigns safe UUID filename', async () => {
    // 1x1 valid PNG binary buffer
    const validPngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
      'hex'
    );

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .attach('image', validPngBuffer, 'harvest.png');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toMatch(/^\/uploads\/[a-f0-9-]+\.png$/);
  });

  test('Image upload rejects fake image file with invalid magic bytes', async () => {
    // Malicious shell script disguised as .png
    const fakeImageBuffer = Buffer.from('#!/bin/bash\necho "exploit"', 'utf-8');

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .attach('image', fakeImageBuffer, 'script.png');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('File content does not match genuine image signatures');
  });

  // ==========================================
  // 5. Marketplace Search, Filters, Sorting & Pagination
  // ==========================================
  test('Marketplace supports backend search query', async () => {
    const res = await request(app).get('/api/products?search=onions');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((p) => p.name.includes('Onions'))).toBe(true);
  });

  test('Marketplace supports filters: category, isOrganic, availability', async () => {
    const res = await request(app).get(`/api/products?category=${categoryVeg._id}&isOrganic=true&availability=LOW_STOCK`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].category._id.toString()).toBe(categoryVeg._id.toString());
    expect(res.body.data[0].isOrganic).toBe(true);
    expect(res.body.data[0].availabilityStatus).toBe('LOW_STOCK');
  });

  test('Marketplace supports sorting and pagination metadata', async () => {
    const res = await request(app).get('/api/products?sort=price_desc&page=1&limit=2');

    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  // ==========================================
  // 6. Global Search Hub (Products, Farmers, Categories)
  // ==========================================
  test('GET /api/search returns matching products, farmers, and categories', async () => {
    const res = await request(app).get('/api/search?q=veg');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.categories.some((c) => c.name === 'Vegetables')).toBe(true);
  });

  // ==========================================
  // 7. Wishlist Operations
  // ==========================================
  test('Consumer can toggle, view, and remove product from wishlist', async () => {
    // 1. Add to wishlist
    const toggleRes = await request(app)
      .post('/api/consumer/wishlist/toggle')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ productId: productA._id });

    expect(toggleRes.statusCode).toBe(200);

    // 2. View wishlist
    const getRes = await request(app)
      .get('/api/consumer/wishlist')
      .set('Authorization', `Bearer ${consumerToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.data.products.some((p) => p._id.toString() === productA._id.toString())).toBe(true);

    // 3. Remove from wishlist
    const delRes = await request(app)
      .delete(`/api/consumer/wishlist/${productA._id}`)
      .set('Authorization', `Bearer ${consumerToken}`);

    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.data.products.some((p) => p.toString() === productA._id.toString())).toBe(false);
  });

  // ==========================================
  // 8. Order Cancellation Restores Stock Atomically
  // ==========================================
  test('Order cancellation restores product stock atomically', async () => {
    // Restock product to 10
    await Product.findByIdAndUpdate(productA._id, { quantity: 10, availabilityStatus: 'IN_STOCK' });

    // Place an order for 4 units
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [{ productId: productA._id, quantity: 4 }],
        deliveryAddress: { fullName: 'Neha', phone: '9876543210', street: 'MG Rd', city: 'Blr', state: 'KA', pincode: '560001' },
        deliveryDate: '2026-09-30',
        deliverySlot: '08:00 AM – 10:00 AM',
      });

    expect(orderRes.statusCode).toBe(201);
    const orderId = orderRes.body.data._id;

    // Verify stock decremented to 6
    let currentProd = await Product.findById(productA._id);
    expect(currentProd.quantity).toBe(6);

    // Cancel order
    const cancelRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELLED', comment: 'Customer request' });

    expect(cancelRes.statusCode).toBe(200);

    // Verify stock restored to 10
    currentProd = await Product.findById(productA._id);
    expect(currentProd.quantity).toBe(10);
  });
});
