import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ProductItem.module.css';
import defaultAvatar from '../../assets/default-avatar.png'; 

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14px" height="14px" className={styles.locationIcon}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const ProductItem = ({ post, viewMode }) => {
  const formatCurrency = (amount) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    const intervals = [
      { label: "năm", seconds: 31536000 },
      { label: "tháng", seconds: 2592000 },
      { label: "ngày", seconds: 86400 },
      { label: "giờ", seconds: 3600 },
      { label: "phút", seconds: 60 },
      { label: "giây", seconds: 1 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count > 0) return `${count} ${interval.label} trước`;
    }
    return "Vừa xong";
  };

  const getImageUrl = (img) => img?.startsWith("http") ? img : `http://localhost:5133${img}`;

  return (
    // QUAN TRỌNG: Thêm class styles.listMode hoặc styles.gridMode vào wrapper
    <div className={`${styles.item} ${viewMode === 'list' ? styles.listMode : styles.gridMode}`}>
      <Link to={`/tin-dang/${post.maTinDang}`} className={styles.link}>
        <div className={styles.content}>
          <div className={styles.imageContainer}>
            {post.images && post.images.length > 0 ? (
              <img
                src={getImageUrl(post.images[0])}
                alt={post.tieuDe}
                className={styles.image}
                loading="lazy"
                onError={(e) => e.target.src = defaultAvatar}
              />
            ) : (
              <div className={styles.noImage}>Không có ảnh</div>
            )}
            {post.ngayDang && <span className={styles.time}>{timeAgo(post.ngayDang)}</span>}
          </div>

          <div className={styles.info}>
            <div>
              <h3 className={styles.itemTitle}>{post.tieuDe}</h3>
              <p className={styles.price}>{formatCurrency(post.gia)}</p>
            </div>
            
            <div className={styles.bottomFooter}>
              <div className={styles.locationRow}>
                <LocationIcon />
                <span className={styles.locationText}>{post.tinhThanh} - {post.quanHuyen}</span>
              </div>
              
              <div className={styles.userRow}>
                <img
                  src={getImageUrl(post.avatar) || defaultAvatar}
                  alt="Seller"
                  className={styles.userAvatar}
                  loading="lazy"
                  onError={(e) => e.target.src = defaultAvatar}
                />
                <span className={styles.userName}>{post.nguoiBan}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductItem;