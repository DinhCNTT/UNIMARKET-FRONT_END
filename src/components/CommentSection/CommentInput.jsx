// src/components/CommentSection/CommentInput.jsx
import React, { useState, useRef } from "react";

export default function CommentInput({ onSubmit }) {
  const [newComment, setNewComment] = useState("");
  const mainCommentRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Gọi hàm submit từ hook (đã tích hợp SignalR)
    onSubmit(newComment, null).then((success) => {
      if (success) {
        setNewComment("");
        // Reset chiều cao textarea
        if (mainCommentRef.current) {
          mainCommentRef.current.style.height = "auto";
        }
      }
    });
  };

  return (
    <div className="comment-input-fixed">
      <div className="comment-input-wrapper">
        <div className="textarea-group">
          <textarea
            ref={mainCommentRef}
            value={newComment}
            onChange={(e) => {
              const text = e.target.value;
              if (text.length <= 150) {
                setNewComment(text);
              }
              const el = mainCommentRef.current;
              if (el) {
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }
            }}
            placeholder="Nhập bình luận..."
            className="comment-input"
            rows={1}
          />
          {newComment.length > 50 && (
            <div className="char-counter">{newComment.length}/150</div>
          )}
        </div>
        <button onClick={handleSubmit} className="comment-submit-btn">
          Gửi
        </button>
      </div>
    </div>
  );
}