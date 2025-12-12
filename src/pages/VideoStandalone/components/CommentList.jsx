import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { IoHeartOutline } from 'react-icons/io5';
import styles from './CommentList.module.css';

// Hàm tính thời gian (ví dụ: "2 giờ trước")
const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
};

const API_BASE = "http://localhost:5133"; // Cấu hình URL API của bạn

const CommentList = ({ videoId, refreshTrigger }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Gọi API lấy danh sách comment
    const fetchComments = async () => {
        try {
            // Nếu list đang trống thì hiện loading, còn đang có data thì không cần hiện (để user đỡ bị nháy)
            if(comments.length === 0) setLoading(true); 
            
            // Gọi API Backend: GetComments
            const res = await axios.get(`${API_BASE}/api/Video/${videoId}/comments`);
            
            // Backend trả về dạng cây (nested replies) hoặc mảng phẳng tùy logic
            // Ở đây ta giả sử API trả về mảng, nếu là cây thì cần hàm đệ quy flatten
            setComments(res.data);
        } catch (error) {
            console.error("Lỗi tải bình luận:", error);
        } finally {
            setLoading(false);
        }
    };

    // Chạy khi videoId đổi HOẶC khi refreshTrigger thay đổi (người dùng vừa post comment)
    useEffect(() => {
        if (videoId) {
            fetchComments();
        }
    }, [videoId, refreshTrigger]);

    if (loading && comments.length === 0) return <div className={styles.loadingText}>Đang tải bình luận...</div>;
    
    if (comments.length === 0) {
        return <div className={styles.emptyText}>Chưa có bình luận nào. Hãy là người đầu tiên!</div>;
    }

    return (
        <div className={styles.listContainer}>
            {comments.map((cmt) => (
                <div key={cmt.id} className={styles.commentItem}>
                    {/* Avatar */}
                    <img 
                        src={cmt.avatarUrl || "/assets/images/default-avatar.png"} 
                        className={styles.avatar} 
                        alt="user"
                        onError={(e) => {e.target.src = "https://via.placeholder.com/32"}}
                    />
                    
                    {/* Nội dung */}
                    <div className={styles.content}>
                        <span className={styles.userName}>{cmt.userName || "Người dùng ẩn danh"}</span>
                        <p className={styles.text}>{cmt.content}</p>
                        
                        <div className={styles.metaData}>
                            <span className={styles.time}>{formatTimeAgo(cmt.createdAt)}</span>
                            <button className={styles.replyBtn}>Trả lời</button>
                        </div>
                    </div>

                    {/* Like Comment (Icon trái tim nhỏ) */}
                    <div className={styles.likeContainer}>
                        <IoHeartOutline size={16} color="#888" />
                        <span className={styles.likeCount}>0</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CommentList;