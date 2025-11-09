import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SimilarPostsSection.module.css"; // Tạo file CSS riêng
import { formatDate, formatPrice, getMediaUrl } from "../utils/formatters";

const SimilarPostsSection = ({ title, posts }) => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  if (!posts || posts.length === 0) {
    return null; // Không render gì nếu không có tin
  }

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  const handleSimilarPostClick = (postId) => {
    navigate(`/tin-dang/${postId}`);
    window.scrollTo(0, 0); // Vẫn giữ logic scroll to top
  };

  return (
    <div className={styles.tinDangTuongTu}>
      <h2>{title}</h2>
      <div className={styles.similarPostsWrapper}>
        <button className={`${styles.scrollBtn} ${styles.left}`} onClick={() => handleScroll("left")}>&lt;</button>
        <div className={styles.similarPostsContainer} ref={scrollRef}>
          {posts.map((post) => (
            <div
              key={post.maTinDang}
              className={styles.similarPostCard}
              onClick={() => handleSimilarPostClick(post.maTinDang)}
            >
              <div className={styles.imageWrapper}>
                <img src={getMediaUrl(post.images?.[0])} alt={post.tieuDe} />
              </div>
              <h3>{post.tieuDe}</h3>
              <p className={styles.gia}>{formatPrice(post.gia)}</p>
              <p>{post.diaChi}</p>
              <p className={styles.nho}>{formatDate(post.ngayDang)}</p>
            </div>
          ))}
        </div>
        <button className={`${styles.scrollBtn} ${styles.right}`} onClick={() => handleScroll("right")}>&gt;</button>
      </div>
    </div>
  );
};

export default SimilarPostsSection;