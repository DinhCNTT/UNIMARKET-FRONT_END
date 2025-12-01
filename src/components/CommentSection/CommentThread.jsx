// src/components/CommentSection/CommentThread.jsx
import React, { useState, useRef } from "react";
import styles from "./CommentSection.module.css";

// Component con để xử lý từng comment và reply của nó
export default function CommentThread({
  comment,
  currentUserId,
  onReplySubmit,
  onDelete,
  level = 0,
  parentUserName = null,
  showMenuInline = false,
}) {
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [replyContentMap, setReplyContentMap] = useState({});
  const [activeReplyMap, setActiveReplyMap] = useState({});

  const toggleChildReplyInput = (replyId) => {
      setActiveReplyMap((prev) => {
        const opening = !prev[replyId];
        const next = { ...prev, [replyId]: !prev[replyId] };
        if (opening) {
          // wait a tick for DOM to render the reply input, then compute scroll target
        setTimeout(() => {
          const el = document.getElementById(`reply-${replyId}`);
          // find scrollable container (prefer explicit container if available)
          const container = document.querySelector('.comment-scrollable');
          if (el && container) {
            // Manual smooth scroll with easeOutQuad + immediate focus when done
            const elRect = el.getBoundingClientRect();
            const contRect = container.getBoundingClientRect();
            const offset = elRect.top - contRect.top + container.scrollTop;
            const padding = 140;
            const target = Math.max(0, offset - padding);
            const start = container.scrollTop;
            const diff = target - start;
            const duration = 350; // ms
            const startTime = Date.now();
            let animationId = null;

            const handleUserScroll = () => {
              if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
              }
              try { delete container.dataset.programmaticScroll; } catch (e) {}
              container.removeEventListener('scroll', handleUserScroll);
            };

            container.addEventListener('scroll', handleUserScroll);

            const animate = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(1, elapsed / duration);
              const eased = 1 - Math.pow(1 - progress, 2); // easeOutQuad
              container.scrollTop = start + diff * eased;

              if (progress < 1) {
                animationId = requestAnimationFrame(animate);
              } else {
                container.removeEventListener('scroll', handleUserScroll);
                try {
                  const ta = el.querySelector('textarea');
                  if (ta) {
                    try { ta.focus({ preventScroll: true }); } catch (e) {}
                    ta.style.height = 'auto';
                    ta.style.height = ta.scrollHeight + 'px';
                  }
                } catch (e) {}
                try { delete container.dataset.programmaticScroll; } catch (e) {}
              }
            };
            animate();
          } else if (el) {
            el.scrollIntoView({ behavior: 'auto', block: 'nearest' });
            const ta = el.querySelector('textarea');
            if (ta) {
              try { ta.focus({ preventScroll: true }); } catch (e) {}
              ta.style.height = 'auto';
              ta.style.height = ta.scrollHeight + 'px';
            }
          }
        }, 60);
        }
        return next;
      });
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
      className="comment-item"
      style={{ marginLeft: `${Math.min(level, 2) * -24}px` }}
    >
      {/* Comment chính */}
      <div className="comment-wrapper">
        <div className="comment-user-header">
          <img src={comment.avatarUrl} className="avatar" alt="user" />
          <div className="comment-main">
            <div className="comment-header">
              <strong className="username">{comment.userName}</strong>
              {level > 0 && parentUserName && (
                <span className="reply-to">
                  trả lời <strong>{parentUserName}</strong>
                </span>
              )}
              {showMenuInline && comment.userId === currentUserId && (
                <div className={level === 0 ? styles.menuWrapperParent : styles.menuWrapperChild}>
                  <button
                    className="menu-btn"
                    onClick={() =>
                      setActiveMenuCommentId((prevId) =>
                        prevId === comment.id ? null : comment.id
                      )
                    }
                  >
                    ⋯
                  </button>

                  {isMenuOpen && (
                    <div className="popup-menu">
                      <button
                        className="delete-btn"
                        onClick={() => {
                          onDelete(comment.id);
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

            <div className="comment-content">{comment.content}</div>
            <div className="comment-meta">
              <span className={styles.time}>
                {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
              </span>
              <button
                className="reply-toggle-btn"
                onClick={() => toggleChildReplyInput(comment.id)}
              >
                Trả lời
              </button>
            </div>

            {/* Ô nhập trả lời */}
            {activeReplyMap[comment.id] && (
                <div id={`reply-${comment.id}`} className={styles.replyInputInline}>
                <div className={styles.replyInputWrapper}>
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
                    className="reply-input textarea"
                    rows={1}
                    ref={(el) => {
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }
                    }}
                  />

                  <div className="reply-actions">
                    <button
                      onClick={() =>
                        handleReplySubmit(comment.id, replyContentMap[comment.id])
                      }
                      className="reply-submit-btn"
                      disabled={!replyContentMap[comment.id]?.trim()}
                    >
                      Gửi
                    </button>
                    <button
                      className="reply-cancel-btn"
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
                  <div className="char-count">
                    {replyContentMap[comment.id].length}/150
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Nút menu (nếu là chủ comment) */}
        {!showMenuInline && comment.userId === currentUserId && (
          <div className={level === 0 ? styles.menuWrapperParent : styles.menuWrapperChild}>
            <button
              className="menu-btn"
              onClick={() =>
                setActiveMenuCommentId((prevId) =>
                  prevId === comment.id ? null : comment.id
                )
              }
            >
              ⋯
            </button>

            {isMenuOpen && (
                    <div className="popup-menu">
                      <button
                        className="delete-btn"
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
        <div className="replies">
          {visibleReplies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
              level={level + 1}
              parentUserName={comment.userName}
              showMenuInline={showMenuInline}
            />
          ))}

          {isTopLevel && comment.replies.length > 1 && (
            <button
              onClick={() => toggleExpandReplies(comment.id)}
              className="expand-replies-btn"
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