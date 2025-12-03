// src/components/VideoDetails/VideoInfo.jsx
import React, { useState } from "react";
import "../../pages/LikedVideoDetailViewer/LikedVideoDetailViewer.module.css";

export default function VideoInfo({ video, onExpandedChange }) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandToggle = () => {
    setExpanded((prev) => {
      const newState = !prev;
      if (onExpandedChange) {
        onExpandedChange(newState);
      }
      return newState;
    });
  };
  // ✅ Thêm fallback (phòng trường hợp video bị null)
  if (!video) {
    return <div className="user-info-wrapper">Đang tải...</div>;
  }

  return (
    <div className="user-info-wrapper">
      <div className="user-info">
        <img
          // ✅ SỬA: Thêm ?. và ảnh fallback
          src={video?.nguoiDang?.avatarUrl || "/default-avatar.png"}
          alt="avatar"
          className="avatar"
        />
        <div className="user-details">
          {/* ✅ SỬA: Thêm ?. */}
          <strong className="user-name">
            {video?.nguoiDang?.fullName || "Người dùng"}
          </strong>
          <div className="location">
            {/* ✅ SỬA: Thêm ?. */}
            {video?.diaChi}, {video?.quanHuyen}, {video?.tinhThanh}
          </div>
        </div>
      </div>

      <div className="video-info">
        {/* ✅ SỬA: Thêm ?. */}
        <h2 className="title">{video?.tieuDe}</h2>
        <p className={`description ${expanded ? "expanded" : ""}`}>
          {/* ✅ SỬA: Thêm ?. */}
          {video?.moTa}
        </p>
        {/* ✅ SỬA: Thêm ?. */}
        {video?.moTa?.length > 120 && (
          <button
            onClick={handleExpandToggle}
            className="read-more"
          >
            {expanded ? "Thu gọn" : "Xem thêm"}
          </button>
        )}
      </div>
    </div>
  );
}