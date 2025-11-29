// src/components/TinDangDanhChoBan.jsx
import React, { useState } from "react";
import styles from "./TinDangDanhChoBan.module.css"; // Import CSS Module
import TrangChuNav from "./TrangChuNav";
import PostItemCard from "./PostItemCard"; 
import { useTinDangData } from "../hooks/useTinDangData"; 

const TinDangDanhChoBan = ({ showNavigation = true }) => {
  const [visiblePostsCount, setVisiblePostsCount] = useState(25);
  const [activeTab, setActiveTab] = useState("danhchoban");

  // Custom hook logic
  const { posts, savedIds, isLoggedIn, handleToggleSave } = useTinDangData(activeTab);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setVisiblePostsCount(25);
  };

  const getSortedPosts = () => {
    if (activeTab === "moinhat") {
      return [...posts].sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang));
    }
    return posts;
  };

  const sortedPosts = getSortedPosts();
  const displayedPosts = sortedPosts.slice(0, visiblePostsCount);

  return (
    // Sử dụng styles.container thay vì chuỗi string
    <div className={styles.container}> 
      
      {/* Navigation */}
      {showNavigation && (
        <div className={styles.navContainer}>
          <TrangChuNav onTabChange={handleTabChange} activeTab={activeTab} />
        </div>
      )}

      {/* Post Grid */}
      <div className={styles.postList}>
        {posts.length === 0 ? (
          <p style={{ textAlign: "center", width: "100%", color: "#666" }}>Không có tin đăng</p>
        ) : (
          displayedPosts.map((post) => (
            <PostItemCard
              key={post.maTinDang}
              post={post}
              isLoggedIn={isLoggedIn}
              isSaved={savedIds.includes(post.maTinDang)}
              onToggleSave={handleToggleSave}
            />
          ))
        )}
      </div>

      {/* Show More Button */}
      {visiblePostsCount < sortedPosts.length && (
        <button 
          className={styles.viewMoreBtn} 
          onClick={() => setVisiblePostsCount((prev) => prev + 25)}
        >
          Xem thêm
        </button>
      )}
    </div>
  );
};

export default TinDangDanhChoBan;