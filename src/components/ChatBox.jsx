// ChatBox.jsx - Phiên bản hoàn chỉnh với "Đã xem" realtime + SweetAlert + Auto scroll cải tiến
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
  const [isFirstLoad, setIsFirstLoad] = useState(true); // Thêm state để track lần load đầu
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const connectionRef = useRef(null);

  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png";
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  // Sửa đổi hàm scrollToBottom để có thể chọn instant hoặc smooth
  const scrollToBottom = (instant = false) => {
    if (instant) {
      // Cuộn ngay lập tức không có animation
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else {
      // Cuộn mượt mà
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const formatTime = (time) => {
    return time || new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

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
          maTinDang: data.maTinDang 
        });
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
          let timeStr = msg.thoiGianGui;
          if (!timeStr.endsWith("Z")) timeStr += "Z";

          const newMsg = {
            ...msg,
            thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            daXem: msg.daXem || false,
          };

          setDanhSachTin((prev) => [...prev, newMsg]);
        });

        // Cập nhật tin đăng realtime
        connection.on("CapNhatTinDang", (updatedPost) => {
          const maTinDangHT = maCuocTroChuyen.split("-").pop();
          if (updatedPost.MaTinDang?.toString() === maTinDangHT?.toString()) {
            setInfoTinDang((prev) => ({
              ...prev,
              tieuDe: updatedPost.TieuDe || updatedPost.tieuDe || prev.tieuDe,
              gia: updatedPost.Gia || updatedPost.gia || prev.gia,
              anh: updatedPost.AnhDaiDien || updatedPost.anhDaiDien || prev.anh,
              maTinDang: updatedPost.MaTinDang || prev.maTinDang,
            }));
          }
        });

        // Xử lý "Đã xem" realtime
        connection.on("DaXemTinNhan", (data) => {
          const MaTinNhanCuoi = data?.MaTinNhanCuoi || data?.maTinNhanCuoi;
          
          if (MaTinNhanCuoi) {
            setDanhSachTin((prev) => {
              const updated = prev.map((msg) => {
                const isMatch = msg.maTinNhan == MaTinNhanCuoi || 
                               msg.maTinNhan === MaTinNhanCuoi ||
                               msg.maTinNhan.toString() === MaTinNhanCuoi.toString();
                
                return isMatch ? { ...msg, daXem: true } : msg;
              });
              return updated;
            });
          }
        });

        connectionRef.current = connection;
        setIsConnected(connection && connection.state === "Connected");

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

  // Sửa đổi useEffect để xử lý scroll khác nhau cho lần đầu load và tin nhắn mới
  useEffect(() => {
    if (danhSachTin.length > 0) {
      if (isFirstLoad) {
        // Lần đầu load: cuộn ngay lập tức đến cuối mà không có animation
        setTimeout(() => {
          scrollToBottom(true); // instant = true
          setIsFirstLoad(false);
        }, 100); // Delay ngắn để đảm bảo DOM đã render
      } else {
        // Tin nhắn mới: cuộn mượt mà
        scrollToBottom(false); // instant = false
      }
    }

    // Đánh dấu đã xem
    const timer = setTimeout(() => {
      if (connectionRef.current && isConnected && user && maCuocTroChuyen) {
        connectionRef.current.invoke("DanhDauDaXem", maCuocTroChuyen, user.id).catch(console.error);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [danhSachTin, isConnected, maCuocTroChuyen, user, isFirstLoad]);

  // Reset isFirstLoad khi chuyển cuộc trò chuyện
  useEffect(() => {
    setIsFirstLoad(true);
  }, [maCuocTroChuyen]);

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