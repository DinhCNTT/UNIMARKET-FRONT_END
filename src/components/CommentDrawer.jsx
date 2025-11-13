import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import './CommentDrawer.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import defaultAvatar from '../assets/default-avatar.png';
import toast from 'react-hot-toast';

// IMPORT ICON CHUYÊN NGHIỆP
import { FaReply, FaTrash, FaTimes } from 'react-icons/fa';
import { BsThreeDots } from 'react-icons/bs';
import { IoClose } from 'react-icons/io5';

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
          <div className="CommentToastContainer">
            <div className="CommentToastMessage">
              Bạn có chắc muốn xoá bình luận này?
            </div>
            <div className="CommentToastButtons">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="CommentToastCancelBtn"
              >
                Huỷ
              </button>

              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="CommentToastDeleteBtn"
              >
                Xoá
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          className: "CommentToast"
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
      <div key={comment.id} className="CommentThread">
        <div 
          className={`CommentItem ${isOptimistic ? 'CommentOptimistic' : ''}`}
          onMouseEnter={() => setHoveredCommentId(comment.id)}
          onMouseLeave={() => setHoveredCommentId(null)}
        >
          
          {/* Avatar và nội dung */}
          <div className="CommentMainContent">
            {/* Avatar */}
            <img
              src={comment.avatarUrl || defaultAvatar}
              className="CommentAvatar"
              alt="avatar"
              onClick={() => navigate(`/nguoi-dung/${comment.userId}`)}
              onError={(e) => (e.target.src = defaultAvatar)}
            />

            {/* Nội dung comment */}
            <div className="CommentContentWrapper">
              {/* Header với tên và menu */}
              <div className="CommentHeader">
                <div className="CommentUserInfo">
                  <span 
                    className="CommentUserName"
                    onClick={() => navigate(`/nguoi-dung/${comment.userId}`)}
                  >
                    @{comment.userName}
                  </span>
                  
                  {isAuthor && (
                    <span className="CommentAuthorBadge">
                      • Tác giả
                    </span>
                  )}
                  
                  {isOptimistic && (
                    <span className="CommentSendingStatus">
                      • Đang gửi...
                    </span>
                  )}
                </div>

                {/* Menu 3 chấm */}
                {isMyComment && !isOptimistic && 
                (hoveredCommentId === comment.id || menuOpenId === comment.id) && (
                  <div
                    className="CommentMenuButton"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === comment.id ? null : comment.id);
                    }}
                    title="Tùy chọn"
                  >
                    <BsThreeDots /> {/* <-- THAY ĐỔI ICON */}
                  </div>
                )}
              </div>

              {/* Nội dung */}
              <div className="CommentContent">
                {comment.content}
              </div>

              {/* Action buttons */}
              <div className="CommentActions">
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
                    className={`CommentReplyButton ${activeReplyId === comment.id ? 'CommentReplyButtonActive' : ''} ${isOptimistic ? 'CommentReplyButtonDisabled' : ''}`}
                  >
                    {/* <-- THAY ĐỔI ICON --> */}
                    {activeReplyId === comment.id ? <FaTimes /> : <FaReply />}
                    {activeReplyId === comment.id ? 'Hủy' : 'Trả lời'}
                  </button>
                )}

                {/* Thời gian */}
                <span className="CommentTime">
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
                    className="CommentToggleRepliesButton"
                  >
                    {showReplies ? `Ẩn ${comment.replies.length} phản hồi` : `${comment.replies.length} phản hồi`}
                  </button>
                )}
              </div>

              {/* Menu xóa dropdown */}
              {menuOpenId === comment.id && isMyComment && !isOptimistic && (
                <div className="CommentDeleteMenu">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(null);
                      handleDeleteComment(comment.id);
                    }}
                    className="CommentDeleteMenuItem"
                  >
                    <FaTrash /> Xóa bình luận {/* <-- THAY ĐỔI ICON */}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FORM TRẢ LỜI CHO COMMENT GỐC - THÊM PHẦN NÀY */}
        {activeReplyId === comment.id && token && (
          <div className="CommentReplyForm CommentReplyFormAfterMain">
            <div className="CommentReplyFormContent">
              <img
                src={user?.avatarUrl || defaultAvatar}
                alt="Your avatar"
                className="CommentReplyAvatar"
              />
              
              <div className="CommentReplyInputWrapper">
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
                  className="CommentReplyTextarea"
                />
                
                <div className="CommentReplyFormFooter">
                  <span className="CommentReplyCharCount">
                    {replyContent.length}/150
                  </span>
                  
                  <div className="CommentReplyFormButtons">
                    <button
                      onClick={() => {
                        setActiveReplyId(null);
                        setReplyContent('');
                      }}
                      className="CommentReplyCancelButton"
                    >
                      Hủy
                    </button>
                    
                    <button
                      onClick={() => handleReplySubmit(comment.id)}
                      disabled={!replyContent.trim()}
                      className={`CommentReplySubmitButton ${!replyContent.trim() ? 'CommentReplySubmitButtonDisabled' : ''}`}
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HIỂN THỊ REPLIES - CHỈ 1 CẤP, KHÔNG RECURSIVE */}
        {hasReplies && showReplies && (
          <div className="CommentRepliesContainer">
            {comment.replies.map((reply, index) => (
              <div key={reply.id}>
                <div className="CommentReplyItem">
                  <div 
                    className={`CommentItem CommentReply ${reply.isOptimistic ? 'CommentOptimistic' : ''}`}
                    onMouseEnter={() => setHoveredCommentId(reply.id)}
                    onMouseLeave={() => setHoveredCommentId(null)}
                  >
                    <div className="CommentMainContent">
                      {/* Avatar reply */}
                      <img
                        src={reply.avatarUrl || defaultAvatar}
                        className="CommentAvatar CommentReplyAvatarSmall"
                        alt="avatar"
                        onClick={() => navigate(`/nguoi-dung/${reply.userId}`)}
                        onError={(e) => (e.target.src = defaultAvatar)}
                      />

                      {/* Nội dung reply */}
                      <div className="CommentContentWrapper">
                        {/* Header reply */}
                        <div className="CommentHeader">
                          <div className="CommentUserInfo">
                            <span 
                              className="CommentUserName CommentReplyUserName"
                              onClick={() => navigate(`/nguoi-dung/${reply.userId}`)}
                            >
                              @{reply.userName}
                            </span>
                            
                            <span className="CommentReplyToText">
                              đã phản hồi @{comment.userName}
                            </span>
                            
                            {reply.isAuthor && (
                              <span className="CommentAuthorBadge">
                                • Tác giả
                              </span>
                            )}
                            
                            {reply.isOptimistic && (
                              <span className="CommentSendingStatus">
                                • Đang gửi...
                              </span>
                            )}
                          </div>

                          {/* Menu 3 chấm cho reply */}
                          {reply.userId === currentUserId && !reply.isOptimistic && 
                          (hoveredCommentId === reply.id || menuOpenId === reply.id) && (
                            <div
                              className="CommentMenuButton"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === reply.id ? null : reply.id);
                              }}
                              title="Tùy chọn"
                            >
                              <BsThreeDots /> {/* <-- THAY ĐỔI ICON */}
                            </div>
                          )}
                        </div>

                        {/* Nội dung reply */}
                        <div className="CommentContent CommentReplyContent">
                          {reply.content}
                        </div>

                        {/* Action buttons reply */}
                        <div className="CommentActions">
                          {/* Nút trả lời cho reply - TRẢ LỜI VÀO COMMENT GỐC */}
                          {token && (
                            <button
                              onClick={() => {
                                if (activeReplyId === reply.id) {
                                  setActiveReplyId(null);
                                  setReplyContent('');
                                } else {
                                  setActiveReplyId(reply.id);
                                  setReplyContent(`@${reply.userName} `);
                                }
                              }}
                              disabled={reply.isOptimistic}
                              className={`CommentReplyButton ${activeReplyId === reply.id ? 'CommentReplyButtonActive' : ''} ${reply.isOptimistic ? 'CommentReplyButtonDisabled' : ''}`}
                            >
                              {/* <-- THAY ĐỔI ICON --> */}
                              {activeReplyId === reply.id ? <FaTimes /> : <FaReply />}
                              {activeReplyId === reply.id ? 'Hủy' : 'Trả lời'}
                            </button>
                          )}

                          {/* Thời gian reply */}
                          <span className="CommentTime">
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
                          <div className="CommentDeleteMenu">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(null);
                                handleDeleteComment(reply.id);
                              }}
                              className="CommentDeleteMenuItem"
                            >
                              <FaTrash /> Xóa bình luận {/* <-- THAY ĐỔI ICON */}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* FORM TRẢ LỜI XUẤT HIỆN NGAY DƯỚI REPLY NÀY */}
                {activeReplyId === reply.id && token && (
                  <div className="CommentReplyForm CommentReplyFormAfterReply">
                    <div className="CommentReplyFormContent">
                      <img
                        src={user?.avatarUrl || defaultAvatar}
                        alt="Your avatar"
                        className="CommentReplyAvatar"
                      />
                      
                      <div className="CommentReplyInputWrapper">
                        <textarea
                          placeholder={`Trả lời @${reply.userName}...`}
                          value={replyContent}
                          onChange={(e) => {
                            if (e.target.value.length <= 150) {
                              setReplyContent(e.target.value);
                            }
                          }}
                          onInput={handleTextareaChange}
                          maxLength={150}
                          rows={1}
                          className="CommentReplyTextarea"
                        />
                        
                        <div className="CommentReplyFormFooter">
                          <span className="CommentReplyCharCount">
                            {replyContent.length}/150
                          </span>
                          
                          <div className="CommentReplyFormButtons">
                            <button
                              onClick={() => {
                                setActiveReplyId(null);
                                setReplyContent('');
                              }}
                              className="CommentReplyCancelButton"
                            >
                              Hủy
                            </button>
                            
                            <button
                              onClick={() => handleReplySubmit(comment.id)}
                              disabled={!replyContent.trim()}
                              className={`CommentReplySubmitButton ${!replyContent.trim() ? 'CommentReplySubmitButtonDisabled' : ''}`}
                            >
                              Gửi
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
    <div className="CommentDrawerOverlay" onClick={onClose}>
      <div
        className="CommentDrawer"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
      >
        <div className="CommentDrawerHeader">
          <span>Bình luận ({totalComments})</span>
          <button onClick={onClose} className="CommentDrawerCloseButton">
            <IoClose /> {/* <-- THAY ĐỔI ICON */}
          </button>
        </div>

        <div className="CommentList">
          {comments.length === 0 && (
            <p className="CommentNoComment">
              Chưa có bình luận nào.
            </p>
          )}
          {comments.map(comment => renderComment(comment))}
        </div>

        {/* Input area cho comment mới */}
        {token && (
          <div className="CommentInputArea">
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
              className="CommentInputTextarea"
            />
            <div className="CommentInputFooter">
              <span className="CommentInputCharCount">
                {newComment.length}/150
              </span>
              <button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className={`CommentInputSubmitButton ${!newComment.trim() ? 'CommentInputSubmitButtonDisabled' : ''}`}
              >
                Gửi
              </button>
            </div>
          </div>
        )}

        {!token && (
          <div className="CommentLoginPrompt">
            Đăng nhập để bình luận
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentDrawer;