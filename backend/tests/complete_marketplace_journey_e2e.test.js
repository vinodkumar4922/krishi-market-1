const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Farmer = require('../src/models/Farmer');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const DeliverySlot = require('../src/models/DeliverySlot');
const Review = require('../src/models/Review');

let mongoServer;
let adminToken;
let consumerToken;
let farmerToken, farmerDoc;
let categoryVeg;
let productTomato;
let deliverySlotDoc;
let createdOrderId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Seed Delivery Slot
  deliverySlotDoc = await DeliverySlot.create({
    slotName: 'Morning Express (07:00 AM - 10:00 AM)',
    startTime: '07:00',
    endTime: '10:00',
    capacity: 50,
  });

  // Seed Category
  categoryVeg = await Category.create({
    name: 'Vegetables',
    slug: 'vegetables',
    icon: 'Carrot',
    description: 'Fresh vegetables',
  });

  // Create Admin
  await request(app).post('/api/auth/signup/consumer').send({
    name: 'Platform Admin',
    email: 'admin@journey.krishi',
    phone: '9900000000',
    password: 'DemoPassword123!',
  });
  const adminUser = await User.findOne({ email: 'admin@journey.krishi' });
  adminUser.role = 'ADMIN';
  await adminUser.save();
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@journey.krishi',
    password: 'DemoPassword123!',
  });
  adminToken = adminLogin.body.data.accessToken;

  // Create Farmer (Approved)
  const fRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Suresh Patil',
    email: 'suresh@farmer.journey',
    phone: '9845000001',
    password: 'DemoPassword123!',
    farmLocation: { address: 'Plot 55', district: 'Vijayapura', state: 'Karnataka', pincode: '586101' },
    cropTypes: ['Tomatoes', 'Chilli'],
    farmingMethod: 'ORGANIC',
  });
  farmerToken = fRes.body.data.accessToken;
  farmerDoc = await Farmer.findById(fRes.body.data.farmer._id);
  farmerDoc.verificationStatus = 'APPROVED';
  await farmerDoc.save();

  // Create Product for Farmer
  productTomato = await Product.create({
    name: 'Fresh Desi Organic Tomato',
    farmer: farmerDoc._id,
    category: categoryVeg._id,
    price: 35,
    unit: 'kg',
    quantity: 100,
    description: 'Hand-picked ripe desi organic tomatoes directly from Vijayapura farm.',
    harvestDate: new Date(),
    location: { district: 'Vijayapura', state: 'Karnataka' },
    isOrganic: true,
    isActive: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Krishi Market Complete 20-Step Journey E2E Test', () => {
  test('Step 1 & 2: Consumer Signup and Login', async () => {
    const signupRes = await request(app).post('/api/auth/signup/consumer').send({
      name: 'Pooja Hegde',
      email: 'pooja@consumer.journey',
      phone: '9845000002',
      password: 'DemoPassword123!',
    });
    expect(signupRes.status).toBe(201);
    expect(signupRes.body.success).toBe(true);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'pooja@consumer.journey',
      password: 'DemoPassword123!',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();
    consumerToken = loginRes.body.data.accessToken;
  });

  test('Step 3: Browse Marketplace Produce List', async () => {
    const res = await request(app).get('/api/products?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('Step 4: Search Marketplace for specific produce ("Tomato")', async () => {
    const res = await request(app).get('/api/products?search=Tomato');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((p) => p.name.includes('Tomato'))).toBe(true);
  });

  test('Step 5: Filter Marketplace by District and Category', async () => {
    const res = await request(app).get(
      `/api/products?category=${categoryVeg._id}&district=Vijayapura`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('Step 6: Inspect Single Product Details', async () => {
    const res = await request(app).get(`/api/products/${productTomato._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(productTomato.name);
    expect(res.body.data.price).toBe(35);
  });

  test('Step 7: Inspect Public Farmer Profile', async () => {
    const res = await request(app).get(`/api/farmers/${farmerDoc._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.farmer.farmLocation.district).toBe('Vijayapura');
  });

  test('Step 8: Consumer adds product to Wishlist', async () => {
    const toggleRes = await request(app)
      .post('/api/consumer/wishlist/toggle')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({ productId: productTomato._id });
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.success).toBe(true);

    const getRes = await request(app)
      .get('/api/consumer/wishlist')
      .set('Authorization', `Bearer ${consumerToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.products.some((p) => p._id.toString() === productTomato._id.toString())).toBe(true);
  });

  test('Step 9: Consumer queries available Delivery Slots', async () => {
    const res = await request(app).get('/api/delivery-slots');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('Step 10: Checkout & Place Order with Authoritative Server Pricing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        items: [{ productId: productTomato._id.toString(), quantity: 3 }], // 3kg @ ₹35 = ₹105
        deliverySlot: deliverySlotDoc.slotName,
        deliveryDate: new Date().toISOString(),
        deliveryAddress: {
          fullName: 'Pooja Hegde',
          phone: '9845000002',
          street: 'Koramangala 4th Block',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560034',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subtotal).toBe(105);
    expect(res.body.data.total).toBe(145); // 105 + 40 delivery fee
    expect(res.body.data.status).toBe('PLACED');
    createdOrderId = res.body.data._id;

    // Verify atomic inventory decrement
    const updatedProd = await Product.findById(productTomato._id);
    expect(updatedProd.quantity).toBe(97); // 100 - 3
  });

  test('Step 11: Farmer views incoming orders', async () => {
    const res = await request(app)
      .get('/api/orders/farmer')
      .set('Authorization', `Bearer ${farmerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((o) => o._id.toString() === createdOrderId.toString())).toBe(true);
  });

  test('Step 12: Farmer confirms order (PLACED -> CONFIRMED)', async () => {
    const res = await request(app)
      .patch(`/api/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ status: 'CONFIRMED', comment: 'Harvest confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  test('Step 13: Farmer prepares order (CONFIRMED -> PREPARING)', async () => {
    const res = await request(app)
      .patch(`/api/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ status: 'PREPARING', comment: 'Packaging fresh tomatoes' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PREPARING');
  });

  test('Step 14: Farmer marks order READY_FOR_DELIVERY', async () => {
    const res = await request(app)
      .patch(`/api/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ status: 'READY_FOR_DELIVERY', comment: 'Ready for hub dispatch' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('READY_FOR_DELIVERY');
  });

  test('Step 15: Farmer marks order OUT_FOR_DELIVERY', async () => {
    const res = await request(app)
      .patch(`/api/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ status: 'OUT_FOR_DELIVERY', comment: 'Out for morning delivery' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('OUT_FOR_DELIVERY');
  });

  test('Step 16: Order is delivered to consumer (DELIVERED)', async () => {
    const res = await request(app)
      .patch(`/api/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ status: 'DELIVERED', comment: 'Delivered to door safely' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DELIVERED');
  });

  test('Step 17: Consumer submits verified purchase review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${consumerToken}`)
      .send({
        orderId: createdOrderId,
        productId: productTomato._id.toString(),
        productRating: 5,
        farmerRating: 5,
        comment: 'Exceptional sweet and firm desi tomatoes! Farm fresh aroma.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify product rating updated
    const prod = await Product.findById(productTomato._id);
    expect(prod.rating.average).toBe(5);
    expect(prod.rating.count).toBe(1);

    // Verify farmer rating updated
    const farmer = await Farmer.findById(farmerDoc._id);
    expect(farmer.rating.average).toBe(5);
  });

  test('Step 18: Farmer Dashboard reflects delivered sales and updated ratings', async () => {
    const res = await request(app)
      .get('/api/farmers/dashboard')
      .set('Authorization', `Bearer ${farmerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics.totalSales).toBeGreaterThanOrEqual(105);
    expect(res.body.data.farmer.rating.average).toBe(5);
  });

  test('Step 19: Admin Dashboard reflects official metrics and sales volume', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalSales).toBeGreaterThanOrEqual(105);
    expect(res.body.data.deliveredOrders).toBeGreaterThanOrEqual(1);
    expect(res.body.data.fulfillmentRate).toBeGreaterThanOrEqual(50);
  });

  test('Step 20: Admin generates official Sales Realization Report', async () => {
    const res = await request(app)
      .get('/api/admin/reports/sales')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reportTitle).toContain('Sales');
    expect(res.body.records.some((r) => r.orderNumber !== undefined)).toBe(true);
  });
});
