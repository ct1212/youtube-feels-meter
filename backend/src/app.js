/**
 * Express application setup
 */

import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import playlistRoutes from './routes/playlist.routes.js';
import analyzeRoutes from './routes/analyze.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'YouTube Feels Meter API',
    version: '1.0.0',
    description: 'Analyze YouTube playlists for mood and emotional vibes using MusicBrainz + genre-based audio analysis',
    endpoints: {
      health: 'GET /health',
      playlist: {
        info: 'POST /api/playlist/info - Get playlist metadata and videos',
        analyze: 'POST /api/playlist/analyze - Full playlist analysis with feels scores'
      },
      analyze: {
        batch: 'POST /api/analyze/batch - Analyze multiple videos',
        single: 'POST /api/analyze/single - Analyze a single video'
      }
    },
    repository: 'https://github.com/ct1212/youtube-feels-meter'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/playlist', playlistRoutes);
app.use('/api/analyze', analyzeRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
