import React from 'react';
import './AnalysisLoader.css';

function AnalysisLoader({ progress, total, message }) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="analysis-loader">
      <div className="loader-content">
        <div className="loader-icon">
          <div className="spinner"></div>
          <span className="icon">🎵</span>
        </div>

        <h2>Analyzing Playlist</h2>
        <p className="loader-message">
          {message || 'Matching songs to Spotify and calculating feels scores...'}
        </p>

        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="progress-text">
            {progress} / {total} videos ({percentage}%)
          </div>
        </div>

        <div className="loader-tips">
          <p>💡 Tip: This may take 10-30 seconds depending on playlist size</p>
        </div>
      </div>
    </div>
  );
}

export default AnalysisLoader;
