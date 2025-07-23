import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import './CommentDrawer.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import defaultAvatar from '../assets/default-avatar.png';

const CommentDrawer = ({ maTinDang, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState({});
  const [hoveredCommentId, setHoveredCommentId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const navigate = useNavigate();
  
  // Thêm ref để tracking interval
  const pollIntervalRef = useRef(null);
  const lastFetchTimeRef = useRef(Date.now());

  const { token, user } = useContext(AuthContext);
  const currentUserId = user?.id;

  // Hàm fetch comments được optimize
  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5133/api/video/${maTinDang}/comments`);
      console.log("Comments:", res.data);
      setComments(res.data || []);
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      console.error("Lỗi khi lấy bình luận:", err);
    }
  }, [maTinDang]);

  // GIẢI PHÁP 1: POLLING - Tự động fetch mới mỗi 3 giây
  useEffect(() => {
    // Fetch lần đầu
    fetchComments();
    
    // Setup polling
    pollIntervalRef.current = setInterval(() => {
      fetchComments();
    }, 3000); // 3 giây fetch 1 lần

    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchComments]);

  // Hàm thêm comment mới vào state ngay lập tức (Optimistic Update)
  const addOptimisticComment = useCallback((commentData) => {
    const optimisticComment = {
      id: `temp-${Date.now()}`, // ID tạm
      content: commentData.content,
      userName: user?.fullName || user?.userName || 'Bạn',
      userId: currentUserId,
      avatarUrl: user?.avatarUrl,
      createdAt: new Date().toISOString(),
      isAuthor: false,
      parentCommentId: commentData.parentCommentId || null,
      replies: [],
      isOptimistic: true // Flag để biết đây là comment tạm
    };

    if (commentData.parentCommentId) {
      // Thêm reply
      setComments(prev => {
        const updateReplies = (commentsList) => {
          return commentsList.map(comment => {
            if (comment.id === commentData.parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), optimisticComment]
              };
            } else if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateReplies(comment.replies)
              };
            }
            return comment;
          });
        };
        return updateReplies(prev);
      });
    } else {
      // Thêm comment mới
      setComments(prev => [optimisticComment, ...prev]);
    }

    return optimisticComment.id;
  }, [user, currentUserId]);

  // Hàm xóa comment optimistic và thay thế bằng real data
  const replaceOptimisticComment = useCallback((tempId, realComment) => {
    setComments(prev => {
      const replaceInList = (commentsList) => {
        return commentsList.map(comment => {
          if (comment.id === tempId) {
            return { ...realComment, isOptimistic: false };
          } else if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: replaceInList(comment.replies)
            };
          }
          return comment;
        });
      };
      return replaceInList(prev);
    });
  }, []);

  const handleDeleteComment = async (commentId) => {
    if (!token) {
      console.error("No token available");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này không?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5133/api/video/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Xóa comment khỏi state ngay lập tức
      setComments(prev => {
        const removeFromList = (commentsList) => {
          return commentsList
            .filter(comment => comment.id !== commentId)
            .map(comment => ({
              ...comment,
              replies: comment.replies ? removeFromList(comment.replies) : []
            }));
        };
        return removeFromList(prev);
      });
      
      setMenuOpenId(null);
    } catch (err) {
      console.error("Lỗi khi xóa bình luận:", err);
      // Rollback - fetch lại comments nếu xóa thất bại
      fetchComments();
    }
  };

  const handleSubmitComment = async () => {
    if (!token || !newComment.trim()) {
      console.error("No token or empty comment");
      return;
    }

    const commentData = { content: newComment.trim() };
    
    // Optimistic Update - hiển thị comment ngay lập tức
    const tempId = addOptimisticComment(commentData);

    try {
      const response = await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/comment`,
        commentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Thay thế comment tạm bằng real data
      if (response.data) {
        replaceOptimisticComment(tempId, response.data);
      }
      
      setNewComment('');
    } catch (err) {
      console.error("Lỗi khi gửi bình luận:", err);
      // Xóa comment tạm nếu gửi thất bại
      setComments(prev => prev.filter(comment => comment.id !== tempId));
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!token || !replyContent.trim()) {
      console.error("No token or empty reply");
      return;
    }

    const replyData = {
      content: replyContent.trim(),
      parentCommentId: parentId
    };

    // Optimistic Update cho reply
    const tempId = addOptimisticComment(replyData);

    try {
      const response = await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/comment`,
        replyData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Thay thế reply tạm bằng real data
      if (response.data) {
        replaceOptimisticComment(tempId, response.data);
      }
      
      setReplyContent('');
      setActiveReplyId(null);
      
      // Auto expand thread để hiện reply mới
      setExpandedThreads(prev => ({
        ...prev,
        [parentId]: true
      }));
      
    } catch (err) {
      console.error("Lỗi khi gửi phản hồi:", err);
      // Xóa reply tạm nếu gửi thất bại
      setComments(prev => {
        const removeFromList = (commentsList) => {
          return commentsList.map(comment => ({
            ...comment,
            replies: comment.replies 
              ? removeFromList(comment.replies).filter(reply => reply.id !== tempId)
              : []
          }));
        };
        return removeFromList(prev);
      });
    }
  };

  // GIẢI PHÁP 2: Focus/Blur Polling - Chỉ poll khi tab active
  useEffect(() => {
    const handleFocus = () => {
      console.log("Tab active - refreshing comments");
      fetchComments();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab không active - dừng polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      } else {
        // Tab active - bắt đầu polling lại
        fetchComments();
        pollIntervalRef.current = setInterval(fetchComments, 3000);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchComments]);

  // Các hàm render giữ nguyên...
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
          const isOptimistic = cmt.isOptimistic; // Comment đang chờ xác nhận

          return (
            <div
              key={`cmt-${cmt.id}-${i}`}
              className={`comment-item ${isReply ? 'comment-item-vertical' : ''} ${isOptimistic ? 'optimistic-comment' : ''}`}
              style={{
                marginLeft: isReply ? 40 : 0,
                position: 'relative',
                zIndex: menuOpenId === cmt.id ? 100 : 1,
                opacity: isOptimistic ? 0.7 : 1, // Làm mờ comment tạm
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
                {isReply && prev && (
                  <div className="reply-to-line" style={{ marginBottom: 4, fontSize: 12, color: '#555' }}>
                    <strong>@{cmt.userName}</strong> đã phản hồi <strong>@{prev.userName}</strong>
                  </div>
                )}

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
                    {isOptimistic && <span style={{fontSize: 10, color: '#999', marginLeft: 4}}>• Đang gửi...</span>}
                  </span>

                  {isMyComment && !isOptimistic && (hoveredCommentId === cmt.id || menuOpenId === cmt.id) && (
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

                <div className="comment-text" style={{ marginTop: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {cmt.content.match(/.{1,35}/g)?.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>

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
                  disabled={isOptimistic}
                >
                  Trả lời
                </button>

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

                {menuOpenId === cmt.id && isMyComment && !isOptimistic && (
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