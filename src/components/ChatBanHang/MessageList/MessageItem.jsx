import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import api from "../../../services/api";
import styles from "../ModuleChatCss/MessageItem.module.css";
import { FaEllipsisV, FaTrash, FaClock } from "react-icons/fa";
import Swal from "sweetalert2";

const MessageItem = ({ message, showSeenStatus }) => {
  const { user, openImageModal, recallMessage, recallMedia, deleteLocalMessage } = useChat();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) {
      closeMenu();
      return;
    }

    try {
      await api.delete(`/chat/delete-for-me/${message.maTinNhan}`, { params: { userId: user.id } });
      // Remove locally
      try { deleteLocalMessage(message.maTinNhan); } catch (e) { /* ignore */ }
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
        icon: "error", title: "Không thể thu hồi",
        text: "Chỉ có thể thu hồi tin nhắn trong vòng 5 phút sau khi gửi.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    const remainingTime = getRecallTimeRemaining(message.thoiGianGui);
    const remainingMinutes = Math.floor(remainingTime);
    const remainingSeconds = Math.floor((remainingTime - remainingMinutes) * 60);
    const isMedia = message.loaiTinNhan === "image" || message.loaiTinNhan === "video";
    const mediaType = message.loaiTinNhan === "image" ? "ảnh" : "video";

    const result = await Swal.fire({
      title: `Thu hồi ${isMedia ? mediaType : "tin nhắn"}?`,
      html: `
        <p>Bạn có chắc chắn muốn thu hồi?</p>
        <p style="color: #ff6b6b; font-size: 14px;">
          <i class="fa fa-clock"></i> 
          Thời gian còn lại: ${remainingMinutes}:${remainingSeconds.toString().padStart(2, "0")}
        </p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
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
          icon: "success", title: "Đã thu hồi",
          timer: 1500, showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error", title: "Lỗi thu hồi",
          text: error.message || "Không thể thu hồi. Vui lòng thử lại.",
          confirmButtonColor: "#d33",
        });
      }
    }
    closeMenu();
  };

  // Effect: Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className={styles.messageWrapper}>
      <div
        className={`
          ${styles.message} ${isSentByMe ? styles.sent : styles.received} ${
          message.isRecalled ? styles.recalled : ""
        }`.replace(/\s+/g, " ")}
      >
        <div className={styles.messageContent}>
          {message.isRecalled ? (
            <p className={styles.recalledMessage}>Tin nhắn đã được thu hồi</p>
          ) : message.loaiTinNhan === "image" ? (
            <img
              src={message.noiDung}
              alt="img-chat"
              className={styles.clickableMedia}
              onClick={() => openImageModal(message.noiDung)}
            />
          ) : message.loaiTinNhan === "video" ? (
            <video src={message.noiDung} controls className={styles.clickableMedia} />
          ) : (
            <p>{message.noiDung}</p>
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.time}>{formatTime(message.thoiGian)}</div>
          {isSentByMe && showSeenStatus && !message.isRecalled && (
            <div className={styles.messageStatus}>Đã xem</div>
          )}
        </div>

        {!message.isRecalled && (
          <div className={styles.menuContainer} ref={menuRef}>
            <button className={styles.menuTrigger} onClick={toggleMessageMenu}>
              <FaEllipsisV size={12} />
            </button>

            {isMenuOpen && (
              <div className={styles.messageMenu}>
                {isSentByMe ? (
                  <>
                    {canRecallMessage(message.thoiGianGui) ? (
                      <button
                        className={`${styles.messageMenuItem} ${styles.recallAvailable}`}
                        onClick={handleRecall}
                      >
                        <FaTrash size={12} />
                        <span>Thu hồi</span>
                        <div className={styles.recallTimer}>
                          <FaClock size={10} />
                          {Math.floor(getRecallTimeRemaining(message.thoiGianGui))}:
                          {Math.floor(
                            (getRecallTimeRemaining(message.thoiGianGui) % 1) * 60
                          ).toString().padStart(2, "0")}
                        </div>
                      </button>
                    ) : (
                      <button className={`${styles.messageMenuItem} ${styles.recallDisabled}`} disabled>
                        <FaTrash size={12} />
                        <span>Hết hạn thu hồi</span>
                      </button>
                    )}

                    <button className={styles.messageMenuItem} onClick={handleDelete}>
                      <FaTrash size={12} />
                      <span>Xóa tin nhắn</span>
                    </button>
                  </>
                ) : (
                  <button className={styles.messageMenuItem} onClick={handleDelete}>
                    <FaTrash size={12} />
                    <span>Xóa tin nhắn</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MessageItem); // Bọc trong React.memo