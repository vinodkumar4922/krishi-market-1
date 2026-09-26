/**
 * Centralized Application Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Safe logging in dev / non-prod environments
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message || err);
  }

  // 1. Malformed JSON Body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body.',
    });
  }

  // 2. Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for resource identifier: ${err.value}`,
    });
  }

  // 3. Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `An account or record with this ${field} already exists.`,
    });
  }

  // 4. Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed: ' + messages.join(', '),
      errors: messages,
    });
  }

  // 5. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired. Please refresh your session.',
    });
  }

  // 6. Multer File Upload Errors & Upload Filter Errors
  if (
    err.name === 'MulterError' ||
    (err.message && (err.message.includes('Invalid image file type') || err.message.includes('path traversal') || err.message.includes('file format')))
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // 7. General Status Code
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const isProduction = process.env.NODE_ENV === 'production';

  // Ensure database credentials and internal details are never leaked in error messages
  let safeMessage = err.message || 'An unexpected error occurred.';
  if (isProduction && statusCode === 500) {
    safeMessage = 'An unexpected internal server error occurred.';
  }

  return res.status(statusCode).json({
    success: false,
    message: safeMessage,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = { errorHandler };
