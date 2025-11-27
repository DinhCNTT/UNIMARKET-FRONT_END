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
import VideoSearchOverlay from "./VideoSearchOverlay";
import "./TopNavbarUniMarket.css";
import { useNavigate, useLocation } from "react-router-dom";
import { VideoContext } from "../context/VideoContext";
import MorePanel from "./MorePanel";

export default function TopNavbarUniMarket() {
  const navRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Lấy triggerReload từ Context để reset feed khi bấm Home
  const { activeTab, setActiveTab, triggerReload } = useContext(VideoContext);

  const [profile, setProfile] = useState(null);

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

  // ==========================================================
  // LOGIC GIỮ "FOR YOU" ACTIVE KHI Ở TRANG VIDEO
  // ==========================================================
  useEffect(() => {
    const path = location.pathname;
    const floatingTabs = new Set([
      ...PANEL_TABS,
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
  // ✅ TOGGLE TAB (QUAN TRỌNG: XỬ LÝ RELOAD FEED)
  // ==========================================================
  const toggleTab = (tab) => {
    // Nếu bấm lại vào tab đang mở (trừ For You) -> Đóng tab
    if (activeTab === tab && tab !== "forYou") {
      setActiveTab(null);
      return;
    }

    // Nếu bấm vào For You (Home)
    if (tab === "forYou") {
      setActiveTab("forYou");
      
      // 🔥 Gọi triggerReload để useVideoFeed reset lại danh sách video & page
      triggerReload(); 

      // Nếu đang ở trang khác (không phải xem video) thì điều hướng về trang video
      if (!location.pathname.startsWith("/video/")) {
        navigate("/video/1"); // Hoặc đường dẫn mặc định của bạn
      }
      return;
    }
    
    // Các tab khác
    setActiveTab(tab);
  };

  // ==========================================================
  // ✅ XỬ LÝ TAB MESSAGE KHI Ở TRANG CHAT (FIX LỖI MORE PANEL)
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
    setIsMini(true);
  };

  const isPanelOpen = PANEL_TABS.has(activeTab);

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
      if (isChatRoute && activeTab !== "search") return;
      
      if (PANEL_TABS.has(activeTab)) {
        setActiveTab(null); 
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
        className={`um-tn-navbar ${
          activeTab === "search" ||
          activeTab === "more" ||
          (location.pathname.startsWith("/chat") && activeTab !== "search")
            ? "collapsed"
            : ""
        }`}
        ref={navRef}
      >
        {/* LOGO */}
        <div
          className="um-tn-logo"
          onClick={() => {
            // Click Logo tương tự click For You
            setActiveTab("forYou");
            triggerReload();
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

        {/* SEARCH BUTTON */}
        <button
          className={`um-tn-icon-btn search-btn ${
            activeTab === "search" ? "active" : ""
          }`}
          onClick={() => toggleTab("search")}
        >
          <FiSearch size={20} />
          {activeTab !== "search" && activeTab !== "more" && <span>Search</span>}
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

        {/* MORE BUTTON */}
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

      {/* PANEL WRAPPER */}
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