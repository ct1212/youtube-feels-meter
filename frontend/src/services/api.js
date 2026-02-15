/**
 * API service for backend communication
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch playlist info from YouTube
 */
export async function fetchPlaylistInfo(playlistUrl) {
  const response = await api.post('/api/playlist/info', { playlistUrl });
  return response.data.data;
}

/**
 * Analyze videos and get feels scores
 */
export async function analyzeVideos(videos, playlistId) {
  const response = await api.post('/api/analyze/batch', {
    videos,
    playlistId
  });
  return response.data.data;
}

/**
 * Analyze a single video
 */
export async function analyzeSingleVideo(video) {
  const response = await api.post('/api/analyze/single', video);
  return response.data.data;
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await api.get('/health');
  return response.data;
}

export default api;
