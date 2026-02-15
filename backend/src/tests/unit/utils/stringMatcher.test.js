/**
 * Tests for stringMatcher.js
 * Fuzzy string matching utilities
 */

import {
  similarityRatio,
  fuzzyMatch,
  findBestMatch,
  calculateMatchScore,
  normalizeString
} from '../../../utils/stringMatcher.js';

describe('String Matcher', () => {
  describe('similarityRatio', () => {
    test('should return 1.0 for identical strings', () => {
      expect(similarityRatio('hello', 'hello')).toBe(1.0);
    });

    test('should return 1.0 for identical strings (case insensitive)', () => {
      expect(similarityRatio('Hello', 'hello')).toBe(1.0);
      expect(similarityRatio('WORLD', 'world')).toBe(1.0);
    });

    test('should return 0 for null inputs', () => {
      expect(similarityRatio(null, 'hello')).toBe(0);
      expect(similarityRatio('hello', null)).toBe(0);
      expect(similarityRatio(null, null)).toBe(0);
    });

    test('should return 0 for empty strings', () => {
      expect(similarityRatio('', '')).toBe(0); // Empty strings are falsy, caught by initial check
      expect(similarityRatio('hello', '')).toBe(0);
      expect(similarityRatio('', 'hello')).toBe(0);
    });

    test('should handle whitespace trimming', () => {
      expect(similarityRatio('  hello  ', 'hello')).toBe(1.0);
      expect(similarityRatio('hello', '  hello  ')).toBe(1.0);
    });

    test('should return high ratio for similar strings', () => {
      const ratio = similarityRatio('hello', 'hallo');
      expect(ratio).toBeGreaterThan(0.7);
      expect(ratio).toBeLessThan(1.0);
    });

    test('should return low ratio for very different strings', () => {
      const ratio = similarityRatio('hello', 'world');
      expect(ratio).toBeLessThan(0.5);
    });

    test('should calculate correct Levenshtein-based ratio', () => {
      // "kitten" -> "sitting" requires 3 edits, length 7
      // Similarity = 1 - (3/7) = 0.571
      const ratio = similarityRatio('kitten', 'sitting');
      expect(ratio).toBeCloseTo(0.571, 2);
    });

    test('should handle single character difference', () => {
      const ratio = similarityRatio('test', 'text');
      expect(ratio).toBeGreaterThan(0.7);
    });

    test('should handle substring matches', () => {
      const ratio = similarityRatio('hello world', 'hello');
      expect(ratio).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(0.6);
    });
  });

  describe('fuzzyMatch', () => {
    test('should match identical strings', () => {
      expect(fuzzyMatch('hello', 'hello')).toBe(true);
    });

    test('should match with default threshold (0.8)', () => {
      expect(fuzzyMatch('hello', 'helo')).toBe(true); // Very similar
      expect(fuzzyMatch('hello', 'world')).toBe(false); // Different
    });

    test('should respect custom threshold', () => {
      expect(fuzzyMatch('hello', 'hallo', 0.9)).toBe(false); // Below 0.9
      expect(fuzzyMatch('hello', 'hallo', 0.7)).toBe(true);  // Above 0.7
    });

    test('should be case insensitive', () => {
      expect(fuzzyMatch('Hello World', 'hello world')).toBe(true);
    });

    test('should handle low threshold', () => {
      expect(fuzzyMatch('abc', 'xyz', 0.1)).toBe(false);
      expect(fuzzyMatch('test', 'text', 0.5)).toBe(true);
    });
  });

  describe('findBestMatch', () => {
    const candidates = [
      'Never Gonna Give You Up',
      'Never Gonna Let You Down',
      'Together Forever',
      'Take On Me'
    ];

    test('should find exact match', () => {
      const result = findBestMatch('Never Gonna Give You Up', candidates);
      expect(result).not.toBeNull();
      expect(result.match).toBe('Never Gonna Give You Up');
      expect(result.score).toBe(1.0);
      expect(result.index).toBe(0);
    });

    test('should find best match with typo', () => {
      const result = findBestMatch('Never Gona Give You Up', candidates);
      expect(result).not.toBeNull();
      expect(result.match).toBe('Never Gonna Give You Up');
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.index).toBe(0);
    });

    test('should return null for no good match', () => {
      const result = findBestMatch('Completely Different Song', candidates);
      expect(result).toBeNull();
    });

    test('should return null for empty query', () => {
      expect(findBestMatch('', candidates)).toBeNull();
      expect(findBestMatch(null, candidates)).toBeNull();
    });

    test('should return null for empty candidates', () => {
      expect(findBestMatch('test', [])).toBeNull();
      expect(findBestMatch('test', null)).toBeNull();
    });

    test('should respect custom threshold', () => {
      const result = findBestMatch('Take On', candidates, 0.9);
      expect(result).toBeNull(); // "Take On" not similar enough to "Take On Me"

      const result2 = findBestMatch('Take On', candidates, 0.5);
      expect(result2).not.toBeNull();
      expect(result2.match).toBe('Take On Me');
    });

    test('should handle candidates with null values', () => {
      const mixedCandidates = ['Test', null, 'Hello', undefined, 'World'];
      const result = findBestMatch('Hello', mixedCandidates);
      expect(result).not.toBeNull();
      expect(result.match).toBe('Hello');
      expect(result.index).toBe(2);
    });

    test('should return highest scoring match', () => {
      const similarCandidates = [
        'Never Gonna Give You Up',
        'Never Gonna Give You',
        'Gonna Give You Up'
      ];
      const result = findBestMatch('Never Gonna Give You Up', similarCandidates);
      expect(result.match).toBe('Never Gonna Give You Up');
      expect(result.score).toBe(1.0);
    });
  });

  describe('calculateMatchScore', () => {
    test('should calculate score for exact match', () => {
      const query = { artist: 'Rick Astley', song: 'Never Gonna Give You Up' };
      const candidate = { artist: 'Rick Astley', song: 'Never Gonna Give You Up' };
      const score = calculateMatchScore(query, candidate);
      expect(score).toBe(1.0);
    });

    test('should average artist and song scores', () => {
      const query = { artist: 'Rick Astley', song: 'Never Gonna Give You Up' };
      const candidate = { artist: 'Rick Astley', song: 'Different Song' };
      const score = calculateMatchScore(query, candidate);
      // Artist matches (1.0), song doesn't match (~0.2)
      // Average: (1.0 + ~0.2) / 2 = ~0.6
      expect(score).toBeGreaterThan(0.4);
      expect(score).toBeLessThan(0.7);
    });

    test('should handle missing artist (song only)', () => {
      const query = { artist: null, song: 'Test Song' };
      const candidate = { artist: null, song: 'Test Song' };
      const score = calculateMatchScore(query, candidate);
      expect(score).toBe(1.0);
    });

    test('should handle missing song (artist only)', () => {
      const query = { artist: 'Test Artist', song: null };
      const candidate = { artist: 'Test Artist', song: null };
      const score = calculateMatchScore(query, candidate);
      expect(score).toBe(1.0);
    });

    test('should handle partial matches', () => {
      const query = { artist: 'Rick Astley', song: 'Never Gonna Give You Up' };
      const candidate = { artist: 'Rick Ashley', song: 'Never Gonna Give You Up' };
      const score = calculateMatchScore(query, candidate);
      expect(score).toBeGreaterThan(0.9); // High score despite artist typo
    });

    test('should weight both fields equally', () => {
      const query = { artist: 'A', song: 'B' };
      const candidate = { artist: 'X', song: 'B' };
      const score = calculateMatchScore(query, candidate);
      // Song matches (1.0), artist doesn't (0.0)
      // Average: (0.0 + 1.0) / 2 = 0.5
      expect(score).toBe(0.5);
    });

    test('should return 0 for completely missing data', () => {
      const query = { artist: null, song: null };
      const candidate = { artist: null, song: null };
      const score = calculateMatchScore(query, candidate);
      expect(score).toBe(0);
    });
  });

  describe('normalizeString', () => {
    test('should convert to lowercase', () => {
      expect(normalizeString('Hello World')).toBe('hello world');
      expect(normalizeString('UPPERCASE')).toBe('uppercase');
    });

    test('should remove special characters', () => {
      expect(normalizeString('hello-world!')).toBe('hello world');
      expect(normalizeString('test@email.com')).toBe('test email com');
      expect(normalizeString('song (official)')).toBe('song official');
    });

    test('should collapse multiple spaces', () => {
      expect(normalizeString('hello    world')).toBe('hello world');
      expect(normalizeString('a  b  c')).toBe('a b c');
    });

    test('should trim whitespace', () => {
      expect(normalizeString('  hello  ')).toBe('hello');
      expect(normalizeString('   test   ')).toBe('test');
    });

    test('should return empty string for null', () => {
      expect(normalizeString(null)).toBe('');
      expect(normalizeString(undefined)).toBe('');
    });

    test('should handle complex strings', () => {
      const input = '  Rick Astley - Never Gonna Give You Up (Official Video)!  ';
      const output = normalizeString(input);
      expect(output).toBe('rick astley never gonna give you up official video');
    });

    test('should preserve alphanumeric characters', () => {
      expect(normalizeString('Test123')).toBe('test123');
      expect(normalizeString('ABC 123 XYZ')).toBe('abc 123 xyz');
    });
  });
});
