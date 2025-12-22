// src/components/VideoContextMenu.jsx
import React, { useEffect, useRef } from 'react';
import { 
  IoDownloadOutline, 
  IoPaperPlaneOutline, 
  IoLinkOutline, 
  IoInformationCircleOutline 
} from "react-icons/io5"; 

// 🔥 Import CSS Module
import styles from './VideoContextMenu.module.css';

const VideoContextMenu = ({ 
  position, 
  onClose, 
  onDownload, 
  onShareToFriend, 
  onCopyLink, 
  onViewDetail 
}) => {
  const menuRef = useRef(null);

  // Xử lý click ra ngoài hoặc scroll để đóng menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Thêm { passive: true } cho scroll để tối ưu hiệu năng
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("wheel", onClose, { passive: true });
    document.addEventListener("touchmove", onClose, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("wheel", onClose);
      document.removeEventListener("touchmove", onClose);
    };
  }, [onClose]);

  if (!position) return null;

  return (
    <div 
      ref={menuRef}
      className={styles.menuContainer}
      style={{ top: position.y, left: position.x }}
    >
      <button className={styles.menuItem} onClick={onDownload}>
        <span className={styles.icon}><IoDownloadOutline /></span>
        Tải video về máy
      </button>

      <button className={styles.menuItem} onClick={onShareToFriend}>
        <span className={styles.icon}><IoPaperPlaneOutline /></span>
        Gửi đến bạn bè
      </button>

      <button className={styles.menuItem} onClick={onCopyLink}>
        <span className={styles.icon}><IoLinkOutline /></span>
        Sao chép liên kết
      </button>

      {/* Chỉ hiển thị nếu có props onViewDetail */}
      {onViewDetail && (
        <>
           <div className={styles.divider}></div>
           <button className={styles.menuItem} onClick={onViewDetail}>
             <span className={styles.icon}><IoInformationCircleOutline /></span>
             Xem chi tiết video
           </button>
        </>
      )}
    </div>
  );
};

export default VideoContextMenu;