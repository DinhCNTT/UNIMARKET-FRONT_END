import React, { useEffect, useState, useRef, useContext } from "react";
import { connectToChatHub, sendMessage } from "../services/chatService";
import { AuthContext } from "../context/AuthContext";
import "./ChatBox.css";
import { useNavigate } from "react-router-dom";

const ChatBox = ({ maCuocTroChuyen }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tinNhan, setTinNhan] = useState("");
  const [danhSachTin, setDanhSachTin] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [infoTinDang, setInfoTinDang] = useState({ tieuDe: "", gia: 0, anh: "" });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const connectionRef = useRef(null);

  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png";
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!maCuocTroChuyen) return;
    const fetchChatInfo = async () => {
      try {
        const res = await fetch(`http://localhost:5133/api/chat/info/${maCuocTroChuyen}`);
        if (!res.ok) throw new Error("Lỗi lấy thông tin cuộc trò chuyện");
        const data = await res.json();
        setInfoTinDang({ tieuDe: data.tieuDeTinDang, gia: data.giaTinDang, anh: data.anhDaiDienTinDang, maTinDang: data.maTinDang });
      } catch (error) {
        console.error(error);
      }
    };
    fetchChatInfo();
  }, [maCuocTroChuyen]);

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
            if (!timeStr.endsWith("Z")) timeStr += "Z";
            return {
              ...msg,
              thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
              daXem: msg.daXem || false,
            };
          })
        );
      } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error);
      }
    };
    fetchHistory();
  }, [maCuocTroChuyen]);

  useEffect(() => {
    if (!maCuocTroChuyen) return;

    const connect = async () => {
      try {
        const connection = await connectToChatHub(maCuocTroChuyen, (msg) => {
          console.log("Nhận tin nhắn mới qua SignalR:", msg);
          let timeStr = msg.thoiGianGui;
          if (!timeStr.endsWith("Z")) timeStr += "Z";

          const newMsg = {
            ...msg,
            thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            daXem: msg.daXem || false,
          };

          setDanhSachTin((prev) => [...prev, newMsg]);
        });

        // Bổ sung event CapNhatTinDang để cập nhật ảnh, tiêu đề, giá realtime
        connection.on("CapNhatTinDang", (updatedPost) => {
          console.log("ChatBox nhận cập nhật tin đăng:", updatedPost);
          // Lấy mã tin đăng trong maCuocTroChuyen (cuối chuỗi, format: user1-user2-MaTinDang)
          const maTinDangHT = maCuocTroChuyen.split("-").pop();
          if (updatedPost.MaTinDang.toString() === maTinDangHT.toString()) {
            setInfoTinDang((prev) => ({
              ...prev,
              tieuDe: updatedPost.TieuDe || updatedPost.tieuDe || prev.tieuDe,
              gia: updatedPost.Gia || updatedPost.gia || prev.gia,
              anh: updatedPost.AnhDaiDien || updatedPost.anhDaiDien || prev.anh,
              maTinDang: updatedPost.MaTinDang || prev.maTinDang,
            }));
          }
        });

        connection.on("DaXemTinNhan", (data) => {
          console.log("Nhận event DaXemTinNhan, dữ liệu:", data);
          const MaTinNhanCuoi = data?.MaTinNhanCuoi || data?.maTinNhanCuoi;
          if (MaTinNhanCuoi) {
            setDanhSachTin((prev) =>
              prev.map((msg) => (msg.maTinNhan === MaTinNhanCuoi ? { ...msg, daXem: true } : msg))
            );
          }
        });

        connectionRef.current = connection;
        setIsConnected(connection && connection.state === "Connected");
        console.log("SignalR kết nối thành công, trạng thái:", connection.state);

        connection.onclose(() => console.log("SignalR connection closed"));
        connection.onreconnected(() => console.log("SignalR reconnected"));
      } catch (err) {
        console.error("Lỗi kết nối SignalR hoặc đăng ký sự kiện:", err);
      }
    };

    connect();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [maCuocTroChuyen, user?.id]);

  useEffect(() => {
    scrollToBottom();
    const timer = setTimeout(() => {
      if (connectionRef.current && isConnected && user && maCuocTroChuyen) {
        console.log("Gửi invoke DanhDauDaXem:", { maCuocTroChuyen, maNguoiXem: user.id });
        connectionRef.current.invoke("DanhDauDaXem", maCuocTroChuyen, user.id).catch((err) => {
          console.error("Lỗi invoke DanhDauDaXem:", err);
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [danhSachTin, isConnected, maCuocTroChuyen, user]);

  const lastSeenMsgId = React.useMemo(() => {
    if (!user) return null;
    const myMessages = danhSachTin.filter((m) => m.maNguoiGui === user.id);
    if (myMessages.length === 0) return null;
    myMessages.sort((a, b) => new Date(a.thoiGianGui) - new Date(b.thoiGianGui));
    for (let i = myMessages.length - 1; i >= 0; i--) {
      if (myMessages[i].daXem === true) {
        return myMessages[i].maTinNhan;
      }
    }
    return null;
  }, [danhSachTin, user]);

  const handleSend = () => {
    if (tinNhan.trim() && isConnected && maCuocTroChuyen && user) {
      sendMessage(maCuocTroChuyen, user.id, tinNhan.trim());
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
    try {
      const res = await fetch(`http://localhost:5133/api/chat/info/${maCuocTroChuyen}`);
      if (!res.ok) throw new Error("Không lấy được thông tin tin đăng");
      const data = await res.json();
      data.maTinDang ? navigate(`/tin-dang/${data.maTinDang}`) : alert("Không tìm thấy mã tin đăng!");
    } catch {
      alert("Không lấy được thông tin tin đăng!");
    }
  };

  return (
    <div className="chatbox-container">
      <div className="chatbox-header">
        <div className="seller-info" onClick={handleImageClick}>
          <div className="seller-avatar">
            <img src={getFullImageUrl(infoTinDang.anh)} alt="Ảnh tin đăng" />
          </div>
          <div className="seller-details">
            <h3>{infoTinDang.tieuDe}</h3>
            <p className="status">
              {infoTinDang.gia.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
            </p>
          </div>
        </div>
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
              <div className={`message ${msg.maNguoiGui === user?.id ? "sent" : "received"}`}>
                <div className="message-content">
                  <p>{msg.noiDung}</p>
                </div>
                <div className="message-time">{formatTime(msg.thoiGian)}</div>
                {lastSeenMsgId && msg.maTinNhan === lastSeenMsgId && msg.maNguoiGui === user?.id && (
                  <div className="message-status">Đã xem</div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbox-input-container">
        {!isConnected && <div className="connection-warning">⚠️ Mất kết nối. Đang thử kết nối lại...</div>}
        <div className="chatbox-input">
          <div className="input-field">
            <textarea
              ref={inputRef}
              value={tinNhan}
              onChange={(e) => setTinNhan(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              disabled={!isConnected}
            />
          </div>
          <button
            className={`send-btn ${tinNhan.trim() && isConnected ? "active" : ""}`}
            onClick={handleSend}
            disabled={!tinNhan.trim() || !isConnected}
            title="Gửi tin nhắn"
          >
            ➔
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
