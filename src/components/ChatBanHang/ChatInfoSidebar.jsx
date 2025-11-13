// ChatInfoSidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useChat } from "./context/ChatContext";
import styles from "./ModuleChatCss/ChatInfoSidebar.module.css";
import { FaBan, FaUnlock } from "react-icons/fa";
import { BsExclamationTriangleFill } from "react-icons/bs";

const ChatInfoSidebar = () => {
  const {
    isSidebarOpen,
    displayAvatar,
    displayTen,
    displayIsOnline,
    displayUserId,
    isBlockedByMe,
    isBlockedByOther,
    handleBlockUser,
    handleUnblockUser,
  } = useChat();

  return (
    <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}>
      {/* ❌ Đã bỏ phần Header */}

      {/* Nội dung */}
      <div className={styles.sidebarContent}>
        {/* Thông tin người dùng */}
        <div className={styles.userInfoSection}>
          <div className={styles.avatarWrapper}>
            <img
              src={displayAvatar || "/src/assets/default-avatar.png"}
              alt="avatar"
              className={styles.avatar}
            />
            <span
              className={`${styles.statusDot} ${
                displayIsOnline ? styles.online : styles.offline
              }`}
            ></span>
          </div>

          <h4 className={styles.userName}>{displayTen}</h4>

          {displayUserId && (
            <Link
              to={`/nguoi-dung/${displayUserId}`}
              className={styles.profileButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Xem trang</span>
            </Link>
          )}
        </div>

        <hr className={styles.divider} />

        {/* Hành động */}
        <div className={styles.actionsSection}>
          {!isBlockedByMe && !isBlockedByOther ? (
            <button
              className={`${styles.actionButton} ${styles.blockButton}`}
              onClick={handleBlockUser}
            >
              <FaBan />
              <span>Chặn người dùng</span>
            </button>
          ) : isBlockedByMe ? (
            <button
              className={`${styles.actionButton} ${styles.unblockButton}`}
              onClick={handleUnblockUser}
            >
              <FaUnlock />
              <span>Gỡ chặn</span>
            </button>
          ) : (
            <div className={styles.isBlockedNotice}>
              <FaBan />
              <p>Bạn đã bị người này chặn.</p>
            </div>
          )}

          <button className={`${styles.actionButton} ${styles.reportButton}`}>
            <BsExclamationTriangleFill />
            <span>Báo xấu</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ChatInfoSidebar;
