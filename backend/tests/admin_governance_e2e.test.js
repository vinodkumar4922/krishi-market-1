const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Farmer = require('../src/models/Farmer');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Dispute = require('../src/models/Dispute');
const AuditLog = require('../src/models/AuditLog');
const Notification = require('../src/models/Notification');
const DeliverySlot = require('../src/models/DeliverySlot');

let mongoServer;
let adminToken, adminUser;
let pendingFarmerDoc, approvedFarmerDoc;
let consumerToken, consumerUser;
let testProduct;
let testOrder;
let testDispute;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Create Admin
  await request(app).post('/api/auth/signup/consumer').send({
    name: 'Krishi Market Admin',
    email: 'admin@krishimarket.demo',
    phone: '9900000001',
    password: 'DemoPassword123!',
  });
  adminUser = await User.findOne({ email: 'admin@krishimarket.demo' });
  adminUser.role = 'ADMIN';
  await adminUser.save();

  // Admin Login
  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'admin@krishimarket.demo',
    password: 'DemoPassword123!',
  });
  adminToken = loginRes.body.data.accessToken;

  // 2. Create Approved Farmer
  const fAppRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Ramesh Patil',
    email: 'ramesh.patil@farmer.demo',
    phone: '9845011111',
    password: 'DemoPassword123!',
    farmLocation: { address: 'Plot 12', district: 'Vijayapura', state: 'Karnataka', pincode: '586101' },
    cropTypes: ['Tomatoes', 'Onions'],
    farmingMethod: 'ORGANIC',
  });
  approvedFarmerDoc = await Farmer.findById(fAppRes.body.data.farmer._id);
  approvedFarmerDoc.verificationStatus = 'APPROVED';
  await approvedFarmerDoc.save();

  // 3. Create Pending Farmer (for approval test)
  const fPendRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Basavaraj Jangam',
    email: 'basavaraj@farmer.demo',
    phone: '9845022222',
    password: 'DemoPassword123!',
    farmLocation: { address: 'Farm 4', district: 'Belagavi', state: 'Karnataka', pincode: '590001' },
    cropTypes: ['Wheat', 'Jowar'],
    farmingMethod: 'CONVENTIONAL',
  });
  pendingFarmerDoc = await Farmer.findById(fPendRes.body.data.farmer._id);

  // 4. Create Consumer
  const cRes = await request(app).post('/api/auth/signup/consumer').send({
    name: 'Anita Sharma',
    email: 'anita.sharma@consumer.demo',
    phone: '9845033333',
    password: 'DemoPassword123!',
  });
  consumerToken = cRes.body.data.accessToken;
  consumerUser = await User.findOne({ email: 'anita.sharma@consumer.demo' });

  // 5. Create Category & Product
  const category = await Category.create({
    name: 'Vegetables',
    slug: 'vegetables',
    icon: 'Carrot',
    description: 'Fresh farm harvest',
  });

  testProduct = await Product.create({
    name: 'Organic Desi Tomatoes',
    farmer: approvedFarmerDoc._id,
    category: category._id,
    price: 45,
    unit: 'kg',
    quantity: 100,
    description: 'Fresh vine ripened farm tomatoes harvested daily.',
    harvestDate: new Date(),
    location: { district: 'Vijayapura', state: 'Karnataka' },
    isOrganic: true,
    isActive: true,
  });

  // 6. Create Delivery Slot & Order
  const slot = await DeliverySlot.create({
    slotName: 'Morning Express (07:00 AM - 10:00 AM)',
    startTime: '07:00',
    endTime: '10:00',
    capacity: 50,
  });

  testOrder = await Order.create({
    orderNumber: 'KM-2026-TEST01',
    consumer: consumerUser._id,
    items: [
      {
        product: testProduct._id,
        name: testProduct.name,
        price: testProduct.price,
        unit: testProduct.unit,
        quantity: 2,
        farmer: approvedFarmerDoc._id,
        itemTotal: 90,
      },
    ],
    farmersInvolved: [approvedFarmerDoc._id],
    subtotal: 90,
    deliveryFee: 40,
    total: 130,
    deliverySlot: slot.slotName,
    deliveryDate: new Date(),
    deliveryAddress: {
      fullName: 'Anita Sharma',
      phone: '9845033333',
      street: 'Indiranagar 100ft',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    status: 'DELIVERED',
  });

  // 7. Create Dispute for the Order
  testDispute = await Dispute.create({
    order: testOrder._id,
    user: consumerUser._id,
    reason: 'PRODUCT_QUALITY',
    description: 'A few tomatoes were slightly overripe upon arrival.',
    status: 'OPEN',
  });

  // 8. Create a sample security event audit log
  await AuditLog.create({
    actor: null,
    action: 'LOGIN_FAILURE',
    resourceType: 'Auth',
    details: { reason: 'Invalid password attempt' },
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 TestBrowser',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Krishi Market Admin & Governance Lifecycle E2E Suite', () => {
  test('1. Admin Login & Authorization verification', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@krishimarket.demo',
      password: 'DemoPassword123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('2. View Admin Dashboard & verify all 13 database-driven metrics', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;

    // Verify all 13 metrics are database-driven and non-null
    expect(data.totalFarmers).toBeGreaterThanOrEqual(2);
    expect(data.approvedFarmers).toBeGreaterThanOrEqual(1);
    expect(data.pendingFarmers).toBeGreaterThanOrEqual(1);
    expect(data.rejectedFarmers).toBe(0);
    expect(data.totalConsumers).toBeGreaterThanOrEqual(1);
    expect(data.activeProducts).toBeGreaterThanOrEqual(1);
    expect(data.totalOrders).toBeGreaterThanOrEqual(1);
    expect(data.deliveredOrders).toBeGreaterThanOrEqual(1);
    expect(data.cancelledOrders).toBe(0);
    expect(data.totalSales).toBe(90);
    expect(data.fulfillmentRate).toBe(100);
    expect(data.repeatCustomerRate).toBeDefined();
    expect(data.commission).toBeDefined();
  });

  test('3. View Pending Farmer Queue', async () => {
    const res = await request(app)
      .get('/api/admin/pending-farmers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((f) => f._id.toString() === pendingFarmerDoc._id.toString())).toBe(true);
  });

  test('4. Approve Pending Farmer & Verify Notification and Audit Log', async () => {
    const res = await request(app)
      .patch(`/api/admin/verify-farmer/${pendingFarmerDoc._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED',
        notes: 'Land deed and pesticide-free soil certificates verified.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verificationStatus).toBe('APPROVED');

    // Verify DB update
    const updatedFarmer = await Farmer.findById(pendingFarmerDoc._id);
    expect(updatedFarmer.verificationStatus).toBe('APPROVED');
    expect(updatedFarmer.verificationNotes).toContain('pesticide-free');

    // Verify Notification Created
    const notification = await Notification.findOne({
      recipient: updatedFarmer.user,
      type: 'VERIFICATION',
    });
    expect(notification).toBeTruthy();
    expect(notification.title).toContain('APPROVED');

    // Verify Audit Log Created
    const auditLog = await AuditLog.findOne({
      action: 'FARMER_APPROVED',
      resourceId: updatedFarmer._id.toString(),
    });
    expect(auditLog).toBeTruthy();
    expect(auditLog.actor.toString()).toBe(adminUser._id.toString());
  });

  test('5. View Products & Moderate/Toggle Product status', async () => {
    // 5a. View Products
    const listRes = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.some((p) => p._id.toString() === testProduct._id.toString())).toBe(true);

    // 5b. Toggle Product Status (Deactivate)
    const toggleRes = await request(app)
      .patch(`/api/admin/products/${testProduct._id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.success).toBe(true);
    expect(toggleRes.body.data.isActive).toBe(false);

    // Re-activate
    const reactivateRes = await request(app)
      .patch(`/api/admin/products/${testProduct._id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.data.isActive).toBe(true);
  });

  test('6. View Consumers & Toggle Consumer Account Status', async () => {
    // 6a. Get Consumers (Verify password hashes are excluded)
    const listRes = await request(app)
      .get('/api/admin/consumers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    const target = listRes.body.data.find((c) => c._id.toString() === consumerUser._id.toString());
    expect(target).toBeTruthy();
    expect(target.passwordHash).toBeUndefined();
    expect(target.refreshTokenHash).toBeUndefined();

    // 6b. Suspend Consumer
    const suspendRes = await request(app)
      .patch(`/api/admin/consumers/${consumerUser._id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.accountStatus).toBe('SUSPENDED');

    // 6c. Reactivate Consumer
    const reactivateRes = await request(app)
      .patch(`/api/admin/consumers/${consumerUser._id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.data.accountStatus).toBe('ACTIVE');
  });

  test('7. Category Management (Create, Edit, Toggle)', async () => {
    // 7a. Create Category
    const createRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dairy & Farm Milk',
        description: 'Fresh cow & buffalo milk, curd and ghee',
        icon: 'Milk',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const newCatId = createRes.body.data._id;

    // 7b. Update Category
    const updateRes = await request(app)
      .put(`/api/categories/${newCatId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dairy & Pure A2 Milk',
        description: 'A2 Vedic Desi Gir cow and buffalo milk',
        icon: 'Milk',
        isActive: true,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toContain('Pure A2');

    // 7c. Toggle Category
    const toggleRes = await request(app)
      .patch(`/api/categories/${newCatId}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.isActive).toBe(false);
  });

  test('8. View Orders monitoring pipeline', async () => {
    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((o) => o._id.toString() === testOrder._id.toString())).toBe(true);
  });

  test('9. Dispute Lifecycle: OPEN -> UNDER_REVIEW -> RESOLVED', async () => {
    // 9a. View Disputes
    const viewRes = await request(app)
      .get('/api/disputes/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(viewRes.status).toBe(200);
    expect(viewRes.body.success).toBe(true);
    expect(viewRes.body.data.some((d) => d._id.toString() === testDispute._id.toString())).toBe(true);

    // 9b. Transition to UNDER_REVIEW
    const underReviewRes = await request(app)
      .patch(`/api/disputes/${testDispute._id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'UNDER_REVIEW',
        resolutionNotes: 'Contacting farmer Ramesh Patil regarding batch ripeness.',
      });

    expect(underReviewRes.status).toBe(200);
    expect(underReviewRes.body.data.status).toBe('UNDER_REVIEW');

    // 9c. Transition to RESOLVED with notes
    const resolveRes = await request(app)
      .patch(`/api/disputes/${testDispute._id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'RESOLVED',
        resolutionNotes: 'Full refund credited to wallet and farmer replaced harvest batch.',
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe('RESOLVED');

    // Verify Notification to consumer
    const notif = await Notification.findOne({
      recipient: consumerUser._id,
      type: 'DISPUTE',
    }).sort({ createdAt: -1 });
    expect(notif).toBeTruthy();
    expect(notif.message).toContain('refund credited');
  });

  test('10. View Real Aggregated Analytics across ranges', async () => {
    const res = await request(app)
      .get('/api/admin/analytics/detailed?range=30days')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ordersOverTime).toBeDefined();
    expect(res.body.data.orderStatuses).toBeDefined();
    expect(res.body.data.topProducts).toBeDefined();
    expect(res.body.data.topFarmers).toBeDefined();
  });

  test('11. View Official Reports (Sales, Orders, Farmers, Consumers, Products, Categories, Fulfilment, Commission)', async () => {
    const reportTypes = [
      'sales',
      'orders',
      'farmers',
      'consumers',
      'products',
      'categories',
      'fulfilment',
      'commission',
    ];

    for (const type of reportTypes) {
      const res = await request(app)
        .get(`/api/admin/reports/${type}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reportTitle).toBeDefined();
      expect(Array.isArray(res.body.records)).toBe(true);
    }
  });

  test('12. View Audit Logs', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('13. View Security Events', async () => {
    const res = await request(app)
      .get('/api/admin/security-events')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((ev) => ev.action === 'LOGIN_FAILURE')).toBe(true);
  });

  test('14. Security: Non-Admin users must be forbidden from Admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${consumerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });
});
