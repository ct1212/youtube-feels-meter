/**
 * Test fixtures - reusable test data
 */

export const mockYouTubeVideo = {
  id: 'dQw4w9WgXcQ',
  title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
  channelTitle: 'Rick Astley',
  thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
  duration: 'PT3M33S'
};

export const mockYouTubePlaylist = {
  id: 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
  title: 'Best of 80s',
  description: 'Greatest hits from the 1980s',
  channelTitle: 'Music Playlist',
  itemCount: 50,
  thumbnails: {
    default: {
      url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg'
    }
  }
};

export const mockSpotifyTrack = {
  id: '4cOdK2wGLETKBW3PvgPWqT',
  name: 'Never Gonna Give You Up',
  artists: [{ name: 'Rick Astley' }],
  album: {
    name: 'Whenever You Need Somebody',
    images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273' }]
  },
  duration_ms: 213000,
  preview_url: 'https://p.scdn.co/mp3-preview/123',
  external_urls: {
    spotify: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
  }
};

export const mockSpotifyAudioFeatures = {
  id: '4cOdK2wGLETKBW3PvgPWqT',
  energy: 0.85,
  tempo: 113.0,
  danceability: 0.72,
  loudness: -7.5,
  valence: 0.93,
  acousticness: 0.12,
  instrumentalness: 0.0,
  speechiness: 0.04,
  liveness: 0.08
};

export const mockMatchResult = {
  videoId: 'dQw4w9WgXcQ',
  videoTitle: 'Rick Astley - Never Gonna Give You Up (Official Video)',
  parsedArtist: 'Rick Astley',
  parsedSong: 'Never Gonna Give You Up',
  spotifyTrack: mockSpotifyTrack,
  audioFeatures: mockSpotifyAudioFeatures,
  feelsScore: 78,
  matchConfidence: 0.95,
  mood: 'Energetic',
  color: '#F57C00'
};

export const mockVideoWithFeelsScore = {
  ...mockYouTubeVideo,
  feelsScore: 78,
  mood: 'Energetic',
  color: '#F57C00',
  spotifyMatch: mockSpotifyTrack,
  audioFeatures: mockSpotifyAudioFeatures
};

export const createMockVideos = (count = 5) => {
  const videos = [];
  const scores = [15, 35, 55, 75, 95]; // One in each range

  for (let i = 0; i < count; i++) {
    videos.push({
      id: `video-${i}`,
      title: `Test Video ${i}`,
      channelTitle: `Artist ${i}`,
      feelsScore: scores[i] || 50
    });
  }

  return videos;
};

export const createMockAudioFeatures = (overrides = {}) => {
  return {
    energy: 0.5,
    tempo: 120,
    danceability: 0.5,
    loudness: -10,
    valence: 0.5,
    acousticness: 0.5,
    ...overrides
  };
};
