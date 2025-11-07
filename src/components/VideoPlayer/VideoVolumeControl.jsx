// src/components/VideoPlayer/VideoVolumeControl.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

export default function VideoVolumeControl({
  volume,
  toggleMute,
  handleVolumeChange,
}) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const hideVolumeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hideVolumeTimeoutRef.current) {
        clearTimeout(hideVolumeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      // SỬA: Dùng class thay vì inline style
      className="lvv-volume-control-wrapper"
      onMouseEnter={() => {
        if (hideVolumeTimeoutRef.current) {
          clearTimeout(hideVolumeTimeoutRef.current);
          hideVolumeTimeoutRef.current = null;
        }
        setShowVolumeSlider(true);
      }}
      onMouseLeave={() => {
        hideVolumeTimeoutRef.current = setTimeout(() => {
          setShowVolumeSlider(false);
        }, 2000);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* SỬA: Đưa thanh trượt lên trên */}
      {showVolumeSlider && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const newVolume = parseFloat(e.target.value);
            handleVolumeChange(newVolume);
          }}
          className="lvv-volume-slider" // CSS sẽ lo vị trí
        />
      )}

      {/* Nút âm lượng ở dưới */}
      <button
        className="lvv-volume-btn" // CSS sẽ lo vị trí
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
      >
        {volume === 0 ? (
          <FaVolumeMute size={22} color="#fff" />
        ) : (
          <FaVolumeUp size={22} color="#fff" />
        )}
      </button>
    </div>
  );
}