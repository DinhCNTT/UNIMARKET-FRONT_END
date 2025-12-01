// src/components/VideoDetails/VideoActions.jsx
import React from "react";
import "../../pages/LikedVideoDetailViewer/LikedVideoDetailViewer.module.css";
// ✅ Import các icon mới từ react-icons
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaRegComment } from "react-icons/fa";

export default function VideoActions({
  video,
  isLiked,
  soTym,
  isSaved,
  soNguoiLuu,
  totalCommentCount,
  iconCircleRef,
  handleLike,
  handleToggleSave,
}) {
  return (
    <div className="actions">
      {/* Nút Like */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleLike();
        }}
        className={`like-btn ${isLiked ? "liked" : ""}`}
      >
        <span className="icon-circle" ref={iconCircleRef}>
          {/* ✅ THAY THẾ SVG BẰNG ICON ĐỘNG */}
          {isLiked ? (
            <FaHeart size={24} color="#ff2e63" />
          ) : (
            <FaRegHeart size={24} color="#ccc" />
          )}
        </span>
        <span className="count">{soTym}</span>
      </button>

      {/* Nút Save */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggleSave();
        }}
        className="save-btn"
      >
        <span className="icon-circle">
          {/* ✅ THAY THẾ SVG BẰNG ICON ĐỘNG */}
          {isSaved ? (
            <FaBookmark size={24} color="#FFD700" />
          ) : (
            <FaRegBookmark size={24} color="#ccc" />
          )}
        </span>
        <span className="count">{soNguoiLuu || 0}</span>
      </button>

      {/* Nút Comment */}
      <button
        onClick={(e) => e.stopPropagation()}
        className="comment-toggle-btn"
      >
        <span className="icon-circle"> {/* Thêm span cho đồng bộ */}
          {/* ✅ THAY THẾ SVG BẰNG ICON MỚI */}
          <FaRegComment size={24} color="#ccc" />
        </span>
        <span className="comment-count">{totalCommentCount}</span>
      </button>
    </div>
  );
}