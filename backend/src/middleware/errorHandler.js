/**
 * Global error handling middleware
 */

export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err.message.includes('YouTube API')) {
    status = 502;
    message = `YouTube API error: ${err.message}`;
  } else if (err.message.includes('Spotify')) {
    status = 502;
    message = `Spotify API error: ${err.message}`;
  }

  res.status(status).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: true,
    message: 'Route not found'
  });
}
