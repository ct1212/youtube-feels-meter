import React, { useState, useRef, useEffect } from 'react';
import './FeelsMeter.css';

function FeelsMeter({ value, onChange, min = 0, max = 100 }) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const getMoodLabel = (score) => {
    if (score < 20) return 'Very Chill';
    if (score < 40) return 'Relaxed';
    if (score < 60) return 'Moderate';
    if (score < 80) return 'Energetic';
    return 'Intense';
  };

  const getColor = (score) => {
    if (score < 20) return '#4A90E2';
    if (score < 40) return '#50C878';
    if (score < 60) return '#F5A623';
    if (score < 80) return '#F57C00';
    return '#E74C3C';
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateValue(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    updateValue(e.touches[0]);
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      updateValue(e.touches[0]);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const updateValue = (e) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = 1 - (y / rect.height); // Invert: top = 100, bottom = 0
    const newValue = Math.max(min, Math.min(max, Math.round(percentage * (max - min) + min)));

    onChange(newValue);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="feels-meter">
      <div className="meter-header">
        <h2>Feels Meter</h2>
        <div className="current-value" style={{ color: getColor(value) }}>
          {value}
        </div>
      </div>

      <div className="meter-labels-top">
        <span className="label-intense">Intense</span>
        <span className="label-value">100</span>
      </div>

      <div
        ref={sliderRef}
        className="slider-track"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="slider-fill"
          style={{
            height: `${percentage}%`,
            background: `linear-gradient(to top, ${getColor(0)}, ${getColor(value)})`
          }}
        />
        <div
          className="slider-thumb"
          style={{
            bottom: `${percentage}%`,
            backgroundColor: getColor(value)
          }}
        />
      </div>

      <div className="meter-labels-bottom">
        <span className="label-chill">Chill</span>
        <span className="label-value">0</span>
      </div>

      <div className="mood-label" style={{ color: getColor(value) }}>
        {getMoodLabel(value)}
      </div>
    </div>
  );
}

export default FeelsMeter;
