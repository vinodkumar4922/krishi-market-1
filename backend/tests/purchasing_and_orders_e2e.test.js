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
const Notification = require('../src/models/Notification');

let mongoServer;
let consumerToken1, consumerToken2, farmerTokenA, farmerTokenB, farmerTokenC;
let consumerDoc1, consumerDoc2, farmerDocA, farmerDocB, farmerDocC;
let productTomato, productMango, productPotato;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Seed Categories
  const categoryVeg = await Category.create({ name: 'Vegetables', slug: 'vegetables', icon: 'Carrot' });
  const categoryFruits = await Category.create({ name: 'Fruits', slug: 'fruits', icon: 'Apple' });

  // 2. Create Farmer A (Approved)
  const fARes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Farmer Anand',
    email: 'anand@farm.test',
    phone: '9880011111',
    password: 'Password123',
    farmLocation: { address: 'Plot 10', district: 'Kolar', state: 'Karnataka', pincode: '563101' },
    cropTypes: ['Tomatoes'],
    farmingMethod: 'ORGANIC',
  });
  farmerTokenA = fARes.body.data.accessToken;
  farmerDocA = fARes.body.data.farmer;
  await Farmer.findByIdAndUpdate(farmerDocA._id, { verificationStatus: 'APPROVED' });

  // 3. Create Farmer B (Approved)
  const fBRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Farmer Basavaraj',
    email: 'basava@farm.test',
    phone: '9880022222',
    password: 'Password123',
    farmLocation: { address: 'Survey 22', district: 'Dharwad', state: 'Karnataka', pincode: '580001' },
    cropTypes: ['Mangoes'],
    farmingMethod: 'NATURAL',
  });
  farmerTokenB = fBRes.body.data.accessToken;
  farmerDocB = fBRes.body.data.farmer;
  await Farmer.findByIdAndUpdate(farmerDocB._id, { verificationStatus: 'APPROVED' });

  // 4. Create Farmer C (Pending / Unapproved)
  const fCRes = await request(app).post('/api/auth/signup/farmer').send({
    name: 'Farmer Chandru',
    email: 'chandru@farm.test',
    phone: '9880033333',
    password: 'Password123',
    farmLocation: { address: 'Survey 99', district: 'Mandya', state: 'Karnataka', pincode: '571401' },
    cropTypes: ['Potatoes'],
    farmingMethod: 'CONVENTIONAL',
  });
  farmerTokenC = fCRes.body.data.accessToken;
  farmerDocC = fCRes.body.data.farmer; // remains PENDING

  // 5. Create Consumer 1
  const c1Res = await request(app).post('/api/auth/signup/consumer').send({
    name: 'Pooja Hegde',
    email: 'pooja@consumer.test',
    phone: '9845012345',
    password: 'Password123',
  });
  consumerToken1 = c1Res.body.data.accessToken;
  consumerDoc1 = c1Res.body.data.user;

  // 6. Create Consumer 2 (for authorization isolation tests)
  const c2Res = await request(app).post('/api/auth/signup/consumer').send({
    name: 'Rahul Dravid',
    email: 'rahul@consumer.test',
    phone: '9845098765',
    password: 'Password123',
  });
  consumerToken2 = c2Res.body.data.accessToken;
  consumerDoc2 = c2Res.body.data.user;

  // 7. Create Products
  productTomato = await Product.create({
    name: 'Organic Tomatoes',
    description: 'Fresh organic ripe red tomatoes direct from farm',
    category: categoryVeg._id,
    farmer: farmerDocA._id,
    price: 40,
    unit: 'kg',
    quantity: 10,
    harvestDate: new Date(),
    isOrganic: true,
    location: { district: 'Kolar', state: 'Karnataka' },
    isActive: true,
  });

  productMango = await Product.create({
    name: 'Alphonso Mangoes',
    description: 'Sweet naturally ripened Dharwad Alphonso mangoes',
    category: categoryFruits._id,
    farmer: farmerDocB._id,
    price: 300,
    unit: 'kg',
    quantity: 5,
    harvestDate: new Date(),
    isOrganic: false,
    location: { district: 'Dharwad', state: 'Karnataka' },
    isActive: true,
  });

  // Potato belongs to unapproved Farmer C
  productPotato = await Product.create({
    name: 'Mandya Potatoes',
    description: 'Farm fresh conventional potatoes',
    category: categoryVeg._id,
    farmer: farmerDocC._id,
    price: 30,
    unit: 'kg',
    quantity: 20,
    harvestDate: new Date(),
    isOrganic: false,
    location: { district: 'Mandya', state: 'Karnataka' },
    isActive: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('1. Cart Validation & Authoritative Calculations', () => {
  it('calculates authoritative subtotal, delivery fee, and total for valid items', async () => {
    const res = await request(app)
      .post('/api/cart/validate')
      .send({
        items: [
          { productId: productTomato._id, quantity: 2 }, // 2 * 40 = 80
          { productId: productMango._id, quantity: 1 },  // 1 * 300 = 300 -> subtotal 380, delivery fee 40, total 420
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.subtotal).toBe(380);
    expect(res.body.data.deliveryFee).toBe(40);
    expect(res.body.data.total).toBe(420);
    expect(res.body.data.items).toHaveLength(2);
  });

  it('provides free delivery fee when subtotal is ₹500 or greater', async () => {
    const res = await request(app)
      .post('/api/cart/validate')
      .send({
        items: [{ productId: productMango._id, quantity: 2 }], // 2 * 300 = 600
      });

    expect(res.status).toBe(200);
    expect(res.body.data.subtotal).toBe(600);
    expect(res.body.data.deliveryFee).toBe(0);
    expect(res.body.data.total).toBe(600);
  });

  it('rejects unapproved farmer products with issue warning', async () => {
    const res = await request(app)
      .post('/api/cart/validate')
      .send({
        items: [{ productId: productPotato._id, quantity: 2 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.isValid).toBe(false);
    expect(res.body.data.issues[0].type).toBe('FARMER_UNAPPROVED');
  });

  it('detects insufficient inventory and flags issue', async () => {
    const res = await request(app)
      .post('/api/cart/validate')
      .send({
        items: [{ productId: productMango._id, quantity: 99 }], // only 5 in stock
      });

    expect(res.status).toBe(200);
    expect(res.body.data.isValid).toBe(false);
    expect(res.body.data.issues[0].type).toBe('INSUFFICIENT_STOCK');
    expect(res.body.data.issues[0].availableQuantity).toBe(5);
  });

  it('detects negative or zero quantities as invalid', async () => {
    const res = await request(app)
      .post('/api/cart/validate')
      .send({
        items: [{ productId: productTomato._id, quantity: -2 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.isValid).toBe(false);
    expect(res.body.data.issues[0].type).toBe('INVALID_QUANTITY');
  });

  it('identifies price discrepancies between stale frontend price and authoritative DB price', async () => {
    const res = await request(app)
      .post('/api/cart/validate')
      .send({
        items: [{ productId: productTomato._id, quantity: 1, price: 25 }], // DB price is 40
      });

    expect(res.status).toBe(200);
    expect(res.body.data.issues[0].type).toBe('PRICE_CHANGED');
    expect(res.body.data.items[0].product.price).toBe(40);
  });
});

describe('2. Delivery Slots & Overbooking Prevention', () => {
  it('returns all 5 standard required delivery slots with capacity', async () => {
    const res = await request(app).get('/api/delivery-slots?date=2026-09-30');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const slotNames = res.body.data.map((s) => s.slotName);
    expect(slotNames).toEqual(
      expect.arrayContaining([
        '08:00–10:00',
        '10:00–12:00',
        '12:00–14:00',
        '16:00–18:00',
        '18:00–20:00',
      ])
    );
  });

  it('prevents overbooking when a delivery slot exceeds max capacity for a date', async () => {
    // Set a tiny maxCapacity on 16:00–18:00 slot to test overbooking
    await DeliverySlot.findOneAndUpdate({ slotName: '16:00–18:00' }, { maxCapacity: 1 });

    const testAddress = {
      fullName: 'Anita Sharma',
      phone: '9880011223',
      street: '12th Cross, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    };

    // First booking consumes capacity
    const firstOrder = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        items: [{ productId: productTomato._id, quantity: 1 }],
        deliveryAddress: testAddress,
        deliveryDate: '2026-10-05',
        deliverySlot: '16:00–18:00',
      });
    expect(firstOrder.status).toBe(201);

    // Second booking on same date and slot must be rejected due to overbooking
    const secondOrder = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        items: [{ productId: productTomato._id, quantity: 1 }],
        deliveryAddress: testAddress,
        deliveryDate: '2026-10-05',
        deliverySlot: '16:00–18:00',
      });

    expect(secondOrder.status).toBe(400);
    expect(secondOrder.body.message).toMatch(/fully booked/i);

    // Restore slot capacity
    await DeliverySlot.findOneAndUpdate({ slotName: '16:00–18:00' }, { maxCapacity: 20 });
  });
});

describe('3. Multi-Farmer Cart & Concurrency-Safe Order Creation', () => {
  let createdMultiFarmerOrder;

  it('successfully creates an order containing produce from multiple farmers with atomic stock deduction', async () => {
    const initialTomatoQty = (await Product.findById(productTomato._id)).quantity;
    const initialMangoQty = (await Product.findById(productMango._id)).quantity;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        items: [
          { productId: productTomato._id, quantity: 3 }, // Farmer A
          { productId: productMango._id, quantity: 2 },  // Farmer B
        ],
        deliveryAddress: {
          fullName: 'Pooja Hegde',
          phone: '9845012345',
          street: '404 Green Acres Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        deliveryDate: '2026-10-01',
        deliverySlot: '08:00–10:00',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdMultiFarmerOrder = res.body.data;

    // Verify both farmers are recorded in farmersInvolved
    expect(createdMultiFarmerOrder.farmersInvolved).toHaveLength(2);
    expect(createdMultiFarmerOrder.farmersInvolved).toContain(farmerDocA._id.toString());
    expect(createdMultiFarmerOrder.farmersInvolved).toContain(farmerDocB._id.toString());

    // Verify atomic inventory reduction
    const updatedTomato = await Product.findById(productTomato._id);
    const updatedMango = await Product.findById(productMango._id);
    expect(updatedTomato.quantity).toBe(initialTomatoQty - 3);
    expect(updatedMango.quantity).toBe(initialMangoQty - 2);
  });

  it('prevents overselling when requested quantity exceeds available inventory', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        items: [{ productId: productMango._id, quantity: 50 }], // only 3 left
        deliveryAddress: {
          fullName: 'Pooja Hegde',
          phone: '9845012345',
          street: '404 Green Acres',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        deliveryDate: '2026-10-02',
        deliverySlot: '10:00–12:00',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient stock/i);
  });

  it('rejects order creation containing unapproved farmer product', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        items: [{ productId: productPotato._id, quantity: 2 }],
        deliveryAddress: {
          fullName: 'Pooja Hegde',
          phone: '9845012345',
          street: '404 Green Acres',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        deliveryDate: '2026-10-02',
        deliverySlot: '10:00–12:00',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unapproved producer/i);
  });
});

describe('4. Authorization & BOLA Security', () => {
  let order1;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        items: [{ productId: productTomato._id, quantity: 1 }],
        deliveryAddress: {
          fullName: 'Pooja Hegde',
          phone: '9845012345',
          street: '404 Green Acres',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        deliveryDate: '2026-10-03',
        deliverySlot: '12:00–14:00',
      });
    order1 = res.body.data;
  });

  it('prevents Consumer 2 from accessing Consumer 1’s order (BOLA protection)', async () => {
    const res = await request(app)
      .get(`/api/orders/${order1._id}`)
      .set('Authorization', `Bearer ${consumerToken2}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  it('prevents Farmer B from updating Farmer A’s order', async () => {
    const res = await request(app)
      .patch(`/api/orders/${order1._id}/status`)
      .set('Authorization', `Bearer ${farmerTokenB}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('prevents consumer from arbitrary status advancement to DELIVERED', async () => {
    const res = await request(app)
      .patch(`/api/orders/${order1._id}/status`)
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({ status: 'DELIVERED' });

    expect(res.status).toBe(403);
  });
});

describe('5. Order Cancellation & Stock Restoration', () => {
  it('allows consumer to cancel order in PLACED state and atomically restores stock', async () => {
    // 1. Check stock before order
    const stockBefore = (await Product.findById(productTomato._id)).quantity;

    // 2. Place order for 2 tomatoes
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        items: [{ productId: productTomato._id, quantity: 2 }],
        deliveryAddress: {
          fullName: 'Pooja Hegde',
          phone: '9845012345',
          street: '404 Green Acres',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        deliveryDate: '2026-10-04',
        deliverySlot: '18:00–20:00',
      });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.data._id;

    const stockDeducted = (await Product.findById(productTomato._id)).quantity;
    expect(stockDeducted).toBe(stockBefore - 2);

    // 3. Cancel order
    const cancelRes = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({ reason: 'Changed mind about quantity' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // 4. Verify stock restored
    const stockRestored = (await Product.findById(productTomato._id)).quantity;
    expect(stockRestored).toBe(stockBefore);
  });
});

describe('6. Order Invoice Generation', () => {
  it('generates a complete professional tax invoice for the order', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        items: [{ productId: productTomato._id, quantity: 1 }],
        deliveryAddress: {
          fullName: 'Pooja Hegde',
          phone: '9845012345',
          street: '404 Green Acres',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        deliveryDate: '2026-10-04',
        deliverySlot: '08:00–10:00',
      });

    const invoiceRes = await request(app)
      .get(`/api/orders/${orderRes.body.data._id}/invoice`)
      .set('Authorization', `Bearer ${consumerToken1}`);

    expect(invoiceRes.status).toBe(200);
    expect(invoiceRes.body.success).toBe(true);
    expect(invoiceRes.body.data.invoiceNumber).toMatch(/^INV-/);
    expect(invoiceRes.body.data.financials.total).toBeGreaterThan(0);
    expect(invoiceRes.body.data.items).toHaveLength(1);
    expect(invoiceRes.body.data.items[0].productName).toBe('Organic Tomatoes');
  });
});

describe('7. End-to-End Purchasing Flow & Purchase-Gated Reviews', () => {
  let flowOrder;

  it('runs complete lifecycle: Consumer Order -> Farmer Confirm -> Prepare -> Ready -> Dispatch -> Delivered -> Review', async () => {
    // Step 1: Consumer creates order
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        items: [{ productId: productTomato._id, quantity: 1 }],
        deliveryAddress: {
          fullName: 'Pooja Hegde',
          phone: '9845012345',
          street: '404 Green Acres',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
        deliveryDate: '2026-10-06',
        deliverySlot: '10:00–12:00',
      });
    expect(orderRes.status).toBe(201);
    flowOrder = orderRes.body.data;
    expect(flowOrder.status).toBe('PLACED');

    // Step 2: Consumer attempts review before delivery -> Must be rejected (400)
    const earlyReview = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        orderId: flowOrder._id,
        productId: productTomato._id,
        productRating: 5,
        farmerRating: 5,
        comment: 'Premature review attempt',
      });
    expect(earlyReview.status).toBe(400);
    expect(earlyReview.body.message).toMatch(/DELIVERED/i);

    // Step 3: Farmer A Confirms Order
    const confirmRes = await request(app)
      .patch(`/api/orders/${flowOrder._id}/status`)
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({ status: 'CONFIRMED' });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('CONFIRMED');

    // Step 4: Farmer A Prepares Order
    const prepRes = await request(app)
      .patch(`/api/orders/${flowOrder._id}/status`)
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({ status: 'PREPARING' });
    expect(prepRes.status).toBe(200);
    expect(prepRes.body.data.status).toBe('PREPARING');

    // Consumer attempts to cancel after preparation started -> Must be rejected
    const lateCancel = await request(app)
      .patch(`/api/orders/${flowOrder._id}/cancel`)
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({ reason: 'Too late cancellation' });
    expect(lateCancel.status).toBe(400);

    // Step 5: Farmer A Marks Ready For Delivery
    const readyRes = await request(app)
      .patch(`/api/orders/${flowOrder._id}/status`)
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({ status: 'READY_FOR_DELIVERY' });
    expect(readyRes.status).toBe(200);

    // Step 6: Dispatch / Out for Delivery
    const dispatchRes = await request(app)
      .patch(`/api/orders/${flowOrder._id}/status`)
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({ status: 'OUT_FOR_DELIVERY' });
    expect(dispatchRes.status).toBe(200);

    // Step 7: Mark Delivered
    const deliverRes = await request(app)
      .patch(`/api/orders/${flowOrder._id}/status`)
      .set('Authorization', `Bearer ${farmerTokenA}`)
      .send({ status: 'DELIVERED' });
    expect(deliverRes.status).toBe(200);
    expect(deliverRes.body.data.status).toBe('DELIVERED');

    // Step 8: Consumer 2 attempts review on Consumer 1’s order -> Forbidden (403)
    const unauthorizedReview = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${consumerToken2}`)
      .send({
        orderId: flowOrder._id,
        productId: productTomato._id,
        productRating: 5,
        farmerRating: 5,
        comment: 'Fake review attempt',
      });
    expect(unauthorizedReview.status).toBe(403);

    // Step 9: Legitimate Consumer 1 submits verified purchase review
    const verifiedReview = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        orderId: flowOrder._id,
        productId: productTomato._id,
        productRating: 5,
        farmerRating: 5,
        comment: 'Incredible farm-fresh organic tomatoes! Crisp and sweet.',
      });
    expect(verifiedReview.status).toBe(201);
    expect(verifiedReview.body.success).toBe(true);

    // Step 10: Duplicate review prevention
    const duplicateReview = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${consumerToken1}`)
      .send({
        orderId: flowOrder._id,
        productId: productTomato._id,
        productRating: 4,
        farmerRating: 4,
        comment: 'Second review attempt',
      });
    expect(duplicateReview.status).toBe(409);

    // Step 11: Verify ratings updated on Product & Farmer
    const updatedProd = await Product.findById(productTomato._id);
    expect(updatedProd.rating.average).toBe(5);
    expect(updatedProd.rating.count).toBeGreaterThanOrEqual(1);

    const updatedFarmer = await Farmer.findById(farmerDocA._id);
    expect(updatedFarmer.rating.average).toBe(5);
    expect(updatedFarmer.rating.count).toBeGreaterThanOrEqual(1);
  });
});
