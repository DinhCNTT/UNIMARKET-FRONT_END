// src/components/CommentSection/CommentSection.jsx
import React, { useState, useEffect } from "react";
import styles from "./CommentSection.module.css";
import CommentThread from "./CommentThread";
import CommentInput from "./CommentInput";

export default function CommentSection({
  comments,
  totalCommentCount,
  currentUserId,
  submitComment,
  deleteComment,
  scrollRef,
  hideUserInfo,
  expanded,
  video,
  showMenuInline = false,
}) {
  // Không cần logic chia trang - hiển thị tất cả comment
  // Chỉ dùng state để quản lý expand/collapse replies
  const [expandedReplies, setExpandedReplies] = useState({});

  // Reset expandedReplies chỉ khi danh sách comment thực sự đổi (ví dụ đổi video hoặc lần load đầu)
  // Tránh reset khi chỉ có thêm reply mới (SignalR cập nhật comments) để giữ trạng thái mở.
  const prevCommentsRef = React.useRef(null);
  useEffect(() => {
    const prevFirstId = prevCommentsRef.current?.[0]?.id;
    const newFirstId = comments?.[0]?.id;
    // Nếu first comment id khác (ví dụ load thread mới), reset expanded state
    if (prevFirstId !== newFirstId) {
      setExpandedReplies({});
    }
    prevCommentsRef.current = comments;
  }, [comments]);

  const handleExpandReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };
  // XÓA: const scrollRef = useRef(null);
  // XÓA: const hideUserInfo = useVideoScroll(scrollRef);

  return (
    <div
      className={`comment-section ${hideUserInfo ? "pull-up" : ""} ${expanded ? "desc-expanded" : video?.moTa?.length > 120 ? "desc-long" : ""}`}
      onClick={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className={styles.commentsTitleHeader}>
        <strong>Comments ({totalCommentCount})</strong>
      </div>

      <div
        ref={scrollRef}
        className="comment-scrollable"
        style={{ paddingTop: hideUserInfo ? "80px" : "12px" }}
      >
        {/* Render tất cả comment - không chia trang */}
        {comments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onReplySubmit={submitComment}
            onDelete={deleteComment}
            level={0}
            showMenuInline={showMenuInline}
            expandedReplies={expandedReplies}
            onExpandReplies={handleExpandReplies}
          />
        ))}

        {/* Spacer để input không bị che */}
        <div className="comment-bottom-spacer"></div>
      </div>

      {/* Ô nhập bình luận mới - fixed position */}
      <CommentInput onSubmit={submitComment} />
    </div>
  );
}