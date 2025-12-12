import React, { useState, useContext } from 'react';
import axios from 'axios';

// --- IMPORT CONTEXT & CSS ---
import { AuthContext } from '../../../context/AuthContext'; 
import styles from './SidebarInfo.module.css';

// --- IMPORT COMPONENTS CON ---
import SuggestedVideoList from './SuggestedVideoList';
import CommentList from './CommentList'; 

const API_BASE = "http://localhost:5133";

// 1. Thêm prop onDataLoaded vào danh sách nhận
const SidebarInfo = ({ videoData, activeTab, setActiveTab, onDataLoaded }) => {
  const { token } = useContext(AuthContext);

  // State cho input bình luận
  const [commentText, setCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  // State để trigger reload danh sách comment sau khi đăng
  const [refreshKey, setRefreshKey] = useState(0); 

  // --- HÀM GỬI BÌNH LUẬN ---
  const handlePostComment = async () => {
      if (!commentText.trim()) return;
      if (!token) {
          alert("Vui lòng đăng nhập để bình luận!");
          return;
      }

      try {
          setIsPosting(true);
          await axios.post(
              `${API_BASE}/api/Video/${videoData.maTinDang}/comment`,
              { Content: commentText, ParentCommentId: null },
              { headers: { Authorization: `Bearer ${token}` } }
          );
          setCommentText('');
          setRefreshKey(prev => prev + 1); // Reload list comment
      } catch (error) {
          console.error("Lỗi gửi comment:", error);
      } finally {
          setIsPosting(false);
      }
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') handlePostComment();
  };

  if (!videoData) return null;

  return (
    <div className={styles.sidebarContainer}>
      
      {/* 1. THANH TAB (HEADER) */}
      <div className={styles.tabs}>
        <button 
            className={`${styles.tabItem} ${activeTab === 'comments' ? styles.active : ''}`}
            onClick={() => setActiveTab('comments')}
        >
            Bình luận ({videoData.soBinhLuan})
        </button>
        <button 
            className={`${styles.tabItem} ${activeTab === 'suggested' ? styles.active : ''}`}
            onClick={() => setActiveTab('suggested')}
        >
            Đề xuất khác
        </button>
      </div>

      {/* 2. NỘI DUNG CUỘN (BODY) */}
      {/* LƯU Ý QUAN TRỌNG: 
         Thay vì dùng toán tử 3 ngôi (condition ? A : B), ta render cả 2 nhưng ẩn hiện bằng CSS.
         Điều này giúp SuggestedVideoList luôn chạy để lấy dữ liệu "Next Video" gửi lên cha.
      */}
      <div className={`${styles.scrollContent} sidebar-content-scroll`}>
        
        {/* Tab Bình luận */}
        <div style={{ display: activeTab === 'comments' ? 'block' : 'none' }}>
           <CommentList 
                videoId={videoData.maTinDang} 
                refreshTrigger={refreshKey} 
           />
        </div>

        {/* Tab Đề xuất */}
        <div style={{ display: activeTab === 'suggested' ? 'block' : 'none' }}>
           <SuggestedVideoList 
                currentVideoId={videoData.maTinDang}
                
                // --- QUAN TRỌNG: Truyền prop này xuống để list gửi dữ liệu ngược lên ---
                onDataLoaded={onDataLoaded} 
           />
        </div>

      </div>

      {/* 3. KHUNG NHẬP BÌNH LUẬN (FOOTER) - Chỉ hiện khi ở Tab Bình Luận */}
      {activeTab === 'comments' && (
        <div className={styles.commentInputArea}>
           <input 
             type="text" 
             className={styles.inputBox}
             placeholder="Thêm bình luận..." 
             value={commentText}
             onChange={(e) => setCommentText(e.target.value)}
             onKeyDown={handleKeyDown}
             disabled={isPosting}
           />
           <button 
             className={styles.postBtn} 
             onClick={handlePostComment}
             disabled={isPosting || !commentText.trim()}
             style={{opacity: commentText.trim() ? 1 : 0.5}}
           >
             {isPosting ? '...' : 'Đăng'}
           </button>
        </div>
      )}
    </div>
  );
};

export default SidebarInfo;