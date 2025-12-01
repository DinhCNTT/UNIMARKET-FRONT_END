import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "./VideoLikedPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import EditProfileModal from "../components/EditProfileModal";
import { useNavigate, useLocation } from "react-router-dom";
import { faBookmark as solidBookmark } from "@fortawesome/free-solid-svg-icons";
import { VideoHubContext } from "../context/VideoHubContext";

const VideoLikedPage = () => {
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("liked");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { videoConnection } = useContext(VideoHubContext);

  // Lấy thông tin user
  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:5133/api/Auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setUser(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy thông tin người dùng:", err);
    }
  };

  // Lấy danh sách video theo tab
  const fetchVideos = async (tab) => {
    try {
      const endpoint =
        tab === "liked"
          ? "http://localhost:5133/api/Video/liked"
          : "http://localhost:5133/api/Video/saved";

      const res = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      let data = res.data;

      // Nếu là tab saved thì tự tạo thumbnailUrl từ videoUrl
      if (tab === "saved") {
        data = data.map((v) => ({
          ...v,
          thumbnailUrl: v.videoUrl
            ? v.videoUrl.replace("/upload/", "/upload/so_1/").replace(".mp4", ".jpg")
            : null,
        }));
      }

      setVideos(data);
    } catch (err) {
      console.error("Lỗi khi lấy video:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchVideos(activeTab);
  }, [activeTab]);

  // ✅ Refetch khi quay lại từ video detail page
  useEffect(() => {
    fetchVideos(activeTab);
  }, [location.pathname]);

  // ✅ Lắng nghe SignalR updates cho like/save realtime
  useEffect(() => {
    if (!videoConnection || videoConnection.state !== "Connected") return;

    const handleUpdateLike = (tinDangId, count, likedByCurrentUser) => {
      setVideos((prev) =>
        prev.map((v) =>
          v.maTinDang === tinDangId
            ? { ...v, soTym: count, isLiked: likedByCurrentUser }
            : v
        )
      );
    };

    const handleUpdateSave = (tinDangId, count, savedByCurrentUser) => {
      setVideos((prev) =>
        prev.map((v) =>
          v.maTinDang === tinDangId
            ? { ...v, soNguoiLuu: count, isSaved: savedByCurrentUser }
            : v
        )
      );
    };

    videoConnection.on("UpdateLikeCount", handleUpdateLike);
    videoConnection.on("UpdateSaveCount", handleUpdateSave);

    return () => {
      videoConnection.off("UpdateLikeCount", handleUpdateLike);
      videoConnection.off("UpdateSaveCount", handleUpdateSave);
    };
  }, [videoConnection, activeTab]);

  return (
    <div className="vlp-page">
      {/* HEADER */}
      <header className="vlp-header">
        <div
          className="vlp-header-left"
          onClick={() => (window.location.href = "/")}
        >
          <div className="vlp-logo-section">
            <img src="/logoWeb.png" alt="UniMarket Logo" className="vlp-logo-img" />
            <span className="vlp-brand-name">UniMarket</span>
          </div>
          <div className="vlp-liked-section">
            <div className="vlp-heart-circle">
              <FontAwesomeIcon icon={solidHeart} className="vlp-heart-icon" />
            </div>
            <span className="vlp-liked-text">Đã tym</span>
          </div>
        </div>
      </header>

      {/* PROFILE */}
      {user && (
        <div className="vlp-profile-card">
          <img src={user.avatarUrl} alt="avatar" className="vlp-avatar" />
          <h2>{user.userName}</h2>
          <p>{user.fullName}</p>
          <button className="vlp-edit-btn" onClick={() => setShowModal(true)}>
            Chỉnh sửa
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="vlp-tabs">
        <button
          className={activeTab === "liked" ? "vlp-tab active" : "vlp-tab"}
          onClick={() => setActiveTab("liked")}
        >
          <FontAwesomeIcon
            icon={solidHeart}
            style={{ marginRight: "6px", color: "#ff2e63" }}
          />
          Đã tym
        </button>
        <button
          className={activeTab === "saved" ? "vlp-tab active" : "vlp-tab"}
          onClick={() => setActiveTab("saved")}
        >
          <FontAwesomeIcon
            icon={solidBookmark}
            style={{ marginRight: "6px", color: "#FFD700" }}
          />
          Video đã lưu
        </button>
      </div>

      {/* VIDEO GRID */}
      <div className="vlp-video-grid">
        {videos.length === 0 ? (
          <p className="vlp-empty-text">
            {activeTab === "liked"
              ? "Chưa có video nào đã tym."
              : "Chưa có video nào đã lưu."}
          </p>
        ) : (
          videos.map((video, index) => (
            <div
              key={video.maTinDang}
              className="vlp-video-card"
              onClick={() =>
                navigate(`/liked-videos/${video.maTinDang}`, {
                  state: {
                    videos,
                    initialIndex: index,
                    tabType: activeTab, // gửi kèm loại tab
                  },
                })
              }
            >
              <video
                src={video.videoUrl}
                muted
                loop
                className="vlp-video-thumb"
                onMouseOver={(e) => e.target.play()}
                onMouseOut={(e) => e.target.pause()}
              />
              <div className="vlp-video-stats">
                <FontAwesomeIcon
                  icon={activeTab === "liked" ? solidHeart : solidBookmark}
                  style={{
                    color: activeTab === "liked" ? "#ff2e63" : "#FFD700",
                    marginRight: "6px",
                  }}
                />
                {activeTab === "liked" ? video.soTym : video.soNguoiLuu}
              </div>
            </div>
          ))
        )}
      </div>

      {/* HOME BUTTON */}
      <button
        className="vlp-home-floating"
        onClick={() => (window.location.href = "/")}
      >
        <FontAwesomeIcon icon={faHome} />
      </button>

      {/* MODAL */}
      {showModal && (
        <EditProfileModal
          onClose={() => setShowModal(false)}
          onUpdateSuccess={() => {
            fetchUser();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default VideoLikedPage;