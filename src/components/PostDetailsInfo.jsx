import React, { useState } from "react";
import styles from "./PostDetailsInfo.module.css";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5"; 
import { MdOutlineLocationOn, MdOutlineCalendarToday } from "react-icons/md"; 
import { IoHeartOutline, IoHeart } from "react-icons/io5"; 
import { formatDate } from "../utils/formatters";

const PostDetailsInfo = ({ post, formattedPrice, onChat, currentUserId, isSaved, onToggleSave }) => {
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const handleShowPhoneNumber = () => setShowPhoneNumber(!showPhoneNumber);

  const isOwner = currentUserId === post.maNguoiBan;

  return (
    <div className={styles.chiTietTinDangInfo}>
      
      {/* --- KHU VỰC TIÊU ĐỀ & NÚT LƯU (SỬA ĐỔI) --- */}
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{post.tieuDe}</h1>

        <button 
          className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`} 
          onClick={onToggleSave}
          title={isSaved ? "Bỏ lưu tin này" : "Lưu tin này"}
        >
          {isSaved ? <IoHeart size={20} color="#e5193b" /> : <IoHeartOutline size={20} />}
          <span>{isSaved ? "Đã lưu" : "Lưu"}</span>
        </button>
      </div>
      {/* ------------------------------------------- */}

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