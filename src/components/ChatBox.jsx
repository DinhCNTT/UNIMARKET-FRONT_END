import React, { useEffect, useState, useRef, useContext } from "react";
import { connectToChatHub, sendMessage } from "../services/chatService";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "animate.css";
import "./ChatBox.css";
import axios from "axios";
import { FaImage, FaVideo, FaTimes, FaEllipsisV, FaTrash, FaClock } from "react-icons/fa";

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
  const [modalImage, setModalImage] = useState(null);
  const [messageMenus, setMessageMenus] = useState({});
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

  const canRecallMessage = (messageTime) => {
    if (!messageTime) return false;
    const now = new Date();
    const msgTime = new Date(messageTime);
    const diffInMinutes = (now - msgTime) / (1000 * 60);
    return diffInMinutes <= 5;
  };

  const getRecallTimeRemaining = (messageTime) => {
    if (!messageTime) return 0;
    const now = new Date();
    const msgTime = new Date(messageTime);
    const diffInMinutes = (now - msgTime) / (1000 * 60);
    return Math.max(0, 5 - diffInMinutes);
  };

  const toggleMessageMenu = (messageId) => {
    setMessageMenus((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const closeAllMessageMenus = () => {
    setMessageMenus({});
  };

  const handleRecallTextMessage = async (maTinNhan, thoiGianGui) => {
    if (!canRecallMessage(thoiGianGui)) {
      Swal.fire({
        icon: "error",
        title: "Không thể thu hồi",
        text: "Chỉ có thể thu hồi tin nhắn trong vòng 5 phút sau khi gửi.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    const remainingTime = getRecallTimeRemaining(thoiGianGui);
    const remainingMinutes = Math.floor(remainingTime);
    const remainingSeconds = Math.floor((remainingTime - remainingMinutes) * 60);

    const result = await Swal.fire({
      title: "Thu hồi tin nhắn?",
      html: `
        <p>Bạn có chắc chắn muốn thu hồi tin nhắn này?</p>
        <p style="color: #ff6b6b; font-size: 14px;">
          <i class="fa fa-clock"></i> 
          Thời gian còn lại: ${remainingMinutes}:${remainingSeconds.toString().padStart(2, "0")}
        </p>
        <p style="color: #666; font-size: 12px;">Tin nhắn sẽ bị xóa vĩnh viễn khỏi cuộc trò chuyện.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Thu hồi",
      cancelButtonText: "Hủy",
      showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
      hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
    });

    if (result.isConfirmed) {
      try {
        if (connectionRef.current && connectionRef.current.state === "Connected") {
          await connectionRef.current.invoke("ThuHoiTinNhan", maTinNhan, user.id);
          Swal.fire({
            icon: "success",
            title: "Đã thu hồi",
            text: "Tin nhắn đã được thu hồi thành công.",
            timer: 2000,
            showConfirmButton: false,
            showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
            hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
          });
        } else {
          throw new Error("Kết nối SignalR không sẵn sàng");
        }
      } catch (error) {
        console.error("Recall error:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi thu hồi",
          text: error.message || "Không thể thu hồi tin nhắn. Vui lòng thử lại.",
          confirmButtonColor: "#d33",
        });
      }
    }

    closeAllMessageMenus();
  };

  const handleRecallMediaMessage = async (maTinNhan, thoiGianGui, loaiTinNhan) => {
    if (!canRecallMessage(thoiGianGui)) {
      Swal.fire({
        icon: "error",
        title: "Không thể thu hồi",
        text: "Chỉ có thể thu hồi tin nhắn trong vòng 5 phút sau khi gửi.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    const remainingTime = getRecallTimeRemaining(thoiGianGui);
    const remainingMinutes = Math.floor(remainingTime);
    const remainingSeconds = Math.floor((remainingTime - remainingMinutes) * 60);
    const mediaType = loaiTinNhan === "image" ? "ảnh" : "video";

    const result = await Swal.fire({
      title: `Thu hồi ${mediaType}?`,
      html: `
        <p>Bạn có chắc chắn muốn thu hồi ${mediaType} này?</p>
        <p style="color: #ff6b6b; font-size: 14px;">
          <i class="fa fa-clock"></i> 
          Thời gian còn lại: ${remainingMinutes}:${remainingSeconds.toString().padStart(2, "0")}
        </p>
        <p style="color: #666; font-size: 12px;">${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} sẽ bị xóa vĩnh viễn khỏi cuộc trò chuyện và Cloudinary.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Thu hồi",
      cancelButtonText: "Hủy",
      showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
      hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
    });

    if (result.isConfirmed) {
      try {
        if (connectionRef.current && connectionRef.current.state === "Connected") {
          console.log(`Invoking ThuHoiAnhVideo for message ${maTinNhan} by user ${user.id}`);
          await connectionRef.current.invoke("ThuHoiAnhVideo", maTinNhan, user.id);
          Swal.fire({
            icon: "success",
            title: "Đã thu hồi",
            text: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} đã được thu hồi thành công.`,
            timer: 2000,
            showConfirmButton: false,
            showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
            hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
          });
        } else {
          throw new Error("Kết nối SignalR không sẵn sàng");
        }
      } catch (error) {
        console.error("Media recall error:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi thu hồi",
          text: error.message || `Không thể thu hồi ${mediaType}. Vui lòng thử lại.`,
          confirmButtonColor: "#d33",
        });
      }
    }

    closeAllMessageMenus();
  };

  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
    closeAllMessageMenus();
  };

  const closeImageModal = () => {
    setModalImage(null);
  };

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (modalImage) {
          closeImageModal();
        } else {
          closeAllMessageMenus();
        }
      }
    };

    const handleClickOutside = (event) => {
      if (!event.target.closest(".message-menu-container")) {
        closeAllMessageMenus();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [modalImage]);

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
          maTinDang: data.maTinDang,
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchChatInfo();
  }, [maCuocTroChuyen]);

  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return;
    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5133/api/chat/history/${maCuocTroChuyen}?userId=${user.id}`);
        if (!response.ok) throw new Error("Lấy lịch sử chat lỗi");
        const data = await response.json();
        setDanhSachTin(
          data.map((msg) => {
            let timeStr = msg.thoiGianGui;
            if (!timeStr.endsWith("Z")) timeStr += "Z";
            return {
              ...msg,
              thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
              thoiGianGui: timeStr,
              daXem: msg.daXem || false,
            };
          })
        );
      } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error);
      }
    };
    fetchHistory();
  }, [maCuocTroChuyen, user?.id]);

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
            thoiGianGui: timeStr,
            daXem: msg.daXem || false,
          };

          const hiddenChats = JSON.parse(localStorage.getItem("hiddenChats")) || [];
          const isHidden = hiddenChats.includes(maCuocTroChuyen);
          const isOwnMessage = msg.maNguoiGui === user?.id;

          if (!isHidden || isOwnMessage) {
            setDanhSachTin((prev) => [...prev, newMsg]);
          }
        });

        connection.on("TinNhanDaThuHoi", (data) => {
          const { maTinNhan, loaiTinNhan } = data;
          setDanhSachTin((prev) => prev.filter((msg) => msg.maTinNhan !== maTinNhan));
          closeAllMessageMenus();
          const messageType = loaiTinNhan === "text" ? "tin nhắn" : loaiTinNhan === "image" ? "ảnh" : "video";
          console.log(`Recalled ${messageType} with ID ${maTinNhan}`);
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
                const isMatch =
                  msg.maTinNhan == MaTinNhanCuoi ||
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

  useEffect(() => {
    setIsFirstLoad(true);
  }, [maCuocTroChuyen]);

  useEffect(() => {
    if (danhSachTin.length > 0) {
      if (isFirstLoad) {
        scrollToBottom(true);
        setIsFirstLoad(false);
      } else {
        scrollToBottom(false);
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
    const lastMessage = myMessages.sort((a, b) => new Date(b.thoiGianGui) - new Date(a.thoiGianGui))[0];
    return lastMessage.daXem ? lastMessage.maTinNhan : null;
  }, [danhSachTin, user]);

  const handleFileInputChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === "image") {
      setImagePreviewList((prev) => [...prev, ...files.filter((f) => f.type.startsWith("image"))]);
    } else {
      setVideoPreviewList((prev) => [...prev, ...files.filter((f) => f.type.startsWith("video"))]);
    }
    e.target.value = null;
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "doan-chat");
    try {
      const { data } = await axios.post(CLOUDINARY_URL, formData);
      console.log(`Uploaded media to Cloudinary: ${data.secure_url}, public_id: ${data.public_id}`);
      return data.secure_url;
    } catch (err) {
      console.error("Upload error:", err);
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
            icon: "error",
            title: "Tin đăng không tồn tại",
            text: "Người bán đã gỡ tin này sau khi giao dịch xong.",
            confirmButtonText: "OK",
            confirmButtonColor: "#d33",
            showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
            hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
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

  // Thêm hàm xóa phía tôi
  const handleDeleteForMe = async (maTinNhan) => {
    const result = await Swal.fire({
      title: "Xóa tin nhắn phía bạn?",
      text: "Bạn có chắc chắn muốn xóa tin nhắn này khỏi phía bạn? Tin nhắn sẽ vẫn hiển thị với người còn lại.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
      hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(
        `http://localhost:5133/api/chat/delete-for-me/${maTinNhan}?userId=${user.id}`
      );
      setDanhSachTin((prev) => prev.filter((msg) => msg.maTinNhan !== maTinNhan));
      closeAllMessageMenus();
    } catch (err) {
      Swal.fire("Lỗi", "Không thể xóa tin nhắn phía bạn!", "error");
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
                    <img
                      src={msg.noiDung}
                      alt="img-chat"
                      className="message-image clickable-media"
                      onClick={() => openImageModal(msg.noiDung)}
                    />
                  ) : msg.loaiTinNhan === "video" ? (
                    <video src={msg.noiDung} controls className="message-video" />
                  ) : (
                    <p>{msg.noiDung}</p>
                  )}
                </div>
                <div className="message-info">
                  <div className="message-time">{formatTime(msg.thoiGian)}</div>
                  {msg.maNguoiGui === user?.id && msg.maTinNhan === lastSeenMsgId && (
                    <div className="message-status">Đã xem</div>
                  )}
                </div>

                {/* Nếu là tin nhắn của mình (sent) thì menu ở bên phải */}
                {msg.maNguoiGui === user?.id && (
                  <div className="message-menu-container right">
                    <button
                      className="message-menu-trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMessageMenu(msg.maTinNhan);
                      }}
                    >
                      <FaEllipsisV size={12} />
                    </button>
                    {messageMenus[msg.maTinNhan] && (
                      <div className="message-menu">
                        {canRecallMessage(msg.thoiGianGui) && (
                          <button
                            className="message-menu-item recall-available"
                            onClick={() => {
                              if (msg.loaiTinNhan === "image" || msg.loaiTinNhan === "video") {
                                handleRecallMediaMessage(msg.maTinNhan, msg.thoiGianGui, msg.loaiTinNhan);
                              } else {
                                handleRecallTextMessage(msg.maTinNhan, msg.thoiGianGui);
                              }
                            }}
                          >
                            <FaTrash size={12} />
                            <span>Thu hồi</span>
                            <div className="recall-timer">
                              <FaClock size={10} />
                              {Math.floor(getRecallTimeRemaining(msg.thoiGianGui))}:
                              {Math.floor((getRecallTimeRemaining(msg.thoiGianGui) % 1) * 60)
                                .toString()
                                .padStart(2, "0")}
                            </div>
                          </button>
                        )}
                        {!canRecallMessage(msg.thoiGianGui) && (
                          <button className="message-menu-item recall-disabled" disabled>
                            <FaTrash size={12} />
                            <span>Hết hạn thu hồi</span>
                          </button>
                        )}
                        <button
                          className="message-menu-item"
                          onClick={() => handleDeleteForMe(msg.maTinNhan)}
                        >
                          <FaTrash size={12} />
                          <span>Xóa phía tôi</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {/* Nếu là tin nhắn nhận (received) thì menu ở bên trái, chỉ có nút xóa phía tôi */}
                {msg.maNguoiGui !== user?.id && (
                  <div className="message-menu-container left">
                    <button
                      className="message-menu-trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMessageMenu(msg.maTinNhan);
                      }}
                    >
                      <FaEllipsisV size={12} />
                    </button>
                    {messageMenus[msg.maTinNhan] && (
                      <div className="message-menu">
                        <button
                          className="message-menu-item"
                          onClick={() => handleDeleteForMe(msg.maTinNhan)}
                        >
                          <FaTrash size={12} />
                          <span>Xóa phía tôi</span>
                        </button>
                      </div>
                    )}
                  </div>
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
                style={{ display: "none" }}
                onChange={(e) => handleFileInputChange(e, "image")}
                accept="image/*"
                multiple
              />
            </label>
            <label className="chatbox-media-upload-label">
              <FaVideo size={28} />
              <input
                type="file"
                style={{ display: "none" }}
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
              <button
                className="chatbox-media-thumb-remove"
                onClick={() => setImagePreviewList(imagePreviewList.filter((_, i) => i !== idx))}
              >
                ×
              </button>
              <img src={URL.createObjectURL(file)} alt={`preview-img-${idx}`} />
            </div>
          ))}
          {videoPreviewList.map((file, idx) => (
            <div key={idx} className="chatbox-media-thumb">
              <button
                className="chatbox-media-thumb-remove"
                onClick={() => setVideoPreviewList(videoPreviewList.filter((_, i) => i !== idx))}
              >
                ×
              </button>
              <video src={URL.createObjectURL(file)} controls />
            </div>
          ))}
        </div>
      </div>

      {modalImage && (
        <div className="media-modal-overlay" onClick={closeImageModal}>
          <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="media-modal-close" onClick={closeImageModal}>
              <FaTimes size={24} />
            </button>
            <img src={modalImage} alt="Phóng to ảnh" className="media-modal-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;