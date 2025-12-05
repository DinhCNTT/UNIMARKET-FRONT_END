import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import defaultAvatar from "../../assets/default-avatar.png";
import styles from "./VideoCard.module.css"; // Import CSS Module

const VideoCard = ({ video, allVideos, keyword, activeTab }) => {
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      // Tự động pause sau 3s nếu vẫn đang hover (giống logic cũ của bạn)
      timeoutRef.current = setTimeout(() => {
        if (videoRef.current) videoRef.current.pause();
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) videoRef.current.pause();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleCardClick = () => {
    navigate(`/video-viewer/${video.maTinDang}`, {
      state: {
        videos: allVideos,
        initialIndex: allVideos.findIndex((v) => v.maTinDang === video.maTinDang),
        returnPath: `/search/${encodeURIComponent(keyword)}?tab=${activeTab}`,
      },
    });
  };

  const handleUserClick = (e) => {
    e.stopPropagation();
    navigate(`/nguoi-dung/${video.nguoiDang?.id}`);
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div
        className={styles.thumbnail}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          muted
          preload="metadata"
          controls={false}
          playsInline
        />
        <FaHeart className={styles.heartIcon} />
        <div className={styles.likes}>{video.soTym || 0}</div>
      </div>

      <div className={styles.info}>
        <img
          src={video.nguoiDang?.avatarUrl?.trim() ? video.nguoiDang.avatarUrl : defaultAvatar}
          alt={video.nguoiDang?.fullName || "Người dùng"}
          className={styles.avatar}
          onClick={handleUserClick}
        />
        <div className={styles.texts}>
          <h4 className={styles.title} title={video.tieuDe}>
            {video.tieuDe}
          </h4>
          <p className={styles.userName} title={video.nguoiDang?.fullName}>
            {video.nguoiDang?.fullName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;