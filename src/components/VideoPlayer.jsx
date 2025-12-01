// src/components/VideoPlayer.jsx
import React from 'react';
import VideoControls from "./VideoControls";
import VideoVolumeControl from "./VideoPlayer/VideoVolumeControl";
import "./VideoPlayer.css";
const VideoPlayer = ({
  video,
  index,
  currentIndex,
  videoElsRef,
  videoRef,
  setAspectRatios, // Sửa: Chỉ cần setAspectRatios
  handleVideoClick,
  showControls,
  handleDragStateChange
  ,
  volume = 0.5,
  toggleMute = () => {},
  handleVolumeChange = () => {}
}) => {
  
  // Toàn bộ logic `ratioClass` và các thẻ div layout
  // sẽ được chuyển về component cha (VideoDetailViewer.jsx)
  
  return (
    // Sử dụng React.Fragment (hoặc <></>) vì component này không cần thẻ div bọc
    <>
      <video
        ref={(el) => {
          videoElsRef.current[index] = el;
          if (el) {
            // Ensure default volume and unmute when element is available
            try {
              el.volume = 0.5;
              el.muted = false;
            } catch (e) {}
          }
          if (index === currentIndex) videoRef.current = el;
        }}
        src={video.videoUrl}
        className="vdv-player"
        controls={false}
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        autoPlay={index === currentIndex}
        loop
        onClick={(e) => handleVideoClick(e, index)}
        onDoubleClick={(e) => e.preventDefault()}
        onLoadedMetadata={(e) => {
          const ratio = e.target.videoWidth / e.target.videoHeight;
          // Set volume to 50% and unmute on metadata load
          try {
            e.target.volume = 0.5;
            e.target.muted = false;
          } catch (e) {}
          setAspectRatios((prev) => ({
            ...prev,
            [index]: ratio,
          }));
        }}
      />

      {index === currentIndex && (
        <>
          <VideoVolumeControl
            volume={volume}
            toggleMute={toggleMute}
            handleVolumeChange={handleVolumeChange}
          />
          <VideoControls
            videoRef={videoRef}
            isVisible={showControls}
            onDragStateChange={handleDragStateChange}
          />
        </>
      )}
    </>
  );
};

export default VideoPlayer;