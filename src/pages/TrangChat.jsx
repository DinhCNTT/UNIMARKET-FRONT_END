import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";

const TrangChat = () => {
  const { user } = useContext(AuthContext);

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);

  const handleSelectChat = (maCuocTroChuyen) => {
    setSelectedChatId(maCuocTroChuyen);
    if (!user) return;
    const parts = maCuocTroChuyen.split("-");
    const otherUserId = parts.find(id => id !== user.id);
    setSelectedChatUserId(otherUserId);
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
