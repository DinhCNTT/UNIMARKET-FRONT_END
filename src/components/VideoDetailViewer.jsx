// src/components/VideoDetailViewer.jsx
import React, { useEffect, useState, useRef, useContext } from "react";
import { useSearchParams, useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";

// 🔥 Icons
import { IoHeart, IoChevronUp, IoChevronDown } from "react-icons/io5";

// 🔥 Components & Context
import TopNavbarUniMarket from "./TopNavbarUniMarket";
import VideoDetailHeader from "./VideoDetailHeader";
import CommentDrawer from "./CommentDrawer";
import VideoDetailsPanel from "./VideoDetailsPanel";
import SharePanel from "./SharePanel";
import { AuthContext } from "../context/AuthContext";
import { useVideoHub } from "../context/VideoHubContext";
import { VideoContext } from "../context/VideoContext"; 

// 🔥 Theme
import { useTheme } from "../context/ThemeContext";

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

// ======================================================
//  COMPONENT CHÍNH
// ======================================================
const VideoDetailViewer = () => {

  // =======================
  // 🎨 THEME từ context
  // =======================
  const { effectiveTheme } = useTheme();

  // =======================
  // STATE & DATA
  // =======================
  // Lấy ID video từ URL (VD: /video/15)
  const { id } = useParams();
  const location = useLocation();
  const seedVideoFromRouter = location.state?.seedVideo;

  // Lấy refreshSignal từ VideoContext
  const { refreshSignal } = useContext(VideoContext);

  // ✅ Lấy thêm initializeWithVideo từ hook
  const { 
    videoList, 
    setVideoList, 
    loading, 
    fetchMore, 
    hasMore, 
    initializeWithVideo,
    reloadForYou 
  } = useVideoFeed({ manualMode: !!id });
  
  // Mặc định bắt đầu từ 0
  const [currentIndex, setCurrentIndex] = useState(0);

  // Debug Logs
  // console.log("--- [DetailViewer] Render ---");
  // console.log("👉 Current Index:", currentIndex);
  // console.log("👉 Video List Length:", videoList.length);

  const [showHeart, setShowHeart] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("token");

  // UI Panels State
  const [showComments, setShowComments] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);

  // Video State
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false); 
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [aspectRatios, setAspectRatios] = useState({});
  // Refs
  const videoRef = useRef(null);
  const videoElsRef = useRef([]);      // Ref đến thẻ <video> để play/pause
  const containerRef = useRef(null);   // Ref đến container chính để cuộn
  const itemRefs = useRef([]);         // 🔥 Ref đến từng item (div bao quanh video) để observer bắt
  
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

  // ======================================================
  // ✅ LOGIC SCROLL SNAP & OBSERVER (MỚI - TỪ CODE 2)
  // ======================================================
  
  // Tự động cập nhật currentIndex khi video lướt vào vùng nhìn thấy
  useEffect(() => {
    const observerOptions = {
      root: containerRef.current, // null = viewport, hoặc dùng containerRef nếu scroll bên trong div
      threshold: 0.6, // Video phải hiện 60% thì mới tính là đã chuyển slide
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute("data-index"));
          if (!isNaN(index) && index !== currentIndex) {
            console.log("👀 Scrolled to video index:", index);
            
            // Dừng tracking video cũ trước khi chuyển
            // Lưu ý: videoList[currentIndex] là video cũ ở thời điểm này
            if (videoList[currentIndex]) {
              stopViewTracking(videoList[currentIndex].maTinDang);
            }
            
            setCurrentIndex(index);
          }
        }
      });
    }, observerOptions);

    // Gắn observer vào các item
    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoList, stopViewTracking]); // Bỏ currentIndex khỏi dependency để tránh loop Observer

  // ======================================================
  // ✅ ĐIỀU HƯỚNG BẰNG NÚT (Sửa lại dùng scrollIntoView)
  // ======================================================
  const goToIndex = (index) => {
    if (index >= 0 && index < videoList.length) {
      const targetEl = itemRefs.current[index];
      if (targetEl) {
        // Lệnh này sẽ cuộn mượt đến video đó nhờ CSS scroll-behavior hoặc tham số smooth
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        // Không cần setCurrentIndex ở đây vì Observer phía trên sẽ tự bắt được và set
      }
    }
  };

  // ======================================================
  // ✅ LOGIC KHỞI TẠO TỪ URL ID
  // ======================================================
  useEffect(() => {
    if (id) {
       const videoIdNum = parseInt(id);
       const currentFirstVideo = videoList.length > 0 ? videoList[0] : null;

       // Kiểm tra xem video đầu tiên hiện tại có khớp ID không
       const isMismatch = !currentFirstVideo || String(currentFirstVideo.maTinDang) !== String(id);

       if (isMismatch) {
          console.log("🛠 Init video:", videoIdNum);
          
          // 1. Ưu tiên lấy dữ liệu từ Router (Seed) để hiển thị NGAY LẬP TỨC
          if (seedVideoFromRouter && String(seedVideoFromRouter.maTinDang) === String(id)) {
             console.log("⚡ [Pha 1] Hiển thị ngay dữ liệu từ Router");
             initializeWithVideo(seedVideoFromRouter);

             // 2. NGAY SAU ĐÓ: Gọi ngầm API để lấy số liệu chính xác
             axios.get(`${API_BASE}/api/video/detail/${id}`, { 
                 headers: token ? { Authorization: `Bearer ${token}` } : {} 
             })
             .then(res => {
                 console.log("✅ [Pha 2] Đã lấy được dữ liệu tươi từ Server");
                 const freshVideo = res.data;

                 setVideoList(prevList => {
                     if (prevList.length === 0 || String(prevList[0].maTinDang) !== String(id)) {
                         return prevList;
                     }
                     const newList = [...prevList];
                     newList[0] = {
                         ...prevList[0], 
                         ...freshVideo, 
                         maTinDang: prevList[0].maTinDang 
                     };
                     return newList;
                 });
             })
             .catch(err => console.error("⚠️ Lỗi làm mới dữ liệu:", err));

          } else {
             // Nếu không có dữ liệu từ Router thì tải bình thường
             console.log("⚠️ Không có Router State, tải mới từ đầu");
             initializeWithVideo(id);
          }
       }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, seedVideoFromRouter]);

  // ======================================================
  // ✅ LOGIC RESET KHI RELOAD (FOR YOU)
  // ======================================================
  const prevRefreshSignalRef = useRef(refreshSignal);

  useEffect(() => {
    if (refreshSignal !== prevRefreshSignalRef.current) {
        console.log("🔄 RefreshSignal received → Cleaning up...");

        // 1. Dừng video cũ
        if (videoElsRef.current) {
            videoElsRef.current.forEach(video => {
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            });
        }

        setAspectRatios({}); 
        setVideoList([]); 

        // Reset Index về 0
        setCurrentIndex(0);
        
        // Reset vị trí scroll về đầu
        if (containerRef.current) {
            containerRef.current.scrollTo(0, 0);
        }

        // Tải video mới
        reloadForYou();

        prevRefreshSignalRef.current = refreshSignal;
    }
  }, [refreshSignal, reloadForYou, setVideoList]);


  // ======================================================
  // ✅ LOGIC INFINITE SCROLL
  // ======================================================
  useEffect(() => {
    if (!loading && hasMore && videoList.length > 0 && currentIndex >= videoList.length - 2) {
      fetchMore();
    }
  }, [currentIndex, videoList.length, hasMore, loading, fetchMore]);

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
        .then((res) => {
             setIsFollowing(res.data.isFollowing);
             setIsPending(res.data.isPending);
        })
        .catch(() => {
             setIsFollowing(false);
             setIsPending(false);
        });
    } else {
      setIsFollowing(false);
      setIsPending(false);
    }
  }, [videoData?.nguoiDang?.id, token]);

  const handleToggleFollow = async () => {
    if (!token) return alert("Bạn cần đăng nhập để follow!");
    if (!videoData) return;

    const targetId = videoData.nguoiDang.id;
    const isPrivate = videoData.nguoiDang?.isPrivateAccount || false;

    if (isPending) {
        setIsPending(false);
    } else if (isFollowing) {
        setIsFollowing(false);
    } else {
        if (isPrivate) {
            setIsPending(true); 
        } else {
            setIsFollowing(true); 
        }
    }

    try {
      const res = await axios.post(
          `${API_BASE}/api/follow/toggle?targetUserId=${targetId}`, 
          {}, 
          { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
          setIsFollowing(res.data.isFollowed);
          setIsPending(res.data.isPending);
      }
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
      // Optimistic Update
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
            const currentSaveCount = typeof v.soNguoiLuu === 'number' ? v.soNguoiLuu : 0;
            return {
              ...v,
              isSaved: newIsSaved,
              soNguoiLuu: newIsSaved ? currentSaveCount + 1 : Math.max(0, currentSaveCount - 1),
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
    console.log("Share thành công! Đợi SignalR cập nhật số liệu...");
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

  // =======================
  // AUTOPLAY LOGIC
  // =======================
  const lastPlayedVideoIdRef = useRef(null);

  useEffect(() => {
    // Delay 100ms để React kịp vẽ
    const timer = setTimeout(() => {
        const currentVideo = videoList[currentIndex];
        
        // Kiểm tra xem có phải vẫn là video cũ không?
        const isSameVideo = currentVideo && lastPlayedVideoIdRef.current === currentVideo.maTinDang;

        // Cập nhật ID mới để lần sau so sánh
        if (currentVideo) {
            lastPlayedVideoIdRef.current = currentVideo.maTinDang;
        }

        videoElsRef.current.forEach((v, i) => {
            if (!v) return;
            
            if (i === currentIndex) {
                // Video hiện tại (Active Slide)
                // Nếu là video MỚI (isSameVideo === false) -> Thì mới ép chạy (Autoplay)
                // Nếu là video CŨ (isSameVideo === true) -> KHÔNG CAN THIỆP (đang Pause thì kệ Pause)
                if (!isSameVideo) {
                    const playPromise = v.play();
                    if (playPromise !== undefined) {
                        playPromise.catch((err) => console.log("Autoplay block:", err));
                    }
                }
            } else {
                // Video khác (Slide khác) -> Luôn luôn DỪNG và tua về 0
                v.pause();
                v.currentTime = 0;
            }
        });
    }, 100);

    return () => clearTimeout(timer);
    
  }, [currentIndex, videoList]);

  // Cleanup body style
  useEffect(() => {
    originalBodyStyle.current.className = document.body.className;
    document.body.style.overflow = "hidden";
    
    return () => {
      document.body.style.overflow = "";
      document.body.className = originalBodyStyle.current.className;
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // ======================================================
  // REALTIME (SignalR)
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

  useEffect(() => {
    // Chỉ chạy khi có kết nối
    if (!connection || !isConnected) return;

    // 1. Like
    const handleUpdateLike = (maTinDang, soTym) => {
      setVideoList((list) => 
        list.map((v) => (v.maTinDang === maTinDang ? { ...v, soTym } : v))
      );
    };

    // 2. Save
    const handleUpdateSave = (maTinDang, totalSaves) => {
      setVideoList((list) => 
        list.map((v) => (v.maTinDang === maTinDang ? { ...v, soNguoiLuu: totalSaves } : v))
      );
    };

    // 3. Share
    const handleUpdateShare = (maTinDang, totalShares) => {
      setVideoList((list) => 
        list.map((v) => {
          if (v.maTinDang === maTinDang) {
            return { ...v, soLuotChiaSe: totalShares };
          }
          return v;
        })
      );
    };
    // 4. Comment
    const handleUpdateCommentCount = (maTinDang, totalComments) => {
      setVideoList((list) => 
        list.map((v) => (v.maTinDang === maTinDang ? { ...v, soBinhLuan: totalComments } : v))
      );
    };

    // --- Đăng ký sự kiện ---
    connection.on("UpdateLikeCount", handleUpdateLike);
    connection.on("UpdateSaveCount", handleUpdateSave);
    connection.on("UpdateShareCount", handleUpdateShare);
    connection.on("UpdateCommentCount", handleUpdateCommentCount);

    // --- Cleanup ---
    return () => {
      connection.off("UpdateLikeCount", handleUpdateLike);
      connection.off("UpdateSaveCount", handleUpdateSave);
      connection.off("UpdateShareCount", handleUpdateShare);
      connection.off("UpdateCommentCount", handleUpdateCommentCount);
    };
  }, [connection, isConnected, setVideoList]);

  // ======================================================
  // RENDER
  // ======================================================
  
  if (loading && videoList.length === 0) {
    return (
      <div className="loading-overlay" style={{background: 'black', zIndex: 99999}}>
        <div className="spinner"></div>
        <p style={{marginTop: 10, color: '#fff'}}>Đang tải video...</p>
      </div>
    );
  }

  if (!videoData && !loading) {
    return (
        <div style={{ color: "white", display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "black" }}>
            Không có video nào.
        </div>
    );
  }

  let videoThumbnail = videoData?.hinhAnh;
  if (videoData?.videoUrl?.includes("cloudinary")) {
    const lastDot = videoData.videoUrl.lastIndexOf(".");
    if (lastDot !== -1) {
      videoThumbnail = videoData.videoUrl.substring(0, lastDot) + ".jpg";
    }
  }

  return (
    <div className="vdv-wrapper vdv-full-screen-scroll" data-theme={effectiveTheme}>
      <TopNavbarUniMarket />

      {!showComments && <VideoDetailHeader />}

      {/* Loading lần đầu */}
      {loading && videoList.length === 0 && (
        <div className="loading-overlay" style={{ zIndex: 10000 }}>
          <div className="spinner"></div>
        </div>
      )}

      {/* Loading khi kéo tiếp video */}
      {loading && videoList.length > 0 && (
        <div
          className="loading-indicator-bottom"
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <div
            className="spinner-small"
            style={{
              width: "24px",
              height: "24px",
              border: "3px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}

      {/* ===================== VIDEO LIST (Đã sửa logic cuộn) ===================== */}
      <div
        ref={containerRef}
        className="video-list-container" // Đảm bảo CSS class này có scroll-snap-type: y mandatory
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        // 🔥 ĐÃ XÓA transform (quan trọng)
      >
        <div className="video-list-wrapper">
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
                data-index={index} // 🔥 Để Observer đọc được index
                ref={(el) => (itemRefs.current[index] = el)} // 🔥 Gán ref để Observer bắt
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
                  isPending={index === currentIndex ? isPending : false}
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

      {/* ❤️ Animation tim */}
      {showHeart && (
        <div className="vdv-heart-animation">
          <IoHeart size={80} color="#ff4d6d" />
        </div>
      )}

      {/* ===================== COMMENT DRAWER ===================== */}
      {showComments && (
        <CommentDrawer
          maTinDang={videoData?.maTinDang}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* ===================== DETAIL PANEL ===================== */}
      <VideoDetailsPanel
        isOpen={showDetailPanel}
        onClose={() => setShowDetailPanel(false)}
        loading={loadingDetail}
        data={detailData}
      />

      {/* ===================== SHARE PANEL ===================== */}
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

      {/* ======================================================== */}
      {/* ✅ THANH ĐIỀU HƯỚNG BÊN PHẢI (Đã thêm logic shift-for-comments) */}
      {/* ======================================================== */}
      <div className={`vdv-right-nav ${showComments ? "shift-for-comments" : ""}`}>
        <button
          className="vdv-nav-btn"
          onClick={() => goToIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
          title="Video trước"
        >
          <IoChevronUp size={24} />
        </button>
        <div className="vdv-nav-divider"></div>

        <button
          className="vdv-nav-btn"
          onClick={() => goToIndex(currentIndex + 1)}
          disabled={currentIndex === videoList.length - 1}
          title="Video tiếp theo"
        >
          <IoChevronDown size={24} />
        </button>
      </div>
    </div>
  );
};

export default VideoDetailViewer;