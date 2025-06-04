// ChatBox.jsx - Phiên bản cải tiến (Hiệu ứng Swal nhanh hơn)
import React, { useEffect, useState, useRef, useContext } from "react";
import { connectToChatHub, sendMessage } from "../services/chatService";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "animate.css";
import "./ChatBox.css";

const ChatBox = ({ maCuocTroChuyen }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tinNhan, setTinNhan] = useState("");
  const [danhSachTin, setDanhSachTin] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [infoTinDang, setInfoTinDang] = useState({ tieuDe: "", gia: 0, anh: "", maTinDang: null });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const connectionRef = useRef(null);

  const getFullImageUrl = (url) => !url ? "/default-image.png" : (url.startsWith("http") ? url : `http://localhost:5133${url}`);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (!maCuocTroChuyen) return;
    fetch(`http://localhost:5133/api/chat/info/${maCuocTroChuyen}`)
      .then(res => res.json())
      .then(data => setInfoTinDang({ tieuDe: data.tieuDeTinDang, gia: data.giaTinDang, anh: data.anhDaiDienTinDang, maTinDang: data.maTinDang }))
      .catch(console.error);
  }, [maCuocTroChuyen]);

  useEffect(() => {
    if (!maCuocTroChuyen) return;
    fetch(`http://localhost:5133/api/chat/history/${maCuocTroChuyen}`)
      .then(res => res.json())
      .then(data => setDanhSachTin(
        data.map((msg) => {
          let timeStr = msg.thoiGianGui;
          if (!timeStr.endsWith("Z")) timeStr += "Z";
          return {
            ...msg,
            thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            daXem: msg.daXem || false,
          };
        })
      ))
      .catch(console.error);
  }, [maCuocTroChuyen]);

  useEffect(() => {
    if (!maCuocTroChuyen) return;
    const connect = async () => {
      try {
        const connection = await connectToChatHub(maCuocTroChuyen, (msg) => {
          let timeStr = msg.thoiGianGui;
          if (!timeStr.endsWith("Z")) timeStr += "Z";
          const newMsg = {
            ...msg,
            thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            daXem: msg.daXem || false,
          };
          setDanhSachTin((prev) => [...prev, newMsg]);
        });

        connection.on("CapNhatTinDang", (updatedPost) => {
          const maTinDangHT = maCuocTroChuyen.split("-").pop();
          if (updatedPost.MaTinDang?.toString() === maTinDangHT?.toString()) {
            setInfoTinDang({
              tieuDe: updatedPost.TieuDe,
              gia: updatedPost.Gia,
              anh: updatedPost.AnhDaiDien,
              maTinDang: updatedPost.MaTinDang
            });
          }
        });

        connection.on("DaXemTinNhan", (data) => {
          const MaTinNhanCuoi = data?.MaTinNhanCuoi;
          if (MaTinNhanCuoi) {
            setDanhSachTin((prev) => prev.map((msg) => (msg.maTinNhan === MaTinNhanCuoi ? { ...msg, daXem: true } : msg)));
          }
        });

        connectionRef.current = connection;
        setIsConnected(connection && connection.state === "Connected");
        connection.onclose(() => console.log("SignalR connection closed"));
        connection.onreconnected(() => console.log("SignalR reconnected"));
      } catch (err) {
        console.error("Lỗi kết nối SignalR:", err);
      }
    };
    connect();

    return () => {
      connectionRef.current?.stop();
      connectionRef.current = null;
    };
  }, [maCuocTroChuyen, user?.id]);

  useEffect(() => {
    scrollToBottom();
    const timer = setTimeout(() => {
      if (connectionRef.current && isConnected && user && maCuocTroChuyen) {
        connectionRef.current.invoke("DanhDauDaXem", maCuocTroChuyen, user.id).catch(console.error);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [danhSachTin, isConnected, maCuocTroChuyen, user]);

  const lastSeenMsgId = React.useMemo(() => {
    if (!user) return null;
    const myMessages = danhSachTin.filter((m) => m.maNguoiGui === user.id);
    if (!myMessages.length) return null;
    myMessages.sort((a, b) => new Date(a.thoiGianGui) - new Date(b.thoiGianGui));
    return [...myMessages].reverse().find((m) => m.daXem)?.maTinNhan || null;
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

  const handleImageClick = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:5133/api/TinDang/get-post/${infoTinDang.maTinDang}`);
      if (!res.ok) {
        if (res.status === 404) {
          Swal.fire({
            icon: 'error',
            title: 'Tin đăng không tồn tại',
            text: 'Người bán đã gỡ tin này sau khi giao dịch xong.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#d33',
            showClass: { popup: 'animate__animated animate__fadeInDown animate__faster' },
            hideClass: { popup: 'animate__animated animate__fadeOutUp animate__faster' }
          });
        } else {
          Swal.fire("Lỗi", "Lỗi khi kiểm tra tin đăng.", "error");
        }
        return;
      }
      const data = await res.json();
      navigate(`/tin-dang/${data.maTinDang}`);
    } catch (err) {
      Swal.fire("Lỗi", "Không thể kiểm tra trạng thái tin đăng.", "error");
      console.error(err);
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
            <p className="status">{infoTinDang.gia.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</p>
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
                <div className="message-content"><p>{msg.noiDung}</p></div>
                <div className="message-time">{msg.thoiGian}</div>
                {lastSeenMsgId === msg.maTinNhan && msg.maNguoiGui === user?.id && <div className="message-status">Đã xem</div>}
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
          >➔</button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
