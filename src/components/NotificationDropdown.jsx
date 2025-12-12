import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NotificationDropdown.module.css";
import api from "../services/api"; 
import { GlobalNotificationContext } from "../context/GlobalNotificationContext";

// Cấu hình các bộ lọc
const FILTERS = [
  { id: "all", label: "All activity" },
  { id: "likes", label: "Likes" },
  { id: "comments", label: "Comments" },
  { id: "followers", label: "Followers" }, 
];

export default function NotificationDropdown({ onClose }) {
  // --- 1. STATE & HOOKS ---

  // SỬA: Khởi tạo state từ localStorage để nhớ Tab cũ (mặc định là 'all')
  const [activeFilter, setActiveFilter] = useState(() => {
    return localStorage.getItem("notification_filter_tab") || "all";
  });

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State lưu danh sách ID những người mình đang follow để hiển thị nút đúng
  const [myFollowingIds, setMyFollowingIds] = useState(new Set()); 

  const navigate = useNavigate();
  const { socket, markAsReadGlobal } = useContext(GlobalNotificationContext);

  // --- 2. EFFECTS ---

  // Effect phụ: Lưu activeFilter vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem("notification_filter_tab", activeFilter);
  }, [activeFilter]);

  // Effect chính: Gọi API lấy danh sách thông báo & danh sách Following
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Chạy song song 2 API để tối ưu tốc độ
        const [notiRes, followingRes] = await Promise.all([
          api.get(`/usernotification?filter=${activeFilter}&page=1`),
          api.get(`/follow/following`) // API lấy danh sách người mình follow
        ]);

        setNotifications(notiRes.data);

        // Lưu các ID mình đang follow vào Set để tra cứu cho nhanh (O(1))
        // Giả sử API following trả về mảng object có field `followingId`
        const ids = new Set(followingRes.data.map(item => item.followingId));
        setMyFollowingIds(ids);

      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeFilter]);

  // Effect Socket: Lắng nghe thông báo Realtime
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (newNoti) => {
      const currentFilterMap = mapTypeToFilter(newNoti.type);
      // Chỉ thêm vào list nếu đang ở tab All hoặc tab tương ứng với loại thông báo
      if (activeFilter === 'all' || activeFilter === currentFilterMap) {
        setNotifications((prev) => [newNoti, ...prev]);
      }
    };
    socket.on("ReceiveNotification", handleNewNotification);
    return () => socket.off("ReceiveNotification", handleNewNotification);
  }, [socket, activeFilter]);

  // --- 3. HANDLERS ---

  const handleFollowAction = async (e, targetUserId) => {
    // Ngăn sự kiện click lan ra ngoài (để không nhảy vào trang profile khi bấm nút follow)
    e.stopPropagation(); 

    try {
      // Gọi API Toggle Follow
      const res = await api.post(`/follow/toggle?targetUserId=${targetUserId}`);
      
      if (res.data.success) {
        // Cập nhật state cục bộ để đổi nút (Follow -> Friends) ngay lập tức
        setMyFollowingIds(prev => {
          const newSet = new Set(prev);
          if (res.data.isFollowed) {
            newSet.add(targetUserId); // Đã follow -> Thêm vào list
          } else {
            newSet.delete(targetUserId); // Unfollow -> Xóa khỏi list
          }
          return newSet;
        });
      }
    } catch (err) {
      console.error("Lỗi follow:", err);
    }
  };

  // Helper: Map loại thông báo từ Backend sang ID của Filter Tab
  const mapTypeToFilter = (backendType) => {
    switch (backendType) {
      case "Like": return "likes";
      case "Comment": 
      case "Reply": return "comments";
      case "Follow": return "followers";
      case "Mention": return "mentions";
      default: return "all";
    }
  };

  // Xử lý khi click vào 1 thông báo
  const handleNotificationClick = async (noti) => {
    // 1. Đánh dấu đã đọc
    if (!noti.isRead) {
      try {
        await api.post(`/usernotification/${noti.id}/read`);
        setNotifications((prev) => 
          prev.map((n) => n.id === noti.id ? { ...n, isRead: true } : n)
        );
        if (markAsReadGlobal) markAsReadGlobal();
      } catch (err) { console.error(err); }
    }

    // 2. Điều hướng
    if (noti.type === "Follow") {
      navigate(`/nguoi-dung/${noti.senderId}`);
      if (onClose) onClose(); 
    } 
    // Kiểm tra referenceId cho Video
    else if (noti.referenceId || noti.refId) {
      const videoId = noti.referenceId || noti.refId;
      
      // 🔥 SỬA TẠI ĐÂY: Điều hướng sang route MỚI (/video-standalone/...)
      // Route cũ (/video/...) vẫn giữ nguyên cho các chức năng khác
      navigate(`/video-standalone/${videoId}`); 
      
      if (onClose) onClose(); 
    }
  };
  // Helper: Render nội dung chữ
  const renderContentText = (noti) => {
    switch (noti.type) {
      case 'Like': 
        return <span>đã thích video của bạn.</span>;
      case 'Comment': 
        return <span>đã bình luận: "{noti.content}"</span>;
      case 'Reply': 
        return <span>đã trả lời bình luận của bạn: "{noti.content}"</span>;
      case 'Follow': 
        return <span>đã bắt đầu follow bạn.</span>;
      case 'Mention': 
        return <span>đã nhắc đến bạn trong một bình luận.</span>;
      default: 
        return <span>{noti.content}</span>;
    }
  };

  // Ngăn cuộn trang cha khi cuộn trong dropdown
  const stopScrollPropagation = (e) => { e.stopPropagation(); };

  // --- 4. RENDER ---
  return (
    <div 
      className={styles.container}
      id="notification-dropdown-container" 
      onWheel={stopScrollPropagation}
      onTouchStart={stopScrollPropagation}
      onTouchMove={stopScrollPropagation}
      onTouchEnd={stopScrollPropagation}
    >
      {/* HEADER & FILTER */}
      <div className={styles.header}>
        <h3 className={styles.title}>Thông báo</h3>
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`${styles.pill} ${activeFilter === f.id ? styles.active : ""}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST NOTIFICATIONS */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.centerMessage}>Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.centerMessage}>Chưa có thông báo nào.</div>
        ) : (
          notifications.map((noti) => {
            // Kiểm tra xem mình đã follow người này chưa
            const isFollowing = myFollowingIds.has(noti.senderId);

            return (
              <div 
                key={noti.id} 
                className={`${styles.item} ${!noti.isRead ? styles.unread : ""}`}
                onClick={() => handleNotificationClick(noti)}
              >
                {/* Avatar */}
                <img 
                  src={noti.senderAvatarUrl || "/images/default-avatar.png"} 
                  alt="avatar" 
                  className={styles.avatar} 
                  onError={(e) => { e.target.src = "/images/default-avatar.png" }}
                />
                
                {/* Nội dung */}
                <div className={styles.contentWrapper}>
                  <div>
                    <span className={styles.username}>{noti.senderName} </span>
                    {renderContentText(noti)}
                  </div>
                  <span className={styles.time}>{noti.timeAgo}</span>
                </div>

                {/* Thumbnail Video (nếu có) */}
                {(noti.type === 'Like' || noti.type === 'Comment' || noti.type === 'Reply') && noti.postThumbnailUrl && (
                    <img src={noti.postThumbnailUrl} className={styles.postThumb} alt="post thumbnail" />
                )}
                
                {/* Nút Follow/Friends (Chỉ hiện khi loại thông báo là Follow) */}
                {noti.type === 'Follow' && (
                  isFollowing ? (
                    // Trạng thái: Đã follow nhau -> Hiện nút Friends
                    <button 
                      className={styles.friendBtn}
                      onClick={(e) => handleFollowAction(e, noti.senderId)} 
                    >
                      {/* Icon 2 mũi tên (SVG) */}
                      <svg className={styles.friendIcon} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 25.5H8.5V11.5H14.5V25.5Z" fill="currentColor" /><path d="M39.5 25.5H33.5V11.5H39.5V25.5Z" fill="currentColor" /><path d="M22.5 35.5H28.5V21.5H22.5V35.5Z" fill="currentColor" transform="rotate(90 25.5 28.5)" /><path fillRule="evenodd" clipRule="evenodd" d="M11.5 13.5H11.5V13.5Z" fill="currentColor"/></svg>
                      Friends
                    </button>
                  ) : (
                    // Trạng thái: Chưa follow lại -> Hiện nút Follow Back
                    <button 
                      className={styles.followBtn}
                      onClick={(e) => handleFollowAction(e, noti.senderId)}
                    >
                      Follow back
                    </button>
                  )
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}