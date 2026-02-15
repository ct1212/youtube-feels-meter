/**
 * Tests for errorHandler middleware
 */

import { jest } from '@jest/globals';
import { errorHandler, notFoundHandler } from '../../../middleware/errorHandler.js';
import { mockRequest, mockResponse, mockNext } from '../../helpers/testUtils.js';

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('errorHandler', () => {
    test('should handle generic errors with 500 status', () => {
      const err = new Error('Something went wrong');
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Something went wrong'
      });
    });

    test('should use error.status if provided', () => {
      const err = new Error('Bad request');
      err.status = 400;
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Bad request'
      });
    });

    test('should handle ValidationError with 400 status', () => {
      const err = new Error('Invalid input');
      err.name = 'ValidationError';
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Invalid input'
      });
    });

    test('should handle UnauthorizedError with 401 status', () => {
      const err = new Error('Not authorized');
      err.name = 'UnauthorizedError';
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Unauthorized'
      });
    });

    test('should handle YouTube API errors with 502 status', () => {
      const err = new Error('YouTube API quota exceeded');
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'YouTube API error: YouTube API quota exceeded'
      });
    });

    test('should handle Spotify API errors with 502 status', () => {
      const err = new Error('Spotify authentication failed');
      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Spotify API error: Spotify authentication failed'
      });
    });

    test('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const err = new Error('Dev error');
      err.stack = 'Error stack trace';
      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Dev error',
        stack: 'Error stack trace'
      });

      process.env.NODE_ENV = originalEnv;
    });

    test('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const err = new Error('Prod error');
      err.stack = 'Error stack trace';
      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Prod error'
      });

      process.env.NODE_ENV = originalEnv;
    });

    test('should log error to console', () => {
      const err = new Error('Logged error');
      errorHandler(err, req, res, next);

      expect(console.error).toHaveBeenCalledWith('Error:', err);
    });

    test('should use default message for errors without message', () => {
      const err = new Error();
      err.message = '';
      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Internal server error'
      });
    });
  });

  describe('notFoundHandler', () => {
    test('should return 404 status', () => {
      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should return route not found message', () => {
      notFoundHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Route not found'
      });
    });

    test('should work for any undefined route', () => {
      req.url = '/some/random/path';
      req.method = 'GET';
      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Route not found'
      });
    });
  });
});
