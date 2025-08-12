import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import './CommentDrawer.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import defaultAvatar from '../assets/default-avatar.png';
import toast from 'react-hot-toast';

const CommentDrawer = ({ maTinDang, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState({});
  const [hoveredCommentId, setHoveredCommentId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const navigate = useNavigate();
  
  const pollIntervalRef = useRef(null);
  const lastFetchTimeRef = useRef(Date.now());

  const { token, user } = useContext(AuthContext);
  const currentUserId = user?.id;

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

  useEffect(() => {
    fetchComments();
    
    pollIntervalRef.current = setInterval(() => {
      fetchComments();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchComments]);

  const addOptimisticComment = useCallback((commentData) => {
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      content: commentData.content,
      userName: user?.fullName || user?.userName || 'Bạn',
      userId: currentUserId,
      avatarUrl: user?.avatarUrl,
      createdAt: new Date().toISOString(),
      isAuthor: false,
      parentCommentId: commentData.parentCommentId || null,
      replies: [],
      isOptimistic: true
    };

    if (commentData.parentCommentId) {
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
      setComments(prev => [optimisticComment, ...prev]);
    }

    return optimisticComment.id;
  }, [user, currentUserId]);

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
    if (!token) return;

    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div style={{ fontSize: "14px", color: "white" }}>
            <div style={{ marginBottom: "12px" }}>
              Bạn có chắc muốn xoá bình luận này?
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  border: "1px solid #888",
                  borderRadius: "6px",
                  backgroundColor: "transparent",
                  color: "#ddd",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#444";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                Huỷ
              </button>

              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  border: "1px solid #f44",
                  borderRadius: "6px",
                  backgroundColor: "transparent",
                  color: "#f77",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#f44";
                  e.target.style.color = "#fff";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#f77";
                }}
              >
                Xoá
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          style: {
            background: "#1c1c1e",
            color: "#fff",
            borderRadius: "12px",
            padding: "12px 16px",
            width: "fit-content",
            minWidth: "unset",
            maxWidth: "90vw",
          },
        }
      );
    });

    if (!confirmed) return;

    const deletePromise = axios.delete(
      `http://localhost:5133/api/video/comment/${commentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    toast.promise(deletePromise, {
      loading: "Đang xoá bình luận...",
      success: "Đã xoá bình luận!",
      error: "Xoá thất bại. Vui lòng thử lại.",
    });

    try {
      await deletePromise;

      const removeFromList = (list) =>
        list
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies ? removeFromList(c.replies) : [],
          }));

      setComments((prev) => removeFromList(prev));
    } catch (err) {
      console.error("Delete error", err);
      fetchComments();
    }
  };

  const handleSubmitComment = async () => {
    if (!token || !newComment.trim()) {
      console.error("No token or empty comment");
      return;
    }

    const commentData = { content: newComment.trim() };
    const tempId = addOptimisticComment(commentData);

    try {
      const response = await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/comment`,
        commentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data) {
        replaceOptimisticComment(tempId, response.data);
      }
      
      setNewComment('');
    } catch (err) {
      console.error("Lỗi khi gửi bình luận:", err);
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

    const tempId = addOptimisticComment(replyData);

    try {
      const response = await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/comment`,
        replyData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data) {
        replaceOptimisticComment(tempId, response.data);
      }
      
      setReplyContent('');
      setActiveReplyId(null);
      
      setExpandedThreads(prev => ({
        ...prev,
        [parentId]: true
      }));
      
    } catch (err) {
      console.error("Lỗi khi gửi phản hồi:", err);
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

  useEffect(() => {
    const handleFocus = () => {
      console.log("Tab active - refreshing comments");
      fetchComments();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      } else {
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

  // Render comment với replies - CHỈ 2 CẤP, KHÔNG RECURSIVE
  const renderComment = (comment) => {
    const isAuthor = comment.isAuthor;
    const isMyComment = comment.userId === currentUserId;
    const isOptimistic = comment.isOptimistic;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const showReplies = expandedThreads[comment.id] || false;

    return (
      <div key={comment.id} className="comment-thread">
        <div 
          className="comment-item"
          style={{ 
            marginLeft: 0,
            marginBottom: '16px',
            position: 'relative',
            opacity: isOptimistic ? 0.7 : 1,
          }}
          onMouseEnter={() => setHoveredCommentId(comment.id)}
          onMouseLeave={() => setHoveredCommentId(null)}
        >
          
          {/* Avatar và nội dung */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            {/* Avatar */}
            <img
              src={comment.avatarUrl || defaultAvatar}
              className="comment-avatar"
              alt="avatar"
              onClick={() => navigate(`/nguoi-dung/${comment.userId}`)}
              onError={(e) => (e.target.src = defaultAvatar)}
              style={{ 
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0
              }}
            />

            {/* Nội dung comment */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header với tên và menu */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/nguoi-dung/${comment.userId}`)}
                  >
                    @{comment.userName}
                  </span>
                  
                  {isAuthor && (
                    <span style={{ 
                      color: '#007aff', 
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      • Tác giả
                    </span>
                  )}
                  
                  {isOptimistic && (
                    <span style={{
                      fontSize: '10px', 
                      color: '#999'
                    }}>
                      • Đang gửi...
                    </span>
                  )}
                </div>

                {/* Menu 3 chấm */}
                {isMyComment && !isOptimistic && 
                (hoveredCommentId === comment.id || menuOpenId === comment.id) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      cursor: 'pointer',
                      fontSize: '20px',
                      lineHeight: '1'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === comment.id ? null : comment.id);
                    }}
                    title="Tùy chọn"
                  >
                    ⋯
                  </div>
                )}
              </div>

              {/* Nội dung */}
              <div style={{ 
                fontSize: '14px',
                lineHeight: 1.4,
                color: '#000',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                marginBottom: '8px'
              }}>
                {comment.content}
              </div>

              {/* Action buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '8px'
              }}>
                {/* Nút trả lời */}
                {token && (
                  <button
                    onClick={() => {
                      if (activeReplyId === comment.id) {
                        setActiveReplyId(null);
                        setReplyContent('');
                      } else {
                        setActiveReplyId(comment.id);
                        setReplyContent('');
                      }
                    }}
                    disabled={isOptimistic}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: activeReplyId === comment.id ? '#007aff' : '#666',
                      cursor: isOptimistic ? 'not-allowed' : 'pointer',
                      opacity: isOptimistic ? 0.5 : 1,
                      padding: '4px 0',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    💬 {activeReplyId === comment.id ? 'Hủy' : 'Trả lời'}
                  </button>
                )}

                {/* Thời gian */}
                <span style={{
                  fontSize: '11px',
                  color: '#999'
                }}>
                  {new Date(comment.createdAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </span>

                {/* Số replies nếu có */}
                {hasReplies && (
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: '#007aff',
                      cursor: 'pointer',
                      padding: '4px 0',
                      fontWeight: 500
                    }}
                  >
                    {showReplies ? `Ẩn ${comment.replies.length} phản hồi` : `${comment.replies.length} phản hồi`}
                  </button>
                )}
              </div>

              {/* Form trả lời */}
              {activeReplyId === comment.id && token && (
                <div style={{ 
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px'
                  }}>
                    <img
                      src={user?.avatarUrl || defaultAvatar}
                      alt="Your avatar"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                        marginTop: '4px'
                      }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <textarea
                        placeholder={`Trả lời @${comment.userName}...`}
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
                          width: '100%',
                          resize: 'none',
                          minHeight: '36px',
                          padding: '8px 12px',
                          fontSize: '14px',
                          borderRadius: '18px',
                          border: '1px solid #ddd',
                          boxSizing: 'border-box',
                          outline: 'none',
                          backgroundColor: '#fff'
                        }}
                      />
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginTop: '8px' 
                      }}>
                        <span style={{ fontSize: '11px', color: '#999' }}>
                          {replyContent.length}/150
                        </span>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setActiveReplyId(null);
                              setReplyContent('');
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid #ddd',
                              borderRadius: '16px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              color: '#666'
                            }}
                          >
                            Hủy
                          </button>
                          
                          <button
                            onClick={() => handleReplySubmit(comment.id)}
                            disabled={!replyContent.trim()}
                            style={{
                              backgroundColor: replyContent.trim() ? '#fc5b5b' : '#ccc',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '20px',
                              padding: '6px 14px',
                              fontSize: '13px',
                              cursor: replyContent.trim() ? 'pointer' : 'not-allowed'
                            }}
                          >
                            Gửi
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu xóa dropdown */}
              {menuOpenId === comment.id && isMyComment && !isOptimistic && (
                <div
                  style={{
                    position: 'absolute',
                    top: '25px',
                    right: '0px',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: '120px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(null);
                      handleDeleteComment(comment.id);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#ff3b30',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    🗑️ Xóa bình luận
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HIỂN THỊ REPLIES - CHỈ 1 CẤP, KHÔNG RECURSIVE */}
        {hasReplies && showReplies && (
          <div style={{ 
            marginLeft: 40,
            borderLeft: '2px solid #e9ecef',
            paddingLeft: 20,
            marginTop: 12
          }}>
            {comment.replies.map(reply => (
              <div key={reply.id} style={{ marginBottom: '16px' }}>
                <div 
                  className="comment-item comment-reply"
                  style={{ 
                    marginLeft: 0,
                    position: 'relative',
                    opacity: reply.isOptimistic ? 0.7 : 1,
                  }}
                  onMouseEnter={() => setHoveredCommentId(reply.id)}
                  onMouseLeave={() => setHoveredCommentId(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {/* Avatar reply */}
                    <img
                      src={reply.avatarUrl || defaultAvatar}
                      className="comment-avatar"
                      alt="avatar"
                      onClick={() => navigate(`/nguoi-dung/${reply.userId}`)}
                      onError={(e) => (e.target.src = defaultAvatar)}
                      style={{ 
                        cursor: 'pointer',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />

                    {/* Nội dung reply */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Header reply */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate(`/nguoi-dung/${reply.userId}`)}
                          >
                            @{reply.userName}
                          </span>
                          
                          <span style={{
                            color: '#007aff',
                            fontSize: '12px',
                            fontWeight: 500
                          }}>
                            đã phản hồi @{comment.userName}
                          </span>
                          
                          {reply.isAuthor && (
                            <span style={{ 
                              color: '#007aff', 
                              fontSize: '11px',
                              fontWeight: 500
                            }}>
                              • Tác giả
                            </span>
                          )}
                          
                          {reply.isOptimistic && (
                            <span style={{
                              fontSize: '10px', 
                              color: '#999'
                            }}>
                              • Đang gửi...
                            </span>
                          )}
                        </div>

                        {/* Menu 3 chấm cho reply */}
                        {reply.userId === currentUserId && !reply.isOptimistic && 
                        (hoveredCommentId === reply.id || menuOpenId === reply.id) && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              cursor: 'pointer',
                              fontSize: '20px',
                              lineHeight: '1'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === reply.id ? null : reply.id);
                            }}
                            title="Tùy chọn"
                          >
                            ⋯
                          </div>
                        )}
                      </div>

                      {/* Nội dung reply */}
                      <div style={{ 
                        fontSize: '13px',
                        lineHeight: 1.4,
                        color: '#000',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        marginBottom: '8px'
                      }}>
                        {reply.content}
                      </div>

                      {/* Action buttons reply */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginTop: '8px'
                      }}>
                        {/* Nút trả lời cho reply - TRẢ LỜI VÀO COMMENT GỐC */}
                        {token && (
                          <button
                            onClick={() => {
                              if (activeReplyId === comment.id) {
                                setActiveReplyId(null);
                                setReplyContent('');
                              } else {
                                setActiveReplyId(comment.id);
                                setReplyContent(`@${reply.userName} `);
                              }
                            }}
                            disabled={reply.isOptimistic}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '12px',
                              color: activeReplyId === comment.id ? '#007aff' : '#666',
                              cursor: reply.isOptimistic ? 'not-allowed' : 'pointer',
                              opacity: reply.isOptimistic ? 0.5 : 1,
                              padding: '4px 0',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            💬 Trả lời
                          </button>
                        )}

                        {/* Thời gian reply */}
                        <span style={{
                          fontSize: '11px',
                          color: '#999'
                        }}>
                          {new Date(reply.createdAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Menu xóa dropdown cho reply */}
                      {menuOpenId === reply.id && reply.userId === currentUserId && !reply.isOptimistic && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '25px',
                            right: '0px',
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: '120px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              handleDeleteComment(reply.id);
                            }}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#ff3b30',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                            }}
                          >
                            🗑️ Xóa bình luận
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleWheel = (e) => {
    e.stopPropagation();
  };

  // Click outside để đóng menu
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpenId(null);
    };

    if (menuOpenId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpenId]);

  const totalComments = comments.reduce((acc, comment) => acc + 1 + (comment.replies?.length || 0), 0);

  return (
    <div className="comment-drawer-overlay" onClick={onClose}>
      <div
        className="comment-drawer"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
      >
        <div className="comment-header">
          <span>Bình luận ({totalComments})</span>
          <button onClick={onClose}>&times;</button>
        </div>

        <div className="comment-list">
          {comments.length === 0 && (
            <p className="no-comment" style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              Chưa có bình luận nào.
            </p>
          )}
          {comments.map(comment => renderComment(comment))}
        </div>

        {/* Input area cho comment mới */}
        {token && (
          <div className="comment-input-area" style={{ 
            padding: '12px',
            borderTop: '1px solid #eee',
            backgroundColor: '#fff'
          }}>
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
                padding: '8px 12px',
                fontSize: '15px',
                boxSizing: 'border-box',
                borderRadius: '6px',
                border: '1px solid #ddd',
                marginBottom: '8px',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {newComment.length}/150
              </span>
              <button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
              >
                Gửi
              </button>
            </div>
          </div>
        )}

        {!token && (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            borderTop: '1px solid #eee',
            color: '#666'
          }}>
            Đăng nhập để bình luận
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentDrawer;