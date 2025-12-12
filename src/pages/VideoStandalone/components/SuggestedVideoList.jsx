import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Import CSS Module
import styles from './SuggestedVideoList.module.css';

const API_BASE = "http://localhost:5133"; 

const SuggestedVideoList = ({ currentVideoId, onDataLoaded }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        setLoading(true);
        // Gọi API lấy danh sách video đề xuất (loại trừ video đang xem)
        const res = await axios.post(`${API_BASE}/api/Recommendation/foryou`, {
           PageSize: 10,
           ExcludedIds: [currentVideoId] 
        });
        setVideos(res.data);

        // --- QUAN TRỌNG: Gửi dữ liệu ra ngoài cho VideoStandalonePage ---
        // Để trang cha biết video tiếp theo là gì mà thực hiện cuộn
        if (onDataLoaded && res.data.length > 0) {
            onDataLoaded(res.data);
        }
        // -------------------------------------------------------------

      } catch (error) {
        console.error("Lỗi tải đề xuất:", error);
      } finally {
        setLoading(false);
      }
    };

    if(currentVideoId) {
        fetchSuggested();
    }
  }, [currentVideoId]); // Bỏ onDataLoaded khỏi dependency để tránh render loop

  if (loading) return <div className={styles.loading}>Đang tải đề xuất...</div>;

  return (
    <div className={styles.gridContainer}>
       {videos.map(vid => (
          <div 
            key={vid.maTinDang} 
            className={styles.card}
            onClick={() => {
                // --- SỬA LỖI TẠI ĐÂY ---
                // Phải điều hướng sang route 'video-standalone' để giữ giao diện TikTok
                navigate(`/video-standalone/${vid.maTinDang}`);
                
                // Scroll thanh sidebar lên đầu để trải nghiệm tốt hơn
                const sidebar = document.querySelector('.sidebar-content-scroll'); 
                if(sidebar) sidebar.scrollTop = 0;
            }}
          >
             {/* Khung ảnh video */}
             <div className={styles.imageWrapper}>
                 <img 
                    src={vid.hinhAnh || "/assets/images/placeholder.png"} 
                    alt={vid.tieuDe}
                    className={styles.image}
                    onError={(e) => {e.target.src = "https://via.placeholder.com/150x266?text=No+Image"}}
                 />
                 <div className={styles.viewsOverlay}>
                    <span>▶</span> {vid.soLuotXem}
                 </div>
             </div>
             
             {/* Thông tin bên dưới */}
             <div className={styles.info}>
                <p className={styles.title}>{vid.tieuDe}</p>
                <div className={styles.author}>
                    <img 
                        src={vid.nguoiDang?.avatarUrl || "/assets/images/default-avatar.png"} 
                        className={styles.smallAvatar} 
                        alt=""
                        onError={(e) => {e.target.src = "https://via.placeholder.com/20"}}
                    />
                    <span>{vid.nguoiDang?.fullName}</span>
                </div>
             </div>
          </div>
       ))}
    </div>
  );
};

export default SuggestedVideoList;