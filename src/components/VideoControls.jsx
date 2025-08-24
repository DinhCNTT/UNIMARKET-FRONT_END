import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import './VideoControls.css';
import { IoVolumeHigh, IoVolumeLow, IoVolumeOff } from 'react-icons/io5';
// 👆 dùng IoVolumeLow thay vì IoVolumeMute
import { VideoContext } from "../context/VideoContext";

const VideoControls = ({ videoRef, isVisible = true }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { volume, setVolume, isMuted, setIsMuted } = useContext(VideoContext);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [progress, setProgress] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  const volumeTimeoutRef = useRef(null);
  const progressBarRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Tối ưu hóa việc cập nhật thời gian video với requestAnimationFrame
  const updateTime = useCallback(() => {
    const video = videoRef.current;
    if (!video || isDragging) return;

    const currentTime = video.currentTime;
    const duration = video.duration || 0;
    const newProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

    setCurrentTime(currentTime);
    setDuration(duration);
    setProgress(newProgress);
  }, [videoRef, isDragging]);

    useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = volume;
    videoRef.current.muted = isMuted;
  }, [volume, isMuted, videoRef]);
  // Sử dụng requestAnimationFrame để smooth update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    const updateVolume = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', updateTime);
    video.addEventListener('volumechange', updateVolume);
    video.addEventListener('durationchange', updateTime);

    // Initial update
    updateTime();
    updateVolume();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', updateTime);
      video.removeEventListener('volumechange', updateVolume);
      video.removeEventListener('durationchange', updateTime);
    };
  }, [videoRef, updateTime]);

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (newVolume) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolume(clamped);
    setIsMuted(clamped === 0);
  };


  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      if (volume === 0) setVolume(0.5);
    } else {
      setIsMuted(true);
    }
  };

  const handleVolumeHover = () => {
    setShowVolumeSlider(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
  };

  const handleVolumeLeave = () => {
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 1500);
  };

  // Tối ưu hóa hàm tính toán progress
  const calculateProgress = useCallback((clientX) => {
    if (!progressBarRef.current) return null;

    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    let percentage = (offsetX / rect.width) * 100;

    // Clamp giá trị
    percentage = Math.max(0, Math.min(100, percentage));

    return {
      percentage,
      time: (percentage / 100) * duration
    };
  }, [duration]);

  // Tối ưu event handlers cho drag
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const result = calculateProgress(e.clientX);
    if (!result) return;

    setIsDragging(true);
    setDragProgress(result.percentage);

    // Cập nhật video ngay lập tức
    const video = videoRef.current;
    if (video) {
      video.currentTime = result.time;
    }
  }, [calculateProgress, videoRef]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const result = calculateProgress(e.clientX);
    if (!result) return;

    // Chỉ cập nhật UI, không cập nhật video khi đang drag
    setDragProgress(result.percentage);
  }, [isDragging, calculateProgress]);

  const handleMouseUp = useCallback((e) => {
    if (!isDragging) return;

    e.preventDefault();
    const result = calculateProgress(e.clientX);
    if (!result) return;

    const video = videoRef.current;
    if (video) {
      video.currentTime = result.time;
    }

    setIsDragging(false);
    setDragProgress(0);
  }, [isDragging, calculateProgress, videoRef]);

  // Touch events tương tự
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const result = calculateProgress(touch.clientX);
    if (!result) return;

    setIsDragging(true);
    setDragProgress(result.percentage);

    const video = videoRef.current;
    if (video) {
      video.currentTime = result.time;
    }
  }, [calculateProgress, videoRef]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const result = calculateProgress(touch.clientX);
    if (!result) return;

    setDragProgress(result.percentage);
  }, [isDragging, calculateProgress]);

  const handleTouchEnd = useCallback((e) => {
    if (!isDragging) return;

    e.preventDefault();
    const touch = e.changedTouches[0];
    const result = calculateProgress(touch.clientX);
    if (!result) return;

    const video = videoRef.current;
    if (video) {
      video.currentTime = result.time;
    }

    setIsDragging(false);
    setDragProgress(0);
  }, [isDragging, calculateProgress, videoRef]);

  // Global mouse events để handle drag outside
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = (e) => handleMouseUp(e);

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getVolumeIcon = () => {
  if (isMuted || volume <= 0.01) return <IoVolumeOff size={20} />; // 0 hoặc mute
  if (volume < 0.5) return <IoVolumeLow size={20} />;              // âm lượng nhỏ
  return <IoVolumeHigh size={20} />;                               // âm lượng lớn
};

  // Tính progress hiển thị
  const displayProgress = isDragging ? dragProgress : progress;
  const displayTime = isDragging ? (dragProgress / 100) * duration : currentTime;

  if (!isVisible) return null;

  return (
    <>
      {/* Volume Control - Góc trái phía trên */}
      <div
        className="VideoControls-volume-control"
        onMouseEnter={handleVolumeHover}
        onMouseLeave={handleVolumeLeave}
      >
        <button
          className="VideoControls-volume-button"
          onClick={handleMuteToggle}
          title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
        >
          {getVolumeIcon()}
        </button>

        {/* Volume Slider */}
        <div className={`VideoControls-volume-slider-container ${showVolumeSlider ? 'show' : ''}`}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="VideoControls-volume-slider"
          />
        </div>
      </div>

      {/* Progress Bar & Time - Dưới video */}
      <div className="VideoControls-progress-control">
        {/* Progress Bar */}
        <div
          className="VideoControls-progress-bar-container"
          ref={progressBarRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="VideoControls-progress-bar-background">
            <div
              className="VideoControls-progress-bar-fill"
              style={{ 
                width: `${displayProgress}%`,
                transition: isDragging ? 'none' : 'width 0.1s ease'
              }}
            />
            <div
              className="VideoControls-progress-bar-thumb"
              style={{ 
                left: `${displayProgress}%`,
                transition: isDragging ? 'none' : 'left 0.1s ease',
                opacity: isDragging ? 1 : undefined
              }}
            />
          </div>
        </div>

        {/* Time Display */}
        <div className="VideoControls-time-display">
          <span className="VideoControls-current-time">{formatTime(displayTime)}</span>
          <span className="VideoControls-time-separator">/</span>
          <span className="VideoControls-total-time">{formatTime(duration)}</span>
        </div>
      </div>
    </>
  );
};

export default VideoControls;