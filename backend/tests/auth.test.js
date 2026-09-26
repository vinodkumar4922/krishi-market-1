const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Farmer = require('../src/models/Farmer');
const RefreshToken = require('../src/models/RefreshToken');

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
  await RefreshToken.deleteMany({});
});

describe('Authentication & User Management Suite', () => {
  // 1. Consumer Registration
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
    expect(res.body.data.user.accountStatus).toBe('ACTIVE');
    expect(res.body.data.user.passwordHash).toBeUndefined(); // ensure hash is never returned
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  // 2. Duplicate Registration Rejection
  test('POST /api/auth/signup/consumer should reject duplicate email with 409', async () => {
    await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Pooja Verma',
        email: 'duplicate@example.com',
        phone: '+91 9988776655',
        password: 'Password123',
      });

    const duplicateRes = await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Another User',
        email: 'duplicate@example.com',
        phone: '+91 9111222333',
        password: 'Password456',
      });

    expect(duplicateRes.statusCode).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
  });

  // 3. Farmer Registration with PENDING status
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

  // 4. Password Hashing Verification
  test('Password must be hashed with bcrypt in the database and never stored in plaintext', async () => {
    const rawPassword = 'SecureRawPassword123!';
    await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Hash Tester',
        email: 'hash@example.com',
        phone: '+91 9876543210',
        password: rawPassword,
      });

    const userDoc = await User.findOne({ email: 'hash@example.com' }).select('+passwordHash');
    expect(userDoc).toBeDefined();
    expect(userDoc.passwordHash).not.toBe(rawPassword);
    // Bcrypt hashes start with $2a$, $2b$, or $2y$
    expect(userDoc.passwordHash).toMatch(/^\$2[aby]\$\d+\$/);

    const isMatch = await userDoc.comparePassword(rawPassword);
    expect(isMatch).toBe(true);

    const isWrongMatch = await userDoc.comparePassword('WrongPassword');
    expect(isWrongMatch).toBe(false);
  });

  // 5. Successful Login
  test('POST /api/auth/login should authenticate valid credentials', async () => {
    await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Valid Consumer',
        email: 'valid@example.com',
        phone: '+91 9876543210',
        password: 'Password123',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'valid@example.com',
        password: 'Password123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('valid@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  // 6. Invalid Login (Wrong Password & Non-existent User)
  test('POST /api/auth/login should reject invalid credentials with generic message', async () => {
    await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Karan Mehra',
        email: 'karan@example.com',
        phone: '+91 9876543211',
        password: 'CorrectPassword123',
      });

    // Attempt login with wrong password
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'karan@example.com',
        password: 'WrongPassword!',
      });

    expect(wrongPassRes.statusCode).toBe(401);
    expect(wrongPassRes.body.success).toBe(false);
    expect(wrongPassRes.body.message).toBe('Invalid email or password');

    // Attempt login with non-existent user
    const noUserRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'SomePassword123',
      });

    expect(noUserRes.statusCode).toBe(401);
    expect(noUserRes.body.message).toBe('Invalid email or password');
  });

  // 7. Account Status Check (Suspended Users Blocked)
  test('Suspended user account is rejected on login and token verification', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Suspended User',
        email: 'suspended@example.com',
        phone: '+91 9000000000',
        password: 'Password123',
      });

    const token = signupRes.body.data.accessToken;

    // Suspend user
    await User.findOneAndUpdate({ email: 'suspended@example.com' }, { accountStatus: 'SUSPENDED' });

    // Attempt login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'suspended@example.com',
        password: 'Password123',
      });

    expect(loginRes.statusCode).toBe(403);
    expect(loginRes.body.message).toContain('suspended');

    // Attempt authenticated route with existing token
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.statusCode).toBe(403);
    expect(meRes.body.message).toContain('suspended');
  });

  // 8. Token Refresh and Rotation
  test('POST /api/auth/refresh should rotate refresh token and issue new token pair', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Refresh User',
        email: 'refresh@example.com',
        phone: '+91 9888877777',
        password: 'Password123',
      });

    const initialRefreshToken = signupRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    expect(refreshRes.statusCode).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).not.toBe(initialRefreshToken);

    // Old token should now be revoked (replay attack defense)
    const replayRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: initialRefreshToken });

    expect(replayRes.statusCode).toBe(401);
  });

  // 9. Logout Revokes Session
  test('POST /api/auth/logout should revoke the refresh token', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Logout User',
        email: 'logout@example.com',
        phone: '+91 9777766666',
        password: 'Password123',
      });

    const refreshToken = signupRes.body.data.refreshToken;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });

    expect(logoutRes.statusCode).toBe(200);

    // Token should no longer be usable for refresh
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.statusCode).toBe(401);
  });

  // 10. Input Validation Rejections
  test('Registration rejects invalid emails, short passwords, and missing fields', async () => {
    const badEmailRes = await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Bad Email',
        email: 'not-an-email',
        phone: '+91 9999988888',
        password: 'Password123',
      });
    expect(badEmailRes.statusCode).toBe(400);
    expect(badEmailRes.body.message).toContain('Validation failed');

    const shortPassRes = await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: 'Short Pass',
        email: 'shortpass@example.com',
        phone: '+91 9999988888',
        password: '123', // < 6 chars
      });
    expect(shortPassRes.statusCode).toBe(400);

    const missingNameRes = await request(app)
      .post('/api/auth/signup/consumer')
      .send({
        name: '',
        email: 'noname@example.com',
        phone: '+91 9999988888',
        password: 'Password123',
      });
    expect(missingNameRes.statusCode).toBe(400);
  });

  // 11. Profile & Authentication Headers
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

  test('GET /api/auth/me should reject request without token or with malformed token', async () => {
    const noTokenRes = await request(app).get('/api/auth/me');
    expect(noTokenRes.statusCode).toBe(401);

    const badTokenRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token-string');
    expect(badTokenRes.statusCode).toBe(401);
  });
});
