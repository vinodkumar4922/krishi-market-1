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
const Dispute = require('../src/models/Dispute');
const { generateAccessToken } = require('../src/utils/tokenHelper');

let mongoServer;
let adminToken, adminUser;
let consumerTokenA, consumerUserA;
let consumerTokenB, consumerUserB;
let farmerTokenA, farmerDocA;
let farmerTokenB, farmerDocB;
let pendingFarmerToken, pendingFarmerDoc;
let rejectedFarmerToken, rejectedFarmerDoc;
let categoryDoc;
let productFarmerA, productFarmerB;
let orderConsumerA, orderConsumerB;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Seed Category
  categoryDoc = await Category.create({
    name: 'Vegetables',
    slug: 'vegetables',
    icon: 'Carrot',
    description: 'Fresh farm harvest',
  });

  // 2. Admin User
  await request(app).post('/api/auth/signup/consumer').send({
    name: 'Security Admin',
    email: 'admin@security.krishi',
    phone: '9900112233',
    password: 'DemoPassword123!',
  });
  adminUser = await User.findOne({ email: 'admin@security.krishi' });
  adminUser.role = 'ADMIN';
  await adminUser.save();
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@security.krishi',
    password: 'DemoPassword123!',
  });
  adminToken = adminLogin.body.data.accessToken;

  // 3. Consumer A
  const cARes = await request(app).post('/api/auth/signup/consumer').send({
    name: 'Consumer Alice',
    email: 'alice@consumer.test',
    phone: '9900223344',
    password: 'DemoPassword123!',
  });
  consumerTokenA = cARes.body.data.accessToken;
  consumerUserA = await User.findOne({ email: 'alice@consumer.test' });

  // 4. Consumer B
  const cBRes = await request(app).post('/api/auth/signup/consumer').send({
    name: 'Consumer Bob',
    email: 'bob@consumer.test',
    phone: '9900334455',
    password: 'DemoPassword123!',
  });
  consumerTokenB = cBRes.body.data.accessToken;
  consumerUserB = await User.findOne({ email: 'bob@consumer.test' });

  // 5. Farmer A (Approved)
  const fARes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Farmer Anand',
    email: 'anand@farmer.test',
    phone: '9845112233',
    password: 'DemoPassword123!',
    farmLocation: { address: 'Plot 1', district: 'Kolar', state: 'Karnataka', pincode: '563101' },
    cropTypes: ['Tomatoes'],
    farmingMethod: 'ORGANIC',
  });
  farmerTokenA = fARes.body.data.accessToken;
  farmerDocA = await Farmer.findById(fARes.body.data.farmer._id);
  farmerDocA.verificationStatus = 'APPROVED';
  await farmerDocA.save();

  // 6. Farmer B (Approved)
  const fBRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Farmer Basava',
    email: 'basava@farmer.test',
    phone: '9845223344',
    password: 'DemoPassword123!',
    farmLocation: { address: 'Survey 22', district: 'Dharwad', state: 'Karnataka', pincode: '580001' },
    cropTypes: ['Mangoes'],
    farmingMethod: 'NATURAL',
  });
  farmerTokenB = fBRes.body.data.accessToken;
  farmerDocB = await Farmer.findById(fBRes.body.data.farmer._id);
  farmerDocB.verificationStatus = 'APPROVED';
  await farmerDocB.save();

  // 7. Pending Farmer
  const fPRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Farmer Prakash',
    email: 'prakash@farmer.test',
    phone: '9845334455',
    password: 'DemoPassword123!',
    farmLocation: { address: 'Plot 99', district: 'Belagavi', state: 'Karnataka', pincode: '590001' },
    cropTypes: ['Wheat'],
    farmingMethod: 'CONVENTIONAL',
  });
  pendingFarmerToken = fPRes.body.data.accessToken;
  pendingFarmerDoc = await Farmer.findById(fPRes.body.data.farmer._id);

  // 8. Rejected Farmer
  const fRRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Farmer Ravi',
    email: 'ravi@farmer.test',
    phone: '9845445566',
    password: 'DemoPassword123!',
    farmLocation: { address: 'Plot 88', district: 'Mandya', state: 'Karnataka', pincode: '571401' },
    cropTypes: ['Sugarcane'],
    farmingMethod: 'CONVENTIONAL',
  });
  rejectedFarmerToken = fRRes.body.data.accessToken;
  rejectedFarmerDoc = await Farmer.findById(fRRes.body.data.farmer._id);
  rejectedFarmerDoc.verificationStatus = 'REJECTED';
  await rejectedFarmerDoc.save();

  // 9. Products for Farmer A & Farmer B
  productFarmerA = await Product.create({
    name: 'Anand Organic Tomatoes',
    farmer: farmerDocA._id,
    category: categoryDoc._id,
    price: 40,
    unit: 'kg',
    quantity: 50,
    description: 'Fresh red organic tomatoes',
    harvestDate: new Date(),
    location: { district: 'Kolar', state: 'Karnataka' },
    isOrganic: true,
    isActive: true,
  });

  productFarmerB = await Product.create({
    name: 'Basava Natural Mangoes',
    farmer: farmerDocB._id,
    category: categoryDoc._id,
    price: 120,
    unit: 'kg',
    quantity: 30,
    description: 'Sweet naturally ripened mangoes',
    harvestDate: new Date(),
    location: { district: 'Dharwad', state: 'Karnataka' },
    isOrganic: true,
    isActive: true,
  });

  // 10. Orders
  const slot = await DeliverySlot.create({
    slotName: 'Morning Express (07:00 AM - 10:00 AM)',
    startTime: '07:00',
    endTime: '10:00',
    capacity: 50,
  });

  orderConsumerA = await Order.create({
    orderNumber: 'KM-SEC-ORD-A',
    consumer: consumerUserA._id,
    items: [
      {
        product: productFarmerA._id,
        name: productFarmerA.name,
        price: productFarmerA.price,
        unit: productFarmerA.unit,
        quantity: 2,
        farmer: farmerDocA._id,
        itemTotal: 80,
      },
    ],
    farmersInvolved: [farmerDocA._id],
    subtotal: 80,
    deliveryFee: 40,
    total: 120,
    deliverySlot: slot.slotName,
    deliveryDate: new Date(),
    deliveryAddress: {
      fullName: 'Alice Smith',
      phone: '9900223344',
      street: 'Alice St 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
    },
    status: 'DELIVERED',
  });

  orderConsumerB = await Order.create({
    orderNumber: 'KM-SEC-ORD-B',
    consumer: consumerUserB._id,
    items: [
      {
        product: productFarmerB._id,
        name: productFarmerB.name,
        price: productFarmerB.price,
        unit: productFarmerB.unit,
        quantity: 1,
        farmer: farmerDocB._id,
        itemTotal: 120,
      },
    ],
    farmersInvolved: [farmerDocB._id],
    subtotal: 120,
    deliveryFee: 40,
    total: 160,
    deliverySlot: slot.slotName,
    deliveryDate: new Date(),
    deliveryAddress: {
      fullName: 'Bob Jones',
      phone: '9900334455',
      street: 'Bob St 2',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560002',
    },
    status: 'PLACED',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('1. Authentication Security & Penetration Tests', () => {
  test('Wrong password rejected with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@consumer.test',
      password: 'IncorrectPassword999!',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  test('Non-existent account rejected with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent.user.2026@domain.test',
      password: 'SomePassword123!',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Malformed token rejected with 401', async () => {
    const res = await request(app)
      .get('/api/consumer/wishlist')
      .set('Authorization', 'Bearer this.is.an.invalid.jwt.token');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Missing Authorization header rejected with 401', async () => {
    const res = await request(app).get('/api/consumer/wishlist');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Malformed Authorization header (no Bearer prefix) rejected with 401', async () => {
    const res = await request(app)
      .get('/api/consumer/wishlist')
      .set('Authorization', consumerTokenA);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Suspended user account blocked with 403', async () => {
    // Temporarily suspend Alice
    consumerUserA.accountStatus = 'SUSPENDED';
    await consumerUserA.save();

    const res = await request(app)
      .get('/api/consumer/wishlist')
      .set('Authorization', `Bearer ${consumerTokenA}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Account suspended');

    // Restore Alice
    consumerUserA.accountStatus = 'ACTIVE';
    await consumerUserA.save();
  });
});

describe('2. Authorization & RBAC Privilege Escalation Defense', () => {
  test('Consumer cannot access Admin Dashboard analytics (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${consumerTokenA}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  test('Farmer cannot access Admin Dashboard analytics (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${farmerTokenA}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  test('Consumer cannot access Farmer orders endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/orders/farmer')
      .set('Authorization', `Bearer ${consumerTokenA}`);
    expect(res.status).toBe(403);
  });

  test('Pending farmer cannot publish/create products (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${pendingFarmerToken}`)
      .send({
        name: 'Unverified Wheat',
        category: categoryDoc._id,
        price: 50,
        unit: 'kg',
        quantity: 100,
        description: 'Should be blocked because farmer is pending verification.',
        harvestDate: new Date(),
        location: { district: 'Belagavi', state: 'Karnataka' },
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('pending verification');
  });

  test('Rejected farmer cannot publish/create products (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${rejectedFarmerToken}`)
      .send({
        name: 'Rejected Sugarcane',
        category: categoryDoc._id,
        price: 30,
        unit: 'kg',
        quantity: 100,
        description: 'Should be blocked because farmer is rejected.',
        harvestDate: new Date(),
        location: { district: 'Mandya', state: 'Karnataka' },
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('pending verification');
  });
});

describe('3. IDOR / BOLA (Broken Object Level Authorization) Testing', () => {
  test('Consumer A cannot access Consumer B’s order (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderConsumerB._id}`)
      .set('Authorization', `Bearer ${consumerTokenA}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  test('Consumer A cannot access Consumer B’s invoice (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderConsumerB._id}/invoice`)
      .set('Authorization', `Bearer ${consumerTokenA}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  test('Consumer A cannot cancel Consumer B’s order (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderConsumerB._id}/cancel`)
      .set('Authorization', `Bearer ${consumerTokenA}`)
      .send({ reason: 'Attempting to cancel someone else order' });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  test('Farmer A cannot modify Farmer B’s product (403 Forbidden)', async () => {
    const res = await request(app)
      .put(`/api/products/${productFarmerB._id}`)
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({
        name: 'Hacked Price Mangoes',
        price: 10,
        quantity: 999,
        description: 'Unauthorized edit',
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  test('Farmer A cannot delete Farmer B’s product (403 Forbidden)', async () => {
    const res = await request(app)
      .delete(`/api/products/${productFarmerB._id}`)
      .set('Authorization', `Bearer ${farmerTokenA}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  test('Farmer A cannot update status of order containing only Farmer B’s items (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderConsumerB._id}/status`)
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({
        status: 'CONFIRMED',
        comment: 'Farmer A trying to confirm Farmer B order',
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  test('Consumer cannot raise a dispute on an order they did not place (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${consumerTokenA}`)
      .send({
        orderId: orderConsumerB._id,
        reason: 'PRODUCT_QUALITY',
        description: 'Trying to dispute Bob order by Alice',
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  test('Consumer cannot review a product they never purchased or order not delivered (403/400)', async () => {
    // Consumer A tries to review productFarmerB on orderConsumerB
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${consumerTokenA}`)
      .send({
        orderId: orderConsumerB._id,
        productId: productFarmerB._id,
        productRating: 5,
        farmerRating: 5,
        comment: 'Attempting fake review',
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });
});

describe('4. Injection & Input Sanitization Testing', () => {
  test('NoSQL Injection: Object injection in login sanitized or rejected', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: { $gt: '' },
      password: 'DemoPassword123!',
    });
    // Should fail validation or authentication cleanly without 500
    expect([400, 401]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('Malformed JSON payload rejected cleanly with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "alice@consumer.test", "password": '); // broken JSON
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Malformed JSON');
  });

  test('Invalid MongoDB ObjectId format handled safely with 400 without crashing', async () => {
    const res = await request(app).get('/api/products/not-a-valid-mongo-id');
    expect([400, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

describe('5. XSS & Payload Length Bounds Testing', () => {
  test('Script tags in review comments are stored safely as plain strings and not executed', async () => {
    const maliciousPayload = "<script>alert('XSS-TEST')</script>";
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${consumerTokenA}`)
      .send({
        orderId: orderConsumerA._id,
        productId: productFarmerA._id,
        productRating: 5,
        farmerRating: 5,
        comment: maliciousPayload,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify stored content is literal string, safe for React escaping
    const review = await Review.findById(res.body.data._id);
    expect(review.comment).toBe(maliciousPayload);
  });

  test('Overly long description exceeding max bounds rejected by validator', async () => {
    const longDesc = 'A'.repeat(2500); // Max is 2000
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({
        name: 'Excessive Description Product',
        category: categoryDoc._id,
        price: 50,
        unit: 'kg',
        quantity: 10,
        description: longDesc,
        harvestDate: new Date(),
        location: { district: 'Kolar', state: 'Karnataka' },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('6. File Upload Security & Magic Byte Defense Testing', () => {
  test('Reject executable file upload (.exe or .sh)', async () => {
    const fakeExeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00');
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .attach('image', fakeExeBuffer, 'payload.exe');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Reject fake extension file (e.g. image.jpg containing plain text bytes)', async () => {
    const fakeJpgBuffer = Buffer.from('#!/bin/bash\necho "Not a real image"');
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .attach('image', fakeJpgBuffer, 'fake.jpg');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('image signatures');
  });

  test('Accept genuine image with authentic PNG magic bytes', async () => {
    // 8-byte standard PNG header: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    const genuinePngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .attach('image', genuinePngBuffer, 'valid_produce.png');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fileUrl).toBeDefined();
  });
});

describe('7. Negative Business Logic & Concurrency Integrity Tests', () => {
  test('Negative quantity in checkout is rejected (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerTokenA}`)
      .send({
        items: [{ productId: productFarmerA._id.toString(), quantity: -5 }],
        deliverySlot: 'Morning Express (07:00 AM - 10:00 AM)',
        deliveryDate: new Date(),
        deliveryAddress: {
          fullName: 'Alice Test',
          phone: '9900223344',
          street: 'Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Zero quantity in checkout is rejected (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerTokenA}`)
      .send({
        items: [{ productId: productFarmerA._id.toString(), quantity: 0 }],
        deliverySlot: 'Morning Express (07:00 AM - 10:00 AM)',
        deliveryDate: new Date(),
        deliveryAddress: {
          fullName: 'Alice Test',
          phone: '9900223344',
          street: 'Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Insufficient inventory rejected with 400', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerTokenA}`)
      .send({
        items: [{ productId: productFarmerA._id.toString(), quantity: 99999 }], // Exceeds 50kg stock
        deliverySlot: 'Morning Express (07:00 AM - 10:00 AM)',
        deliveryDate: new Date(),
        deliveryAddress: {
          fullName: 'Alice Test',
          phone: '9900223344',
          street: 'Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient stock');
  });

  test('Duplicate review on same order item is rejected with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${consumerTokenA}`)
      .send({
        orderId: orderConsumerA._id,
        productId: productFarmerA._id,
        productRating: 4,
        farmerRating: 4,
        comment: 'Second attempt review on same item',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already submitted a review');
  });

  test('Invalid order state machine transition backwards is rejected with 400', async () => {
    // Attempt to transition orderConsumerA from DELIVERED backwards to PREPARING
    const res = await request(app)
      .patch(`/api/orders/${orderConsumerA._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'PREPARING',
        comment: 'Illegal backwards state transition attempt',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid state transition');
  });
});
