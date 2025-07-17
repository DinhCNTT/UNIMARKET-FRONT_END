import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CommentDrawer.css';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/default-avatar.png'; // ✅ import fallback avatar

const CommentDrawer = ({ maTinDang, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState({});
  const [hoveredCommentId, setHoveredCommentId] = useState(null);  
  const [menuOpenId, setMenuOpenId] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    fetchComments();
  }, [maTinDang]);

  const fetchComments = async () => {
  try {
    const res = await axios.get(`http://localhost:5133/api/video/${maTinDang}/comments`);
    console.log("Comments:", res.data); // ← KIỂM TRA Ở ĐÂY
    setComments(res.data || []);
  } catch (err) {
    console.error("Lỗi khi lấy bình luận:", err);
  }
};

  // Hàm xóa bình luận gọi API DELETE
  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này không?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5133/api/video/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchComments(); // Tải lại bình luận sau khi xóa
      setMenuOpenId(null);
    } catch (err) {
      console.error("Lỗi khi xóa bình luận:", err);
    }
  };
  const handleSubmitComment = async () => {
    const token = localStorage.getItem("token");
    if (!token || !newComment.trim()) return;

    try {
      await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/comment`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error("Lỗi khi gửi bình luận:", err);
    }
  };

  const handleReplySubmit = async (parentId) => {
    const token = localStorage.getItem("token");
    if (!token || !replyContent.trim()) return;

    try {
      await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/comment`,
        {
          content: replyContent,
          parentCommentId: parentId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyContent('');
      setActiveReplyId(null);
      fetchComments();
    } catch (err) {
      console.error("Lỗi khi gửi phản hồi:", err);
    }
  };

  const handleTextareaChange = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const toggleReplies = (parentId) => {
    setExpandedThreads(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };
  
  const currentUserId = localStorage.getItem("userId");
  const extractThreads = (comment, parentChain = []) => {
    if (!comment.replies || comment.replies.length === 0) {
      return [[...parentChain, comment]];
    }

    const threads = [];
    for (const reply of comment.replies) {
      const childThreads = extractThreads(reply, [...parentChain, comment]);
      threads.push(...childThreads);
    }
    return threads;
  };

 const renderThread = (thread, threadIndex) => {
  const parent = thread[0];
  const replies = thread.slice(1);
  const hasReplies = replies.length > 0;
  const showReplies = expandedThreads[parent.id] || false;

  return (
    <div className="comment-thread" key={`thread-${parent.id}-${threadIndex}`}>
      {[parent, ...(showReplies ? replies : [])].map((cmt, i) => {
        const isReply = i > 0;
        const prev = i > 0 ? thread[i - 1] : null;
        const isAuthor = cmt.isAuthor;
        const isMyComment = cmt.userId === currentUserId;

        return (
          <div
            key={`cmt-${cmt.id}-${i}`}
            className={`comment-item ${isReply ? 'comment-item-vertical' : ''}`}
            style={{
              marginLeft: isReply ? 40 : 0,
              position: 'relative',
              zIndex: menuOpenId === cmt.id ? 100 : 1,
            }}
            onMouseEnter={() => setHoveredCommentId(cmt.id)}
            onMouseLeave={() => setHoveredCommentId(null)}
          >
            <img
  src={cmt.avatarUrl || defaultAvatar}
  className="comment-avatar"
  alt="avatar"
  onClick={() => navigate(`/nguoi-dung/${cmt.userId}`)}
  onError={(e) => (e.target.src = defaultAvatar)}
  style={{ cursor: 'pointer' }}
/>


            <div className="comment-body">
              {isReply && (
                <div className="reply-to-line" style={{ marginBottom: 4, fontSize: 12, color: '#555' }}>
                  <strong>@{cmt.userName}</strong> đã phản hồi <strong>@{prev.userName}</strong>
                </div>
              )}

              {/* Tên & nút OPTIONS nếu là comment của mình */}
              <div
                className="comment-name"
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  @{cmt.userName} {isAuthor && <span className="author-badge">• Tác giả</span>}
                </span>

                {isMyComment && (hoveredCommentId === cmt.id || menuOpenId === cmt.id) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontSize: 20,
                      color: 'red',
                      cursor: 'pointer',
                      zIndex: 1001,
                      userSelect: 'none',
                    }}
                    onClick={() => setMenuOpenId(menuOpenId === cmt.id ? null : cmt.id)}
                    title="Tùy chọn"
                  >
                    &#x22EE;
                  </div>
                )}
              </div>

              {/* Nội dung bình luận */}
              <div className="comment-text" style={{ marginTop: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {cmt.content.match(/.{1,15}/g)?.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>

              {/* Nút trả lời */}
              <button
                className="reply-button"
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: '#007aff',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
                onClick={() => setActiveReplyId(cmt.id === activeReplyId ? null : cmt.id)}
              >
                Trả lời
              </button>

              {/* Ô nhập phản hồi */}
              {activeReplyId === cmt.id && (
                <div className="reply-input" style={{ display: 'flex', alignItems: 'center', marginTop: 6, gap: 8 }}>
                  <textarea
                    placeholder="Trả lời..."
                    value={replyContent}
                    onChange={(e) => {
                      if (e.target.value.length <= 150) {
                        setReplyContent(e.target.value);
                      }
                    }}
                    onInput={handleTextareaChange}
                    maxLength={150}
                    rows={1}
                    style={{
                      resize: 'horizontal',
                      minHeight: '36px',
                      minWidth: '40px',
                      maxWidth: '60%',
                      padding: '6px 10px',
                      fontSize: '14px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      boxSizing: 'border-box',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      flexShrink: 0,
                    }}
                  />
                  <button
                    className="reply-cancel"
                    onClick={() => setActiveReplyId(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '22px',
                      lineHeight: '22px',
                      cursor: 'pointer',
                      color: '#888',
                      padding: '0 6px',
                      userSelect: 'none',
                    }}
                    aria-label="Đóng"
                  >
                    ×
                  </button>
                  <button
                    className="reply-send"
                    onClick={() => handleReplySubmit(cmt.id)}
                    style={{
                      backgroundColor: '#007aff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    Gửi
                  </button>
                </div>
              )}

              {/* Menu dropdown chỉ với nút Xóa */}
              {menuOpenId === cmt.id && isMyComment && (
                <div
                  className="comment-menu"
                  style={{
                    position: 'absolute',
                    top: 24,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: 100,
                  }}
                >
                  <div
                    onClick={() => handleDeleteComment(cmt.id)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: 'red',
                    }}
                  >
                    Xoá
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Nút xem thêm phản hồi */}
      {hasReplies && (
        <div style={{ marginLeft: 50, marginTop: 6 }}>
          <button
            onClick={() => toggleReplies(parent.id)}
            style={{
              fontSize: 13,
              color: '#007aff',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showReplies ? 'Thu gọn bình luận' : `Xem thêm ${replies.length} phản hồi`}
          </button>
        </div>
      )}
    </div>
  );
};




const allThreads = comments.flatMap(cmt => extractThreads(cmt));


 return (
  <div className="comment-drawer-overlay" onClick={onClose}>
    <div className="comment-drawer" onClick={(e) => e.stopPropagation()}>
      <div className="comment-header">
        <span>Bình luận</span>
        <button onClick={onClose}>&times;</button>
      </div>

      <div className="comment-list">
  {comments.length === 0 && <p className="no-comment">Chưa có bình luận nào.</p>}
  {comments.flatMap((root) =>
    extractThreads(root).map((thread, index) => renderThread(thread, index))
  )}
</div>


      <div className="comment-input-area">
        <textarea
          placeholder="Nhập bình luận..."
          value={newComment}
          onChange={(e) => {
            if (e.target.value.length <= 150) {
              setNewComment(e.target.value);
            }
          }}
          onInput={handleTextareaChange}
          maxLength={150}
          rows={1}
          style={{
            resize: 'none',
            overflow: 'hidden',
            minHeight: '40px',
            lineHeight: '20px',
            width: '100%',
            padding: '6px 10px',
            fontSize: '15px',
            boxSizing: 'border-box',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            borderRadius: '6px',
            border: '1px solid #ccc',
            marginBottom: '8px'
          }}
        />
        <button onClick={handleSubmitComment}>Gửi</button>
      </div>
    </div>
  </div>
);

};

export default CommentDrawer;
