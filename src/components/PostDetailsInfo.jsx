import React, { useState } from "react";
import styles from "./PostDetailsInfo.module.css";
import ReportButton from "./ReportModals/ReportButton";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5"; 
import { MdOutlineLocationOn, MdOutlineCalendarToday } from "react-icons/md"; 
// Import icon trái tim (Outline: chưa lưu, Filled: đã lưu)
import { IoHeartOutline, IoHeart } from "react-icons/io5"; 
import { formatDate } from "../utils/formatters";

const PostDetailsInfo = ({ post, formattedPrice, onChat, currentUserId, isSaved, onToggleSave, showPhoneNumber: showPhoneNumberProp, onTogglePhone }) => {
  const [localShowPhoneNumber, setLocalShowPhoneNumber] = useState(false);
  const handleShowPhoneNumber = () => {
    if (typeof onTogglePhone === 'function') return onTogglePhone();
    setLocalShowPhoneNumber((s) => !s);
  };
  const showPhoneNumber = typeof showPhoneNumberProp === 'boolean' ? showPhoneNumberProp : localShowPhoneNumber;

  const isOwner = currentUserId === post.maNguoiBan;

  return (
    <div className={styles.chiTietTinDangInfo}>
      {/* Tiêu đề tin đăng */}
      <h1>{post.tieuDe}</h1>

      {/* Nút Lưu tin - Góc phải trên cùng */}
      {/* Report button (small, circular) positioned left of save - only show to non-owners */}
      {!isOwner && (
        <ReportButton targetType="Post" targetId={post.maTinDang} className={styles.reportBtnAbsolute} />
      )}

      <button 
        className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`} 
        onClick={onToggleSave}
        title={isSaved ? "Bỏ lưu tin này" : "Lưu tin này"}
      >
        {isSaved ? <IoHeart size={20} color="#e5193b" /> : <IoHeartOutline size={20} />}
        <span>{isSaved ? "Đã lưu" : "Lưu"}</span>
      </button>
      
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

      {/* Khu vực nút bấm Hành động */}
      <div className={styles.actionButtons}>
        {/* Nút Số điện thoại */}
        <button className={styles.btnPhone} onClick={handleShowPhoneNumber}>
          {showPhoneNumber ? post.phoneNumber : `Hiện số ${post.phoneNumber?.substring(0, 6)}****`}
        </button>

        {/* Nút Chat */}
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