import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- ICONS ---
import { IoPlay, IoHeart, IoChatbubbleEllipses, IoBookmark, IoShareSocial, IoMusicalNotes } from 'react-icons/io5';
import { FaPlus } from 'react-icons/fa';

// --- STYLES ---
import styles from './VideoPlayerSection.module.css';

const API_BASE = "http://localhost:5133";

// Thêm prop isActive vào danh sách props
const VideoPlayerSection = ({ 
    videoData, 
    token, 
    currentUser, 
    onUpdateVideo, 
    onOpenComments, 
    isActive,
    onRatioChange // <--- THÊM PROP NÀY
}) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  // State Player
  const [isPlaying, setIsPlaying] = useState(false); // Mặc định false, chờ isActive kích hoạt
  const [showHeart, setShowHeart] = useState(false);
  
  // Check tỷ lệ video
  const [isLandscape, setIsLandscape] = useState(false); 

  // State Tương tác
  const [isLiked, setIsLiked] = useState(videoData?.isLiked || false);
  const [likeCount, setLikeCount] = useState(videoData?.soTym || 0);
  const [isSaved, setIsSaved] = useState(videoData?.isSaved || false);
  const [saveCount, setSaveCount] = useState(videoData?.soNguoiLuu || 0);
  const [isFollowing, setIsFollowing] = useState(false);

  // Refs Click
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef(null);

  // --- MÀU ICON ---
  const iconBaseColor = "#161823"; 
  
  // 1. Sync State: Cập nhật dữ liệu khi videoData thay đổi
  useEffect(() => {
    if (!videoData) return;
    setIsLiked(videoData.isLiked);
    setLikeCount(videoData.soTym);
    setIsSaved(videoData.isSaved);
    setSaveCount(videoData.soNguoiLuu);
    setIsLandscape(false);

    if (videoData.nguoiDang?.id && token) {
        axios.get(`${API_BASE}/api/follow/is-following/${videoData.nguoiDang.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setIsFollowing(res.data.isFollowing))
        .catch(() => setIsFollowing(false));
    }
  }, [videoData, token]);

  // 2. Logic Play/Pause dựa trên isActive (Thay thế cho Autoplay cũ)
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      // Nếu video đang hiển thị -> Play
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Autoplay prevented:", err);
            setIsPlaying(false);
          });
      }
    } else {
      // Nếu video bị cuộn đi -> Pause và Reset về 0
      videoRef.current.pause();
      videoRef.current.currentTime = 0; 
      setIsPlaying(false);
    }
  }, [isActive, videoData]); 

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Hàm check tỷ lệ
    const checkRatio = () => {
        if (videoEl.videoWidth && videoEl.videoHeight) {
            if (videoEl.videoWidth >= videoEl.videoHeight) {
                setIsLandscape(true);
            } else {
                setIsLandscape(false);
            }
        }
    };

    // Nếu video đã có metadata (readyState >= 1), check ngay lập tức
    if (videoEl.readyState >= 1) {
        checkRatio();
    }

    // Vẫn lắng nghe sự kiện đề phòng video chưa load
    videoEl.addEventListener('loadedmetadata', checkRatio);
    
    return () => {
        videoEl.removeEventListener('loadedmetadata', checkRatio);
    };
}, [videoData]);

  // 3. Metadata: Kiểm tra tỷ lệ khung hình
  const handleLoadedMetadata = (e) => {
      const vid = e.target;
      if (vid.videoWidth >= vid.videoHeight) {
          setIsLandscape(true);
      } else {
          setIsLandscape(false);
      }
      // Không gọi vid.play() ở đây nữa, để useEffect(isActive) quản lý
  };

  // --- HANDLERS ---
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleLike = async () => {
    if (!token) return alert("Bạn cần đăng nhập để thả tim!");
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    try {
      const res = await axios.post(`${API_BASE}/api/video/${videoData.maTinDang}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLiked(res.data.isLiked);
      setLikeCount(res.data.soTym);
      if (onUpdateVideo) onUpdateVideo({ isLiked: res.data.isLiked, soTym: res.data.soTym });
    } catch (error) {
      console.error("Lỗi like:", error);
      setIsLiked(!newLikedState);
      setLikeCount(prev => !newLikedState ? prev + 1 : prev - 1);
    }
  };

  const handleSave = async () => {
    if (!token) return alert("Bạn cần đăng nhập để lưu video!");
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    setSaveCount(prev => newSavedState ? prev + 1 : Math.max(0, prev - 1));
    try {
      const res = await axios.post(`${API_BASE}/api/video/ToggleSave`, 
        { maTinDang: videoData.maTinDang }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setIsSaved(res.data.saved);
      setSaveCount(res.data.totalSaves);
      if (onUpdateVideo) onUpdateVideo({ isSaved: res.data.saved, soNguoiLuu: res.data.totalSaves });
    } catch (error) {
      console.error("Lỗi save:", error);
    }
  };

  const handleFollow = async () => {
    if (!token) return alert("Bạn cần đăng nhập để follow!");
    try {
        const url = `${API_BASE}/api/follow/${isFollowing ? "unfollow" : "follow"}?followingId=${videoData.nguoiDang.id}`;
        await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
        setIsFollowing(!isFollowing);
    } catch (err) {
        console.error(err);
    }
  };

  const handleVideoClick = (e) => {
    e.stopPropagation();
    clickCountRef.current += 1;
    if (clickCountRef.current === 1) {
      clickTimeoutRef.current = setTimeout(() => {
        handleTogglePlay();
        clickCountRef.current = 0;
      }, 250);
    } else if (clickCountRef.current === 2) {
      clearTimeout(clickTimeoutRef.current);
      if (!isLiked) handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      clickCountRef.current = 0;
    }
  };

  if (!videoData) return null;
  const avatarUrl = videoData.nguoiDang?.avatarUrl || "https://via.placeholder.com/150";

  return (
    // Đã bỏ id="video-player-container" vì không bắt sự kiện scroll thủ công nữa
    <div className={styles.container}>
      
      {/* KHỐI CHÍNH: Bao gồm Video (Trái) và Nút bấm (Phải) */}
      <div className={styles.mainContent}>

          {/* 1. KHUNG VIDEO */}
          <div 
            className={`${styles.videoWrapper} ${isLandscape ? styles.landscapeWrapper : ''}`} 
            onClick={handleVideoClick}
          >
            <video
              ref={videoRef}
              className={styles.videoPlayer}
              src={videoData.videoUrl}
              poster={videoData.hinhAnh}
              loop
              playsInline
              controls={false}
              onLoadedMetadata={handleLoadedMetadata}
            />
            
            {!isPlaying && (
              <div className={styles.playIconOverlay}>
                <IoPlay size={70} color="rgba(255,255,255,0.8)" />
              </div>
            )}

            {showHeart && (
               <div className={styles.heartAnimation}>
                 <IoHeart size={100} color="#fe2c55" />
               </div>
            )}

            {/* Thông tin chữ vẫn nằm TRONG video cho gọn */}
            <div className={styles.infoOverlay}>
              <div className={styles.authorRow} onClick={(e) => {e.stopPropagation(); navigate(`/nguoi-dung/${videoData.nguoiDang?.id}`)}}>
                  <span className={styles.authorName}>@{videoData.nguoiDang?.fullName}</span>
              </div>
              <div className={styles.description}>{videoData.moTa}</div>
              <div className={styles.musicRow}>
                 <IoMusicalNotes className={styles.musicIcon} />
                 <div className={styles.musicText}>Nhạc nền - {videoData.nguoiDang?.fullName}</div>
              </div>
            </div>
          </div>

          {/* 2. CỘT NÚT BẤM */}
          <div className={styles.sideActions}>
             
             {/* Avatar */}
             <div className={styles.actionItemAvatar} onClick={() => navigate(`/nguoi-dung/${videoData.nguoiDang?.id}`)}>
                 <div className={styles.avatarContainer}>
                     <img src={avatarUrl} className={styles.avatarImg} alt="avatar" />
                 </div>
                 {!isFollowing && currentUser?.id !== videoData.nguoiDang?.id && (
                     <div className={styles.plusIcon} onClick={(e) => { e.stopPropagation(); handleFollow(); }}>
                         <FaPlus size={10} color="#fff" />
                     </div>
                 )}
             </div>
             
             {/* Like */}
             <div className={styles.actionItem} onClick={handleLike}>
                 <div className={styles.iconCircle}>
                     <IoHeart size={32} color={isLiked ? "#fe2c55" : iconBaseColor} />
                 </div>
                 <span className={styles.actionText}>{likeCount}</span>
             </div>
             
             {/* Comment */}
             <div className={styles.actionItem} onClick={onOpenComments}>
                 <div className={styles.iconCircle}>
                     <IoChatbubbleEllipses size={32} color={iconBaseColor} />
                 </div>
                 <span className={styles.actionText}>{videoData.soBinhLuan}</span>
             </div>

             {/* Save */}
             <div className={styles.actionItem} onClick={handleSave}>
                 <div className={styles.iconCircle}>
                     <IoBookmark size={32} color={isSaved ? "#face15" : iconBaseColor} />
                 </div>
                 <span className={styles.actionText}>{saveCount}</span>
             </div>

             {/* Share */}
             <div className={styles.actionItem}>
                 <div className={styles.iconCircle}>
                     <IoShareSocial size={32} color={iconBaseColor} />
                 </div>
                 <span className={styles.actionText}>{videoData.soLuotChiaSe}</span>
             </div>

             {/* Disc */}
             <div className={styles.discAnimation}>
                   <img src={avatarUrl} alt="music-disc" />
             </div>
          </div>
          
      </div>
    </div>
  );
};

export default VideoPlayerSection;