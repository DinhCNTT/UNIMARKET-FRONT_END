// src/components/CommentSection/CommentSection.jsx
import React from "react"; // XÓA: useRef
import CommentThread from "./CommentThread";
import CommentInput from "./CommentInput";
// XÓA: import { useVideoScroll } from "../../hooks/useVideoScroll";

export default function CommentSection({
  comments,
  totalCommentCount,
  currentUserId,
  submitComment,
  deleteComment,
  scrollRef, // <-- THÊM prop: scrollRef
  hideUserInfo, // <-- THÊM prop: hideUserInfo
}) {
  // XÓA: const scrollRef = useRef(null);
  // XÓA: const hideUserInfo = useVideoScroll(scrollRef);

  return (
    <div
      // SỬA: Dùng prop `hideUserInfo` từ cha
      className={`lvv-comment-section ${hideUserInfo ? "pull-up" : ""}`}
      onClick={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="lvv-comments-title-header">
        <strong>Comments ({totalCommentCount})</strong>
      </div>

      <div
        ref={scrollRef} // <-- SỬA: Gắn ref từ cha vào đây
        className="lvv-comment-scrollable"
        // SỬA: Dùng prop `hideUserInfo` từ cha
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
          />
        ))}

        {/* Ô nhập bình luận mới */}
        <CommentInput onSubmit={submitComment} />
      </div>
    </div>
  );
}