import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// Import nhiều icon đẹp hơn
import { 
  FaHeart, FaTrashAlt, FaFire, FaMapMarkerAlt, 
  FaChevronDown, FaChevronUp, FaFolderOpen, 
  FaArrowRight, FaLayerGroup, FaCheckCircle
} from "react-icons/fa";

import TopNavbar from "./TopNavbar/TopNavbar";
import Footer from "./Footer";
import { AuthContext } from "../context/AuthContext";

// Import CSS Module
import styles from "./TinDangDaLuu.module.css";

const TinDangDaLuu = () => {
  const [posts, setPosts] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showScrollable, setShowScrollable] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState(8); 
  const gridRef = useRef(null);

  // --- Fetch Data ---
  const fetchSavedPosts = async (token) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.token) {
      fetchSavedPosts(user.token);
    } else {
      setLoading(false);
    }
  }, [user]);

  // --- Xử lý Xóa ---
  const handleRemove = async (id) => {
    if (!user || !user.token) {
      alert("Bạn cần đăng nhập để sử dụng chức năng này.");
      return;
    }
    try {
      await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${id}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setPosts(prev => prev.filter(post => post.maTinDang !== id));
      showNotification("Đã xóa khỏi danh sách yêu thích!", "success");
    } catch (err) {
      let msg = "Có lỗi xảy ra.";
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      showNotification(msg, "error");
    }
  };

  // --- Custom Notification ---
  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    // Kết hợp class module
    notification.className = `${styles.notification} ${styles[type]}`;
    // Thêm icon vào nội dung text (đơn giản hóa bằng string template)
    notification.innerHTML = type === 'success' 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> ${message}`
      : message;
      
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const handleImageClick = (maTinDang) => {
    navigate(`/tin-dang/${maTinDang}`);
  };

  // --- Format Giá (Chuẩn Chợ Tốt) ---
  const formatPrice = (price) => {
    if (price === 0 || !price) return "Thỏa thuận";
    if (price >= 1000000000) return `${(price / 1000000000).toFixed(2)} tỷ`.replace('.00', '');
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)} triệu`.replace('.0', '');
    return `${price.toLocaleString('vi-VN')} đ`;
  };

  // --- Xử lý Xem thêm / Thu gọn ---
  const handleShowMore = () => {
    const newExpandedCount = Math.min(expandedPosts + 8, posts.length);
    setExpandedPosts(newExpandedCount);
    
    if (!showScrollable) setShowScrollable(true);

    setTimeout(() => {
      if (gridRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = gridRef.current;
        const newScroll = Math.min(scrollTop + clientHeight * 0.7, scrollHeight - clientHeight);
        gridRef.current.scrollTo({ top: newScroll, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleCollapse = () => {
    if (expandedPosts > 8) {
      setExpandedPosts(8);
      setShowScrollable(false);
      if (gridRef.current) gridRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const displayedPosts = posts.slice(0, expandedPosts);

  // --- Render Loading ---
  if (loading) {
    return (
      <>
        <TopNavbar />
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Đang tải danh sách quan tâm...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // --- Main Render ---
  return (
    <>
      <TopNavbar />
      <div className={styles.container}>
        <div className={styles.wrapper}>
          
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.iconBox}>
                <FaHeart />
              </div>
              <div className={styles.title}>
                <h1>Tin Đăng Đã Lưu</h1>
                <div className={styles.subtitle}>
                  <FaCheckCircle size={12} color="#28a745" />
                  Danh sách những tin bạn đang quan tâm
                </div>
              </div>
            </div>
            
            <div className={styles.badgeCount}>
              {posts.length} tin lưu
            </div>
          </div>

          {/* Content */}
          {posts.length === 0 ? (
            <div className={styles.empty}>
              <FaFolderOpen className={styles.emptyIcon} />
              <h3>Bạn chưa lưu tin đăng nào</h3>
              <p>Hãy dạo một vòng và thả tim cho những món đồ bạn thích nhé!</p>
              <button 
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => navigate('/')}
              >
                Khám phá ngay <FaArrowRight />
              </button>
            </div>
          ) : (
            <div className={styles.gridContainer}>
              <div 
                ref={gridRef}
                className={`${styles.grid} ${showScrollable ? styles.scrollable : ''}`}
              >
                {displayedPosts.map((post, index) => (
                  <div 
                    key={post.maTinDang} 
                    className={styles.card}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Image Area */}
                    <div 
                      className={styles.imageWrapper} 
                      onClick={() => handleImageClick(post.maTinDang)}
                    >
                      {post.savedCount >= 2 && (
                        <div className={styles.hotBadge}>
                          <FaFire /> HOT
                        </div>
                      )}

                      {/* Nút Xóa (Thùng rác) */}
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          handleRemove(post.maTinDang);
                        }}
                        title="Bỏ lưu tin này"
                      >
                        <FaTrashAlt size={14} />
                      </button>

                      {post.images && post.images.length > 0 ? (
                        <img
                          src={post.images[0].startsWith("http") ? post.images[0] : `http://localhost:5133${post.images[0]}`}
                          alt={post.tieuDe}
                          className={styles.image}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.image} style={{background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          Không có ảnh
                        </div>
                      )}
                      <div className={styles.overlay}></div>
                    </div>

                    {/* Info Area */}
                    <div 
                      className={styles.info}
                      onClick={() => handleImageClick(post.maTinDang)}
                    >
                      <div>
                        <h3 className={styles.postTitle}>{post.tieuDe}</h3>
                        <div className={styles.priceRow}>
                          <span className={styles.price}>{formatPrice(post.gia)}</span>
                        </div>
                      </div>
                      
                      <div className={styles.metaRow}>
                        <div className={styles.location}>
                          <FaMapMarkerAlt color="#999" size={12} />
                          {post.quanHuyen}, {post.tinhThanh}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls */}
              {posts.length > 8 && (
                <div className={styles.controls}>
                  {expandedPosts < posts.length && (
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleShowMore}>
                      <FaLayerGroup /> Xem thêm ({Math.min(8, posts.length - expandedPosts)})
                    </button>
                  )}
                  
                  {showScrollable && expandedPosts > 8 && (
                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleCollapse}>
                      <FaChevronUp /> Thu gọn
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TinDangDaLuu;