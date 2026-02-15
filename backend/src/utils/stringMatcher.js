/**
 * Fuzzy string matching utilities using various similarity algorithms
 */

/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of edits to transform one string into another)
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity ratio between two strings (0 to 1)
 * Uses normalized Levenshtein distance
 */
export function similarityRatio(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLength);
}

/**
 * Check if two strings match with a given threshold
 */
export function fuzzyMatch(str1, str2, threshold = 0.8) {
  return similarityRatio(str1, str2) >= threshold;
}

/**
 * Find best match from an array of candidates
 * Returns { match, score, index } or null if no good match
 */
export function findBestMatch(query, candidates, threshold = 0.6) {
  if (!query || !candidates || candidates.length === 0) {
    return null;
  }

  let bestMatch = null;
  let bestScore = 0;
  let bestIndex = -1;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (!candidate) continue;

    const score = similarityRatio(query, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
      bestIndex = i;
    }
  }

  if (bestScore >= threshold) {
    return { match: bestMatch, score: bestScore, index: bestIndex };
  }

  return null;
}

/**
 * Calculate combined similarity score for artist + song matching
 * Weights artist and song equally
 */
export function calculateMatchScore(query, candidate) {
  const { artist: qArtist, song: qSong } = query;
  const { artist: cArtist, song: cSong } = candidate;

  // If either artist or song is missing, use only available field
  if (!qArtist && !cArtist) {
    return qSong && cSong ? similarityRatio(qSong, cSong) : 0;
  }

  if (!qSong && !cSong) {
    return qArtist && cArtist ? similarityRatio(qArtist, cArtist) : 0;
  }

  // Both fields available - weighted average
  const artistScore = qArtist && cArtist ? similarityRatio(qArtist, cArtist) : 0;
  const songScore = qSong && cSong ? similarityRatio(qSong, cSong) : 0;

  // Weight equally
  return (artistScore + songScore) / 2;
}

/**
 * Normalize string for comparison
 * Removes special characters, extra spaces, and converts to lowercase
 */
export function normalizeString(str) {
  if (!str) return '';

  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace special chars with space
    .replace(/\s+/g, ' ')       // Collapse multiple spaces
    .trim();
}
