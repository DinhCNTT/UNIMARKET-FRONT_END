import React, { useState } from "react";
import styles from "./PostDetailsInfo.module.css";
// ✅ IMPORT TỪ CODE 2
import ReportButton from "./ReportModals/ReportButton";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5"; 
import { MdOutlineLocationOn, MdOutlineCalendarToday } from "react-icons/md"; 
import { IoHeartOutline, IoHeart } from "react-icons/io5"; 
import { formatDate } from "../utils/formatters";

const PostDetailsInfo = ({ 
  post, 
  formattedPrice, 
  onChat, 
  currentUserId, 
  isSaved, 
  onToggleSave,
  // ✅ Props từ Code 2 để đồng bộ SĐT với cha
  showPhoneNumber: showPhoneNumberProp, 
  onTogglePhone 
}) => {
  // --- LOGIC XỬ LÝ SĐT (Lấy từ Code 2 - Ưu việt hơn) ---
  // Cho phép component này hoạt động độc lập (local state) HOẶC bị điều khiển bởi cha (props)
  const [localShowPhoneNumber, setLocalShowPhoneNumber] = useState(false);

  const handleShowPhoneNumber = () => {
    // Nếu cha có truyền hàm xử lý, gọi hàm cha (để sync với FloatingBox)
    if (typeof onTogglePhone === 'function') return onTogglePhone();
    // Nếu không, tự xử lý local
    setLocalShowPhoneNumber((s) => !s);
  };

  // Ưu tiên lấy state từ props, nếu không có thì lấy local
  const showPhoneNumber = typeof showPhoneNumberProp === 'boolean' ? showPhoneNumberProp : localShowPhoneNumber;

  const isOwner = currentUserId === post.maNguoiBan;

  return (
    <div className={styles.chiTietTinDangInfo}>
      
      {/* --- KHU VỰC HEADER: TIÊU ĐỀ + ACTIONS (Gộp Code 1 & 2) --- */}
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{post.tieuDe}</h1>

        {/* Group các nút chức năng góc phải */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* ✅ NÚT REPORT (Từ Code 2) - Chỉ hiện nếu không phải chủ bài */}
          {!isOwner && (
            <ReportButton 
                targetType="Post" 
                targetId={post.maTinDang} 
                // Có thể thêm style custom nếu cần
            />
          )}

          {/* NÚT LƯU TIN (Từ Code 1) */}
          <button 
            className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`} 
            onClick={onToggleSave}
            title={isSaved ? "Bỏ lưu tin này" : "Lưu tin này"}
          >
            {isSaved ? <IoHeart size={20} color="#e5193b" /> : <IoHeartOutline size={20} />}
            <span>{isSaved ? "Đã lưu" : "Lưu"}</span>
          </button>
        </div>
      </div>
      {/* ----------------------------------------------------------- */}

      {/* Giá */}
      <p className={styles.infoLine}>
        <span className={styles.price}>{formattedPrice}</span>
      </p>
      
      {/* Địa chỉ */}
      <p className={styles.infoLine}>
        <MdOutlineLocationOn className={styles.icon} />
        {post.diaChi}
      </p>
      
      {/* Ngày đăng */}
      <p className={styles.infoLine}>
        <MdOutlineCalendarToday className={styles.icon} />
        Đăng ngày {formatDate(post.ngayDang)}
      </p>

      {/* Khu vực nút bấm Hành động (Phone & Chat) */}
      <div className={styles.actionButtons}>
        {/* Nút Phone: Dùng biến showPhoneNumber đã xử lý logic ở trên */}
        <button className={styles.btnPhone} onClick={handleShowPhoneNumber}>
          {showPhoneNumber ? post.phoneNumber : `Hiện số ${post.phoneNumber?.substring(0, 6)}****`}
        </button>

        {!isOwner && (
          <button className={styles.btnChat} onClick={onChat}>
            <IoChatbubbleEllipsesOutline size={20} /> 
            <span>Chat</span>
          </button>
        )}
      </div>

      {/* Thông tin người bán */}
      <div className={styles.sellerInfo}>
        <div className={styles.sellerName}>Người bán: {post.nguoiBan}</div>
      </div>
    </div>
  );
};

export default PostDetailsInfo;