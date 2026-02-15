/**
 * Playlist routes - Handle YouTube playlist fetching
 */

import express from 'express';
import youtubeService from '../services/youtube.service.js';
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
