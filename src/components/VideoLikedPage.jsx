import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VideoLikedPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons"; // full màu
import { faHeart as regularHeart } from "@fortawesome/free-regular-svg-icons"; // viền

const VideoLikedPage = () => {
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const videoRes = await axios.get("http://localhost:5133/api/Video/liked", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setVideos(videoRes.data);

        const userRes = await axios.get("http://localhost:5133/api/Auth/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUser(userRes.data);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="profile-container">
      {user && (
        <div className="profile-header">
          <img src={user.avatarUrl} alt="avatar" className="profile-avatar" />
          <div className="profile-info">
            <h2>{user.userName}</h2>
            <p>{user.fullName}</p>
            <button className="edit-button">Edit profile</button>
          </div>
        </div>
      )}

      <div className="tab-header">
        <span className="tab active">
          <FontAwesomeIcon icon={solidHeart} style={{ color: "#ff2e63" }} /> Liked
        </span>
      </div>

      <div className="video-grid">
        {videos.length === 0 ? (
          <p>Chưa có video nào đã tym.</p>
        ) : (
          videos.map((video) => (
            <div key={video.maTinDang} className="video-card">
              <video
                src={video.videoUrl}
                muted
                loop
                className="video-thumb"
                onMouseOver={(e) => e.target.play()}
                onMouseOut={(e) => e.target.pause()}
              />
              <div className="video-stats">
                <FontAwesomeIcon icon={solidHeart} style={{ color: "#ff2e63", marginRight: "6px" }} />
                <span>{video.soTym}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VideoLikedPage;
