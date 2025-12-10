// src/components/TopNavbarUniMarket.js
import React, { useRef, useEffect, useContext, useState } from "react";
import {
  FiSearch,
  FiBell,
  FiHome,
  FiCompass,
  FiUpload,
  FiMessageSquare,
  FiUser,
  FiMoreHorizontal,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import VideoSearchOverlay from "./VideoSearchOverlay";
import MorePanel from "./MorePanel";
import NotificationDropdown from "./NotificationDropdown";
import "./TopNavbarUniMarket.css";
import { GlobalNotificationContext } from "../context/GlobalNotificationContext";
import { VideoContext } from "../context/VideoContext";

export default function TopNavbarUniMarket() {
  const navRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Lấy triggerReload từ Context để reset feed khi bấm Home
  const { activeTab, setActiveTab, triggerReload } = useContext(VideoContext);

  const [profile, setProfile] = useState(null);
  const { unreadCount, fetchNotifications } = useContext(GlobalNotificationContext);

  // Logic kiểm tra route chat
  const isChatRoute = location.pathname.startsWith("/chat");
  
  // ✅ State isMini: Điều khiển việc thu nhỏ Navbar
  const [isMini, setIsMini] = useState(isChatRoute);

  // Khi đổi route, nếu vào /chat thì tự động thu nhỏ, ra ngoài thì mở rộng (trừ khi đang mở panel)
  useEffect(() => {
    const PANEL_TABS = ["search", "activity", "messages", "more"];
    if (PANEL_TABS.includes(activeTab)) {
        setIsMini(true); // Nếu đang mở panel thì luôn thu nhỏ
    } else {
        setIsMini(isChatRoute); // Nếu không mở panel, phụ thuộc vào route
    }
  }, [isChatRoute, activeTab]);

  const getAvatarSrc = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  const PANEL_TABS_SET = new Set(["search", "upload", "activity", "more"]);

  // ==========================================================
  // LOGIC GIỮ "FOR YOU" ACTIVE KHI Ở TRANG VIDEO
  // ==========================================================
  useEffect(() => {
    const path = location.pathname;
    const floatingTabs = new Set([
      ...PANEL_TABS_SET,
      "messages",
      "profile",
    ]);

    if (path.startsWith("/video/")) {
      // Nếu đang xem video và không mở tab nào khác -> Active For You
      if (!floatingTabs.has(activeTab) && activeTab !== "forYou") {
        setActiveTab("forYou");
      }
    } else {
      // Nếu rời khỏi trang video -> Bỏ active For You
      if (activeTab === "forYou") {
        setActiveTab(null);
      }
    }
  }, [location.pathname, activeTab, setActiveTab]);

  // ==========================================================
  // FETCH PROFILE
  // ==========================================================
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
      .then((r) => r.json())
      .then(setProfile)
      .catch(console.error);
  }, []);

  // ==========================================================
  // ✅ TOGGLE TAB (QUAN TRỌNG: LOGIC AUTO-COLLAPSE MỚI)
  // ==========================================================
  const toggleTab = (tab) => {
    // 1. Nếu bấm lại vào tab đang mở (đóng tab)
    if (activeTab === tab && tab !== "forYou") {
      setActiveTab(null);
      // Khi đóng panel, mở rộng lại Navbar (trừ khi đang ở trang Chat)
      setIsMini(location.pathname.startsWith("/chat"));
      return;
    }

    // 2. Nếu bấm vào For You (Home)
    if (tab === "forYou") {
      setActiveTab("forYou");
      triggerReload(); // Reset feed
      if (!location.pathname.startsWith("/video/")) {
        navigate("/video/1");
      }
      setIsMini(false); // Home luôn mở rộng navbar
      return;
    }

    // 3. Xử lý mở các Tab khác
    setActiveTab(tab);
    
    // ✅ LOGIC MỚI: Thu nhỏ Navbar khi mở Search, Activity, Messages, More
    const TABS_NEED_MINI = ["search", "activity", "messages", "more"];
    
    if (TABS_NEED_MINI.includes(tab)) {
        setIsMini(true); // Thu nhỏ ngay lập tức
    } else {
        // Nếu click vào tab khác (VD: Explore, Upload, Profile), giữ trạng thái theo route
        setIsMini(location.pathname.startsWith("/chat"));
    }

    // Nếu mở tab Activity -> Gọi fetch notification mới nhất
    if (tab === 'activity') {
      try { fetchNotifications(); } catch (e) { console.warn(e); }
    }
  };

  // ==========================================================
  // XỬ LÝ TAB MESSAGE KHI Ở TRANG CHAT
  // ==========================================================
  useEffect(() => {
    if (location.pathname.startsWith("/chat")) {
      // Chỉ set active 'messages' nếu không đang mở Search hoặc More
      if (
        activeTab !== "messages" &&
        activeTab !== "search" &&
        activeTab !== "more" 
      ) {
        setActiveTab("messages");
      }
    } else if (activeTab === "messages") {
      setActiveTab(null);
    }
  }, [location.pathname, activeTab, setActiveTab]);

  const handleChatClick = () => {
    navigate("/chat");
    setActiveTab("messages");
    setIsMini(true); // Vào chat là thu nhỏ
  };

  const isPanelOpen = PANEL_TABS_SET.has(activeTab);

  // ==========================================================
  // CLICK OUTSIDE TO CLOSE PANEL
  // ==========================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      const nav = navRef.current;
      const panel = panelRef.current;

      const clickedOutsideNav = nav && !nav.contains(e.target);
      const clickedOutsidePanel = !panel || !panel.contains(e.target);

      if (!(clickedOutsideNav && clickedOutsidePanel)) return;
      
      // Nếu ở trang chat và tab không phải search thì ko làm gì (Chat luôn active Messages)
      if (isChatRoute && activeTab !== "search") return;
      
      if (PANEL_TABS_SET.has(activeTab)) {
        setActiveTab(null);
        // Click ra ngoài -> Đóng panel -> Mở rộng navbar lại (nếu ko phải chat)
        setIsMini(location.pathname.startsWith("/chat"));
        return;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeTab, isChatRoute]);

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="um-tn-root">
      <nav
        className={`um-tn-navbar ${isMini ? "collapsed" : ""}`}
        ref={navRef}
      >
        {/* LOGO */}
        <div
          className="um-tn-logo"
          onClick={() => {
            setActiveTab("forYou");
            triggerReload();
            navigate("/market");
            setIsMini(false); // Click logo thì mở rộng navbar
          }}
          style={{ cursor: "pointer" }}
        >
          {isMini ? (
            <div className="um-tn-logo-u">U</div>
          ) : (
            <img src="/logoWeb.png" alt="Logo" className="um-tn-logo-img" />
          )}
        </div>

        {/* SEARCH BUTTON */}
        <button
          className={`um-tn-icon-btn search-btn ${
            activeTab === "search" ? "active" : ""
          }`}
          onClick={() => toggleTab("search")}
        >
          <FiSearch size={20} />
          {!isMini && <span>Search</span>}
        </button>

        {/* MAIN ICONS */}
        <div className="um-tn-icons">
          <button
            className={`um-tn-icon-btn ${
              activeTab === "forYou" ? "active" : ""
            }`}
            onClick={() => toggleTab("forYou")}
          >
            <FiHome size={20} />
            {!isMini && <span>For You</span>}
          </button>

          <button
            className={`um-tn-icon-btn ${
              activeTab === "explore" ? "active" : ""
            }`}
            onClick={() => toggleTab("explore")}
          >
            <FiCompass size={20} />
            {!isMini && <span>Explore</span>}
          </button>

          <button
            className={`um-tn-icon-btn ${
              activeTab === "upload" ? "active" : ""
            }`}
            onClick={() => toggleTab("upload")}
          >
            <FiUpload size={20} />
            {!isMini && <span>Upload</span>}
          </button>

          {/* ACTIVITY (NOTIFICATION) */}
          <button
            className={`um-tn-icon-btn ${
              activeTab === "activity" ? "active" : ""
            }`}
            onClick={() => toggleTab("activity")}
          >
            {/* Bọc icon và badge vào wrapper */}
            <div className="um-tn-icon-wrapper">
              <FiBell size={24} /> {/* Tăng size lên 24 cho đẹp */}
              
              {unreadCount > 0 && (
                <span className="um-tn-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            {!isMini && <span>Activity</span>}
          </button>

          {/* MESSAGES */}
          <button
            className={`um-tn-icon-btn ${
              activeTab === "messages" ? "active" : ""
            }`}
            onClick={handleChatClick}
          >
            <FiMessageSquare size={20} />
            {!isMini && <span>Messages</span>}
          </button>

          {/* PROFILE */}
          <button
            className={`um-tn-icon-btn ${
              activeTab === "profile" ? "active" : ""
            }`}
            onClick={() => {
              if (profile?.id) {
                setActiveTab("profile");
                navigate(`/nguoi-dung/${profile.id}`);
              }
            }}
          >
            {profile?.avatarUrl ? (
              <img
                src={getAvatarSrc(profile.avatarUrl)}
                alt="avatar"
                className="um-tn-avatar"
              />
            ) : (
              <FiUser size={20} />
            )}
            {!isMini && <span>Profile</span>}
          </button>
        </div>

        {/* MORE BUTTON */}
        <div className="um-tn-more-section">
          <button
            className={`um-tn-icon-btn um-tn-more-btn ${
              activeTab === "more" ? "active" : ""
            }`}
            onClick={() => toggleTab("more")}
          >
            <FiMoreHorizontal size={20} />
            {!isMini && <span>Thêm</span>}
          </button>
        </div>
      </nav>

      {/* PANEL WRAPPER */}
      <div
        className={`um-tn-panel-wrapper ${isPanelOpen ? "open" : ""}`}
        aria-hidden={isPanelOpen ? "false" : "true"}
      >
        {activeTab === "search" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <VideoSearchOverlay
              isOpen={activeTab === "search"}
              onClose={() => {
                  setActiveTab(null);
                  setIsMini(location.pathname.startsWith("/chat"));
              }}
            />
          </div>
        )}

        {/* ✅ Hiển thị Component NotificationDropdown mới */}
        {activeTab === "activity" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <NotificationDropdown />
          </div>
        )}

        {activeTab === "upload" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <h3>Upload Video</h3>
            <p>Form upload sẽ ở đây</p>
          </div>
        )}

        {activeTab === "messages" && !isChatRoute && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <h3>Tin nhắn</h3>
            <p>Danh sách tin nhắn</p>
          </div>
        )}

        {activeTab === "more" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <MorePanel onClose={() => {
                setActiveTab(null);
                setIsMini(location.pathname.startsWith("/chat"));
            }} />
          </div>
        )}
      </div>
    </div>
  );
}