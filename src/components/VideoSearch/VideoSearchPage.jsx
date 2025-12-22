import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

/* --- COMPONENTS --- */
import TopNavbarUniMarket from "../TopNavbarUniMarket"; 
import SearchTabs from "./SearchTabs";
import VideoCard from "./VideoCard";
import UserRow from "./UserRow";
import RelatedSearchSidebar from "./RelatedKeywords"; 
import SidebarHeader from "../Common/SidebarHeader";
import { viewHistoryService } from "../../services/viewHistoryService"; 

/* --- CSS --- */
import styles from "./VideoSearchPage.module.css";

// ====================================================================
// HÀM TIỆN ÍCH: TẠO HOẶC LẤY SESSION ID (CHO KHÁCH VÃNG LAI)
// ====================================================================
const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem("device_session_id");
  if (!sessionId) {
    // Tạo chuỗi ngẫu nhiên UUID hoặc fallback nếu trình duyệt cũ
    sessionId = crypto.randomUUID 
      ? crypto.randomUUID() 
      : `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("device_session_id", sessionId);
  }
  return sessionId;
};

export default function VideoSearchPage() {
  const { keyword } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialTab = searchParams.get("tab") || "top";
  
  // --- STATE ---
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [relatedKeywords, setRelatedKeywords] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  const userListRef = useRef(null);

  // ====================================================================
  // 1. FETCH VIDEOS (ĐÃ CẬP NHẬT HEADER SESSION ID)
  // ====================================================================
  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token"); 
      
      // 1. LẤY SESSION ID
      const sessionId = getOrCreateSessionId();

      // 2. CHUẨN BỊ HEADER ĐẦY ĐỦ (Gộp Token + SessionId)
      const headers = {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId, // <--- Gửi SessionId lên Backend
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const res = await fetch(
        `http://localhost:5133/api/Video/search?keyword=${encodeURIComponent(keyword)}`,
        { headers }
      );

      if (!res.ok) throw new Error("Lỗi server hoặc không tìm thấy kết quả.");
      
      const data = await res.json();
      
      // Set danh sách video
      setVideos(Array.isArray(data.items) ? data.items : []);

      // Set danh sách từ khóa liên quan (Related Keywords)
      if (data.relatedKeywords && Array.isArray(data.relatedKeywords)) {
        setRelatedKeywords(data.relatedKeywords);
      } else {
        setRelatedKeywords([]);
      }

    } catch (err) {
      console.error(err);
      setError("Không tìm thấy video nào.");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // ====================================================================
  // 2. FETCH USERS (CŨNG CẬP NHẬT HEADER SESSION ID ĐỂ ĐỒNG BỘ)
  // ====================================================================
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token"); 
      const sessionId = getOrCreateSessionId();
      
      // Song song: Nếu chưa có keywords (ví dụ F5 tại trang User), gọi API search để lấy keywords
      if (relatedKeywords.length === 0) {
         // Lưu ý: Call phụ này cũng nên gửi header nếu cần, ở đây ta để đơn giản
         fetch(`http://localhost:5133/api/Video/search?keyword=${encodeURIComponent(keyword)}`, {
            headers: { 'X-Session-ID': sessionId }
         })
         .then(res => res.json())
         .then(data => {
             if (data.relatedKeywords) setRelatedKeywords(data.relatedKeywords);
         })
         .catch(() => {}); 
      }

      const headers = {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const res = await fetch(
        `http://localhost:5133/api/Video/search-users-smart?keyword=${encodeURIComponent(keyword)}`,
        { headers }
      );

      if (!res.ok) throw new Error("Lỗi server hoặc không tìm thấy kết quả.");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Không tìm thấy người dùng nào.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Effect Hooks ---
  useEffect(() => {
    // Reset hoặc logic clean up nếu cần khi keyword đổi
  }, [keyword]);

  useEffect(() => {
    if (activeTab === "top") {
      fetchVideos();
    } else {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-
    // Track search keyword when user lands on search page
    if (keyword) {
      const timer = setTimeout(() => {
        viewHistoryService.trackSearch(keyword)
          .then(() => console.log(`✅ Tracked search: ${keyword}`))
          .catch((err) => console.error("❌ Failed to track search:", err));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [keyword, activeTab]);

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      navigate(`?tab=${tab}`, { replace: true });
    }
  };

  // --- 4. Render Helper ---
  const renderContent = () => {
    if (loading) {
      return <div className={styles.loadingState}>Đang tải kết quả...</div>;
    }

    if (error) {
      return <div className={styles.errorState}>{error}</div>;
    }

    // Tab Video
    if (activeTab === "top") {
      if (videos.length === 0) {
        return <p className={styles.emptyState}>Không tìm thấy video nào phù hợp.</p>;
      }
      return (
        <div className={styles.videoGrid}>
          {videos.map((video) => (
            <VideoCard 
              key={video.maTinDang} 
              video={video} 
              allVideos={videos}
              keyword={keyword}
              activeTab={activeTab}
              data={video}
            />
          ))}
        </div>
      );
    }

    // Tab Users
    else {
      if (users.length === 0) {
        return <p className={styles.emptyState}>Không tìm thấy người dùng phù hợp.</p>;
      }
      return (
        <div className={styles.userListContainer} ref={userListRef}>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      );
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Navbar */}
      <TopNavbarUniMarket />
      
      {/* Tabs Bar & Header Right */}
      <div className={styles.tabsBar}>
        <div className={styles.tabsInner}>
           <SearchTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        <div className={styles.headerRight}>
            <SidebarHeader />
        </div>
      </div>
      
      {/* Main Content Container */}
      <div className={styles.contentContainer}>
        {/* Layout chia cột */}
        <div className={styles.layoutFlex}>
          
          {/* CỘT TRÁI */}
          <div className={styles.leftColumn}>
            {renderContent()}
          </div>

          {/* CỘT PHẢI: HIỆN Ở MỌI TAB NẾU CÓ KEYWORDS */}
          {relatedKeywords.length > 0 && (
            <div className={styles.rightColumn}>
              <div className={styles.stickySidebar}>
                <RelatedSearchSidebar keywords={relatedKeywords} />
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}