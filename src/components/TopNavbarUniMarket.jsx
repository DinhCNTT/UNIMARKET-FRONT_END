import React, { useRef, useEffect, useContext, useState } from "react";
import {
  FiSearch,
  FiBell,
  FiHome,
  FiCompass,
  FiUpload,
  FiMessageSquare,
  FiUser
} from "react-icons/fi";
import VideoSearchOverlay from "./VideoSearchOverlay";
import "./TopNavbarUniMarket.css";
import { useNavigate, useLocation } from "react-router-dom"; 
import { VideoContext } from "../context/VideoContext";


export default function TopNavbarUniMarket() {
  const navRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, setActiveTab, triggerReload } = useContext(VideoContext);

 // ✅ state profile user
  const [profile, setProfile] = useState(null);

  // ✅ Hàm xử lý avatar URL linh hoạt
  const getAvatarSrc = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };
// ✅ Giữ For You active chỉ khi đang ở VideoDetailViewer
useEffect(() => {
  const path = location.pathname;
  const floatingTabs = new Set(["search", "upload", "messages", "activity"]);

  if (path.startsWith("/video/")) {
    // chỉ set lại forYou nếu không mở panel nổi
    if (!floatingTabs.has(activeTab) && activeTab !== "forYou") {
      setActiveTab("forYou");
    }
  } else {
    // ra khỏi /video thì bỏ activeTab forYou
    if (activeTab === "forYou") {
      setActiveTab(null);
    }
  }
}, [location.pathname, activeTab, setActiveTab]);


  // ✅ fetch profile từ API khi component mount
useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token"); // 👈 token đã lưu khi login

  if (!user || !token) return;

  fetch(`http://localhost:5133/api/user/profile/${user.id}`, {
    headers: {
      "Authorization": `Bearer ${token}`, // 👈 thêm token
      "Content-Type": "application/json"
    }
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("Không lấy được profile (Unauthorized)");
      }
      return res.json();
    })
    .then((data) => {
      console.log("Profile API:", data);
      setProfile(data);
    })
    .catch((err) => console.error("Lỗi load profile:", err));
}, []);

// ✅ toggle tab
const toggleTab = (tab) => {
  if (tab === "forYou") {
    setActiveTab("forYou");
    triggerReload(); // ✅ có loading hiệu ứng

    // 👉 Nếu không ở trong VideoDetailViewer thì điều hướng về đó
    if (!window.location.pathname.startsWith("/video/")) {
      navigate("/video/1"); // tạm thời điều hướng video đầu tiên / video mặc định
    }

  } else if (tab === "search") {
    setActiveTab("search");
  } else {
    setActiveTab(tab);
  }
};


// ✅ Click outside để đóng panel
useEffect(() => {
  const handleClickOutside = (e) => {
    const nav = navRef.current;
    const panel = panelRef.current;

    // true nếu click ngoài navbar
    const clickedOutsideNav = nav && !nav.contains(e.target);
    // true nếu không có panel hoặc click ngoài panel (panel = vùng overlay như search/upload/messages/activity)
    const clickedOutsidePanel = !panel || !panel.contains(e.target);

    // Chỉ xử lý khi click thật sự bên ngoài cả nav lẫn panel
    if (!(clickedOutsideNav && clickedOutsidePanel)) return;

    // Các tab dạng "panel nổi" (click ra ngoài thì đóng)
    const floatingTabs = new Set(["search", "upload", "messages", "activity"]);

    if (activeTab === "search") {
      // đang search -> về forYou
      setActiveTab("forYou");
      return;
    }

    if (floatingTabs.has(activeTab)) {
      // nếu đang ở 1 panel nổi -> về forYou
      setActiveTab("forYou");
      return;
    }

    // Còn lại là các tab điều hướng "dính" (forYou, profile, explore)
    // -> KHÔNG đổi activeTab (giữ nguyên màu vàng của Profile)
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [activeTab, setActiveTab]);



  return (
    <div className="um-tn-root">
      <nav
        className={`um-tn-navbar ${activeTab === "search" ? "collapsed" : ""}`}
        ref={navRef}
      >
        {/* Logo */}
        <div
          className="um-tn-logo"
          onClick={() => {
            setActiveTab("forYou"); // bấm logo về mặc định For You
            navigate("/market");   
          }}
          style={{ cursor: "pointer" }}
        >
          {activeTab === "search" ? (
            <div className="um-tn-logo-u">U</div>
          ) : (
            <img
              src="/logoWeb.png"
              alt="UniMarket Logo"
              className="um-tn-logo-img"
            />
          )}
        </div>

        {/* Nút Search */}
        <button
          className={`um-tn-icon-btn search-btn ${
            activeTab === "search" ? "active" : ""
          }`}
          onClick={() => toggleTab("search")}
        >
          <FiSearch size={20} />
          {activeTab !== "search" && <span>Search</span>}
        </button>

        {/* Các nút Menu */}
        <div className="um-tn-icons">
          {/* For You */}
          <button
            className={`um-tn-icon-btn ${
              activeTab === "forYou" ? "active" : ""
            }`}
            onClick={() => toggleTab("forYou")}
          >
            <FiHome size={20} />
            <span>For You</span>
          </button>

          {/* Explore */}
          <button
            className={`um-tn-icon-btn ${
              activeTab === "explore" ? "active" : ""
            }`}
            onClick={() => toggleTab("explore")}
          >
            <FiCompass size={20} />
            {activeTab !== "search" && <span>Explore</span>}
          </button>

          {/* Upload */}
          <button
            className={`um-tn-icon-btn ${
              activeTab === "upload" ? "active" : ""
            }`}
            onClick={() => toggleTab("upload")}
          >
            <FiUpload size={20} />
            {activeTab !== "search" && <span>Upload</span>}
          </button>

          {/* Activity */}
          <button
            className={`um-tn-icon-btn ${
              activeTab === "activity" ? "active" : ""
            }`}
            onClick={() => toggleTab("activity")}
          >
            <FiBell size={20} />
            {activeTab !== "search" && <span>Activity</span>}
          </button>

          {/* Messages */}
          <button
            className={`um-tn-icon-btn ${
              activeTab === "messages" ? "active" : ""
            }`}
            onClick={() => toggleTab("messages")}
          >
            <FiMessageSquare size={20} />
            {activeTab !== "search" && <span>Messages</span>}
          </button>

          {/* Profile */}
          <button
            className={`um-tn-icon-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => {
              if (profile?.id) {
                setActiveTab("profile"); 
                navigate(`/nguoi-dung/${profile.id}`);  
              }
            }}
          >
            {profile && profile.avatarUrl ? (
              <img
                src={getAvatarSrc(profile.avatarUrl)}
                alt="Avatar"
                className="um-tn-avatar"
              />
            ) : (
              <FiUser size={20} />
            )}
            {activeTab !== "search" && <span>Profile</span>}
          </button>

        </div>
      </nav>

      {/* Panel */}
      <div
        className={`um-tn-panel-wrapper ${activeTab ? "open" : ""}`}
        aria-hidden={activeTab ? "false" : "true"}
      >
        {activeTab === "search" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <VideoSearchOverlay
              isOpen={activeTab === "search"}
              onClose={() => setActiveTab(null)}
            />
          </div>
        )}

        {activeTab === "activity" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <h3>Notifications</h3>
            <p>Chưa có thông báo mới</p>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <h3>Upload Video</h3>
            <p>Form upload sẽ ở đây</p>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <h3>Tin nhắn</h3>
            <p>Danh sách tin nhắn</p>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="um-tn-tab-content" ref={panelRef}>
          </div>
        )}

        {activeTab === "forYou" && ( 
          <div className="um-tn-tab-content" ref={panelRef}> 
        </div>
        )}
        
        {activeTab === "explore" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <h3>Explore</h3>
          </div>
        )}
      </div>
    </div>
  );
}
