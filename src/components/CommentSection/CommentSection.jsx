// src/components/CommentSection/CommentSection.jsx
import React from "react"; // XÓA: useRef
import styles from "./CommentSection.module.css";
import CommentThread from "./CommentThread";
import CommentInput from "./CommentInput";
// XÓA: import { useVideoScroll } from "../../hooks/useVideoScroll";

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
        {/* Render danh sách comment */}
        {comments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onReplySubmit={submitComment}
            onDelete={deleteComment}
            level={0}
            showMenuInline={showMenuInline}
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