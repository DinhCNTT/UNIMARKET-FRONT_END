import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { IoArrowBack } from 'react-icons/io5';

// --- IMPORT CONTEXT & CSS ---
import { AuthContext } from '../../context/AuthContext';
import styles from './VideoStandalonePage.module.css';

// --- IMPORT COMPONENTS ---
import SidebarInfo from './components/SidebarInfo';
import VideoPlayerSection from './components/VideoPlayerSection';
import TopNavbarUniMarket from '../../components/TopNavbarUniMarket'; 

const API_BASE = "http://localhost:5133";

const VideoStandalonePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  // --- STATE QUẢN LÝ DANH SÁCH VIDEO ---
  // Thay vì chỉ 1 videoData, ta quản lý 1 danh sách để Scroll Snap
  const [videosList, setVideosList] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0); // Index của video đang xem
  const [loading, setLoading] = useState(true);
  
  // Ref để theo dõi container cuộn và observer
  const containerRef = useRef(null);
  
  // State quản lý Tab của Sidebar
  const [activeTab, setActiveTab] = useState('comments'); 

  // 1. Fetch Video Đầu Tiên (Dựa trên URL)
  useEffect(() => {
    const initData = async () => {
      // Nếu ID thay đổi mà activeIndex chưa khớp (trường hợp user paste link mới), reset lại list
      // Tuy nhiên, logic replaceState bên dưới sẽ đổi URL, nên ta chỉ fetch lại nếu videosList đang rỗng
      if (!id) return;

      // Nếu list đã có dữ liệu và video đang xem khớp với ID thì không fetch lại (tránh loop khi replaceState)
      if (videosList.length > 0 && videosList[activeIndex]?.maTinDang == id) {
          return;
      }

      try {
        setLoading(true);
        // Load video chính từ URL
        const resMain = await axios.get(`${API_BASE}/api/Video/${id}`, {
             headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        // Khởi tạo mảng với video đầu tiên
        setVideosList([resMain.data]); 
        setActiveIndex(0);

      } catch (error) {
        console.error("Lỗi tải video:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
    // Reset tab về comment khi vào trang mới
    setActiveTab('comments');
  }, [id, token]); 

  // 2. Xử lý khi Sidebar load được danh sách đề xuất
  // Logic: Nối các video đề xuất vào cuối videosList để người dùng lướt tiếp
  const handleSuggestedLoaded = useCallback((suggestedVideos) => {
      if (suggestedVideos && suggestedVideos.length > 0) {
          setVideosList(prev => {
              // Lọc trùng lặp để tránh thêm video đã có trong list
              const currentIds = new Set(prev.map(v => v.maTinDang));
              const newVideos = suggestedVideos.filter(v => !currentIds.has(v.maTinDang));
              
              if (newVideos.length === 0) return prev;
              return [...prev, ...newVideos];
          });
      }
  }, []);

  // 3. Intersection Observer: Phát hiện video đang xem
  useEffect(() => {
      const options = {
          root: containerRef.current, // Khung scroll (videoSection)
          threshold: 0.6 // Video hiện > 60% thì tính là active
      };

      const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
              if (entry.isIntersecting) {
                  // Lấy index từ attribute data-index
                  const index = parseInt(entry.target.getAttribute('data-index'));
                  
                  if (!isNaN(index)) {
                    setActiveIndex(index);
                    
                    // Cập nhật URL thầm lặng (không reload trang) khớp với video đang xem
                    const currentVideo = videosList[index]; // Lưu ý: videosList trong closure này có thể cũ nếu không để dependency đúng, nhưng ta lấy index là đủ
                    
                    // Để lấy data mới nhất, ta dùng hàm setVideosList callback hoặc truy cập videosList từ scope (nhờ dependency bên dưới)
                    if (videosList[index]) {
                        // Dùng replaceState để đổi URL mà không re-render lại component cha
                        window.history.replaceState(null, "", `/video-standalone/${videosList[index].maTinDang}`);
                    }
                  }
              }
          });
      }, options);

      // Gắn observer vào các phần tử video
      const elements = document.querySelectorAll(`.${styles.videoSnapItem}`);
      elements.forEach(el => observer.observe(el));

      return () => {
          if (observer) observer.disconnect();
      };
  }, [videosList]); // Chạy lại observer khi danh sách video thay đổi (được nối thêm)

  // 4. Các hàm xử lý sự kiện
  const handleBack = () => {
    // Nếu có history thì back, không thì về trang danh sách
    if (window.history.length > 2) navigate(-1);
    else navigate('/market/video'); 
  };

  // Cập nhật state (Like, Save) cho video đang hiển thị mà không fetch lại
  const handleUpdateCurrentVideo = (updatedFields) => {
      setVideosList(prev => {
          const newList = [...prev];
          if (newList[activeIndex]) {
            newList[activeIndex] = { ...newList[activeIndex], ...updatedFields };
          }
          return newList;
      });
  };

  if (loading && videosList.length === 0) return <div className={styles.loadingState}></div>;
  if (videosList.length === 0) return <div className={styles.errorState}>Video không tồn tại.</div>;

  // Lấy data của video hiện tại để truyền xuống Sidebar
  const currentVideoData = videosList[activeIndex];

  return (
    <div className={styles.fullPageLayout}>
      
      {/* CỘT 1: NAV */}
      <div className={styles.leftNavColumn}>
          <TopNavbarUniMarket />
      </div>

      {/* CỘT 2: PLAYER - CONTAINER CUỘN DỌC (Scroll Snap) */}
      <div className={styles.videoSection} ref={containerRef}>
        
        {/* Nút Back (Fixed position) */}
        <button className={styles.backButton} onClick={handleBack} style={{position: 'fixed', zIndex: 10, top: '20px', left: '20px'}}>
           <IoArrowBack size={24} />
        </button>
        
        {/* Render danh sách video */}
        {videosList.map((vid, index) => (
            <div 
                key={`${vid.maTinDang}-${index}`} 
                className={styles.videoSnapItem} // Class này cần có CSS: scroll-snap-align: start; height: 100%;
                data-index={index}
            >
                <VideoPlayerSection 
                    videoData={vid} 
                    token={token}
                    currentUser={user}
                    onUpdateVideo={handleUpdateCurrentVideo}
                    onOpenComments={() => setActiveTab('comments')}
                    isActive={index === activeIndex} // Truyền trạng thái active để video tự play
                />
            </div>
        ))}
      </div>

      {/* CỘT 3: SIDEBAR - Hiển thị thông tin của video đang Active */}
      <div className={styles.sidebarSection}>
         {currentVideoData && (
             <SidebarInfo 
                // Quan trọng: Thêm key để React reset Sidebar khi đổi video
                key={currentVideoData.maTinDang} 
                videoData={currentVideoData} 
                activeTab={activeTab}        
                setActiveTab={setActiveTab}
                onDataLoaded={handleSuggestedLoaded} // Nhận danh sách đề xuất để nối vào list
             />
         )}
      </div>

    </div>
  );
};

export default VideoStandalonePage;