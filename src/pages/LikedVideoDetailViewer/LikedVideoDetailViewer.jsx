import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
// ✅ 1. Import createPortal để đưa giao diện ra ngoài khung chat
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeftCircle, FiChevronUp, FiChevronDown } from "react-icons/fi";
import styles from "./LikedVideoDetailViewer.module.css";

// Import Hooks
import { useVideoPlayer } from "../../hooks/useVideoPlayer";
import { useVideoInteractions } from "../../hooks/useVideoInteractions";
import { useComments } from "../../hooks/useComments.jsx";
import { VideoHubContext } from "../../context/VideoHubContext";

// Import Components
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import VideoInfo from "../../components/VideoDetails/VideoInfo";
import VideoActions from "../../components/VideoDetails/VideoActions";
import CommentSection from "../../components/CommentSection/CommentSection";
import VideoVolumeControl from "../../components/VideoPlayer/VideoVolumeControl";

export default function LikedVideoDetailViewer({ 
  isOverlay = false, 
  passedVideoData = null, 
  onClose 
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { maTinDang: paramMaTinDang } = useParams();

  // ==========================================
  // 1. KHỞI TẠO DỮ LIỆU (HỖ TRỢ CẢ ROUTER VÀ OVERLAY)
  // ==========================================
  
  // Lấy dữ liệu từ Router state (trường hợp không phải overlay)
  const { 
    videos: stateVideos, 
    videoList: stateVideoList, 
    initialIndex: stateInitialIndex = 0,
    returnPath 
  } = location.state || {};

  // Xác định danh sách video ban đầu
  const initialVideos = isOverlay && passedVideoData 
      ? [passedVideoData] 
      : (stateVideos || stateVideoList || null);

  const [videoList, setVideoList] = useState(initialVideos);
  // Nếu là Overlay thì index luôn là 0, ngược lại lấy từ state
  const [currentIndex, setCurrentIndex] = useState(isOverlay ? 0 : stateInitialIndex);
  
  // State quản lý chuyển cảnh (scroll debounce)
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const { videoConnection } = useContext(VideoHubContext);

  // --- Logic lấy video hiện tại (Shallow Video) ---
  const getInitialShallowVideo = () => {
    if (initialVideos && initialVideos[currentIndex]) {
      return initialVideos[currentIndex];
    }
    // Fallback: Vào bằng link trực tiếp (Router)
    if (paramMaTinDang && !isOverlay) {
      return { maTinDang: paramMaTinDang };
    }
    return null;
  };

  // Cập nhật nếu passedVideoData thay đổi (khi click tin nhắn khác lúc đang mở overlay)
  useEffect(() => {
    if (isOverlay && passedVideoData) {
        setVideoList([passedVideoData]);
        setCurrentIndex(0);
    }
  }, [passedVideoData, isOverlay]);

  const [initialShallowVideo] = useState(getInitialShallowVideo());

  // Video đang được chọn
  const shallowVideo = videoList ? videoList[currentIndex] : initialShallowVideo;
  const maTinDangString = shallowVideo?.maTinDang?.toString();

  // ==========================================
  // 2. CÁC HOOKS TƯƠNG TÁC
  // ==========================================

  // --- Hook Tương tác (Like/Save) ---
  const {
    fullVideo,
    isLiked,
    soTym,
    isSaved,
    soNguoiLuu,
    iconCircleRef,
    handleLike,
    handleToggleSave,
  } = useVideoInteractions(shallowVideo, currentIndex);

  // --- Hook Player (Play/Pause/Volume) ---
  const {
    playerRef,
    bgPlayerRef,
    audioRef,
    isPlaying,
    isMuted,
    volume,
    showHeartEffect,
    togglePlayPause,
    showHeart,
    handleVolumeChange,
    toggleMute,
    setIsPlaying,
  } = useVideoPlayer(fullVideo?.videoUrl || shallowVideo?.videoUrl);

  // --- Hook Comments ---
  const {
    comments,
    totalCommentCount,
    currentUserId,
    submitComment,
    deleteComment,
  } = useComments(shallowVideo?.maTinDang);

  // ==========================================
  // 3. XỬ LÝ SỰ KIỆN & NAVIGATE
  // ==========================================

  // --- Xử lý nút Back thông minh ---
  const handleGoBack = (e) => {
    e?.stopPropagation();
    
    // Nếu là Overlay, gọi hàm đóng của cha
    if (isOverlay && onClose) {
        onClose();
        return;
    }

    // Logic Router cũ
    if (returnPath) {
      navigate(returnPath);
    } else {
      navigate(-1);
    }
  };

  // --- Logic Click Double Tim ---
  const clickTimeoutRef = useRef(null);
  const clickCountRef = useRef(0);

  const handleClickVideo = useCallback(() => {
    clickCountRef.current++;
    if (clickCountRef.current >= 2) {
      if (!isLiked) handleLike(showHeart);
      else showHeart();
      
      clickCountRef.current = 0;
      clearTimeout(clickTimeoutRef.current);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        if (clickCountRef.current === 1) {
          togglePlayPause();
        }
        clickCountRef.current = 0;
      }, 300);
    }
  }, [isLiked, handleLike, showHeart, togglePlayPause]);

  // --- Logic Cuộn chuột để đổi video ---
  const handleWheelOnVideo = (e) => {
    // Nếu Overlay hoặc list chỉ có 1 video -> KHÔNG cuộn
    if (isTransitioning || !videoList || videoList.length <= 1) return;

    const delta = e.deltaY;
    const SCROLL_THRESHOLD = 30;

    if (Math.abs(delta) < SCROLL_THRESHOLD) return;

    let nextIndex = currentIndex;

    // Lăn xuống -> Video tiếp theo
    if (delta > 0 && nextIndex < videoList.length - 1) {
      nextIndex++;
    } 
    // Lăn lên -> Video trước đó
    else if (delta < 0 && nextIndex > 0) {
      nextIndex--;
    } else {
      return; 
    }

    if (nextIndex !== currentIndex) {
      setIsTransitioning(true);
      setCurrentIndex(nextIndex);
      setTimeout(() => setIsTransitioning(false), 800);
    }
  };

  // Hàm hỗ trợ nút bấm Next/Prev
  const handleNextVideo = (e) => {
    e.stopPropagation();
    if (currentIndex < (videoList?.length || 0) - 1) {
        setCurrentIndex(prev => prev + 1);
    }
  };
  
  const handlePrevVideo = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
    }
  };

  // ==========================================
  // 4. SIGNALR & RENDER
  // ==========================================

  useEffect(() => {
    if (videoConnection && maTinDangString) {
      videoConnection.invoke("JoinVideoGroup", maTinDangString).catch(console.error);
      return () => {
        videoConnection.invoke("LeaveVideoGroup", maTinDangString).catch(console.error);
      };
    }
  }, [videoConnection, maTinDangString]);

  const videoToDisplay = fullVideo || shallowVideo;

  if (!videoToDisplay?.maTinDang)
    return <div className={styles.loading}>Đang tải video...</div>;

  // ✅ CSS Style đè lên nếu là Overlay để chiếm toàn màn hình
  const overlayStyle = isOverlay ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw', // Full chiều ngang
    height: '100vh', // Full chiều dọc
    zIndex: 99999, // Đè lên tất cả mọi thứ
    backgroundColor: '#000', 
    display: 'flex', // Giữ layout flex
  } : {};

  // ✅ Tạo biến content chứa toàn bộ giao diện
  const content = (
    <div className={styles.container} style={overlayStyle}>
      
      {/* --- CỘT TRÁI: VIDEO PLAYER --- */}
      <div 
        className={styles.videoSide} 
        onClick={handleClickVideo}
        onWheel={handleWheelOnVideo} 
      >
        <button
          className={styles.backBtn}
          onClick={handleGoBack}
        >
          <FiArrowLeftCircle size={24} />
        </button>

        <VideoPlayer
          videoUrl={videoToDisplay.videoUrl}
          playerRef={playerRef}
          bgPlayerRef={bgPlayerRef}
          audioRef={audioRef}
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          showHeartEffect={showHeartEffect}
          setIsPlaying={setIsPlaying}
          toggleMute={toggleMute}
          handleVolumeChange={handleVolumeChange}
        />

        <div className={styles.volumeWrapper}>
           <VideoVolumeControl
            volume={volume}
            toggleMute={toggleMute}
            handleVolumeChange={handleVolumeChange}
          />
        </div>

        {/* Ẩn nút điều hướng nếu chỉ có 1 video */}
        {videoList && videoList.length > 1 && (
            <div className={styles.navButtons}>
                <button 
                    className={styles.navBtn} 
                    onClick={handlePrevVideo} 
                    disabled={currentIndex === 0}
                >
                    <FiChevronUp size={24} />
                </button>
                <button 
                    className={styles.navBtn} 
                    onClick={handleNextVideo}
                    disabled={currentIndex === (videoList?.length || 0) - 1}
                >
                    <FiChevronDown size={24} />
                </button>
            </div>
        )}
      </div>

      {/* --- CỘT PHẢI: INFO & COMMENTS --- */}
      <div className={styles.sidebarSide}>
        <CommentSection
          comments={comments}
          totalCommentCount={totalCommentCount}
          currentUserId={currentUserId}
          submitComment={submitComment}
          deleteComment={deleteComment}
        >
          <div className={styles.infoHeader}>
            <VideoInfo video={videoToDisplay} />
            
            <div className={styles.actionWrapper}>
              <VideoActions
                video={videoToDisplay}
                isLiked={isLiked}
                soTym={soTym}
                isSaved={isSaved}
                soNguoiLuu={soNguoiLuu}
                totalCommentCount={totalCommentCount}
                iconCircleRef={iconCircleRef}
                handleLike={() => handleLike(showHeart)}
                handleToggleSave={handleToggleSave}
              />
            </div>
          </div>
        </CommentSection>
      </div>
    </div>
  );

  // ✅ QUAN TRỌNG: Dùng Portal để đưa content ra khỏi Chat Box nếu là Overlay
  if (isOverlay) {
    return createPortal(content, document.body);
  }

  // Trường hợp dùng Router bình thường
  return content;
}