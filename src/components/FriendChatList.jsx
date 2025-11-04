import React, { useEffect, useState, useCallback } from "react";
import "./FriendChatList.css";
import {
  joinGroup,
  registerChatEventHandler,
  unregisterChatEventHandler,
  markAsSeen,
  deleteConversation, 
} from "../services/chatSocialService";
import ChatListItemMenu from "./ChatListItemMenu"; 

const FriendChatList = ({ userId, onSelectChat, selectedChatId }) => {
  const [friendChats, setFriendChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const formatMessageTime = (utcDateString) => {
    if (!utcDateString) return "";
    const messageDate = new Date(utcDateString);
    const now = new Date();
    const options = { timeZone: "Asia/Ho_Chi_Minh" };
    const messageDateVN = new Date(messageDate.toLocaleString("en-US", options));
    const nowVN = new Date(now.toLocaleString("en-US", options));
    const messageDayStart = new Date(
      messageDateVN.getFullYear(),
      messageDateVN.getMonth(),
      messageDateVN.getDate()
    );
    const todayStart = new Date(
      nowVN.getFullYear(),
      nowVN.getMonth(),
      nowVN.getDate()
    );
    const timeString = messageDateVN.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    if (messageDayStart.getTime() === todayStart.getTime()) {
      return timeString;
    }
    return messageDateVN.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // --- Realtime: Cập nhật cuộc trò chuyện ---
  const handleUpdateConversation = useCallback(
    (data) => {
      if (!data || !data.MaCuocTroChuyen) {
        return;
      }

      setFriendChats((prevChats) => {
        const chatIndex = prevChats.findIndex(
          (c) => c.maCuocTroChuyen === data.MaCuocTroChuyen
        );

        // ===================================================
        // TRƯỜNG HỢP 1: CẬP NHẬT CUỘC TRÒ CHUYỆN ĐÃ CÓ
        // ===================================================
        if (chatIndex > -1) {
          const existingChat = prevChats[chatIndex];
          const isActiveChat = existingChat.maCuocTroChuyen === selectedChatId;
          const isFromOtherUser = data.NguoiGuiId !== userId;

          let newUnreadCount = existingChat.unreadCount || 0;
          if (isActiveChat) {
            newUnreadCount = 0;
          } else if (isFromOtherUser) {
            newUnreadCount += 1;
          }

          const updatedChat = {
            ...existingChat,
            lastMessage: {
              noiDung: data.TinNhanCuoi,
              thoiGianGui: data.ThoiGianCapNhat,
              sender: {
                id: data.NguoiGuiId,
                fullName: data.TenNguoiGui,
                avatarUrl: data.AvatarNguoiGui,
              },
              messageType: data.LastMessage?.messageType || data.MessageType || "text",
            },
            unreadCount: newUnreadCount,
          };
          const newChats = prevChats.filter(
            (c) => c.maCuocTroChuyen !== data.MaCuocTroChuyen
          );
          return [updatedChat, ...newChats];
        }
          const partnerInfo = data.Partner || {
            id: data.NguoiGuiId,
            fullName: data.TenNguoiGui,
            avatarUrl: data.AvatarNguoiGui,
            isOnline: true,
          };
          if (partnerInfo && partnerInfo.id) {
            const newChat = {
              maCuocTroChuyen: data.MaCuocTroChuyen,
              thoiGianTao: data.ThoiGianTao || data.ThoiGianCapNhat,
              lastMessage: {
                noiDung: data.TinNhanCuoi,
                thoiGianGui: data.ThoiGianCapNhat,
                sender: {
                  id: data.NguoiGuiId,
                  fullName: data.TenNguoiGui,
                  avatarUrl: data.AvatarNguoiGui,
                },
                messageType: data.LastMessage?.messageType || data.MessageType || "text",
              },
              partner: partnerInfo, 
              unreadCount: 1,
            };
            joinGroup(data.MaCuocTroChuyen);
            return [newChat, ...prevChats];
          }
        return prevChats;
      });
    },
    [userId, selectedChatId] 
  );

  // --- Realtime: Cập nhật trạng thái online/offline ---
  const handlePresenceUpdate = useCallback((presence) => {
    setFriendChats((prev) =>
      prev.map((chat) =>
        chat.partner?.id === presence.userId
          ? {
              ...chat,
              partner: {
                ...chat.partner,
                isOnline: presence.isOnline,
              },
            }
          : chat
      )
    );
  }, []);

  // --- Fetch danh sách bạn bè ---
  const fetchFriendChats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Chưa đăng nhập hoặc thiếu token");

      const res = await fetch(
        `http://localhost:5133/api/SocialShare/social/user/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );

      if (res.status === 401) throw new Error("Token hết hạn hoặc không hợp lệ");
      if (!res.ok) throw new Error("Lỗi khi gọi API SocialChat");

      const data = await res.json();

      const chats = Array.isArray(data)
        ? data.map((chat) => ({
            ...chat,
            unreadCount: chat.unreadCount ?? 0,
          }))
        : [];

      setFriendChats((prevChats) => {
        const isEqual =
          JSON.stringify(prevChats.map((c) => c.maCuocTroChuyen)) ===
          JSON.stringify(chats.map((c) => c.maCuocTroChuyen));
        return isEqual ? prevChats : chats;
      });

      for (const chat of chats) {
        if (chat.maCuocTroChuyen) joinGroup(chat.maCuocTroChuyen);
      }
    } catch (error) {
      console.error("❌ Lỗi lấy danh sách bạn bè:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // --- Xử lý xóa cuộc trò chuyện ---
  const handleDeleteConversation = async (maCuocTroChuyen) => {
    setError(null);

    const chatToDelete = friendChats.find(
      (c) => c.maCuocTroChuyen === maCuocTroChuyen
    );
    const wasUnread = chatToDelete && chatToDelete.unreadCount > 0;

    try {
      if (wasUnread) {
        await markAsSeen(maCuocTroChuyen);
      }
      await deleteConversation(maCuocTroChuyen);
      setFriendChats((prevChats) =>
        prevChats.filter((chat) => chat.maCuocTroChuyen !== maCuocTroChuyen)
      );
      if (selectedChatId === maCuocTroChuyen) {
        onSelectChat(null, null);
      }
    } catch (err) {
      console.error("Lỗi khi xóa chat:", err);
      setError(err.message || "Không thể xóa. Vui lòng thử lại.");
    }
  };

  // --- Đăng ký và hủy đăng ký realtime event ---
  useEffect(() => {
    if (!userId) return;

    fetchFriendChats();
    registerChatEventHandler("CapNhatCuocTroChuyen", handleUpdateConversation);
    registerChatEventHandler("PresenceUpdated", handlePresenceUpdate);

    return () => {
      unregisterChatEventHandler("CapNhatCuocTroChuyen", handleUpdateConversation);
      unregisterChatEventHandler("PresenceUpdated", handlePresenceUpdate);
    };
  }, [userId, fetchFriendChats, handleUpdateConversation, handlePresenceUpdate]);

  // --- Click chọn chat ---
  const handleSelectChat = (chat) => {
    const wasUnread = chat.unreadCount > 0;
    setFriendChats((prev) =>
      prev.map((c) =>
        c.maCuocTroChuyen === chat.maCuocTroChuyen
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
    onSelectChat(chat, "social");
    if (wasUnread) {
      markAsSeen(chat.maCuocTroChuyen);
    }
  };

  // --- Render tin nhắn cuối ---
  const renderLastMessageLine = (chat, isUnread) => {
    const lastMessage = chat.lastMessage;
    const formattedTime = formatMessageTime(lastMessage.thoiGianGui);
    const messageType = lastMessage.messageType || "text";
    const isActiveChat = chat.maCuocTroChuyen === selectedChatId;
    const textClass = isUnread && !isActiveChat ? "last-text bold" : "last-text";

    let content = lastMessage.noiDung || "";
    content = content.replace(/\[ShareId:.*?\]\s*/g, "").trim();


    if (messageType === "video") {
        // Nếu không có nội dung đi kèm, hiển thị "đã gửi 1 video"
        if (!content) {
             return (
                <>
                  <span className={`${textClass} italic`}>đã gửi 1 video</span>
                  <span className="last-time"> • {formattedTime}</span>
                </>
              );
        }
        // Nếu có nội dung, ưu tiên hiển thị nó
    }

    if (messageType === "image") {
       if (!content) {
            return (
                <>
                  <span className={`${textClass} italic`}>đã gửi 1 ảnh</span>
                  <span className="last-time"> • {formattedTime}</span>
                </>
            );
       }
    }

    const senderId = lastMessage.sender?.Id || lastMessage.sender?.id;
    const senderName =
      senderId === userId
        ? "Bạn"
        : lastMessage.sender?.FullName ||
          lastMessage.sender?.fullName ||
          "Ai đó";

    const senderClass =
      isUnread && !isActiveChat ? "last-sender bold" : "last-sender";

    // Nếu sau khi xóa tag mà không còn nội dung, hiển thị thông báo mặc định
    if (!content) {
        if (messageType === 'video') {
            content = 'đã chia sẻ 1 video';
        } else if (messageType === 'share') {
            content = 'đã chia sẻ 1 bài viết';
        } else {
             content = 'đã gửi 1 tin nhắn';
        }
        return (
            <>
              <span className={senderClass}>{senderName}:</span>{' '}
              <span className={`${textClass} italic`}>{content}</span>
              <span className="last-time"> • {formattedTime}</span>
            </>
          );
    }
    return (
      <>
        <span className={senderClass}>{senderName}:</span>{" "}
        <span className={textClass}>{content}</span>
        <span className="last-time"> • {formattedTime}</span>
      </>
    );
  };



  if (loading) return <p className="chatlist-empty">Đang tải...</p>;

  return (
    <div className="friend-chatlist">
      {error && <p className="chatlist-empty" style={{ color: "red" }}>{error}</p>}

      {friendChats.length === 0 ? (
        <p className="chatlist-empty">Không có cuộc trò chuyện nào</p>
      ) : (
        friendChats.map((chat) => {
          const isUnread = chat.unreadCount > 0;
          const isActive = chat.maCuocTroChuyen === selectedChatId;

          return (
            <div
              key={chat.maCuocTroChuyen}
              className={`chatlist-item-wrapper ${isActive ? "active-chat" : ""}`}
            >
              <div
                className={`chatlist-item ${isUnread && !isActive ? "unread-chat" : ""}`}
                onClick={() => handleSelectChat(chat)}
              >
                <img
                  src={chat.partner?.avatarUrl || "/default-avatar.png"}
                  alt="Avatar"
                  className="chatlist-avatar"
                />
                <div className="chatlist-item-content">
                  <div className="chatlist-item-title">
                    {chat.partner?.fullName || "Người dùng"}
                    {chat.partner?.isOnline && (
                      <span className="online-dot" title="Đang online"></span>
                    )}
                  </div>
                  <div className="chatlist-item-last">
                    {chat.lastMessage
                      ? renderLastMessageLine(chat, isUnread)
                      : "Chưa có tin nhắn"}
                  </div>
                </div>

                {isUnread && !isActive && (
                  <div className="unread-badge">{chat.unreadCount}</div>
                )}
              </div>
              <ChatListItemMenu
                onDelete={() => handleDeleteConversation(chat.maCuocTroChuyen)}
              />
            </div>
          );
        })
      )}
    </div>
  );
};

export default FriendChatList;