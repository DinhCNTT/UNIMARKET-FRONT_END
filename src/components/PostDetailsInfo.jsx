import React, { useState } from "react";
import styles from "./PostDetailsInfo.module.css";
import ReportButton from "./ReportModals/ReportButton";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { MdOutlineLocationOn, MdOutlineCalendarToday } from "react-icons/md";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import { formatDate } from "../utils/formatters"; // Giả sử file này vẫn ở đây

// ✅ IMPORT ẢNH MẶC ĐỊNH (Theo cấu trúc thư mục bạn gửi)
import defaultAvatar from "../assets/default-avatar.png";

const PostDetailsInfo = ({
  post,
  formattedPrice,
  onChat,
  currentUserId,
  isSaved,
  onToggleSave,
  showPhoneNumber: showPhoneNumberProp,
  onTogglePhone
}) => {
  const [localShowPhoneNumber, setLocalShowPhoneNumber] = useState(false);

  const handleShowPhoneNumber = () => {
    if (typeof onTogglePhone === 'function') return onTogglePhone();
    setLocalShowPhoneNumber((s) => !s);
  };

  const showPhoneNumber = typeof showPhoneNumberProp === 'boolean' ? showPhoneNumberProp : localShowPhoneNumber;
  const isOwner = currentUserId === post.maNguoiBan;

  // ✅ Logic chọn Avatar: Ưu tiên ảnh từ API (post.avatar), nếu không có dùng default
  // Lưu ý: Backend C# trả về 'Avatar', JSON thường convert thành camelCase 'avatar'
  const sellerAvatarUrl = post.avatar || post.Avatar || defaultAvatar;

  return (
    <div className={styles.chiTietTinDangInfo}>
      {/* --- HEADER: TIÊU ĐỀ + REPORT + LƯU TIN --- */}
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{post.tieuDe}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isOwner && (
            <ReportButton
              targetType="Post"
              targetId={post.maTinDang}
            />
          )}
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

      {/* --- THÔNG TIN GIÁ + ĐỊA CHỈ + NGÀY ĐĂNG --- */}
      <p className={styles.infoLine}>
        <span className={styles.price}>{formattedPrice}</span>
      </p>
      <p className={styles.infoLine}>
        <MdOutlineLocationOn className={styles.icon} />
        {post.diaChi}
      </p>
      <p className={styles.infoLine}>
        <MdOutlineCalendarToday className={styles.icon} />
        Đăng ngày {formatDate(post.ngayDang)}
      </p>

      {/* --- NÚT ACTION (GỌI ĐIỆN / CHAT) --- */}
      <div className={styles.actionButtons}>
        <button className={styles.btnPhone} onClick={handleShowPhoneNumber}>
          {showPhoneNumber ? post.phoneNumber : `Hiện số ${post.phoneNumber?.substring(0, 6)}****`}
        </button>
        {!isOwner && (
          <button className={styles.btnChat} onClick={onChat}>
            <IoChatbubbleEllipsesOutline size={20} />
            <span>Chat ngay</span>
          </button>
        )}
      </div>

      {/* --- ✅ PHẦN NGƯỜI BÁN (ĐÃ SỬA ĐỂ CÓ AVATAR) --- */}
      <div className={styles.sellerInfo}>
        <div className={styles.sellerContainer}>
          <img 
            src={sellerAvatarUrl} 
            alt="Avatar người bán" 
            className={styles.sellerAvatar}
            onError={(e) => { e.target.src = defaultAvatar; }} // Fallback nếu link ảnh lỗi
          />
          <div className={styles.sellerText}>
            <span className={styles.sellerLabel}>Người bán</span>
            <span className={styles.sellerName}>{post.nguoiBan}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PostDetailsInfo;