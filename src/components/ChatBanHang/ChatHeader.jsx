import React, { useState, useEffect } from "react";
import { useChat } from "./context/ChatContext";
import { FaBan, FaUnlock, FaTrash } from "react-icons/fa";
import styles from './ModuleChatCss/ChatHeader.module.css';

const ChatHeader = ({ onDelete }) => {
  const {
    displayAvatar,
    displayTen,
    displayIsOnline,
    displayLastOnline,
    displayFormattedLastSeen,
    shouldShowStatus,
    isBlockedByMe,
    isBlockedByOther,
    handleBlockUser,
    handleUnblockUser,
  } = useChat();

  const [, forceUpdate] = useState(0);

  // Helper tính toán text
  const getLastOnlineText = () => {
    if (!shouldShowStatus) return "";
    if (displayIsOnline) return "Đang hoạt động";
    if (!displayLastOnline) return "";

    if (displayFormattedLastSeen) {
      if (displayFormattedLastSeen.toLowerCase().includes("vừa mới")) {
        return "Mới hoạt động gần đây";
      }
      const regex = /^(\d+)\s*(phút|giờ|ngày) trước$/;
      const match = displayFormattedLastSeen.match(regex);
      if (match) {
        return `Hoạt động từ ${match[1]} ${match[2]} trước`;
      }
      return displayFormattedLastSeen;
    }

    let last;
    try {
      if (typeof displayLastOnline === "string") {
        let normalized = displayLastOnline.trim();
        if (!normalized.includes("T")) normalized = normalized.replace(" ", "T");
        if (!normalized.endsWith("Z")) normalized += "Z";
        last = new Date(normalized);
      } else {
        last = new Date(displayLastOnline);
      }
      if (isNaN(last.getTime())) throw new Error();
    } catch {
      return "";
    }

    const now = new Date();
    const diffMs = now - last;
    if (diffMs < 0) return "";
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Mới hoạt động gần đây";
    if (diffMin < 60) return `Hoạt động từ ${diffMin} phút trước`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hoạt động từ ${diffH} giờ trước`;
    const diffD = Math.floor(diffH / 24);
    return `Hoạt động từ ${diffD} ngày trước`;
  };

  // Effect: Cập nhật văn bản trạng thái mỗi giây khi offline
  useEffect(() => {
    if (!shouldShowStatus || displayIsOnline || !displayLastOnline) return;

    forceUpdate((v) => v + 1); // Cập nhật 1 lần khi
    const updateInterval = setInterval(() => {
      forceUpdate((v) => v + 1);
    }, 1000); // Cập nhật mỗi giây

    return () => clearInterval(updateInterval);
  }, [shouldShowStatus, displayIsOnline, displayLastOnline]);

  return (
    <div className={styles.header}>
      <div className={styles.sellerFrame}>
        <div className={styles.avatarStatusGroup}>
          <div className={styles.avatarWrapper}>
            <img
              src={displayAvatar || "/src/assets/default-avatar.png"}
              alt="avatar"
              className={styles.sellerAvatar}
            />
            {shouldShowStatus && (
              <span
                className={`${styles.statusDot} ${
                  displayIsOnline ? styles.online : styles.offline
                }`}
              ></span>
            )}
          </div>
          <div className={styles.sellerMeta}>
            <span className={styles.sellerName}>
              {displayTen || "Chủ sản phẩm"}
            </span>
            {shouldShowStatus && getLastOnlineText() && (
              <span className={styles.lastOnline}>
                {getLastOnlineText()}
              </span>
            )}
          </div>
        </div>
        <div className={styles.headerMenu}>
          {onDelete && (
            <button
              className={`${styles.headerMenuButton} ${styles.deleteButton}`}
              onClick={() => onDelete && onDelete()}
              title="Xóa cuộc trò chuyện"
            >
              <FaTrash size={18} />
              <span>Xóa</span>
            </button>
          )}
          {!isBlockedByMe && !isBlockedByOther ? (
            <button
              className={styles.headerMenuButton}
              onClick={handleBlockUser}
            >
              <FaBan size={20} />
              <span>Chặn</span>
            </button>
          ) : isBlockedByMe ? (
            <button
              className={`${styles.headerMenuButton} ${styles.unblock}`}
              onClick={handleUnblockUser}
            >
              <FaUnlock size={20} />
              <span>Gỡ chặn</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatHeader); // Bọc trong React.memo