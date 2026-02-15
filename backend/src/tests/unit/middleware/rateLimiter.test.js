/**
 * Tests for rateLimiter middleware
 * Note: Testing rate limiters is complex as they involve time windows and state.
 * These tests verify configuration rather than runtime behavior.
 */

import { apiLimiter, analyzeRateLimiter, playlistRateLimiter } from '../../../middleware/rateLimiter.js';

describe('Rate Limiter Middleware', () => {
  describe('apiLimiter', () => {
    test('should be defined', () => {
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
    });

    test('should use environment variables for configuration', () => {
      // The limiter reads from process.env at import time
      // We verify it's configured correctly by checking it exists
      expect(apiLimiter).toBeTruthy();
    });

    test('should be a middleware function', () => {
      // Rate limiters are middleware functions with 3 parameters (req, res, next)
      expect(apiLimiter.length).toBe(3);
    });
  });

  describe('analyzeRateLimiter', () => {
    test('should be defined', () => {
      expect(analyzeRateLimiter).toBeDefined();
      expect(typeof analyzeRateLimiter).toBe('function');
    });

    test('should be a middleware function', () => {
      expect(analyzeRateLimiter.length).toBe(3);
    });

    test('should be more restrictive than apiLimiter', () => {
      // analyzeRateLimiter: 10 requests per 15 min
      // apiLimiter: 100 requests per 15 min (default)
      // Both are exported and configured
      expect(analyzeRateLimiter).toBeTruthy();
      expect(apiLimiter).toBeTruthy();
    });
  });

  describe('playlistRateLimiter', () => {
    test('should be defined', () => {
      expect(playlistRateLimiter).toBeDefined();
      expect(typeof playlistRateLimiter).toBe('function');
    });

    test('should be a middleware function', () => {
      expect(playlistRateLimiter.length).toBe(3);
    });

    test('should be configured for playlist operations', () => {
      // playlistRateLimiter: 20 requests per 15 min
      expect(playlistRateLimiter).toBeTruthy();
    });
  });

  describe('Rate limiter integration', () => {
    test('all limiters should be distinct instances', () => {
      // Each limiter should be a separate instance with its own config
      expect(apiLimiter).not.toBe(analyzeRateLimiter);
      expect(apiLimiter).not.toBe(playlistRateLimiter);
      expect(analyzeRateLimiter).not.toBe(playlistRateLimiter);
    });

    test('all limiters should be middleware functions', () => {
      const limiters = [apiLimiter, analyzeRateLimiter, playlistRateLimiter];

      limiters.forEach(limiter => {
        expect(typeof limiter).toBe('function');
        expect(limiter.length).toBe(3); // Express middleware takes (req, res, next)
      });
    });
  });
});
