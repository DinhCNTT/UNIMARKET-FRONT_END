import React, { useEffect, useState } from 'react';
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
    let isScrolling = false;
    let scrollTimeout = null;

    const handleWheel = (e) => {
      if (isScrolling) return;
      isScrolling = true;
      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        if (e.deltaY > 0 && currentIndex < videoList.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setShowMore(false);
        } else if (e.deltaY < 0 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setShowMore(false);
        }
        isScrolling = false;
      }, 300);
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
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

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 700);
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
    <div className="video-detail-wrapper full-screen-scroll">
      <TopNavbar />
      <VideoSearchOverlay />
      <div className="video-container">
        <video
          key={videoData.videoUrl}
          src={videoData.videoUrl}
          className="video-detail-player"
          controls
          autoPlay
          loop
          onDoubleClick={handleDoubleClick}
        />

        {showHeart && (
          <div className="heart-animation">
            <FaHeart size={80} color="red" />
          </div>
        )}

        <div className="video-detail-overlay">
          <div className="video-info-left">
            <div className="video-user-name">
              @{videoData.nguoiDang?.fullName}
            </div>
            <div className="video-title">{videoData.tieuDe}</div>

            <div className="video-description">
              {showMore
                ? videoData.moTa
                : `${videoData.moTa?.substring(0, 100)}... `}
              {videoData.moTa?.length > 100 && (
                <span
                  className="toggle-description"
                  onClick={() => setShowMore(!showMore)}
                >
                  {showMore ? "Thu gọn" : "Xem thêm"}
                </span>
              )}
            </div>

            <div className="video-price-address">
              <div className="video-price">
                {videoData.gia?.toLocaleString()} đ
              </div>
              <div className="video-address">
                {videoData.diaChi}, {videoData.quanHuyen},{" "}
                {videoData.tinhThanh}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="video-side-info">
        <img
          src={videoData.nguoiDang?.avatarUrl || defaultAvatar}
          alt="avatar"
          className="video-user-avatar"
          onClick={() => navigate(`/nguoi-dung/${videoData.nguoiDang?.id}`)}
          style={{ cursor: 'pointer' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultAvatar;
          }}
        />

        <div
          className="icon-button"
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
        <div className="icon-label">{formatCount(videoData.soTym || 0)}</div>

        <div
          className="icon-button"
          onClick={() => setShowComments(true)}
        >
          <FaRegCommentDots size={24} color="#ccc" />
        </div>
        <div className="icon-label">{videoData.soBinhLuan || 0}</div>
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
