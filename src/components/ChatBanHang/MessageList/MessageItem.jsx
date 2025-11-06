import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { FaEllipsisV, FaTrash, FaClock } from "react-icons/fa";
import Swal from "sweetalert2";

const MessageItem = ({ message, showSeenStatus }) => {
  const { user, openImageModal, recallMessage, recallMedia } = useChat();
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
    <div className="message-wrapper">
      <div
        className={`message ${isSentByMe ? "sent" : "received"} ${
          message.isRecalled ? "recalled" : ""
        }`}
      >
        <div className="message-content">
          {message.isRecalled ? (
            <p className="recalled-message">Tin nhắn đã được thu hồi</p>
          ) : message.loaiTinNhan === "image" ? (
            <img
              src={message.noiDung}
              alt="img-chat"
              className="message-image clickable-media"
              onClick={() => openImageModal(message.noiDung)}
            />
          ) : message.loaiTinNhan === "video" ? (
            <video src={message.noiDung} controls className="message-video" />
          ) : (
            <p>{message.noiDung}</p>
          )}
        </div>

        <div className="message-info">
          <div className="message-time">{formatTime(message.thoiGian)}</div>
          {isSentByMe && showSeenStatus && !message.isRecalled && (
            <div className="message-status">Đã xem</div>
          )}
        </div>

        {isSentByMe && !message.isRecalled && (
          <div className="message-menu-container" ref={menuRef}>
            <button className="message-menu-trigger" onClick={toggleMessageMenu}>
              <FaEllipsisV size={12} />
            </button>

            {isMenuOpen && (
              <div className="message-menu">
                {canRecallMessage(message.thoiGianGui) ? (
                  <button
                    className="message-menu-item recall-available"
                    onClick={handleRecall}
                  >
                    <FaTrash size={12} />
                    <span>Thu hồi</span>
                    <div className="recall-timer">
                      <FaClock size={10} />
                      {Math.floor(getRecallTimeRemaining(message.thoiGianGui))}:
                      {Math.floor(
                        (getRecallTimeRemaining(message.thoiGianGui) % 1) * 60
                      ).toString().padStart(2, "0")}
                    </div>
                  </button>
                ) : (
                  <button className="message-menu-item recall-disabled" disabled>
                    <FaTrash size={12} />
                    <span>Hết hạn thu hồi</span>
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