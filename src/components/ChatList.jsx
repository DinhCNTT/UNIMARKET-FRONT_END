import React, { useEffect, useState } from "react";
import "./ChatList.css"; // Import CSS

const ChatList = ({ selectedChatId, onSelectChat, userId }) => {
  const [chatList, setChatList] = useState([]);

  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png";
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      try {
        const res = await fetch(`http://localhost:5133/api/chat/user/${userId}`);
        const data = await res.json();
        setChatList(data);
      } catch (error) {
        console.error("Lỗi lấy danh sách chat:", error);
      }
    };

    fetchChats();
  }, [userId]);

  return (
    <div className="chatlist-container">
      {chatList.length === 0 ? (
        <p className="chatlist-empty">Không có cuộc trò chuyện nào</p>
      ) : (
        chatList.map((chat) => (
          <div
            key={chat.maCuocTroChuyen}
            onClick={() => onSelectChat(chat.maCuocTroChuyen)}
            className={`chatlist-item ${
              chat.maCuocTroChuyen === selectedChatId ? "chatlist-item-selected" : ""
            }`}
          >
            <img
              src={getFullImageUrl(chat.anhDaiDienTinDang)}
              alt="Ảnh tin đăng"
              className="chatlist-item-image"
            />
            <div className="chatlist-item-content">
              <div className="chatlist-item-title">{chat.tieuDeTinDang || "Tin đăng"}</div>
              <div className="chatlist-item-price">
                Giá: {chat.giaTinDang?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || ""}
              </div>
              <div className="chatlist-item-info">
                {chat.tenNguoiConLai || "Người dùng"} - {chat.tinNhanCuoi || (chat.isEmpty ? "Chưa có tin nhắn" : "")}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatList;
