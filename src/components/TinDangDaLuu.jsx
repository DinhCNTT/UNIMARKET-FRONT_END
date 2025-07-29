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
  // State cho scroll và xem thêm
  const [showAllRows, setShowAllRows] = useState(false);

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
  const visibleRows = showAllRows ? rows : rows.slice(0, 2);

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
            maxWidth: 1100,
            width: "90vw",
            margin: "auto",
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            padding: 24,
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            minHeight: 300,
            maxHeight: 420,
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
              style={{
                width: "100%",
                overflowY: rows.length > 2 ? "auto" : "unset",
                maxHeight: rows.length > 2 ? 340 : "unset",
                paddingRight: rows.length > 2 ? 8 : 0,
                marginBottom: 8,
              }}
            >
              {visibleRows.map((row, idx) => (
                <div
                  key={idx}
                  className="post-list"
                  style={{
                    display: "flex",
                    gap: 10,
                    overflow: "hidden",
                    minHeight: 160,
                    marginBottom: 16,
                  }}
                >
                  {row.map((post) => (
                    <div
                      key={post.maTinDang}
                      className="post-item"
                      style={{
                        minWidth: 150,
                        maxWidth: 170,
                        flex: "0 0 20%",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          zIndex: 2,
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemove(post.maTinDang);
                        }}
                        title="Bỏ lưu tin này"
                      >
                        <FaHeart style={{ color: "#e74c3c", fontSize: 18 }} />
                      </div>
                      <div
                        className="post-link"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleImageClick(post.maTinDang)}
                      >
                        <div
                          className="post-images-tin-dang-danh-cho-ban"
                          style={{
                            width: "100%",
                            height: 90,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            borderRadius: 7,
                            background: "#f7f7f7",
                          }}
                        >
                          {post.images && post.images.length > 0 ? (
                            <img
                              src={
                                post.images[0].startsWith("http")
                                  ? post.images[0]
                                  : `http://localhost:5133${post.images[0]}`
                              }
                              alt="Ảnh đại diện"
                              className="post-image"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: 7,
                              }}
                            />
                          ) : (
                            <p>Không có ảnh.</p>
                          )}
                        </div>
                        <div className="post-info">
                          <h3
                            style={{
                              fontSize: 13,
                              margin: "7px 0 3px 0",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {post.tieuDe}
                          </h3>
                          <p
                            className="price"
                            style={{
                              fontSize: 12,
                              color: "#e67e22",
                              margin: 0,
                            }}
                          >
                            {post.gia?.toLocaleString()} VND
                          </p>
                          <p
                            className="post-description"
                            style={{
                              fontSize: 11,
                              color: "#888",
                              margin: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {post.diaChi}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {rows.length > 2 && (
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
                    onClick={() => setShowAllRows((prev) => !prev)}
                  >
                    {showAllRows ? "Thu gọn" : "Xem thêm"}
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
