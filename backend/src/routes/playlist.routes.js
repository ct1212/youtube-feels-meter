/**
 * Playlist routes - Handle YouTube playlist fetching
 */

import express from 'express';
import youtubeService from '../services/youtube.service.js';
import musicAnalysisService from '../services/music-analysis.service.js';
import { calculateFeelsScore } from '../services/feels.calculator.js';
import { playlistRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/playlist/info
 * Fetch YouTube playlist metadata and all videos
 *
 * Body: { playlistUrl: string }
 * Returns: { playlistId, title, description, videoCount, videos }
 */
router.post('/info', playlistRateLimiter, async (req, res, next) => {
  try {
    const { playlistUrl } = req.body;

    if (!playlistUrl) {
      return res.status(400).json({
        error: true,
        message: 'playlistUrl is required'
      });
    }

    console.log(`📋 Fetching playlist: ${playlistUrl}`);

    const playlist = await youtubeService.getPlaylist(playlistUrl);

    console.log(`✅ Fetched ${playlist.videoCount} videos from playlist "${playlist.title}"`);

    res.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/playlist/analyze
 * Fetch playlist and analyze all videos for feels scores
 *
 * Body: { playlistUrl: string }
 * Returns: { playlist, analysis }
 */
router.post('/analyze', playlistRateLimiter, async (req, res, next) => {
  try {
    const { playlistUrl } = req.body;

    if (!playlistUrl) {
      return res.status(400).json({
        error: true,
        message: 'playlistUrl is required'
      });
    }

    console.log(`📋 Analyzing playlist: ${playlistUrl}`);

    // Fetch playlist
    const playlist = await youtubeService.getPlaylist(playlistUrl);
    console.log(`✅ Fetched ${playlist.videoCount} videos from "${playlist.title}"`);

    // Limit to first 50 videos to avoid Vercel timeout (10s limit on free tier)
    const MAX_VIDEOS = 50;
    const videosToAnalyze = playlist.videos.slice(0, MAX_VIDEOS);
    console.log(`📊 Analyzing first ${videosToAnalyze.length} videos...`);

    // Analyze videos in parallel batches
    const BATCH_SIZE = 10;
    const analyzedVideos = [];
    let totalEnergy = 0;
    let totalTempo = 0;
    let matchedCount = 0;

    for (let i = 0; i < videosToAnalyze.length; i += BATCH_SIZE) {
      const batch = videosToAnalyze.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(video => musicAnalysisService.matchVideo(video))
      );

      batchResults.forEach((result, index) => {
        const video = batch[index];
        const analyzedVideo = {
          ...video,
          feelsScore: result.feelsScore,
          matched: result.matched,
          audioFeatures: result.audioFeatures
        };

        analyzedVideos.push(analyzedVideo);

        if (result.matched && result.audioFeatures) {
          totalEnergy += result.audioFeatures.energy || 0;
          totalTempo += result.audioFeatures.tempo || 0;
          matchedCount++;
        }
      });
    }

    // Calculate overall stats
    const overallScore = calculateFeelsScore({
      videos: analyzedVideos.map(v => ({
        feelsScore: v.feelsScore
      }))
    });

    const analysis = {
      totalVideos: analyzedVideos.length,
      playlistVideoCount: playlist.videoCount,
      matchedVideos: matchedCount,
      overallScore,
      averageEnergy: matchedCount > 0 ? totalEnergy / matchedCount : 0,
      averageTempo: matchedCount > 0 ? totalTempo / matchedCount : 0,
      videos: analyzedVideos,
      limited: playlist.videoCount > MAX_VIDEOS
    };

    console.log(`✅ Analysis complete: ${matchedCount}/${playlist.videoCount} matched, overall score: ${Math.round(overallScore)}`);

    res.json({
      success: true,
      playlist: {
        id: playlist.playlistId,
        title: playlist.title,
        description: playlist.description,
        thumbnail: playlist.videos[0]?.thumbnail || '',
        videoCount: playlist.videoCount
      },
      analysis
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/playlist/:playlistId
 * Get cached playlist info by ID
 */
router.get('/:playlistId', async (req, res, next) => {
  try {
    const { playlistId } = req.params;

    const playlist = await youtubeService.getPlaylist(playlistId);

    res.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    next(error);
  }
});

export default router;
