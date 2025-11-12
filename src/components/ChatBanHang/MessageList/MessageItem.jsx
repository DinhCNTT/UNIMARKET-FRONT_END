import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import api from "../../../services/api";
import styles from "../ModuleChatCss/MessageItem.module.css";
import { FaEllipsisV, FaTrash, FaClock, FaUndo } from "react-icons/fa";
import Swal from "sweetalert2";

const MessageItem = ({ message, showSeenStatus }) => {
  const { user, openImageModal, recallMessage, recallMedia, deleteLocalMessage } = useChat();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const menuRef = useRef(null);

  const isSentByMe = message.maNguoiGui === user?.id;

  // === Helpers ===
  const formatTime = (time) => {
    return (
      time ||
      new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const canRecallMessage = (messageTime) => {
    if (!messageTime) return false;
    const now = new Date();
    const msgTime = new Date(messageTime);
    const diffInMinutes = (now - msgTime) / (1000 * 60);
    return diffInMinutes <= 5;
  };

  const getRecallTimeRemaining = (messageTime) => {
    if (!messageTime) return 0;
    const now = new Date();
    const msgTime = new Date(messageTime);
    const diffInMinutes = (now - msgTime) / (1000 * 60);
    return Math.max(0, 5 - diffInMinutes);
  };

  // Update timer every second
  useEffect(() => {
    if (!isSentByMe || !canRecallMessage(message.thoiGianGui)) return;
    
    const updateTimer = () => {
      setTimeRemaining(getRecallTimeRemaining(message.thoiGianGui));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [message.thoiGianGui, isSentByMe]);

  // === Handlers ===
  const toggleMessageMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => setIsMenuOpen(false);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Xóa tin nhắn?",
      text: "Tin nhắn sẽ bị xóa ở phía bạn.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) {
      closeMenu();
      return;
    }

    try {
      const response = await api.delete(`/chat/delete-for-me/${message.maTinNhan}`, { params: { userId: user.id } });
      try { deleteLocalMessage(message.maTinNhan); } catch (e) { /* ignore */ }
      
      // Emit event để ChatList cập nhật tin nhắn mới nhất
      if (response.data?.lastMessage) {
        window.dispatchEvent(new CustomEvent('messageDeleted', { 
          detail: { 
            lastMessage: response.data.lastMessage,
            maCuocTroChuyen: message.maCuocTroChuyen
          } 
        }));
      }
      
      Swal.fire({ icon: 'success', title: 'Đã xóa', timer: 1200, showConfirmButton: false });
    } catch (err) {
      console.error('Lỗi xóa tin nhắn:', err);
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể xóa tin nhắn. Vui lòng thử lại.' });
    }

    closeMenu();
  };

  const handleRecall = async () => {
    if (!canRecallMessage(message.thoiGianGui)) {
      Swal.fire({
        icon: "error", 
        title: "Không thể thu hồi",
        text: "Chỉ có thể thu hồi tin nhắn trong vòng 5 phút sau khi gửi.",
        confirmButtonColor: "#ef4444",
      });
      closeMenu();
      return;
    }

    const remainingMinutes = Math.floor(timeRemaining);
    const remainingSeconds = Math.floor((timeRemaining - remainingMinutes) * 60);
    const isMedia = message.loaiTinNhan === "image" || message.loaiTinNhan === "video";
    const mediaType = message.loaiTinNhan === "image" ? "ảnh" : "video";

    const result = await Swal.fire({
      title: `Thu hồi ${isMedia ? mediaType : "tin nhắn"}?`,
      html: `
        <p style="margin-bottom: 12px;">Bạn có chắc chắn muốn thu hồi?</p>
        <div style="background: #fef3c7; color: #f59e0b; padding: 8px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;">
          <i class="fa fa-clock"></i> 
          Còn lại: ${remainingMinutes}:${remainingSeconds.toString().padStart(2, "0")}
        </div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Thu hồi",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        if (isMedia) {
          await recallMedia(message.maTinNhan);
        } else {
          await recallMessage(message.maTinNhan);
        }
        Swal.fire({
          icon: "success", 
          title: "Đã thu hồi",
          timer: 1500, 
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error", 
          title: "Lỗi thu hồi",
          text: error.message || "Không thể thu hồi. Vui lòng thử lại.",
          confirmButtonColor: "#ef4444",
        });
      }
    }
    closeMenu();
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen]);

  const canRecall = canRecallMessage(message.thoiGianGui);

  return (
    <div className={`${styles.messageWrapper} ${isSentByMe ? styles.sentWrapper : styles.receivedWrapper}`}>
      <div
        className={`${styles.message} ${isSentByMe ? styles.sent : styles.received} ${
          message.isRecalled ? styles.recalled : ""
        }`}
      >
        {/* Menu Button - Now positioned above message */}
        {!message.isRecalled && (
          <div className={styles.menuContainer} ref={menuRef}>
            <button 
              className={`${styles.menuTrigger} ${isMenuOpen ? styles.menuActive : ''}`} 
              onClick={toggleMessageMenu}
              aria-label="Message options"
            >
              <FaEllipsisV />
            </button>

            {isMenuOpen && (
              <div className={styles.messageMenu}>
                {isSentByMe ? (
                  <>
                    <button
                      className={`${styles.menuItem} ${canRecall ? styles.recallItem : styles.disabledItem}`}
                      onClick={canRecall ? handleRecall : null}
                      disabled={!canRecall}
                    >
                      <FaUndo className={styles.menuIcon} />
                      <span className={styles.menuText}>Thu hồi</span>
                      {canRecall && (
                        <span className={styles.timer}>
                          <FaClock />
                          {Math.floor(timeRemaining)}:{Math.floor((timeRemaining % 1) * 60).toString().padStart(2, "0")}
                        </span>
                      )}
                    </button>
                    
                    <div className={styles.menuDivider} />
                    
                    <button className={`${styles.menuItem} ${styles.deleteItem}`} onClick={handleDelete}>
                      <FaTrash className={styles.menuIcon} />
                      <span className={styles.menuText}>Xóa</span>
                    </button>
                  </>
                ) : (
                  <button className={`${styles.menuItem} ${styles.deleteItem}`} onClick={handleDelete}>
                    <FaTrash className={styles.menuIcon} />
                    <span className={styles.menuText}>Xóa tin nhắn</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className={styles.messageContent}>
          {message.isRecalled ? (
            <p className={styles.recalledText}>
              <FaUndo size={12} />
              Tin nhắn đã được thu hồi
            </p>
          ) : message.loaiTinNhan === "image" ? (
            <div className={styles.mediaWrapper}>
              <img
                src={message.noiDung}
                alt="img-chat"
                className={styles.mediaContent}
                onClick={() => openImageModal(message.noiDung)}
              />
              <div className={styles.mediaOverlay}>
                <span className={styles.zoomIcon}>🔍</span>
              </div>
            </div>
          ) : message.loaiTinNhan === "video" ? (
            <video src={message.noiDung} controls className={styles.mediaContent} />
          ) : (
            <p className={styles.textContent}>{message.noiDung}</p>
          )}
        </div>

        {/* Message Info */}
        <div className={styles.messageInfo}>
          <span className={styles.messageTime}>{formatTime(message.thoiGian)}</span>
          {isSentByMe && showSeenStatus && !message.isRecalled && (
            <span className={styles.seenStatus}>Đã xem</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MessageItem);