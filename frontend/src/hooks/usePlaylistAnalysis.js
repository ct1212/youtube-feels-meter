import { useState, useCallback } from 'react';
import { fetchPlaylistInfo, analyzeVideos } from '../services/api';

/**
 * Custom hook for managing playlist analysis flow
 */
function usePlaylistAnalysis() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [analyzedVideos, setAnalyzedVideos] = useState([]);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });

  const analyzePlaylist = useCallback(async (playlistUrl) => {
    setLoading(true);
    setAnalyzing(false);
    setError(null);
    setPlaylist(null);
    setAnalyzedVideos([]);

    try {
      // Step 1: Fetch playlist info
      console.log('Fetching playlist info...');
      const playlistData = await fetchPlaylistInfo(playlistUrl);
      setPlaylist(playlistData);

      // Step 2: Analyze videos
      console.log(`Analyzing ${playlistData.videos.length} videos...`);
      setLoading(false);
      setAnalyzing(true);
      setAnalysisProgress({ current: 0, total: playlistData.videos.length });

      const analysisResult = await analyzeVideos(
        playlistData.videos,
        playlistData.playlistId
      );

      console.log('Analysis complete:', analysisResult.stats);
      setAnalyzedVideos(analysisResult.results);
      setAnalyzing(false);

      // Cache to localStorage
      try {
        const cacheData = {
          playlist: playlistData,
          videos: analysisResult.results,
          timestamp: Date.now()
        };
        localStorage.setItem(
          `playlist_${playlistData.playlistId}`,
          JSON.stringify(cacheData)
        );
      } catch (cacheError) {
        console.warn('Failed to cache to localStorage:', cacheError);
      }

      return {
        playlist: playlistData,
        videos: analysisResult.results,
        stats: analysisResult.stats
      };
    } catch (err) {
      console.error('Error analyzing playlist:', err);
      setError(err.message || 'Failed to analyze playlist');
      setLoading(false);
      setAnalyzing(false);
      throw err;
    }
  }, []);

  const loadCachedPlaylist = useCallback((playlistId) => {
    try {
      const cached = localStorage.getItem(`playlist_${playlistId}`);
      if (cached) {
        const data = JSON.parse(cached);

        // Check if cache is less than 7 days old
        const age = Date.now() - data.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (age < maxAge) {
          setPlaylist(data.playlist);
          setAnalyzedVideos(data.videos);
          return true;
        }
      }
    } catch (err) {
      console.warn('Failed to load cached playlist:', err);
    }
    return false;
  }, []);

  const clearCache = useCallback(() => {
    setPlaylist(null);
    setAnalyzedVideos([]);
    setError(null);
    setAnalysisProgress({ current: 0, total: 0 });
  }, []);

  return {
    loading,
    analyzing,
    error,
    playlist,
    analyzedVideos,
    analysisProgress,
    analyzePlaylist,
    loadCachedPlaylist,
    clearCache
  };
}

export default usePlaylistAnalysis;
