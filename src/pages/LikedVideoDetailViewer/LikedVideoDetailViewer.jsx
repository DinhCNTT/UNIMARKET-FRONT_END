import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeftCircle } from "react-icons/fi";
import styles from "./LikedVideoDetailViewer.module.css";

// Import Hooks
import { useVideoScroll } from "../../hooks/useVideoScroll";
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

export default function LikedVideoDetailViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { maTinDang } = useParams(); // ✅ Lấy maTinDang từ URL (nếu có)

  // ✅ Nhận danh sách và vị trí ban đầu (nếu được truyền qua state)
  const { videos: initialVideos, initialIndex } = location.state || {
    videos: null, // Đặt null thay vì []
    initialIndex: 0,
  };

  const [videoList, setVideoList] = useState(initialVideos);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { videoConnection } = useContext(VideoHubContext);

  // ✅ Tạo shallowVideo ban đầu (có thể chỉ chứa maTinDang nếu load từ URL)
  const getInitialShallowVideo = () => {
    if (initialVideos && initialVideos[initialIndex]) {
      return initialVideos[initialIndex];
    }
    if (maTinDang) {
      return { maTinDang: maTinDang }; // chỉ cần id, hooks sẽ fetch chi tiết
    }
    return null;
  };
  const [initialShallowVideo] = useState(getInitialShallowVideo());

  // ✅ Lấy shallowVideo hiện tại (ưu tiên danh sách khi có)
  const shallowVideo = videoList ? videoList[currentIndex] : initialShallowVideo;
  const maTinDangString = shallowVideo?.maTinDang?.toString();

  // ✅ Scroll để ẩn thông tin người dùng
  const scrollRef = useRef(null);
  const hideUserInfo = useVideoScroll(scrollRef);

  // ✅ Hook lấy chi tiết video, realtime Like / Save
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

  // ✅ Hook điều khiển phát video
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

  // ✅ Hook bình luận
  const {
    comments,
    totalCommentCount,
    currentUserId,
    submitComment,
    deleteComment,
  } = useComments(shallowVideo?.maTinDang);

  // --- LOGIC CLICK / DOUBLE CLICK ---
  const clickTimeoutRef = useRef(null);
  const clickCountRef = useRef(0);

  const handleClick = useCallback(() => {
    clickCountRef.current++;
    if (clickCountRef.current >= 2) {
      if (!isLiked) {
        handleLike(showHeart);
      } else {
        showHeart();
      }
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

  // --- LOGIC CUỘN VIDEO ---
  const currentIndexRef = useRef(initialIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const SCROLL_THRESHOLD = 90;
  const handleWheelScroll = (e) => {
    if (isTransitioning) return;
    const delta = e.deltaY;
    if (Math.abs(delta) < SCROLL_THRESHOLD) return;

    let nextIndex = currentIndexRef.current;
    if (delta > 0 && nextIndex < (videoList?.length || 0) - 1) {
      nextIndex++;
    } else if (delta < 0 && nextIndex > 0) {
      nextIndex--;
    } else return;

    setIsTransitioning(true);
    setCurrentIndex(nextIndex);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  useEffect(() => {
    window.addEventListener("wheel", handleWheelScroll, { passive: true });
    return () => window.removeEventListener("wheel", handleWheelScroll);
  }, [isTransitioning, videoList?.length]);

  // ✅ Tắt scroll body khi ở trong viewer
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // ✅ SignalR Join / Leave group
  useEffect(() => {
    if (videoConnection && maTinDangString) {
      videoConnection
        .invoke("JoinVideoGroup", maTinDangString)
        .then(() => console.log(`✅ Đã tham gia nhóm SignalR: ${maTinDangString}`))
        .catch((err) => console.error("❌ Lỗi khi JoinVideoGroup:", err));

      return () => {
        videoConnection
          .invoke("LeaveVideoGroup", maTinDangString)
          .then(() => console.log(`🚪 Đã rời nhóm SignalR: ${maTinDangString}`))
          .catch((err) => console.error("❌ Lỗi khi LeaveVideoGroup:", err));
      };
    }
  }, [videoConnection, maTinDangString]);

  // ✅ Ưu tiên hiển thị fullVideo
  const videoToDisplay = fullVideo || shallowVideo;

  // ✅ Khi load trực tiếp từ URL mà chưa có dữ liệu
  if (!videoToDisplay?.maTinDang)
    return <div className={styles.loading}>Đang tải video...</div>;

  // --- JSX TRẢ VỀ ---
  return (
    <div className={styles.container} onClick={handleClick}>
      {/* Nút quay lại */}
      <button
        className={styles.backBtn}
        onClick={(e) => {
          e.stopPropagation();
          navigate(-1);
        }}
      >
        <FiArrowLeftCircle size={24} />
      </button>

      {/* Phát video */}
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

      {/* Overlay thông tin & bình luận */}
      <div
        className={styles.overlay}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Ẩn thông tin khi cuộn */}
        {!hideUserInfo && (
          <>
            <VideoInfo video={videoToDisplay} onExpandedChange={setExpanded} />
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
          </>
        )}

        <CommentSection
          scrollRef={scrollRef}
          hideUserInfo={hideUserInfo}
          comments={comments}
          totalCommentCount={totalCommentCount}
          currentUserId={currentUserId}
          submitComment={submitComment}
          deleteComment={deleteComment}
          expanded={expanded}
          video={fullVideo || shallowVideo}
          showMenuInline={true}
        />

        {/* Thanh điều khiển âm lượng */}
        <VideoVolumeControl
          volume={volume}
          toggleMute={toggleMute}
          handleVolumeChange={handleVolumeChange}
        />
      </div>
    </div>
  );
}
