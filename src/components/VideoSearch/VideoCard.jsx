import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegHeart } from "react-icons/fa"; 
import defaultAvatar from "../../assets/default-avatar.png";
import styles from "./VideoCard.module.css";

const VideoCard = ({ video, allVideos, keyword, activeTab }) => {
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  // Xử lý tự động phát video khi rê chuột vào
  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      // Dừng sau 3 giây để tránh load quá nhiều
      timeoutRef.current = setTimeout(() => {
        if (videoRef.current) videoRef.current.pause();
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) videoRef.current.pause();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // Click vào card để xem chi tiết
  const handleCardClick = () => {
    navigate(`/video-viewer/${video.maTinDang}`, {
      state: {
        videos: allVideos,
        initialIndex: allVideos.findIndex((v) => v.maTinDang === video.maTinDang),
        returnPath: `/search/${encodeURIComponent(keyword)}?tab=${activeTab}`,
      },
    });
  };

  // Click vào avatar/tên để xem trang cá nhân
  const handleUserClick = (e) => {
    e.stopPropagation();
    navigate(`/nguoi-dung/${video.nguoiDang?.id}`);
  };

  // Format số like (VD: 1200 -> 1.2k)
  const formatLikes = (count) => {
    if (!count) return "0";
    if (count >= 1000) return (count / 1000).toFixed(1) + "k";
    return count;
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      {/* --- Phần Video Thumbnail --- */}
      <div
        className={styles.thumbnailWrapper}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            src={video.videoUrl}
            muted
            preload="metadata"
            playsInline
            loop
          />
        </div>
        
        {/* Overlay Tim ở góc trái dưới */}
        <div className={styles.overlayBottomLeft}>
          <FaRegHeart className={styles.heartIcon} />
          <span className={styles.likeCount}>{formatLikes(video.soTym)}</span>
        </div>
      </div>

      {/* --- Phần Thông tin bên dưới --- */}
      <div className={styles.metaData}>
        {/* Hàng 1: Tiêu đề video */}
        <div className={styles.titleRow}>
          <p className={styles.videoTitle} title={video.tieuDe}>
            {video.tieuDe || "Không có tiêu đề"}
          </p>
        </div>

        {/* Hàng 2: Avatar + Tên + Thời gian */}
        <div className={styles.userRow}>
          {/* Bên trái: Avatar và Tên người đăng */}
          <div className={styles.userInfoLeft} onClick={handleUserClick}>
            <img
              src={video.nguoiDang?.avatarUrl?.trim() ? video.nguoiDang.avatarUrl : defaultAvatar}
              alt="avatar"
              className={styles.userAvatar}
            />
            <span className={styles.userName} title={video.nguoiDang?.fullName}>
              {video.nguoiDang?.fullName || "Người dùng"}
            </span>
          </div>
          
          {/* Bên phải: Thời gian đăng (Lấy từ API Backend) */}
          <span className={styles.postDate}>
            {video.thoiGianHienThi || "Mới đăng"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;