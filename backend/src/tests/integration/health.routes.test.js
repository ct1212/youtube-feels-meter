/**
 * Integration tests for health endpoint
 */

import request from 'supertest';
import app from '../../app.js';

describe('Health Endpoint', () => {
  describe('GET /health', () => {
    test('should return 200 status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
    });

    test('should return JSON response', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    test('should return status ok', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('status', 'ok');
    });

    test('should return timestamp', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');

      // Validate timestamp is ISO 8601 format
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });

    test('should return uptime', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    test('should have consistent response structure', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toEqual({
        status: expect.any(String),
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });
    });

    test('should work with multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });
    });

    test('should update timestamp on each request', async () => {
      const response1 = await request(app).get('/health');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const response2 = await request(app).get('/health');

      const time1 = new Date(response1.body.timestamp).getTime();
      const time2 = new Date(response2.body.timestamp).getTime();

      expect(time2).toBeGreaterThanOrEqual(time1);
    });
  });

  describe('Error handling', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Route not found');
    });

    test('should return 404 for non-existent API routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});
