import React, { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
import "./TrangChat.css";

const TrangChat = () => {
  const { maCuocTroChuyen } = useParams(); // Lấy mã cuộc trò chuyện từ URL
  const { user } = useContext(AuthContext);

  const [selectedChatId, setSelectedChatId] = useState(maCuocTroChuyen || null);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);

  // Lấy id người còn lại trong cuộc trò chuyện để truyền vào ChatBox
  useEffect(() => {
    if (!selectedChatId || !user) return;
    const parts = selectedChatId.split("-");
    const otherUserId = parts.find((id) => id !== user.id);
    setSelectedChatUserId(otherUserId);
  }, [selectedChatId, user]);

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopNavbar />
      <div className="trang-chat-container">
        <div className="chat-list-container">
          <ChatList
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            userId={user?.id}
          />
        </div>
        <div className="chat-box-container">
          {selectedChatId ? (
            <ChatBox
              maCuocTroChuyen={selectedChatId}
              maNguoiGui={user?.id}
              maNguoiBan={selectedChatUserId}
            />
          ) : (
            <div className="empty-chat-placeholder">
              Chọn cuộc trò chuyện để bắt đầu chat
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrangChat;
