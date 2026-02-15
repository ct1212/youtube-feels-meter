/**
 * Mock API responses for external services
 */

export const youtubePlaylistResponse = {
  kind: 'youtube#playlistListResponse',
  items: [
    {
      id: 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
      snippet: {
        title: 'Best of 80s',
        description: 'Greatest hits from the 1980s',
        channelTitle: 'Music Playlist',
        thumbnails: {
          default: {
            url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
            width: 120,
            height: 90
          },
          medium: {
            url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
            width: 320,
            height: 180
          }
        }
      },
      contentDetails: {
        itemCount: 50
      }
    }
  ]
};

export const youtubePlaylistItemsResponse = {
  kind: 'youtube#playlistItemListResponse',
  items: [
    {
      snippet: {
        resourceId: {
          videoId: 'dQw4w9WgXcQ'
        },
        title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
        channelTitle: 'Rick Astley',
        thumbnails: {
          default: {
            url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg'
          }
        }
      },
      contentDetails: {
        videoId: 'dQw4w9WgXcQ'
      }
    },
    {
      snippet: {
        resourceId: {
          videoId: 'M5V_IXMewl4'
        },
        title: 'a-ha - Take On Me (Official Video)',
        channelTitle: 'a-ha',
        thumbnails: {
          default: {
            url: 'https://i.ytimg.com/vi/M5V_IXMewl4/default.jpg'
          }
        }
      },
      contentDetails: {
        videoId: 'M5V_IXMewl4'
      }
    }
  ],
  nextPageToken: null,
  pageInfo: {
    totalResults: 2,
    resultsPerPage: 50
  }
};

export const youtubePlaylistItemsPagedResponse = {
  kind: 'youtube#playlistItemListResponse',
  items: [
    {
      snippet: {
        resourceId: { videoId: 'video1' },
        title: 'Video 1',
        channelTitle: 'Artist 1',
        thumbnails: { default: { url: 'https://example.com/1.jpg' } }
      },
      contentDetails: { videoId: 'video1' }
    }
  ],
  nextPageToken: 'next-page-token',
  pageInfo: {
    totalResults: 100,
    resultsPerPage: 1
  }
};

export const youtubeVideosResponse = {
  kind: 'youtube#videoListResponse',
  items: [
    {
      id: 'dQw4w9WgXcQ',
      contentDetails: {
        duration: 'PT3M33S'
      }
    },
    {
      id: 'M5V_IXMewl4',
      contentDetails: {
        duration: 'PT3M45S'
      }
    }
  ]
};

export const spotifyAuthResponse = {
  access_token: 'mock-access-token-1234567890',
  token_type: 'Bearer',
  expires_in: 3600
};

export const spotifySearchResponse = {
  tracks: {
    items: [
      {
        id: '4cOdK2wGLETKBW3PvgPWqT',
        name: 'Never Gonna Give You Up',
        artists: [
          {
            name: 'Rick Astley'
          }
        ],
        album: {
          name: 'Whenever You Need Somebody',
          images: [
            {
              url: 'https://i.scdn.co/image/ab67616d0000b273'
            }
          ]
        },
        duration_ms: 213000,
        preview_url: 'https://p.scdn.co/mp3-preview/123',
        external_urls: {
          spotify: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
        }
      }
    ]
  }
};

export const spotifyAudioFeaturesResponse = {
  id: '4cOdK2wGLETKBW3PvgPWqT',
  energy: 0.85,
  tempo: 113.0,
  danceability: 0.72,
  loudness: -7.5,
  valence: 0.93,
  acousticness: 0.12,
  instrumentalness: 0.0,
  speechiness: 0.04,
  liveness: 0.08,
  key: 7,
  mode: 1,
  time_signature: 4,
  duration_ms: 213000
};

export const spotifyBatchAudioFeaturesResponse = {
  audio_features: [
    {
      id: '4cOdK2wGLETKBW3PvgPWqT',
      energy: 0.85,
      tempo: 113.0,
      danceability: 0.72,
      loudness: -7.5,
      valence: 0.93,
      acousticness: 0.12
    },
    {
      id: '5W3cjX2J3tjhG8zb6u0qHn',
      energy: 0.73,
      tempo: 128.5,
      danceability: 0.81,
      loudness: -6.2,
      valence: 0.88,
      acousticness: 0.05
    }
  ]
};

export const spotifyEmptySearchResponse = {
  tracks: {
    items: []
  }
};
