import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import * as signalR from "@microsoft/signalr";
import "./TopNavbar.css";
import SearchBar from "./SearchBar";
import { CategoryContext } from "../context/CategoryContext";
import { SearchContext } from "../context/SearchContext";
import { AuthContext } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";

const TopNavbar = () => {
  const [categories, setCategories] = useState([]);
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { setSearchTerm } = useContext(SearchContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const connectionRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (location.pathname !== "/market" && location.pathname !== "/loc-tin-dang") {
      setSelectedCategory("");
      setSelectedSubCategory("");
    }
  }, [location.pathname]);

  // Lấy số tin nhắn chưa đọc ban đầu và thiết lập SignalR realtime
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    // Hàm lấy số chưa đọc qua API
    const fetchUnreadCount = async () => {
      try {
        const res = await axios.get(`http://localhost:5133/api/chat/unread-count/${user.id}`);
        setUnreadCount(res.data.unreadCount || 0);
      } catch (error) {
        console.error("Lỗi lấy số tin nhắn chưa đọc:", error);
      }
    };

    fetchUnreadCount();

    // Khởi tạo kết nối SignalR
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5133/hub/chat")
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.start()
      .then(() => {
        // Join group user để nhận notification riêng
        connection.invoke("ThamGiaCuocTroChuyen", `user-${user.id}`);
        // Lắng nghe event cập nhật trạng thái tin nhắn
        connection.on("CapNhatTrangThaiTinNhan", (data) => {
          // Khi có sự kiện, luôn gọi lại API để lấy tổng số chưa đọc mới nhất
          fetchUnreadCount();
        });

        // Event khi có tin nhắn mới cập nhật cuộc trò chuyện
        connection.on("CapNhatCuocTroChuyen", (chat) => {
          fetchUnreadCount();
        });
      })
      .catch((err) => {
        console.error("❌ SignalR connect error:", err);
      });

    // Cleanup khi component unmount
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
      setCategories(res.data);
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
    }
  };

  const handleLogoClick = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSearchTerm("");
    navigate("/market");
  };

  return (
    <header className="top-navbar">
      <div className="nav-left">
        <span className="logo" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
          Unimarket
        </span>

        <nav className="main-menu">
          <div className="dropdown">
            <span className="dropdown-title">Danh mục</span>
            <div className="dropdown-content">
              {categories.map((parent) => (
                <div key={parent.id} className="parent-category">
                  <span
                    className="parent-link"
                    onClick={() => {
                      setSelectedCategory(parent.tenDanhMucCha);
                      setSelectedSubCategory("");
                      setSearchTerm("");
                      navigate("/loc-tin-dang");
                    }}
                  >
                    {parent.icon && <img src={parent.icon} alt="icon" className="category-icon" />}
                    {parent.tenDanhMucCha}
                  </span>
                  {parent.danhMucCon.length > 0 && (
                    <div className="sub-menu">
                      {parent.danhMucCon.map((child) => (
                        <span
                          key={child.id}
                          className="sub-link"
                          onClick={() => {
                            setSelectedCategory(parent.tenDanhMucCha);
                            setSelectedSubCategory(child.tenDanhMucCon);
                            setSearchTerm("");
                            navigate("/loc-tin-dang");
                          }}
                        >
                          {child.tenDanhMucCon}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </nav>
      </div>

      <div className="nav-search">
        <SearchBar />
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <div
              className="chat-icon-topnavbar"
              onClick={() => navigate("/chat")}
              title="Tin nhắn"
              style={{ position: "relative" }}
            >
              <FontAwesomeIcon icon={faComments} />
              {unreadCount > 0 && (
                <span className="unread-count-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <button className="manage-post-btn" onClick={() => navigate("/quan-ly-tin")}>
              Quản lý tin
            </button>
            <span className="post-btn" onClick={() => navigate("/dang-tin")}>
              ĐĂNG TIN
            </span>
            <button className="logout-btn" onClick={logout}>
              Đăng Xuất
            </button>
          </>
        ) : (
          <>
            <button className="login-btn" onClick={() => navigate("/login")}>
              Đăng Nhập
            </button>
            <button className="register-btn" onClick={() => navigate("/register")}>
              Đăng Ký
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;
