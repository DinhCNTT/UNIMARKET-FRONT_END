import React, { useState } from "react";
import styles from "./PostDetailsInfo.module.css"; // Tạo file CSS riêng
import { MdOutlineSell, MdOutlineLocationOn, MdOutlineCalendarToday, MdOutlineChat } from "react-icons/md";
import { formatDate } from "../utils/formatters";

const PostDetailsInfo = ({ post, formattedPrice, onChat, currentUserId }) => {
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const handleShowPhoneNumber = () => setShowPhoneNumber(!showPhoneNumber);

  const isOwner = currentUserId === post.maNguoiBan;

  return (
    <div className={styles.chiTietTinDangInfo}>
      <h1>{post.tieuDe}</h1>
      <p className={styles.infoLine}>
        <MdOutlineSell className={styles.icon} />
        <strong>Giá:</strong> <span className={styles.price}>{formattedPrice}</span>
      </p>
      <p className={styles.infoLine}>
        <MdOutlineLocationOn className={styles.icon} />
        <strong>Địa chỉ:</strong> {post.diaChi}
      </p>
      <p className={styles.infoLine}>
        <MdOutlineCalendarToday className={styles.icon} />
        <strong>Ngày đăng:</strong> {formatDate(post.ngayDang)}
      </p>
      <div className={styles.sdtChat}>
        <button className={styles.sdt} onClick={handleShowPhoneNumber}>
          {showPhoneNumber ? post.phoneNumber : `Hiện số ${post.phoneNumber?.substring(0, 6)}****`}
        </button>
        {!isOwner && (
          <button className={`${styles.sdt} ${styles.sdtChatBtn}`} onClick={onChat}>
            <MdOutlineChat /> Chat với người bán
          </button>
        )}
      </div>
      <div className={styles.sellerInfo}>
        <div className={styles.sellerName}>Người bán: {post.nguoiBan}</div>
      </div>
    </div>
  );
};

export default PostDetailsInfo;