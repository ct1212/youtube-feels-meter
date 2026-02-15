/**
 * Spotify Service - Wrapper for Spotify Web API
 * Handles authentication, track search, and audio features
 */

import axios from 'axios';
import { parseVideoTitle } from '../utils/titleParser.js';
import { calculateMatchScore, normalizeString } from '../utils/stringMatcher.js';
import cacheService from './cache.service.js';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with Spotify using Client Credentials flow
   */
  async authenticate() {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        SPOTIFY_AUTH_URL,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1min early

      console.log('✅ Spotify: Authenticated successfully');
      return this.accessToken;
    } catch (error) {
      console.error('Spotify authentication error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  /**
   * Search for a track on Spotify
   *
   * @param {string} artist - Artist name
   * @param {string} song - Song/track name
   * @returns {Object|null} Best matching track or null
   */
  async searchTrack(artist, song) {
    await this.authenticate();

    try {
      // Build search query
      let query = '';
      if (artist && song) {
        query = `track:${song} artist:${artist}`;
      } else if (song) {
        query = `track:${song}`;
      } else if (artist) {
        query = `artist:${artist}`;
      } else {
        return null;
      }

      const response = await axios.get(`${SPOTIFY_API_BASE}/search`, {
        params: {
          q: query,
          type: 'track',
          limit: 10 // Get multiple results for better matching
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.data.tracks || response.data.tracks.items.length === 0) {
        return null;
      }

      // Find best match using fuzzy string matching
      const bestMatch = this.findBestTrackMatch(
        { artist, song },
        response.data.tracks.items
      );

      return bestMatch;
    } catch (error) {
      console.error('Spotify search error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Find best matching track from search results
   */
  findBestTrackMatch(query, tracks) {
    if (!tracks || tracks.length === 0) return null;

    let bestMatch = null;
    let bestScore = 0;

    for (const track of tracks) {
      const trackArtist = track.artists[0]?.name || '';
      const trackName = track.name || '';

      const score = calculateMatchScore(
        { artist: query.artist, song: query.song },
        { artist: trackArtist, song: trackName }
      );

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          trackId: track.id,
          name: track.name,
          artists: track.artists.map(a => a.name),
          album: track.album.name,
          uri: track.uri,
          previewUrl: track.preview_url,
          confidence: score
        };
      }
    }

    // Only return if confidence is above threshold
    return bestScore >= 0.6 ? bestMatch : null;
  }

  /**
   * Get audio features for a track
   *
   * @param {string} trackId - Spotify track ID
   * @returns {Object} Audio features
   */
  async getAudioFeatures(trackId) {
    // Check cache first
    const cacheKey = `spotify:audiofeatures:${trackId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    await this.authenticate();

    try {
      const response = await axios.get(`${SPOTIFY_API_BASE}/audio-features/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      const features = {
        energy: response.data.energy,
        valence: response.data.valence,
        danceability: response.data.danceability,
        tempo: response.data.tempo,
        loudness: response.data.loudness,
        acousticness: response.data.acousticness,
        instrumentalness: response.data.instrumentalness,
        speechiness: response.data.speechiness,
        liveness: response.data.liveness,
        key: response.data.key,
        mode: response.data.mode,
        timeSignature: response.data.time_signature,
        duration: response.data.duration_ms
      };

      // Cache audio features (7 days)
      const ttl = parseInt(process.env.SPOTIFY_CACHE_TTL || '604800');
      await cacheService.set(cacheKey, features, ttl);

      return features;
    } catch (error) {
      console.error('Spotify audio features error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Match YouTube video to Spotify track and get audio features
   *
   * @param {Object} video - YouTube video object { id, title, channelTitle }
   * @returns {Object} Match result with audio features
   */
  async matchVideo(video) {
    // Check cache first
    const cacheKey = `spotify:match:${video.id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Parse video title to extract artist and song
    const parsed = parseVideoTitle(video.title, video.channelTitle);

    if (!parsed.artist && !parsed.song) {
      return {
        matched: false,
        videoId: video.id,
        parseConfidence: parsed.confidence,
        reason: 'Failed to parse video title'
      };
    }

    // Search Spotify for matching track
    const spotifyTrack = await this.searchTrack(parsed.artist, parsed.song);

    if (!spotifyTrack) {
      const result = {
        matched: false,
        videoId: video.id,
        parseConfidence: parsed.confidence,
        parsed: { artist: parsed.artist, song: parsed.song },
        reason: 'No Spotify match found'
      };

      // Cache failed matches too (shorter TTL)
      await cacheService.set(cacheKey, result, 86400); // 1 day
      return { ...result, cached: false };
    }

    // Get audio features for the matched track
    const audioFeatures = await this.getAudioFeatures(spotifyTrack.trackId);

    if (!audioFeatures) {
      const result = {
        matched: false,
        videoId: video.id,
        parseConfidence: parsed.confidence,
        spotifyMatch: spotifyTrack,
        reason: 'Failed to get audio features'
      };

      await cacheService.set(cacheKey, result, 86400);
      return { ...result, cached: false };
    }

    const result = {
      matched: true,
      videoId: video.id,
      parseConfidence: parsed.confidence,
      parsed: { artist: parsed.artist, song: parsed.song },
      spotifyMatch: spotifyTrack,
      audioFeatures
    };

    // Cache successful match (30 days)
    const ttl = parseInt(process.env.CACHE_TTL || '2592000');
    await cacheService.set(cacheKey, result, ttl);

    return { ...result, cached: false };
  }

  /**
   * Batch match multiple videos
   *
   * @param {Array} videos - Array of video objects
   * @param {Function} onProgress - Progress callback (current, total)
   * @returns {Array} Array of match results
   */
  async batchMatchVideos(videos, onProgress = null) {
    const results = [];
    const total = videos.length;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const result = await this.matchVideo(video);
      results.push(result);

      if (onProgress) {
        onProgress(i + 1, total);
      }

      // Small delay to avoid rate limiting (only if not cached)
      if (!result.cached) {
        await this.sleep(100);
      }
    }

    return results;
  }

  /**
   * Helper: Sleep for ms milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const spotifyService = new SpotifyService();

export default spotifyService;
