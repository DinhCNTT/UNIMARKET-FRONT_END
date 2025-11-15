import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PostGrid.module.css";
import EmptyState from "../../components/Common/EmptyState/EmptyState";
import { CiFolderOff } from "react-icons/ci";

const PostGrid = ({ posts }) => {
  const [showMorePosts, setShowMorePosts] = useState(false);
  const navigate = useNavigate();

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<CiFolderOff />}
        title="Chưa có tin đăng"
        subtitle="Người dùng này chưa đăng tin nào"
      />
    );
  }

  const displayedPosts = showMorePosts ? posts : posts.slice(0, 8);

  return (
    <div className={styles.tabContent}>
      <div className={styles.gridSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Danh sách tin đăng</h3>
          <div className={styles.sectionCount}>{posts.length} tin</div>
        </div>

        <div
          className={`${styles.gridContainer} ${
            showMorePosts ? styles.showAll : ""
          }`}
        >
          <div className={styles.postsGrid}>
            {displayedPosts.map((post) => (
              <div
                key={post.maTinDang}
                className={styles.postCard}
                onClick={() => navigate(`/tin-dang/${post.maTinDang}`)}
              >
                <div className={styles.postImageWrapper}>
                  <img
                    src={post.anhDuongDans?.[0] || "/default-image.jpg"}
                    alt="Tin đăng"
                    className={styles.postImage}
                  />
                  <div className={styles.postOverlay}></div>
                </div>
                <div className={styles.postContent}>
                  <h4 className={styles.postTitle} title={post.tieuDe}>
                    {post.tieuDe}
                  </h4>
                  <div className={styles.postPrice}>
                    {post.gia.toLocaleString()}đ
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {posts.length > 8 && (
          <div className={styles.showMoreContainer}>
            <button
              className={styles.showMoreBtn}
              onClick={() => setShowMorePosts(!showMorePosts)}
            >
              {showMorePosts ? (
                <>Thu gọn ↑</>
              ) : (
                <>Xem thêm ({posts.length - 8} tin) ↓</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostGrid;