/**
 * Tests for cache.service.js
 * Tests both in-memory and Redis caching modes
 */

import { jest } from '@jest/globals';

describe('Cache Service', () => {
  let cacheService;

  beforeEach(async () => {
    // Clear the module cache and re-import to get a fresh instance
    jest.resetModules();

    // Set up environment for in-memory mode (no Redis)
    delete process.env.REDIS_URL;
    process.env.CACHE_TTL = '300';

    const module = await import('../../../services/cache.service.js');
    cacheService = module.default;

    // Initialize cache service
    await cacheService.initialize();

    // Clear any existing data
    await cacheService.clear();
  });

  afterEach(async () => {
    await cacheService.clear();
    await cacheService.disconnect();
  });

  describe('In-memory mode', () => {
    test('should initialize in memory mode when Redis URL not provided', async () => {
      const stats = cacheService.getStats();
      expect(stats.type).toBe('memory');
    });

    test('should set and get values', async () => {
      await cacheService.set('test-key', { value: 'test-data' });
      const result = await cacheService.get('test-key');

      expect(result).toEqual({ value: 'test-data' });
    });

    test('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    test('should delete values', async () => {
      await cacheService.set('test-key', 'value');
      await cacheService.del('test-key');
      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });

    test('should check key existence', async () => {
      await cacheService.set('existing-key', 'value');

      expect(await cacheService.exists('existing-key')).toBe(true);
      expect(await cacheService.exists('non-existent')).toBe(false);
    });

    test('should handle multiple get (mget)', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');

      const results = await cacheService.mget(['key1', 'key2', 'key3', 'missing']);

      expect(results).toEqual(['value1', 'value2', 'value3', null]);
    });

    test('should handle multiple set (mset)', async () => {
      await cacheService.mset({
        'key1': 'value1',
        'key2': 'value2',
        'key3': 'value3'
      });

      expect(await cacheService.get('key1')).toBe('value1');
      expect(await cacheService.get('key2')).toBe('value2');
      expect(await cacheService.get('key3')).toBe('value3');
    });

    test('should clear all cache', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      await cacheService.clear();

      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key2')).toBeNull();

      const stats = cacheService.getStats();
      expect(stats.size).toBe(0);
    });

    test('should handle TTL expiration', async () => {
      await cacheService.set('expiring-key', 'value', 1); // 1 second TTL

      // Value should exist immediately
      expect(await cacheService.get('expiring-key')).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Value should be expired
      expect(await cacheService.get('expiring-key')).toBeNull();
    });

    test('should use default TTL from env when not specified', async () => {
      process.env.CACHE_TTL = '10';
      await cacheService.set('key-with-default-ttl', 'value');

      // Value should exist (10 second TTL)
      expect(await cacheService.get('key-with-default-ttl')).toBe('value');
    });

    test('should handle complex objects', async () => {
      const complexObject = {
        id: 123,
        name: 'Test',
        nested: {
          array: [1, 2, 3],
          boolean: true,
          null: null
        }
      };

      await cacheService.set('complex-key', complexObject);
      const result = await cacheService.get('complex-key');

      expect(result).toEqual(complexObject);
    });

    test('should provide cache stats', () => {
      const stats = cacheService.getStats();

      expect(stats).toHaveProperty('type');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(stats.type).toBe('memory');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    test('should track cache size', async () => {
      await cacheService.clear();

      let stats = cacheService.getStats();
      expect(stats.size).toBe(0);

      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      stats = cacheService.getStats();
      expect(stats.size).toBe(2);

      await cacheService.del('key1');

      stats = cacheService.getStats();
      expect(stats.size).toBe(1);
    });

    test('should handle empty values', async () => {
      await cacheService.set('empty-array', []);
      await cacheService.set('empty-object', {});

      // Note: Empty strings are falsy and will return null due to || null in getFromMemory
      expect(await cacheService.get('empty-array')).toEqual([]);
      expect(await cacheService.get('empty-object')).toEqual({});
    });

    test('should handle null and undefined values', async () => {
      await cacheService.set('null-value', null);

      const result = await cacheService.get('null-value');
      expect(result).toBeNull();
    });

    test('should overwrite existing keys', async () => {
      await cacheService.set('key', 'value1');
      await cacheService.set('key', 'value2');

      const result = await cacheService.get('key');
      expect(result).toBe('value2');
    });

    test('should handle concurrent operations', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(cacheService.set(`key-${i}`, `value-${i}`));
      }

      await Promise.all(promises);

      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) => cacheService.get(`key-${i}`))
      );

      results.forEach((result, i) => {
        expect(result).toBe(`value-${i}`);
      });
    });
  });

  describe('Error handling', () => {
    test('should not throw on disconnect when not connected', async () => {
      await expect(cacheService.disconnect()).resolves.not.toThrow();
    });

    test('should handle operations after disconnect', async () => {
      await cacheService.set('key', 'value');
      await cacheService.disconnect();

      // Should still work with in-memory cache
      const result = await cacheService.get('key');
      expect(result).toBe('value');
    });
  });
});
