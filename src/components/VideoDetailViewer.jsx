import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import './VideoDetailViewer.css';
import TopNavbar from "../components/TopNavbar";
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
  setIsSaved(videoData?.isSaved || false);
}, [videoData]);

useEffect(() => {
  if (!videoData) return;

  const fetchSaveInfo = async () => {
  try {
    const token = localStorage.getItem("token");
    let headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

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
}, [user, currentIndex, videoData]);

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
  let isScrolling = false;
  let scrollTimeout = null;

  const handleWheel = (e) => {
    e.preventDefault(); // Chặn cuộn mặc định

    if (isScrolling) return;
    isScrolling = true;

    let nextIndex = currentIndex;
    if (e.deltaY > 0 && currentIndex < videoList.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (e.deltaY < 0 && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }

    if (nextIndex !== currentIndex) {
      document.body.classList.add("video-transitioning");

      // Delay nhẹ trước khi đổi video (tạo cảm giác mượt)
      setTimeout(() => {
        requestAnimationFrame(() => {
          setCurrentIndex(nextIndex);
          setShowMore(false);
        });
      }, 700); // 120ms delay

      // Sau animation thì mở khóa cuộn
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        document.body.classList.remove("video-transitioning");
      }, 900); // 650ms transition + 50ms buffer
    } else {
      isScrolling = false;
    }
  };

  window.addEventListener("wheel", handleWheel, { passive: false });

  return () => {
    window.removeEventListener("wheel", handleWheel);
    clearTimeout(scrollTimeout);
  };
}, [currentIndex, videoList.length]);


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

const handleVideoClick = (e) => {
  e.preventDefault();
  e.stopPropagation();

  clickCountRef.current += 1;

  if (clickCountRef.current === 1) {
    // Xử lý click đơn: play/pause video sau 300ms nếu không có click thứ hai
    clickTimeoutRef.current = setTimeout(() => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
      clickCountRef.current = 0;
    }, 300);
  } else if (clickCountRef.current === 2) {
    // Xử lý double click: like video, tạo hiệu ứng tim và hiệu ứng pulse vòng tròn
    clearTimeout(clickTimeoutRef.current);
    handleLike(); // Gọi API like nếu chưa like

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
    {/* Thanh top navbar */}
    <TopNavbarUniMarket />
    {/* Container video */}
    <div className={`vdv-container ${
      videoAspectRatio < 1 ? 'vdv-portrait' : 
      videoAspectRatio > 1.5 ? 'vdv-landscape' : 
      'vdv-square'
    } ${showComments ? 'comment-open' : ''}`}>
      <video
        ref={videoRef}
        key={videoData.videoUrl}
        src={videoData.videoUrl}
        className="vdv-player"
        controls
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        autoPlay
        loop
        onClick={handleVideoClick}
      />

      {showHeart && (
        <div className="vdv-heart-animation">
          <IoHeart size={80} color="#ff4d6d" />
        </div>
      )}

      <div className="vdv-overlay">
        <div className="vdv-info-left">
          <div className="vdv-user-name">
            @{videoData.nguoiDang?.fullName}
          </div>
          <div className="vdv-title">{videoData.tieuDe}</div>

          <div className={`vdv-description ${showMore ? 'vdv-description-expanded' : ''}`} ref={descriptionRef}>
            {videoData.moTa}
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
              {videoData.gia?.toLocaleString()} đ
            </div>
            <div className="vdv-address">
              {videoData.diaChi}, {videoData.quanHuyen},{" "}
              {videoData.tinhThanh}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className={`vdv-side-info ${showComments ? 'comment-open' : ''}`}>
      <img
        src={videoData.nguoiDang?.avatarUrl || defaultAvatar}
        alt="avatar"
        className="vdv-user-avatar"
        onClick={() => navigate(`/nguoi-dung/${videoData.nguoiDang?.id}`)}
        style={{ cursor: 'pointer' }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = defaultAvatar;
        }}
      />

      {/* Like Button */}
    <div
          className={`vdv-icon-button vdv-like-button ${videoData.isLiked ? "liked" : ""}`}
          onClick={handleLike}
          title={!token ? "Bạn cần đăng nhập để tym" : videoData.isLiked ? "Đã tym" : "Nhấn để tym"}
          ref={iconCircleRef}
        >
          {videoData.isLiked ? (
            <IoHeart size={28} color="#ff4d6d" />
          ) : (
            <IoHeartOutline size={28} color="#ccc" />
          )}
        </div>
        <div className="vdv-icon-label">{formatCount(videoData.soTym || 0)}</div>

    {/* Save Button dưới nút Like */}
<div
  className="vdv-icon-wrapper"
  onClick={handleToggleSave}
  title={!user ? "Bạn cần đăng nhập để lưu video" : isSaved ? "Đã lưu video" : "Lưu video"}
  style={{ marginTop: '8px' }}
>
  <div className="vdv-icon-button vdv-save-button">
    {isSaved ? (
      <IoBookmark size={24} color="gold" />   
    ) : (
      <IoBookmarkOutline size={24} color="gray" />
    )}
  </div>
  <div 
  className="vdv-icon-label" 
  style={{ marginTop: '10px' }}
>
  {formatCount(videoData?.soNguoiLuu || 0)}
</div>
</div>

      {/* Comments Button */}
      <div
        className="vdv-icon-button"
        onClick={handleToggleComments}
      >
        <FaRegCommentDots size={24} color="#ccc" />
      </div>
      <div className="vdv-icon-label">{videoData.soBinhLuan || 0}</div>

      {/* Chat Button (ẩn nếu là người đăng) */}
      {user?.id !== videoData.nguoiDang?.id && (
        <div
          className="vdv-icon-button vdv-chat-button"
          onClick={handleChatWithSeller}
          title={!user ? "Bạn cần đăng nhập để chat" : "Chat với người bán"}
          data-tooltip={!user ? "Bạn cần đăng nhập để chat" : "Chat với người bán"}
        >
          <SiMinutemailer size={24} color="#ccc" />
        </div>
      )}
    </div>

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
