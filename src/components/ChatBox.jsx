import React, { useEffect, useState, useRef, useContext } from "react";
import { connectToChatHub, sendMessage } from "../services/chatService";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "animate.css";
import "./ChatBox.css";
import axios from "axios";
import { FaImage, FaVideo } from "react-icons/fa";

const CLOUDINARY_UPLOAD_PRESET = "unimarket_upload";
const CLOUDINARY_CLOUD_NAME = "dskwbav6r";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

const ChatBox = ({ maCuocTroChuyen }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tinNhan, setTinNhan] = useState("");
  const [danhSachTin, setDanhSachTin] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [infoTinDang, setInfoTinDang] = useState({ tieuDe: "", gia: 0, anh: "", maTinDang: null });
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [imagePreviewList, setImagePreviewList] = useState([]);
  const [videoPreviewList, setVideoPreviewList] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const connectionRef = useRef(null);

  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png";
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: instant ? "auto" : "smooth" });
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

          const hiddenChats = JSON.parse(localStorage.getItem("hiddenChats")) || [];
          const isHidden = hiddenChats.includes(maCuocTroChuyen);
          const isOwnMessage = msg.maNguoiGui === user?.id;

          if (!isHidden || isOwnMessage) {
            setDanhSachTin((prev) => [...prev, newMsg]);
          }
        });

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

  // Đặt lại isFirstLoad khi chuyển sang chat mới
  useEffect(() => {
    setIsFirstLoad(true);
  }, [maCuocTroChuyen]);

  useEffect(() => {
    if (danhSachTin.length > 0) {
      if (isFirstLoad) {
        scrollToBottom(true); // Cuộn tức thì xuống đáy khi là lần tải đầu tiên
        setIsFirstLoad(false);
      } else {
        scrollToBottom(false); // Cuộn mượt mà khi có tin nhắn mới
      }
    }

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
    if (myMessages.length === 0) return null;
    const lastMessage = myMessages
      .sort((a, b) => new Date(b.thoiGianGui) - new Date(a.thoiGianGui))[0];
    return lastMessage.daXem ? lastMessage.maTinNhan : null;
  }, [danhSachTin, user]);

  const handleFileInputChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === "image") {
      setImagePreviewList((prev) => [...prev, ...files.filter(f => f.type.startsWith("image"))]);
    } else {
      setVideoPreviewList((prev) => [...prev, ...files.filter(f => f.type.startsWith("video"))]);
    }
    e.target.value = null;
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const { data } = await axios.post(CLOUDINARY_URL, formData);
      return data.secure_url;
    } catch (err) {
      Swal.fire("Lỗi", "Không thể upload file lên Cloudinary!", "error");
      return null;
    }
  };

  const handleSend = async () => {
    if (!tinNhan.trim() && imagePreviewList.length === 0 && videoPreviewList.length === 0) {
      Swal.fire("Lỗi", "Vui lòng nhập tin nhắn hoặc gửi ảnh/video", "error");
      return;
    }

    if (!connectionRef.current || connectionRef.current.state !== "Connected") {
      Swal.fire("Lỗi", "Kết nối SignalR không sẵn sàng!", "error");
      return;
    }

    try {
      if (tinNhan.trim()) {
        await sendMessage(maCuocTroChuyen, user.id, tinNhan.trim());
      }

      for (const file of imagePreviewList) {
        const url = await uploadToCloudinary(file);
        if (url) {
          await sendMessage(maCuocTroChuyen, user.id, url, "image");
        }
      }

      for (const file of videoPreviewList) {
        const url = await uploadToCloudinary(file);
        if (url) {
          await sendMessage(maCuocTroChuyen, user.id, url, "video");
        }
      }

      setTinNhan("");
      setImagePreviewList([]);
      setVideoPreviewList([]);
      inputRef.current?.focus();
    } catch (err) {
      Swal.fire("Lỗi", "Không thể gửi tin nhắn!", "error");
      console.error("Send error:", err);
    }
  };

  const handleImageClick = async () => {
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
        <div className="chatbox-seller-info" onClick={handleImageClick}>
          <div className="chatbox-seller-avatar">
            <img src={getFullImageUrl(infoTinDang.anh)} alt="Ảnh tin đăng" />
          </div>
          <div className="chatbox-seller-details">
            <h3>{infoTinDang.tieuDe}</h3>
            <p className="chatbox-status">
              {infoTinDang.gia.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
            </p>
          </div>
        </div>
      </div>

      <div className="chatbox-messages">
        {danhSachTin.length === 0 ? (
          <div className="chatbox-empty-chat">
            <div className="chatbox-empty-icon">💬</div>
            <p>Chưa có tin nhắn nào</p>
            <p>Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          danhSachTin.map((msg, idx) => (
            <div key={idx} className="message-wrapper">
              <div className={`message ${msg.maNguoiGui === user?.id ? "sent" : "received"}`}>
                <div className="message-content">
                  {msg.loaiTinNhan === "image" ? (
                    <img src={msg.noiDung} alt="img-chat" className="message-image" />
                  ) : msg.loaiTinNhan === "video" ? (
                    <video src={msg.noiDung} controls className="message-video" />
                  ) : (
                    <p>{msg.noiDung}</p>
                  )}
                </div>
                <div className="message-time">{formatTime(msg.thoiGian)}</div>
                {msg.maNguoiGui === user?.id && msg.maTinNhan === lastSeenMsgId && (
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
          <div className="chatbox-media-upload-group">
            <label className="chatbox-media-upload-label">
              <FaImage size={28} />
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => handleFileInputChange(e, "image")}
                accept="image/*"
                multiple
              />
            </label>
            <label className="chatbox-media-upload-label">
              <FaVideo size={28} />
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => handleFileInputChange(e, "video")}
                accept="video/*"
                multiple
              />
            </label>
          </div>
          <div className="input-field">
            <textarea
              ref={inputRef}
              value={tinNhan}
              onChange={(e) => setTinNhan(e.target.value)}
              placeholder="Nhập tin nhắn..."
            />
          </div>
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!(tinNhan.trim() || imagePreviewList.length || videoPreviewList.length)}
          >
            ➔
          </button>
        </div>
        <div className="chatbox-media-preview-list">
          {imagePreviewList.map((file, idx) => (
            <div key={idx} className="chatbox-media-thumb">
              <button className="chatbox-media-thumb-remove" onClick={() => setImagePreviewList(imagePreviewList.filter((_, i) => i !== idx))}>×</button>
              <img src={URL.createObjectURL(file)} alt={`preview-img-${idx}`} />
            </div>
          ))}
          {videoPreviewList.map((file, idx) => (
            <div key={idx} className="chatbox-media-thumb">
              <button className="chatbox-media-thumb-remove" onClick={() => setVideoPreviewList(videoPreviewList.filter((_, i) => i !== idx))}>×</button>
              <video src={URL.createObjectURL(file)} controls />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatBox;