// src/components/VideoDetails/VideoInfo.jsx
import React, { useState } from "react";

export default function VideoInfo({ video }) {
  const [expanded, setExpanded] = useState(false);

  // ✅ Thêm fallback (phòng trường hợp video bị null)
  if (!video) {
    return <div className="lvv-user-info-wrapper">Đang tải...</div>;
  }

  return (
    <div className="lvv-user-info-wrapper">
      <div className="lvv-user-info">
        <img
          // ✅ SỬA: Thêm ?. và ảnh fallback
          src={video?.nguoiDang?.avatarUrl || "/default-avatar.png"}
          alt="avatar"
          className="lvv-avatar"
        />
        <div className="lvv-user-details">
          {/* ✅ SỬA: Thêm ?. */}
          <strong className="lvv-user-name">
            {video?.nguoiDang?.fullName || "Người dùng"}
          </strong>
          <div className="lvv-location">
            {/* ✅ SỬA: Thêm ?. */}
            {video?.diaChi}, {video?.quanHuyen}, {video?.tinhThanh}
          </div>
        </div>
      </div>

      <div className="lvv-video-info">
        {/* ✅ SỬA: Thêm ?. */}
        <h2 className="lvv-title">{video?.tieuDe}</h2>
        <p className={`lvv-description ${expanded ? "expanded" : ""}`}>
          {/* ✅ SỬA: Thêm ?. */}
          {video?.moTa}
        </p>
        {/* ✅ SỬA: Thêm ?. */}
        {video?.moTa?.length > 120 && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="lvv-read-more"
          >
            {expanded ? "Thu gọn" : "Xem thêm"}
          </button>
        )}
      </div>
    </div>
  );
}