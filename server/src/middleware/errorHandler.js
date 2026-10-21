import logger from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(`Unhandled API Error: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File size exceeds the limit (${process.env.MAX_UPLOAD_MB || 20}MB).`,
      });
    }
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
  }

  // Handle Zod validation errors (supports both Zod 3 err.errors and Zod 4 err.issues)
  if (err.name === 'ZodError' || Array.isArray(err.issues)) {
    const issues = err.issues || (Array.isArray(err.errors) ? err.errors : []);
    const errorDetails = issues.map((e) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: errorDetails[0]?.message || 'Validation error',
      details: errorDetails,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: messages[0] || 'Database validation error',
      details: messages,
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `A record with this ${field} already exists.`,
    });
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid resource identifier format.',
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error. Please try again later.'
    : err.message || 'An unexpected error occurred.';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
