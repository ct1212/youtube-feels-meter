/**
 * Music Analysis Service
 * Combines MusicBrainz (metadata) + LLM (audio features) to replace Spotify
 * Drop-in replacement with same interface as spotify.service.js
 */

import musicBrainzService from './musicbrainz.service.js';
import genreAudioAnalyzer from './genre-audio-analyzer.service.js';
import { calculateFeelsScore, getMoodLabel, getScoreColor } from './feels.calculator.js';
import { calculateMatchScore } from '../utils/stringMatcher.js';
import { parseVideoTitle } from '../utils/titleParser.js';
import cacheService from './cache.service.js';

class MusicAnalysisService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    console.log('🎵 Music Analysis: Using MusicBrainz + Genre-Based Analysis');
    this.initialized = true;
  }

  /**
   * Search and analyze a single track
   * Compatible with old Spotify service interface
   *
   * @param {string} artist - Artist name
   * @param {string} song - Song title
   * @returns {Object|null} Track data with audio features and feels score
   */
  async searchAndAnalyzeTrack(artist, song) {
    if (!artist || !song) {
      return null;
    }

    try {
      // Step 1: Search MusicBrainz for track metadata
      const recording = await musicBrainzService.searchRecording(artist, song);

      if (!recording) {
        console.log(`No MusicBrainz match for: ${artist} - ${song}`);
        return null;
      }

      // Step 2: Get audio features from genre analysis
      const audioFeatures = genreAudioAnalyzer.inferAudioFeatures({
        artist: recording.artist,
        song: recording.title,
        genres: recording.genres
      });

      // Step 3: Calculate feels score
      const feelsScore = calculateFeelsScore(audioFeatures);
      const mood = getMoodLabel(feelsScore);
      const color = getScoreColor(feelsScore);

      // Step 4: Calculate match confidence
      const matchConfidence = calculateMatchScore(
        { artist, song },
        { artist: recording.artist, song: recording.title }
      );

      // Return in Spotify-compatible format
      return {
        id: recording.id,
        name: recording.title,
        artist: recording.artist,
        duration_ms: recording.length,
        genres: recording.genres,
        audioFeatures,
        feelsScore,
        mood,
        color,
        matchConfidence,
        source: 'musicbrainz+genre',
        genreConfidence: audioFeatures.confidence
      };
    } catch (error) {
      console.error('Music analysis error:', error.message);
      return null;
    }
  }

  /**
   * Analyze multiple tracks in batch
   * Compatible with old Spotify service interface
   *
   * @param {Array} tracks - Array of {artist, song} objects
   * @returns {Array} Array of analyzed tracks
   */
  async searchAndAnalyzeTrackBatch(tracks) {
    const results = [];

    // Process in chunks to respect rate limits
    const chunkSize = 5;
    for (let i = 0; i < tracks.length; i += chunkSize) {
      const chunk = tracks.slice(i, i + chunkSize);

      const chunkResults = await Promise.all(
        chunk.map(track => this.searchAndAnalyzeTrack(track.artist, track.song))
      );

      results.push(...chunkResults);

      // Add small delay between chunks
      if (i + chunkSize < tracks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Get audio features for a track
   * (For compatibility - actually searches and analyzes)
   *
   * @param {string} trackId - MusicBrainz recording ID
   * @returns {Object|null} Audio features
   */
  async getAudioFeatures(trackId) {
    try {
      const recording = await musicBrainzService.getRecordingById(trackId);

      if (!recording) {
        return null;
      }

      const audioFeatures = genreAudioAnalyzer.inferAudioFeatures({
        artist: recording.artist,
        song: recording.title,
        genres: recording.genres
      });

      return audioFeatures;
    } catch (error) {
      console.error('Get audio features error:', error.message);
      return null;
    }
  }

  /**
   * Get multiple audio features in batch
   *
   * @param {Array} trackIds - Array of MusicBrainz recording IDs
   * @returns {Array} Array of audio features
   */
  async getAudioFeaturesBatch(trackIds) {
    const results = [];

    for (const trackId of trackIds) {
      const features = await this.getAudioFeatures(trackId);
      results.push(features);
    }

    return results;
  }

  /**
   * Match a YouTube video to music data
   * Compatible with old Spotify service matchVideo method
   *
   * @param {Object} video - YouTube video object {id, title, channelTitle}
   * @returns {Object} Match result with audio features and feels score
   */
  async matchVideo(video) {
    // Check cache first
    const cacheKey = `music:match:${video.id}`;
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
        reason: 'Failed to parse video title',
        cached: false
      };
    }

    // Search and analyze track
    const track = await this.searchAndAnalyzeTrack(parsed.artist, parsed.song);

    if (!track) {
      const result = {
        matched: false,
        videoId: video.id,
        parseConfidence: parsed.confidence,
        parsed: { artist: parsed.artist, song: parsed.song },
        reason: 'No MusicBrainz match found'
      };

      // Cache failed matches too (shorter TTL)
      await cacheService.set(cacheKey, result, 86400); // 1 day
      return { ...result, cached: false };
    }

    const result = {
      matched: true,
      videoId: video.id,
      parseConfidence: parsed.confidence,
      parsed: { artist: parsed.artist, song: parsed.song },
      spotifyMatch: { // Keep field name for compatibility
        trackId: track.id,
        name: track.name,
        artists: [track.artist],
        confidence: track.matchConfidence
      },
      audioFeatures: track.audioFeatures,
      feelsScore: track.feelsScore,
      mood: track.mood,
      color: track.color,
      genreConfidence: track.genreConfidence,
      analysisSource: track.source
    };

    // Cache successful matches for 30 days
    await cacheService.set(cacheKey, result, 2592000);
    return { ...result, cached: false };
  }

  /**
   * Legacy method - Match a YouTube video to music data
   *
   * @param {Object} video - YouTube video object with parsed title
   * @returns {Object} Matched track with feels score
   */
  async matchVideoToTrack(video) {
    const { parsedArtist, parsedSong, videoTitle } = video;

    if (!parsedArtist && !parsedSong) {
      console.log(`Cannot match video without artist/song: ${videoTitle}`);
      return {
        ...video,
        matched: false,
        feelsScore: 50, // Neutral default
        mood: 'Moderate',
        color: '#F5A623'
      };
    }

    const track = await this.searchAndAnalyzeTrack(
      parsedArtist || 'Unknown',
      parsedSong || videoTitle
    );

    if (!track) {
      return {
        ...video,
        matched: false,
        feelsScore: 50,
        mood: 'Moderate',
        color: '#F5A623'
      };
    }

    return {
      ...video,
      matched: true,
      musicBrainzId: track.id,
      trackName: track.name,
      trackArtist: track.artist,
      genres: track.genres,
      audioFeatures: track.audioFeatures,
      feelsScore: track.feelsScore,
      mood: track.mood,
      color: track.color,
      matchConfidence: track.matchConfidence,
      genreConfidence: track.genreConfidence,
      analysisSource: track.source
    };
  }

  /**
   * Match multiple videos to tracks
   *
   * @param {Array} videos - Array of YouTube video objects
   * @returns {Array} Array of matched videos with feels scores
   */
  async matchVideosToTracks(videos) {
    const results = [];

    for (const video of videos) {
      const matched = await this.matchVideoToTrack(video);
      results.push(matched);
    }

    return results;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      musicBrainzAvailable: true,
      rateLimit: '1 request/second (MusicBrainz)',
      features: [
        'MusicBrainz metadata (free)',
        'Genre-based audio analysis (60+ genres)',
        'Keyword detection from titles',
        'Aggressive caching (30-90 days)',
        '100% free - no API costs!'
      ]
    };
  }
}

// Singleton instance
const musicAnalysisService = new MusicAnalysisService();

export default musicAnalysisService;
