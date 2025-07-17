import React, { useState, useEffect, useContext } from "react"; 
import axios from "axios";
import "./TinDangDanhChoBan.css";
import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

const TinDangDanhChoBan = () => {
  const [posts, setPosts] = useState([]); 
  const [visiblePosts, setVisiblePosts] = useState(25);
  const [savedIds, setSavedIds] = useState([]);
  const { user, token } = useContext(AuthContext);

  // ✅ Hàm lấy token (đơn giản hóa)
  const getAuthToken = () => {
    return user?.token || token;
  };

  // ✅ Kiểm tra user đã đăng nhập
  const isLoggedIn = () => {
    const authToken = getAuthToken();
    return !!(user && authToken);
  };

  // Debug: Log để kiểm tra user và token
  useEffect(() => {
    console.log("=== DEBUG AUTH STATE ===");
    console.log("User object:", user);
    console.log("Token from context:", token);
    console.log("User token:", user?.token);
    console.log("Auth token:", getAuthToken());
    console.log("Is logged in:", isLoggedIn());
    console.log("========================");
  }, [user, token]);

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

  // ✅ Lấy danh sách tin đã lưu khi user thay đổi
  useEffect(() => {
    const fetchSaved = async () => {
      const authToken = getAuthToken();
      
      if (isLoggedIn() && authToken) {
        try {
          const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", { 
            headers: { Authorization: `Bearer ${authToken}` } 
          });
          setSavedIds(res.data.map(post => post.maTinDang));
          console.log("Fetched saved posts:", res.data);
        } catch (error) {
          console.error("Error fetching saved posts:", error);
          setSavedIds([]);
        }
      } else {
        setSavedIds([]);
      }
    };
    
    fetchSaved();
  }, [user, token]); // Dependency array

  const handleShowMore = () => {
    setVisiblePosts((prev) => prev + 25); 
  };

  const handleToggleSave = async (postId, isSaved) => {
    const authToken = getAuthToken();
    
    if (!isLoggedIn() || !authToken) {
      alert("Bạn cần đăng nhập để lưu tin.");
      return;
    }
    
    try {
      if (isSaved) {
        await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${postId}`, { 
          headers: { Authorization: `Bearer ${authToken}` } 
        });
        setSavedIds(prev => prev.filter(id => id !== postId));
        alert("Đã gỡ lưu tin đăng khỏi danh sách yêu thích.");
      } else {
        await axios.post(`http://localhost:5133/api/yeuthich/luu/${postId}`, {}, { 
          headers: { Authorization: `Bearer ${authToken}` } 
        });
        setSavedIds(prev => [...prev, postId]);
        alert("Đã lưu tin đăng vào danh sách yêu thích.");
      }
    } catch (err) {
      let msg = "Có lỗi xảy ra, vui lòng thử lại.";
      if (err.response && err.response.data && err.response.data.message) {
        const backendMsg = err.response.data.message;
        if (
          backendMsg.includes("chưa xác minh") ||
          backendMsg.toLowerCase().includes("gmail")
        ) {
          msg = "Bạn chưa xác minh gmail. Vui lòng kiểm tra email để xác minh tài khoản.";
        } else if (
          backendMsg.includes("chưa nhập") ||
          backendMsg.toLowerCase().includes("số điện thoại")
        ) {
          msg = "Bạn chưa nhập đầy đủ thông tin (ví dụ: Số điện thoại). Vui lòng cập nhật hồ sơ cá nhân.";
        } else {
          msg = backendMsg;
        }
      }
      alert(msg);
    }
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
      
      {/* Debug info - có thể bỏ sau khi fix xong */}
      {/* <div style={{ padding: '10px', backgroundColor: '#f0f0f0', margin: '10px 0', fontSize: '12px' }}>
        <p><strong>Debug Info:</strong></p>
        <p>User: {user ? '✅ Có' : '❌ Không'}</p>
        <p>Token từ context: {token ? '✅ Có' : '❌ Không'}</p>
        <p>User Token: {user?.token ? '✅ Có' : '❌ Không'}</p>
        <p>Auth Token: {getAuthToken() ? '✅ Có' : '❌ Không'}</p>
        <p>Is Logged In: {isLoggedIn() ? '✅ Có' : '❌ Không'}</p>
        <p>Saved Posts Count: {savedIds.length}</p>
      </div> */}

      <div className="post-list">
        {renderNoPostsMessage() ? (
          <p>{renderNoPostsMessage()}</p> 
        ) : (
          posts.slice(0, visiblePosts).map((post) => (
            <div key={post.maTinDang} className="post-item" style={{ position: 'relative' }}>
              {/* ✅ Tính năng tin HOT từ code 1 */}
              {post.savedCount >= 2 && (
                <div style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  zIndex: 3,
                  background: 'linear-gradient(90deg, #ff9800, #ff3d00)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  borderRadius: 8,
                  padding: '2px 10px',
                  boxShadow: '0 2px 8px rgba(255,152,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  animation: 'hot-fire 1s infinite alternate',
                  letterSpacing: 1
                }}>
                  <span role="img" aria-label="fire" style={{ fontSize: 18, marginRight: 4, filter: 'drop-shadow(0 0 4px #ff9800)' }}>🔥</span>
                  HOT
                </div>
              )}

              {/* ✅ Nút lưu tin - kiểm tra điều kiện rõ ràng */}
              {isLoggedIn() && (
                <div 
                  style={{ position: "absolute", top: 10, right: 10, zIndex: 2, cursor: "pointer" }}
                  onClick={e => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    handleToggleSave(post.maTinDang, savedIds.includes(post.maTinDang)); 
                  }}
                  title={savedIds.includes(post.maTinDang) ? "Bỏ lưu tin này" : "Lưu tin này"}
                >
                  <FaHeart style={{ color: savedIds.includes(post.maTinDang) ? "#e74c3c" : "#ccc", fontSize: 20 }} />
                </div>
              )}

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