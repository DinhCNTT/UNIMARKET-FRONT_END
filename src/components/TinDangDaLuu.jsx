import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import TopNavbar from "./TopNavbar";
import Footer from "./Footer";
import { AuthContext } from "../context/AuthContext";
import "./TinDangDanhChoBan.css";

const TinDangDaLuu = () => {
  const [posts, setPosts] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  // State cho scroll và xem thêm
  const [showAllRows, setShowAllRows] = useState(false);
  const scrollRef = useRef(null);

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

  // Chia posts thành các nhóm 5
  // Chia posts thành các nhóm 5 (dạng lưới)
  const getRows = () => {
    const rows = [];
    let i = 0;
    while (i < posts.length) {
      rows.push(posts.slice(i, i + 5));
      i += 5;
    }
    return rows;
  };

  const rows = getRows();
  // Luôn hiển thị đủ 2 dòng, chỉ showAllRows khi bấm Xem thêm
  const visibleRows = showAllRows ? rows : rows.slice(0, 2);

  // Kiểm tra đã kéo hết để hiện nút Xem thêm
  const [showSeeMore, setShowSeeMore] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight + 10 >= scrollHeight) {
        setShowSeeMore(true);
      } else {
        setShowSeeMore(false);
      }
    };
    if (scrollRef.current && !showAllRows) {
      scrollRef.current.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (scrollRef.current && !showAllRows) {
        scrollRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, [rows.length, showAllRows]);

  return (
    <>
      <TopNavbar />
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            width: "95vw",
            margin: "auto",
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            padding: 24,
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            minHeight: 370,
            maxHeight: rows.length > 2 ? 630 : 410,
            overflow: "hidden",
          }}
        >
          <h2
            className="tieu-de"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 22,
              color: "#ff9800",
            }}
          >
            <FaHeart style={{ color: "#ff9800" }} /> Tin đăng đã lưu
          </h2>
          {posts.length === 0 ? (
            <p style={{ color: "#888", marginTop: 32 }}>
              Bạn chưa lưu tin đăng nào.
            </p>
          ) : (
            <div
              ref={scrollRef}
              style={{
                width: "100%",
                overflowY: rows.length > 2 ? "auto" : "unset",
                maxHeight: rows.length > 2 ? 600 : "unset",
                paddingRight: rows.length > 2 ? 8 : 0,
                marginBottom: 8,
              }}
            >
              <div className="post-list">
                {visibleRows.flat().map((post) => (
                  <div
                    key={post.maTinDang}
                    className="post-item"
                    style={{ position: "relative" }}
                  >
                    {/* HOT tag nếu có nhiều hơn 2 lượt lưu */}
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
                    {/* Nút tim xóa lưu */}
                    <div
                      style={{ position: "absolute", top: 10, right: 10, zIndex: 2, cursor: "pointer" }}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(post.maTinDang);
                      }}
                      title="Bỏ lưu tin này"
                    >
                      <FaHeart style={{ color: "#e74c3c", fontSize: 20 }} />
                    </div>
                    <div
                      className="post-link"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleImageClick(post.maTinDang)}
                    >
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
                        <p className="post-description">{post.quanHuyen} - {post.tinhThanh}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Nút Xem thêm chỉ hiện khi đã kéo hết */}
              {rows.length > 2 && !showAllRows && showSeeMore && (
                <div style={{ textAlign: "center", marginTop: 4 }}>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ff9800",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                    onClick={() => setShowAllRows(true)}
                  >
                    Xem thêm
                  </button>
                </div>
              )}
              {showAllRows && rows.length > 2 && (
                <div style={{ textAlign: "center", marginTop: 4 }}>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ff9800",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 15,
                    }}
                    onClick={() => {
                      setShowAllRows(false);
                      // Đặt lại showSeeMore về false, nhưng sẽ được cập nhật lại khi kéo xuống
                      setTimeout(() => setShowSeeMore(false), 100);
                    }}
                  >
                    Thu gọn
                  </button>
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
