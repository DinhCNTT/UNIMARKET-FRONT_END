import React, { useEffect, useRef, useState, useMemo } from "react";
import { useChat } from "../context/ChatContext";
import MessageItem from "./MessageItem";
import { MessageSquareText } from "lucide-react";
import { FaBan } from "react-icons/fa";
const MessageList = () => {
  const { danhSachTin, user, markAsRead, isBlockedByMe, isBlockedByOther } = useChat();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: instant ? "auto" : "smooth",
      });
    }
  };

  // Effect: Scroll và đánh dấu đã xem
  useEffect(() => {
    if (danhSachTin.length > 0) {
      if (isFirstLoad) {
        scrollToBottom(true);
        setIsFirstLoad(false);
      } else {
        scrollToBottom(false);
      }
    }

    // Đánh dấu đã xem sau 0.5s
    const timer = setTimeout(() => {
      markAsRead();
    }, 500);

    return () => clearTimeout(timer);
  }, [danhSachTin, markAsRead, isFirstLoad]);

  // Effect: Reset isFirstLoad khi đổi cuộc trò chuyện (danhSachTin thay đổi hoàn toàn)
  useEffect(() => {
    setIsFirstLoad(true);
  }, [user, markAsRead]); // Giả sử user hoặc markAsRead thay đổi khi đổi chat

  // Tính toán tin nhắn cuối cùng đã xem
  const lastSeenMsgId = useMemo(() => {
    if (!user) return null;
    const myMessages = danhSachTin.filter((m) => m.maNguoiGui === user.id);
    if (myMessages.length === 0) return null;
    const lastMessage = myMessages.sort(
      (a, b) => new Date(b.thoiGianGui) - new Date(a.thoiGianGui)
    )[0];
    return lastMessage.daXem ? lastMessage.maTinNhan : null;
  }, [danhSachTin, user]);

  return (
    <div className="chatbox-messages">
      {danhSachTin.length === 0 ? (
        <div className="chatbox-empty-chat">
          <div className="chatbox-empty-icon">
            <MessageSquareText size={70} className="text-gray-400" />
          </div>
          <p>Chưa có tin nhắn nào</p>
          <p>Hãy bắt đầu cuộc trò chuyện!</p>
        </div>
      ) : (
        danhSachTin.map((msg) => (
          <MessageItem
            key={msg.maTinNhan} // Dùng maTinNhan làm key
            message={msg}
            showSeenStatus={msg.maTinNhan === lastSeenMsgId}
          />
        ))
      )}

      {(isBlockedByMe || isBlockedByOther) && (
        <div className="chatbox-blocked-notice">
          <FaBan size={24} />
          <p>
            {isBlockedByMe
              ? "Bạn đã chặn người dùng này."
              : "Bạn đã bị chặn bởi người dùng này."}
          </p>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;