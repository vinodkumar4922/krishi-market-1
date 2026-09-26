const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
} = require('../config/env');

const { v4: uuidv4 } = require('uuid');

/**
 * Calculates Date object for JWT refresh token expiry
 * @param {string} expiryStr - e.g. '7d', '24h', '30m'
 * @returns {Date}
 */
const getExpiryDate = (expiryStr = JWT_REFRESH_EXPIRES_IN) => {
  const match = String(expiryStr).match(/^(\d+)([smhd])$/);
  const now = Date.now();
  if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);

  const num = parseInt(match[1], 10);
  const unit = match[2];
  let ms = num * 1000;
  if (unit === 'm') ms *= 60;
  else if (unit === 'h') ms *= 3600;
  else if (unit === 'd') ms *= 86400;

  return new Date(now + ms);
};

/**
 * Signs a short-lived access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      accountStatus: user.accountStatus,
      jti: uuidv4(),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Signs a cryptographically signed refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      type: 'refresh',
      jti: uuidv4(),
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};


/**
 * Creates and persists a session refresh token in database
 */
const createSessionToken = async (user, ipAddress = '', userAgent = '') => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const expiresAt = getExpiryDate();

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
    isRevoked: false,
    createdByIp: ipAddress,
    userAgent,
  });

  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
};

/**
 * Verifies access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Verifies and rotates a refresh token, issuing new credentials
 */
const rotateRefreshToken = async (oldToken, ipAddress = '', userAgent = '') => {
  let decoded;
  try {
    decoded = jwt.verify(oldToken, JWT_REFRESH_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired refresh token.');
  }

  const tokenDoc = await RefreshToken.findOne({ token: oldToken });

  // Detection of Token Reuse (Potential Theft / Replay Attack)
  if (!tokenDoc || tokenDoc.isRevoked) {
    if (tokenDoc && tokenDoc.isRevoked) {
      // Possible compromise: Revoke ALL active sessions for this compromised user
      await RefreshToken.updateMany(
        { user: decoded.id, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
      );
    }
    throw new Error('Refresh token is invalid or has already been used.');
  }

  if (tokenDoc.expiresAt < new Date()) {
    tokenDoc.isRevoked = true;
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();
    throw new Error('Refresh token has expired.');
  }

  // Issue new token pair
  const User = require('../models/User');
  const user = await User.findById(decoded.id);
  if (!user || user.accountStatus === 'SUSPENDED') {
    throw new Error('User account is inactive or suspended.');
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const newExpiresAt = getExpiryDate();

  // Mark old token as revoked and replaced
  tokenDoc.isRevoked = true;
  tokenDoc.revokedAt = new Date();
  tokenDoc.replacedByToken = newRefreshToken;
  await tokenDoc.save();

  // Save new refresh token session
  await RefreshToken.create({
    token: newRefreshToken,
    user: user._id,
    expiresAt: newExpiresAt,
    isRevoked: false,
    createdByIp: ipAddress,
    userAgent,
  });

  return {
    user,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Revokes a refresh token (logout)
 */
const revokeRefreshToken = async (token) => {
  const tokenDoc = await RefreshToken.findOne({ token });
  if (tokenDoc) {
    tokenDoc.isRevoked = true;
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();
  }
};

/**
 * Revokes all tokens for a user
 */
const revokeAllUserTokens = async (userId) => {
  await RefreshToken.updateMany(
    { user: userId, isRevoked: false },
    { isRevoked: true, revokedAt: new Date() }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  createSessionToken,
  verifyAccessToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};
