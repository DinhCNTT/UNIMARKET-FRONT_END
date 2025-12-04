import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PostDetailsInfo.module.css";
import ReportButton from "./ReportModals/ReportButton";
import { IoChatbubbleEllipsesOutline, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { MdOutlineLocationOn, MdOutlineCalendarToday } from "react-icons/md";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import { formatDate } from "../utils/formatters"; 
import axios from "axios"; 
import defaultAvatar from "../assets/default-avatar.png";
import MarketWaveChart from "./MarketWaveChart";
import { AuthContext } from "../context/AuthContext"; 
import { quickMessageService } from "../services/quickMessageService"; 
import Swal from "sweetalert2";
import { startChat } from "../services/postService"; 

// Constants
const SCROLL_PERCENTAGE = 0.7;
const CONTAINER_MAX_WIDTH = 645;
const NAV_BUTTON_OFFSET = 15;

const DEFAULT_QUICK_REPLIES = [
  "Bạn có ship hàng không?",
  "Sản phẩm còn bảo hành không?",
  "Sản phẩm này đã qua sửa chữa chưa?",
  "Có phụ kiện đi kèm theo sản phẩm?",
  "Sản phẩm có lỗi gì không?",
  "Đây là hàng chính hãng hay xách tay?",
  "Sản phẩm này còn không ạ?",
  "Tôi muốn mua sản phẩm này.",
];

const PostDetailsInfo = ({
  post,
  formattedPrice,
  onChat,
  currentUserId,
  isSaved,
  onToggleSave,
  showPhoneNumber = false,
  onTogglePhone
}) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [marketData, setMarketData] = useState(null);
  const [customMessages, setCustomMessages] = useState([]);
  const scrollRef = useRef(null);

  // Derived values
  const isOwner = currentUserId === post.maNguoiBan;
  const sellerAvatarUrl = post.avatar || post.Avatar || defaultAvatar;

  // Memoized combined messages
  const combinedQuickReplies = useMemo(() => {
    const custom = customMessages.map(m => m.content);
    return [...custom, ...DEFAULT_QUICK_REPLIES];
  }, [customMessages]);

  // Fetch quick messages
  useEffect(() => {
    const fetchQuickMessages = async () => {
      if (!user?.id) return;
      
      try {
        const rawMessages = await quickMessageService.getMyQuickMessages();
        const normalizedMessages = (Array.isArray(rawMessages) ? rawMessages : []).map(m => ({
          id: m.id || m.Id,
          content: m.content || m.Content,
          order: m.order || m.Order || 0
        }));
        normalizedMessages.sort((a, b) => a.order - b.order);
        setCustomMessages(normalizedMessages);
      } catch (error) {
        console.error("Lỗi lấy Quick Messages:", error);
      }
    };
    fetchQuickMessages();
  }, [user?.id]);

  // Fetch market data
  useEffect(() => {
    if (!post?.maTinDang) return;

    const apiUrl = `http://localhost:5133/api/tindang/market-price-analysis/${post.maTinDang}`;
    axios.get(apiUrl)
      .then(response => {
        if (response.data?.isSuccess) {
          setMarketData(response.data);
        }
      })
      .catch(err => console.error("❌ Lỗi API giá:", err));
  }, [post?.maTinDang]);

  // Scroll handler
  const scroll = (direction) => {
    if (!scrollRef.current) return;
    
    const { current } = scrollRef;
    const scrollAmount = current.clientWidth * SCROLL_PERCENTAGE;
    const scrollValue = direction === 'left' ? -scrollAmount : scrollAmount;
    
    current.scrollBy({ left: scrollValue, behavior: 'smooth' });
  };

  const handleQuickReplyClick = async (messageContent) => {
    if (!user) {
      Swal.fire("Thông báo", "Vui lòng đăng nhập để gửi tin nhắn!", "warning");
      return;
    }
    if (isOwner) return;

    try {
      const chatData = { 
        MaNguoiDung1: user.id, 
        MaNguoiDung2: post.maNguoiBan, 
        MaTinDang: post.maTinDang 
      };
      const data = await startChat(chatData);
      const maCuocTroChuyen = data?.maCuocTroChuyen || data?.MaCuocTroChuyen;

      if (maCuocTroChuyen) {
        navigate(`/chat/${maCuocTroChuyen}`, { 
          state: { autoSend: messageContent } 
        });
      } else {
        Swal.fire("Lỗi", "Không thể kết nối tới cuộc trò chuyện.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi", "Có lỗi xảy ra khi kết nối.", "error");
    }
  };

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
            aria-label={isSaved ? "Bỏ lưu tin này" : "Lưu tin này"}
          >
            {isSaved ? <IoHeart size={20} color="#e5193b" /> : <IoHeartOutline size={20} />}
            <span>{isSaved ? "Đã lưu" : "Lưu"}</span>
          </button>
        </div>
      </div>

      <p className={styles.infoLine}>
        <span className={styles.price}>{formattedPrice}</span>
      </p>

      {marketData && <MarketWaveChart data={marketData} />}
      
      <p className={styles.infoLine} style={{ marginTop: '15px' }}>
        <MdOutlineLocationOn className={styles.icon} aria-hidden="true" />
        {post.diaChi}
      </p>
      <p className={styles.infoLine}>
        <MdOutlineCalendarToday className={styles.icon} aria-hidden="true" />
        Đăng ngày {formatDate(post.ngayDang)}
      </p>

      <div className={styles.actionButtons}>
        <button 
          className={styles.btnPhone} 
          onClick={onTogglePhone}
          aria-label="Hiện số điện thoại"
        >
          {showPhoneNumber ? post.phoneNumber : `Hiện số ${post.phoneNumber?.substring(0, 6)}****`}
        </button>
        {!isOwner && (
          <button 
            className={styles.btnChat} 
            onClick={onChat}
            aria-label="Mở chat"
          >
            <IoChatbubbleEllipsesOutline size={20} aria-hidden="true" />
            <span>Chat ngay</span>
          </button>
        )}
      </div>

      <div className={styles.sellerInfo}>
        <div className={styles.sellerContainer}>
          <img 
            src={sellerAvatarUrl} 
            alt={`Avatar của ${post.nguoiBan}`}
            className={styles.sellerAvatar}
            onError={(e) => { e.target.src = defaultAvatar; }} 
          />
          <div className={styles.sellerText}>
            <span className={styles.sellerName}>{post.nguoiBan}</span>
          </div>
        </div>

        {!isOwner && (
          <div className={styles.quickReplyWrapper}>
            <button 
              className={`${styles.navBtn} ${styles.navPrev}`} 
              onClick={() => scroll('left')}
              aria-label="Lướt tin nhắn sang trái"
            >
              <IoChevronBack size={18} />
            </button>

            <div 
              className={styles.quickRepliesContainer} 
              ref={scrollRef}
              role="list"
            >
              {combinedQuickReplies.map((text, idx) => (
                <button 
                  key={idx} 
                  className={styles.chip}
                  onClick={() => handleQuickReplyClick(text)}
                  role="listitem"
                  aria-label={`Gửi tin nhắn: ${text}`}
                >
                  {text}
                </button>
              ))}
            </div>

            <button 
              className={`${styles.navBtn} ${styles.navNext}`} 
              onClick={() => scroll('right')}
              aria-label="Lướt tin nhắn sang phải"
            >
              <IoChevronForward size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailsInfo;