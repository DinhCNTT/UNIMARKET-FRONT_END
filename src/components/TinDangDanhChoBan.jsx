// src/components/TinDangDanhChoBan.jsx
import React, { useState } from "react";
import styles from "./TinDangDanhChoBan.module.css";
import TrangChuNav from "./TrangChuNav";
import PostItemCard from "./PostItemCard";
import { useTinDangData } from "../hooks/useTinDangData";


// ✅ Nhận prop categoryGroup (Mặc định là null để dùng được cho cả Trang Chủ)
const TinDangDanhChoBan = ({ showNavigation = true, categoryGroup = null }) => {
  const [visiblePostsCount, setVisiblePostsCount] = useState(25);
  const [activeTab, setActiveTab] = useState("danhchoban");


  // ✅ Truyền categoryGroup vào custom hook
  const { posts, savedIds, isLoggedIn, handleToggleSave } = useTinDangData(activeTab, categoryGroup);


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
          <p style={{ textAlign: "center", width: "100%", color: "#666" }}>
            Không có tin đăng {categoryGroup ? "trong danh mục này" : ""}
          </p>
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