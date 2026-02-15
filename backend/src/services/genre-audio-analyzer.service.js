/**
 * Genre-Based Audio Analyzer Service
 * Infers audio features from genre tags and metadata
 * No LLM required - completely free!
 */

class GenreAudioAnalyzerService {
  constructor() {
    this.genreMap = this.buildGenreMap();
  }

  /**
   * Infer audio features from genres and metadata
   *
   * @param {Object} params - Song metadata
   * @param {string} params.artist - Artist name
   * @param {string} params.song - Song title
   * @param {Array} params.genres - Genre tags from MusicBrainz
   * @returns {Object} Inferred audio features
   */
  inferAudioFeatures({ artist, song, genres = [] }) {
    // Start with neutral defaults
    let features = {
      energy: 0.5,
      tempo: 120,
      danceability: 0.5,
      loudness: -10,
      valence: 0.5,
      acousticness: 0.5,
      confidence: 0.5,
      source: 'genre-heuristic'
    };

    if (genres.length === 0) {
      // Try to infer from song/artist name
      features = this.inferFromNames(artist, song);
      features.confidence = 0.3;
      return features;
    }

    // Combine genre-based features
    const genreFeatures = this.analyzeGenres(genres);
    features = { ...features, ...genreFeatures };

    // Adjust based on song title keywords
    features = this.adjustForTitleKeywords(song, features);

    // Set confidence based on genre match quality
    features.confidence = this.calculateConfidence(genres);

    return features;
  }

  /**
   * Analyze genres and return average features
   */
  analyzeGenres(genres) {
    const genreStr = genres.join(' ').toLowerCase();
    const matchedFeatures = [];

    // Check each genre pattern
    for (const [pattern, features] of Object.entries(this.genreMap)) {
      if (genreStr.includes(pattern)) {
        matchedFeatures.push(features);
      }
    }

    // If no matches, return neutral
    if (matchedFeatures.length === 0) {
      return this.genreMap['pop']; // Default to pop as baseline
    }

    // Average all matched genre features
    const avg = {
      energy: 0,
      tempo: 0,
      danceability: 0,
      loudness: 0,
      valence: 0,
      acousticness: 0
    };

    for (const features of matchedFeatures) {
      avg.energy += features.energy;
      avg.tempo += features.tempo;
      avg.danceability += features.danceability;
      avg.loudness += features.loudness;
      avg.valence += features.valence;
      avg.acousticness += features.acousticness;
    }

    const count = matchedFeatures.length;
    return {
      energy: avg.energy / count,
      tempo: Math.round(avg.tempo / count),
      danceability: avg.danceability / count,
      loudness: avg.loudness / count,
      valence: avg.valence / count,
      acousticness: avg.acousticness / count
    };
  }

  /**
   * Adjust features based on song title keywords
   */
  adjustForTitleKeywords(song, features) {
    if (!song) return features;

    const title = song.toLowerCase();

    // Energetic keywords
    if (title.match(/\b(rage|aggressive|intense|power|extreme|brutal)\b/)) {
      features.energy = Math.min(1.0, features.energy + 0.2);
      features.loudness = Math.min(-5, features.loudness + 2);
    }

    // Chill keywords
    if (title.match(/\b(chill|calm|relax|peaceful|ambient|slow|soft)\b/)) {
      features.energy = Math.max(0.1, features.energy - 0.2);
      features.tempo = Math.max(60, features.tempo - 20);
    }

    // Happy keywords
    if (title.match(/\b(happy|joy|sunshine|bright|upbeat|party)\b/)) {
      features.valence = Math.min(1.0, features.valence + 0.2);
    }

    // Sad keywords
    if (title.match(/\b(sad|blue|tears|lonely|heartbreak|melancholy)\b/)) {
      features.valence = Math.max(0.1, features.valence - 0.3);
      features.energy = Math.max(0.2, features.energy - 0.1);
    }

    // Acoustic keywords
    if (title.match(/\b(acoustic|unplugged|stripped|piano|guitar)\b/)) {
      features.acousticness = Math.min(1.0, features.acousticness + 0.3);
    }

    return features;
  }

  /**
   * Infer from artist/song names when no genres available
   */
  inferFromNames(artist, song) {
    const combined = `${artist} ${song}`.toLowerCase();

    // Classical/orchestral indicators
    if (combined.match(/\b(symphony|concerto|sonata|mozart|beethoven|bach)\b/)) {
      return {
        energy: 0.4,
        tempo: 100,
        danceability: 0.2,
        loudness: -12,
        valence: 0.5,
        acousticness: 0.95
      };
    }

    // Electronic indicators
    if (combined.match(/\b(dj|remix|mix|dubstep|techno|edm|electronic)\b/)) {
      return {
        energy: 0.8,
        tempo: 128,
        danceability: 0.85,
        loudness: -6,
        valence: 0.7,
        acousticness: 0.05
      };
    }

    // Return neutral default
    return {
      energy: 0.5,
      tempo: 120,
      danceability: 0.5,
      loudness: -10,
      valence: 0.5,
      acousticness: 0.5
    };
  }

  /**
   * Calculate confidence based on genre quality
   */
  calculateConfidence(genres) {
    if (genres.length === 0) return 0.3;
    if (genres.length === 1) return 0.6;
    if (genres.length >= 3) return 0.8;
    return 0.7;
  }

  /**
   * Build comprehensive genre mapping
   * Maps genre patterns to audio feature profiles
   */
  buildGenreMap() {
    return {
      // Rock & Metal
      'metal': {
        energy: 0.95,
        tempo: 160,
        danceability: 0.5,
        loudness: -5,
        valence: 0.5,
        acousticness: 0.1
      },
      'heavy metal': {
        energy: 0.98,
        tempo: 170,
        danceability: 0.45,
        loudness: -4,
        valence: 0.4,
        acousticness: 0.05
      },
      'death metal': {
        energy: 1.0,
        tempo: 180,
        danceability: 0.4,
        loudness: -3,
        valence: 0.3,
        acousticness: 0.02
      },
      'punk': {
        energy: 0.9,
        tempo: 170,
        danceability: 0.6,
        loudness: -5,
        valence: 0.5,
        acousticness: 0.15
      },
      'hardcore': {
        energy: 0.95,
        tempo: 180,
        danceability: 0.55,
        loudness: -4,
        valence: 0.4,
        acousticness: 0.1
      },
      'rock': {
        energy: 0.75,
        tempo: 130,
        danceability: 0.55,
        loudness: -6,
        valence: 0.6,
        acousticness: 0.2
      },
      'hard rock': {
        energy: 0.85,
        tempo: 140,
        danceability: 0.6,
        loudness: -5,
        valence: 0.55,
        acousticness: 0.15
      },
      'alternative': {
        energy: 0.65,
        tempo: 120,
        danceability: 0.55,
        loudness: -7,
        valence: 0.5,
        acousticness: 0.25
      },

      // Electronic & Dance
      'electronic': {
        energy: 0.8,
        tempo: 128,
        danceability: 0.85,
        loudness: -6,
        valence: 0.7,
        acousticness: 0.05
      },
      'techno': {
        energy: 0.85,
        tempo: 130,
        danceability: 0.9,
        loudness: -5,
        valence: 0.6,
        acousticness: 0.02
      },
      'house': {
        energy: 0.8,
        tempo: 125,
        danceability: 0.9,
        loudness: -6,
        valence: 0.75,
        acousticness: 0.05
      },
      'trance': {
        energy: 0.85,
        tempo: 138,
        danceability: 0.85,
        loudness: -5,
        valence: 0.7,
        acousticness: 0.03
      },
      'dubstep': {
        energy: 0.9,
        tempo: 140,
        danceability: 0.8,
        loudness: -4,
        valence: 0.6,
        acousticness: 0.02
      },
      'drum and bass': {
        energy: 0.92,
        tempo: 170,
        danceability: 0.85,
        loudness: -5,
        valence: 0.65,
        acousticness: 0.03
      },
      'edm': {
        energy: 0.88,
        tempo: 128,
        danceability: 0.9,
        loudness: -4,
        valence: 0.8,
        acousticness: 0.02
      },
      'dance': {
        energy: 0.8,
        tempo: 125,
        danceability: 0.92,
        loudness: -6,
        valence: 0.8,
        acousticness: 0.05
      },

      // Hip-Hop & Rap
      'hip hop': {
        energy: 0.7,
        tempo: 95,
        danceability: 0.8,
        loudness: -6,
        valence: 0.6,
        acousticness: 0.1
      },
      'rap': {
        energy: 0.7,
        tempo: 95,
        danceability: 0.75,
        loudness: -6,
        valence: 0.6,
        acousticness: 0.1
      },
      'trap': {
        energy: 0.75,
        tempo: 140,
        danceability: 0.8,
        loudness: -5,
        valence: 0.55,
        acousticness: 0.05
      },

      // Pop & Mainstream
      'pop': {
        energy: 0.65,
        tempo: 118,
        danceability: 0.7,
        loudness: -6,
        valence: 0.7,
        acousticness: 0.15
      },
      'indie pop': {
        energy: 0.6,
        tempo: 115,
        danceability: 0.65,
        loudness: -7,
        valence: 0.65,
        acousticness: 0.3
      },
      'synth pop': {
        energy: 0.7,
        tempo: 120,
        danceability: 0.75,
        loudness: -6,
        valence: 0.75,
        acousticness: 0.1
      },

      // R&B & Soul
      'r&b': {
        energy: 0.55,
        tempo: 90,
        danceability: 0.65,
        loudness: -8,
        valence: 0.6,
        acousticness: 0.25
      },
      'soul': {
        energy: 0.6,
        tempo: 95,
        danceability: 0.6,
        loudness: -8,
        valence: 0.65,
        acousticness: 0.4
      },
      'funk': {
        energy: 0.75,
        tempo: 110,
        danceability: 0.85,
        loudness: -7,
        valence: 0.75,
        acousticness: 0.2
      },

      // Jazz & Blues
      'jazz': {
        energy: 0.45,
        tempo: 105,
        danceability: 0.5,
        loudness: -12,
        valence: 0.55,
        acousticness: 0.7
      },
      'blues': {
        energy: 0.5,
        tempo: 90,
        danceability: 0.45,
        loudness: -10,
        valence: 0.4,
        acousticness: 0.6
      },

      // Classical & Orchestral
      'classical': {
        energy: 0.4,
        tempo: 100,
        danceability: 0.2,
        loudness: -15,
        valence: 0.5,
        acousticness: 0.95
      },
      'orchestral': {
        energy: 0.45,
        tempo: 105,
        danceability: 0.2,
        loudness: -13,
        valence: 0.55,
        acousticness: 0.95
      },

      // Country & Folk
      'country': {
        energy: 0.55,
        tempo: 110,
        danceability: 0.6,
        loudness: -8,
        valence: 0.65,
        acousticness: 0.6
      },
      'folk': {
        energy: 0.45,
        tempo: 100,
        danceability: 0.45,
        loudness: -10,
        valence: 0.55,
        acousticness: 0.8
      },
      'acoustic': {
        energy: 0.4,
        tempo: 95,
        danceability: 0.4,
        loudness: -12,
        valence: 0.6,
        acousticness: 0.9
      },

      // Ambient & Chill
      'ambient': {
        energy: 0.2,
        tempo: 70,
        danceability: 0.3,
        loudness: -18,
        valence: 0.5,
        acousticness: 0.4
      },
      'chillout': {
        energy: 0.25,
        tempo: 80,
        danceability: 0.35,
        loudness: -15,
        valence: 0.6,
        acousticness: 0.35
      },
      'downtempo': {
        energy: 0.3,
        tempo: 85,
        danceability: 0.4,
        loudness: -14,
        valence: 0.55,
        acousticness: 0.3
      },
      'lounge': {
        energy: 0.35,
        tempo: 90,
        danceability: 0.45,
        loudness: -13,
        valence: 0.6,
        acousticness: 0.4
      },

      // Reggae & Latin
      'reggae': {
        energy: 0.55,
        tempo: 80,
        danceability: 0.75,
        loudness: -8,
        valence: 0.7,
        acousticness: 0.3
      },
      'latin': {
        energy: 0.7,
        tempo: 115,
        danceability: 0.85,
        loudness: -7,
        valence: 0.75,
        acousticness: 0.25
      },
      'salsa': {
        energy: 0.75,
        tempo: 120,
        danceability: 0.9,
        loudness: -6,
        valence: 0.8,
        acousticness: 0.3
      },

      // Indie & Alternative
      'indie': {
        energy: 0.55,
        tempo: 110,
        danceability: 0.55,
        loudness: -8,
        valence: 0.55,
        acousticness: 0.35
      },
      'indie rock': {
        energy: 0.65,
        tempo: 120,
        danceability: 0.6,
        loudness: -7,
        valence: 0.6,
        acousticness: 0.25
      },

      // Experimental
      'experimental': {
        energy: 0.5,
        tempo: 110,
        danceability: 0.4,
        loudness: -10,
        valence: 0.45,
        acousticness: 0.3
      },
      'noise': {
        energy: 0.85,
        tempo: 120,
        danceability: 0.3,
        loudness: -4,
        valence: 0.3,
        acousticness: 0.1
      }
    };
  }
}

// Singleton instance
const genreAudioAnalyzer = new GenreAudioAnalyzerService();

export default genreAudioAnalyzer;
