import React, { useState } from 'react';
import PlaylistInput from './components/PlaylistInput/PlaylistInput';
import FeelsMeter from './components/FeelsMeter/FeelsMeter';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import PlaylistPanel from './components/PlaylistPanel/PlaylistPanel';
import AnalysisLoader from './components/AnalysisLoader/AnalysisLoader';
import usePlaylistAnalysis from './hooks/usePlaylistAnalysis';
import useFeelsSelection from './hooks/useFeelsSelection';
import useYouTubePlayer from './hooks/useYouTubePlayer';
import './App.css';

function App() {
  const {
    loading,
    analyzing,
    error,
    playlist,
    analyzedVideos,
    analysisProgress,
    analyzePlaylist,
    clearCache
  } = usePlaylistAnalysis();

  const {
    player,
    playerState,
    onReady,
    onStateChange,
    playVideo
  } = useYouTubePlayer();

  const handleVideoChange = (video) => {
    if (video && playVideo) {
      playVideo(video.videoId);
    }
  };

  const {
    sliderValue,
    currentVideo,
    handleSliderChange,
    selectVideo
  } = useFeelsSelection(analyzedVideos, handleVideoChange);

  const handlePlaylistSubmit = async (url) => {
    try {
      await analyzePlaylist(url);
    } catch (err) {
      console.error('Failed to analyze playlist:', err);
    }
  };

  const handleReset = () => {
    clearCache();
  };

  return (
    <div className="app">
      {!playlist ? (
        <div className="input-screen">
          <PlaylistInput onSubmit={handlePlaylistSubmit} loading={loading} />
          {error && (
            <div className="error-container">
              <p className="error-text">❌ {error}</p>
              <button onClick={handleReset} className="retry-button">
                Try Again
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <header className="app-header">
            <h1 className="app-title">🎵 YouTube Feels Meter</h1>
            <button onClick={handleReset} className="new-playlist-button">
              New Playlist
            </button>
          </header>

          <main className="app-main">
            <div className="meter-section">
              <FeelsMeter
                value={sliderValue}
                onChange={handleSliderChange}
              />
            </div>

            <div className="player-section">
              <VideoPlayer
                videoId={currentVideo?.videoId}
                currentVideo={currentVideo}
                onReady={onReady}
                onStateChange={onStateChange}
              />
            </div>

            <div className="playlist-section">
              <PlaylistPanel
                videos={analyzedVideos}
                currentVideoId={currentVideo?.videoId}
                onVideoSelect={selectVideo}
                playlistTitle={playlist?.title}
              />
            </div>
          </main>
        </>
      )}

      {analyzing && (
        <AnalysisLoader
          progress={analysisProgress.current}
          total={analysisProgress.total}
        />
      )}
    </div>
  );
}

export default App;
