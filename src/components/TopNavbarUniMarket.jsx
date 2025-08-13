import React, { useState, useRef, useEffect } from "react";
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

export default function TopNavbarUniMarket() {
  const [activeTab, setActiveTab] = useState(null);
  const navRef = useRef(null);
  const panelRef = useRef(null);

  const toggleTab = (tab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        navRef.current &&
        !navRef.current.contains(e.target) &&
        panelRef.current &&
        !panelRef.current.contains(e.target)
      ) {
        setActiveTab(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setActiveTab(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="um-tn-root">
      <nav
        className={`um-tn-navbar ${activeTab === "search" ? "collapsed" : ""}`}
        ref={navRef}
      >
        {/* Logo */}
        <div className="um-tn-logo" onClick={() => setActiveTab(null)}>
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

        {/* Các icon còn lại */}
        <div className="um-tn-icons">
          <button
            className={`um-tn-icon-btn ${
              activeTab === "forYou" ? "active" : ""
            }`}
            onClick={() => toggleTab("forYou")}
          >
            <FiHome size={20} />
            {activeTab !== "search" && <span>For You</span>}
          </button>

          <button
            className={`um-tn-icon-btn ${
              activeTab === "explore" ? "active" : ""
            }`}
            onClick={() => toggleTab("explore")}
          >
            <FiCompass size={20} />
            {activeTab !== "search" && <span>Explore</span>}
          </button>

          <button
            className={`um-tn-icon-btn ${
              activeTab === "upload" ? "active" : ""
            }`}
            onClick={() => toggleTab("upload")}
          >
            <FiUpload size={20} />
            {activeTab !== "search" && <span>Upload</span>}
          </button>

          <button
            className={`um-tn-icon-btn ${
              activeTab === "activity" ? "active" : ""
            }`}
            onClick={() => toggleTab("activity")}
          >
            <FiBell size={20} />
            {activeTab !== "search" && <span>Activity</span>}
          </button>

          <button
            className={`um-tn-icon-btn ${
              activeTab === "messages" ? "active" : ""
            }`}
            onClick={() => toggleTab("messages")}
          >
            <FiMessageSquare size={20} />
            {activeTab !== "search" && <span>Messages</span>}
          </button>

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
            <h3>For You</h3>
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