/**
 * Server entry point
 */

import dotenv from 'dotenv';
import app from './app.js';
import cacheService from './services/cache.service.js';
import musicAnalysisService from './services/music-analysis.service.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['YOUTUBE_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const PORT = process.env.PORT || 3001;

// Initialize services
await cacheService.initialize();
await musicAnalysisService.initialize();

// Start server
const server = app.listen(PORT, () => {
  console.log('\n🎵 YouTube Feels Meter Backend');
  console.log('================================');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Cache: ${cacheService.getStats().type}`);
  console.log(`🎵 Music Analysis: MusicBrainz + Genre Heuristics`);
  console.log(`💰 Cost: 100% FREE - No API costs!`);
  console.log('\n✨ Ready to analyze playlists!\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n👋 SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await cacheService.disconnect();
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n👋 SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await cacheService.disconnect();
    console.log('✅ Server closed');
    process.exit(0);
  });
});
