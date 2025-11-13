// src/components/VideoDetailViewer.jsx
import React, { useEffect, useState, useRef, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

// 🔥 Icons
import { IoHeart } from "react-icons/io5";

// 🔥 Components & Context
import TopNavbarUniMarket from "./TopNavbarUniMarket";
import CommentDrawer from "./CommentDrawer";
import VideoDetailsPanel from "./VideoDetailsPanel";
import SharePanel from "./SharePanel";
import { AuthContext } from "../context/AuthContext";
import { useVideoHub } from "../context/VideoHubContext"; 

// 🔥 Theme
import { ThemeProvider, useTheme } from "../context/ThemeContext";

// 🔥 Custom hooks
import { useVideoFeed } from "../hooks/useVideoFeed";
import { useViewTracking } from "../hooks/useViewTracking";

// 🔥 Child components
import VideoPlayer from "./VideoPlayer";
import VideoInfoOverlay from "./VideoInfoOverlay";
import VideoSideActions from "./VideoSideActions";

// 🔥 CSS
import "./VideoDetailViewer.css";

const API_BASE = "http://localhost:5133";
const SLIDE_DURATION = 650;

// ======================================================
//  COMPONENT CON — TOÀN BỘ NỘI DUNG CHÍNH ĐƯỢC ĐẶT Ở ĐÂY
// ======================================================
const VideoDetailViewerContent = () => {

  // =======================
  // 🎨 THEME từ context
  // =======================
  const { effectiveTheme } = useTheme();

  // =======================
  // STATE & DATA
  // =======================
  const { videoList, setVideoList, loading } = useVideoFeed();
  const [searchParams] = useSearchParams();
  const initialIndexFromUrl = parseInt(searchParams.get("index")) || 0;

  const [currentIndex, setCurrentIndex] = useState(initialIndexFromUrl);
  const [showHeart, setShowHeart] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("token");

  const [showComments, setShowComments] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [aspectRatios, setAspectRatios] = useState({});

  // Refs
  const videoRef = useRef(null);
  const videoElsRef = useRef([]);
  const containerRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const controlsTimeoutRef = useRef(null);
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef(null);

  const originalBodyStyle = useRef({ className: "" });

  // Realtime
  const { videoConnection: connection, isConnected } = useVideoHub();
  const currentVideoIdRef = useRef(null);

  const videoData = videoList.length > 0 ? videoList[currentIndex] : null;

  // =======================
  // VIEW TRACKING
  // =======================
  const { stopViewTracking } = useViewTracking(
    videoData,
    currentIndex,
    videoElsRef,
    setVideoList
  );

  // =======================
  // UTILS
  // =======================
  const formatCount = (num) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num?.toString() ?? "0";
  };

  // =======================
  // FOLLOW
  // =======================
  useEffect(() => {
    if (videoData?.nguoiDang?.id && token) {
      axios
        .get(`${API_BASE}/api/follow/is-following/${videoData.nguoiDang.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setIsFollowing(res.data.isFollowing))
        .catch(() => setIsFollowing(false));
    }
  }, [videoData?.nguoiDang?.id, token]);

  const handleToggleFollow = async () => {
    if (!token) return alert("Bạn cần đăng nhập để follow!");
    if (!videoData) return;
    try {
      const url = `${API_BASE}/api/follow/${
        isFollowing ? "unfollow" : "follow"
      }?followingId=${videoData.nguoiDang.id}`;
      await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsFollowing((prev) => !prev);
    } catch (err) {
      console.error(err);
    }
  };

  // =======================
  // LIKE
  // =======================
  const handleLike = async (videoToLike) => {
    if (!token) return alert("Bạn cần đăng nhập để tym video!");
    if (!videoToLike) return;
    try {
      setVideoList((prevList) =>
        prevList.map((v) => {
          if (v.maTinDang === videoToLike.maTinDang) {
            const newIsLiked = !v.isLiked;
            return {
              ...v,
              isLiked: newIsLiked,
              soTym: newIsLiked ? v.soTym + 1 : v.soTym - 1,
            };
          }
          return v;
        })
      );

      const res = await axios.post(
        `${API_BASE}/api/video/${videoToLike.maTinDang}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { isLiked, soTym } = res.data;
      setVideoList((prevList) =>
        prevList.map((v) =>
          v.maTinDang === videoToLike.maTinDang ? { ...v, isLiked, soTym } : v
        )
      );
    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu tym:", err);
    }
  };

  // =======================
  // SAVE
  // =======================
  const handleToggleSave = async (videoToSave) => {
    if (!user || !token) return alert("Bạn cần đăng nhập để lưu video!");
    if (!videoToSave) return;

    try {
      setVideoList((prevList) =>
        prevList.map((v) => {
          if (v.maTinDang === videoToSave.maTinDang) {
            const newIsSaved = !v.isSaved;
            return {
              ...v,
              isSaved: newIsSaved,
              soNguoiLuu: newIsSaved
                ? (v.soNguoiLuu || 0) + 1
                : (v.soNguoiLuu || 1) - 1,
            };
          }
          return v;
        })
      );

      const { data } = await axios.post(
        `${API_BASE}/api/video/ToggleSave`,
        { maTinDang: videoToSave.maTinDang },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { saved, totalSaves } = data;
      setVideoList((prevList) =>
        prevList.map((v) =>
          v.maTinDang === videoToSave.maTinDang
            ? { ...v, isSaved: saved, soNguoiLuu: totalSaves }
            : v
        )
      );
    } catch (err) {
      console.error("Lỗi khi lưu video:", err);
    }
  };

  // =======================
  // SHARE
  // =======================
  const handleOptimisticShareUpdate = (maTinDang) => {
    setVideoList((currentList) =>
      currentList.map((video) =>
        video.maTinDang === maTinDang
          ? { ...video, soLuotChiaSe: (video.soLuotChiaSe || 0) + 1 }
          : video
      )
    );
  };

  // =======================
  // CLICK VIDEO
  // =======================
  const handleVideoClick = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    clickCountRef.current += 1;

    if (clickCountRef.current === 1) {
      clickTimeoutRef.current = setTimeout(() => {
        const video = videoElsRef.current[index];
        if (video) {
          video.paused ? video.play() : video.pause();
        }
        clickCountRef.current = 0;
      }, 250);
    } else if (clickCountRef.current === 2) {
      clearTimeout(clickTimeoutRef.current);
      handleLike(videoData);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
      clickCountRef.current = 0;
    }
  };

  // =======================
  // CHI TIẾT VIDEO
  // =======================
  const handleShowDetail = async (maTinDang) => {
    setLoadingDetail(true);
    setShowDetailPanel(true);
    try {
      const res = await axios.get(`${API_BASE}/api/video/detail/${maTinDang}`);
      setDetailData(res.data);
    } catch (error) {
      console.error("Lỗi tải chi tiết tin:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // =======================
  // AUTO HIDE CONTROLS
  // =======================
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };
  const handleMouseLeave = () => {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1000);
  };

  // ======================================================
  // CHUYỂN VIDEO (WHEEL + TOUCH)
  // ======================================================
  const goToIndex = (nextIndex) => {
    if (isAnimatingRef.current) return;
    if (nextIndex < 0 || nextIndex >= videoList.length) return;
    if (nextIndex === currentIndex) return;

    isAnimatingRef.current = true;
    document.body.classList.add("video-transitioning");

    if (videoData) {
      stopViewTracking(videoData.maTinDang);
    }

    setCurrentIndex(nextIndex);

    setTimeout(() => {
      isAnimatingRef.current = false;
      document.body.classList.remove("video-transitioning");
    }, SLIDE_DURATION + 80);
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (showComments || showDetailPanel || showSharePanel) return;
      e.preventDefault();
      if (isAnimatingRef.current) return;

      if (e.deltaY > 0) goToIndex(currentIndex + 1);
      else goToIndex(currentIndex - 1);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [currentIndex, videoList.length, showComments, showDetailPanel, showSharePanel]);

  // TOUCH SWIPE
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startY = 0;
    let lastY = 0;
    const THRESHOLD = 60;

    const onTouchStart = (e) => {
      if (isAnimatingRef.current || showComments || showDetailPanel || showSharePanel) return;
      startY = e.touches[0].clientY;
      lastY = startY;
    };

    const onTouchMove = (e) => {
      if (isAnimatingRef.current) return;
      lastY = e.touches[0].clientY;
      e.preventDefault();
    };

    const onTouchEnd = () => {
      const delta = lastY - startY;
      if (Math.abs(delta) > THRESHOLD) {
        delta < 0 ? goToIndex(currentIndex + 1) : goToIndex(currentIndex - 1);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [currentIndex, videoList.length]);

  // Autoplay video
  useEffect(() => {
    videoElsRef.current.forEach((v, i) => {
      if (!v) return;
      if (i === currentIndex) {
        v.play().catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [currentIndex]);

  // Body style cleanup
  useEffect(() => {
    originalBodyStyle.current.className = document.body.className;
    document.body.style.overflow = "hidden";
    document.body.classList.remove("video-transitioning");

    return () => {
      document.body.style.overflow = "";
      document.body.className = originalBodyStyle.current.className;
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // ======================================================
  // REALTIME: JOIN/LEAVE VIDEO ROOM
  // ======================================================
  useEffect(() => {
    if (!isConnected || !connection || !videoData) return;

    const newVideoId = videoData.maTinDang?.toString();
    if (currentVideoIdRef.current === newVideoId) return;

    const oldVideoId = currentVideoIdRef.current;

    if (oldVideoId) {
      connection.invoke("LeaveVideoGroup", oldVideoId).catch(() => {});
    }

    if (newVideoId) {
      connection.invoke("JoinVideoGroup", newVideoId)
        .then(() => (currentVideoIdRef.current = newVideoId))
        .catch(() => {});
    }
  }, [currentIndex, videoData, connection, isConnected]);

  useEffect(() => {
    return () => {
      if (connection && isConnected && currentVideoIdRef.current) {
        connection.invoke("LeaveVideoGroup", currentVideoIdRef.current).catch(() => {});
      }
    };
  }, [isConnected, connection]);

  // ======================================================
  // REALTIME: LẮNG NGHE SỰ KIỆN
  // ======================================================
  useEffect(() => {
    if (!connection || !isConnected) return;

    const handleUpdateLike = (maTinDang, soTym) => {
      setVideoList((list) =>
        list.map((v) =>
          v.maTinDang === maTinDang ? { ...v, soTym } : v
        )
      );
    };

    const handleUpdateSave = (maTinDang, totalSaves) => {
      setVideoList((list) =>
        list.map((v) =>
          v.maTinDang === maTinDang ? { ...v, soNguoiLuu: totalSaves } : v
        )
      );
    };

    const handleUpdateShare = (maTinDang, totalShares) => {
      setVideoList((list) =>
        list.map((v) =>
          v.maTinDang === maTinDang ? { ...v, soLuotChiaSe: totalShares } : v
        )
      );
    };

    const handleUpdateCommentCount = (maTinDang, totalComments) => {
      setVideoList((list) =>
        list.map((v) =>
          v.maTinDang === maTinDang ? { ...v, soBinhLuan: totalComments } : v
        )
      );
    };

    connection.on("UpdateLikeCount", handleUpdateLike);
    connection.on("UpdateSaveCount", handleUpdateSave);
    connection.on("UpdateShareCount", handleUpdateShare);
    connection.on("UpdateCommentCount", handleUpdateCommentCount);

    return () => {
      connection.off("UpdateLikeCount", handleUpdateLike);
      connection.off("UpdateSaveCount", handleUpdateSave);
      connection.off("UpdateShareCount", handleUpdateShare);
      connection.off("UpdateCommentCount", handleUpdateCommentCount);
    };
  }, [connection, isConnected]);

  // ======================================================
  // RENDER
  // ======================================================
  if (loading && videoList.length === 0) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <span>Đang tải video...</span>
      </div>
    );
  }

  if (!videoData) return <div>Không có video nào.</div>;

  let videoThumbnail = videoData.hinhAnh;
  if (videoData.videoUrl?.includes("cloudinary")) {
    const lastDot = videoData.videoUrl.lastIndexOf(".");
    if (lastDot !== -1) {
      videoThumbnail = videoData.videoUrl.substring(0, lastDot) + ".jpg";
    }
  }

  return (
    <div
      className="vdv-wrapper vdv-full-screen-scroll"
      data-theme={effectiveTheme}
    >
      <TopNavbarUniMarket />

      {loading && videoList.length > 0 && (
        <div className="loading-overlay" style={{ zIndex: 10000 }}>
          <div className="spinner"></div>
        </div>
      )}

      <div
        ref={containerRef}
        className="video-list-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="video-list-wrapper"
          style={{ transform: `translateY(-${currentIndex * 100}vh)` }}
        >
          {videoList.map((video, index) => {
            const ratio = aspectRatios[index];
            let ratioClass = "";
            if (ratio != null) {
              if (ratio < 1) ratioClass = "vdv-portrait";
              else if (ratio > 1.5) ratioClass = "vdv-landscape";
              else if (ratio > 1.2) ratioClass = "vdv-square-wide";
              else ratioClass = "vdv-square";
            }

            return (
              <div
                key={video.maTinDang || index}
                className={`video-item ${ratioClass}`}
              >
                <div
                  className={`vdv-container ${ratioClass} ${
                    showComments ? "comment-open" : ""
                  }`}
                >
                  <VideoPlayer
                    video={video}
                    index={index}
                    currentIndex={currentIndex}
                    videoElsRef={videoElsRef}
                    videoRef={videoRef}
                    setAspectRatios={setAspectRatios}
                    handleVideoClick={handleVideoClick}
                    showControls={showControls}
                    handleDragStateChange={setIsDraggingVideo}
                  />

                  <VideoInfoOverlay
                    video={video}
                    formatCount={formatCount}
                    isDraggingVideo={isDraggingVideo}
                  />
                </div>

                <VideoSideActions
                  video={video}
                  user={user}
                  token={token}
                  isFollowing={index === currentIndex ? isFollowing : false}
                  formatCount={formatCount}
                  onFollow={handleToggleFollow}
                  onLike={() => handleLike(video)}
                  onSave={() => handleToggleSave(video)}
                  onComment={() => setShowComments((prev) => !prev)}
                  onShare={() => setShowSharePanel(true)}
                  onShowDetail={() => handleShowDetail(video.maTinDang)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {showHeart && (
        <div className="vdv-heart-animation">
          <IoHeart size={80} color="#ff4d6d" />
        </div>
      )}

      {showComments && (
        <CommentDrawer
          maTinDang={videoData.maTinDang}
          onClose={() => setShowComments(false)}
        />
      )}

      <VideoDetailsPanel
        isOpen={showDetailPanel}
        onClose={() => setShowDetailPanel(false)}
        loading={loadingDetail}
        data={detailData}
      />

      {showSharePanel && videoData && (
        <SharePanel
          key={videoData.maTinDang}
          isOpen={showSharePanel}
          onClose={() => setShowSharePanel(false)}
          tinDangId={videoData.maTinDang}
          displayMode="Video"
          index={currentIndex}
          previewTitle={videoData.tieuDe}
          previewImage={videoThumbnail}
          previewVideo={videoData.videoUrl}
          disableBodyScrollLock={true}
          onShareSuccess={() =>
            handleOptimisticShareUpdate(videoData.maTinDang)
          }
        />
      )}
    </div>
  );
};

// ======================================================
// COMPONENT CHA — CHỈ TRÁCH NHIỆM BỌC THEME PROVIDER
// ======================================================
const VideoDetailViewer = () => {
  return (
    <ThemeProvider>
      <VideoDetailViewerContent />
    </ThemeProvider>
  );
};

export default VideoDetailViewer;
