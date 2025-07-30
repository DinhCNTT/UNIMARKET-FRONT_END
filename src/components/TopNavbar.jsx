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
import { toast } from "sonner";

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
  const { user, avatarUrl, logout, getStoredToken } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  // Hàm cắt bớt tên người dùng nếu dài hơn 13 ký tự
  const truncateName = (name, maxLength) => {
    if (name.length > maxLength) {
      return name.substring(0, maxLength - 3) + "...";
    }
    return name;
  };

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

  const checkUserInfo = async () => {
    try {
      const token = getStoredToken();
      
      if (!token || !user?.id) {
        console.log("❌ Không có token hoặc user.id");
        return { valid: false, message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
      }

      console.log("🔍 Checking user info for:", {
        userId: user.id,
        hasToken: !!token,
        tokenPrefix: token.substring(0, 20) + "..."
      });

      const response = await axios.get(`http://localhost:5133/api/user/profile/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const serverUser = response.data;
      console.log("✅ Server user data:", serverUser);
      console.log("📋 Current user data:", user);
      
      if (!serverUser.emailConfirmed) {
        return { valid: false, message: "Bạn cần xác minh email để đăng tin." };
      }
      
      const serverPhone = serverUser.phoneNumber?.trim();
      
      console.log("📱 Phone check:", {
        serverPhone,
        hasServerPhone: !!serverPhone
      });
      
      if (!serverPhone || serverPhone === "") {
        return { valid: false, message: "Bạn cần cập nhật số điện thoại để đăng tin." };
      }
      
      return { valid: true };
      
    } catch (error) {
      console.error("❌ Lỗi khi kiểm tra thông tin user:", error);
      
      if (error.response?.status === 401) {
        return { valid: false, message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
      }
      
      return { valid: false, message: "Không thể xác thực thông tin. Vui lòng thử lại." };
    }
  };

  const handlePostClick = async () => {
    if (!user) {
      toast.error("⚠️ Vui lòng đăng nhập để đăng tin.", {
        position: "top-center",
      });
      navigate("/login");
      return;
    }

    const loadingToast = toast.loading("🔍 Đang kiểm tra thông tin tài khoản...", {
      position: "top-center",
    });

    try {
      const validation = await checkUserInfo();

      toast.dismiss(loadingToast);

      if (!validation.valid) {
        if (validation.message.includes("hết hạn")) {
          toast.error(`🔒 ${validation.message}`, {
            position: "top-center",
            duration: 4000,
            className: "toast-session-expired"
          });
          logout();
          navigate("/login");
          return;
        } else if (validation.message.includes("xác minh email")) {
          toast.error(`📧 ${validation.message}`, {
            position: "top-center",
            duration: 3500,
            className: "topnnavbar-toast-verify-email"
          });
        } else if (validation.message.includes("số điện thoại")) {
          toast.error(`📱 ${validation.message}`, {
            position: "top-center",
            duration: 3500,
            className: "topnnavbar-toast-update-phone"
          });
        } else {
          toast.error(`❌ ${validation.message}`, {
            position: "top-center",
            duration: 3500,
          });
        }
        
        navigate("/cai-dat-tai-khoan");
        return;
      }

     toast.success("Thông tin hợp lệ! Chuyển đến trang đăng tin...", {
  position: "top-center",
  duration: 2500,
  style: {
    background: "linear-gradient(135deg, #16a34a, #15803d)", // xanh lá đậm
    color: "#fff",
    fontWeight: "bold",
    fontSize: "14px",         // 🔹 Chữ nhỏ hơn
    borderRadius: "12px",
    padding: "12px 18px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    letterSpacing: "0.3px",
    whiteSpace: "nowrap",     // 🔹 Không cho xuống dòng
    maxWidth: "none",         // 🔹 Không giới hạn chiều rộng
  },
});

      
      navigate("/dang-tin");
      
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("❌ Unexpected error in handlePostClick:", error);
      toast.error("❌ Có lỗi xảy ra. Vui lòng thử lại.", {
        position: "top-center",
      });
    }
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
          <button className="manage-post-btn" onClick={() => navigate("/quan-ly-tin")}> 
            <MdTableRows size={18} className="icon-manage" /> Quản lý tin 
          </button>
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
              <span className="account-name">
                {truncateName(user.fullName || user.tenNguoiDung || "Tài khoản", 13)}
              </span>
              <FaChevronDown className="dropdown-icon" />
            </div>
            {showAccountDropdown && (
              <div className="account-dropdown">
                <div className="account-dropdown-title">Tiện ích</div>
                <span onClick={() => navigate("/tin-dang-da-luu")} className="dropdown-item">
                  <FaHeart className="dropdown-icon" style={{ color: "#ef4444" }} /> Tin đăng đã lưu
                </span>
                <span onClick={() => navigate("/video-da-tym")} className="dropdown-item">
                  <FaVideo className="dropdown-icon" style={{ color: "#3b82f6" }} /> Video đã tym
                </span>
                <span onClick={() => navigate("/binh-luan-cua-toi")} className="dropdown-item">
                  <FaCommentDots className="dropdown-icon" style={{ color: "#10b981" }} /> Bình luận của tôi
                </span>
                <div className="dropdown-divider"></div>
                <div className="account-dropdown-title">Khác</div>
                <span onClick={() => navigate("/cai-dat-tai-khoan")} className="dropdown-item">
                  <FaCog className="dropdown-icon" style={{ color: "#6366f1" }} /> Cài đặt tài khoản
                </span>
                <span onClick={() => navigate("/gop-y")} className="dropdown-item">
                  <FaCommentAlt className="dropdown-icon" style={{ color: "#f59e0b" }} /> Đóng góp ý kiến
                </span>
                <span onClick={logout} className="dropdown-item">
                  <FaSignOutAlt className="dropdown-icon" style={{ color: "#6b7280" }} /> Đăng xuất
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