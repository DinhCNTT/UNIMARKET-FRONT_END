// src/components/CommentSection/CommentThread.jsx
import React, { useState, useRef } from "react";

// Component con để xử lý từng comment và reply của nó
export default function CommentThread({
  comment,
  currentUserId,
  onReplySubmit,
  onDelete,
  level = 0,
  parentUserName = null,
}) {
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [replyContentMap, setReplyContentMap] = useState({});
  const [activeReplyMap, setActiveReplyMap] = useState({});

  const toggleChildReplyInput = (replyId) => {
    setActiveReplyMap((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
  };

  const toggleExpandReplies = (commentId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleReplySubmit = (commentId, content) => {
    // Gọi hàm submit từ hook (đã tích hợp SignalR)
    onReplySubmit(content, commentId).then((success) => {
      if (success) {
        // Reset input & UI state
        setReplyContentMap((prev) => ({ ...prev, [commentId]: "" }));
        setActiveReplyMap((prev) => ({ ...prev, [commentId]: false }));
      }
    });
  };

  // ----- Render -----
  const isMenuOpen = activeMenuCommentId === comment.id;
  const hasReplies = comment.replies?.length > 0;
  const isExpanded = expandedComments[comment.id];
  const isTopLevel = level === 0;

  const visibleReplies = isTopLevel
    ? isExpanded
      ? comment.replies
      : comment.replies?.slice(0, 1)
    : comment.replies;

  return (
    <div
      key={comment.id}
      className="lvv-comment-item"
      style={{ marginLeft: `${Math.min(level, 2) * -24}px` }}
    >
      {/* Comment chính */}
      <div className="lvv-comment-wrapper">
        <div className="lvv-comment-user-header">
          <img src={comment.avatarUrl} className="lvv-avatar" alt="user" />
          <div className="lvv-comment-main">
            <div className="lvv-comment-header">
              <strong className="lvv-username">{comment.userName}</strong>
              {level > 0 && parentUserName && (
                <span className="lvv-reply-to">
                  trả lời <strong>{parentUserName}</strong>
                </span>
              )}
            </div>

            <div className="lvv-comment-content">{comment.content}</div>
            <div className="lvv-comment-meta">
              <span className="lvv-time">
                {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
              </span>
              <button
                className="lvv-reply-toggle-btn"
                onClick={() => toggleChildReplyInput(comment.id)}
              >
                Trả lời
              </button>
            </div>

            {/* Ô nhập trả lời */}
            {activeReplyMap[comment.id] && (
              <div className="lvv-reply-input-inline">
                <div className="lvv-reply-input-wrapper">
                  <textarea
                    value={replyContentMap[comment.id] || ""}
                    onChange={(e) => {
                      const text = e.target.value;
                      if (text.length <= 150) {
                        setReplyContentMap((prev) => ({
                          ...prev,
                          [comment.id]: text,
                        }));
                      }
                    }}
                    placeholder="Trả lời..."
                    className="lvv-reply-input textarea"
                    rows={1}
                    ref={(el) => {
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }
                    }}
                  />

                  <div className="lvv-reply-actions">
                    <button
                      onClick={() =>
                        handleReplySubmit(comment.id, replyContentMap[comment.id])
                      }
                      className="lvv-reply-submit-btn"
                      disabled={!replyContentMap[comment.id]?.trim()}
                    >
                      Gửi
                    </button>
                    <button
                      className="lvv-reply-cancel-btn"
                      onClick={() => {
                        setReplyContentMap((prev) => ({
                          ...prev,
                          [comment.id]: "",
                        }));
                        setActiveReplyMap((prev) => ({
                          ...prev,
                          [comment.id]: false,
                        }));
                      }}
                    >
                      X
                    </button>
                  </div>
                </div>

                {replyContentMap[comment.id]?.length >= 30 && (
                  <div className="lvv-char-count">
                    {replyContentMap[comment.id].length}/150
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Nút menu (nếu là chủ comment) */}
        {comment.userId === currentUserId && (
          <div
            className={
              level === 0
                ? "lvv-menu-wrapper-parent"
                : "lvv-menu-wrapper-child"
            }
          >
            <button
              className="lvv-menu-btn"
              onClick={() =>
                setActiveMenuCommentId((prevId) =>
                  prevId === comment.id ? null : comment.id
                )
              }
            >
              ⋯
            </button>

            {isMenuOpen && (
              <div className="lvv-popup-menu">
                <button
                  className="lvv-delete-btn"
                  onClick={() => {
                    onDelete(comment.id); // Gọi hàm xóa từ hook
                    setActiveMenuCommentId(null);
                  }}
                >
                  Xoá
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Replies (Đệ quy) */}
      {hasReplies && (
        <div className="lvv-replies">
          {visibleReplies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
              level={level + 1}
              parentUserName={comment.userName}
            />
          ))}

          {isTopLevel && comment.replies.length > 1 && (
            <button
              onClick={() => toggleExpandReplies(comment.id)}
              className="lvv-expand-replies-btn"
            >
              {isExpanded
                ? "Thu gọn"
                : `Xem thêm (${comment.replies.length - 1})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}