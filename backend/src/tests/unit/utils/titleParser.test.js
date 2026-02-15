/**
 * Tests for titleParser.js
 * YouTube video title parsing for artist and song extraction
 */

import {
  parseVideoTitle,
  extractPlaylistId,
  extractVideoId
} from '../../../utils/titleParser.js';

describe('Title Parser', () => {
  describe('parseVideoTitle', () => {
    test('should return null values for empty title', () => {
      const result = parseVideoTitle('');
      expect(result.artist).toBeNull();
      expect(result.song).toBeNull();
      expect(result.confidence).toBe(0);
    });

    test('should return null values for null title', () => {
      const result = parseVideoTitle(null);
      expect(result.artist).toBeNull();
      expect(result.song).toBeNull();
      expect(result.confidence).toBe(0);
    });

    describe('Pattern 1: "Artist - Song"', () => {
      test('should parse dash separator', () => {
        const result = parseVideoTitle('Rick Astley - Never Gonna Give You Up');
        expect(result.artist).toBe('rick astley');
        expect(result.song).toBe('never gonna give you up');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      test('should handle extra spaces around dash', () => {
        const result = parseVideoTitle('Artist  -  Song Name');
        expect(result.artist).toBe('artist');
        expect(result.song).toBe('song name');
      });

      test('should handle official video suffix', () => {
        const result = parseVideoTitle('Artist - Song (Official Video)');
        expect(result.artist).toBe('artist');
        expect(result.song).toBe('song');
      });

      test('should handle multiple suffixes', () => {
        // cleanTitle only removes suffixes at the end, one pass through
        // Only the last matching suffix gets removed
        const result = parseVideoTitle('Artist - Song (Official Music Video)');
        expect(result.artist).toBe('artist');
        expect(result.song).toBe('song');
      });
    });

    describe('Pattern 2: "Song by Artist"', () => {
      test('should parse "by" separator', () => {
        const result = parseVideoTitle('Never Gonna Give You Up by Rick Astley');
        expect(result.artist).toBe('rick astley');
        expect(result.song).toBe('never gonna give you up');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      test('should be case insensitive for "by"', () => {
        const result = parseVideoTitle('Song BY Artist');
        expect(result.artist).toBe('artist');
        expect(result.song).toBe('song');
      });
    });

    describe('Pattern 3: "Artist: Song"', () => {
      test('should parse colon separator', () => {
        const result = parseVideoTitle('Rick Astley: Never Gonna Give You Up');
        expect(result.artist).toBe('rick astley');
        expect(result.song).toBe('never gonna give you up');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      test('should handle spaces around colon', () => {
        const result = parseVideoTitle('Artist:   Song');
        expect(result.artist).toBe('artist');
        expect(result.song).toBe('song');
      });
    });

    describe('Pattern 4: "Artist | Song"', () => {
      test('should parse pipe separator', () => {
        const result = parseVideoTitle('Rick Astley | Never Gonna Give You Up');
        expect(result.artist).toBe('rick astley');
        expect(result.song).toBe('never gonna give you up');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      test('should handle spaces around pipe', () => {
        const result = parseVideoTitle('Artist|Song');
        expect(result.artist).toBe('artist');
        expect(result.song).toBe('song');
      });
    });

    describe('Confidence calculation', () => {
      test('should have higher confidence when artist matches channel', () => {
        const result1 = parseVideoTitle('Rick Astley - Song', 'Rick Astley');
        const result2 = parseVideoTitle('Rick Astley - Song', 'Different Channel');

        expect(result1.confidence).toBeGreaterThan(result2.confidence);
      });

      test('should have higher confidence when artist and song are different', () => {
        const result = parseVideoTitle('Artist - Song', 'Artist');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      test('should boost confidence for reasonable length strings', () => {
        const result = parseVideoTitle('A - B'); // Too short
        const result2 = parseVideoTitle('Artist - Song Name');

        expect(result2.confidence).toBeGreaterThan(result.confidence);
      });

      test('should cap confidence at 1.0', () => {
        const result = parseVideoTitle('Artist - Song', 'Artist');
        expect(result.confidence).toBeLessThanOrEqual(1.0);
      });
    });

    describe('Fallback to channel name', () => {
      test('should use channel as artist when no pattern matches', () => {
        const result = parseVideoTitle('Just a Song Title', 'Rick Astley Official');
        expect(result.artist).toBe('Rick Astley'); // Channel not lowercased, only "Official" removed
        expect(result.song).toBe('just a song title');
        expect(result.confidence).toBe(0.4);
      });

      test('should clean VEVO from channel name', () => {
        const result = parseVideoTitle('Song Title', 'RickAstleyVEVO');
        expect(result.artist).toBe('RickAstley'); // VEVO removed, not lowercased
      });

      test('should clean "Official" from channel name', () => {
        const result = parseVideoTitle('Song', 'Artist Official');
        expect(result.artist).toBe('Artist'); // Official removed, not lowercased
      });

      test('should clean "Music" from channel name', () => {
        const result = parseVideoTitle('Song', 'Artist Music');
        expect(result.artist).toBe('Artist'); // Music removed, not lowercased
      });
    });

    describe('Last resort fallback', () => {
      test('should use entire title as song when no channel provided', () => {
        const result = parseVideoTitle('Some Random Title');
        expect(result.artist).toBeNull();
        expect(result.song).toBe('some random title');
        expect(result.confidence).toBe(0.3);
      });
    });

    describe('Common suffix removal', () => {
      const suffixes = [
        '(Official Video)',
        '(Official Music Video)',
        '(Official Audio)',
        '(Lyric Video)',
        '(Lyrics)',
        '[Official Video]',
        '(Music Video)',
        '(Audio)',
        '(HD)',
        '(4K)',
        '(Explicit)',
        '(Clean)',
        '(Radio Edit)',
        '(Extended)',
        '(Remix)',
        '(Remastered)'
      ];

      suffixes.forEach(suffix => {
        test(`should remove ${suffix}`, () => {
          const result = parseVideoTitle(`Artist - Song ${suffix}`);
          expect(result.song).toBe('song');
          expect(result.song).not.toContain(suffix.toLowerCase());
        });
      });

      test('should only remove suffix at the end', () => {
        // Only (4K) is at the end and gets removed, others stay
        const result = parseVideoTitle('Artist - Song (Official Video) (HD) (4K)');
        expect(result.song).toBe('song (official video) (hd)');
      });
    });

    describe('Edge cases', () => {
      test('should handle title with multiple dashes', () => {
        const result = parseVideoTitle('Artist - Song - Extended Version');
        expect(result.artist).toBe('artist');
        expect(result.song).toContain('song');
      });

      test('should handle very long titles', () => {
        const longTitle = 'Artist - ' + 'A'.repeat(200);
        const result = parseVideoTitle(longTitle);
        expect(result.artist).toBe('artist');
        expect(result.song).toBeTruthy();
      });

      test('should handle special characters in title', () => {
        // "(official)" is not in the suffix list (needs "video" or "audio" etc.)
        const result = parseVideoTitle('Beyoncé - Halo (Official Video)');
        expect(result.artist).toBe('beyoncé');
        expect(result.song).toBe('halo');
      });

      test('should trim whitespace', () => {
        const result = parseVideoTitle('   Artist - Song   ');
        expect(result.artist).toBe('artist');
        expect(result.song).toBe('song');
      });
    });
  });

  describe('extractPlaylistId', () => {
    test('should extract playlist ID from standard URL', () => {
      const url = 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf';
      expect(extractPlaylistId(url)).toBe('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf');
    });

    test('should extract playlist ID with additional parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest123&index=1';
      expect(extractPlaylistId(url)).toBe('PLtest123');
    });

    test('should handle list parameter with &', () => {
      const url = 'https://www.youtube.com/watch?v=abc&list=PLtest456';
      expect(extractPlaylistId(url)).toBe('PLtest456');
    });

    test('should return null for URL without playlist', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractPlaylistId(url)).toBeNull();
    });

    test('should return null for null URL', () => {
      expect(extractPlaylistId(null)).toBeNull();
    });

    test('should return null for empty URL', () => {
      expect(extractPlaylistId('')).toBeNull();
    });

    test('should handle short URLs with playlist', () => {
      const url = 'youtube.com/playlist?list=PLshorttest';
      expect(extractPlaylistId(url)).toBe('PLshorttest');
    });

    test('should handle playlist IDs with dashes and underscores', () => {
      const url = 'https://www.youtube.com/playlist?list=PL-test_123-456';
      expect(extractPlaylistId(url)).toBe('PL-test_123-456');
    });
  });

  describe('extractVideoId', () => {
    test('should extract from standard watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should extract from short URL (youtu.be)', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should extract from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should extract with additional parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest&index=1';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should handle parameter order', () => {
      const url = 'https://www.youtube.com/watch?t=10&v=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should return null for invalid URL', () => {
      expect(extractVideoId('https://www.youtube.com/')).toBeNull();
    });

    test('should return null for null URL', () => {
      expect(extractVideoId(null)).toBeNull();
    });

    test('should return null for empty URL', () => {
      expect(extractVideoId('')).toBeNull();
    });

    test('should handle video IDs with dashes and underscores', () => {
      const url = 'https://www.youtube.com/watch?v=test-123_ABC';
      expect(extractVideoId(url)).toBe('test-123_ABC');
    });

    test('should handle youtu.be with parameters', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ?t=10';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    test('should handle embed URL with parameters', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });
  });
});
