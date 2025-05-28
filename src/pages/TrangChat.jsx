import React, { useState, useContext, useEffect } from "react"; 
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
import "./TrangChat.css";

const TrangChat = () => {
  const { maCuocTroChuyen } = useParams(); // lấy từ URL
  const { user } = useContext(AuthContext);

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);

  // Khi URL thay đổi hoặc user thay đổi, set selectedChatId từ URL
  useEffect(() => {
    if (maCuocTroChuyen) {
      setSelectedChatId(maCuocTroChuyen);
    }
  }, [maCuocTroChuyen]);

  // Cập nhật selectedChatUserId khi selectedChatId hoặc user thay đổi
  useEffect(() => {
    if (!selectedChatId || !user) {
      setSelectedChatUserId(null);
      return;
    }
    const parts = selectedChatId.split("-");
    const otherUserId = parts.find(id => id !== user.id);
    setSelectedChatUserId(otherUserId);
  }, [selectedChatId, user]);

  // Khi người dùng chọn chat trong danh sách
  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    // Lấy người còn lại trong chat
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
              Chọn cuộc trò chuyện để bắt đầu chat
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrangChat;
