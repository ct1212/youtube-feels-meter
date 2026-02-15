/**
 * Tests for feels.calculator.js
 * Core algorithm for converting Spotify audio features into feels scores
 */

import {
  calculateFeelsScore,
  getMoodLabel,
  getScoreColor,
  findClosestVideo,
  sortByFeelsScore,
  getScoreDistribution
} from '../../../services/feels.calculator.js';
import { createMockAudioFeatures, createMockVideos } from '../../helpers/fixtures.js';

describe('Feels Calculator', () => {
  describe('calculateFeelsScore', () => {
    test('should return 50 for null audio features', () => {
      expect(calculateFeelsScore(null)).toBe(50);
    });

    test('should return 50 for undefined audio features', () => {
      expect(calculateFeelsScore(undefined)).toBe(50);
    });

    test('should calculate score from default values (all 0.5)', () => {
      const features = createMockAudioFeatures();
      const score = calculateFeelsScore(features);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      // Defaults: energy 0.5, tempo 120 (0.6 normalized), danceability 0.5, loudness -10 (0.8 normalized), valence 0.5, acousticness 0.5 (inverted to 0.5)
      // Score should be around 56
      expect(score).toBeGreaterThanOrEqual(50);
      expect(score).toBeLessThanOrEqual(60);
    });

    test('should calculate high score for energetic track', () => {
      const features = createMockAudioFeatures({
        energy: 1.0,
        tempo: 180,
        danceability: 1.0,
        loudness: -5,
        valence: 1.0,
        acousticness: 0.0
      });
      const score = calculateFeelsScore(features);
      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should calculate low score for chill track', () => {
      const features = createMockAudioFeatures({
        energy: 0.1,
        tempo: 60,
        danceability: 0.2,
        loudness: -25,
        valence: 0.2,
        acousticness: 0.9
      });
      const score = calculateFeelsScore(features);
      expect(score).toBeLessThan(30);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    test('should weight energy as 40% of score', () => {
      // High energy, low everything else
      const features = createMockAudioFeatures({
        energy: 1.0,
        tempo: 60,
        danceability: 0.0,
        loudness: -30,
        valence: 0.0,
        acousticness: 1.0
      });
      const score = calculateFeelsScore(features);
      // Energy 1.0 * 0.40 + tempo 60/200 * 0.25 + others contribute some points
      // Expected around 47-48
      expect(score).toBeGreaterThanOrEqual(45);
      expect(score).toBeLessThanOrEqual(50);
    });

    test('should clamp values to 0-100 range', () => {
      // Extreme values that might overflow
      const features = {
        energy: 2.0,
        tempo: 300,
        danceability: 2.0,
        loudness: 10,
        valence: 2.0,
        acousticness: -1.0
      };
      const score = calculateFeelsScore(features);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    test('should return integer scores', () => {
      const features = createMockAudioFeatures({ energy: 0.567 });
      const score = calculateFeelsScore(features);
      expect(Number.isInteger(score)).toBe(true);
    });

    test('should invert acousticness (electronic = higher score)', () => {
      const acoustic = createMockAudioFeatures({ acousticness: 0.9 });
      const electronic = createMockAudioFeatures({ acousticness: 0.1 });

      const acousticScore = calculateFeelsScore(acoustic);
      const electronicScore = calculateFeelsScore(electronic);

      expect(electronicScore).toBeGreaterThan(acousticScore);
    });
  });

  describe('getMoodLabel', () => {
    test('should return "Very Chill" for scores 0-19', () => {
      expect(getMoodLabel(0)).toBe('Very Chill');
      expect(getMoodLabel(10)).toBe('Very Chill');
      expect(getMoodLabel(19)).toBe('Very Chill');
    });

    test('should return "Relaxed" for scores 20-39', () => {
      expect(getMoodLabel(20)).toBe('Relaxed');
      expect(getMoodLabel(30)).toBe('Relaxed');
      expect(getMoodLabel(39)).toBe('Relaxed');
    });

    test('should return "Moderate" for scores 40-59', () => {
      expect(getMoodLabel(40)).toBe('Moderate');
      expect(getMoodLabel(50)).toBe('Moderate');
      expect(getMoodLabel(59)).toBe('Moderate');
    });

    test('should return "Energetic" for scores 60-79', () => {
      expect(getMoodLabel(60)).toBe('Energetic');
      expect(getMoodLabel(70)).toBe('Energetic');
      expect(getMoodLabel(79)).toBe('Energetic');
    });

    test('should return "Intense" for scores 80-100', () => {
      expect(getMoodLabel(80)).toBe('Intense');
      expect(getMoodLabel(90)).toBe('Intense');
      expect(getMoodLabel(100)).toBe('Intense');
    });
  });

  describe('getScoreColor', () => {
    test('should return blue for very chill (0-19)', () => {
      expect(getScoreColor(0)).toBe('#4A90E2');
      expect(getScoreColor(19)).toBe('#4A90E2');
    });

    test('should return green for relaxed (20-39)', () => {
      expect(getScoreColor(20)).toBe('#50C878');
      expect(getScoreColor(39)).toBe('#50C878');
    });

    test('should return yellow for moderate (40-59)', () => {
      expect(getScoreColor(40)).toBe('#F5A623');
      expect(getScoreColor(59)).toBe('#F5A623');
    });

    test('should return orange for energetic (60-79)', () => {
      expect(getScoreColor(60)).toBe('#F57C00');
      expect(getScoreColor(79)).toBe('#F57C00');
    });

    test('should return red for intense (80-100)', () => {
      expect(getScoreColor(80)).toBe('#E74C3C');
      expect(getScoreColor(100)).toBe('#E74C3C');
    });
  });

  describe('findClosestVideo', () => {
    const videos = createMockVideos(5);

    test('should return null for empty array', () => {
      expect(findClosestVideo([], 50)).toBeNull();
    });

    test('should return null for null videos', () => {
      expect(findClosestVideo(null, 50)).toBeNull();
    });

    test('should find exact match', () => {
      const result = findClosestVideo(videos, 55);
      expect(result.feelsScore).toBe(55);
    });

    test('should find closest video when no exact match', () => {
      const result = findClosestVideo(videos, 56);
      expect(result.feelsScore).toBe(55); // Closest to 56
    });

    test('should find lowest video for very low target', () => {
      const result = findClosestVideo(videos, 0);
      expect(result.feelsScore).toBe(15);
    });

    test('should find highest video for very high target', () => {
      const result = findClosestVideo(videos, 100);
      expect(result.feelsScore).toBe(95);
    });

    test('should handle single video array', () => {
      const singleVideo = [{ id: 'test', feelsScore: 42 }];
      const result = findClosestVideo(singleVideo, 80);
      expect(result.feelsScore).toBe(42);
    });
  });

  describe('sortByFeelsScore', () => {
    const videos = createMockVideos(5);

    test('should return empty array for null input', () => {
      expect(sortByFeelsScore(null)).toEqual([]);
    });

    test('should return empty array for empty input', () => {
      expect(sortByFeelsScore([])).toEqual([]);
    });

    test('should sort ascending by default', () => {
      const sorted = sortByFeelsScore(videos);
      expect(sorted[0].feelsScore).toBe(15);
      expect(sorted[1].feelsScore).toBe(35);
      expect(sorted[2].feelsScore).toBe(55);
      expect(sorted[3].feelsScore).toBe(75);
      expect(sorted[4].feelsScore).toBe(95);
    });

    test('should sort descending when specified', () => {
      const sorted = sortByFeelsScore(videos, 'desc');
      expect(sorted[0].feelsScore).toBe(95);
      expect(sorted[1].feelsScore).toBe(75);
      expect(sorted[2].feelsScore).toBe(55);
      expect(sorted[3].feelsScore).toBe(35);
      expect(sorted[4].feelsScore).toBe(15);
    });

    test('should not mutate original array', () => {
      const original = [...videos];
      sortByFeelsScore(videos);
      expect(videos).toEqual(original);
    });

    test('should handle videos without feelsScore', () => {
      const videosNoScore = [
        { id: '1' },
        { id: '2', feelsScore: 80 },
        { id: '3' }
      ];
      const sorted = sortByFeelsScore(videosNoScore);
      expect(sorted).toHaveLength(3);
      // Videos without score use 50 for comparison, but don't get the property set
      // The video with score 80 should be last in ascending order
      expect(sorted[2].feelsScore).toBe(80);
      expect(sorted[0].id).toBe('1'); // One of the videos without score
    });
  });

  describe('getScoreDistribution', () => {
    test('should return zero stats for empty array', () => {
      const dist = getScoreDistribution([]);
      expect(dist.total).toBe(0);
      expect(dist.average).toBe(0);
      expect(dist.min).toBe(0);
      expect(dist.max).toBe(0);
      expect(dist.ranges.chill).toBe(0);
      expect(dist.ranges.relaxed).toBe(0);
      expect(dist.ranges.moderate).toBe(0);
      expect(dist.ranges.energetic).toBe(0);
      expect(dist.ranges.intense).toBe(0);
    });

    test('should return zero stats for null input', () => {
      const dist = getScoreDistribution(null);
      expect(dist.total).toBe(0);
    });

    test('should calculate correct distribution for mixed videos', () => {
      const videos = createMockVideos(5); // 15, 35, 55, 75, 95
      const dist = getScoreDistribution(videos);

      expect(dist.total).toBe(5);
      expect(dist.average).toBe(55); // (15+35+55+75+95)/5 = 55
      expect(dist.min).toBe(15);
      expect(dist.max).toBe(95);
      expect(dist.ranges.chill).toBe(1);      // 15
      expect(dist.ranges.relaxed).toBe(1);    // 35
      expect(dist.ranges.moderate).toBe(1);   // 55
      expect(dist.ranges.energetic).toBe(1);  // 75
      expect(dist.ranges.intense).toBe(1);    // 95
    });

    test('should handle videos without feelsScore (default to 50)', () => {
      const videos = [
        { id: '1' },
        { id: '2' },
        { id: '3' }
      ];
      const dist = getScoreDistribution(videos);

      expect(dist.total).toBe(3);
      expect(dist.average).toBe(50);
      expect(dist.ranges.moderate).toBe(3); // All default to 50 (moderate)
    });

    test('should calculate average as integer', () => {
      const videos = [
        { id: '1', feelsScore: 10 },
        { id: '2', feelsScore: 15 },
        { id: '3', feelsScore: 20 }
      ];
      const dist = getScoreDistribution(videos);
      expect(Number.isInteger(dist.average)).toBe(true);
      expect(dist.average).toBe(15); // (10+15+20)/3 = 15
    });

    test('should correctly categorize boundary values', () => {
      const videos = [
        { id: '1', feelsScore: 19 },  // chill (< 20)
        { id: '2', feelsScore: 20 },  // relaxed (20-39)
        { id: '3', feelsScore: 40 },  // moderate (40-59)
        { id: '4', feelsScore: 60 },  // energetic (60-79)
        { id: '5', feelsScore: 80 }   // intense (>= 80)
      ];
      const dist = getScoreDistribution(videos);

      expect(dist.ranges.chill).toBe(1);
      expect(dist.ranges.relaxed).toBe(1);
      expect(dist.ranges.moderate).toBe(1);
      expect(dist.ranges.energetic).toBe(1);
      expect(dist.ranges.intense).toBe(1);
    });
  });
});
