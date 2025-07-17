import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import "./VideoSearchPage.css";
import TopNavbar from "../components/TopNavbar";
import VideoSearchOverlay from "../components/VideoSearchOverlay";
import defaultAvatar from "../assets/default-avatar.png"; // ✅ Fallback ảnh

export default function VideoSearchPage() {
  const { keyword } = useParams();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("top");

  const videoRefs = useRef({});
  const timeoutRefs = useRef({});
  const underlineRef = useRef();
  const menuRef = useRef();
  const userListRef = useRef(null);

  useEffect(() => {
    if (userListRef.current) {
      userListRef.current.scrollTop = userListRef.current.scrollHeight;
    }
  }, [users]);

  const handleMenuHover = (e) => {
    if (!underlineRef.current || !menuRef.current) return;
    const rect = e.target.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    underlineRef.current.style.left = `${rect.left - menuRect.left}px`;
    underlineRef.current.style.width = `${rect.width}px`;
  };

  const resetUnderline = () => {
    if (underlineRef.current) {
      const activeItem = menuRef.current.querySelector(".vsp-menu-item.active");
      if (activeItem) {
        const rect = activeItem.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        underlineRef.current.style.left = `${rect.left - menuRect.left}px`;
        underlineRef.current.style.width = `${rect.width}px`;
      } else {
        underlineRef.current.style.width = "0";
      }
    }
  };

  useEffect(() => {
    resetUnderline();
  }, [activeTab]);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:5133/api/Video/search?keyword=${encodeURIComponent(keyword)}`
      );
      if (!res.ok) throw new Error("Lỗi server hoặc không tìm thấy kết quả.");
      const data = await res.json();
      setVideos(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError("Đã xảy ra lỗi khi tìm kiếm video.");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:5133/api/Video/search-users-sorted?keyword=${encodeURIComponent(keyword)}`
      );
      if (!res.ok) throw new Error("Lỗi server hoặc không tìm thấy kết quả.");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError("Đã xảy ra lỗi khi tìm kiếm user.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      navigate(`?tab=${tab}`);
    } else {
      if (tab === "top") fetchVideos();
      if (tab === "user") fetchUsers();
    }
  };

  useEffect(() => {
    if (activeTab === "top") {
      fetchVideos();
    } else {
      fetchUsers();
    }
  }, [keyword, activeTab]);

  const handleMouseEnter = (id) => {
    const video = videoRefs.current[id];
    if (video && video.play) {
      video.currentTime = 0;
      video.play().catch(() => {});
      timeoutRefs.current[id] = setTimeout(() => {
        if (video.pause) video.pause();
      }, 3000);
    }
  };

  const handleMouseLeave = (id) => {
    const video = videoRefs.current[id];
    if (video && video.pause) video.pause();
    if (timeoutRefs.current[id]) clearTimeout(timeoutRefs.current[id]);
  };

  return (
    <div className="vsp-wrapper">
      <TopNavbar />
      <VideoSearchOverlay />

      {/* Menu tab */}
      <div className="vsp-menu" ref={menuRef} onMouseLeave={resetUnderline}>
        <div
          className={`vsp-menu-item ${activeTab === "top" ? "active" : ""}`}
          onMouseEnter={handleMenuHover}
          onClick={() => handleTabChange("top")}
        >
          Top
        </div>
        <div
          className={`vsp-menu-item ${activeTab === "user" ? "active" : ""}`}
          onMouseEnter={handleMenuHover}
          onClick={() => handleTabChange("user")}
        >
          User
        </div>
        <div className="vsp-menu-underline" ref={underlineRef}></div>
      </div>

      {/* Nội dung */}
      {loading ? (
        <p>Đang tải kết quả...</p>
      ) : error ? (
        <p className="vsp-error">{error}</p>
      ) : activeTab === "top" ? (
        videos.length === 0 ? (
          <p>Không tìm thấy video nào phù hợp.</p>
        ) : (
          <div className="vsp-grid">
            {videos.map((video) => (
              <div
                key={video.maTinDang}
                className="vsp-card"
                onClick={() =>
                  navigate(`/video-search-detail/${video.maTinDang}`, {
                    state: {
                      videoList: videos,
                      initialIndex: videos.findIndex((v) => v.maTinDang === video.maTinDang),
                    },
                  })
                }
              >
                <div
                  className="vsp-thumbnail"
                  onMouseEnter={() => handleMouseEnter(video.maTinDang)}
                  onMouseLeave={() => handleMouseLeave(video.maTinDang)}
                >
                  <video
                    ref={(el) => (videoRefs.current[video.maTinDang] = el)}
                    src={video.videoUrl}
                    muted
                    preload="metadata"
                    controls={false}
                    playsInline
                  />
                  <FaHeart className="vsp-heart" />
                  <div className="vsp-likes">{video.soTym || 0}</div>
                </div>

                <div className="vsp-info">
                  <img
                    src={video.nguoiDang?.avatarUrl?.trim() ? video.nguoiDang.avatarUrl : defaultAvatar}
                    alt={video.nguoiDang?.fullName || "Người dùng"}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/nguoi-dung/${video.nguoiDang?.id}`);
                    }}
                  />
                  <div className="vsp-texts">
                    <h4 className="vsp-title-text" title={video.tieuDe}>
                      {video.tieuDe}
                    </h4>
                    <p className="vsp-user" title={video.nguoiDang?.fullName}>
                      {video.nguoiDang?.fullName}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : users.length === 0 ? (
        <p>Không tìm thấy người dùng phù hợp.</p>
      ) : (
        <div
          className="vsp-user-list"
          ref={userListRef}
          style={{ maxHeight: "600px", overflowY: "auto" }}
        >
          {users.map((user) => (
            <div
              key={user.id}
              className="vsp-user-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
                cursor: "pointer",
              }}
              onClick={() => navigate(`/nguoi-dung/${user.id}`)}
            >
              <img
                src={user.avatarUrl?.trim() ? user.avatarUrl : defaultAvatar}
                alt={user.fullName}
                className="vsp-user-avatar"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
              <p
                className="vsp-user-name"
                style={{
                  fontWeight: "700",
                  fontSize: "16px",
                  margin: 0,
                  whiteSpace: "nowrap",
                }}
                title={user.fullName}
              >
                {user.fullName}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
