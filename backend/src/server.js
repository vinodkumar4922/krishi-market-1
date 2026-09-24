const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const path = require('path');

const { PORT, NODE_ENV, FRONTEND_URL } = require('./config/env');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { seedFullDemoData } = require('./config/seedDemo');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Body parsing with payload size limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// NoSQL injection prevention
app.use(mongoSanitize());

// Request logging in development
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static directory for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// General API rate limiting
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Krishi Market Backend API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    // Automatically ensure full realistic demo data is present
    await seedFullDemoData();

    app.listen(PORT, () => {
      console.log(`🚀 Krishi Market Server running on http://localhost:${PORT} in ${NODE_ENV} mode`);
    });
  });
}

module.exports = app;
