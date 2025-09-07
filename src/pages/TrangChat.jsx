import React, { useState, useContext, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbarUniMarket from "../components/TopNavbarUniMarket";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
import "./TrangChat.css";
import chatBanner from "../assets/chat_banner_01.png";

const TrangChat = () => {
  const { maCuocTroChuyen } = useParams();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);

  useEffect(() => {
    if (maCuocTroChuyen) setSelectedChatId(maCuocTroChuyen);
  }, [maCuocTroChuyen]);

  useEffect(() => {
    if (!selectedChatId || !user || !selectedChatId.includes("-")) {
      setSelectedChatUserId(null);
      return;
    }
    const parts = selectedChatId.split("-");
    const otherUserId = parts.find((id) => id !== user.id);
    setSelectedChatUserId(otherUserId);
  }, [selectedChatId, user]);

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    if (user && chatId && chatId.includes("-")) {
      const parts = chatId.split("-");
      const otherUserId = parts.find((id) => id !== user.id);
      setSelectedChatUserId(otherUserId);
    } else {
      setSelectedChatUserId(null);
    }
  };

  const handleOpenChat = (maCuocTroChuyen) => {
    setSelectedChatId(maCuocTroChuyen);
    setTimeout(() => {
      const chatBox = document.querySelector(".chat-box-container");
      if (chatBox) chatBox.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const isChatRoute = location.pathname.startsWith("/chat");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "95vh" }}>
      <TopNavbarUniMarket />
      <div className={`trang-chat-container ${isChatRoute ? "with-mini-nav" : ""}`}>
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
              {/* ✅ Thay icon bằng ảnh */}
              <img
                src={chatBanner}
                alt="Chat Banner"
                className="IconChat-TrangChat"
              />
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
