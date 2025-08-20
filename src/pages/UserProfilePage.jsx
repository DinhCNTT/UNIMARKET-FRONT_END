import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { IoNewspaperOutline } from "react-icons/io5";
import { MdOutlineOndemandVideo } from "react-icons/md";
import { CiFolderOff } from "react-icons/ci";
import { CiVideoOff } from "react-icons/ci";
import './UserProfilePage.css';

import ShareButton from '../components/ShareButton';
import TopNavbarUserProfile from "../components/TopNavbarUserProfile";
import UserAuthButton from '../components/UserAuthButton'; // Import component mới
import defaultAvatar from '../assets/default-avatar.png';

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [showMorePosts, setShowMorePosts] = useState(false);
  const [showMoreVideos, setShowMoreVideos] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // State để theo dõi scroll
  const videoRefs = useRef([]);

  // Lấy dữ liệu người dùng
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

  // Xử lý scroll để thay đổi navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 100); // Thay đổi navbar khi scroll xuống hơn 100px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Xử lý hover video
  const handleVideoHover = (video, shouldPlay) => {
    if (!video) return;
    
    if (shouldPlay) {
      video.currentTime = 0;
      video.play().catch(() => {});
      
      // Dừng video sau 5s
      setTimeout(() => {
        if (video) {
          video.pause();
        }
      }, 5000);
    } else {
      video.pause();
    }
  };

  // Hàm xử lý click vào video để chuyển đến VideoSearchDetailViewer
  const handleVideoClick = (clickedVideo, videoIndex) => {
    navigate(`/video-search-detail/${clickedVideo.maTinDang}`, {
      state: {
        videoList: videos, // Truyền toàn bộ danh sách video của user
        initialIndex: videoIndex, // Chỉ số của video được click
        from: 'userProfile' // Để biết nguồn gốc
      }
    });
  };

  if (!userInfo) {
    return (
      <div className="userprofilepage-modern-loading">
        <div className="userprofilepage-loading-spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  const displayedPosts = showMorePosts ? posts : posts.slice(0, 8);
  // FIX: Thay đổi từ 6 thành 10 video cho 2 hàng (5 video/hàng)
  const displayedVideos = showMoreVideos ? videos : videos.slice(0, 10);

  return (
  <div className="userprofilepage-modern-profile-container">
    {/* User Auth Button - Góc phải bên trên */}
    <UserAuthButton />

    {/* Navbar - Truyền thêm prop isScrolled */}
    <TopNavbarUserProfile profileUser={userInfo} isScrolled={isScrolled} />

    {/* Thông tin người dùng */}
    <div className="userprofilepage-modern-profile-card">
      {/* Avatar + trạng thái xác minh */}
      <div className="userprofilepage-profile-avatar-wrapper">
        <img
          src={userInfo.avatarUrl || defaultAvatar}
          alt="Avatar"
          className="userprofilepage-modern-avatar"
        />
        <div className="userprofilepage-avatar-ring"></div>

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
      </div>

      {/* Thông tin + share + stats */}
      <div className="userprofilepage-modern-info">
        <h2 className="userprofilepage-modern-username">{userInfo.fullName}</h2>
        <ShareButton profileUser={userInfo} />

        <div className="userprofilepage-profile-stats">
          <div className="userprofilepage-stat-item">
            <span className="userprofilepage-stat-number">{posts.length}</span>
            <span className="userprofilepage-stat-label">Tin đăng</span>
          </div>
          <div className="userprofilepage-stat-item">
            <span className="userprofilepage-stat-number">{videos.length}</span>
            <span className="userprofilepage-stat-label">Video</span>
          </div>
        </div>
      </div>
    </div>

    {/* Tabs */}
    <div className="userprofilepage-modern-content-area">
      <div className="userprofilepage-modern-tabs">
        <button
          className={`userprofilepage-modern-tab ${activeTab === 'posts' ? 'userprofilepage-active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <IoNewspaperOutline className="userprofilepage-tab-posts-icon" /> Tin đăng
        </button>
        <button
          className={`userprofilepage-modern-tab ${activeTab === 'videos' ? 'userprofilepage-active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <MdOutlineOndemandVideo className="userprofilepage-tab-videos-icon" /> Video
        </button>
      </div>

      {/* Nội dung tab Tin đăng */}
      {activeTab === 'posts' && (
        <div className="userprofilepage-tab-content">
          {posts.length === 0 ? (
            <div className="userprofilepage-modern-empty-state">
              <CiFolderOff className="userprofilepage-empty-posts-icon" />
              <p className="userprofilepage-empty-title">Chưa có tin đăng</p>
              <p className="userprofilepage-empty-subtitle">Người dùng này chưa đăng tin nào</p>
            </div>
          ) : (
            <div className="userprofilepage-posts-grid-section">
              <div className="userprofilepage-section-header">
                <h3 className="userprofilepage-section-title">Danh sách tin đăng</h3>
                <div className="userprofilepage-section-count">{posts.length} tin</div>
              </div>

              <div className={`userprofilepage-posts-grid-container ${showMorePosts ? 'userprofilepage-show-all' : ''}`}>
                <div className="userprofilepage-posts-grid">
                  {displayedPosts.map((post) => (
                    <div
                      key={post.maTinDang}
                      className="userprofilepage-grid-post-card"
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
                        <div className="userprofilepage-post-price">
                          {post.gia.toLocaleString()}đ
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {posts.length > 8 && (
                <div className="userprofilepage-show-more-container">
                  <button
                    className="userprofilepage-show-more-btn"
                    onClick={() => setShowMorePosts(!showMorePosts)}
                  >
                    {showMorePosts
                      ? <>Thu gọn ↑</>
                      : <>Xem thêm ({posts.length - 8} tin) ↓</>
                    }
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Nội dung tab Video */}
      {activeTab === 'videos' && (
        <div className="userprofilepage-tab-content">
          {videos.length === 0 ? (
            <div className="userprofilepage-modern-empty-state">
              <CiVideoOff className="userprofilepage-empty-videos-icon" />
              <p className="userprofilepage-empty-title">Chưa có video</p>
              <p className="userprofilepage-empty-subtitle">Người dùng này chưa đăng video nào</p>
            </div>
          ) : (
            <div className="userprofilepage-videos-grid-section">
              <div className="userprofilepage-section-header">
                <h3 className="userprofilepage-section-title">Danh sách video</h3>
                <div className="userprofilepage-section-count">{videos.length} video</div>
              </div>

              <div className={`userprofilepage-videos-grid-container ${showMoreVideos ? 'userprofilepage-show-all' : ''}`}>
                <div className="userprofilepage-videos-grid">
                  {displayedVideos.map((video, index) => (
                    <div
                      key={video.maTinDang}
                      className="userprofilepage-grid-video-card"
                      onClick={() => handleVideoClick(video, index)} // Thêm xử lý click
                      style={{ cursor: 'pointer' }} // Thêm cursor pointer
                      onMouseEnter={(e) => {
                        const videoElement = e.currentTarget.querySelector('video');
                        handleVideoHover(videoElement, true);
                      }}
                      onMouseLeave={(e) => {
                        const videoElement = e.currentTarget.querySelector('video');
                        handleVideoHover(videoElement, false);
                      }}
                    >
                      <div className="userprofilepage-video-wrapper">
                        <video
                          ref={el => videoRefs.current[index] = el}
                          src={video.videoUrl}
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          className="userprofilepage-grid-video-player"
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn không cho event bubble up
                            handleVideoClick(video, index);
                          }}
                        />
                        <div className="userprofilepage-video-overlay">
                          <div className="userprofilepage-video-info">
                            <h4 className="userprofilepage-video-title" title={video.tieuDe}>
                              {video.tieuDe}
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FIX: Thay đổi điều kiện từ videos.length > 6 thành videos.length > 10 */}
              {videos.length > 10 && (
                <div className="userprofilepage-show-more-container">
                  <button
                    className="userprofilepage-show-more-btn"
                    onClick={() => setShowMoreVideos(!showMoreVideos)}
                  >
                    {showMoreVideos
                      ? <>Thu gọn ↑</>
                      : <>Xem thêm ({videos.length - 10} video) ↓</>
                    }
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

};

export default UserProfilePage;