import React, { useState, useEffect } from "react";
import styles from "./PostDetailsInfo.module.css";
import ReportButton from "./ReportModals/ReportButton";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { MdOutlineLocationOn, MdOutlineCalendarToday } from "react-icons/md";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import { formatDate } from "../utils/formatters"; 
import axios from "axios"; 
import defaultAvatar from "../assets/default-avatar.png";
import MarketPriceChart from "./MarketPriceChart"; 

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
  const [marketData, setMarketData] = useState(null);

  const handleShowPhoneNumber = () => {
    if (typeof onTogglePhone === 'function') return onTogglePhone();
    setLocalShowPhoneNumber((s) => !s);
  };

  const showPhoneNumber = typeof showPhoneNumberProp === 'boolean' ? showPhoneNumberProp : localShowPhoneNumber;
  const isOwner = currentUserId === post.maNguoiBan;
  const sellerAvatarUrl = post.avatar || post.Avatar || defaultAvatar;

  // --- LOGIC LẤY GIÁ THỊ TRƯỜNG ---
  useEffect(() => {
    if (post && post.maTinDang) {
      // Đảm bảo URL đúng với port backend của bạn (5133)
      const apiUrl = `http://localhost:5133/api/tindang/market-price-analysis/${post.maTinDang}`;
      
      axios.get(apiUrl)
        .then(response => {
           if (response.data && response.data.isSuccess) {
               console.log("✅ Đã lấy được giá thị trường:", response.data);
               setMarketData(response.data);
           } else {
               console.warn("⚠️ AI không tìm thấy đủ dữ liệu để so sánh.");
               setMarketData(null);
           }
        })
        .catch(err => {
            console.error("❌ Lỗi API giá:", err);
        });
    }
  }, [post]);

  return (
    <div className={styles.chiTietTinDangInfo}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{post.tieuDe}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isOwner && (
            <ReportButton targetType="Post" targetId={post.maTinDang} />
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

      <p className={styles.infoLine}>
        <span className={styles.price}>{formattedPrice}</span>
      </p>

      {/* --- HIỂN THỊ BIỂU ĐỒ NẾU CÓ DATA --- */}
      {marketData && <MarketPriceChart data={marketData} />}
      
      <p className={styles.infoLine} style={{ marginTop: '15px' }}>
        <MdOutlineLocationOn className={styles.icon} />
        {post.diaChi}
      </p>
      <p className={styles.infoLine}>
        <MdOutlineCalendarToday className={styles.icon} />
        Đăng ngày {formatDate(post.ngayDang)}
      </p>

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

      <div className={styles.sellerInfo}>
        <div className={styles.sellerContainer}>
          <img 
            src={sellerAvatarUrl} 
            alt="Avatar người bán" 
            className={styles.sellerAvatar}
            onError={(e) => { e.target.src = defaultAvatar; }} 
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