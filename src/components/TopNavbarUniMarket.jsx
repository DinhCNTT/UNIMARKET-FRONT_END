import React, { useRef, useEffect, useContext } from "react";
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
import { useNavigate } from "react-router-dom"; 
import { VideoContext } from "../context/VideoContext";

export default function TopNavbarUniMarket() {
  const navRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const { activeTab, setActiveTab, triggerReload } = useContext(VideoContext);

// ✅ toggle tab
const toggleTab = (tab) => {
  if (tab === "forYou") {
    setActiveTab("forYou");
    triggerReload(); // ✅ có loading hiệu ứng
  } else if (tab === "search") {
    setActiveTab("search");
  } else {
    setActiveTab(tab);
  }
};


// ✅ Click outside để đóng panel
useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      navRef.current &&
      !navRef.current.contains(e.target) &&
      panelRef.current &&
      !panelRef.current.contains(e.target)
    ) {
      if (activeTab === "search") {
        // 👉 nếu đang search mà click ngoài thì quay về forYou
        setActiveTab("forYou");
      } else if (activeTab !== "forYou") {
        // 👉 nếu là tab khác (upload, message, user...) thì đóng hẳn
        setActiveTab(null);
      }
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () =>
    document.removeEventListener("mousedown", handleClickOutside);
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
            className={`um-tn-icon-btn ${
              activeTab === "profile" ? "active" : ""
            }`}
            onClick={() => toggleTab("profile")}
          >
            <FiUser size={20} />
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
            <h3>Thông tin cá nhân</h3>
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
