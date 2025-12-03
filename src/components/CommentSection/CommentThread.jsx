// src/components/CommentSection/CommentThread.jsx
import React, { useState, useRef, useEffect } from "react";
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
  expandedReplies = {},
  onExpandReplies = null,
}) {
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);
  const rootRef = useRef(null);
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
   // Sử dụng callback từ parent component (CommentSection)
    if (level === 0) {
      // Top-level comment: gọi parent's expandedReplies handler
    }
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
   const hasReplies = comment.replies && comment.replies.length > 0;
  const countNestedReplies = (list) => {
    let total = 0;
    for (const c of list || []) {
      total += 1;
      if (c.replies && c.replies.length > 0) total += countNestedReplies(c.replies);
    }
    return total;
  };
  const replyCount = countNestedReplies(comment.replies || []);
  const isExpanded = expandedReplies[comment.id];
  const isTopLevel = level === 0;

 const shouldShowMenu = Boolean(showMenuInline) || comment.userId === currentUserId;

  // Debug: log when a comment decides whether to show the menu
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.debug(`[CommentThread] commentId=${comment.id} shouldShowMenu=${shouldShowMenu} currentUserId=${currentUserId} showMenuInline=${showMenuInline}`);
    } catch (e) {}
  }, [comment.id, shouldShowMenu, currentUserId, showMenuInline]);

  const visibleReplies = isTopLevel && hasReplies    
    ? isExpanded
      ? comment.replies
 : (comment.replies || []).slice(0, 1).map(r => ({ ...r, replies: [] }))
    : comment.replies || [];

  // Close menu when clicking outside this comment block
  useEffect(() => {
    if (!activeMenuCommentId) return;
    const handleDown = (e) => {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(e.target)) return;
      setActiveMenuCommentId(null);
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [activeMenuCommentId]);

  return (
    <div
      key={comment.id}
        ref={rootRef}
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

         {/* Nút 3 chấm: render một lần ở đây (bên trong .comment-item)
          Nếu parent truyền `showMenuInline=true` thì ép hiển thị nút (dùng cho VideoLikePage)
        */}
        {shouldShowMenu && (
          <div
            className={level === 0 ? styles.menuWrapperParent : styles.menuWrapperChild}
            style={{ right: '20px', display: 'inline-block', zIndex: 1200 }}
          >
            <button
              id={`menu-btn-${comment.id}`}
              className="menu-btn"
              style={{ display: 'inline-block', visibility: 'visible' }}
              onClick={() =>
                setActiveMenuCommentId((prevId) =>
                  prevId === comment.id ? null : comment.id
                )
              }
            >
              ⋯
            </button>

            {isMenuOpen && (
             <div className="popup-menu" style={{ top: '30px', right: 0 , left: '-20px' }}>
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
              expandedReplies={expandedReplies}
              onExpandReplies={onExpandReplies}
            />
          ))}
        </div>
      )}
       {/* Toggle button nằm ngoài .replies để margin-top hoạt động độc lập */}
      {isTopLevel && hasReplies && (() => {
        const collapsedShown = (comment.replies || []).slice(0, 1).length;
        const remaining = Math.max(0, replyCount - collapsedShown);
        return (
          <button
            onClick={() => {
              onExpandReplies && onExpandReplies(comment.id);
            }}
            className={styles.repliesToggleBtn}
            style={{
              marginTop: isExpanded ? '-60px' : '-4px'
            }}
          >
            {isExpanded
              ? "Thu gọn"
              : remaining > 0
                ? `Xem thêm ${remaining} phản hồi khác`
                : `Xem thêm ${replyCount} phản hồi`}
          </button>
        );
      })()}
    </div>
  );
}