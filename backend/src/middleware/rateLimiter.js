/**
 * Rate limiting middleware to prevent API abuse
 */

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Default: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: true,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limiter for expensive operations (analysis)
 * 10 requests per 15 minutes
 */
export const analyzeRateLimiter = rateLimit({
  windowMs: 900000, // 15 minutes
  max: 10,
  message: {
    error: true,
    message: 'Analysis rate limit exceeded. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Playlist fetch rate limiter
 * 20 requests per 15 minutes
 */
export const playlistRateLimiter = rateLimit({
  windowMs: 900000, // 15 minutes
  max: 20,
  message: {
    error: true,
    message: 'Playlist fetch rate limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
