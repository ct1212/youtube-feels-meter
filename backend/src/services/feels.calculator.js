/**
 * Feels Calculator - Core algorithm for converting Spotify audio features
 * into a 0-100 "feels score" representing song energy/intensity
 */

/**
 * Calculate feels score from Spotify audio features
 *
 * The algorithm weights different audio features:
 * - Energy (40%): Primary indicator of intensity and activity
 * - Tempo (25%): Speed and rhythm (normalized from BPM)
 * - Danceability (15%): Rhythmic energy and beat strength
 * - Loudness (10%): Volume intensity (normalized from dB)
 * - Valence (5%): Musical positivity
 * - Acousticness (5%): Electronic sounds score higher (inverted)
 *
 * @param {Object} audioFeatures - Spotify audio features object
 * @returns {number} Feels score from 0-100
 */
export function calculateFeelsScore(audioFeatures) {
  if (!audioFeatures) {
    return 50; // Default neutral score
  }

  const {
    energy = 0.5,
    tempo = 120,
    danceability = 0.5,
    loudness = -10,
    valence = 0.5,
    acousticness = 0.5
  } = audioFeatures;

  // Normalize each component to 0-1 scale
  const normalizedEnergy = Math.max(0, Math.min(1, energy));
  const normalizedTempo = Math.max(0, Math.min(1, tempo / 200)); // Max typical BPM ~200
  const normalizedDanceability = Math.max(0, Math.min(1, danceability));
  const normalizedLoudness = Math.max(0, Math.min(1, (loudness + 30) / 25)); // Loudness range: -30 to -5 dB
  const normalizedValence = Math.max(0, Math.min(1, valence));
  const normalizedAcousticness = Math.max(0, Math.min(1, 1 - acousticness)); // Invert: electronic = higher

  // Weighted combination
  const score = (
    normalizedEnergy * 0.40 +
    normalizedTempo * 0.25 +
    normalizedDanceability * 0.15 +
    normalizedLoudness * 0.10 +
    normalizedValence * 0.05 +
    normalizedAcousticness * 0.05
  ) * 100;

  // Round to integer and clamp to 0-100
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Get mood label for a given feels score
 *
 * @param {number} score - Feels score (0-100)
 * @returns {string} Mood label
 */
export function getMoodLabel(score) {
  if (score < 20) return 'Very Chill';
  if (score < 40) return 'Relaxed';
  if (score < 60) return 'Moderate';
  if (score < 80) return 'Energetic';
  return 'Intense';
}

/**
 * Get color for a given feels score (for UI visualization)
 *
 * @param {number} score - Feels score (0-100)
 * @returns {string} CSS color value
 */
export function getScoreColor(score) {
  // Gradient from blue (chill) to red (intense)
  if (score < 20) return '#4A90E2'; // Blue
  if (score < 40) return '#50C878'; // Green
  if (score < 60) return '#F5A623'; // Yellow
  if (score < 80) return '#F57C00'; // Orange
  return '#E74C3C'; // Red
}

/**
 * Find video closest to target feels score
 *
 * @param {Array} videos - Array of video objects with feelsScore property
 * @param {number} targetScore - Target feels score (0-100)
 * @returns {Object|null} Closest video or null
 */
export function findClosestVideo(videos, targetScore) {
  if (!videos || videos.length === 0) return null;

  let closest = videos[0];
  let minDifference = Math.abs(videos[0].feelsScore - targetScore);

  for (let i = 1; i < videos.length; i++) {
    const difference = Math.abs(videos[i].feelsScore - targetScore);
    if (difference < minDifference) {
      minDifference = difference;
      closest = videos[i];
    }
  }

  return closest;
}

/**
 * Sort videos by feels score
 *
 * @param {Array} videos - Array of video objects with feelsScore property
 * @param {string} order - 'asc' for low to high, 'desc' for high to low
 * @returns {Array} Sorted videos
 */
export function sortByFeelsScore(videos, order = 'asc') {
  if (!videos || videos.length === 0) return [];

  const sorted = [...videos].sort((a, b) => {
    const scoreA = a.feelsScore || 50;
    const scoreB = b.feelsScore || 50;
    return order === 'asc' ? scoreA - scoreB : scoreB - scoreA;
  });

  return sorted;
}

/**
 * Get distribution of feels scores (for analytics)
 *
 * @param {Array} videos - Array of video objects with feelsScore property
 * @returns {Object} Distribution stats
 */
export function getScoreDistribution(videos) {
  if (!videos || videos.length === 0) {
    return {
      total: 0,
      average: 0,
      min: 0,
      max: 0,
      ranges: {
        chill: 0,      // 0-20
        relaxed: 0,    // 20-40
        moderate: 0,   // 40-60
        energetic: 0,  // 60-80
        intense: 0     // 80-100
      }
    };
  }

  const scores = videos.map(v => v.feelsScore || 50);
  const sum = scores.reduce((acc, score) => acc + score, 0);

  const distribution = {
    total: videos.length,
    average: Math.round(sum / videos.length),
    min: Math.min(...scores),
    max: Math.max(...scores),
    ranges: {
      chill: scores.filter(s => s < 20).length,
      relaxed: scores.filter(s => s >= 20 && s < 40).length,
      moderate: scores.filter(s => s >= 40 && s < 60).length,
      energetic: scores.filter(s => s >= 60 && s < 80).length,
      intense: scores.filter(s => s >= 80).length
    }
  };

  return distribution;
}
