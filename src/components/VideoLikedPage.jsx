import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VideoLikedPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import EditProfileModal from "../components/EditProfileModal"; // ✅ Đảm bảo path đúng với thư mục của bạn

const VideoLikedPage = () => {
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("liked");
  const [showModal, setShowModal] = useState(false); // ✅ Thêm state để điều khiển modal
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

  // ✅ useEffect chính để fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const videoRes = await axios.get("http://localhost:5133/api/Video/liked", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setVideos(videoRes.data);
        await fetchUser();
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
      }
    };

    fetchData();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const videoRes = await axios.get(
          "http://localhost:5133/api/Video/liked",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setVideos(videoRes.data);

        const userRes = await axios.get(
          "http://localhost:5133/api/Auth/me",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setUser(userRes.data);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
      }
    };
    fetchData();
  }, []);

   return (
  <div className="vlp-page">
    {/* HEADER */}
    <header className="vlp-header">
      <div className="vlp-header-left">
        <div className="vlp-logo-section" onClick={() => (window.location.href = "/")}>
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
        Đã tym
      </button>
      <button
        className={activeTab === "saved" ? "vlp-tab active" : "vlp-tab"}
        onClick={() => setActiveTab("saved")}
      >
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
        videos.map((video) => (
          <div key={video.maTinDang} className="vlp-video-card">
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
                icon={solidHeart}
                style={{ color: "#ff2e63", marginRight: "6px" }}
              />
              <span>{video.soTym}</span>
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
          fetchUser(); // ✅ Cập nhật lại user (avatar mới)
          setShowModal(false);
        }}
      />
    )}
  </div>
);

};

export default VideoLikedPage;