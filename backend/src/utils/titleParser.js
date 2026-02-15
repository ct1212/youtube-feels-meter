/**
 * Parses YouTube video titles to extract artist and song name
 * Handles common formats like "Artist - Song", "Song by Artist", etc.
 */

const COMMON_SUFFIXES = [
  '(official video)',
  '(official music video)',
  '(official audio)',
  '(lyric video)',
  '(lyrics)',
  '[official video]',
  '[official music video]',
  '[official audio]',
  '(music video)',
  '(audio)',
  '(hd)',
  '(4k)',
  '(explicit)',
  '(clean)',
  '(radio edit)',
  '(extended)',
  '(remix)',
  '(remastered)'
];

/**
 * Clean title by removing common suffixes and extra whitespace
 */
function cleanTitle(title) {
  let cleaned = title.toLowerCase();

  // Remove common suffixes
  for (const suffix of COMMON_SUFFIXES) {
    const regex = new RegExp(suffix.replace(/[()[\]]/g, '\\$&') + '\\s*$', 'gi');
    cleaned = cleaned.replace(regex, '');
  }

  // Remove extra whitespace
  cleaned = cleaned.trim().replace(/\s+/g, ' ');

  return cleaned;
}

/**
 * Calculate confidence score for parsed result
 * Higher confidence = more likely to be correct
 */
function calculateConfidence(artist, song, channelTitle) {
  let confidence = 0.5; // Base confidence

  // Boost confidence if artist and song are different
  if (artist && song && artist.toLowerCase() !== song.toLowerCase()) {
    confidence += 0.2;
  }

  // Boost confidence if artist matches channel name (partial match)
  if (artist && channelTitle) {
    const artistLower = artist.toLowerCase();
    const channelLower = channelTitle.toLowerCase();
    if (channelLower.includes(artistLower) || artistLower.includes(channelLower)) {
      confidence += 0.2;
    }
  }

  // Boost confidence if both artist and song are present and reasonable length
  if (artist && song && artist.length > 2 && song.length > 2) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

/**
 * Parse video title to extract artist and song name
 *
 * @param {string} title - YouTube video title
 * @param {string} channelTitle - YouTube channel name (optional, used as hint)
 * @returns {Object} { artist, song, confidence }
 */
export function parseVideoTitle(title, channelTitle = '') {
  if (!title) {
    return { artist: null, song: null, confidence: 0 };
  }

  const cleaned = cleanTitle(title);
  let artist = null;
  let song = null;

  // Pattern 1: "Artist - Song"
  const dashPattern = /^([^-]+)\s*-\s*(.+)$/;
  const dashMatch = cleaned.match(dashPattern);
  if (dashMatch) {
    artist = dashMatch[1].trim();
    song = dashMatch[2].trim();
    const confidence = calculateConfidence(artist, song, channelTitle);
    return { artist, song, confidence };
  }

  // Pattern 2: "Song by Artist"
  const byPattern = /^(.+)\s+by\s+(.+)$/i;
  const byMatch = cleaned.match(byPattern);
  if (byMatch) {
    song = byMatch[1].trim();
    artist = byMatch[2].trim();
    const confidence = calculateConfidence(artist, song, channelTitle);
    return { artist, song, confidence };
  }

  // Pattern 3: "Artist: Song"
  const colonPattern = /^([^:]+):\s*(.+)$/;
  const colonMatch = cleaned.match(colonPattern);
  if (colonMatch) {
    artist = colonMatch[1].trim();
    song = colonMatch[2].trim();
    const confidence = calculateConfidence(artist, song, channelTitle);
    return { artist, song, confidence };
  }

  // Pattern 4: "Artist | Song"
  const pipePattern = /^([^|]+)\|\s*(.+)$/;
  const pipeMatch = cleaned.match(pipePattern);
  if (pipeMatch) {
    artist = pipeMatch[1].trim();
    song = pipeMatch[2].trim();
    const confidence = calculateConfidence(artist, song, channelTitle);
    return { artist, song, confidence };
  }

  // Fallback: Use channel as artist, title as song
  if (channelTitle) {
    // Clean up channel name (remove VEVO, Official, etc.)
    artist = channelTitle
      .replace(/vevo$/i, '')
      .replace(/official$/i, '')
      .replace(/music$/i, '')
      .trim();
    song = cleaned;
    return { artist, song, confidence: 0.4 };
  }

  // Last resort: entire title is the song, no artist
  return { artist: null, song: cleaned, confidence: 0.3 };
}

/**
 * Extract playlist ID from YouTube URL
 * Supports various URL formats
 */
export function extractPlaylistId(url) {
  if (!url) return null;

  // Pattern: ?list=PLAYLIST_ID or &list=PLAYLIST_ID
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url) {
  if (!url) return null;

  // Pattern 1: youtube.com/watch?v=VIDEO_ID
  let match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  // Pattern 2: youtu.be/VIDEO_ID
  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  // Pattern 3: youtube.com/embed/VIDEO_ID
  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  return null;
}
