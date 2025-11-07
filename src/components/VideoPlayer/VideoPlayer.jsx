// src/components/VideoPlayer/VideoPlayer.jsx
import React from "react";
import { FaHeart, FaPlay } from "react-icons/fa";
import VideoVolumeControl from "./VideoVolumeControl";

export default function VideoPlayer({
  videoUrl,
  playerRef,
  bgPlayerRef,
  audioRef,
  isPlaying,
  isMuted,
  volume,
  showHeartEffect,
  setIsPlaying,
  toggleMute,
  handleVolumeChange,
}) {
  if (!videoUrl) {
    return <p style={{ color: "#fff" }}>Không tìm thấy video</p>;
  }

  return (
    <>
      {/* Video nền blur */}
      <video
        ref={bgPlayerRef}
        className="lvv-bg-blur"
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Nút âm lượng */}
      <VideoVolumeControl
        volume={volume}
        toggleMute={toggleMute}
        handleVolumeChange={handleVolumeChange}
      />

      {/* Video chính */}
      <div className="lvv-video-wrapper" style={{ position: "relative" }}>
        <video
          ref={playerRef}
          src={videoUrl}
          autoPlay
          loop
          playsInline
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{ width: "100%", height: "100%" }}
        />

        {showHeartEffect && <FaHeart className="lvv-heart-effect" />}

        {!isPlaying && (
          <div className="lvv-play-icon">
            <FaPlay size={48} color="#fff" />
          </div>
        )}

        <audio
          ref={audioRef}
          src="/audio/background-music.mp3"
          autoPlay
          loop
          muted={isMuted}
          style={{ display: "none" }}
        />
      </div>
    </>
  );
}