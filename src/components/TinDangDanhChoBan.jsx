import React, { useState, useEffect } from "react"; 
import axios from "axios";
import "./TinDangDanhChoBan.css";
import { Link } from "react-router-dom";

const TinDangDanhChoBan = () => {
  const [posts, setPosts] = useState([]); 
  const [visiblePosts, setVisiblePosts] = useState(25); 

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/tindang/get-posts");
        setPosts(response.data); 
        console.log("Fetched posts:", response.data); 
      } catch (error) {
        console.error("Error fetching posts:", error); 
      }
    };

    fetchPosts(); 
  }, []); 

  const handleShowMore = () => {
    setVisiblePosts((prev) => prev + 25); 
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return "Vừa đăng";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
    return `${Math.floor(diff / 31536000)} năm trước`;
  };

  const renderNoPostsMessage = () => {
    if (posts.length === 0) {
      return "Không có tin đăng";
    }
    return null; 
  };

  return (
    <div className="tin-dang-danh-cho-ban">
      <h2 className="tieu-de">Tin Đăng Dành Cho Bạn</h2>
      <div className="post-list">
        {renderNoPostsMessage() ? (
          <p>{renderNoPostsMessage()}</p> 
        ) : (
          posts.slice(0, visiblePosts).map((post) => (
            <div key={post.maTinDang} className="post-item">
              <Link to={`/tin-dang/${post.maTinDang}`} className="post-link">
                <div className="post-images-tin-dang-danh-cho-ban">
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0].startsWith("http") ? post.images[0] : `http://localhost:5133${post.images[0]}`}
                      alt="Ảnh đại diện"
                      className="post-image"
                    />
                  ) : (
                    <p>Không có ảnh.</p> 
                  )}
                </div>
                  <div className="post-info">
                    <h3>{post.tieuDe}</h3> 
                    <p className="price">{formatCurrency(post.gia)}</p> 
                    <p className="post-description">
                      {post.tinhThanh} - {post.quanHuyen} 
                    </p>
                    <p className="post-time">{formatRelativeTime(post.ngayDang)}</p>
                  </div>      
              </Link>
            </div>
          ))
        )}
      </div>

      {visiblePosts < posts.length && (
        <button className="xem-them-btn" onClick={handleShowMore}>
          Xem thêm
        </button>
      )}
    </div>
  );
};

export default TinDangDanhChoBan;
