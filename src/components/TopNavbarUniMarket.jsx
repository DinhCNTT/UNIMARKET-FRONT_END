import React, { useRef, useEffect, useContext, useState } from "react";
import {
  FiSearch, FiBell, FiHome, FiCompass, FiUpload, FiMessageSquare, FiUser
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

  // ✅ THÊM: Navbar mini khi ở trang chat
  const isChatRoute = location.pathname.startsWith("/chat");
  const [isMini, setIsMini] = useState(isChatRoute);

  useEffect(() => {
    setIsMini(isChatRoute); // tự đồng bộ mini theo route
  }, [isChatRoute]);

  const getAvatarSrc = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  // ✅ Giữ For You active chỉ khi đang ở VideoDetailViewer
  useEffect(() => {
    const path = location.pathname;
    const floatingTabs = new Set(["search", "upload", "messages", "activity"]);
    if (path.startsWith("/video/")) {
      if (!floatingTabs.has(activeTab) && activeTab !== "forYou") {
        setActiveTab("forYou");
      }
    } else {
      if (activeTab === "forYou") {
        setActiveTab(null);
      }
    }
  }, [location.pathname, activeTab, setActiveTab]);

  // ✅ fetch profile
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (!user || !token) return;

    fetch(`http://localhost:5133/api/user/profile/${user.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Không lấy được profile");
        return r.json();
      })
      .then(setProfile)
      .catch(console.error);
  }, []);

  const toggleTab = (tab) => {
    if (tab === "forYou") {
      setActiveTab("forYou");
      triggerReload();
      if (!window.location.pathname.startsWith("/video/")) {
        navigate("/video/1");
      }
    } else if (tab === "search") {
      setActiveTab("search");
    } else {
      setActiveTab(tab);
    }
  };

  // ✅ Sync activeTab theo route chat để giữ nút Messages màu vàng
useEffect(() => {
  if (location.pathname.startsWith("/chat")) {
    // 🚀 Không ép về "messages" nếu đang mở search
    if (activeTab !== "messages" && activeTab !== "search") {
      setActiveTab("messages");
    }
  } else if (activeTab === "messages") {
    setActiveTab(null);
  }
}, [location.pathname, activeTab, setActiveTab]);


  // ✅ Click icon chat
  const handleChatClick = () => {
    navigate("/chat");
    setActiveTab("messages");
    setIsMini(true); // vào chat -> mini
  };

  // ✅ Click outside: KHÔNG ép về forYou khi đang ở trang chat
useEffect(() => {
  const handleClickOutside = (e) => {
    const nav = navRef.current;
    const panel = panelRef.current;
    const clickedOutsideNav = nav && !nav.contains(e.target);
    const clickedOutsidePanel = !panel || !panel.contains(e.target);
    if (!(clickedOutsideNav && clickedOutsidePanel)) return;

    const floatingTabs = new Set(["search", "upload", "messages", "activity"]);

    // ⚡ Sửa chỗ này:
    // Nếu đang ở trang chat mà tab hiện tại KHÔNG phải search thì bỏ qua
    if (isChatRoute && activeTab !== "search") return;

    if (activeTab === "search") {
      setActiveTab(null); // Đóng search khi click ngoài
      return;
    }
    if (floatingTabs.has(activeTab)) {
      setActiveTab(null);
      return;
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [activeTab, setActiveTab, isChatRoute]);



return (
  <div className="um-tn-root">
  <nav
  className={`um-tn-navbar ${
    activeTab === "search" || (location.pathname.startsWith("/chat") && activeTab !== "search")
      ? "collapsed"
      : ""
  }`}
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
          {activeTab === "search" || location.pathname.startsWith("/chat") ? (
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
          className={`um-tn-icon-btn ${activeTab === "messages" ? "active" : ""}`}
          onClick={handleChatClick}
        >
          <FiMessageSquare size={20} />
          <span>Messages</span>
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
<div className={`um-tn-panel-wrapper ${activeTab ? "open" : ""}`} aria-hidden={activeTab ? "false" : "true"}>
        {activeTab === "search" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <VideoSearchOverlay isOpen={activeTab === "search"} onClose={() => setActiveTab(null)} />
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

        {/* ❌ Không render khi đang ở /chat */}
        {activeTab === "messages" && !isChatRoute && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <h3>Tin nhắn</h3>
            <p>Danh sách tin nhắn</p>
          </div>
        )}

        {activeTab === "profile" && <div className="um-tn-tab-content" ref={panelRef}></div>}
        {activeTab === "forYou" && <div className="um-tn-tab-content" ref={panelRef}></div>}
        {activeTab === "explore" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <h3>Explore</h3>
          </div>
        )}
      </div>
    </div>
  );
}
