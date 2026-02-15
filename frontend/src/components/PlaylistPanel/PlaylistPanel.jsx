import React, { useState, useMemo } from 'react';
import VideoItem from './VideoItem';
import './PlaylistPanel.css';

function PlaylistPanel({ videos, currentVideoId, onVideoSelect, playlistTitle }) {
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [filterMatched, setFilterMatched] = useState('all'); // 'all', 'matched', 'unmatched'

  const sortedAndFilteredVideos = useMemo(() => {
    let filtered = [...videos];

    // Apply filter
    if (filterMatched === 'matched') {
      filtered = filtered.filter(v => v.matched);
    } else if (filterMatched === 'unmatched') {
      filtered = filtered.filter(v => !v.matched);
    }

    // Apply sort
    filtered.sort((a, b) => {
      const scoreA = a.feelsScore || 50;
      const scoreB = b.feelsScore || 50;
      return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
    });

    return filtered;
  }, [videos, sortOrder, filterMatched]);

  const stats = useMemo(() => {
    const matched = videos.filter(v => v.matched).length;
    const total = videos.length;
    const avgScore = Math.round(
      videos.reduce((sum, v) => sum + (v.feelsScore || 50), 0) / total
    );

    return { matched, total, avgScore };
  }, [videos]);

  return (
    <div className="playlist-panel">
      <div className="panel-header">
        <h2 className="panel-title">Playlist</h2>
        {playlistTitle && <p className="playlist-name">{playlistTitle}</p>}

        <div className="panel-stats">
          <span>{stats.total} videos</span>
          <span>{stats.matched} matched</span>
          <span>Avg: {stats.avgScore}</span>
        </div>

        <div className="panel-controls">
          <div className="control-group">
            <label>Sort:</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>

          <div className="control-group">
            <label>Filter:</label>
            <select value={filterMatched} onChange={(e) => setFilterMatched(e.target.value)}>
              <option value="all">All Videos</option>
              <option value="matched">Matched Only</option>
              <option value="unmatched">Unmatched Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="video-list">
        {sortedAndFilteredVideos.map((video) => (
          <VideoItem
            key={video.videoId}
            video={video}
            isPlaying={video.videoId === currentVideoId}
            onClick={() => onVideoSelect(video)}
          />
        ))}

        {sortedAndFilteredVideos.length === 0 && (
          <div className="empty-state">
            <p>No videos match the current filter</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaylistPanel;
