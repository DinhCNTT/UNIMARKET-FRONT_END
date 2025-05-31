import React, { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
import "./TrangChat.css";

const TrangChat = () => {
  const { maCuocTroChuyen } = useParams();
  const { user } = useContext(AuthContext);

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);

  useEffect(() => {
    if (maCuocTroChuyen) {
      setSelectedChatId(maCuocTroChuyen);
    }
  }, [maCuocTroChuyen]);

  useEffect(() => {
    if (!selectedChatId || !user) {
      setSelectedChatUserId(null);
      return;
    }
    const parts = selectedChatId.split("-");
    const otherUserId = parts.find(id => id !== user.id);
    setSelectedChatUserId(otherUserId);
  }, [selectedChatId, user]);

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    if (user) {
      const parts = chatId.split("-");
      const otherUserId = parts.find(id => id !== user.id);
      setSelectedChatUserId(otherUserId);
    }
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
              <div className="empty-icon">💬</div>
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
              <p>Hoặc quay lại trang chủ để tìm tin đăng và bắt đầu chat!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrangChat;