import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FaHeart, FaRegHeart, FaPhone } from "react-icons/fa";
import { BiMessageSquare } from "react-icons/bi";
import styles from "./ViewHistoryListItem.module.css";
import { AuthContext } from "../../context/AuthContext";
import { formatCurrency, formatRelativeTime } from "../../utils/dateUtils";
import { startChat } from "../../services/postService";

const ViewHistoryListItem = ({ post, isSaved, onToggleSave, isLoggedIn }) => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [isHeartFilled, setIsHeartFilled] = useState(isSaved);

  const BASE_URL = "http://localhost:5133";

  const firstImageUrl =
    post.images && post.images.length > 0
      ? post.images[0].startsWith("http")
        ? post.images[0]
        : `${BASE_URL}${post.images[0]}`
      : null;

  const handleViewPost = () => {
    navigate(`/tin-dang/${post.maTinDang}`);
  };

  const handleChat = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để nhắn tin");
      return;
    }

    try {
      const chatData = {
        MaNguoiDung1: user.id,
        MaNguoiDung2: post.seller?.id,
        MaTinDang: post.maTinDang,
      };
      console.log("📤 Sending chat data:", chatData);
      const data = await startChat(chatData);
      const maCuocTroChuyen = data?.maCuocTroChuyen || data?.MaCuocTroChuyen;

      if (maCuocTroChuyen) {
        navigate(`/chat/${maCuocTroChuyen}`);
      } else {
        toast.error("Không thể tạo cuộc trò chuyện");
      }
    } catch (err) {
      console.error("Lỗi bắt đầu chat:", err);
      toast.error("Không thể bắt đầu cuộc trò chuyện");
    }
  };

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để lưu tin");
      return;
    }

    try {
      if (isHeartFilled) {
        await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${post.maTinDang}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsHeartFilled(false);
        toast.success("Đã gỡ lưu tin");
      } else {
        await axios.post(`http://localhost:5133/api/yeuthich/luu/${post.maTinDang}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsHeartFilled(true);
        toast.success("Đã lưu tin");
      }
      onToggleSave?.(post.maTinDang, isHeartFilled);
    } catch (err) {
      console.error("Lỗi cập nhật lưu tin:", err);
      toast.error("Không thể cập nhật trạng thái lưu tin");
    }
  };

  return (
    <div className={styles.listItem} onClick={handleViewPost}>
      {/* Image */}
      <div className={styles.imageWrapper}>
        {firstImageUrl ? (
          <img src={firstImageUrl} alt={post.tieuDe} className={styles.image} />
        ) : (
          <div className={styles.noImage}>Không có ảnh</div>
        )}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <h3 className={styles.title}>{post.tieuDe}</h3>
        <p className={styles.price}>{formatCurrency(post.gia)}</p>
        <p className={styles.location}>
          {post.quanHuyen}, {post.tinhThanh}
        </p>
        <p className={styles.time}>{formatRelativeTime(post.viewedAt)}</p>

        {/* Seller Info */}
        {post.seller && (
          <div className={styles.sellerInfo}>
            {post.seller.avatarUrl && (
              <img src={post.seller.avatarUrl} alt={post.seller.fullName} className={styles.avatar} />
            )}
            <span className={styles.sellerName}>{post.seller.fullName}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.btnChat}
          onClick={handleChat}
          title="Nhắn tin"
        >
          <BiMessageSquare size={20} />
          <span>Chat</span>
        </button>

        <button
          className={styles.btnHeart}
          onClick={handleToggleSave}
          title={isHeartFilled ? "Gỡ lưu" : "Lưu tin"}
        >
          {isHeartFilled ? (
            <FaHeart size={20} color="#FF4444" />
          ) : (
            <FaRegHeart size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default ViewHistoryListItem;