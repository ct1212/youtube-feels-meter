/**
 * Cache Service - Handles caching with Redis or in-memory fallback
 */

import { createClient } from 'redis';

class CacheService {
  constructor() {
    this.client = null;
    this.isRedisAvailable = false;
    this.memoryCache = new Map();
    this.ttlMap = new Map(); // Track TTL for memory cache
  }

  /**
   * Initialize Redis client (optional)
   */
  async initialize() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.log('📦 Cache: Using in-memory cache (Redis URL not provided)');
      return;
    }

    try {
      this.client = createClient({ url: redisUrl });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
        this.isRedisAvailable = false;
      });

      this.client.on('connect', () => {
        console.log('📦 Cache: Connected to Redis');
        this.isRedisAvailable = true;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Failed to connect to Redis, falling back to in-memory cache:', error.message);
      this.isRedisAvailable = false;
      this.client = null;
    }

    // Start TTL cleanup for memory cache
    this.startMemoryCacheTTLCleanup();
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (this.isRedisAvailable && this.client) {
      try {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('Redis GET error:', error);
        // Fallback to memory cache
        return this.getFromMemory(key);
      }
    }

    return this.getFromMemory(key);
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key, value, ttlSeconds = null) {
    const ttl = ttlSeconds || parseInt(process.env.CACHE_TTL || '2592000');

    if (this.isRedisAvailable && this.client) {
      try {
        await this.client.setEx(key, ttl, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Redis SET error:', error);
        // Fallback to memory cache
        return this.setInMemory(key, value, ttl);
      }
    }

    return this.setInMemory(key, value, ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key) {
    if (this.isRedisAvailable && this.client) {
      try {
        await this.client.del(key);
      } catch (error) {
        console.error('Redis DEL error:', error);
      }
    }

    this.memoryCache.delete(key);
    this.ttlMap.delete(key);
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.exists(key) === 1;
      } catch (error) {
        console.error('Redis EXISTS error:', error);
        return this.memoryCache.has(key);
      }
    }

    return this.memoryCache.has(key);
  }

  /**
   * Get multiple values at once
   */
  async mget(keys) {
    if (this.isRedisAvailable && this.client) {
      try {
        const values = await this.client.mGet(keys);
        return values.map(v => v ? JSON.parse(v) : null);
      } catch (error) {
        console.error('Redis MGET error:', error);
        return keys.map(key => this.getFromMemory(key));
      }
    }

    return keys.map(key => this.getFromMemory(key));
  }

  /**
   * Set multiple values at once
   */
  async mset(keyValuePairs, ttlSeconds = null) {
    const ttl = ttlSeconds || parseInt(process.env.CACHE_TTL || '2592000');

    if (this.isRedisAvailable && this.client) {
      try {
        const pipeline = this.client.multi();
        for (const [key, value] of Object.entries(keyValuePairs)) {
          pipeline.setEx(key, ttl, JSON.stringify(value));
        }
        await pipeline.exec();
        return true;
      } catch (error) {
        console.error('Redis MSET error:', error);
        for (const [key, value] of Object.entries(keyValuePairs)) {
          this.setInMemory(key, value, ttl);
        }
        return true;
      }
    }

    for (const [key, value] of Object.entries(keyValuePairs)) {
      this.setInMemory(key, value, ttl);
    }
    return true;
  }

  /**
   * Clear all cache
   */
  async clear() {
    if (this.isRedisAvailable && this.client) {
      try {
        await this.client.flushAll();
      } catch (error) {
        console.error('Redis FLUSH error:', error);
      }
    }

    this.memoryCache.clear();
    this.ttlMap.clear();
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isRedisAvailable = false;
    }
  }

  // Private methods for in-memory cache

  getFromMemory(key) {
    const ttlEntry = this.ttlMap.get(key);
    if (ttlEntry && Date.now() > ttlEntry) {
      // Expired
      this.memoryCache.delete(key);
      this.ttlMap.delete(key);
      return null;
    }

    return this.memoryCache.get(key) || null;
  }

  setInMemory(key, value, ttlSeconds) {
    this.memoryCache.set(key, value);
    this.ttlMap.set(key, Date.now() + (ttlSeconds * 1000));
    return true;
  }

  /**
   * Periodically clean up expired entries from memory cache
   */
  startMemoryCacheTTLCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, expiry] of this.ttlMap.entries()) {
        if (now > expiry) {
          this.memoryCache.delete(key);
          this.ttlMap.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      type: this.isRedisAvailable ? 'redis' : 'memory',
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys())
    };
  }
}

// Singleton instance
const cacheService = new CacheService();

export default cacheService;
