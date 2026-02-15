/**
 * LLM Audio Analyzer Service
 * Uses Claude AI to infer audio features (energy, tempo, mood) from song metadata
 * Replaces Spotify audio features API
 */

import Anthropic from '@anthropic-ai/sdk';
import cacheService from './cache.service.js';

class LLMAudioAnalyzerService {
  constructor() {
    this.client = null;
    this.model = 'claude-3-5-sonnet-20241022';
  }

  /**
   * Initialize Anthropic client
   */
  initialize() {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  No Anthropic API key found. LLM audio analysis disabled.');
      console.warn('   Set ANTHROPIC_API_KEY environment variable to enable.');
      return;
    }

    this.client = new Anthropic({ apiKey });
    console.log('🤖 LLM Audio Analyzer: Initialized with Claude');
  }

  /**
   * Analyze song metadata and infer audio features
   *
   * @param {Object} params - Song metadata
   * @param {string} params.artist - Artist name
   * @param {string} params.song - Song title
   * @param {Array} params.genres - Genre tags (optional)
   * @param {string} params.year - Release year (optional)
   * @returns {Object} Inferred audio features compatible with feels calculator
   */
  async inferAudioFeatures({ artist, song, genres = [], year = null }) {
    if (!this.client) {
      // Fallback to default neutral values if LLM unavailable
      return this.getFallbackFeatures();
    }

    // Check cache first - analysis is deterministic for same inputs
    const cacheKey = `llm:audio:${artist}:${song}:${genres.join(',')}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const prompt = this.buildAnalysisPrompt({ artist, song, genres, year });

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const analysis = this.parseAnalysisResponse(response.content[0].text);

      // Cache for 90 days (analysis won't change)
      await cacheService.set(cacheKey, analysis, 7776000);

      return analysis;
    } catch (error) {
      console.error('LLM audio analysis error:', error.message);
      return this.getFallbackFeatures();
    }
  }

  /**
   * Analyze multiple songs in batch
   *
   * @param {Array} songs - Array of song metadata objects
   * @returns {Array} Array of audio features
   */
  async inferAudioFeaturesBatch(songs) {
    const results = [];

    // Process in parallel but with rate limiting (5 concurrent)
    const chunks = [];
    for (let i = 0; i < songs.length; i += 5) {
      chunks.push(songs.slice(i, i + 5));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(song => this.inferAudioFeatures(song))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Build analysis prompt for Claude
   */
  buildAnalysisPrompt({ artist, song, genres, year }) {
    const genreInfo = genres.length > 0 ? `\nGenres: ${genres.join(', ')}` : '';
    const yearInfo = year ? `\nYear: ${year}` : '';

    return `Analyze this song and provide estimated audio features for mood analysis.

Song: "${song}"
Artist: ${artist}${genreInfo}${yearInfo}

Based on your knowledge of this song (or similar songs by this artist/genre), estimate these audio features on a 0.0 to 1.0 scale:

1. **Energy** (0.0 = very calm/slow, 1.0 = very energetic/intense)
   - Consider tempo, loudness, intensity

2. **Tempo** (actual BPM if known, or estimate 60-200)
   - Beats per minute

3. **Danceability** (0.0 = not danceable, 1.0 = very danceable)
   - Rhythm stability, beat strength

4. **Loudness** (in dB, typically -30 to -5)
   - Overall volume/intensity (-30 = very quiet, -5 = very loud)

5. **Valence** (0.0 = sad/negative, 1.0 = happy/positive)
   - Musical positivity, mood

6. **Acousticness** (0.0 = electronic/produced, 1.0 = acoustic/organic)
   - Use of acoustic vs electronic instruments

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "energy": 0.75,
  "tempo": 128,
  "danceability": 0.82,
  "loudness": -6.5,
  "valence": 0.68,
  "acousticness": 0.15,
  "confidence": 0.85
}

The confidence value (0.0-1.0) indicates how certain you are about this analysis.`;
  }

  /**
   * Parse Claude's response into audio features object
   */
  parseAnalysisResponse(responseText) {
    try {
      // Extract JSON from response (in case Claude adds explanation)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const features = JSON.parse(jsonMatch[0]);

      // Validate and normalize
      return {
        energy: this.clamp(features.energy, 0, 1),
        tempo: this.clamp(features.tempo, 60, 200),
        danceability: this.clamp(features.danceability, 0, 1),
        loudness: this.clamp(features.loudness, -30, -5),
        valence: this.clamp(features.valence, 0, 1),
        acousticness: this.clamp(features.acousticness, 0, 1),
        confidence: this.clamp(features.confidence || 0.7, 0, 1),
        source: 'llm-inferred'
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error.message);
      return this.getFallbackFeatures();
    }
  }

  /**
   * Fallback features when LLM unavailable or fails
   */
  getFallbackFeatures() {
    return {
      energy: 0.5,
      tempo: 120,
      danceability: 0.5,
      loudness: -10,
      valence: 0.5,
      acousticness: 0.5,
      confidence: 0.3,
      source: 'fallback'
    };
  }

  /**
   * Clamp value to range
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Quick analysis for known patterns (genre-based heuristics)
   * Used as backup when LLM is rate limited
   */
  getGenreBasedFeatures(genres) {
    const genreStr = genres.join(' ').toLowerCase();

    // Heavy/energetic genres
    if (genreStr.match(/metal|punk|hardcore|drum and bass|hardstyle/)) {
      return {
        energy: 0.9,
        tempo: 160,
        danceability: 0.6,
        loudness: -5,
        valence: 0.5,
        acousticness: 0.1,
        confidence: 0.6,
        source: 'genre-heuristic'
      };
    }

    // Electronic/dance
    if (genreStr.match(/techno|house|trance|edm|electronic/)) {
      return {
        energy: 0.8,
        tempo: 128,
        danceability: 0.85,
        loudness: -6,
        valence: 0.7,
        acousticness: 0.05,
        confidence: 0.65,
        source: 'genre-heuristic'
      };
    }

    // Chill/ambient
    if (genreStr.match(/ambient|chill|lounge|downtempo/)) {
      return {
        energy: 0.2,
        tempo: 80,
        danceability: 0.3,
        loudness: -15,
        valence: 0.6,
        acousticness: 0.4,
        confidence: 0.65,
        source: 'genre-heuristic'
      };
    }

    // Classical/acoustic
    if (genreStr.match(/classical|acoustic|folk|singer-songwriter/)) {
      return {
        energy: 0.4,
        tempo: 100,
        danceability: 0.3,
        loudness: -12,
        valence: 0.5,
        acousticness: 0.9,
        confidence: 0.6,
        source: 'genre-heuristic'
      };
    }

    // Default to neutral
    return this.getFallbackFeatures();
  }
}

// Singleton instance
const llmAudioAnalyzer = new LLMAudioAnalyzerService();

export default llmAudioAnalyzer;
