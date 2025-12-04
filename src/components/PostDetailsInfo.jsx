import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react";
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
import * as signalR from "@microsoft/signalr";

// Constants
const SCROLL_PERCENTAGE = 0.7;
const HUB_URL = "http://localhost:5133/hub/chat"; 
const API_BASE_URL = "http://localhost:5133/api"; 

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

  // --- State cho trạng thái Online ---
  const [isSellerOnline, setIsSellerOnline] = useState(false);
  const [sellerLastOnline, setSellerLastOnline] = useState(null);
  const [, forceUpdate] = useState(0); 
  const connectionRef = useRef(null);

  // Derived values
  const isOwner = currentUserId === post.maNguoiBan;
  const sellerAvatarUrl = post.avatar || post.Avatar || defaultAvatar;

  // Memoized combined messages
  const combinedQuickReplies = useMemo(() => {
    const custom = customMessages.map(m => m.content);
    return [...custom, ...DEFAULT_QUICK_REPLIES];
  }, [customMessages]);

  // --- 🛠️ DEBUG: Kiểm tra thông tin đầu vào ---
  useEffect(() => {
    console.log("--------------------------------------------------");
    console.log("🛠️ [DEBUG INFO] Bắt đầu kiểm tra trạng thái User:");
    console.log("👤 User hiện tại (Logged in):", user?.id);
    console.log("🛒 Người bán (Seller ID):", post?.maNguoiBan);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log("🔑 Token:", token ? "✅ Có Token" : "❌ Không thấy Token");
    console.log("--------------------------------------------------");
  }, [user, post]);

  // --- Logic tính toán text trạng thái ---
  const getLastOnlineText = useCallback(() => {
    if (isSellerOnline) return "Đang hoạt động";
    if (!sellerLastOnline) return "Ngoại tuyến"; 

    let last;
    try {
      if (typeof sellerLastOnline === "string") {
        let normalized = sellerLastOnline.trim();
        if (!normalized.includes("T")) normalized = normalized.replace(" ", "T");
        if (!normalized.endsWith("Z")) normalized += "Z";
        last = new Date(normalized);
      } else {
        last = new Date(sellerLastOnline);
      }
      if (isNaN(last.getTime())) throw new Error();
    } catch {
      return "";
    }

    const now = new Date();
    const diffMs = now - last;
    if (diffMs < 0) return "Mới hoạt động gần đây"; 
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return "Mới hoạt động gần đây";
    if (diffMin < 60) return `Hoạt động ${diffMin} phút trước`;
    
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hoạt động ${diffH} giờ trước`;
    
    const diffD = Math.floor(diffH / 24);
    if (diffD <= 7) return `Hoạt động ${diffD} ngày trước`;
    
    return "Ngoại tuyến"; 
  }, [isSellerOnline, sellerLastOnline]);

  useEffect(() => {
    if (isSellerOnline || !sellerLastOnline) return;
    const interval = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(interval);
  }, [isSellerOnline, sellerLastOnline]);

  // --- ✅ Effect Lấy trạng thái ban đầu - SỬ DỤNG PUBLIC ENDPOINT ---
  useEffect(() => {
    if (!post?.maNguoiBan) return;

    const fetchInitialStatus = async () => {
      try {
        // ✅ SỬ DỤNG ENDPOINT PUBLIC - KHÔNG CẦN TOKEN
        const apiUrl = `${API_BASE_URL}/user/public/status/${post.maNguoiBan}`; 
        
        console.log(`🚀 [API START] Gọi API lấy trạng thái (Public): ${apiUrl}`);

        const response = await axios.get(apiUrl);
        
        console.log("✅ [API SUCCESS] Kết quả trả về từ Backend:", response.data);
        console.log("👉 IsOnline:", response.data.isOnline);
        console.log("👉 LastActive:", response.data.lastActive);

        if (response.data) {
          setIsSellerOnline(response.data.isOnline);
          setSellerLastOnline(response.data.lastActive);
        }
      } catch (error) {
        console.error("❌ [API ERROR] Lỗi khi gọi API trạng thái:", error);
        if (error.response) {
            console.error("Status Code:", error.response.status);
            console.error("Data:", error.response.data);
        }
      }
    };

    fetchInitialStatus();
  }, [post?.maNguoiBan]);

  // --- ✅ Effect: Kết nối SignalR CHỈ KHI ĐÃ ĐĂNG NHẬP ---
  useEffect(() => {
    // ✅ CHỈ KẾT NỐI SIGNALR NẾU USER ĐÃ ĐĂNG NHẬP
    if (!user?.id || !post?.maNguoiBan) {
      console.log("⚠️ [SIGNALR] Không kết nối vì user chưa đăng nhập");
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.log("⚠️ [SIGNALR] Không kết nối vì không có token");
      return;
    }

    const connectSignalR = async () => {
      console.log("📡 [SIGNALR] Đang chuẩn bị kết nối...");
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => token,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .build();

      try {
        await connection.start();
        console.log("🟢 [SIGNALR] Kết nối thành công!");
        
        connection.on("UserStatusChanged", (data) => {
          console.log("🔔 [SIGNALR EVENT] Có sự kiện UserStatusChanged:", data);
          
          if (data.userId === post.maNguoiBan) {
            console.log("🎯 [TARGET MATCH] Đúng là người bán này! Cập nhật State.");
            setIsSellerOnline(data.isOnline);
            if (!data.isOnline && data.lastSeen) {
              setSellerLastOnline(data.lastSeen);
            } else if (data.isOnline) {
              setSellerLastOnline(null);
            }
          } else {
             console.log(`⚠️ [IGNORE] Sự kiện của user ${data.userId}, không phải seller ${post.maNguoiBan}`);
          }
        });

        connectionRef.current = connection;
      } catch (err) {
        console.error("🔴 [SIGNALR ERROR] Không thể kết nối:", err);
      }
    };

    connectSignalR();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [user?.id, post?.maNguoiBan]);

  // --- Các effect khác giữ nguyên ---
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
        // console.error("Lỗi lấy Quick Messages:", error);
      }
    };
    fetchQuickMessages();
  }, [user?.id]);

  useEffect(() => {
    if (!post?.maTinDang) return;
    const apiUrl = `http://localhost:5133/api/tindang/market-price-analysis/${post.maTinDang}`;
    axios.get(apiUrl)
      .then(response => {
        if (response.data?.isSuccess) {
          setMarketData(response.data);
        }
      })
      .catch(err => {});
  }, [post?.maTinDang]);

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
          <div className={styles.avatarWrapper}>
            <img 
              src={sellerAvatarUrl} 
              alt={`Avatar của ${post.nguoiBan}`}
              className={styles.sellerAvatar}
              onError={(e) => { e.target.src = defaultAvatar; }} 
            />
            {isSellerOnline && <span className={styles.avatarStatusDot}></span>} 
          </div>
          
          <div className={styles.sellerText}>
            <span className={styles.sellerName}>{post.nguoiBan}</span>
            <div className={styles.statusWrapper}>
              {isSellerOnline ? (
                <>
                  <span className={`${styles.statusDot} ${styles.online}`}></span>
                  <span className={styles.statusText}>Đang hoạt động</span>
                </>
              ) : (
                <>
                   {sellerLastOnline ? (
                     <span className={styles.statusText}>{getLastOnlineText()}</span>
                   ) : (
                      <span className={styles.statusText} style={{opacity: 0.5}}>Ngoại tuyến</span>
                   )}
                </>
              )}
            </div>
          </div>
        </div>

        {!isOwner && (
          <div className={styles.quickReplyWrapper}>
            <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={() => scroll('left')}>
              <IoChevronBack size={18} />
            </button>
            <div className={styles.quickRepliesContainer} ref={scrollRef}>
              {combinedQuickReplies.map((text, idx) => (
                <button key={idx} className={styles.chip} onClick={() => handleQuickReplyClick(text)}>
                  {text}
                </button>
              ))}
            </div>
            <button className={`${styles.navBtn} ${styles.navNext}`} onClick={() => scroll('right')}>
              <IoChevronForward size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailsInfo;