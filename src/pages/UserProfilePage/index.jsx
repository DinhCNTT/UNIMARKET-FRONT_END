import React, { useEffect, useState, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import styles from "./UserProfilePage.module.css";

// Import các Component con
import UserProfileCard from "./UserProfileCard";
import UserProfileTabs from "./UserProfileTabs";
import PostGrid from "./PostGrid";
import VideoGrid from "./VideoGrid";
import UserVideoList from "./UserVideoList";
import EditProfileModal from "./EditProfileModal"; // ✅ Import Modal

// Import Common Components
import LoadingSpinner from "../../components/Common/LoadingSpinner/LoadingSpinner";
import EmptyState from "../../components/Common/EmptyState/EmptyState";
import TopNavbarUniMarket from "../../components/TopNavbarUniMarket";

// Import Context
import { VideoContext } from "../../context/VideoContext";
import { useTheme } from "../../context/ThemeContext";

// Icons
import { IoGridOutline, IoListOutline } from "react-icons/io5";

const UserProfilePage = () => {
  const { userId } = useParams();

  const [userInfo, setUserInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [profileTab, setProfileTab] = useState("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // ✅ State quản lý bật/tắt Modal sửa hồ sơ
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ===== Filter & View =====
  const [videoFilter, setVideoFilter] = useState("latest");
  const [viewMode, setViewMode] = useState("grid"); // grid | list

  const [followStats, setFollowStats] = useState({
    followers: 0,
    following: 0,
  });

  const { activeTab, setActiveTab } = useContext(VideoContext);
  const { effectiveTheme } = useTheme();

  // ===== Check owner & tab sync =====
  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));

    if (loggedInUser && String(loggedInUser.id) === String(userId)) {
      setIsOwner(true);
    } else {
      setIsOwner(false);
    }

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
      if (activeTab === "profile") setActiveTab("");
    }
  }, [userId, activeTab, setActiveTab]);

  // ===== Reset when change user =====
  useEffect(() => {
    setProfileTab("posts");
    setVideoFilter("latest");
    setViewMode("grid");
  }, [userId]);

  // ===== Fetch data =====
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [userRes, postsRes, videosRes] = await Promise.all([
          axios.get(`http://localhost:5133/api/userprofile/user-info/${userId}`),
          axios.get(`http://localhost:5133/api/userprofile/user-posts/${userId}`),
          axios.get(`http://localhost:5133/api/userprofile/user-videos/${userId}`),
        ]);

        setUserInfo(userRes.data);
        setPosts(postsRes.data);
        setVideos(videosRes.data);

        setFollowStats({
          followers: userRes.data.followersCount || 0,
          following: userRes.data.followingCount || 0,
        });
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // ===== Computed =====
  const totalVideoLikes = videos.reduce(
    (sum, v) => sum + (v.soLuongTym || 0),
    0
  );

  const sortedVideos = useMemo(() => {
    const list = [...videos];
    switch (videoFilter) {
      case "latest":
        return list.sort(
          (a, b) =>
            new Date(b.createdAt || b.ngayDang) -
            new Date(a.createdAt || a.ngayDang)
        );
      case "popular":
        return list.sort(
          (a, b) =>
            (b.views || b.soLuongTym || 0) -
            (a.views || a.soLuongTym || 0)
        );
      case "oldest":
        return list.sort(
          (a, b) =>
            new Date(a.createdAt || a.ngayDang) -
            new Date(b.createdAt || b.ngayDang)
        );
      default:
        return list;
    }
  }, [videos, videoFilter]);

  // 🔥 HÀM QUAN TRỌNG: Cập nhật State userInfo ngay khi Modal lưu thành công
  const handleUpdateSuccess = (updatedData) => {
    setUserInfo((prev) => ({
      ...prev,                 // Giữ lại các thông tin cũ (như email, id...)
      ...updatedData,          // Ghi đè thông tin mới (avatar, tên, sđt)
      avatarUrl: updatedData.avatarUrl // Đảm bảo avatar mới được cập nhật
    }));
  };

  // ===== Loading / Error =====
  if (isLoading) {
    return <LoadingSpinner message="Đang tải dữ liệu..." />;
  }

  if (!userInfo) {
    return (
      <div className={styles.profileContainer} data-theme={effectiveTheme}>
        <TopNavbarUniMarket />
        <p className={styles.errorText}>Không tìm thấy người dùng.</p>
      </div>
    );
  }

  // ===== Render =====
  return (
    <div className={styles.profileContainer} data-theme={effectiveTheme}>
      <TopNavbarUniMarket />

      <UserProfileCard
        userInfo={userInfo}
        followersCount={followStats.followers}
        followingCount={followStats.following}
        totalLikes={totalVideoLikes}
        isOwner={isOwner}
        onEditProfileClick={() => setIsEditModalOpen(true)}
      />

      <div className={styles.contentArea}>
        <div className={styles.navigationBar}>
          <div className={styles.tabsWrapper}>
            {/* Truyền isOwner vào để xử lý tab Yêu thích */}
            <UserProfileTabs
              activeTab={profileTab}
              onTabClick={setProfileTab}
              isOwner={isOwner} 
            />
          </div>

          <div className={styles.controlsRight}>
            {/* Filter video */}
            {profileTab === "videos" && (
              <div className={styles.filterContainer}>
                <button
                  className={`${styles.filterBtn} ${
                    videoFilter === "latest" ? styles.activeFilter : ""
                  }`}
                  onClick={() => setVideoFilter("latest")}
                >
                  Mới nhất
                </button>
                <button
                  className={`${styles.filterBtn} ${
                    videoFilter === "popular" ? styles.activeFilter : ""
                  }`}
                  onClick={() => setVideoFilter("popular")}
                >
                  Thịnh hành
                </button>
                <button
                  className={`${styles.filterBtn} ${
                    videoFilter === "oldest" ? styles.activeFilter : ""
                  }`}
                  onClick={() => setVideoFilter("oldest")}
                >
                  Cũ nhất
                </button>
              </div>
            )}

            {/* View mode posts */}
            {profileTab === "posts" && (
              <div className={styles.viewModeContainer}>
                <button
                  className={`${styles.viewBtn} ${
                    viewMode === "grid" ? styles.activeView : ""
                  }`}
                  onClick={() => setViewMode("grid")}
                  title="Dạng lưới"
                >
                  <IoGridOutline />
                </button>
                <button
                  className={`${styles.viewBtn} ${
                    viewMode === "list" ? styles.activeView : ""
                  }`}
                  onClick={() => setViewMode("list")}
                  title="Dạng danh sách"
                >
                  <IoListOutline />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        {profileTab === "posts" && (
          <PostGrid
            posts={posts}
            isOwner={isOwner}
            viewMode={viewMode}
            userInfo={userInfo}
          />
        )}

        {profileTab === "videos" && (
          <>
            {sortedVideos.length > 0 ? (
              <VideoGrid videos={sortedVideos} />
            ) : (
              <div style={{ padding: "20px 0" }}>
                <EmptyState
                  icon={<IoGridOutline />}
                  title="Chưa có video nào"
                  subtitle="Người dùng này chưa đăng video nào"
                />
              </div>
            )}
          </>
        )}

        {/* Tab Yêu thích (Saved): Vẫn giữ isOwner (Riêng tư) */}
        {profileTab === "favorites" && isOwner && (
          <UserVideoList type="saved" userId={userId} />
        )}

        {/* Tab Đã thích (Liked): CÔNG KHAI - Đã bỏ isOwner */}
        {profileTab === "liked" && (
          <UserVideoList type="liked" userId={userId} />
        )}
      </div>

      {isEditModalOpen && (
        <EditProfileModal
          userInfo={userInfo}
          onClose={() => setIsEditModalOpen(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default UserProfilePage;