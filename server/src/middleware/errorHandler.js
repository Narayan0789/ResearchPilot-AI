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

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const errorDetails = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: errorDetails[0]?.message || 'Validation error',
      details: errorDetails,
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
