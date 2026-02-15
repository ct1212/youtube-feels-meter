import React, { useState } from 'react';
import './PlaylistInput.css';

function PlaylistInput({ onSubmit, loading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validatePlaylistUrl = (url) => {
    // Check for YouTube playlist URL patterns
    const patterns = [
      /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
      /youtube\.com\/.*[?&]list=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return true;
      }
    }
    return false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a playlist URL');
      return;
    }

    if (!validatePlaylistUrl(url)) {
      setError('Please enter a valid YouTube playlist URL');
      return;
    }

    onSubmit(url);
  };

  return (
    <div className="playlist-input-container">
      <div className="header">
        <h1>🎵 YouTube Feels Meter</h1>
        <p className="subtitle">Navigate playlists by mood and energy</p>
      </div>

      <form onSubmit={handleSubmit} className="playlist-form">
        <div className="input-group">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube playlist URL here..."
            className={error ? 'error' : ''}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Analyze'}
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="example">
          <p>Example: https://www.youtube.com/playlist?list=PLxxx...</p>
        </div>
      </form>
    </div>
  );
}

export default PlaylistInput;
