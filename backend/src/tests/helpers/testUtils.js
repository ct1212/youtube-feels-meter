/**
 * Testing utilities and helper functions
 */

import { jest } from '@jest/globals';

/**
 * Create a mock cache service
 */
export function createMockCache() {
  const cache = new Map();

  return {
    get: jest.fn(async (key) => cache.get(key) || null),
    set: jest.fn(async (key, value) => cache.set(key, value)),
    del: jest.fn(async (key) => cache.delete(key)),
    clear: jest.fn(async () => cache.clear()),
    has: jest.fn(async (key) => cache.has(key)),
    mget: jest.fn(async (keys) => keys.map(key => cache.get(key) || null)),
    mset: jest.fn(async (entries) => {
      entries.forEach(([key, value]) => cache.set(key, value));
    }),
    _internalCache: cache // For testing purposes
  };
}

/**
 * Create mock Express request object
 */
export function mockRequest(options = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    method: 'GET',
    url: '/',
    ip: '127.0.0.1',
    ...options
  };
}

/**
 * Create mock Express response object
 */
export function mockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    statusCode: 200
  };
  return res;
}

/**
 * Create mock Express next function
 */
export function mockNext() {
  return jest.fn();
}

/**
 * Wait for a specified number of milliseconds
 */
export function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a deferred promise for testing async operations
 */
export function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Suppress console output during test execution
 */
export function suppressConsole() {
  const originalConsole = { ...console };

  beforeAll(() => {
    global.console = {
      ...console,
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  });

  afterAll(() => {
    global.console = originalConsole;
  });
}

/**
 * Capture console output during tests
 */
export function captureConsole() {
  const logs = [];
  const originalLog = console.log;

  beforeEach(() => {
    logs.length = 0;
    console.log = jest.fn((...args) => {
      logs.push(args.join(' '));
    });
  });

  afterEach(() => {
    console.log = originalLog;
  });

  return logs;
}
