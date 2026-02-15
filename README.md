# YouTube Feels Meter 🎵

A mood-based YouTube playlist player that lets you navigate songs by energy level instead of linear order.

## What It Does

Input any YouTube playlist URL and the app analyzes each song's energy using Spotify's audio features. Songs are mapped along a vertical "Feels Meter" from Chill (0) to Intense (100). Slide the meter up or down to instantly play the corresponding mood.

**Problem Solved**: Finding the right mood music in large playlists is tedious. This app enables instant navigation to chill or energetic songs through a simple slider interaction.

## Features

- 🎚️ **Feels Meter**: Vertical slider interface (0-100) for mood-based navigation
- 🎵 **Smart Analysis**: Combines Spotify audio features (energy, tempo, danceability) into a single "feels score"
- ⚡ **Instant Playback**: Smooth debounced video switching as you slide
- 💾 **Smart Caching**: Analyzed playlists reload instantly via localStorage + Redis
- 📊 **Visual Feedback**: See all videos sorted by energy with match confidence scores

## How It Works

```
User inputs playlist URL
    ↓
Fetch all videos from YouTube API
    ↓
Parse titles → Match to Spotify → Get audio features
    ↓
Calculate Feels Score (0-100) from energy, tempo, etc.
    ↓
Display sorted playlist + meter + YouTube player
    ↓
User moves slider → Play closest video by feels score
```

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **APIs**: YouTube Data API v3, Spotify Web API
- **Caching**: Redis (production) / In-memory (development)

## Prerequisites

- Node.js 18+ and npm
- YouTube Data API key ([Get it here](https://console.cloud.google.com/apis/credentials))
- Spotify API credentials ([Get them here](https://developer.spotify.com/dashboard))
- Redis (optional, for production caching)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd youtube-meter

# Install backend dependencies
cd backend
npm install
cp .env.example .env
# Edit .env and add your API keys

# Install frontend dependencies
cd ../frontend
npm install
cp .env.example .env
```

### 2. Configure API Keys

Edit `backend/.env`:

```bash
YOUTUBE_API_KEY=your_youtube_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### 3. Run the Application

```bash
# Terminal 1: Start backend (from backend/ directory)
npm run dev
# Backend runs on http://localhost:3001

# Terminal 2: Start frontend (from frontend/ directory)
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Use the App

1. Open http://localhost:5173 in your browser
2. Paste a YouTube playlist URL (e.g., `https://www.youtube.com/playlist?list=PLxxx`)
3. Wait for analysis to complete (~10-30 seconds depending on playlist size)
4. Move the Feels Meter slider to explore songs by mood!

## Feels Score Algorithm

The core algorithm converts Spotify audio features into a 0-100 score:

```javascript
feelsScore = (
  energy * 0.40 +                    // Primary: perceived intensity
  (tempo / 200) * 0.25 +             // Speed (normalized from BPM)
  danceability * 0.15 +              // Rhythmic energy
  (loudness + 30) / 25 * 0.10 +      // Volume (normalized dB)
  valence * 0.05 +                   // Musical positivity
  (1 - acousticness) * 0.05          // Electronic bias higher
) * 100
```

**Example Results**:
- Classical piano: ~18 (Chill)
- Pop music: ~65 (Moderate)
- Heavy metal: ~87 (Intense)

## API Endpoints

### `POST /api/playlist/info`
Fetch YouTube playlist metadata and all videos.

**Request**:
```json
{ "playlistUrl": "https://www.youtube.com/playlist?list=..." }
```

**Response**:
```json
{
  "playlistId": "PLxxx",
  "title": "My Playlist",
  "videoCount": 50,
  "videos": [...]
}
```

### `POST /api/analyze/batch`
Analyze videos and calculate feels scores.

**Request**:
```json
{
  "videos": [...],
  "playlistId": "PLxxx"
}
```

**Response**:
```json
{
  "results": [
    {
      "videoId": "...",
      "feelsScore": 65,
      "matched": true,
      "spotifyMatch": {...},
      "audioFeatures": {...}
    }
  ]
}
```

## Project Structure

```
youtube-meter/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   ├── middleware/      # Express middleware
│   │   └── tests/           # Unit & integration tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # State management
│   │   ├── hooks/           # Custom hooks
│   │   └── services/        # API client
│   └── package.json
└── README.md
```

## Development

### Run Tests

```bash
# Backend unit tests
cd backend
npm test

# Backend integration tests
npm run test:integration
```

### Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories for all configuration options.

## Known Limitations

- **YouTube API Quota**: 10,000 units/day (fetching a 50-video playlist uses ~150 units)
- **Spotify Matching**: Accuracy depends on video title formatting (~70-80% match rate)
- **Non-Music Videos**: Videos without Spotify matches get a default score of 50
- **Rate Limits**: Backend implements rate limiting to prevent abuse

## Troubleshooting

**"Invalid API key" error**: Verify your YouTube API key in `backend/.env` and ensure the YouTube Data API v3 is enabled in Google Cloud Console.

**"Spotify authentication failed"**: Check your Spotify Client ID and Secret in `backend/.env`.

**Videos not matching**: The app parses video titles to find Spotify tracks. Videos with unusual title formats (e.g., "DJ Mix - 2 Hour Set") may not match. Ensure playlist contains individual songs with clear "Artist - Song" formatting.

**Cache not working**: Redis is optional. The app falls back to in-memory caching if Redis isn't available.

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ using React, Node.js, YouTube Data API, and Spotify Web API
