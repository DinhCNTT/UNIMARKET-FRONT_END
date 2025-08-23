import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import './VideoDetailViewer.css';
import { IoHeart, IoHeartOutline } from "react-icons/io5"; // Icon mới
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

const VideoDetailViewer = ({ onOpenChat }) => {
  const [videoList, setVideoList] = useState([]);
  const [searchParams] = useSearchParams();
  const initialIndexFromUrl = parseInt(searchParams.get('index')) || 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndexFromUrl);
  const [showMore, setShowMore] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const descriptionRef = useRef(null);
  const iconCircleRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isOverflowing, setIsOverflowing] = useState(false);
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

  // Thời lượng animation phải khớp với CSS (ms)
const SLIDE_DURATION = 650;

const containerRef = useRef(null);
// Mảng ref cho tất cả video để control play/pause
const videoElsRef = useRef([]);
// Lock khi đang animate để không nhảy liên tục
const isAnimatingRef = useRef(false);

// Điều hướng an toàn + đồng bộ transition
const goToIndex = (nextIndex) => {
  if (isAnimatingRef.current) return;
  if (nextIndex < 0 || nextIndex >= videoList.length) return;
  if (nextIndex === currentIndex) return;

  isAnimatingRef.current = true;
  document.body.classList.add("video-transitioning");

  setCurrentIndex(nextIndex);
  setShowMore(false);

  // Mở khoá sau khi CSS kết thúc
  setTimeout(() => {
    isAnimatingRef.current = false;
    document.body.classList.remove("video-transitioning");
  }, SLIDE_DURATION + 80); // thêm 80ms buffer
};

  const handleToggleComments = () => {
  setShowComments(prev => !prev);
};
useEffect(() => {
  // Khi vào trang này → chặn cuộn
  document.body.style.overflow = "hidden";

  // Khi rời trang → khôi phục cuộn
  return () => {
    document.body.style.overflow = "";
  };
}, []);
// Đồng bộ khi videoData thay đổi
useEffect(() => {
  if (!videoData?.maTinDang) return;

  const fetchSaveInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      let headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.get(
        `http://localhost:5133/api/video/${videoData.maTinDang}/savedinfo`,
        { headers }
      );

      const { isSaved, soNguoiLuu } = res.data;

      setVideoList(prevList =>
        prevList.map((v, i) =>
          i === currentIndex
            ? { ...v, isSaved, soNguoiLuu }
            : v
        )
      );

      setIsSaved(isSaved);
    } catch (err) {
      console.error("Lỗi khi lấy thông tin lưu video:", err);
    }
  };

  fetchSaveInfo();
}, [videoData?.maTinDang]); // ✅ chỉ gọi khi đổi sang video mới

// load video
useEffect(() => {
  const fetchVideos = async () => {
    try {
      const res = await axios.get("http://localhost:5133/api/video");
      setVideoList(res.data);

      // 👉 chọn video ngẫu nhiên thay vì video cuối
      if (res.data.length > 0) {
        const randomIndex = Math.floor(Math.random() * res.data.length);
        setCurrentIndex(randomIndex);
      }

    } catch (err) {
      console.error("Lỗi load video:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    fetchVideos();
  }
}, [reloadFlag, loading]);



  useEffect(() => {
    const fetchAllVideos = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5133/api/video", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVideoList(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách video:", err);
      }
    };
    fetchAllVideos();
  }, []);

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
      // Cuộn xuống → sang video tiếp theo
      goToIndex(currentIndex + 1);
    } else if (e.deltaY < 0) {
      // Cuộn lên → về video trước
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
  const THRESHOLD = 60; // px

  const onTouchStart = (e) => {
    if (isAnimatingRef.current) return;
    startY = e.touches[0].clientY;
    lastY = startY;
  };

  const onTouchMove = (e) => {
    if (isAnimatingRef.current) return;
    lastY = e.touches[0].clientY;
    // Chặn scroll mặc định để hiệu ứng mượt
    e.preventDefault();
  };

  const onTouchEnd = () => {
    if (isAnimatingRef.current) return;
    const delta = lastY - startY;
    if (Math.abs(delta) > THRESHOLD) {
      if (delta < 0) {
        // vuốt lên → next
        goToIndex(currentIndex + 1);
      } else {
        // vuốt xuống → prev
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
      // Cố gắng play, nếu browser block thì bỏ qua
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
      `http://localhost:5133/api/video/${video.maTinDang}/like`, // toggle trạng thái like
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
      // Hiệu ứng tim khi like
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



  const handleChatWithSeller = async () => {
    const currentVideo = videoList[currentIndex];
    
    if (!user) {
      alert("Bạn cần đăng nhập để chat với người bán.");
      return;
    }
    
    if (user.id === currentVideo.nguoiDang?.id) {
      alert("Bạn không thể chat với chính mình.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5133/api/chat/start", {
        MaNguoiDung1: user.id,
        MaNguoiDung2: currentVideo.nguoiDang?.id,
        MaTinDang: currentVideo.maTinDang,
      });
      
      const maCuocTroChuyen =
        response.data.maCuocTroChuyen || response.data.MaCuocTroChuyen || null;
        
      if (maCuocTroChuyen) {
        if (typeof onOpenChat === "function") {
          onOpenChat(maCuocTroChuyen);
        } else {
          navigate(`/chat/${maCuocTroChuyen}`);
        }
      } else {
        alert("Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error("Lỗi tạo cuộc trò chuyện:", error);
      if (error.response) {
        console.error("Chi tiết lỗi từ server:", error.response.data);
      }
      alert("Lỗi khi tạo cuộc trò chuyện. Vui lòng thử lại.");
    }
  };

  // hàm lưu video 
const handleToggleSave = async () => {
  const token = localStorage.getItem("token");

  // ✅ Check đăng nhập gọn hơn
  if (!user || !token) {
    alert("Bạn cần đăng nhập để lưu video!");
    return;
  }

  try {
    // ✅ Chỉ gọi 1 request, backend đã xử lý hết
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

    // ✅ Cập nhật list video
    setVideoList(prevList =>
      prevList.map((v, i) =>
        i === currentIndex
          ? { ...v, isSaved: saved, soNguoiLuu: totalSaves }
          : v
      )
    );

    // (Nếu có state riêng cho icon)
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
    // Single click → play / pause
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
    }, 250); // thời gian phân biệt single vs double click
  } else if (clickCountRef.current === 2) {
    // Double click → like
    clearTimeout(clickTimeoutRef.current);

    handleLike(videoList[index]); // Gọi API like

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
    {/* Navbar giữ nguyên */}
    <TopNavbarUniMarket />

    {/* Overlay loading */}
    {loading && (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <span>Đang tải video...</span>
      </div>
    )}

    {/* Video List */}
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
              {/* Video Container */}
              <div
                className={`vdv-container ${ratioClass} ${
                  showComments ? "comment-open" : ""
                }`}
              >
                <video
                  ref={(el) => (videoElsRef.current[index] = el)}
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
                {/* Overlay thông tin mô tả */}
                <div className="vdv-overlay">
                  <div className="vdv-info-left">
                    <div className="vdv-user-name">
                      @{video.nguoiDang?.fullName}
                    </div>
                    <div className="vdv-title">{video.tieuDe}</div>

                    <div
                      className={`vdv-description ${
                        showMore ? "vdv-description-expanded" : ""
                      }`}
                      ref={descriptionRef}
                    >
                      {video.moTa}
                    </div>

                    {isOverflowing && !showMore && (
                      <span
                        className="vdv-toggle-description"
                        onClick={() => setShowMore(true)}
                      >
                        Xem thêm
                      </span>
                    )}
                    {showMore && (
                      <span
                        className="vdv-toggle-description"
                        onClick={() => setShowMore(false)}
                      >
                        Thu gọn
                      </span>
                    )}

                    <div className="vdv-price-address">
                      <div className="vdv-price">
                        {video.gia?.toLocaleString()} đ
                      </div>
                      <div className="vdv-address">
                        {video.diaChi}, {video.quanHuyen}, {video.tinhThanh}
                      </div>
                    </div>
                  </div>
                </div>
                {/* End Overlay */}
              </div>

              {/* Side Info - nằm ngoài video nhưng trượt cùng video */}
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

                {/* Like Button */}
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

                {/* Save Button */}
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

                {/* Comments Button */}
                <div
                  className="vdv-icon-button"
                  onClick={() => handleToggleComments(video)}
                >
                  <FaRegCommentDots size={24} color="#ccc" />
                </div>
                <div className="vdv-icon-label">{video.soBinhLuan || 0}</div>

                {/* Chat Button */}
                {user?.id !== video.nguoiDang?.id && (
                  <div
                    className="vdv-icon-button vdv-chat-button"
                    onClick={() => handleChatWithSeller(video)}
                    title={
                      !user ? "Bạn cần đăng nhập để chat" : "Chat với người bán"
                    }
                  >
                    <SiMinutemailer size={24} color="#ccc" />
                  </div>
                )}
              </div>
              {/* End Side Info */}
            </div>
          );
        })}
      </div>
    </div>
    {/* Heart animation để ngoài global */}
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
  </div>
);


};

export default VideoDetailViewer;
