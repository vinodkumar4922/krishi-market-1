require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || process.env.SERVER_PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'krishi-market-development-jwt-access-secret-2026');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (NODE_ENV === 'production' ? null : 'krishi-market-development-jwt-refresh-secret-2026');

if (NODE_ENV === 'production' && (!JWT_SECRET || !JWT_REFRESH_SECRET)) {
  throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET and JWT_REFRESH_SECRET must be explicitly defined in production environment.');
}

module.exports = {
  PORT: Number(PORT),
  MONGODB_URI,
  DATABASE_URL: MONGODB_URI,
  JWT_SECRET: JWT_SECRET || 'krishi-market-development-jwt-access-secret-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_SECRET: JWT_REFRESH_SECRET || 'krishi-market-development-jwt-refresh-secret-2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  NODE_ENV,
  FRONTEND_URL,
  CLIENT_URL: FRONTEND_URL,
};

