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

  // 🔥 Lấy commentId từ URL (?commentId=10) để highlight (nếu có)
  const highlightCommentId = searchParams.get('commentId');

  // --- CONTEXT ---
  const { token, user } = useContext(AuthContext);

  // --- STATE ---
  const [videosList, setVideosList] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0); // Index video đang xem
  const [loading, setLoading] = useState(true);      // Loading ban đầu
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Loading khi cuộn
  const [hasMore, setHasMore] = useState(true);      // Còn video để tải không?

  // Sidebar Tab (Comments / Suggested)
  const [activeTab, setActiveTab] = useState('comments');

  // Scroll container Ref (Để xử lý cuộn)
  const containerRef = useRef(null);

  // ======================================================
  // 1. LOAD MORE VIDEOS (Infinite Scroll Logic)
  // ======================================================
  const loadMoreVideos = useCallback(
    async (currentList) => {
      // Nếu đang tải hoặc danh sách rỗng hoặc hết dữ liệu thì dừng
      if (isLoadingMore || !currentList || !hasMore) return;

      try {
        setIsLoadingMore(true);
        // console.log('Đang tải thêm video đề xuất...');

        // Lấy danh sách ID đã có để loại trừ
        const excludedIds = currentList.map(v => v.maTinDang);

        const res = await axios.post(
          `${API_BASE}/api/Recommendation/foryou`,
          {
            PageSize: 5,
            ExcludedIds: excludedIds
          }
        );

        if (res.data && res.data.length > 0) {
          setVideosList(prev => {
            const existingIds = new Set(prev.map(v => v.maTinDang));
            // Chỉ thêm video chưa tồn tại
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
          setHasMore(false); // API trả về rỗng -> Hết video
        }
      } catch (err) {
        console.error('Lỗi load more:', err);
      } finally {
        setIsLoadingMore(false);
      }
    },
    [isLoadingMore, hasMore]
  );

  // ======================================================
  // 2. INIT DATA (Load video đầu tiên từ URL)
  // ======================================================
  useEffect(() => {
    const initData = async () => {
      // Tránh fetch lại nếu video hiện tại đã đúng là video trong URL
      if (
        id &&
        videosList.length > 0 &&
        videosList[activeIndex]?.maTinDang == id
      ) {
        return;
      }

      try {
        setLoading(true);

        // 1. Gọi API lấy thông tin video chi tiết
        const resMain = await axios.get(
          `${API_BASE}/api/Video/${id}`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {}
          }
        );

        const firstVideo = resMain.data;

        // 2. Set vào list
        setVideosList([firstVideo]);
        setActiveIndex(0);

        // 3. Preload luôn các video tiếp theo để người dùng lướt
        loadMoreVideos([firstVideo]);
      } catch (error) {
        console.error('Lỗi tải video ban đầu:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) initData();

    // Reset tab về comments khi vào trang mới
    setActiveTab('comments');
  }, [id, token]);

  // ======================================================
  // 3. AUTO SWITCH TAB (Khi có commentId)
  // ======================================================
  useEffect(() => {
    if (highlightCommentId) {
      setActiveTab('comments');
    }
  }, [highlightCommentId]);

  // ======================================================
  // 4. INTERSECTION OBSERVER (Scroll Snap + Update URL)
  // ======================================================
  useEffect(() => {
    const options = {
      root: containerRef.current,
      threshold: 0.6 // Video chiếm 60% màn hình thì tính là active
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        // Lấy index từ data-attribute
        const index = parseInt(entry.target.getAttribute('data-index'));

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
        if (index >= videosList.length - 2 && !isLoadingMore) {
          loadMoreVideos(videosList);
        }
      });
    }, options);

    // Gắn observer vào các phần tử video
    const elements = document.querySelectorAll(`.${styles.videoSnapItem}`);
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [videosList, isLoadingMore, loadMoreVideos]);

  // ======================================================
  // 5. HANDLERS (Sự kiện)
  // ======================================================
  
  // Quay lại trang trước
  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate('/market/video');
  };

  // Cập nhật state video cục bộ (VD: Like, Follow) mà không cần fetch lại
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
    return <div className={styles.loadingState}>Loading...</div>;
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
      {/* CỘT 1: NAV BÊN TRÁI (Ẩn trên mobile nếu cần) */}
      <div className={styles.leftNavColumn}>
        <TopNavbarUniMarket />
      </div>

      {/* CỘT 2: KHUNG VIDEO (Scroll Container) */}
      <div
        className={styles.videoSection}
        ref={containerRef} // Gắn ref để xử lý scroll
      >
        {/* Nút Back cố định */}
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

        {/* Danh sách Video */}
        {videosList.map((vid, index) => (
          <div
            key={`${vid.maTinDang}-${index}`}
            className={styles.videoSnapItem}
            data-index={index} // Data attribute để Observer đọc index
          >
            <VideoPlayerSection
              videoData={vid}
              token={token}
              currentUser={user}
              isActive={index === activeIndex} // Chỉ play video đang active
              onUpdateVideo={handleUpdateCurrentVideo}
              onOpenComments={() => setActiveTab('comments')}
              
              // ❌ KHÔNG CẦN truyền onNavigate nữa vì nút điều hướng đã nằm ở ngoài
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

      {/* CỘT 3: SIDEBAR THÔNG TIN (Bình luận / Đề xuất) */}
      <div className={styles.sidebarSection}>
        {currentVideoData && (
          <SidebarInfo
            key={currentVideoData.maTinDang} // Key để reset state khi đổi video
            videoData={currentVideoData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fullVideoList={videosList}
            currentVideoId={currentVideoData.maTinDang}
            hasMore={hasMore}
            onLoadMore={() => loadMoreVideos(videosList)}
            
            // Highlight comment nếu có từ URL
            highlightCommentId={highlightCommentId}
          />
        )}
      </div>
    </div>
  );
};

export default VideoStandalonePage;