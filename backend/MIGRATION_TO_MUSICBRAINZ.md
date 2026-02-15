# Migration from Spotify to MusicBrainz + LLM

## Overview

The YouTube Feels Meter backend has been migrated from Spotify API to a free, open-source solution using:

1. **MusicBrainz** - Free music metadata database
2. **Claude AI (LLM)** - Intelligent audio feature inference

This eliminates API costs while maintaining (and potentially improving) the quality of mood analysis.

## Why the Migration?

- **Spotify API** is no longer free (as of 2024-2025)
- **MusicBrainz** provides free, comprehensive music metadata
- **LLM** can infer audio features with surprising accuracy from song/artist/genre data
- **Result**: Zero API costs, better caching, more sustainable

## Architecture

### Old Flow (Spotify)
```
YouTube Video Title
  → Parse Title (artist, song)
  → Spotify Search API
  → Spotify Audio Features API
  → Calculate Feels Score
```

### New Flow (MusicBrainz + LLM)
```
YouTube Video Title
  → Parse Title (artist, song)
  → MusicBrainz Search API (metadata + genres)
  → Claude AI (infer audio features from metadata)
  → Calculate Feels Score
```

## Key Files

### New Services
- `src/services/musicbrainz.service.js` - MusicBrainz API integration
- `src/services/llm-audio-analyzer.service.js` - Claude AI for audio feature inference
- `src/services/music-analysis.service.js` - Unified service combining MusicBrainz + LLM

### Updated Files
- `src/routes/analyze.routes.js` - Now uses `musicAnalysisService` instead of `spotifyService`
- `src/server.js` - Initializes music analysis service, updated env vars
- `package.json` - Added `@anthropic-ai/sdk` dependency

### Legacy Files (can be archived/removed)
- `src/services/spotify.service.js` - No longer used

## Environment Variables

### Required
```env
YOUTUBE_API_KEY=your-youtube-api-key-here
```

### Optional (Recommended)
```env
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

If no Anthropic API key is provided, the system falls back to genre-based heuristics (still functional but less accurate).

### No Longer Needed
```env
# SPOTIFY_CLIENT_ID - removed
# SPOTIFY_CLIENT_SECRET - removed
```

## Audio Feature Inference

### How LLM Infers Features

The LLM (Claude) is prompted with:
- Song title
- Artist name
- Genre tags (from MusicBrainz)
- Release year (if available)

It returns estimated values for:
- **Energy** (0.0-1.0) - Intensity and activity level
- **Tempo** (BPM) - Beats per minute
- **Danceability** (0.0-1.0) - Rhythm stability
- **Loudness** (dB) - Overall volume
- **Valence** (0.0-1.0) - Musical positivity/mood
- **Acousticness** (0.0-1.0) - Acoustic vs electronic
- **Confidence** (0.0-1.0) - LLM's confidence in estimates

### Fallback Strategies

1. **With Anthropic API**: LLM analyzes each song individually
2. **Without API (Genre Heuristics)**: Uses predefined patterns:
   - Metal/Punk → High energy, fast tempo
   - Electronic/EDM → High danceability, low acousticness
   - Classical/Acoustic → High acousticness, moderate energy
   - Ambient/Chill → Low energy, slow tempo
3. **Complete Fallback**: Neutral values (score = 50)

## Rate Limiting

### MusicBrainz
- **Limit**: 1 request per second
- **Enforcement**: Client-side rate limiting in service
- **Respect**: MusicBrainz is community-run, we respect their limits

### Claude AI
- **Limit**: Depends on your Anthropic plan
- **Batching**: Process 5 songs concurrently
- **Caching**: Aggressive (30-90 days) to minimize API calls

## Caching Strategy

All results are heavily cached to minimize external API calls:

- **Successful matches**: 30 days TTL
- **Failed matches**: 1 day TTL (retry later)
- **LLM analyses**: 90 days TTL (deterministic, won't change)
- **MusicBrainz metadata**: 30 days TTL

This means repeated playlist analysis is nearly instant.

## Accuracy Comparison

### Spotify (Real Audio Analysis)
- ✅ Precise audio features from actual waveform analysis
- ❌ Costs money
- ❌ Rate limits
- ⚠️ Limited to tracks in Spotify's catalog

### MusicBrainz + LLM
- ✅ Completely free
- ✅ Works for ANY song (not limited to catalog)
- ✅ LLM has cultural knowledge (can infer from context)
- ⚠️ Inferred features (not measured)
- ⚠️ Accuracy depends on LLM's training data

**In practice**: For most use cases, LLM inference is surprisingly accurate because:
1. Song titles/artists often indicate mood ("Chill Vibes", "Rage Against...")
2. Genres are strong predictors of audio features
3. LLMs have extensive training on music metadata

## API Costs

### Old (Spotify)
- Spotify API: $$$ (no longer free)
- Total: $$$ per month

### New (MusicBrainz + LLM)
- MusicBrainz: FREE (community-supported)
- Claude API: ~$0.003 per song (cached for 90 days)
- Total: < $1 per month for moderate usage (due to caching)

## Migration Checklist

- [x] Install `@anthropic-ai/sdk` dependency
- [x] Create MusicBrainz service
- [x] Create LLM audio analyzer service
- [x] Create unified music analysis service
- [x] Update analyze routes to use new service
- [x] Update server initialization
- [x] Update environment variable requirements
- [x] Update documentation

## Testing

The test suite remains compatible:
- Core algorithms (feels calculator, string matching) unchanged
- Integration tests work with new service
- Add `ANTHROPIC_API_KEY` to test environment for full LLM testing

Run tests:
```bash
npm test
```

## Rollout

1. **Update environment variables**:
   - Add `ANTHROPIC_API_KEY` (optional but recommended)
   - Remove `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Test with a playlist**:
   - Start server: `npm run dev`
   - Test health: `curl http://localhost:3001/health`
   - Test analysis with a small playlist

4. **Monitor**:
   - Check logs for "LLM Audio Analyzer: Initialized"
   - Watch cache hit rates
   - Verify feels scores look reasonable

## Future Enhancements

### Short Term
- Add user feedback mechanism to improve LLM prompts
- Build local ML model trained on LLM+MusicBrainz data
- Support for user-provided audio feature overrides

### Long Term
- Hybrid approach: Use AcousticBrainz data when available
- Train custom model on collected data
- Support multiple LLM providers (OpenAI, local models)

## Support

For issues or questions:
- MusicBrainz API: https://musicbrainz.org/doc/MusicBrainz_API
- Anthropic Claude: https://docs.anthropic.com
- Project issues: [Your GitHub issues URL]
