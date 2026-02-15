/**
 * Jest setup file - runs before all tests
 * Configures test environment variables and global settings
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.YOUTUBE_API_KEY = 'test-youtube-api-key';
process.env.SPOTIFY_CLIENT_ID = 'test-spotify-client-id';
process.env.SPOTIFY_CLIENT_SECRET = 'test-spotify-client-secret';
process.env.CACHE_TTL = '300'; // 5 minutes
process.env.CACHE_MODE = 'memory'; // Use in-memory cache for tests
process.env.RATE_LIMIT_WINDOW_MS = '60000'; // 1 minute
process.env.RATE_LIMIT_MAX_REQUESTS = '1000'; // High limit for tests

// Configure Jest timeout
jest.setTimeout(10000);

// Optional: Suppress console logs during tests (uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
