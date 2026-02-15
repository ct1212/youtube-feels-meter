import React from 'react';
import YouTube from 'react-youtube';
import './VideoPlayer.css';

function VideoPlayer({ videoId, currentVideo, onReady, onStateChange }) {
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0
    }
  };

  return (
    <div className="video-player">
      <div className="player-wrapper">
        {videoId ? (
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onReady}
            onStateChange={onStateChange}
            className="youtube-player"
          />
        ) : (
          <div className="player-placeholder">
            <div className="placeholder-content">
              <h3>🎵</h3>
              <p>Move the Feels Meter to start playing</p>
            </div>
          </div>
        )}
      </div>

      {currentVideo && (
        <div className="now-playing">
          <div className="now-playing-header">
            <span className="playing-icon">▶</span>
            <span>Now Playing</span>
          </div>
          <h3 className="video-title">{currentVideo.title}</h3>
          <p className="channel-name">{currentVideo.channelTitle}</p>
          <div className="video-stats">
            <span className="feels-badge" style={{
              backgroundColor: getScoreColor(currentVideo.feelsScore)
            }}>
              Feels: {currentVideo.feelsScore}
            </span>
            {currentVideo.matched && (
              <span className="matched-badge">
                ✓ Matched to Spotify
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score) {
  if (score < 20) return '#4A90E2';
  if (score < 40) return '#50C878';
  if (score < 60) return '#F5A623';
  if (score < 80) return '#F57C00';
  return '#E74C3C';
}

export default VideoPlayer;
