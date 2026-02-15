/**
 * YouTube Service - Wrapper for YouTube Data API v3
 */

import axios from 'axios';
import { extractPlaylistId } from '../utils/titleParser.js';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
  }

  /**
   * Fetch playlist metadata and all videos
   * Handles pagination to get all videos in the playlist
   *
   * @param {string} playlistUrl - YouTube playlist URL or playlist ID
   * @returns {Object} { playlistId, title, description, videoCount, videos }
   */
  async getPlaylist(playlistUrl) {
    const playlistId = extractPlaylistId(playlistUrl) || playlistUrl;

    if (!playlistId) {
      throw new Error('Invalid playlist URL or ID');
    }

    // Fetch playlist metadata
    const playlistInfo = await this.getPlaylistInfo(playlistId);

    // Fetch all videos in the playlist
    const videos = await this.getAllPlaylistVideos(playlistId);

    return {
      playlistId,
      title: playlistInfo.title,
      description: playlistInfo.description,
      videoCount: videos.length,
      videos
    };
  }

  /**
   * Get playlist metadata
   */
  async getPlaylistInfo(playlistId) {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE}/playlists`, {
        params: {
          part: 'snippet,contentDetails',
          id: playlistId,
          key: this.apiKey
        }
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Playlist not found or is private');
      }

      const playlist = response.data.items[0];

      return {
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        itemCount: playlist.contentDetails.itemCount
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`YouTube API error: ${error.response.data.error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get all videos from a playlist (handles pagination)
   */
  async getAllPlaylistVideos(playlistId) {
    const videos = [];
    let pageToken = null;
    let pageCount = 0;
    const maxPages = 20; // Safety limit (50 videos per page = 1000 videos max)

    do {
      const page = await this.getPlaylistVideosPage(playlistId, pageToken);
      videos.push(...page.items);
      pageToken = page.nextPageToken;
      pageCount++;

      if (pageCount >= maxPages) {
        console.warn(`Reached maximum page limit (${maxPages}) for playlist ${playlistId}`);
        break;
      }
    } while (pageToken);

    return videos;
  }

  /**
   * Get a single page of playlist videos
   */
  async getPlaylistVideosPage(playlistId, pageToken = null) {
    try {
      const params = {
        part: 'snippet,contentDetails',
        playlistId,
        maxResults: 50, // Maximum allowed by YouTube API
        key: this.apiKey
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
        params
      });

      const items = response.data.items.map((item, index) => ({
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnails: item.snippet.thumbnails,
        position: item.snippet.position,
        publishedAt: item.snippet.publishedAt
      }));

      return {
        items,
        nextPageToken: response.data.nextPageToken || null
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`YouTube API error: ${error.response.data.error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get video details by ID(s)
   */
  async getVideoDetails(videoIds) {
    if (!videoIds || videoIds.length === 0) {
      return [];
    }

    try {
      // YouTube API allows up to 50 IDs at once
      const ids = Array.isArray(videoIds) ? videoIds.join(',') : videoIds;

      const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: ids,
          key: this.apiKey
        }
      });

      return response.data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        duration: item.contentDetails.duration,
        viewCount: item.statistics.viewCount,
        likeCount: item.statistics.likeCount
      }));
    } catch (error) {
      if (error.response) {
        throw new Error(`YouTube API error: ${error.response.data.error.message}`);
      }
      throw error;
    }
  }

  /**
   * Search for videos
   */
  async searchVideos(query, maxResults = 10) {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults,
          key: this.apiKey
        }
      });

      return response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnails: item.snippet.thumbnails,
        publishedAt: item.snippet.publishedAt
      }));
    } catch (error) {
      if (error.response) {
        throw new Error(`YouTube API error: ${error.response.data.error.message}`);
      }
      throw error;
    }
  }
}

const youtubeService = new YouTubeService();

export default youtubeService;
