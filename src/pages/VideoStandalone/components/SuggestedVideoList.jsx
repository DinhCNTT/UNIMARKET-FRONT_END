import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SuggestedVideoList.module.css';

// Component này nhận danh sách video từ cha (VideoStandalonePage -> SidebarInfo -> SuggestedVideoList)
// Không tự fetch API để tránh mất đồng bộ dữ liệu.
const SuggestedVideoList = ({ videos, currentVideoId, onLoadMore, hasMore = true }) => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);
  const bottomRef = useRef(null);
  const displayVideos = videos || [];

  // --- 1. LOGIC INFINITE SCROLL (Tự động tải thêm khi cuộn đáy) ---
  useEffect(() => {
    // Nếu hết dữ liệu (hasMore = false) thì không tạo observer làm gì cả
    if (!hasMore) return; 

    const observer = new IntersectionObserver((entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
            if (onLoadMore) {
                // Chỉ log khi thực sự gọi hàm
                onLoadMore();
            }
        }
    }, {
        root: null,
        rootMargin: '10px', // Giảm margin xuống để chính xác hơn
        threshold: 0.1
    });

    if (bottomRef.current) {
        observer.observe(bottomRef.current);
    }

    return () => {
        if (bottomRef.current) observer.unobserve(bottomRef.current);
    };
  }, [onLoadMore, displayVideos.length, hasMore]);


  // --- 2. HÀM FORMAT SỐ (View, Tim) ---
  const formatNumber = (num) => {
    if (!num) return 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  // --- 3. RENDER GIAO DIỆN ---
  return (
  <div className={styles.gridContainer}>
    {/* Map danh sách video */}
    {displayVideos.map(vid => {
      const isActive = vid.maTinDang === currentVideoId;

      return (
        <div
          key={vid.maTinDang}
          className={`${styles.card} ${isActive ? styles.activeCard : ''}`}
          onMouseEnter={() => setHoveredId(vid.maTinDang)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => {
            if (isActive) return;

            navigate(`/video-standalone/${vid.maTinDang}`);

            const sidebar = document.querySelector('.sidebar-content-scroll');
            if (sidebar) sidebar.scrollTop = 0;
          }}
        >
          {/* A. Thumbnail & Preview */}
          <div className={styles.imageWrapper}>
            <img
              src={vid.hinhAnh || "/assets/images/placeholder.png"}
              alt={vid.tieuDe}
              className={styles.image}
              onError={(e) => {
                e.target.src = "https://placehold.co/150x266?text=No+Image";
              }}
            />

            {/* Video preview khi hover */}
            {hoveredId === vid.maTinDang && vid.videoUrl && (
              <video
                src={vid.videoUrl}
                className={styles.previewVideo}
                autoPlay
                muted
                loop
                playsInline
              />
            )}

            {/* Overlay Đang phát */}
            {isActive && (
              <div className={styles.playingOverlay}>
                <span>Đang phát</span>
                <div className={styles.equalizerIcon}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          {/* B. Thông tin */}
          <div className={styles.info}>
            <h3 className={`${styles.title} ${isActive ? styles.activeTitle : ''}`}>
              {vid.tieuDe}
            </h3>

            <div className={styles.authorRow}>
              <img
                src={vid.nguoiDang?.avatarUrl || "/assets/images/default-avatar.png"}
                className={styles.smallAvatar}
                alt=""
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/20";
                }}
              />
              <span className={styles.authorName}>
                {vid.nguoiDang?.fullName || "User"}
              </span>
            </div>

            <div className={styles.statsRow}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 8C8.92487 8 4 12.9249 4 19C4 30 17 40 24 42.3262C31 40 44 30 44 19C44 12.9249 39.0751 8 33 8C29.2797 8 25.9907 9.8469 24 12.6738C22.0093 9.8469 18.7203 8 15 8Z"
                  stroke="#888"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className={styles.statsText}>
                {formatNumber(vid.soTym)}
              </span>

              <span className={styles.dot}>·</span>

              <span className={styles.statsText}>
                {vid.timeAgo || "Vừa xong"}
              </span>
            </div>
          </div>
        </div>
      );
    })}

    {/* --- LOAD MORE / END MESSAGE --- */}
    {hasMore ? (
      <div
        ref={bottomRef}
        style={{
          height: '40px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          clear: 'both'
        }}
      >
        <span style={{ color: '#888', fontSize: '12px' }}>
          Đang tải thêm đề xuất...
        </span>
      </div>
    ) : (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: '#999',
          fontSize: '13px',
          clear: 'both'
        }}
      >
        Bạn đã xem hết video đề xuất.
      </div>
    )}
  </div>
);

};

export default SuggestedVideoList;