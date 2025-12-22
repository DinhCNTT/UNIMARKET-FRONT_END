import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback
} from 'react';

import {
  useParams,
  useNavigate,
  useSearchParams
} from 'react-router-dom';

import axios from 'axios';
// 🔥 Import icon mũi tên và nút Back
import { IoArrowBack, IoChevronUp, IoChevronDown } from 'react-icons/io5';

// --- CONTEXT & CSS ---
import { AuthContext } from '../../context/AuthContext';
import styles from './VideoStandalonePage.module.css';

// --- COMPONENTS ---
import SidebarInfo from './components/SidebarInfo';
import VideoPlayerSection from './components/VideoPlayerSection';
import TopNavbarUniMarket from '../../components/TopNavbarUniMarket';

const API_BASE = 'http://localhost:5133';

const VideoStandalonePage = () => {
  // --- ROUTER ---
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 🔥 Lấy commentId từ URL (?commentId=10)
  const highlightCommentId = searchParams.get('commentId');

  // --- CONTEXT ---
  const { token, user } = useContext(AuthContext);

  // --- STATE ---
  const [videosList, setVideosList] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Sidebar Tab
  const [activeTab, setActiveTab] = useState('comments');

  // Scroll container
  const containerRef = useRef(null);

  // ======================================================
  // 1. LOAD MORE VIDEOS (Infinite Scroll)
  // ======================================================
  const loadMoreVideos = useCallback(
    async (currentList) => {
      if (isLoadingMore || !currentList || !hasMore) return;

      try {
        setIsLoadingMore(true);
        console.log('Đang tải thêm video đề xuất...');

        const excludedIds = currentList.map(v => v.maTinDang);

        // --- SỬA TẠI ĐÂY: Thêm config headers chứa Token ---
        const res = await axios.post(
          `${API_BASE}/api/Recommendation/foryou`,
          {
            PageSize: 5,
            ExcludedIds: excludedIds
          },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {} 
          }
        );
        // ---------------------------------------------------

        if (res.data && res.data.length > 0) {
          setVideosList(prev => {
            const existingIds = new Set(prev.map(v => v.maTinDang));
            const uniqueNewVideos = res.data.filter(
              v => !existingIds.has(v.maTinDang)
            );

            if (uniqueNewVideos.length === 0) {
              setHasMore(false);
              return prev;
            }

            return [...prev, ...uniqueNewVideos];
          });
        } else {
          setHasMore(false);
        }
      } catch (err) {
        console.error('Lỗi load more:', err);
      } finally {
        setIsLoadingMore(false);
      }
    },
    [isLoadingMore, hasMore, token] 
  );

  // ======================================================
  // 2. INIT DATA (Load video từ URL)
  // ======================================================
  useEffect(() => {
    const initData = async () => {
      // Tránh fetch lại khi replaceState
      if (
        id &&
        videosList.length > 0 &&
        videosList[activeIndex]?.maTinDang == id
      ) {
        return;
      }

      try {
        setLoading(true);

        const resMain = await axios.get(
          `${API_BASE}/api/Video/${id}`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {}
          }
        );

        const firstVideo = resMain.data;

        setVideosList([firstVideo]);
        setActiveIndex(0);

        // Preload video tiếp theo
        loadMoreVideos([firstVideo]);
      } catch (error) {
        console.error('Lỗi tải video ban đầu:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) initData();

    // Reset tab khi vào trang mới
    setActiveTab('comments');
  }, [id, token]);

  // ======================================================
  // 3. AUTO SWITCH TAB KHI CÓ commentId
  // ======================================================
  useEffect(() => {
    if (highlightCommentId) {
      setActiveTab('comments');
    }
  }, [highlightCommentId]);

  // ======================================================
  // 4. INTERSECTION OBSERVER (Scroll Snap + Infinite)
  // ======================================================
  useEffect(() => {
    const options = {
      root: containerRef.current,
      threshold: 0.6
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const index = parseInt(
          entry.target.getAttribute('data-index')
        );

        if (isNaN(index)) return;

        setActiveIndex(index);
        // Cập nhật URL mà không reload trang
        if (videosList[index]) {
          window.history.replaceState(
            null,
            '',
            `/video-standalone/${videosList[index].maTinDang}`
          );
        }
        // Nếu lướt gần cuối danh sách (còn 2 video) -> Tải thêm
        if (
          index >= videosList.length - 2 &&
          !isLoadingMore
        ) {
          loadMoreVideos(videosList);
        }
      });
    }, options);
  // Gắn observer vào các phần tử video
    const elements = document.querySelectorAll(
      `.${styles.videoSnapItem}`
    );
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [videosList, isLoadingMore, loadMoreVideos]);

  // ======================================================
  // 5. HANDLERS
  // ======================================================
  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate('/market/video');
  };

  const handleUpdateCurrentVideo = (updatedFields) => {
    setVideosList(prev => {
      const list = [...prev];
      if (list[activeIndex]) {
        list[activeIndex] = {
          ...list[activeIndex],
          ...updatedFields
        };
      }
      return list;
    });
  };

  // 🔥 LOGIC ĐIỀU HƯỚNG BẰNG MŨI TÊN (CỐ ĐỊNH)
  // Hàm này sẽ tìm phần tử DOM của video tiếp theo và cuộn tới đó
  const handleScrollNavigation = (direction) => {
    let newIndex = activeIndex;

    if (direction === 'up') {
      // Lên: Giảm index, không nhỏ hơn 0
      newIndex = Math.max(0, activeIndex - 1);
    } else if (direction === 'down') {
      // Xuống: Tăng index, không lớn hơn độ dài list
      newIndex = Math.min(videosList.length - 1, activeIndex + 1);
    }

    // Nếu index thay đổi, tìm element và cuộn tới đó
    if (newIndex !== activeIndex) {
      const targetEl = containerRef.current.querySelector(
        `[data-index="${newIndex}"]`
      );
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // ======================================================
  // 6. RENDER
  // ======================================================
  if (loading && videosList.length === 0) {
    return <div className={styles.loadingState}></div>;
  }

  if (videosList.length === 0) {
    return (
      <div className={styles.errorState}>
        Video không tồn tại hoặc đã bị xóa.
      </div>
    );
  }

  const currentVideoData = videosList[activeIndex];

  return (
    <div className={styles.fullPageLayout}>
      {/* CỘT 1: NAV */}
      <div className={styles.leftNavColumn}>
        <TopNavbarUniMarket />
      </div>

      {/* CỘT 2: VIDEO PLAYER */}
      <div
        className={styles.videoSection}
        ref={containerRef}
      >
        <button
          className={styles.backButton}
          onClick={handleBack}
          style={{
            position: 'fixed',
            zIndex: 10,
            top: '20px',
            left: '20px'
          }}
        >
          <IoArrowBack size={24} />
        </button>

        {videosList.map((vid, index) => (
          <div
            key={`${vid.maTinDang}-${index}`}
            className={styles.videoSnapItem}
            data-index={index}
          >
            <VideoPlayerSection
              videoData={vid}
              token={token}
              currentUser={user}
              isActive={index === activeIndex}
              onUpdateVideo={handleUpdateCurrentVideo}
              onOpenComments={() => setActiveTab('comments')}
            />
          </div>
        ))}
      </div>

      {/* 🔥 MŨI TÊN ĐIỀU HƯỚNG CỐ ĐỊNH (FIXED NAVIGATION) */}
      {/* Nằm ngoài videoSection nên sẽ đứng yên khi cuộn */}
      <div className={styles.fixedNavigationGroup}>
          <button
            className={`${styles.fixedNavBtn} ${activeIndex === 0 ? styles.disabled : ''}`}
            onClick={() => handleScrollNavigation('up')}
            title="Video trước"
          >
             <IoChevronUp size={24} />
          </button>

          <button
            className={styles.fixedNavBtn}
            onClick={() => handleScrollNavigation('down')}
            title="Video tiếp theo"
          >
             <IoChevronDown size={24} />
          </button>
      </div>

      {/* CỘT 3: SIDEBAR */}
      <div className={styles.sidebarSection}>
        {currentVideoData && (
          <SidebarInfo
            key={currentVideoData.maTinDang}
            videoData={currentVideoData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fullVideoList={videosList}
            currentVideoId={currentVideoData.maTinDang}
            hasMore={hasMore}
            onLoadMore={() =>
              loadMoreVideos(videosList)
            }

            // 🔥 COMMENT ID TỪ URL
            highlightCommentId={highlightCommentId}
          />
        )}
      </div>
    </div>
  );
};

export default VideoStandalonePage;