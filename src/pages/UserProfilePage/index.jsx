import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import styles from "./UserProfilePage.module.css"; // ✅ Dùng CSS Module

// ✅ Import các components con đã tách
import UserProfileCard from "./UserProfileCard";
import UserProfileTabs from "./UserProfileTabs";
import PostGrid from "./PostGrid";
import VideoGrid from "./VideoGrid";

// ✅ Import components tái sử dụng
import LoadingSpinner from "../../components/Common/LoadingSpinner/LoadingSpinner";
import UserAuthButton from "../../components/UserAuthButton";
import TopNavbarUniMarket from "../../components/TopNavbarUniMarket";

import { VideoContext } from "../../context/VideoContext";
import { useTheme } from "../../context/ThemeContext";

const UserProfilePage = () => {
  const { userId } = useParams();

  const [userInfo, setUserInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [profileTab, setProfileTab] = useState("posts"); // State cho tab
  const [isLoading, setIsLoading] = useState(true); // State loading

  const { activeTab, setActiveTab } = useContext(VideoContext);
  const { effectiveTheme } = useTheme();

  // ✅ Giữ logic context cho Navbar
  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) return;

    const isMyProfile =
      window.location.pathname.includes("/nguoi-dung") &&
      String(loggedInUser.id) === String(userId);

    const PANEL_TABS = new Set(["search", "upload", "activity", "more"]);

    if (isMyProfile) {
      if (!PANEL_TABS.has(activeTab) && activeTab !== "profile") {
        setActiveTab("profile");
      }
    } else {
      if (activeTab === "profile") {
        setActiveTab("");
      }
    }
  }, [userId, activeTab, setActiveTab]);

  // ✅ Reset tab khi đổi user
  useEffect(() => {
    setProfileTab("posts");
  }, [userId]);

  // ✅ Lấy dữ liệu người dùng
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [userRes, postsRes, videosRes] = await Promise.all([
          axios.get(
            `http://localhost:5133/api/userprofile/user-info/${userId}`
          ),
          axios.get(
            `http://localhost:5133/api/userprofile/user-posts/${userId}`
          ),
          axios.get(
            `http://localhost:5133/api/userprofile/user-videos/${userId}`
          ),
        ]);

        setUserInfo(userRes.data);
        setPosts(postsRes.data);
        setVideos(videosRes.data);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Đang tải dữ liệu..." />;
  }

  // User không tồn tại (sau khi đã fetch)
  if (!userInfo) {
    return (
      <div className={styles.profileContainer} data-theme={effectiveTheme}>
        <TopNavbarUniMarket />
        <p className={styles.errorText}>Không tìm thấy người dùng.</p>
      </div>
    );
  }

  // ✅ Render gọn gàng với các component con
  return (
    <div className={styles.profileContainer} data-theme={effectiveTheme}>
      <UserAuthButton />
      <TopNavbarUniMarket />

      <UserProfileCard
        userInfo={userInfo}
        postCount={posts.length}
        videoCount={videos.length}
      />

      <div className={styles.contentArea}>
        <UserProfileTabs
          activeTab={profileTab}
          onTabClick={setProfileTab}
        />

        {profileTab === "posts" && <PostGrid posts={posts} />}
        {profileTab === "videos" && <VideoGrid videos={videos} />}
      </div>
    </div>
  );
};

export default UserProfilePage;