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
import VideoSearchOverlay from "./VideoSearchOverlay";
import "./TopNavbarUniMarket.css";
import { NotificationContext } from "./NotificationsModals/context/NotificationContext";
import NotificationsDropdown from "./NotificationsModals/NotificationsDropdown";
import { useNavigate, useLocation } from "react-router-dom";
import { VideoContext } from "../context/VideoContext";
import MorePanel from "./MorePanel";

export default function TopNavbarUniMarket() {
  const navRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, setActiveTab, triggerReload } = useContext(VideoContext);

  const [profile, setProfile] = useState(null);
  const { unreadCount, fetchNotifications } = useContext(NotificationContext);

  const isChatRoute = location.pathname.startsWith("/chat");
  const [isMini, setIsMini] = useState(isChatRoute);

  useEffect(() => {
    setIsMini(isChatRoute);
  }, [isChatRoute]);

  const getAvatarSrc = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  const PANEL_TABS = new Set(["search", "upload", "activity", "more"]);

  // Logic giữ "For You" active (Giữ nguyên)
  useEffect(() => {
    const path = location.pathname;
    const floatingTabs = new Set([
      ...PANEL_TABS,
      "messages",
      "profile",
    ]);

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

  // Fetch profile (Giữ nguyên)
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

  // toggleTab (Giữ nguyên)
  const toggleTab = (tab) => {
    if (activeTab === tab && tab !== "forYou") {
      setActiveTab(null);
      return;
    }
    if (tab === "forYou") {
      setActiveTab("forYou");
      triggerReload();
      if (!location.pathname.startsWith("/video/")) {
        navigate("/video/1");
      }
      return;
    }
    setActiveTab(tab);
    if (tab === 'activity') {
      // fetch latest notifications when opening the panel
      try { fetchNotifications(); } catch (e) { console.warn('fetchNotifications error', e); }
    }
  };

  // ==========================================================
  // ✅ SỬA LỖI CHÍNH NẰM Ở ĐÂY
  // ==========================================================
  useEffect(() => {
    if (location.pathname.startsWith("/chat")) {
      // Chúng ta thêm "activeTab !== 'more'" vào điều kiện
      // để báo cho hook này "đừng làm gì cả nếu 'more' đang mở"
      if (
        activeTab !== "messages" &&
        activeTab !== "search" &&
        activeTab !== "more" // <-- DÒNG SỬA LỖI
      ) {
        setActiveTab("messages");
      }
    } else if (activeTab === "messages") {
      setActiveTab(null);
    }
  }, [location.pathname, activeTab, setActiveTab]);
  // ==========================================================

  const handleChatClick = () => {
    navigate("/chat");
    setActiveTab("messages");
    setIsMini(true);
  };

  const isPanelOpen = PANEL_TABS.has(activeTab);

  // Click Outside (Giữ nguyên)
  useEffect(() => {
    const handleClickOutside = (e) => {
      const nav = navRef.current;
      const panel = panelRef.current;

      const clickedOutsideNav = nav && !nav.contains(e.target);
      const clickedOutsidePanel = !panel || !panel.contains(e.target);

      if (!(clickedOutsideNav && clickedOutsidePanel)) return;
      if (isChatRoute && activeTab !== "search") return;
      if (PANEL_TABS.has(activeTab)) {
        setActiveTab(null); // Khi đóng 'more', useEffect trên sẽ tự động set về 'messages'
        return;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeTab, isChatRoute]); // Đã bỏ PANEL_TABS khỏi dependency vì nó là const

  return (
    <div className="um-tn-root">
      <nav
        className={`um-tn-navbar ${
          activeTab === "search" ||
          activeTab === "more" ||
          (location.pathname.startsWith("/chat") && activeTab !== "search")
            ? "collapsed"
            : ""
        }`}
        ref={navRef}
      >
        <div
          className="um-tn-logo"
          onClick={() => {
            setActiveTab("forYou");
            navigate("/market");
          }}
          style={{ cursor: "pointer" }}
        >
          {activeTab === "search" ||
          activeTab === "more" ||
          location.pathname.startsWith("/chat") ? (
            <div className="um-tn-logo-u">U</div>
          ) : (
            <img src="/logoWeb.png" alt="Logo" className="um-tn-logo-img" />
          )}
        </div>

        <button
          className={`um-tn-icon-btn search-btn ${
            activeTab === "search" ? "active" : ""
          }`}
          onClick={() => toggleTab("search")}
        >
          <FiSearch size={20} />
          {activeTab !== "search" && activeTab !== "more" && <span>Search</span>}
        </button>

        <div className="um-tn-icons">
          <button
            className={`um-tn-icon-btn ${
              activeTab === "forYou" ? "active" : ""
            }`}
            onClick={() => toggleTab("forYou")}
          >
            <FiHome size={20} />
            {activeTab !== "search" && activeTab !== "more" && (
              <span>For You</span>
            )}
          </button>

          <button
            className={`um-tn-icon-btn ${
              activeTab === "explore" ? "active" : ""
            }`}
            onClick={() => toggleTab("explore")}
          >
            <FiCompass size={20} />
            {activeTab !== "search" && activeTab !== "more" && (
              <span>Explore</span>
            )}
          </button>

          <button
            className={`um-tn-icon-btn ${
              activeTab === "upload" ? "active" : ""
            }`}
            onClick={() => toggleTab("upload")}
          >
            <FiUpload size={20} />
            {activeTab !== "search" && activeTab !== "more" && (
              <span>Upload</span>
            )}
          </button>

          <button
            className={`um-tn-icon-btn ${
              activeTab === "activity" ? "active" : ""
            }`}
            onClick={() => toggleTab("activity")}
          >
            <FiBell size={20} />
            {unreadCount > 0 && <span className="um-tn-badge">{unreadCount}</span>}
            {activeTab !== "search" && activeTab !== "more" && (
              <span>Activity</span>
            )}
          </button>

          <button
            className={`um-tn-icon-btn ${
              activeTab === "messages" ? "active" : ""
            }`}
            onClick={handleChatClick}
          >
            <FiMessageSquare size={20} />
            {activeTab !== "search" && activeTab !== "more" && (
              <span>Messages</span>
            )}
          </button>

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
            {activeTab !== "search" && activeTab !== "more" && (
              <span>Profile</span>
            )}
          </button>
        </div>

        <div className="um-tn-more-section">
          <button
            className={`um-tn-icon-btn um-tn-more-btn ${
              activeTab === "more" ? "active" : ""
            }`}
            onClick={() => toggleTab("more")}
          >
            <FiMoreHorizontal size={20} />
            {activeTab !== "more" && <span>Thêm</span>}
          </button>
        </div>
      </nav>

      {/* PANEL WRAPPER (Giữ nguyên) */}
      <div
        className={`um-tn-panel-wrapper ${isPanelOpen ? "open" : ""}`}
        aria-hidden={isPanelOpen ? "false" : "true"}
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
            <NotificationsDropdown />
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
            <MorePanel onClose={() => setActiveTab(null)} />
          </div>
        )}
      </div>
    </div>
  );
}