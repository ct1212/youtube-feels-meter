import React from 'react';
import './VideoItem.css';

function VideoItem({ video, isPlaying, onClick }) {
  const getScoreColor = (score) => {
    if (score < 20) return '#4A90E2';
    if (score < 40) return '#50C878';
    if (score < 60) return '#F5A623';
    if (score < 80) return '#F57C00';
    return '#E74C3C';
  };

  return (
    <div
      className={`video-item ${isPlaying ? 'playing' : ''}`}
      onClick={onClick}
    >
      <div className="thumbnail-wrapper">
        <img
          src={video.thumbnails?.default?.url || video.thumbnails?.medium?.url}
          alt={video.title}
          className="thumbnail"
        />
        {isPlaying && (
          <div className="playing-overlay">
            <span>▶</span>
          </div>
        )}
      </div>

      <div className="video-info">
        <h4 className="video-title">{video.title}</h4>
        <p className="video-channel">{video.channelTitle}</p>

        <div className="video-meta">
          <span
            className="score-badge"
            style={{ backgroundColor: getScoreColor(video.feelsScore) }}
          >
            {video.feelsScore}
          </span>
          {!video.matched && (
            <span className="unmatched-badge" title="No Spotify match">
              ?
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoItem;
