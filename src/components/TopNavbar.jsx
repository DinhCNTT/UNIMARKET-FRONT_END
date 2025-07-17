import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import * as signalR from "@microsoft/signalr";
import "./TopNavbar.css";
import SearchBar from "./SearchBar";
import { CategoryContext } from "../context/CategoryContext";
import { SearchContext } from "../context/SearchContext";
import { AuthContext } from "../context/AuthContext";
import {
  FaBell,
  FaComments,
  FaShoppingBag,
  FaUserCircle,
  FaChevronDown,
  FaHeart,
  FaVideo,
  FaCommentDots,
  FaCog,
  FaCommentAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { MdTableRows } from "react-icons/md";

const TopNavbar = () => {
  const [categories, setCategories] = useState([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const connectionRef = useRef(null);

  const {
    setSelectedCategory,
    selectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
  } = useContext(CategoryContext);
  const { setSearchTerm } = useContext(SearchContext);
  const { user, avatarUrl, logout } = useContext(AuthContext); // Thêm avatarUrl từ context

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (
      location.pathname !== "/market" &&
      location.pathname !== "/loc-tin-dang"
    ) {
      setSelectedCategory("");
      setSelectedSubCategory("");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const hiddenChats = JSON.parse(localStorage.getItem("hiddenChats")) || [];
        const params = new URLSearchParams();
        hiddenChats.forEach(id => params.append("hiddenChatIds", id));

        const res = await axios.get(
          `http://localhost:5133/api/chat/unread-count/${user.id}?${params.toString()}`
        );
        setUnreadCount(res.data.unreadCount || 0);
      } catch (error) {
        console.error("Lỗi lấy số tin nhắn chưa đọc:", error);
      }
    };

    fetchUnreadCount();

    const handleStorageChange = (e) => {
      if (e.key === "hiddenChats") {
        fetchUnreadCount();
      }
    };

    const handleHiddenChatsChange = () => {
      fetchUnreadCount();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("hiddenChatsChanged", handleHiddenChatsChange);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5133/hub/chat")
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.start()
      .then(() => {
        connection.invoke("ThamGiaCuocTroChuyen", `user-${user.id}`);

        connection.on("CapNhatTrangThaiTinNhan", () => {
          fetchUnreadCount();
        });

        connection.on("CapNhatCuocTroChuyen", () => {
          fetchUnreadCount();
        });
      })
      .catch((err) => {
        console.error("❌ SignalR connect error:", err);
      });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("hiddenChatsChanged", handleHiddenChatsChange);
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5133/api/category/get-categories-with-icon"
      );
      setCategories(res.data);
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
    }
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubCategory("");
    setSearchTerm("");
    navigate("/loc-tin-dang");
  };

  const handleSubCategoryClick = (parentCategory, subCategory) => {
    setSelectedCategory(parentCategory);
    setSelectedSubCategory(subCategory);
    setSearchTerm("");
    navigate("/loc-tin-dang");
  };

  const handleLogoClick = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSearchTerm("");
    navigate("/market");
  };

  const handlePostClick = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để đăng tin.");
      navigate("/login");
      return;
    }
    if (!user.emailConfirmed) {
      alert("Bạn cần xác minh email để đăng tin.");
      navigate("/cai-dat-tai-khoan");
      return;
    }
    navigate("/dang-tin");
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
                    onClick={() => handleCategoryClick(parent.tenDanhMucCha)}
                  >
                    {parent.icon && (
                      <img src={parent.icon} alt="icon" className="category-icon" />
                    )}
                    {parent.tenDanhMucCha}
                  </span>
                  {parent.danhMucCon.length > 0 && (
                    <div className="sub-menu">
                      {parent.danhMucCon.map((child) => (
                        <span
                          key={child.id}
                          className="sub-link"
                          onClick={() => handleSubCategoryClick(parent.tenDanhMucCha, child.tenDanhMucCon)}
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
        <FaBell className="nav-icon" title="Thông báo" />
        <div className="nav-icon-chat" onClick={() => navigate("/chat")} style={{ position: "relative" }} title="Tin nhắn">
          <FaComments />
          {unreadCount > 0 && (
            <span className="unread-count-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <FaShoppingBag className="nav-icon" title="Giỏ hàng" />

        {user && (
          <button className="manage-post-btn" onClick={() => navigate("/quan-ly-tin")}> <MdTableRows size={18} className="icon-manage" /> Quản lý tin </button>
        )}

        {user ? (
          <div
            className="account-section"
            onMouseEnter={() => setShowAccountDropdown(true)}
            onMouseLeave={() => setShowAccountDropdown(false)}
            style={{ position: "relative" }}
          >
            <div className="account-info">
              {avatarUrl ? (
                <img
                  src={avatarUrl.startsWith("http") ? avatarUrl : `http://localhost:5133${avatarUrl}`}
                  alt="Avatar"
                  className="account-avatar-img"
                  style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <FaUserCircle className="account-avatar" style={{ fontSize: "26px" }} />
              )}
              <span className="account-name">{user.fullName || user.tenNguoiDung || "Tài khoản"}</span>
              <FaChevronDown className="dropdown-icon" />
            </div>
            {showAccountDropdown && (
              <div className="account-dropdown" style={{ position: "absolute", right: 0, top: "100%", backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 1000, minWidth: "230px", padding: "10px 0" }}>
                <div style={{ padding: "0 16px", fontWeight: "bold", color: "#666", fontSize: "13px" }}>Tiện ích</div>
                <span onClick={() => navigate("/tin-dang-da-luu")} className="dropdown-item">
                  <FaHeart className="dropdown-icon" /> Tin đăng đã lưu
                </span>
                <span onClick={() => navigate("/video-da-tym")} className="dropdown-item">
                  <FaVideo className="dropdown-icon" /> Video đã tym
                </span>
                <span onClick={() => navigate("/binh-luan-cua-toi")} className="dropdown-item">
                  <FaCommentDots className="dropdown-icon" /> Bình luận của tôi
                </span>

                <div className="dropdown-divider"></div>

                <div style={{ padding: "0 16px", fontWeight: "bold", color: "#666", fontSize: "13px" }}>Khác</div>
                <span onClick={() => navigate("/cai-dat-tai-khoan")} className="dropdown-item">
                  <FaCog className="dropdown-icon" /> Cài đặt tài khoản
                </span>
                <span onClick={() => navigate("/gop-y")} className="dropdown-item">
                  <FaCommentAlt className="dropdown-icon" /> Đóng góp ý kiến
                </span>
                <span onClick={logout} className="dropdown-item">
                  <FaSignOutAlt className="dropdown-icon" /> Đăng xuất
                </span>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="login-btn" onClick={() => navigate("/login")}>Đăng Nhập</button>
            <button className="register-btn" onClick={() => navigate("/register")}>Đăng Ký</button>
          </>
        )}

        <button className="post-btn-highlight" onClick={handlePostClick}>📝 ĐĂNG TIN</button>
      </div>
    </header>
  );
};

export default TopNavbar;