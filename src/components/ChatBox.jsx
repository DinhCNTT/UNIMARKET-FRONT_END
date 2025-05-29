import React, { useEffect, useState, useRef, useContext } from "react";
import { connectToChatHub, sendMessage } from "../services/chatService";
import { AuthContext } from "../context/AuthContext";
import "./ChatBox.css";
import { useNavigate } from "react-router-dom";

const ChatBox = ({ maCuocTroChuyen, maNguoiGui }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tinNhan, setTinNhan] = useState("");
  const [danhSachTin, setDanhSachTin] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [infoTinDang, setInfoTinDang] = useState({ tieuDe: "", gia: 0, anh: "" });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png";
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Lấy thông tin tin đăng
  useEffect(() => {
    if (!maCuocTroChuyen) return;

    const fetchChatInfo = async () => {
      try {
        const res = await fetch(`http://localhost:5133/api/chat/info/${maCuocTroChuyen}`);
        if (!res.ok) throw new Error("Lỗi lấy thông tin cuộc trò chuyện");
        const data = await res.json();
        setInfoTinDang({
          tieuDe: data.tieuDeTinDang,
          gia: data.giaTinDang,
          anh: data.anhDaiDienTinDang,
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchChatInfo();
  }, [maCuocTroChuyen]);

  // Lấy lịch sử chat và fix thời gian UTC đúng múi giờ local
  useEffect(() => {
    if (!maCuocTroChuyen) return;

    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5133/api/chat/history/${maCuocTroChuyen}`);
        if (!response.ok) throw new Error("Lấy lịch sử chat lỗi");
        const data = await response.json();
        setDanhSachTin(
          data.map((msg) => {
            let timeStr = msg.thoiGianGui;
            if (!timeStr.endsWith("Z")) timeStr += "Z"; // Thêm 'Z' nếu thiếu
            return {
              ...msg,
              thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
          })
        );
      } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error);
      }
    };

    fetchHistory();
  }, [maCuocTroChuyen]);

  // Kết nối SignalR, nhận tin nhắn realtime, fix thời gian tương tự
  useEffect(() => {
    if (!maCuocTroChuyen) return;

    const connect = async () => {
      const conn = await connectToChatHub(maCuocTroChuyen, (msg) => {
        let timeStr = msg.thoiGianGui;
        if (!timeStr.endsWith("Z")) timeStr += "Z";
        setDanhSachTin((prev) => [
          ...prev,
          {
            ...msg,
            thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", {
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
      // Có thể disconnect hoặc leave group nếu cần
    };
  }, [maCuocTroChuyen]);

  useEffect(() => {
    scrollToBottom();
  }, [danhSachTin]);

  const handleSend = () => {
    if (tinNhan.trim() && isConnected && maCuocTroChuyen && maNguoiGui) {
      const now = new Date();

      const newMsg = {
        MaCuocTroChuyen: maCuocTroChuyen,
        MaNguoiGui: maNguoiGui,
        NoiDung: tinNhan.trim(),
        thoiGianGui: now.toISOString(),
        thoiGian: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

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

  const handleImageClick = async (e) => {
    e.stopPropagation();
    if (maCuocTroChuyen) {
      try {
        const res = await fetch(`http://localhost:5133/api/chat/info/${maCuocTroChuyen}`);
        if (!res.ok) throw new Error("Không lấy được thông tin tin đăng");
        const data = await res.json();
        if (data.maTinDang) {
          navigate(`/tin-dang/${data.maTinDang}`);
        } else {
          alert("Không tìm thấy mã tin đăng!");
        }
      } catch (err) {
        alert("Không lấy được thông tin tin đăng!");
      }
    } else {
      alert("Không tìm thấy mã tin đăng!");
    }
  };

  return (
    <div className="chatbox-container">
      <div className="chatbox-header" style={{ display: "flex", alignItems: "center", padding: "10px" }}>
        <img
          src={getFullImageUrl(infoTinDang.anh)}
          alt="Ảnh tin đăng"
          style={{ width: 50, height: 50, borderRadius: 5, marginRight: 10, objectFit: "cover" }}
          onClick={handleImageClick}
        />
        <div>
          <h3 style={{ margin: 0 }}>{infoTinDang.tieuDe}</h3>
          <p style={{ margin: 0, color: "#555" }}>
            {infoTinDang.gia.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
          </p>
        </div>
      </div>

      <div className="chatbox-messages" style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        {danhSachTin.length === 0 ? (
          <div className="empty-chat" style={{ textAlign: "center", marginTop: 20 }}>
            <div className="empty-icon" style={{ fontSize: 50 }}>
              💬
            </div>
            <p>Chưa có tin nhắn nào</p>
            <p>Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          danhSachTin.map((msg, idx) => (
            <div key={idx} className="message-wrapper" style={{ marginBottom: 10 }}>
              <div
                className={`message ${msg.maNguoiGui === maNguoiGui ? "sent" : "received"}`}
                style={{
                  maxWidth: "70%",
                  borderRadius: 12,
                  backgroundColor: msg.maNguoiGui === maNguoiGui ? "#fd901f" : "#eee",
                  color: msg.maNguoiGui === maNguoiGui ? "white" : "black",
                  marginLeft: msg.maNguoiGui === maNguoiGui ? "auto" : "0",
                }}
              >
                <div className="message-content">
                  <p style={{ margin: 0 }}>{msg.noiDung}</p>
                </div>
                <div className="message-time" style={{ fontSize: 10, marginTop: 4, textAlign: "right", marginRight: 8 }}>
                  {formatTime(msg.thoiGian)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbox-input-container" style={{ padding: 10, borderTop: "1px solid #ccc" }}>
        {!isConnected && (
          <div className="connection-warning" style={{ marginBottom: 5, color: "red" }}>
            ⚠️ Mất kết nối. Đang thử kết nối lại...
          </div>
        )}
        <div className="chatbox-input" style={{ display: "flex" }}>
          <textarea
            ref={inputRef}
            value={tinNhan}
            onChange={(e) => setTinNhan(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            disabled={!isConnected}
            rows={1}
            style={{ flex: 1, resize: "none", padding: 8, fontSize: 14 }}
          />
          <button
            className={`send-btn ${tinNhan.trim() && isConnected ? "active" : ""}`}
            onClick={handleSend}
            disabled={!tinNhan.trim() || !isConnected}
            title="Gửi tin nhắn"
            style={{ marginLeft: 5, padding: "8px 12px", cursor: "pointer" }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
