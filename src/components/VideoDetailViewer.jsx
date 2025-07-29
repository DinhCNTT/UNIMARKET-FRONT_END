import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './VideoDetailViewer.css';
import TopNavbar from "../components/TopNavbar";
import { FaHeart, FaRegCommentDots } from 'react-icons/fa';
import CommentDrawer from './CommentDrawer';
import { useSearchParams, useNavigate } from 'react-router-dom';
import VideoSearchOverlay from "./VideoSearchOverlay";
import defaultAvatar from '../assets/default-avatar.png';

const VideoDetailViewer = () => {
  const [videoList, setVideoList] = useState([]);
  const [searchParams] = useSearchParams();
  const initialIndexFromUrl = parseInt(searchParams.get('index')) || 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndexFromUrl);
  const [showMore, setShowMore] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const descriptionRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState(null);

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
        
        if (aspectRatio < 1) {
          video.style.width = 'auto';
          video.style.height = '600px';
          video.style.maxWidth = '400px';
        } else if (aspectRatio > 1.5) {
          video.style.width = '700px';
          video.style.height = 'auto';
          video.style.maxHeight = '500px';
        } else {
          video.style.width = '500px';
          video.style.height = '500px';
        }
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
      if (isScrolling) return; // Bỏ qua các sự kiện cuộn khi đang xử lý
      isScrolling = true;

      clearTimeout(scrollTimeout);

      // Tăng thời gian chờ lên 1000ms để tạo hiệu ứng "khựng"
      scrollTimeout = setTimeout(() => {
        if (e.deltaY > 0 && currentIndex < videoList.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setShowMore(false);
        } else if (e.deltaY < 0 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setShowMore(false);
        }
        isScrolling = false;
      }, 1000); // Độ trễ 1000ms (1 giây) để tạo cảm giác khựng
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [currentIndex, videoList.length]);

  useEffect(() => {
    if (descriptionRef.current) {
      const element = descriptionRef.current;
      setIsOverflowing(element.scrollHeight > element.clientHeight);
    }
  }, [videoList, currentIndex]);

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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { isLiked, soTym } = res.data;

      setVideoList((prevList) =>
        prevList.map((v, i) =>
          i === currentIndex ? { ...v, isLiked, soTym } : v
        )
      );
    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu tym:", err);
      if (err.response?.status === 401) {
        alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
      }
    }
  };

  const handleVideoClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    clickCountRef.current += 1;

    if (clickCountRef.current === 1) {
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
      clearTimeout(clickTimeoutRef.current);
      handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
      clickCountRef.current = 0;
    }
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const formatCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (!videoList.length || !videoList[currentIndex]) {
    return <div>Đang tải video...</div>;
  }

  const videoData = videoList[currentIndex];
  const token = localStorage.getItem("token");

  return (
    <div className="vdv-wrapper vdv-full-screen-scroll">
      <TopNavbar />
      <VideoSearchOverlay />
      <div className={`vdv-container ${videoAspectRatio < 1 ? 'vdv-portrait' : videoAspectRatio > 1.5 ? 'vdv-landscape' : 'vdv-square'}`}>
        <video
          ref={videoRef}
          key={videoData.videoUrl}
          src={videoData.videoUrl}
          className="vdv-player"
          controls
          controlsList="nodownload"
          onContextMenu="return false;"
          autoPlay
          loop
          onClick={handleVideoClick}
          onDoubleClick={handleDoubleClick}
        />

        {showHeart && (
          <div className="vdv-heart-animation">
            <FaHeart size={80} color="red" />
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

      <div className="vdv-side-info">
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

        <div
          className="vdv-icon-button"
          onClick={handleLike}
          title={
            !token
              ? "Bạn cần đăng nhập để tym"
              : videoData.isLiked
              ? "Đã tym"
              : "Nhấn để tym"
          }
        >
          <FaHeart
            size={26}
            color={token && videoData.isLiked ? "red" : "#ccc"}
          />
        </div>
        <div className="vdv-icon-label">{formatCount(videoData.soTym || 0)}</div>

        <div
          className="vdv-icon-button"
          onClick={() => setShowComments(true)}
        >
          <FaRegCommentDots size={24} color="#ccc" />
        </div>
        <div className="vdv-icon-label">{videoData.soBinhLuan || 0}</div>
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