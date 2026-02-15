/**
 * Vercel serverless function entry point
 * Initializes services and exports the Express app
 */

import app from '../src/app.js';
import cacheService from '../src/services/cache.service.js';
import musicAnalysisService from '../src/services/music-analysis.service.js';

// Initialize services on cold start (only runs once per serverless instance)
let initialized = false;

async function initializeServices() {
  if (!initialized) {
    console.log('🚀 Initializing services for serverless...');
    await cacheService.initialize();
    await musicAnalysisService.initialize();
    initialized = true;
    console.log('✅ Services initialized');
  }
}

// Vercel handler function
export default async function handler(req, res) {
  await initializeServices();
  return app(req, res);
}
