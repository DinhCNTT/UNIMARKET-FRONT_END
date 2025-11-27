import React, { useEffect, useState, useContext, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import styles from './PostComments.module.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import defaultAvatar from '../assets/default-avatar.png';
import toast from 'react-hot-toast';

// IMPORT MODAL 
import PostCommentModal from './PostCommentModal';

const PostComments = ({ maTinDang }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  // State quản lý việc trả lời
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState({});
  
  // --- STATE MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();
  const pollIntervalRef = useRef(null);
  const { token, user } = useContext(AuthContext);
  const currentUserId = user?.id;

  // 1. Fetch Comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5133/api/video/${maTinDang}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy bình luận:", err);
    }
  }, [maTinDang]);

  // 2. Polling
  useEffect(() => {
    fetchComments();
    pollIntervalRef.current = setInterval(fetchComments, 3000);
    return () => clearInterval(pollIntervalRef.current);
  }, [fetchComments]);

  // Tính tổng số comment
  const totalComments = useMemo(() => {
    return comments.reduce((total, cmt) => {
      const replyCount = cmt.replies ? cmt.replies.length : 0;
      return total + 1 + replyCount;
    }, 0);
  }, [comments]);

  // 3. Xử lý Gửi Comment
  const handleSubmit = async (parentId = null, content = '') => {
    if (!token) return toast.error("Vui lòng đăng nhập!");
    if (!content.trim()) return;

    const payload = { content: content.trim(), parentCommentId: parentId };
    
    // -- Optimistic Update --
    const tempId = Date.now();
    const optimisticComment = {
      id: tempId,
      content: payload.content,
      userName: user?.fullName || 'Bạn',
      userId: currentUserId,
      avatarUrl: user?.avatarUrl,
      createdAt: new Date().toISOString(),
      replies: [],
      isOptimistic: true
    };

    if (parentId) {
      setComments(prev => prev.map(c => {
         if (c.id === parentId) {
             return { ...c, replies: [...(c.replies || []), optimisticComment] };
         }
         return c;
      }));
      setReplyContent('');
      setActiveReplyId(null);
      setExpandedThreads(prev => ({ ...prev, [parentId]: true }));
    } else {
      setComments(prev => [optimisticComment, ...prev]);
      setNewComment('');
    }

    try {
      await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/comment`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchComments(); 
    } catch (err) {
      toast.error("Gửi thất bại");
      fetchComments(); 
    }
  };

  const handleTextareaChange = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // 4. Render 1 Item Comment
  const renderItem = (cmt, rootCommentId = null, isPreview = false) => {
    const isMyComment = cmt.userId === currentUserId;
    const parentIdForReply = rootCommentId || cmt.id;

    return (
        <div key={cmt.id} className={styles.commentItem}>
            <img 
                src={cmt.avatarUrl || defaultAvatar} 
                className={styles.avatar} 
                onClick={() => navigate(`/nguoi-dung/${cmt.userId}`)}
                alt="avt"
            />
            <div className={styles.contentWrapper}>
                <div className={styles.bubble}>
                    <span 
                        className={styles.userName} 
                        onClick={() => navigate(`/nguoi-dung/${cmt.userId}`)}
                    >
                        {cmt.userName}
                    </span>
                    {cmt.isAuthor && <span className={styles.authorBadge}>Người bán</span>}
                    <div className={styles.text}>{cmt.content}</div>
                </div>
                
                <div className={styles.actions}>
                    <span className={styles.time}>
                        {new Date(cmt.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    
                    {token && (
                        <button 
                            className={styles.actionBtn}
                            onClick={() => {
                                if (isPreview) {
                                    setIsModalOpen(true);
                                } else {
                                    if (activeReplyId === cmt.id) {
                                        setActiveReplyId(null);
                                    } else {
                                        setActiveReplyId(cmt.id);
                                        setReplyContent(`@${cmt.userName} `);
                                    }
                                }
                            }}
                        >
                            Trả lời
                        </button>
                    )}

                    {isMyComment && !cmt.isOptimistic && (
    <button 
        className={styles.actionBtn} 
        style={{color: '#dc3545'}}
        onClick={() => {
            toast((t) => (
                <div className={styles.toastContainer}>
                    <span className={styles.toastTitle}>Bạn chắc chắn muốn xoá?</span>
                    <div className={styles.toastActions}>
                        {/* Nút Huỷ: Đóng toast */}
                        <button 
                            className={`${styles.toastBtn} ${styles.toastBtnCancel}`}
                            onClick={() => toast.dismiss(t.id)}
                        >
                            Huỷ
                        </button>

                        {/* Nút Xoá: Gọi API xoá & Đóng toast */}
                        <button 
                            className={`${styles.toastBtn} ${styles.toastBtnDelete}`}
                            onClick={async () => {
                                toast.dismiss(t.id); // Đóng hộp thoại hỏi trước
                                try {
                                    await axios.delete(`http://localhost:5133/api/video/comment/${cmt.id}`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    toast.success("Đã xoá bình luận");
                                    fetchComments();
                                } catch(e) { 
                                    toast.error("Lỗi khi xoá"); 
                                }
                            }}
                        >
                            Xoá ngay
                        </button>
                    </div>
                </div>
            ), {
                duration: 5000, // Tự tắt sau 5s nếu ko bấm
                position: 'top-center',
                style: {
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(16, 16, 16, 0.08)', // Đổ bóng mềm
                    padding: '16px',
                    border: '1px solid #f0f0f0'
                },
            });
        }}
    >
        Xoá
    </button>
)}
                </div>

                {/* Form trả lời */}
                {activeReplyId === cmt.id && !isPreview && (
                    <div className={styles.inlineReplyBox}>
                        <textarea
                            className={styles.textarea}
                            autoFocus
                            onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`Trả lời ${cmt.userName}...`}
                            rows={1}
                            onInput={handleTextareaChange}
                        />
                         <div className={styles.footer} style={{justifyContent: 'flex-end', gap: 5}}>
                            <button className={`${styles.actionBtn} ${styles.cancelBtn}`} onClick={() => setActiveReplyId(null)}>Huỷ</button>
                            <button 
                                className={styles.sendBtn} 
                                onClick={() => handleSubmit(parentIdForReply, replyContent)}
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };

  // --- HÀM RENDER LIST COMMENT ---
  const renderCommentList = (listToRender, isPreview = false) => (
    <div className={styles.commentList}>
        {listToRender.length === 0 && <div className={styles.noComment}>Chưa có bình luận nào. Hãy là người đầu tiên!</div>}
        
        {listToRender.map(cmt => (
            <div key={cmt.id}>
                {renderItem(cmt, null, isPreview)}
                
                {cmt.replies && cmt.replies.length > 0 && (
                    <div className={styles.repliesContainer}>
                        {!expandedThreads[cmt.id] || isPreview ? (
                             <button 
                                className={styles.toggleRepliesBtn}
                                onClick={() => {
                                    if (isPreview) {
                                        setIsModalOpen(true);
                                    } else {
                                        setExpandedThreads(prev => ({...prev, [cmt.id]: true}))
                                    }
                                }}
                             >
                                <span className={styles.replyLine}></span> 
                                {isPreview ? `Xem thêm ${cmt.replies.length} phản hồi` : `Xem ${cmt.replies.length} phản hồi`}
                             </button>
                        ) : (
                            <>
                                {cmt.replies.map(rep => renderItem(rep, cmt.id, false))}
                                <button 
                                    className={styles.toggleRepliesBtn}
                                    onClick={() => setExpandedThreads(prev => ({...prev, [cmt.id]: false}))}
                                 >
                                    <span className={styles.replyLine}></span> Ẩn phản hồi
                                 </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        ))}
    </div>
  );

  // --- RENDER INPUT AREA ---
  const renderInputArea = () => (
    <div className={styles.inputArea}>
        {token ? (
            <div className={styles.inputWrapper}>
                <img src={user?.avatarUrl || defaultAvatar} className={styles.myAvatar} alt="me"/>
                <div className={styles.inputRight}>
                    <textarea
                        className={styles.textarea}
                        placeholder="Viết bình luận..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onInput={handleTextareaChange}
                        maxLength={200}
                    />
                    <div className={styles.inputFooter}>
                         <button 
                            className={styles.sendBtn} 
                            disabled={!newComment.trim()}
                            onClick={() => handleSubmit(null, newComment)}
                        >
                            Gửi
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <div className={styles.loginPrompt} onClick={() => navigate('/login')}>
                Đăng nhập để bình luận
            </div>
        )}
    </div>
  );

  // === PREVIEW LIST: Chỉ lấy tối đa 3 comment gốc ===
  const previewComments = comments.slice(0, 3);
  const hasMore = comments.length > 3;

  return (
    <>
        {/* --- KHỐI BÌNH LUẬN TRÊN TRANG (PREVIEW) --- */}
        <div className={styles.container}>
            <div className={styles.header}>
                Bình luận <span className={styles.count}>({totalComments})</span>
            </div>
            
            {/* List rút gọn */}
            <div className={styles.previewListWrapper}>
                {renderCommentList(previewComments, true)}
            </div>

            {/* Nút Xem thêm */}
            {hasMore && (
                <button className={styles.seeMoreBtn} onClick={() => setIsModalOpen(true)}>
                    Xem thêm {totalComments - 3} bình luận
                </button>
            )}

            {/* Input ở trang chính */}
            {renderInputArea()}
        </div>

        {/* --- SỬ DỤNG COMPONENT MODAL --- */}
        <PostCommentModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            totalComments={totalComments}
            commentListContent={renderCommentList(comments, false)}
            inputAreaContent={renderInputArea()}
        />
    </>
  );
};

export default PostComments;