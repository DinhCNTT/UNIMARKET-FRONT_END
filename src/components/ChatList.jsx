import React, { useEffect, useState } from "react";
import axios from "axios";

const ChatList = ({ selectedChatId, onSelectChat, userId }) => {
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const fetchChats = async () => {
      try {
        const res = await axios.get(`http://localhost:5133/api/chat/user/${userId}`);
        setChatList(res.data);
      } catch (error) {
        console.error("Lỗi lấy danh sách chat:", error);
      }
    };
    fetchChats();
  }, [userId]);

  return (
    <div>
      {chatList.length === 0 ? (
        <p>Không có cuộc trò chuyện nào</p>
      ) : (
        chatList.map((chat) => (
          <div
            key={chat.maCuocTroChuyen}
            onClick={() => onSelectChat(chat.maCuocTroChuyen)}
            style={{
              padding: "10px",
              cursor: "pointer",
              backgroundColor: chat.maCuocTroChuyen === selectedChatId ? "#e0e0e0" : "transparent",
              borderBottom: "1px solid #ccc",
            }}
          >
            <div style={{ fontWeight: "bold" }}>{chat.tenNguoiConLai || "Người dùng"}</div>
            <div style={{ fontSize: "14px", color: "#555" }}>
              {chat.tinNhanCuoi || (chat.isEmpty ? "Chưa có tin nhắn" : "")}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatList;
