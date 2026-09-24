const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Farmer = require('../src/models/Farmer');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Farmer.deleteMany({});
});

describe('Authentication & Authorization Suite', () => {
  test('POST /api/auth/signup/consumer should register a new consumer', async () => {
    const res = await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Pooja Verma',
        email: 'pooja@example.com',
        phone: '+91 9988776655',
        password: 'Password123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('CONSUMER');
    expect(res.body.data.user.passwordHash).toBeUndefined(); // ensure hash is never returned
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('POST /api/auth/signup/farmer should register farmer with status PENDING', async () => {
    const res = await request(app)
      .post('/api/auth/signup/farmer')
      .send({
        name: 'Suresh Patil',
        email: 'suresh@farmer.com',
        phone: '+91 9123456780',
        password: 'FarmerPass123',
        farmLocation: {
          address: 'Plot 10, Farm Lane',
          district: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
        },
        cropTypes: ['Tomatoes', 'Potatoes'],
        farmingMethod: 'ORGANIC',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('FARMER');
    expect(res.body.data.farmer.verificationStatus).toBe('PENDING');
  });

  test('POST /api/auth/login should reject invalid credentials with generic message', async () => {
    // Create user first
    await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Karan Mehra',
        email: 'karan@example.com',
        phone: '+91 9876543211',
        password: 'CorrectPassword123',
      });

    // Attempt login with wrong password
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'karan@example.com',
        password: 'WrongPassword!',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('GET /api/auth/me should return authenticated user details with token', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Anil Das',
        email: 'anil@example.com',
        phone: '+91 9776655443',
        password: 'Password123',
      });

    const token = signupRes.body.data.accessToken;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.data.user.email).toBe('anil@example.com');
  });

  test('GET /api/auth/me should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});
