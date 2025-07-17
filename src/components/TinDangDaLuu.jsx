import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import TopNavbar from "./TopNavbar";
import Footer from "./Footer";
import { AuthContext } from "../context/AuthContext";

const TinDangDaLuu = () => {
  const [posts, setPosts] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  // State cho scroll
  const [startIdx, setStartIdx] = useState(0);

  const fetchSavedPosts = async (token) => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      setPosts([]);
    }
  };

  useEffect(() => {
    if (user && user.token) {
      fetchSavedPosts(user.token);
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
      // Xóa khỏi state ngay lập tức để UX mượt hơn
      setPosts(prev => prev.filter(post => post.maTinDang !== id));
      alert("Đã gỡ lưu tin đăng khỏi danh sách yêu thích.");
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

  // Thêm hàm lưu tin
  const handleSave = async (id) => {
    if (!user || !user.token) {
      alert("Bạn cần đăng nhập để sử dụng chức năng này.");
      return;
    }
    try {
      await axios.post(`http://localhost:5133/api/yeuthich/luu/${id}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("Đã lưu tin đăng vào danh sách yêu thích.");
      // Có thể cập nhật lại danh sách nếu muốn
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

  const handleImageClick = (maTinDang) => {
    // Điều hướng đến trang chi tiết tin đăng
    navigate(`/tin-dang/${maTinDang}`);
  };

  return (
    <>
      <TopNavbar />
      <div style={{ maxWidth: 1100, margin: "80px auto 40px 180px", background: "#fff", borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: 24, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%' }}>
          <h2 className="tieu-de" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, color: "#ff9800" }}>
            <FaHeart style={{ color: "#ff9800" }} /> Tin đăng đã lưu
          </h2>
          {posts.length === 0 ? (
            <p style={{ color: "#888", marginTop: 32 }}>Bạn chưa lưu tin đăng nào.</p>
          ) : (
            <div style={{ position: 'relative' }}>
              {posts.length > 4 && (
                <>
                  <button
                    style={{ position: 'absolute', left: -40, top: '40%', zIndex: 3, background: '#fff', border: '1px solid #eee', borderRadius: '50%', width: 36, height: 36, fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    onClick={() => setStartIdx(idx => Math.max(0, idx - 1))}
                  >
                    &#60;
                  </button>
                  <button
                    style={{ position: 'absolute', right: -40, top: '40%', zIndex: 3, background: '#fff', border: '1px solid #eee', borderRadius: '50%', width: 36, height: 36, fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    onClick={() => setStartIdx(idx => Math.min(posts.length - 4, idx + 1))}
                  >
                    &#62;
                  </button>
                </>
              )}
              <div className="post-list" style={{ display: 'flex', gap: 18, overflow: 'hidden', minHeight: 220 }}>
                {posts.slice(startIdx, startIdx + 4).map(post => (
                  <div key={post.maTinDang} className="post-item" style={{ minWidth: 240, maxWidth: 260, flex: '0 0 25%', position: 'relative' }}>
                    <div style={{ position: "absolute", top: 10, right: 10, zIndex: 2, cursor: "pointer" }}
                      onClick={e => { e.preventDefault(); e.stopPropagation(); handleRemove(post.maTinDang); }}
                      title="Bỏ lưu tin này"
                    >
                      <FaHeart style={{ color: "#e74c3c", fontSize: 20 }} />
                    </div>
                    <div className="post-link" style={{ cursor: "pointer" }} onClick={() => handleImageClick(post.maTinDang)}>
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
                        <p className="price">{post.gia?.toLocaleString()} VND</p>
                        <p className="post-description">{post.diaChi}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TinDangDaLuu;
