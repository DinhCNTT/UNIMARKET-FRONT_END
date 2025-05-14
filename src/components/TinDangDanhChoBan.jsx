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

  // Xử lý thông báo khi không có tin đăng
  const renderNoPostsMessage = () => {
    if (posts.length === 0) {
      return "Không có tin đăng";
    }
    return null; // Nếu có tin đăng, không cần hiển thị thông báo
  };

  return (
    <div className="tin-dang-danh-cho-ban">
      <h2 className="tieu-de">Tin Đăng Dành Cho Bạn</h2>
      <div className="post-list">
        {renderNoPostsMessage() ? (
          <p>{renderNoPostsMessage()}</p> // Hiển thị thông báo nếu không có tin đăng
        ) : (
          posts.slice(0, visiblePosts).map((post) => (
            <div key={post.maTinDang} className="post-item">
              <Link to={`/tin-dang/${post.maTinDang}`} className="post-link">
                {/* Hiển thị ảnh của tin đăng */}
                <div className="post-images-tin-dang-danh-cho-ban">
                  {post.images && post.images.length > 0 ? (
                    post.images.map((image, index) => (
                      <img
                        key={index}
                        src={`http://localhost:5133${image}`}
                        alt={`Image ${index + 1}`}
                        className="post-image"
                      />
                    ))
                  ) : (
                    <p>Không có ảnh.</p> // Nếu không có ảnh, hiển thị thông báo
                  )}
                </div>

                {/* Hiển thị thông tin tin đăng (tiêu đề, giá, địa chỉ) */}
                <div className="post-info">
                  <h3>{post.tieuDe}</h3> {/* Tiêu đề */}
                  <p className="price">{formatCurrency(post.gia)}</p> {/* Giá */}
                  <p className="post-description">
                    {post.tinhThanh} - {post.quanHuyen} {/* Địa chỉ (tỉnh/thành, quận/huyện) */}
                  </p>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {visiblePosts < posts.length && (
        <button className="xem-them-btn" onClick={handleShowMore}>
          Xem thêm
        </button> // Hiển thị nút "Xem thêm" nếu còn tin đăng để hiển thị
      )}
    </div>
  );
};

export default TinDangDanhChoBan;
