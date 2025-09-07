import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import './VideoDetailViewer.css';
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { FaRegCommentDots } from 'react-icons/fa';
import { SiMinutemailer } from "react-icons/si";
import CommentDrawer from './CommentDrawer';
import { useSearchParams, useNavigate } from 'react-router-dom';
import VideoSearchOverlay from "./VideoSearchOverlay";
import defaultAvatar from '../assets/default-avatar.png';
import { AuthContext } from "../context/AuthContext";
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5";
import TopNavbarUniMarket from './TopNavbarUniMarket';
import { VideoContext } from "../context/VideoContext";
import VideoControls from './VideoControls';
import { FaInfoCircle } from "react-icons/fa"; 
import VideoDetailsPanel from "./VideoDetailsPanel";

const VideoDetailViewer = ({ onOpenChat }) => {
  const [videoList, setVideoList] = useState([]);
  const [searchParams] = useSearchParams();
  const initialIndexFromUrl = parseInt(searchParams.get('index')) || 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndexFromUrl);
  const [showHeart, setShowHeart] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const iconCircleRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState(null);
  const { user } = useContext(AuthContext);
  const [isSaved, setIsSaved] = useState(false);
  const videoData = videoList.length > 0 ? videoList[currentIndex] : null;
  const [showComments, setShowComments] = useState(false);
  const [aspectRatios, setAspectRatios] = useState({}); 
  const { reloadFlag, loading } = useContext(VideoContext);
  const [isReloading, setIsReloading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
   
  // Thời lượng animation phải khớp với CSS (ms)
  const SLIDE_DURATION = 650;

  const containerRef = useRef(null);
  const videoElsRef = useRef([]);
  const isAnimatingRef = useRef(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // VIEW TRACKING STATE & REFS
  const [viewTracking, setViewTracking] = useState({});
  const viewTrackingTimers = useRef({});
  const viewStartTimes = useRef({});
  const hasTracked3Seconds = useRef({});

// ✅ HÀM TÍNH THỜI GIAN XEM CHÍNH XÁC
  const getCurrentWatchedSeconds = (maTinDang) => {
  const startTime = viewStartTimes.current[maTinDang];
  if (!startTime) return 0;
  
  return Math.floor((Date.now() - startTime) / 1000);
};

  // CẬP NHẬT hàm trackView để debug rõ hơn
  const trackView = async (maTinDang, watchedSeconds, isCompleted = false, rewatchCount = 0, skipViewCount = false) => {
  try {
      const token = localStorage.getItem("token");
      
      // ✅ Đảm bảo watchedSeconds >= 0
      const actualWatchedSeconds = Math.max(0, watchedSeconds);
      
      console.log(`🎥 Tracking view for video ${maTinDang}:`, {
          watchedSeconds: actualWatchedSeconds,
          isCompleted: isCompleted,
          rewatchCount: rewatchCount,
          skipViewCount: skipViewCount,
          hasToken: !!token,
          timestamp: new Date().toISOString()
      });

      const requestBody = {
          maTinDang: maTinDang,
          watchedSeconds: actualWatchedSeconds,
          isCompleted: isCompleted,
          rewatchCount: rewatchCount,
          skipViewCount: skipViewCount
      };

      const headers = {
          'Content-Type': 'application/json'
      };
      
      if (token) {
          headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post('http://localhost:5133/api/video/track-view', requestBody, {
          headers: headers
      });

      console.log(`✅ Track response for video ${maTinDang}:`, response.data);

      // Cập nhật số view trong state nếu là view mới
      if (response.data.isNewView) {
          setVideoList(prevList => 
              prevList.map(v => 
                  v.maTinDang === maTinDang 
                      ? { ...v, soLuotXem: response.data.totalViews }
                      : v
              )
          );
      }

      return response.data;

  } catch (error) {
      console.error(`❌ Error tracking view for video ${maTinDang}:`, error);
      return null;
  }
};

  // START VIEW TRACKING FOR A VIDEO
  const startViewTracking = (maTinDang, videoElement) => {
  if (!videoElement || viewTrackingTimers.current[maTinDang]) return;

  console.log(`🎬 Starting view tracking for video ${maTinDang}`);
  
  viewStartTimes.current[maTinDang] = Date.now();
  hasTracked3Seconds.current[maTinDang] = false;

  // Timer để track view mỗi giây
  viewTrackingTimers.current[maTinDang] = setInterval(() => {
    if (videoElement.paused) return;

    // ✅ SỬ DỤNG HÀM TÍNH CHÍNH XÁC
    const elapsed = getCurrentWatchedSeconds(maTinDang);
    
    console.log(`⏱️ Video ${maTinDang} watched for ${elapsed} seconds`);

    // ✅ Cập nhật state với thời gian thực
    setViewTracking(prev => ({
      ...prev,
      [maTinDang]: {
        ...prev[maTinDang],
        watchedSeconds: elapsed,
        lastUpdateTime: Date.now()
      }
    }));

    // Track view đầu tiên khi đạt 3 giây - CHỈ LẦN NÀY MỚI TĂNG VIEW COUNT
    if (elapsed >= 3 && !hasTracked3Seconds.current[maTinDang]) {
      hasTracked3Seconds.current[maTinDang] = true;
      trackView(maTinDang, elapsed, false, 0, false); // false = cho phép tăng view count
      console.log(`🎯 First 3-second view tracked for video ${maTinDang}`);
    }

    // Track view mỗi 10 giây - KHÔNG TĂNG VIEW COUNT
    if (elapsed > 3 && elapsed % 10 === 0) {
      trackView(maTinDang, elapsed, false, 0, true); // true = skip view count
    }

  }, 1000);
};

  // STOP VIEW TRACKING FOR A VIDEO
  const stopViewTracking = (maTinDang) => {
  if (viewTrackingTimers.current[maTinDang]) {
    clearInterval(viewTrackingTimers.current[maTinDang]);
    delete viewTrackingTimers.current[maTinDang];

    // ✅ Tính thời gian xem chính xác khi dừng
    const finalWatchedSeconds = getCurrentWatchedSeconds(maTinDang);
    
    // Gửi track cuối cùng nếu đã xem >=3 giây
    if (finalWatchedSeconds >= 3) {
      const tracking = viewTracking[maTinDang] || {};
      trackView(maTinDang, finalWatchedSeconds, false, tracking.loopCount || 0, true);
      console.log(`🏁 Final view tracking sent for video ${maTinDang}: ${finalWatchedSeconds}s`);
    }

    // ✅ Xóa thời gian bắt đầu
    delete viewStartTimes.current[maTinDang];
    delete hasTracked3Seconds.current[maTinDang];
    
    console.log(`🛑 Stopped view tracking for video ${maTinDang}`);
  }
};


  const handleShowDetail = async (maTinDang) => {
    setLoadingDetail(true);
    setShowDetailPanel(true);

    try {
      const res = await axios.get(`http://localhost:5133/api/video/detail/${maTinDang}`);
      setDetailData(res.data);
    } catch (error) {
      console.error("Lỗi tải chi tiết tin:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setShowDetailPanel(false);
    setDetailData(null);
  };

  // Handler để nhận trạng thái drag từ VideoControls
  const handleDragStateChange = (isDragging) => {
    setIsDraggingVideo(isDragging);
  };

  // Điều hướng an toàn + đồng bộ transition
  const goToIndex = (nextIndex) => {
    if (isAnimatingRef.current) return;
    if (nextIndex < 0 || nextIndex >= videoList.length) return;
    if (nextIndex === currentIndex) return;

    isAnimatingRef.current = true;
    document.body.classList.add("video-transitioning");

    // Stop tracking cho video hiện tại
    if (videoData) {
      stopViewTracking(videoData.maTinDang);
    }

    setCurrentIndex(nextIndex);

    setTimeout(() => {
      isAnimatingRef.current = false;
      document.body.classList.remove("video-transitioning");
    }, SLIDE_DURATION + 80);
  };

  const handleToggleComments = () => {
    setShowComments(prev => !prev);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleMouseLeave = () => {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1000);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      // Cleanup tất cả view tracking timers
      Object.keys(viewTrackingTimers.current).forEach(maTinDang => {
        stopViewTracking(parseInt(maTinDang));
      });
    };
  }, []);

  // Fetch all videos
  useEffect(() => {
    const fetchAllVideos = async () => {
      try {
        const token = localStorage.getItem("token");
        let allVideos = [];
        let page = 1;
        const pageSize = 10;
        let hasMore = true;

        // Lấy tất cả video
        while (hasMore) {
          const res = await axios.get(
            `http://localhost:5133/api/video?page=${page}&pageSize=${pageSize}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );
          const data = res.data;

          if (Array.isArray(data) && data.length > 0) {
            allVideos = [...allVideos, ...data];
            page++;
          } else {
            hasMore = false;
          }
        }

        setVideoList(allVideos);
        console.log(`📋 Loaded ${allVideos.length} videos for tracking`);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách video:", err);
      }
    };

    fetchAllVideos();
  }, []);

  // MAIN VIEW TRACKING EFFECT - Khi chuyển video
  useEffect(() => {
    if (!videoData) return;

    const maTinDang = videoData.maTinDang;
    const videoElement = videoElsRef.current[currentIndex];

    if (!videoElement) return;

    console.log(`🔄 Switched to video ${maTinDang} (index: ${currentIndex})`);
    
    // Khởi tạo tracking state cho video mới
    setViewTracking(prev => ({
      ...prev,
      [maTinDang]: {
        startTime: Date.now(),
        watchedSeconds: 0,
        hasTracked3Seconds: false,
        hasCompleted: false,
        loopCount: 0,
        hasCountedView: false
      }
    }));

    const handlePlay = () => {
      console.log(`▶️ Video ${maTinDang} started playing`);
      startViewTracking(maTinDang, videoElement);
    };

    const handlePause = () => {
  console.log(`⏸️ Video ${maTinDang} paused`);
  
  // ✅ Tính thời gian thực khi pause
  const currentWatchedSeconds = getCurrentWatchedSeconds(maTinDang);
  
  if (currentWatchedSeconds >= 3) {
    const tracking = viewTracking[maTinDang] || {};
    trackView(maTinDang, currentWatchedSeconds, false, tracking.loopCount || 0, true);
  }
};

    // FIX: handleEnded để đúng cách detect completion và rewatch
    const handleEnded = () => {
  console.log(`🏁 Video ${maTinDang} ended (backup - rarely happens with loop)`);
  
  const currentWatchedSeconds = getCurrentWatchedSeconds(maTinDang);
  
  setViewTracking(prev => {
      const currentTracking = prev[maTinDang] || {};
      
      if (!currentTracking.hasCompleted) {
          // ✅ Dùng thời gian thực thay vì state
          trackView(maTinDang, currentWatchedSeconds, true, 0, true);
          
          return {
              ...prev,
              [maTinDang]: {
                  ...currentTracking,
                  hasCompleted: true
              }
          };
      } else {
          // Nếu đã completed mà vẫn trigger ended -> rewatch
          const newLoopCount = (currentTracking.loopCount || 0) + 1;
          trackView(maTinDang, currentWatchedSeconds, false, newLoopCount, true);
          
          return {
              ...prev,
              [maTinDang]: {
                  ...currentTracking,
                  loopCount: newLoopCount
              }
          };
      }
  });
};
    // handleTimeUpdate để track progress
    const handleTimeUpdate = () => {
  const currentTime = videoElement.currentTime;
  const duration = videoElement.duration;
  
  if (duration > 0) {
      const progress = (currentTime / duration) * 100;
      // ✅ Lấy thời gian thực để backup
      const realTimeWatched = getCurrentWatchedSeconds(maTinDang);
      
      setViewTracking(prev => {
          const currentTracking = prev[maTinDang] || {};
          
          // LOGIC DETECT REWATCH: currentTime nhảy từ cuối về đầu
          const wasNearEnd = currentTracking.lastProgress && currentTracking.lastProgress > 95;
          const isRestarting = currentTime < 5 && wasNearEnd && currentTracking.hasCompleted;
          
          if (isRestarting) {
              const newLoopCount = (currentTracking.loopCount || 0) + 1;
              console.log(`🔄 LOOP DETECTED! Video ${maTinDang} restarted. Count: ${currentTracking.loopCount || 0} -> ${newLoopCount}`);
              
              // ✅ Gửi track với thời gian thực
              trackView(maTinDang, realTimeWatched, false, newLoopCount, true);
              
              return {
                  ...prev,
                  [maTinDang]: {
                      ...currentTracking,
                      loopCount: newLoopCount,
                      lastProgress: progress,
                      hasCompleted: true
                  }
              };
          }
          
          // DETECT COMPLETION lần đầu
          if (progress >= 95 && !currentTracking.hasCompleted) {
              console.log(`✅ Video ${maTinDang} completed for first time at ${progress.toFixed(1)}%`);
              
              // ✅ Track completion với thời gian thực
              trackView(maTinDang, realTimeWatched, true, 0, true);
              
              return {
                  ...prev,
                  [maTinDang]: {
                      ...currentTracking,
                      hasCompleted: true,
                      lastProgress: progress
                  }
              };
          }
          
          // Cập nhật progress bình thường
          return {
              ...prev,
              [maTinDang]: {
                  ...currentTracking,
                  lastProgress: progress,
                  // ✅ Backup thời gian thực vào state
                  watchedSeconds: realTimeWatched
              }
          };
      });
  }
};

    // Add event listeners
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    // Bắt đầu tracking nếu video đang phát
    if (!videoElement.paused) {
      handlePlay();
    }

    // Cleanup khi chuyển video
    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      stopViewTracking(maTinDang);
    };
  }, [currentIndex, videoData]);

  // TRACK VIEW KHI ĐÓNG TRANG
 useEffect(() => {
  const handleBeforeUnload = () => {
    if (videoData) {
      // ✅ Tính thời gian thực khi đóng trang
      const finalWatchedSeconds = getCurrentWatchedSeconds(videoData.maTinDang);
      
      if (finalWatchedSeconds >= 3) {
        // Sử dụng navigator.sendBeacon để gửi dữ liệu khi trang đóng
        const tracking = viewTracking[videoData.maTinDang] || {};
        const data = JSON.stringify({
          maTinDang: videoData.maTinDang,
          watchedSeconds: finalWatchedSeconds,
          isCompleted: false,
          rewatchCount: tracking.loopCount || 0,
          skipViewCount: true
        });
        
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('http://localhost:5133/api/video/track-view', blob);
        console.log(`📤 Sent final view tracking for video ${videoData.maTinDang} via beacon: ${finalWatchedSeconds}s`);
      }
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [videoData]);

  useEffect(() => { 
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => {
        const aspectRatio = video.videoWidth / video.videoHeight;
        setVideoAspectRatio(aspectRatio);
        
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.maxWidth = 'none';
        video.style.maxHeight = 'none';
        video.style.objectFit = 'cover';
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      if (video.readyState >= 1) {
        handleLoadedMetadata();
      }

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [currentIndex, videoList]);

  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      if (isAnimatingRef.current) return;

      if (e.deltaY > 0) {
        goToIndex(currentIndex + 1);
      } else if (e.deltaY < 0) {
        goToIndex(currentIndex - 1);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [currentIndex, videoList.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startY = 0;
    let lastY = 0;
    const THRESHOLD = 60;

    const onTouchStart = (e) => {
      if (isAnimatingRef.current) return;
      startY = e.touches[0].clientY;
      lastY = startY;
    };

    const onTouchMove = (e) => {
      if (isAnimatingRef.current) return;
      lastY = e.touches[0].clientY;
      e.preventDefault();
    };

    const onTouchEnd = () => {
      if (isAnimatingRef.current) return;
      const delta = lastY - startY;
      if (Math.abs(delta) > THRESHOLD) {
        if (delta < 0) {
          goToIndex(currentIndex + 1);
        } else {
          goToIndex(currentIndex - 1);
        }
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

  useEffect(() => {
    const nodes = videoElsRef.current;
    nodes.forEach((v, i) => {
      if (!v) return;
      if (i === currentIndex) {
        v.play().catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [currentIndex]);

  const handleLike = async () => {
    const video = videoList[currentIndex];
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Bạn cần đăng nhập để tym video!");
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5133/api/video/${video.maTinDang}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { isLiked, soTym } = res.data;

      setVideoList((prevList) =>
        prevList.map((v, i) =>
          i === currentIndex ? { ...v, isLiked, soTym } : v
        )
      );

      if (isLiked && iconCircleRef.current) {
        const circle = document.createElement("div");
        circle.className = "vdv-heart-pulse-circle";
        iconCircleRef.current.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
      }
    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu tym:", err);
      if (err.response?.status === 401) {
        alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
      }
    }
  };

  const handleToggleSave = async () => {
    const token = localStorage.getItem("token");

    if (!user || !token) {
      alert("Bạn cần đăng nhập để lưu video!");
      return;
    }

    try {
      const { data } = await axios.post(
        `http://localhost:5133/api/video/ToggleSave`,
        { maTinDang: videoData.maTinDang },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { saved, totalSaves } = data;

      setVideoList(prevList =>
        prevList.map((v, i) =>
          i === currentIndex
            ? { ...v, isSaved: saved, soNguoiLuu: totalSaves }
            : v
        )
      );

      setIsSaved(saved);

    } catch (err) {
      console.error("Lỗi khi lưu video:", err);

      if (err.response?.status === 401) {
        alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
      } else {
        alert("Lỗi khi lưu video. Vui lòng thử lại.");
      }
    }
  };

  const handleVideoClick = (e, index) => {
    e.preventDefault();
    e.stopPropagation();

    clickCountRef.current += 1;

    if (clickCountRef.current === 1) {
      clickTimeoutRef.current = setTimeout(() => {
        const video = videoElsRef.current[index];
        if (video) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
        clickCountRef.current = 0;
      }, 250);
    } else if (clickCountRef.current === 2) {
      clearTimeout(clickTimeoutRef.current);

      handleLike(videoList[index]);

      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);

      if (iconCircleRef.current) {
        const circle = document.createElement("div");
        circle.className = "vdv-heart-pulse-circle";
        iconCircleRef.current.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
      }

      clickCountRef.current = 0;
    }
  };

  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (!videoData) {
    return <div>Đang tải video...</div>;
  }

  const token = localStorage.getItem("token");

  return (
    <div className="vdv-wrapper vdv-full-screen-scroll">
      <TopNavbarUniMarket />

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span>Đang tải video...</span>
        </div>
      )}

      <div ref={containerRef} className="video-list-container">
        <div
          className={`video-list-wrapper ${!loading && isReloading ? "fade-in" : ""}`}
          style={{ transform: `translateY(-${currentIndex * 100}vh)` }}
        >
          {videoList.map((video, index) => {
            const ratio = aspectRatios[index];
            const ratioClass =
              ratio != null
                ? ratio < 1
                  ? "vdv-portrait"
                  : ratio > 1.5
                  ? "vdv-landscape"
                  : "vdv-square"
                : "";

            return (
              <div
                className={`video-item ${!loading && isReloading && index === 0 ? "fade-in" : ""}`}
                key={video.videoUrl}
              >
                <div
                  className={`vdv-container ${ratioClass} ${
                    showComments ? "comment-open" : ""
                  }`}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <video
                    ref={(el) => {
                      videoElsRef.current[index] = el;
                      if (index === currentIndex) {
                        videoRef.current = el;
                      }
                    }}
                    src={video.videoUrl}
                    className="vdv-player"
                    controls={false}
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    autoPlay={index === currentIndex}
                    loop
                    onClick={(e) => handleVideoClick(e, index)}
                    onDoubleClick={(e) => e.preventDefault()}
                    onLoadedMetadata={(e) => {
                      const ratio =
                        e.target.videoWidth / e.target.videoHeight;
                      setAspectRatios((prev) => ({
                        ...prev,
                        [index]: ratio,
                      }));
                    }}
                  />

                  {index === currentIndex && (
                    <VideoControls 
                      videoRef={videoRef} 
                      isVisible={showControls}
                      onDragStateChange={handleDragStateChange}
                    />
                  )}

                  {!isDraggingVideo && (
                    <div className="vdv-overlay">
                      <div className="vdv-info-left">
                        <div className="vdv-user-name">
                          @{video.nguoiDang?.fullName}
                        </div>
                        <div className="vdv-title">{video.tieuDe}</div>

                        <div className="vdv-price-address">
                          <div className="vdv-price">
                            {video.gia?.toLocaleString()} đ
                          </div>
                          <div className="vdv-address">
                            {video.diaChi}, {video.quanHuyen}, {video.tinhThanh}
                          </div>
                        </div>

                        {/* HIỂN THỊ SỐ VIEW */}
                        <div className="vdv-view-count" style={{
                          fontSize: '12px',
                          color: '#ccc',
                          marginTop: '8px'
                        }}>
                          👁️ {formatCount(video.soLuotXem || 0)} lượt xem
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`vdv-side-info ${showComments ? "comment-open" : ""}`}>
                  <img
                    src={video.nguoiDang?.avatarUrl || defaultAvatar}
                    alt="avatar"
                    className="vdv-user-avatar"
                    onClick={() => navigate(`/nguoi-dung/${video.nguoiDang?.id}`)}
                    style={{ cursor: "pointer" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultAvatar;
                    }}
                  />

                  <div
                    className={`vdv-icon-button vdv-like-button ${
                      video.isLiked ? "liked" : ""
                    }`}
                    onClick={() => handleLike(video)}
                    title={
                      !token
                        ? "Bạn cần đăng nhập để tym"
                        : video.isLiked
                        ? "Đã tym"
                        : "Nhấn để tym"
                    }
                  >
                    {video.isLiked ? (
                      <IoHeart size={28} color="#ff4d6d" />
                    ) : (
                      <IoHeartOutline size={28} color="#ccc" />
                    )}
                  </div>
                  <div className="vdv-icon-label">
                    {formatCount(video.soTym || 0)}
                  </div>

                  <div
                    className="vdv-icon-wrapper"
                    onClick={() => handleToggleSave(video)}
                    title={
                      !user
                        ? "Bạn cần đăng nhập để lưu video"
                        : video.isSaved
                        ? "Đã lưu video"
                        : "Lưu video"
                    }
                    style={{ marginTop: "8px" }}
                  >
                    <div className="vdv-icon-button vdv-save-button">
                      {video.isSaved ? (
                        <IoBookmark size={24} color="gold" />
                      ) : (
                        <IoBookmarkOutline size={24} color="gray" />
                      )}
                    </div>
                    <div className="vdv-icon-label" style={{ marginTop: "10px" }}>
                      {formatCount(video.soNguoiLuu || 0)}
                    </div>
                  </div>

                  <div
                    className="vdv-icon-button"
                    onClick={() => handleToggleComments(video)}
                  >
                    <FaRegCommentDots size={24} color="#ccc" />
                  </div>
                  <div className="vdv-icon-label">{video.soBinhLuan || 0}</div>

                  {/* Icon Xem Chi Tiết */}
                  <div
                    className="vdv-icon-button vdv-detail-button"
                    onClick={() => handleShowDetail(video.maTinDang)}
                    title="Xem chi tiết tin đăng"
                    style={{ marginTop: "12px" }}
                  >
                    <FaInfoCircle size={24} color="#ccc" />
                  </div>
                </div>
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
        onClose={handleCloseDetail}
        loading={loadingDetail}
        data={detailData}
      />
    </div>
  );
};

export default VideoDetailViewer;