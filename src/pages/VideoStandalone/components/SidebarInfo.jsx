import React, {
    useState,
    useContext,
    useRef,
    useEffect
} from 'react';

import axios from 'axios';
import { IoCloseOutline } from 'react-icons/io5';

import { AuthContext } from "../../../context/AuthContext";
import styles from './SidebarInfo.module.css';

import SuggestedVideoList from './SuggestedVideoList';
import CommentList from './CommentList';

const API_BASE = "http://localhost:5133";

const SidebarInfo = ({
    videoData,
    activeTab,
    setActiveTab,
    fullVideoList,
    currentVideoId,
    onLoadMore,
    hasMore,
    
    // 🔥 PROP TỪ URL (Highligh comment)
    highlightCommentId
}) => {
    // 🔥 Lấy token và user từ Context
    const { token, user } = useContext(AuthContext);

    /* ======================================================
       STATE
    ====================================================== */
    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [isPosting, setIsPosting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // 🔥 STATE MỚI CHO MODAL XÓA (Code 2)
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);

    const textareaRef = useRef(null);

    /* ======================================================
       AUTO RESIZE TEXTAREA
    ====================================================== */
    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height =
            commentText === ''
                ? '20px'
                : `${textareaRef.current.scrollHeight}px`;
    }, [commentText]);

    /* ======================================================
       POST COMMENT
    ====================================================== */
    const handlePostCommentGeneric = async (content, parentId = null) => {
        if (!content.trim()) return;

        if (!token) {
            alert("Vui lòng đăng nhập để bình luận!");
            return;
        }

        try {
            setIsPosting(true);

            await axios.post(
                `${API_BASE}/api/Video/${videoData.maTinDang}/comment`,
                {
                    Content: content,
                    ParentCommentId: parentId
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Reset sau khi post
            setCommentText('');
            setReplyingTo(null);
            setRefreshKey(prev => prev + 1);

        } catch (error) {
            console.error("Lỗi gửi comment:", error);
        } finally {
            setIsPosting(false);
        }
    };

    /* ======================================================
       DELETE COMMENT LOGIC (Sử dụng Modal từ Code 2)
    ====================================================== */
    
    // 1. Hàm được gọi khi nhấn nút "Xóa" ở CommentList -> Mở Modal
    const handleDeleteComment = (commentId) => {
        if (!token) return;
        setCommentToDelete(commentId);
        setShowDeleteModal(true);
    };

    // 2. Hàm thực thi xóa thật sự (Khi bấm nút "Xóa" trong Modal)
    const confirmDelete = async () => {
        if (!commentToDelete) return;
        
        try {
            await axios.delete(`${API_BASE}/api/Video/comment/${commentToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Xóa thành công
            setRefreshKey(prev => prev + 1); // Reload list
            setShowDeleteModal(false);       // Đóng modal
            setCommentToDelete(null);        // Reset ID
            
        } catch (error) {
            console.error("Lỗi xóa comment:", error);
            alert("Không thể xóa bình luận (Có thể do lỗi mạng hoặc quyền truy cập).");
            setShowDeleteModal(false);
        }
    };

    // 3. Hủy xóa -> Đóng Modal
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setCommentToDelete(null);
    };

    /* ======================================================
       HANDLERS GIAO DIỆN
    ====================================================== */
    const handleReplyClick = (comment) => {
        setReplyingTo(comment);
        setActiveTab('comments');
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setCommentText('');
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        if (val.length <= 150) {
            setCommentText(val);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handlePostCommentGeneric(
                commentText,
                replyingTo ? replyingTo.id : null
            );
        }
    };

    if (!videoData) return null;

    /* ======================================================
       RENDER
    ====================================================== */
    return (
        <div className={styles.sidebarContainer}>

            {/* ===================== TABS ===================== */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tabItem} ${
                        activeTab === 'comments' ? styles.active : ''
                    }`}
                    onClick={() => setActiveTab('comments')}
                >
                    Bình luận ({videoData.soBinhLuan || 0})
                </button>

                <button
                    className={`${styles.tabItem} ${
                        activeTab === 'suggested' ? styles.active : ''
                    }`}
                    onClick={() => setActiveTab('suggested')}
                >
                    Đề xuất ({fullVideoList ? fullVideoList.length : 0})
                </button>
            </div>

            {/* ===================== BODY (SCROLL) ===================== */}
            <div className={`${styles.scrollContent} sidebar-content-scroll`}>
                
                {/* --- TAB COMMENTS --- */}
                <div style={{ display: activeTab === 'comments' ? 'block' : 'none' }}>
                    <CommentList
                        videoId={videoData.maTinDang}
                        refreshTrigger={refreshKey}
                        onReply={handleReplyClick}
                        onPostReply={handlePostCommentGeneric}
                        highlightCommentId={highlightCommentId}

                        // 🔥 TRUYỀN HÀM MỞ MODAL XUỐNG
                        currentUser={user} 
                        onDeleteComment={handleDeleteComment}
                    />
                </div>

                {/* --- TAB SUGGESTED --- */}
                <div style={{ display: activeTab === 'suggested' ? 'block' : 'none' }}>
                    <SuggestedVideoList
                        videos={fullVideoList}
                        currentVideoId={currentVideoId}
                        onLoadMore={onLoadMore}
                        hasMore={hasMore}
                    />
                </div>
            </div>

            {/* ===================== FOOTER INPUT ===================== */}
            {activeTab === 'comments' && (
                <div className={styles.commentInputArea}>
                    <div className={styles.inputWrapper}>
                        {/* Thanh trạng thái Reply */}
                        {replyingTo && (
                            <div className={styles.replyingBar}>
                                <span>
                                    Đang trả lời <b>{replyingTo.userName}</b>
                                </span>
                                <IoCloseOutline
                                    className={styles.cancelReplyBtn}
                                    onClick={handleCancelReply}
                                />
                            </div>
                        )}

                        {/* Textarea */}
                        <textarea
                            ref={textareaRef}
                            className={styles.inputBox}
                            placeholder={
                                replyingTo
                                    ? `Trả lời ${replyingTo.userName}...`
                                    : "Thêm bình luận..."
                            }
                            value={commentText}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={isPosting}
                            rows={1}
                        />

                        {/* Counter */}
                        <span
                            className={`${styles.charCounter} ${
                                commentText.length >= 150
                                    ? styles.limitReached
                                    : ''
                            }`}
                        >
                            {commentText.length}/150
                        </span>
                    </div>

                    <button
                        className={styles.postBtn}
                        onClick={() =>
                            handlePostCommentGeneric(
                                commentText,
                                replyingTo ? replyingTo.id : null
                            )
                        }
                        disabled={isPosting || !commentText.trim()}
                        style={{ opacity: commentText.trim() ? 1 : 0.5 }}
                    >
                        {isPosting ? '...' : 'Đăng'}
                    </button>
                </div>
            )}

            {/* 🔥 PHẦN MODAL CONFIRM DELETE (MỚI) */}
            {showDeleteModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3 className={styles.modalTitle}>Xóa bình luận?</h3>
                        <p className={styles.modalDesc}>
                            Bạn có chắc chắn muốn xóa bình luận này không? <br/>
                            Hành động này không thể hoàn tác.
                        </p>
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.btnCancel} 
                                onClick={cancelDelete}
                            >
                                Hủy
                            </button>
                            <button 
                                className={styles.btnDelete} 
                                onClick={confirmDelete}
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SidebarInfo;