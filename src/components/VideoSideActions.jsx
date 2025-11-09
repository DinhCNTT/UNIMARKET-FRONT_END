// src/components/VideoSideActions.jsx
import React from 'react';
import {
  IoHeart, IoHeartOutline, IoBookmark, IoBookmarkOutline,
  IoAddCircleOutline, IoCheckmarkCircleOutline
} from "react-icons/io5";
import { FaRegCommentDots, FaInfoCircle, FaShareAlt } from "react-icons/fa";
import defaultAvatar from "../assets/default-avatar.png"; // Đảm bảo đường dẫn này chính xác
import { useNavigate } from 'react-router-dom';
import "./VideoSideActions.css";
const VideoSideActions = ({
  video,
  user,
  token,
  isFollowing,
  formatCount,
  onFollow,
  onLike,
  onSave,
  onComment,
  onShare,
  onShowDetail
}) => {
  const navigate = useNavigate();

  return (
    <div className="vdv-side-info">
      {/* Avatar + Follow */}
      <div className="vdv-user-avatar-container">
        <img
          src={video.nguoiDang?.avatarUrl || defaultAvatar}
          alt="avatar"
          className="vdv-user-avatar"
          onClick={() => navigate(`/nguoi-dung/${video.nguoiDang?.id}`)}
          style={{ cursor: "pointer" }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultAvatar;
          }}
        />
        {video.nguoiDang?.id && (
          <div
            className="vdv-follow-button"
            onClick={onFollow}
            title={isFollowing ? "Bỏ theo dõi" : "Theo dõi"}
          >
            {isFollowing ? (
              <IoCheckmarkCircleOutline size={24} />
            ) : (
              <IoAddCircleOutline size={24} />
            )}
          </div>
        )}
      </div>

      {/* ❤️ Like */}
      <div
        className={`vdv-icon-button vdv-like-button ${video.isLiked ? "liked" : ""}`}
        onClick={onLike}
        title={!token ? "Bạn cần đăng nhập để tym" : video.isLiked ? "Đã tym" : "Nhấn để tym"}
      >
        {video.isLiked ? (
          <IoHeart size={28} color="#ff4d6d" />
        ) : (
          <IoHeartOutline size={28} color="#ccc" />
        )}
      </div>
      <div className="vdv-icon-label">
        {formatCount(video.soTym || 0)}
      </div>

      {/* 🔖 Save */}
      <div
        className="vdv-icon-wrapper"
        onClick={onSave}
        title={!user ? "Bạn cần đăng nhập để lưu" : video.isSaved ? "Đã lưu" : "Lưu video"}
        style={{ marginTop: "8px" }}
      >
        <div className="vdv-icon-button vdv-save-button">
          {video.isSaved ? (
            <IoBookmark size={24} color="gold" />
          ) : (
            <IoBookmarkOutline size={24} color="gray" />
          )}
        </div>
        <div className="vdv-icon-label" style={{ marginTop: "10px" }}>
          {formatCount(video.soNguoiLuu || 0)}
        </div>
      </div>

      {/* 💬 Comment */}
      <div className="vdv-icon-button" onClick={onComment}>
        <FaRegCommentDots size={24} color="#ccc" />
      </div>
      <div className="vdv-icon-label">
        {video.soBinhLuan || 0}
      </div>

      {/* 📤 Share */}
      <div
        className="vdv-icon-button vdv-share-button"
        onClick={onShare}
        title="Chia sẻ tin đăng"
        style={{ marginTop: "16px" }}
      >
        <FaShareAlt size={24} color="#fff" />
      </div>
      <div className="vdv-icon-label">
        {formatCount(video.soLuotChiaSe || 0)}
      </div>

      {/* ℹ️ Detail */}
      <div
        className="vdv-icon-button vdv-detail-button"
        onClick={onShowDetail}
        title="Xem chi tiết tin đăng"
        style={{ marginTop: "16px" }}
      >
        <FaInfoCircle size={24} color="#ccc" />
      </div>
    </div>
  );
};

export default VideoSideActions;