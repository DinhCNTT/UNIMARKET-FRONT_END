import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserProfilePage.css';
import TopNavbar from "../components/TopNavbar";
import defaultAvatar from '../assets/default-avatar.png';

const UserProfilePage = () => {
  const { userId } = useParams();
  const [userInfo, setUserInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const navigate = useNavigate();
  const carouselRef = useRef();

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -720, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 720, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const [userRes, postsRes, videosRes] = await Promise.all([
          axios.get(`http://localhost:5133/api/userprofile/user-info/${userId}`),
          axios.get(`http://localhost:5133/api/userprofile/user-posts/${userId}`),
          axios.get(`http://localhost:5133/api/userprofile/user-videos/${userId}`)
        ]);
        setUserInfo(userRes.data);
        setPosts(postsRes.data);
        setVideos(videosRes.data);
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu:', err);
      }
    };

    fetchData();
  }, [userId]);

  if (!userInfo) return <div className="userprofilepage-modern-loading">
    <div className="userprofilepage-loading-spinner"></div>
    <p>Đang tải dữ liệu...</p>
  </div>;

  return (
    <div className="userprofilepage-modern-profile-container">
      <TopNavbar />

      {/* Thông tin người dùng bên trái */}
      <div className="userprofilepage-modern-profile-card">
        <div className="userprofilepage-profile-avatar-wrapper">
          <img
            src={userInfo.avatarUrl || defaultAvatar}
            alt="Avatar"
            className="userprofilepage-modern-avatar"
          />
          <div className="userprofilepage-avatar-ring"></div>
        </div>
        <h2 className="userprofilepage-modern-username">{userInfo.fullName}</h2>
        {userInfo.daXacMinhEmail ? (
          <div className="userprofilepage-modern-verification userprofilepage-verified">
            <span className="userprofilepage-verify-icon">✓</span>
            <span>Đã xác minh</span>
          </div>
        ) : (
          <div className="userprofilepage-modern-verification userprofilepage-not-verified">
            <span className="userprofilepage-verify-icon">!</span>
            <span>Chưa xác minh</span>
          </div>
        )}
        <div className="userprofilepage-profile-stats">
          <div className="userprofilepage-stat-item">
            <span className="userprofilepage-stat-number">{posts.length}</span>
            <span className="userprofilepage-stat-label">Tin đăng</span>
          </div>
          <div className="userprofilepage-stat-divider"></div>
          <div className="userprofilepage-stat-item">
            <span className="userprofilepage-stat-number">{videos.length}</span>
            <span className="userprofilepage-stat-label">Video</span>
          </div>
        </div>
      </div>

      {/* Tabs và nội dung bên phải */}
      <div className="userprofilepage-modern-content-area">
        <div className="userprofilepage-modern-tabs">
          <button
            className={`userprofilepage-modern-tab ${activeTab === 'posts' ? 'userprofilepage-active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <span className="userprofilepage-tab-icon">📋</span>
            Tin đăng
          </button>
          <button
            className={`userprofilepage-modern-tab ${activeTab === 'videos' ? 'userprofilepage-active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <span className="userprofilepage-tab-icon">🎥</span>
            Video
          </button>
        </div>

        {/* Nội dung Tin đăng */}
        {activeTab === 'posts' && (
          <div className="userprofilepage-tab-content">
            {posts.length === 0 ? (
              <div className="userprofilepage-modern-empty-state">
                <div className="userprofilepage-empty-icon">📦</div>
                <p className="userprofilepage-empty-title">Chưa có tin đăng</p>
                <p className="userprofilepage-empty-subtitle">Người dùng này chưa đăng tin nào</p>
              </div>
            ) : (
              <div className="userprofilepage-modern-carousel-section">
                <div className="userprofilepage-section-header">
                  <h3 className="userprofilepage-section-title">Danh sách tin đăng</h3>
                  <div className="userprofilepage-section-count">{posts.length} tin</div>
                </div>
                <div className="userprofilepage-modern-carousel-container">
                  <button className="userprofilepage-modern-carousel-btn userprofilepage-left" onClick={scrollLeft}>
                    <span>‹</span>
                  </button>
                  <div className="userprofilepage-modern-carousel-track" ref={carouselRef}>
                    {posts.map((post) => (
                      <div
                        key={post.maTinDang}
                        className="userprofilepage-modern-post-card"
                        onClick={() => navigate(`/tin-dang/${post.maTinDang}`)}
                      >
                        <div className="userprofilepage-post-image-wrapper">
                          <img
                            src={post.anhDuongDans?.[0] || '/default-image.jpg'}
                            alt="Tin đăng"
                            className="userprofilepage-post-image"
                          />
                          <div className="userprofilepage-post-overlay"></div>
                        </div>
                        <div className="userprofilepage-post-content">
                          <h4 className="userprofilepage-post-title" title={post.tieuDe}>
                            {post.tieuDe}
                          </h4>
                          <div className="userprofilepage-post-price">{post.gia.toLocaleString()}đ</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="userprofilepage-modern-carousel-btn userprofilepage-right" onClick={scrollRight}>
                    <span>›</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nội dung Video */}
        {activeTab === 'videos' && (
          <div className="userprofilepage-tab-content">
            {videos.length === 0 ? (
              <div className="userprofilepage-modern-empty-state">
                <div className="userprofilepage-empty-icon">🎬</div>
                <p className="userprofilepage-empty-title">Chưa có video</p>
                <p className="userprofilepage-empty-subtitle">Người dùng này chưa đăng video nào</p>
              </div>
            ) : (
              <div className="userprofilepage-modern-video-section">
                <div className="userprofilepage-section-header">
                  <h3 className="userprofilepage-section-title">Danh sách video</h3>
                  <div className="userprofilepage-section-count">{videos.length} video</div>
                </div>
                <div className="userprofilepage-modern-video-grid">
                  {videos.map((video) => (
                    <div
                      key={video.maTinDang}
                      className="userprofilepage-modern-video-card"
                      onMouseEnter={(e) => {
                        const vid = e.currentTarget.querySelector('video');
                        vid.currentTime = 0;
                        vid.play();
                        vid.timer = setTimeout(() => {
                          vid.pause();
                        }, 5000);
                      }}
                      onMouseLeave={(e) => {
                        const vid = e.currentTarget.querySelector('video');
                        vid.pause();
                        clearTimeout(vid.timer);
                      }}
                    >
                      <div className="userprofilepage-video-wrapper">
                        <video
                          src={video.videoUrl}
                          muted
                          playsInline
                          preload="metadata"
                          className="userprofilepage-modern-video-player"
                        />
                        <div className="userprofilepage-video-play-overlay">
                          <div className="userprofilepage-play-button">▶</div>
                        </div>
                        <div className="userprofilepage-video-likes-badge">
                          <span className="userprofilepage-heart-icon">♥</span>
                          <span>{video.soLuongTym}</span>
                        </div>
                      </div>
                      <div className="userprofilepage-video-info">
                        <h4 className="userprofilepage-video-title" title={video.tieuDe}>
                          {video.tieuDe}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;