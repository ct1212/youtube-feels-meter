/**
 * MusicBrainz Service - Free music metadata API
 * Replaces Spotify for music identification and metadata
 *
 * API Docs: https://musicbrainz.org/doc/MusicBrainz_API
 * Rate Limit: 1 request per second (enforced client-side)
 */

import axios from 'axios';
import cacheService from './cache.service.js';

class MusicBrainzService {
  constructor() {
    this.baseUrl = 'https://musicbrainz.org/ws/2';
    this.userAgent = 'YouTubeFelsMeter/1.0 (https://github.com/yourproject)'; // Required by MusicBrainz
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 request per second
  }

  /**
   * Rate limiting - MusicBrainz requires 1 req/sec max
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Search for a recording (song) by artist and title
   *
   * @param {string} artist - Artist name
   * @param {string} song - Song title
   * @returns {Object|null} Recording data or null
   */
  async searchRecording(artist, song) {
    if (!artist || !song) {
      return null;
    }

    // Check cache first
    const cacheKey = `musicbrainz:recording:${artist}:${song}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      await this.enforceRateLimit();

      // Build query - MusicBrainz uses Lucene query syntax
      const query = `recording:"${song}" AND artist:"${artist}"`;

      const response = await axios.get(`${this.baseUrl}/recording`, {
        params: {
          query,
          fmt: 'json',
          limit: 5
        },
        headers: {
          'User-Agent': this.userAgent
        }
      });

      if (response.data.recordings && response.data.recordings.length > 0) {
        // Get the best match (first result)
        const recording = response.data.recordings[0];

        const result = {
          id: recording.id,
          title: recording.title,
          artist: recording['artist-credit']?.[0]?.name || artist,
          length: recording.length, // Duration in milliseconds
          score: recording.score, // Match score (0-100)
          disambiguation: recording.disambiguation || '',
          tags: recording.tags || [],
          // Get genre/style from tags if available
          genres: recording.tags?.map(t => t.name) || []
        };

        // Cache for 30 days
        await cacheService.set(cacheKey, result, 2592000);

        return result;
      }

      return null;
    } catch (error) {
      console.error('MusicBrainz search error:', error.message);
      return null;
    }
  }

  /**
   * Search for multiple recordings in batch
   * Note: MusicBrainz doesn't have batch API, so we do sequential requests with rate limiting
   *
   * @param {Array} tracks - Array of {artist, song} objects
   * @returns {Array} Array of recording results
   */
  async searchRecordingBatch(tracks) {
    const results = [];

    for (const track of tracks) {
      const result = await this.searchRecording(track.artist, track.song);
      results.push({
        query: track,
        recording: result
      });
    }

    return results;
  }

  /**
   * Get artist information
   *
   * @param {string} artistName - Artist name
   * @returns {Object|null} Artist data
   */
  async searchArtist(artistName) {
    if (!artistName) {
      return null;
    }

    const cacheKey = `musicbrainz:artist:${artistName}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      await this.enforceRateLimit();

      const response = await axios.get(`${this.baseUrl}/artist`, {
        params: {
          query: `artist:"${artistName}"`,
          fmt: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': this.userAgent
        }
      });

      if (response.data.artists && response.data.artists.length > 0) {
        const artist = response.data.artists[0];

        const result = {
          id: artist.id,
          name: artist.name,
          type: artist.type,
          tags: artist.tags || [],
          genres: artist.tags?.map(t => t.name) || [],
          disambiguation: artist.disambiguation || ''
        };

        await cacheService.set(cacheKey, result, 2592000);
        return result;
      }

      return null;
    } catch (error) {
      console.error('MusicBrainz artist search error:', error.message);
      return null;
    }
  }

  /**
   * Get detailed recording info by MusicBrainz ID
   *
   * @param {string} recordingId - MusicBrainz recording ID
   * @returns {Object|null} Detailed recording data
   */
  async getRecordingById(recordingId) {
    const cacheKey = `musicbrainz:recording:id:${recordingId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      await this.enforceRateLimit();

      const response = await axios.get(`${this.baseUrl}/recording/${recordingId}`, {
        params: {
          inc: 'artist-credits+tags+genres+ratings',
          fmt: 'json'
        },
        headers: {
          'User-Agent': this.userAgent
        }
      });

      const recording = response.data;
      const result = {
        id: recording.id,
        title: recording.title,
        artist: recording['artist-credit']?.[0]?.name,
        length: recording.length,
        tags: recording.tags || [],
        genres: recording.genres?.map(g => g.name) || recording.tags?.map(t => t.name) || [],
        rating: recording.rating?.value || null
      };

      await cacheService.set(cacheKey, result, 2592000);
      return result;
    } catch (error) {
      console.error('MusicBrainz get recording error:', error.message);
      return null;
    }
  }
}

// Singleton instance
const musicBrainzService = new MusicBrainzService();

export default musicBrainzService;
