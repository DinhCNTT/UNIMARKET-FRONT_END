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
const SLIDE_DURATION = 650;

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
    reloadForYou // <--- THÊM DÒNG NÀY
  } = useVideoFeed({ manualMode: !!id });
  
  // Mặc định bắt đầu từ 0
  const [currentIndex, setCurrentIndex] = useState(0);

  console.log("-----------------------------------");
  console.log("1️⃣ [DetailViewer] Render");
  console.log("   👉 URL ID:", id);
  console.log("   👉 Router State (Seed Video):", seedVideoFromRouter?.maTinDang);
  console.log("   👉 Current Index:", currentIndex); // Giờ thì OK rồi
  console.log("   👉 Video List Length:", videoList.length);

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

  // ======================================================
  // ✅ LOGIC KHỞI TẠO TỪ URL ID (Code 2 Integration)
  // ======================================================
  useEffect(() => {
    if (id) {
       const videoIdNum = parseInt(id);
       const currentFirstVideo = videoList.length > 0 ? videoList[0] : null;

       // Kiểm tra xem video đầu tiên hiện tại có khớp ID không
       const isMismatch = !currentFirstVideo || String(currentFirstVideo.maTinDang) !== String(id);

       if (isMismatch) {
          console.log("🛠 Init video:", videoIdNum);
          
          // 1. Ưu tiên lấy dữ liệu từ Router (Seed) để hiển thị NGAY LẬP TỨC (tránh màn hình đen)
          if (seedVideoFromRouter && String(seedVideoFromRouter.maTinDang) === String(id)) {
             console.log("⚡ [Pha 1] Hiển thị ngay dữ liệu từ Router (có thể cũ/thiếu)");
             
             // Gọi hàm của bạn để setup list ban đầu
             initializeWithVideo(seedVideoFromRouter);

             // 2. NGAY SAU ĐÓ: Gọi ngầm API để lấy số liệu chính xác (Lượt view, tim, share...)
             // Việc này chạy song song, người dùng đang xem video thì số sẽ tự nhảy về đúng
             axios.get(`${API_BASE}/api/video/detail/${id}`, { 
                 headers: token ? { Authorization: `Bearer ${token}` } : {} 
             })
             .then(res => {
                 console.log("✅ [Pha 2] Đã lấy được dữ liệu tươi từ Server");
                 const freshVideo = res.data;

                 // CẬP NHẬT LẠI LIST MỘT CÁCH ÂM THẦM (SILENT UPDATE)
                 setVideoList(prevList => {
                     // Nếu list chưa có gì hoặc video đầu khác ID (user đã lướt đi chỗ khác) -> Bỏ qua
                     if (prevList.length === 0 || String(prevList[0].maTinDang) !== String(id)) {
                         return prevList;
                     }

                     // Tạo mảng mới, giữ nguyên các video phía sau (đề xuất), chỉ thay thế video đầu
                     const newList = [...prevList];
                     
                     // 🔥 KỸ THUẬT QUAN TRỌNG: 
                     // Giữ nguyên các trường điều khiển player cũ (để video không bị reload/khựng lại)
                     // Chỉ ghi đè các thông số (tim, share, comment...)
                     newList[0] = {
                         ...prevList[0], // Giữ lại state cũ (ví dụ đang play đến giây thứ 5)
                         ...freshVideo,  // Ghi đè dữ liệu mới từ server vào
                         // Đảm bảo ID không đổi để React không hủy component VideoPlayer
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

  // 🔴 LOG 2: Theo dõi biến động State
  useEffect(() => {
    if (videoList.length > 0) {
        console.log(`2️⃣ [State Change] VideoList updated. Length: ${videoList.length}`);
        console.log(`   👉 Video[0] ID: ${videoList[0].maTinDang}`);
        console.log(`   👉 Current Index is: ${currentIndex}`);
        
        // Kiểm tra xem video đầu tiên có khớp với ID trên URL không
        if (parseInt(id) !== videoList[0].maTinDang) {
            console.error(`🚨 LỖI LỚN: ID trên URL (${id}) KHÁC ID video đầu tiên (${videoList[0].maTinDang})`);
        } else {
            console.log(`✅ Video đầu tiên khớp với URL.`);
        }
    }
  }, [videoList, currentIndex, id]);

  // ======================================================
  // ✅ LOGIC RESET KHI RELOAD (Code 1)
  // ======================================================
  // ✅ CODE MỚI: Dừng video cũ trước khi load cái mới
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

        // 🔥 FIX QUAN TRỌNG 1: Xóa sạch bộ nhớ tỷ lệ khung hình cũ
        // Giúp video mới không bị áp dụng nhầm khung hình của video cũ
        setAspectRatios({}); 

        // 🔥 FIX QUAN TRỌNG 2: Xóa tạm danh sách video
        // Giúp ngăn chặn hiệu ứng "trượt ngược" về video cũ
        // Màn hình sẽ hiển thị loading trong tích tắc rồi hiện video mới ngay
        setVideoList([]); 

        // Reset Index về 0
        setCurrentIndex(0);
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }

        // Tải video mới
        reloadForYou();

        prevRefreshSignalRef.current = refreshSignal;
    }
  }, [refreshSignal, reloadForYou, setVideoList]);


  // ======================================================
  // ✅ LOGIC INFINITE SCROLL (Code 1)
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
        .then((res) => setIsFollowing(res.data.isFollowing))
        .catch(() => setIsFollowing(false));
    } else {
      setIsFollowing(false);
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
            // 🔥 FIX: Đảm bảo dùng 'soNguoiLuu' và ép kiểu số để tránh lỗi cộng chuỗi
            const currentSaveCount = typeof v.soNguoiLuu === 'number' ? v.soNguoiLuu : 0;
            
            return {
              ...v,
              isSaved: newIsSaved,
              // Tăng giảm dựa trên số hiện tại
              soNguoiLuu: newIsSaved ? currentSaveCount + 1 : Math.max(0, currentSaveCount - 1),
            };
          }
          return v;
        })
      );

      // Gọi API
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

      // Cập nhật lại từ phản hồi server (chuẩn xác nhất)
      const { saved, totalSaves } = data;
      setVideoList((prevList) =>
        prevList.map((v) =>
          v.maTinDang === videoToSave.maTinDang
            ? { ...v, isSaved: saved, soNguoiLuu: totalSaves } // 🔥 FIX: Dùng soNguoiLuu
            : v
        )
      );
    } catch (err) {
      console.error("Lỗi khi lưu video:", err);
      // Revert nếu lỗi (Optional)
    }
  };

  // =======================
  // SHARE (SỬA LẠI LOGIC NÀY)
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

  // ======================================================
  // CHUYỂN VIDEO (WHEEL + TOUCH)
  // ======================================================
  const goToIndex = (nextIndex) => {
    if (isAnimatingRef.current) return;
    
    // Chặn lướt quá giới hạn
    if (nextIndex < 0) return;
    if (nextIndex >= videoList.length) return;

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

  // WHEEL
  useEffect(() => {
    const handleWheel = (e) => {
      // 🔥 FIX LỖI: Nếu đang giữ phím Ctrl (để Zoom), thì KHÔNG ĐƯỢC CHẶN sự kiện
      if (e.ctrlKey) return; 

      if (showComments || showDetailPanel || showSharePanel) return;
      
      // Chỉ chặn scroll mặc định khi không Zoom và không mở panel
      e.preventDefault();
      
      if (isAnimatingRef.current) return;

      if (e.deltaY > 0) goToIndex(currentIndex + 1);
      else goToIndex(currentIndex - 1);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [currentIndex, videoList.length, showComments, showDetailPanel, showSharePanel]);

  // TOUCH
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

  // Autoplay
  // ✅ CODE MỚI: Thêm videoList vào để biết khi nào có video mới về thì chạy
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
                
                // 🔥 FIX QUAN TRỌNG:
                // Nếu là video MỚI (isSameVideo === false) -> Thì mới ép chạy (Autoplay)
                // Nếu là video CŨ (isSameVideo === true) -> Tức là chỉ bấm Tym/Lưu -> KHÔNG CAN THIỆP (đang Pause thì kệ Pause)
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
    document.body.classList.remove("video-transitioning");

    return () => {
      document.body.style.overflow = "";
      document.body.className = originalBodyStyle.current.className;
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // ======================================================
  // REALTIME
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

    // 1. Xử lý Like (Tym)
    const handleUpdateLike = (maTinDang, soTym) => {
      setVideoList((list) => 
        list.map((v) => (v.maTinDang === maTinDang ? { ...v, soTym } : v))
      );
    };

    // 2. Xử lý Save (Lưu) - 🔥 FIX: Gán vào `soNguoiLuu`
    const handleUpdateSave = (maTinDang, totalSaves) => {
      setVideoList((list) => 
        list.map((v) => (v.maTinDang === maTinDang ? { ...v, soNguoiLuu: totalSaves } : v))
      );
    };

    // 3. Xử lý Share (Chia sẻ) - 🔥 FIX QUAN TRỌNG
    const handleUpdateShare = (maTinDang, totalShares) => {
      setVideoList((list) => 
        list.map((v) => {
          if (v.maTinDang === maTinDang) {
            // Server là chân lý (Source of Truth). 
            // Nếu Server bảo 55 thì là 55, bất kể Client đang hiển thị 54 hay 56.
            // Việc này giúp đồng bộ chính xác giữa người Share (User A) và người xem (User B).
            return { ...v, soLuotChiaSe: totalShares };
          }
          return v;
        })
      );
    };
    // 4. Xử lý Comment (Bình luận)
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

    // --- 🔥 CLEANUP (BẮT BUỘC): Hủy đăng ký khi component unmount hoặc re-render ---
    // Nếu thiếu đoạn này, sự kiện sẽ chạy 2 lần -> gây lỗi nhảy số đôi
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
  // 🔥 Code 2: Sửa lại điều kiện loading để tránh màn hình đen khi đang init
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

    {/* ===================== VIDEO LIST ===================== */}
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
            <div key={video.maTinDang || index} className={`video-item ${ratioClass}`}>
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
    {/* ✅ THANH ĐIỀU HƯỚNG BÊN PHẢI (CODE 2 ĐÃ GHÉP) */}
    {/* ======================================================== */}
    <div className="vdv-right-nav">
      <button
        className="vdv-nav-btn"
        onClick={() => goToIndex(currentIndex - 1)}
        disabled={currentIndex === 0 || isAnimatingRef.current}
        title="Video trước"
      >
        <IoChevronUp size={24} />
      </button>

      <div className="vdv-nav-divider"></div>

      <button
        className="vdv-nav-btn"
        onClick={() => goToIndex(currentIndex + 1)}
        disabled={
          currentIndex === videoList.length - 1 || isAnimatingRef.current
        }
        title="Video tiếp theo"
      >
        <IoChevronDown size={24} />
      </button>
    </div>
  </div>
);

};

export default VideoDetailViewer;