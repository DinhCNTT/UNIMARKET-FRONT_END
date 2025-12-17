import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
  useMemo,
} from "react";
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
  onClose,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { maTinDang: paramMaTinDang } = useParams();

  // ==========================================
  // 1. KHỞI TẠO DỮ LIỆU
  // ==========================================

  const {
    videos: stateVideos,
    videoList: stateVideoList,
    initialIndex: stateInitialIndex = 0,
    returnPath,
  } = location.state || {};

  const initialVideos =
    isOverlay && passedVideoData
      ? [passedVideoData]
      : stateVideos || stateVideoList || null;

  const [videoList, setVideoList] = useState(initialVideos);
  const [currentIndex, setCurrentIndex] = useState(
    isOverlay ? 0 : stateInitialIndex
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { videoConnection } = useContext(VideoHubContext);

  // --- Logic lấy video ban đầu (Shallow) ---
  const getInitialShallowVideo = () => {
    if (initialVideos && initialVideos[currentIndex]) {
      return initialVideos[currentIndex];
    }
    if (paramMaTinDang && !isOverlay) {
      return { maTinDang: paramMaTinDang };
    }
    return null;
  };

  // Cập nhật nếu passedVideoData thay đổi
  useEffect(() => {
    if (isOverlay && passedVideoData) {
      setVideoList([passedVideoData]);
      setCurrentIndex(0);
    }
  }, [passedVideoData, isOverlay]);

  const [initialShallowVideo] = useState(getInitialShallowVideo());

  // Video từ List (dữ liệu sơ sài)
  const shallowVideo = videoList
    ? videoList[currentIndex]
    : initialShallowVideo;

  // ==========================================
  // ⚡ FIX LỖI: CHUẨN HÓA DỮ LIỆU (Mapping)
  // ==========================================
  // Dù dữ liệu đầu vào là 'videoDuongDan' (từ Grid) hay 'videoUrl' (từ API)
  // thì đều quy về 'videoUrl' để tránh bị undefined gây lỗi Hook.
  const normalizeVideoData = (vid) => {
    if (!vid) return null;
    return {
      ...vid,
      videoUrl: vid.videoUrl || vid.videoDuongDan || "", // Ưu tiên Url, fallback sang DuongDan
      anhBia: vid.anhBia || vid.thumbnailUrl || "", // Ví dụ thêm fallback ảnh bìa
    };
  };

  const normalizedShallow = useMemo(
    () => normalizeVideoData(shallowVideo),
    [shallowVideo]
  );
  
  // ==========================================
  // 2. HOOKS TƯƠNG TÁC
  // ==========================================

  // Hook lấy dữ liệu đầy đủ từ API
  const {
    fullVideo,
    isLiked,
    soTym,
    isSaved,
    soNguoiLuu,
    iconCircleRef,
    handleLike,
    handleToggleSave,
  } = useVideoInteractions(normalizedShallow, currentIndex);

  // Chuẩn hóa video đầy đủ (nếu đã tải xong)
  const normalizedFull = useMemo(
    () => normalizeVideoData(fullVideo),
    [fullVideo]
  );

  // Video cuối cùng để hiển thị (Ưu tiên full > shallow)
  const videoToDisplay = normalizedFull || normalizedShallow;
  
  // Đảm bảo luôn có 1 chuỗi URL, tránh undefined truyền vào hook
  const safeVideoUrl = videoToDisplay?.videoUrl || ""; 

  // --- Hook Player ---
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
  } = useVideoPlayer(safeVideoUrl); // ✅ Truyền URL đã chuẩn hóa

  // --- Hook Comments ---
  const {
    comments,
    totalCommentCount,
    currentUserId,
    submitComment,
    deleteComment,
  } = useComments(videoToDisplay?.maTinDang);

  // ==========================================
  // 3. LOGIC SỰ KIỆN
  // ==========================================

  const handleGoBack = (e) => {
    e?.stopPropagation();
    if (isOverlay && onClose) {
      onClose();
      return;
    }
    if (returnPath) {
      navigate(returnPath);
    } else {
      navigate(-1);
    }
  };

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

  const handleWheelOnVideo = (e) => {
    if (isTransitioning || !videoList || videoList.length <= 1) return;
    const delta = e.deltaY;
    const SCROLL_THRESHOLD = 30;
    if (Math.abs(delta) < SCROLL_THRESHOLD) return;

    let nextIndex = currentIndex;
    if (delta > 0 && nextIndex < videoList.length - 1) {
      nextIndex++;
    } else if (delta < 0 && nextIndex > 0) {
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

  const handleNextVideo = (e) => {
    e.stopPropagation();
    if (currentIndex < (videoList?.length || 0) - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevVideo = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // ==========================================
  // 4. SIGNALR & RENDER
  // ==========================================

  const maTinDangString = videoToDisplay?.maTinDang?.toString();

  useEffect(() => {
    if (videoConnection && maTinDangString) {
      // Kiểm tra kết nối trước khi invoke để tránh lỗi ngắt kết nối
      if (videoConnection.state === "Connected") {
          videoConnection
            .invoke("JoinVideoGroup", maTinDangString)
            .catch((err) => console.error("SignalR Join Error:", err));
      }
      
      return () => {
        if (videoConnection.state === "Connected") {
            videoConnection
              .invoke("LeaveVideoGroup", maTinDangString)
              .catch((err) => console.error("SignalR Leave Error:", err));
        }
      };
    }
  }, [videoConnection, maTinDangString]);

  // Nếu chưa có thông tin cơ bản (maTinDang), hiển thị Loading
  if (!videoToDisplay?.maTinDang)
    return <div className={styles.loading}>Đang tải video...</div>;

  const overlayStyle = isOverlay
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        backgroundColor: "#000",
        display: "flex",
      }
    : {};

  const content = (
    <div className={styles.container} style={overlayStyle}>
      {/* --- CỘT TRÁI: VIDEO PLAYER --- */}
      <div
        className={styles.videoSide}
        onClick={handleClickVideo}
        onWheel={handleWheelOnVideo}
      >
        <button className={styles.backBtn} onClick={handleGoBack}>
          <FiArrowLeftCircle size={24} />
        </button>

        {/* ✅ FIX: Chỉ render Player khi có URL để tránh component con bị crash */}
        {safeVideoUrl ? (
            <VideoPlayer
            videoUrl={safeVideoUrl}
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
        ) : (
            <div className={styles.loading}>Đang tải nguồn video...</div>
        )}

        <div className={styles.volumeWrapper}>
          <VideoVolumeControl
            volume={volume}
            toggleMute={toggleMute}
            handleVolumeChange={handleVolumeChange}
          />
        </div>

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
            {/* Truyền video đã chuẩn hóa vào Info */}
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

  if (isOverlay) {
    return createPortal(content, document.body);
  }

  return content;
}