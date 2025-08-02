import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaBookmark, FaChevronDown, FaChevronUp } from "react-icons/fa";
import TopNavbar from "./TopNavbar";
import Footer from "./Footer";
import { AuthContext } from "../context/AuthContext";
import "./TinDangDaLuu.css";

const TinDangDaLuu = () => {
  const [posts, setPosts] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showScrollable, setShowScrollable] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState(8); // Hiển thị 8 tin đầu tiên
  const [expandedPosts, setExpandedPosts] = useState(8); // Theo dõi số tin đã mở rộng

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
      // Hiển thị thông báo thành công với animation
      showNotification("Đã gỡ lưu tin đăng khỏi danh sách yêu thích.", "success");
    } catch (err) {
      let msg = "Có lỗi xảy ra, vui lòng thử lại.";
      if (err.response && err.response.data && err.response.data.message) {
        const backendMsg = err.response.data.message;
        if (backendMsg.includes("chưa xác minh") || backendMsg.toLowerCase().includes("gmail")) {
          msg = "Bạn chưa xác minh gmail. Vui lòng kiểm tra email để xác minh tài khoản.";
        } else if (backendMsg.includes("chưa nhập") || backendMsg.toLowerCase().includes("số điện thoại")) {
          msg = "Bạn chưa nhập đầy đủ thông tin (ví dụ: Số điện thoại). Vui lòng cập nhật hồ sơ cá nhân.";
        } else {
          msg = backendMsg;
        }
      }
      showNotification(msg, "error");
    }
  };

  const showNotification = (message, type) => {
    // Tạo notification element
    const notification = document.createElement('div');
    notification.className = `Tin-dang-da-luu-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const handleImageClick = (maTinDang) => {
    navigate(`/tin-dang/${maTinDang}`);
  };

  const formatPrice = (price) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} tỷ`;
    } else if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} triệu`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}k`;
    }
    return price?.toLocaleString();
  };

  const handleShowMore = () => {
    const newExpandedCount = Math.min(expandedPosts + 8, posts.length);
    setExpandedPosts(newExpandedCount);
    setShowScrollable(true);
  };

  const handleCollapse = () => {
    if (expandedPosts > 8) {
      const newExpandedCount = Math.max(expandedPosts - 8, 8);
      setExpandedPosts(newExpandedCount);
      if (newExpandedCount === 8) {
        setShowScrollable(false);
      }
    }
  };

  const displayedPosts = showScrollable ? posts.slice(0, expandedPosts) : posts.slice(0, visiblePosts);

  if (loading) {
    return (
      <>
        <TopNavbar />
        <div className="Tin-dang-da-luu-container">
          <div className="Tin-dang-da-luu-loading">
            <div className="Tin-dang-da-luu-spinner"></div>
            <p>Đang tải tin đăng đã lưu...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopNavbar />
      <div className="Tin-dang-da-luu-container">
        <div className="Tin-dang-da-luu-wrapper">
          {/* Header với trái tim đập */}
          <div className="Tin-dang-da-luu-header">
            <div className="Tin-dang-da-luu-main-title">
              <FaHeart className="Tin-dang-da-luu-heart-icon" />
              <h1>Danh sách các tin đăng đã lưu</h1>
            </div>
            
            <div className="Tin-dang-da-luu-title">
              <FaBookmark className="Tin-dang-da-luu-icon" />
              <h2>Tin đăng đã lưu</h2>
              <span className="Tin-dang-da-luu-count">({posts.length})</span>
            </div>
          </div>

          {/* Content */}
          <div className="Tin-dang-da-luu-content">
            {posts.length === 0 ? (
              <div className="Tin-dang-da-luu-empty">
                <div className="Tin-dang-da-luu-empty-icon">
                  <FaBookmark />
                </div>
                <h3>Chưa có tin đăng nào được lưu</h3>
                <p>Hãy lưu những tin đăng yêu thích để xem lại sau nhé!</p>
                <button 
                  className="Tin-dang-da-luu-browse-btn"
                  onClick={() => navigate('/')}
                >
                  Khám phá tin đăng
                </button>
              </div>
            ) : (
              <div className="Tin-dang-da-luu-grid-container">
                <div className={`Tin-dang-da-luu-grid ${showScrollable ? 'scrollable' : ''}`}>
                  {displayedPosts.map((post, index) => (
                    <div
                      key={post.maTinDang}
                      className="Tin-dang-da-luu-card"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* HOT Badge */}
                      {post.savedCount >= 2 && (
                        <div className="Tin-dang-da-luu-hot-badge">
                          <span className="Tin-dang-da-luu-fire-icon">🔥</span>
                          HOT
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        className="Tin-dang-da-luu-remove-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemove(post.maTinDang);
                        }}
                        title="Bỏ lưu tin này"
                      >
                        <FaHeart />
                      </button>

                      {/* Card Content */}
                      <div
                        className="Tin-dang-da-luu-card-content"
                        onClick={() => handleImageClick(post.maTinDang)}
                      >
                        {/* Image */}
                        <div className="Tin-dang-da-luu-image-container">
                          {post.images && post.images.length > 0 ? (
                            <img
                              src={post.images[0].startsWith("http") 
                                ? post.images[0] 
                                : `http://localhost:5133${post.images[0]}`}
                              alt="Ảnh đại diện"
                              className="Tin-dang-da-luu-image"
                              loading="lazy"
                            />
                          ) : (
                            <div className="Tin-dang-da-luu-no-image">
                              <span>Không có ảnh</span>
                            </div>
                          )}
                          <div className="Tin-dang-da-luu-image-overlay"></div>
                        </div>

                        {/* Info */}
                        <div className="Tin-dang-da-luu-info">
                          <h3 className="Tin-dang-da-luu-post-title">{post.tieuDe}</h3>
                          <div className="Tin-dang-da-luu-price">
                            {formatPrice(post.gia)} VND
                          </div>
                          <div className="Tin-dang-da-luu-location">
                            📍 {post.quanHuyen} - {post.tinhThanh}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Nút "Xem thêm" / "Thu gọn" */}
                {posts.length > 8 && (
                  <div className="Tin-dang-da-luu-toggle-container">
                    {!showScrollable || expandedPosts < posts.length ? (
                      <button 
                        className="Tin-dang-da-luu-toggle-btn"
                        onClick={handleShowMore}
                      >
                        <FaChevronDown />
                        Xem thêm
                      </button>
                    ) : null}
                    
                    {showScrollable && expandedPosts > 8 && (
                      <button 
                        className="Tin-dang-da-luu-toggle-btn collapse"
                        onClick={handleCollapse}
                      >
                        <FaChevronUp />
                        Thu gọn
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
    </>
  );
};

export default TinDangDaLuu;