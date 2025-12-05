import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import TopNavbarUniMarket from "../TopNavbarUniMarket"; // Đường dẫn import tùy thuộc vị trí thực tế
import SearchTabs from "./SearchTabs";
import VideoCard from "./VideoCard";
import UserRow from "./UserRow";
import styles from "./VideoSearchPage.module.css";

export default function VideoSearchPage() {
  const { keyword } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Lấy tab từ URL hoặc mặc định là 'top'
  const initialTab = searchParams.get("tab") || "top";
  
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Scroll User List
  const userListRef = useRef(null);
  useEffect(() => {
    if (userListRef.current && users.length > 0) {
      // Logic cũ: scroll xuống dưới cùng? 
      // Nếu bạn muốn hiển thị từ đầu thì bỏ dòng này, nếu muốn scroll xuống cuối thì giữ.
      // userListRef.current.scrollTop = userListRef.current.scrollHeight;
    }
  }, [users]);

  // Fetch logic
  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:5133/api/Video/search?keyword=${encodeURIComponent(keyword)}`
      );
      if (!res.ok) throw new Error("Lỗi server hoặc không tìm thấy kết quả.");
      const data = await res.json();
      setVideos(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError("Không tìm thấy video nào.");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:5133/api/Video/search-users-sorted?keyword=${encodeURIComponent(keyword)}`
      );
      if (!res.ok) throw new Error("Lỗi server hoặc không tìm thấy kết quả.");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError("Không tìm thấy người dùng nào.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect handle change tab or keyword
  useEffect(() => {
    if (activeTab === "top") {
      fetchVideos();
    } else {
      fetchUsers();
    }
  }, [keyword, activeTab]);

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      navigate(`?tab=${tab}`, { replace: true });
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <TopNavbarUniMarket />
      
      {/* Component Tabs */}
      <SearchTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Nội dung chính */}
      <div className={styles.contentContainer}>
        {loading ? (
          <div className={styles.loadingState}>Đang tải kết quả...</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : activeTab === "top" ? (
          /* Render Video Grid */
          videos.length === 0 ? (
            <p className={styles.emptyState}>Không tìm thấy video nào phù hợp.</p>
          ) : (
            <div className={styles.videoGrid}>
              {videos.map((video) => (
                <VideoCard 
                  key={video.maTinDang} 
                  video={video} 
                  allVideos={videos}
                  keyword={keyword}
                  activeTab={activeTab}
                />
              ))}
            </div>
          )
        ) : (
          /* Render User List */
          users.length === 0 ? (
            <p className={styles.emptyState}>Không tìm thấy người dùng phù hợp.</p>
          ) : (
            <div className={styles.userListContainer} ref={userListRef}>
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}