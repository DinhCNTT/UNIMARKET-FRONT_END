// File: src/components/ChatListItemMenu.jsx (TẠO MỚI)
import React, { useState, useRef, useEffect } from 'react';
import './ChatListItemMenu.css'; // Sẽ tạo file này ở bước 4
import { MoreHorizontal } from 'react-feather'; // Icon 3 chấm

const ChatListItemMenu = ({ onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Ngăn không cho click vào item chat
    setIsOpen(false);
    
    // Hỏi xác nhận trước khi xóa
    if (window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này? Thao tác này sẽ ẩn nó khỏi danh sách của bạn.')) {
      onDelete();
    }
  };

  const handleToggleMenu = (e) => {
    e.stopPropagation(); // Ngăn không cho click vào item chat
    setIsOpen(prev => !prev);
  };

  return (
    <div className="chatlist-item-menu" ref={menuRef}>
      <button onClick={handleToggleMenu} className="menu-toggle-btn">
        <MoreHorizontal size={20} />
      </button>

      {/* --- Dropdown Menu --- */}
      {isOpen && (
        <div className="menu-dropdown">
          <button onClick={handleDeleteClick} className="menu-item delete">
            Xóa đoạn chat
          </button>
          {/* (Bạn có thể thêm "Chặn", "Báo cáo" ở đây sau) */}
        </div>
      )}
    </div>
  );
};

export default ChatListItemMenu;