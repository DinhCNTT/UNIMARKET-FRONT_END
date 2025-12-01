import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaVideo, FaRegImage } from "react-icons/fa"; // Import icon
import styles from "./SimilarPostsSection.module.css";
import { formatPrice, getMediaUrl } from "../utils/formatters";
import { formatRelativeTime } from "../utils/dateUtils"; 

/**
 * @param {string} mode - "grid" (Lưới) hoặc "carousel" (Trượt ngang)
 * @param {function} onViewShop - Hàm xử lý khi bấm nút "Xem trang cá nhân"
 */
const SimilarPostsSection = ({ title, posts, mode = "carousel", onViewShop }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // --- LOGIC CHO GRID MODE (Tin tương tự) ---
  const [visibleCount, setVisibleCount] = useState(10); 

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 10); 
  };

  const handleCollapse = () => {
    setVisibleCount(10); 
    const element = document.getElementById("grid-header");
    if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // --- LOGIC CHO CAROUSEL MODE (Tin người bán) ---
  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleSimilarPostClick = (postId) => {
    navigate(`/tin-dang/${postId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!posts || posts.length === 0) return null;

  // 👇 Lọc danh sách hiển thị
  const displayPosts = mode === "carousel" ? posts.slice(0, 8) : posts.slice(0, visibleCount);

  // --- RENDER ---
  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader} id={mode === "grid" ? "grid-header" : ""}>
        <h2 className={styles.title}>{title}</h2>
      </div>

      {/* ================= CASE 1: GRID MODE (Tin tương tự) ================= */}
      {mode === "grid" ? (
        <>
          <div className={styles.gridContainer}>
            {displayPosts.map((post) => (
              <PostCard 
                key={post.maTinDang} 
                post={post} 
                onClick={handleSimilarPostClick} 
                isGrid={true}
              />
            ))}
          </div>

          {/* Nút Action cho Grid */}
          <div className={styles.actionButtonsContainer}>
            {visibleCount < posts.length && (
              <button className={styles.actionBtn} onClick={handleShowMore}>
                Xem thêm
              </button>
            )}
              
            {visibleCount > 10 && (
              <button className={`${styles.actionBtn} ${styles.collapseBtn}`} onClick={handleCollapse}>
                Thu gọn
              </button>
            )}
          </div>
        </>
      ) : (
        /* ================= CASE 2: CAROUSEL MODE (Tin người bán) ================= */
        <div className={styles.carouselContainer}>
            <div className={styles.carouselWrapper}>
            <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={() => handleScroll("left")}>
                &#8249;
            </button>

            <div className={styles.postsTrack} ref={scrollRef}>
                {displayPosts.map((post) => (
                <PostCard 
                    key={post.maTinDang} 
                    post={post} 
                    onClick={handleSimilarPostClick} 
                    isGrid={false}
                />
                ))}
            </div>

            <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={() => handleScroll("right")}>
                &#8250;
            </button>
            </div>

            {/* 👇 Nút Xem thêm trang cá nhân (Chỉ hiện ở Carousel mode) */}
            <div className={styles.viewShopBtnContainer}>
                <button className={styles.viewShopBtn} onClick={onViewShop}>
                    Xem thêm
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

// ==========================================================
// COMPONENT CARD ĐÃ FIX ĐẦY ĐỦ (VIDEO PREVIEW & BADGE)
// ==========================================================
const PostCard = ({ post, onClick, isGrid }) => {
  // State quản lý việc hover chuột
  const [isHovering, setIsHovering] = useState(false);

  // 1. Logic đếm ảnh
  const imageCount = post.images ? post.images.length : 0;
  
  // 2. Logic kiểm tra video
  const hasVideo = !!post.videoUrl;

  return (
    <div
      className={`${styles.postCard} ${isGrid ? styles.cardGridItem : styles.cardCarouselItem}`}
      onClick={() => onClick(post.maTinDang)}
      // 👇 Bắt sự kiện chuột để chạy video preview
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={styles.cardImageWrapper}>
        
        {/* ⭐ LOGIC VIDEO PREVIEW: 
            Nếu có video VÀ đang di chuột -> hiện Video, ngược lại hiện Ảnh 
        */}
        {hasVideo && isHovering ? (
            <video
                src={post.videoUrl}
                className={styles.previewVideo} // Cần thêm class này trong CSS (xem bên dưới)
                autoPlay
                muted
                loop
                playsInline
            />
        ) : (
            <img src={getMediaUrl(post.images?.[0])} alt={post.tieuDe} loading="lazy" />
        )}
        
        {/* --- LOGIC HIỂN THỊ THỜI GIAN TRÊN ẢNH --- */}
        {formatRelativeTime(post.ngayDang) ? (
            <span className={styles.timeOverlay}>
                {formatRelativeTime(post.ngayDang)}
            </span>
        ) : null}

        {/* --- LOGIC HIỂN THỊ ICON VIDEO & SỐ ẢNH (ĐÃ CẬP NHẬT) --- */}
        <div className={styles.mediaBadgesContainer}>
            {/* 1. Nếu có video -> Hiện icon máy quay riêng */}
            {hasVideo && (
              <div className={`${styles.badgeItem} ${styles.videoBadge}`}>
                <FaVideo size={10} />
              </div>
            )}

            {/* 2. Nếu có ảnh -> Hiện icon ảnh + số lượng */}
            {imageCount > 0 && (
              <div className={styles.badgeItem}>
                <FaRegImage size={10} style={{ marginRight: 4 }} />
                <span>{imageCount}</span>
              </div>
            )}
        </div>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.postTitle} title={post.tieuDe}>{post.tieuDe}</h3>
        <div className={styles.postPrice}>{formatPrice(post.gia)}</div>
        <div className={styles.postMeta}>
          <div className={styles.metaLocation}><span>{post.diaChi}</span></div>
        </div>
      </div>
    </div>
  );
};

export default SimilarPostsSection;