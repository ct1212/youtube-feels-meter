import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook to manage YouTube player instance
 */
function useYouTubePlayer() {
  const [player, setPlayer] = useState(null);
  const [playerState, setPlayerState] = useState(null);
  const playerRef = useRef(null);

  const onReady = useCallback((event) => {
    playerRef.current = event.target;
    setPlayer(event.target);
    console.log('YouTube player ready');
  }, []);

  const onStateChange = useCallback((event) => {
    setPlayerState(event.data);
  }, []);

  const playVideo = useCallback((videoId) => {
    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId);
    }
  }, []);

  const pauseVideo = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  }, []);

  const stopVideo = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stopVideo();
    }
  }, []);

  return {
    player,
    playerState,
    onReady,
    onStateChange,
    playVideo,
    pauseVideo,
    stopVideo
  };
}

export default useYouTubePlayer;
