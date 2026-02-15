import { useState, useEffect, useCallback } from 'react';
import useDebounce from './useDebounce';

/**
 * Custom hook for managing feels meter selection logic
 * Handles debouncing and video selection based on feels score
 */
function useFeelsSelection(videos, onVideoChange) {
  const [sliderValue, setSliderValue] = useState(50);
  const [currentVideo, setCurrentVideo] = useState(null);

  // Debounce slider changes to avoid choppy video switching
  const debouncedFeelsValue = useDebounce(sliderValue, 300);

  // Find video closest to target feels score
  const findClosestVideo = useCallback((targetScore) => {
    if (!videos || videos.length === 0) return null;

    let closest = videos[0];
    let minDifference = Math.abs(videos[0].feelsScore - targetScore);

    for (const video of videos) {
      const difference = Math.abs(video.feelsScore - targetScore);
      if (difference < minDifference) {
        minDifference = difference;
        closest = video;
      }
    }

    return closest;
  }, [videos]);

  // When debounced feels value changes, select closest video
  useEffect(() => {
    if (!videos || videos.length === 0) return;

    const targetVideo = findClosestVideo(debouncedFeelsValue);

    // Only switch if feels difference is significant (>= 5 points)
    // This prevents too frequent switching
    if (targetVideo && (!currentVideo ||
        Math.abs(targetVideo.feelsScore - currentVideo.feelsScore) >= 5 ||
        targetVideo.videoId !== currentVideo.videoId)) {
      setCurrentVideo(targetVideo);
      if (onVideoChange) {
        onVideoChange(targetVideo);
      }
    }
  }, [debouncedFeelsValue, videos, findClosestVideo, onVideoChange]);

  // Set initial video when videos load
  useEffect(() => {
    if (videos && videos.length > 0 && !currentVideo) {
      const initialVideo = findClosestVideo(sliderValue);
      setCurrentVideo(initialVideo);
      if (onVideoChange && initialVideo) {
        onVideoChange(initialVideo);
      }
    }
  }, [videos, currentVideo, sliderValue, findClosestVideo, onVideoChange]);

  const handleSliderChange = useCallback((value) => {
    setSliderValue(value);
  }, []);

  const selectVideo = useCallback((video) => {
    setCurrentVideo(video);
    setSliderValue(video.feelsScore);
    if (onVideoChange) {
      onVideoChange(video);
    }
  }, [onVideoChange]);

  return {
    sliderValue,
    currentVideo,
    handleSliderChange,
    selectVideo
  };
}

export default useFeelsSelection;
