// TẠO FILE MỚI: ChatInfoSidebar.jsx
import React, { useState, useEffect } from "react";
import { useChat } from "./context/ChatContext";
import styles from "./ModuleChatCss/ChatInfoSidebar.module.css";
import { IoClose } from "react-icons/io5";
import { FaBan, FaUnlock } from "react-icons/fa";
import { BsExclamationTriangleFill } from "react-icons/bs";

// SAO CHÉP LOGIC HIỂN THỊ THỜI GIAN TỪ CHATHEADER
const getLastOnlineText = (
  displayIsOnline,
  displayLastOnline,
  displayFormattedLastSeen,
  shouldShowStatus
) => {
  if (!shouldShowStatus) return "";
  if (displayIsOnline) return "Đang hoạt động";
  if (!displayLastOnline) return "Chưa có thông tin";

  if (displayFormattedLastSeen) {
    if (displayFormattedLastSeen.toLowerCase().includes("vừa mới")) {
      return "Mới hoạt động gần đây";
    }
    const regex = /^(\d+)\s*(phút|giờ|ngày) trước$/;
    const match = displayFormattedLastSeen.match(regex);
    if (match) {
      return `Hoạt động ${match[1]} ${match[2]} trước`;
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
    return "Không rõ";
  }

  const now = new Date();
  const diffMs = now - last;
  if (diffMs < 0) return "Không rõ";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Mới hoạt động gần đây";
  if (diffMin < 60) return `Hoạt động ${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hoạt động ${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  return `Hoạt động ${diffD} ngày trước`;
};

const ChatInfoSidebar = () => {
  const {
    // State & Data
    isSidebarOpen,
    displayAvatar,
    displayTen,
    displayIsOnline,
    displayLastOnline,
    displayFormattedLastSeen,
    shouldShowStatus,
    isBlockedByMe,
    isBlockedByOther,
    // Actions
    closeSidebar,
    handleBlockUser,
    handleUnblockUser,
  } = useChat();

  const [statusText, setStatusText] = useState("");

  // Effect: Cập nhật văn bản trạng thái (giống hệt ChatHeader)
  useEffect(() => {
    const updateText = () => {
      setStatusText(
        getLastOnlineText(
          displayIsOnline,
          displayLastOnline,
          displayFormattedLastSeen,
          shouldShowStatus
        )
      );
    };

    updateText(); // Cập nhật lần đầu
    const interval = setInterval(updateText, 5000); // Cập nhật mỗi 5 giây

    return () => clearInterval(interval);
  }, [
    displayIsOnline,
    displayLastOnline,
    displayFormattedLastSeen,
    shouldShowStatus,
  ]);

  return (
    <aside
      className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}
    >
      {/* Header của Sidebar */}
      <div className={styles.sidebarHeader}>
        <h3 className={styles.sidebarTitle}>Thông tin cuộc trò chuyện</h3>
        <button onClick={closeSidebar} className={styles.closeButton}>
          <IoClose size={24} />
        </button>
      </div>

      {/* Nội dung Sidebar */}
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
          <p className={styles.userStatus}>{statusText}</p>
        </div>

        <hr className={styles.divider} />

        {/* Các nút hành động */}
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
            // Hiển thị khi BẠN BỊ CHẶN
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
