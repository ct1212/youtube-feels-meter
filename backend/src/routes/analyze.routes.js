/**
 * Analysis routes - Handle video analysis and feels score calculation
 * Updated to use MusicBrainz + LLM instead of Spotify
 */

import express from 'express';
import musicAnalysisService from '../services/music-analysis.service.js';
import { calculateFeelsScore } from '../services/feels.calculator.js';
import cacheService from '../services/cache.service.js';
import { analyzeRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/analyze/batch
 * Analyze multiple videos and calculate feels scores
 *
 * Body: {
 *   videos: Array<{ id, title, channelTitle }>,
 *   playlistId: string (optional, for caching)
 * }
 *
 * Returns: {
 *   results: Array<{
 *     videoId, feelsScore, matched, spotifyMatch, audioFeatures, cached
 *   }>,
 *   errors: Array,
 *   stats: { total, matched, unmatched, cached }
 * }
 */
router.post('/batch', analyzeRateLimiter, async (req, res, next) => {
  try {
    const { videos, playlistId } = req.body;

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'videos array is required and must not be empty'
      });
    }

    console.log(`🔍 Analyzing ${videos.length} videos...`);

    const results = [];
    const errors = [];
    let matchedCount = 0;
    let cachedCount = 0;

    // Check for cached playlist analysis
    if (playlistId) {
      const cacheKey = `playlist:analysis:${playlistId}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        console.log(`✅ Using cached analysis for playlist ${playlistId}`);
        return res.json({
          success: true,
          data: {
            results: cached.results,
            errors: [],
            stats: cached.stats,
            cached: true
          }
        });
      }
    }

    // Process each video
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];

      try {
        // Match video to MusicBrainz + LLM and get audio features
        const matchResult = await musicAnalysisService.matchVideo(video);

        if (matchResult.cached) {
          cachedCount++;
        }

        let feelsScore = 50; // Default neutral score

        if (matchResult.matched && matchResult.audioFeatures) {
          feelsScore = calculateFeelsScore(matchResult.audioFeatures);
          matchedCount++;
        }

        results.push({
          videoId: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnails: video.thumbnails,
          feelsScore,
          matched: matchResult.matched,
          spotifyMatch: matchResult.spotifyMatch || null,
          audioFeatures: matchResult.audioFeatures || null,
          parseConfidence: matchResult.parseConfidence,
          cached: matchResult.cached
        });

        // Log progress
        if ((i + 1) % 10 === 0 || i === videos.length - 1) {
          console.log(`  Progress: ${i + 1}/${videos.length} (${matchedCount} matched, ${cachedCount} cached)`);
        }

        // Small delay to avoid overwhelming APIs (skip if cached)
        if (!matchResult.cached) {
          await sleep(50);
        }
      } catch (error) {
        console.error(`Error analyzing video ${video.id}:`, error.message);
        errors.push({
          videoId: video.id,
          error: error.message
        });

        // Add video with default score
        results.push({
          videoId: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnails: video.thumbnails,
          feelsScore: 50,
          matched: false,
          error: error.message
        });
      }
    }

    const stats = {
      total: videos.length,
      matched: matchedCount,
      unmatched: videos.length - matchedCount,
      cached: cachedCount,
      matchRate: ((matchedCount / videos.length) * 100).toFixed(1) + '%'
    };

    console.log(`✅ Analysis complete: ${stats.matched}/${stats.total} matched (${stats.matchRate})`);

    // Cache playlist analysis result
    if (playlistId) {
      const cacheKey = `playlist:analysis:${playlistId}`;
      const ttl = parseInt(process.env.CACHE_TTL || '2592000'); // 30 days
      await cacheService.set(cacheKey, { results, stats }, ttl);
      console.log(`💾 Cached analysis for playlist ${playlistId}`);
    }

    res.json({
      success: true,
      data: {
        results,
        errors,
        stats,
        cached: false
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analyze/single
 * Analyze a single video
 *
 * Body: { id, title, channelTitle }
 */
router.post('/single', async (req, res, next) => {
  try {
    const video = req.body;

    if (!video || !video.id || !video.title) {
      return res.status(400).json({
        error: true,
        message: 'Video object with id and title is required'
      });
    }

    const matchResult = await musicAnalysisService.matchVideo(video);

    let feelsScore = 50;
    if (matchResult.matched && matchResult.audioFeatures) {
      feelsScore = calculateFeelsScore(matchResult.audioFeatures);
    }

    res.json({
      success: true,
      data: {
        videoId: video.id,
        feelsScore,
        matched: matchResult.matched,
        spotifyMatch: matchResult.spotifyMatch || null,
        audioFeatures: matchResult.audioFeatures || null,
        cached: matchResult.cached
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Helper: Sleep for ms milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default router;
