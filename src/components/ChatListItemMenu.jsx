import React, { useState, useRef, useEffect } from "react";
import "./ChatListItemMenu.css";
import { MoreHorizontal } from "react-feather";

// ✨ Import API từ service
import {
  blockConversation,
  unblockConversation,
} from "../services/chatSocialService";

const ChatListItemMenu = ({ chat, currentUserId, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef(null);

  // ===================================================
  // Đóng menu khi click ra ngoài
  // ===================================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===================================================
  // Xử lý XÓA đoạn chat
  // ===================================================
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setIsOpen(false);

    if (
      window.confirm(
        "Bạn có chắc muốn xóa cuộc trò chuyện này? Thao tác này sẽ ẩn nó khỏi danh sách của bạn."
      )
    ) {
      onDelete && onDelete();
    }
  };

  // ===================================================
  // Xử lý CHẶN người dùng
  // ===================================================
  const handleBlockClick = async (e) => {
    e.stopPropagation();
    if (isLoading) return;

    if (
      window.confirm(
        "Bạn có chắc muốn chặn người dùng này? Hai bạn sẽ không thể nhắn tin cho nhau."
      )
    ) {
      setIsLoading(true);
      try {
        await blockConversation(chat.maCuocTroChuyen);
        // realtime "BlockStatusChanged" sẽ tự cập nhật UI
      } catch (error) {
        alert(error.message || "Lỗi khi chặn người dùng.");
      } finally {
        setIsLoading(false);
        setIsOpen(false);
      }
    }
  };

  // ===================================================
  // Xử lý GỠ CHẶN người dùng
  // ===================================================
  const handleUnblockClick = async (e) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await unblockConversation(chat.maCuocTroChuyen);
      // realtime "BlockStatusChanged" sẽ tự cập nhật UI
    } catch (error) {
      alert(error.message || "Lỗi khi gỡ chặn người dùng.");
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  // ===================================================
  // Toggle mở / đóng menu
  // ===================================================
  const handleToggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  // ===================================================
  // Logic xác định menu CHẶN / GỠ CHẶN
  // ===================================================
  let blockOption = null;
  if (chat && currentUserId) {
    if (chat.isBlocked) {
      if (chat.maNguoiChan === currentUserId) {
        // 🟢 Chính mình là người chặn
        blockOption = (
          <button
            onClick={handleUnblockClick}
            className="menu-item"
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Gỡ chặn người dùng"}
          </button>
        );
      } else {
        // 🔴 Mình bị chặn → không hiển thị gì
        blockOption = null;
      }
    } else {
      // 🟢 Chưa bị chặn
      blockOption = (
        <button
          onClick={handleBlockClick}
          className="menu-item delete"
          disabled={isLoading}
        >
          {isLoading ? "Đang xử lý..." : "Chặn người dùng"}
        </button>
      );
    }
  }

  // ===================================================
  // Render giao diện
  // ===================================================
  return (
    <div className="chatlist-item-menu" ref={menuRef}>
      <button onClick={handleToggleMenu} className="menu-toggle-btn">
        <MoreHorizontal size={20} />
      </button>

      {isOpen && (
        <div className="menu-dropdown">
          <button onClick={handleDeleteClick} className="menu-item delete">
            Xóa đoạn chat
          </button>

          {/* ✨ Tùy chọn chặn/gỡ chặn */}
          {blockOption}
        </div>
      )}
    </div>
  );
};

export default ChatListItemMenu;
