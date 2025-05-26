import React, { useEffect, useState, useRef, useContext } from "react";
import { connectToChatHub, sendMessage } from "../services/chatService";
import { AuthContext } from "../context/AuthContext";
import "./ChatBox.css";

const ChatBox = ({ maCuocTroChuyen, maNguoiGui }) => {
  const { user } = useContext(AuthContext);

  const [tinNhan, setTinNhan] = useState("");
  const [danhSachTin, setDanhSachTin] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll xuống dưới khi có tin nhắn mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Lấy lịch sử chat khi maCuocTroChuyen thay đổi
  useEffect(() => {
    if (!maCuocTroChuyen) return;

    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5133/api/chat/history/${maCuocTroChuyen}`);
        if (!response.ok) throw new Error("Lấy lịch sử chat lỗi");
        const data = await response.json();
        setDanhSachTin(
          data.map((msg) => ({
            ...msg,
            thoiGian: new Date(msg.thoiGianGui).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))
        );
      } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error);
      }
    };

    fetchHistory();
  }, [maCuocTroChuyen]);

  // Kết nối SignalR nhận tin nhắn realtime
  useEffect(() => {
    if (!maCuocTroChuyen) return;

    const connect = async () => {
      const conn = await connectToChatHub(maCuocTroChuyen, (msg) => {
        setDanhSachTin((prev) => [
          ...prev,
          {
            ...msg,
            thoiGian: new Date(msg.thoiGianGui).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      });

      if (conn && conn.state === "Connected") {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      // Optional: disconnect or leave group
    };
  }, [maCuocTroChuyen]);

  useEffect(() => {
    scrollToBottom();
  }, [danhSachTin]);

  const handleSend = () => {
    if (tinNhan.trim() && isConnected && maCuocTroChuyen && maNguoiGui) {
      sendMessage(maCuocTroChuyen, maNguoiGui, tinNhan.trim());
      setTinNhan("");
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (time) => {
    return time || new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chatbox-container">
      <div className="chatbox-header">
        <h3>Cuộc trò chuyện</h3>
      </div>

      <div className="chatbox-messages">
        {danhSachTin.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">💬</div>
            <p>Chưa có tin nhắn nào</p>
            <p>Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          danhSachTin.map((msg, idx) => (
            <div key={idx} className="message-wrapper">
              <div className={`message ${msg.maNguoiGui === maNguoiGui ? "sent" : "received"}`}>
                <div className="message-content">
                  <p>{msg.noiDung}</p>
                </div>
                <div className="message-time">{formatTime(msg.thoiGian)}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbox-input-container">
        {!isConnected && (
          <div className="connection-warning">⚠️ Mất kết nối. Đang thử kết nối lại...</div>
        )}
        <div className="chatbox-input">
          <textarea
            ref={inputRef}
            value={tinNhan}
            onChange={(e) => setTinNhan(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            disabled={!isConnected}
            rows="1"
          />
          <button
            className={`send-btn ${tinNhan.trim() && isConnected ? "active" : ""}`}
            onClick={handleSend}
            disabled={!tinNhan.trim() || !isConnected}
            title="Gửi tin nhắn"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
