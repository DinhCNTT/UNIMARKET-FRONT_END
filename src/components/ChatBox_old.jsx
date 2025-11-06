import React, { useEffect, useState, useRef, useContext } from "react";
import { connectToChatHub, sendMessage } from "../services/chatService";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "animate.css";
import "./ChatBox.css";
// ✅ GIỮ NGUYÊN: Dùng cho Cloudinary
import axios from "axios";
// ✅ THÊM MỚI: Dùng cho backend (nhớ chỉnh đường dẫn)
import api from "../services/api";

import {
  FaImage,
  FaVideo,
  FaTimes,
  FaEllipsisV,
  FaTrash,
  FaClock,
  FaBan,
  FaUnlock,
} from "react-icons/fa";
import { MessageSquareText } from "lucide-react";

const CLOUDINARY_UPLOAD_PRESET = "unimarket_upload";
const CLOUDINARY_CLOUD_NAME = "dcwe8drcu";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

const ChatBox = ({ maCuocTroChuyen }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // ==================== STATE ====================
  const [tinNhan, setTinNhan] = useState("");
  const [danhSachTin, setDanhSachTin] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [infoTinDang, setInfoTinDang] = useState({
    tieuDe: "",
    gia: 0,
    anh: "",
    maTinDang: null,
    avatarChuSanPham: "",
    tenChuSanPham: "",
    isOnline: false,
    lastOnlineTime: null,
    formattedLastSeen: null,
    maChuSanPham: null,
    isPostDeleted: false,
  });
  const [infoNguoiConLai, setInfoNguoiConLai] = useState({
    id: "",
    avatar: "",
    ten: "",
    isOnline: false,
    lastOnlineTime: null,
    formattedLastSeen: null,
  });
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [imagePreviewList, setImagePreviewList] = useState([]);
  const [videoPreviewList, setVideoPreviewList] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const [messageMenus, setMessageMenus] = useState({});
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [maNguoiConLai, setMaNguoiConLai] = useState(null);
  const [, forceUpdate] = useState(0);

  // ==================== REFS ====================
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const connectionRef = useRef(null);

  // ==================== COMPUTED VALUES ====================
  const isChuSanPham =
    infoTinDang && user && user.id === infoTinDang.maChuSanPham;
  const displayAvatar = isChuSanPham
    ? infoNguoiConLai.avatar
    : infoTinDang.avatarChuSanPham;
  const displayTen = isChuSanPham
    ? infoNguoiConLai.ten
    : infoTinDang.tenChuSanPham;
  const displayIsOnline = isChuSanPham
    ? infoNguoiConLai.isOnline
    : infoTinDang.isOnline;
  const displayLastOnline = isChuSanPham
    ? infoNguoiConLai.lastOnlineTime
    : infoTinDang.lastOnlineTime;
  const shouldShowStatus = !!(isChuSanPham
    ? infoNguoiConLai.id && infoNguoiConLai.ten
    : infoTinDang.maChuSanPham && infoTinDang.tenChuSanPham);

  // ==================== HELPER FUNCTIONS ====================

  // ✅ ĐÃ SỬA: Dùng api.get và .data
  const fetchUserStatus = async (userId) => {
    if (!userId) return null;
    try {
      const response = await api.get(`/User/status/${userId}`);
      const data = response.data;
      if (!data) return null;

      return {
        isOnline: data.isOnline,
        lastActive: data.lastActive,
        formattedLastSeen: data.formattedLastSeen,
      };
    } catch (error) {
      console.error("Error fetching user status:", error);
      return null;
    }
  };

  const getLastOnlineText = () => {
    if (!shouldShowStatus) return "";
    if (displayIsOnline) return "Đang hoạt động";
    if (!displayLastOnline) return "";

    const displayFormattedStatus = isChuSanPham
      ? infoNguoiConLai.formattedLastSeen
      : infoTinDang.formattedLastSeen;

    if (displayFormattedStatus) {
      if (displayFormattedStatus.toLowerCase().includes("vừa mới")) {
        return "Mới hoạt động gần đây";
      }
      const regex = /^(\d+)\s*(phút|giờ|ngày) trước$/;
      const match = displayFormattedStatus.match(regex);
      if (match) {
        return `Hoạt động từ ${match[1]} ${match[2]} trước`;
      }
      return displayFormattedStatus;
    }

    let last;
    try {
      if (typeof displayLastOnline === "string") {
        let normalized = displayLastOnline.trim();
        if (!normalized.includes("T")) normalized = normalized.replace(" ", "T");
        if (!normalized.endsWith("Z")) normalized += "Z";
        last = new Date(normalized);
      } else {
        last = new Date(displayLastOnline);
      }
      if (isNaN(last.getTime())) throw new Error();
    } catch {
      return "";
    }

    const now = new Date();
    const diffMs = now - last;
    if (diffMs < 0) return "";

    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Mới hoạt động gần đây";
    if (diffMin < 60) return `Hoạt động từ ${diffMin} phút trước`;

    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hoạt động từ ${diffH} giờ trước`;

    const diffD = Math.floor(diffH / 24);
    return `Hoạt động từ ${diffD} ngày trước`;
  };

  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png";
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: instant ? "auto" : "smooth",
      });
    }
  };

  const formatTime = (time) => {
    return (
      time ||
      new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
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

  // ==================== EVENT HANDLERS ====================

  // ✅ ĐÃ SỬA: Dùng api.post
  const handleBlockUser = async () => {
    const result = await Swal.fire({
      title: "Chặn người dùng?",
      text: "Người này sẽ không thể gửi tin nhắn cho bạn nữa.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Chặn",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await api.post("/chat/block-user", {
          BlockerId: user.id,
          BlockedId: maNguoiConLai,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Không thể chặn người dùng. Vui lòng thử lại.",
          confirmButtonColor: "#d33",
        });
      }
    }
  };

  // ✅ ĐÃ SỬA: Dùng api.post
  const handleUnblockUser = async () => {
    const result = await Swal.fire({
      title: "Gỡ chặn người dùng?",
      text: "Bạn sẽ có thể nhận tin nhắn từ người này.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Gỡ chặn",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await api.post("/chat/unblock-user", {
          BlockerId: user.id,
          BlockedId: maNguoiConLai,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Không thể gỡ chặn người dùng. Vui lòng thử lại.",
          confirmButtonColor: "#d33",
        });
      }
    }
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
          Thời gian còn lại: ${remainingMinutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}
        </p>
        <p style="color: #666; font-size: 12px;">Tin nhắn sẽ bị xóa vĩnh viễn khỏi cuộc trò chuyện.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Thu hồi",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        if (
          connectionRef.current &&
          connectionRef.current.state === "Connected"
        ) {
          await connectionRef.current.invoke(
            "ThuHoiTinNhan",
            maTinNhan,
            user.id
          );
          Swal.fire({
            icon: "success",
            title: "Đã thu hồi",
            text: "Tin nhắn đã được thu hồi thành công.",
            timer: 2000,
            showConfirmButton: false,
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

  const handleRecallMediaMessage = async (
    maTinNhan,
    thoiGianGui,
    loaiTinNhan
  ) => {
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
          Thời gian còn lại: ${remainingMinutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}
        </p>
        <p style="color: #666; font-size: 12px;">${
          mediaType.charAt(0).toUpperCase() + mediaType.slice(1)
        } sẽ bị xóa vĩnh viễn khỏi cuộc trò chuyện và Cloudinary.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Thu hồi",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        if (
          connectionRef.current &&
          connectionRef.current.state === "Connected"
        ) {
          await connectionRef.current.invoke(
            "ThuHoiAnhVideo",
            maTinNhan,
            user.id
          );
          Swal.fire({
            icon: "success",
            title: "Đã thu hồi",
            text: `${
              mediaType.charAt(0).toUpperCase() + mediaType.slice(1)
            } đã được thu hồi thành công.`,
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          throw new Error("Kết nối SignalR không sẵn sàng");
        }
      } catch (error) {
        console.error("Media recall error:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi thu hồi",
          text:
            error.message ||
            `Không thể thu hồi ${mediaType}. Vui lòng thử lại.`,
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

  const handleFileInputChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === "image") {
      setImagePreviewList((prev) => [
        ...prev,
        ...files.filter((f) => f.type.startsWith("image")),
      ]);
    } else {
      setVideoPreviewList((prev) => [
        ...prev,
        ...files.filter((f) => f.type.startsWith("video")),
      ]);
    }
    e.target.value = null;
  };

  // ✅ KHÔNG SỬA: Hàm này dùng axios gốc để gọi Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "doan-chat");
    try {
      const { data } = await axios.post(CLOUDINARY_URL, formData);
      console.log(
        `Uploaded media to Cloudinary: ${data.secure_url}, public_id: ${data.public_id}`
      );
      return data.secure_url;
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire("Lỗi", "Không thể upload file lên Cloudinary!", "error");
      return null;
    }
  };

  const handleSend = async () => {
    if (
      !tinNhan.trim() &&
      imagePreviewList.length === 0 &&
      videoPreviewList.length === 0
    ) {
      Swal.fire("Lỗi", "Vui lòng nhập tin nhắn hoặc gửi ảnh/video", "error");
      return;
    }

    if (isBlockedByOther || isBlockedByMe) {
      Swal.fire(
        "Lỗi",
        "Không thể gửi tin nhắn vì một trong hai người đã chặn người kia.",
        "error"
      );
      return;
    }

    if (
      !connectionRef.current ||
      connectionRef.current.state !== "Connected"
    ) {
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
      Swal.fire("Lỗi", err.message || "Không thể gửi tin nhắn!", "error");
      console.error("Send error:", err);
    }
  };

  // ✅ ĐÃ SỬA: Dùng api.get và xử lý lỗi 404 trong catch
  const handleImageClick = async () => {
    if (infoTinDang.isPostDeleted) {
      Swal.fire({
        icon: "info",
        title: "Tin đăng đã bị xóa",
        text: "Người bán đã gỡ tin này. Cuộc trò chuyện vẫn tiếp tục.",
        confirmButtonText: "OK",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      const res = await api.get(`/TinDang/get-post/${infoTinDang.maTinDang}`);
      const data = res.data;
      if (!data) {
        Swal.fire("Lỗi", "Không nhận được dữ liệu tin đăng.", "error");
        return;
      }
      navigate(`/tin-dang/${data.maTinDang}`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        Swal.fire({
          icon: "error",
          title: "Tin đăng không tồn tại",
          text: "Người bán đã gỡ tin này sau khi giao dịch xong.",
          confirmButtonText: "OK",
          confirmButtonColor: "#d33",
        });
      } else {
        Swal.fire("Lỗi", "Không thể kiểm tra trạng thái tin đăng.", "error");
        console.error(err);
      }
    }
  };

  // ==================== EFFECTS ====================

  // Effect: Lắng nghe sự kiện block/unblock realtime
  useEffect(() => {
    if (!connectionRef.current || !user?.id) return;

    const connection = connectionRef.current;

    connection.on("UserBlocked", (data) => {
      const { blockedUserId, actionType } = data;

      console.log(
        `Received UserBlocked event: ${actionType}, blockedUserId: ${blockedUserId}`
      );

      if (actionType === "block" && blockedUserId === maNguoiConLai) {
        setIsBlockedByMe(true);
        closeAllMessageMenus();

        Swal.fire({
          icon: "success",
          title: "Đã chặn",
          text: "Bạn đã chặn người dùng này.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else if (actionType === "unblock" && blockedUserId === maNguoiConLai) {
        setIsBlockedByMe(false);

        Swal.fire({
          icon: "success",
          title: "Đã gỡ chặn",
          text: "Bạn đã gỡ chặn người dùng này.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else if (actionType === "blocked_by" && blockedUserId === user.id) {
        setIsBlockedByOther(true);
        closeAllMessageMenus();

        Swal.fire({
          icon: "warning",
          title: "Bạn đã bị chặn",
          text: "Bạn không thể gửi tin nhắn cho người này nữa.",
          confirmButtonColor: "#d33",
        });
      } else if (actionType === "unblocked_by" && blockedUserId === user.id) {
        setIsBlockedByOther(false);

        Swal.fire({
          icon: "info",
          title: "Đã được gỡ chặn",
          text: "Bạn có thể gửi tin nhắn cho người này.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    });

    connection.on("ChatStatusChanged", (data) => {
      const { chatId, isBlocked, blockedByMe } = data;

      if (chatId === maCuocTroChuyen) {
        console.log(
          `Chat ${chatId} status changed: isBlocked=${isBlocked}, blockedByMe=${blockedByMe}`
        );

        if (isBlocked) {
          if (blockedByMe) {
            setIsBlockedByMe(true);
            setIsBlockedByOther(false);
          } else {
            setIsBlockedByMe(false);
            setIsBlockedByOther(true);
          }
        } else {
          setIsBlockedByMe(false);
          setIsBlockedByOther(false);
        }
      }
    });

    return () => {
      if (connection) {
        connection.off("UserBlocked");
        connection.off("ChatStatusChanged");
      }
    };
  }, [
    connectionRef.current,
    user?.id,
    maNguoiConLai,
    maCuocTroChuyen,
  ]);

  // Effect: Xử lý phím ESC và click outside
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
      if (
        !event.target.closest(".message-menu-container") &&
        !event.target.closest(".chatbox-header-menu")
      ) {
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

  // Effect: Fetch thông tin cuộc trò chuyện
  useEffect(() => {
    if (!maCuocTroChuyen) return;

    const fetchChatInfo = async () => {
      try {
        const res = await api.get(`/chat/info/${maCuocTroChuyen}`);
        if (!res.data) throw new Error("Lỗi lấy thông tin cuộc trò chuyện");
        const data = res.data;

        setInfoTinDang({
          tieuDe: data.tieuDeTinDang,
          gia: data.giaTinDang,
          anh: data.anhDaiDienTinDang,
          maTinDang: data.maTinDang,
          avatarChuSanPham: data.avatarChuSanPham || "",
          tenChuSanPham: data.tenChuSanPham || "",
          isOnline: data.trangThaiChuSanPham?.isOnline || false,
          lastOnlineTime: data.trangThaiChuSanPham?.lastActive || null,
          formattedLastSeen:
            data.trangThaiChuSanPham?.formattedLastSeen || null,
          maChuSanPham: data.maChuSanPham || null,
          isPostDeleted: data.isPostDeleted || false,
        });

        const resParticipants = await api.get(`/chat/user/${user.id}`);
        const chats = resParticipants.data;
        const currentChat = chats.find(
          (c) => c.maCuocTroChuyen === maCuocTroChuyen
        );

        if (currentChat) {
          const otherUserId = currentChat.maNguoiConLai;
          setMaNguoiConLai(otherUserId);

          setInfoNguoiConLai({
            id: otherUserId,
            avatar: data.avatarNguoiConLai || "",
            ten: data.tenNguoiConLai || "",
            isOnline: data.trangThaiNguoiConLai?.isOnline || false,
            lastOnlineTime: data.trangThaiNguoiConLai?.lastActive || null,
            formattedLastSeen:
              data.trangThaiNguoiConLai?.formattedLastSeen || null,
          });

          const resBlockMe = await api.get(
            `/chat/check-block/${user.id}/${otherUserId}`
          );
          const dataBlockMe = resBlockMe.data;
          setIsBlockedByMe(dataBlockMe.isBlocked || dataBlockMe.IsBlocked);

          const resBlockOther = await api.get(
            `/chat/check-block/${otherUserId}/${user.id}`
          );
          const dataBlockOther = resBlockOther.data;
          setIsBlockedByOther(
            dataBlockOther.isBlocked || dataBlockOther.IsBlocked
          );
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin cuộc trò chuyện:", error);
      }
    };

    fetchChatInfo();
  }, [maCuocTroChuyen, user.id]);

  // Effect: Fetch lịch sử chat
  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return;

    const fetchHistory = async () => {
      try {
        const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
          params: { userId: user.id },
        });
        const data = response.data;
        if (!data) throw new Error("Lỗi lấy lịch sử chat");

        setDanhSachTin(
          data.map((msg) => {
            let timeStr = msg.thoiGianGui;
            if (!timeStr.endsWith("Z")) timeStr += "Z";
            return {
              ...msg,
              thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              thoiGianGui: timeStr,
              daXem: msg.daXem || false,
            };
          })
        );
      } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error);
        Swal.fire("Lỗi", error.message || "Không thể lấy lịch sử chat", "error");
      }
    };

    fetchHistory();
  }, [maCuocTroChuyen, user?.id]);

  // Effect: Debug danh sách tin
  useEffect(() => {
    console.log("Danh sách tin hiện tại:", danhSachTin);
  }, [danhSachTin]);

  // Effect: Làm mới trạng thái người dùng định kỳ (30 giây)
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const refreshStatus = async () => {
      try {
        if (infoNguoiConLai.id) {
          const status = await fetchUserStatus(infoNguoiConLai.id);
          if (status) {
            setInfoNguoiConLai((prev) => ({
              ...prev,
              isOnline: status.isOnline,
              lastOnlineTime: status.lastActive,
              formattedLastSeen: status.formattedLastSeen,
            }));
          }
        }

        if (infoTinDang.maChuSanPham) {
          const status = await fetchUserStatus(infoTinDang.maChuSanPham);
          if (status) {
            setInfoTinDang((prev) => ({
              ...prev,
              isOnline: status.isOnline,
              lastOnlineTime: status.lastActive,
              formattedLastSeen: status.formattedLastSeen,
            }));
          }
        }
      } catch (error) {
        console.error("Error refreshing user status:", error);
      }
    };

    refreshStatus();

    const statusInterval = setInterval(refreshStatus, 30000);

    return () => clearInterval(statusInterval);
  }, [
    isConnected,
    user?.id,
    infoNguoiConLai.id,
    infoTinDang.maChuSanPham,
  ]);

  // Effect: Cập nhật văn bản trạng thái mỗi giây khi offline
  useEffect(() => {
    if (!shouldShowStatus || displayIsOnline || !displayLastOnline) return;

    forceUpdate((v) => v + 1);

    const updateInterval = setInterval(() => {
      forceUpdate((v) => v + 1);
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [shouldShowStatus, displayIsOnline, displayLastOnline]);

  // Effect: Kết nối SignalR và đăng ký events
  useEffect(() => {
    if (!maCuocTroChuyen) return;

    const connect = async () => {
      try {
        const connection = await connectToChatHub(maCuocTroChuyen, (msg) => {
          let timeStr = msg.thoiGianGui;
          if (!timeStr.endsWith("Z")) timeStr += "Z";
          const newMsg = {
            ...msg,
            thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            thoiGianGui: timeStr,
            daXem: msg.daXem || false,
          };
          const hiddenChats =
            JSON.parse(localStorage.getItem("hiddenChats")) || [];
          const isHidden = hiddenChats.includes(maCuocTroChuyen);
          const isOwnMessage = msg.maNguoiGui === user?.id;
          if (!isHidden || isOwnMessage) {
            setDanhSachTin((prev) => [...prev, newMsg]);
          }
        });

        // Event: UserStatusChanged
        connection.on("UserStatusChanged", (data) => {
          try {
            const userId = data.userId || data.userid || data.UserId;
            const isOnline = data.isOnline ?? data.IsOnline ?? false;
            const lastActive =
              data.lastSeen || data.lastActive || data.LastActive || null;
            const formattedLastSeen = data.formattedLastSeen || null;

            setInfoNguoiConLai((prev) => {
              if (prev.id === userId) {
                return {
                  ...prev,
                  isOnline,
                  lastOnlineTime: isOnline ? null : lastActive,
                  formattedLastSeen: formattedLastSeen,
                };
              }
              return prev;
            });

            setInfoTinDang((prev) => {
              if (prev.maChuSanPham === userId) {
                return {
                  ...prev,
                  isOnline,
                  lastOnlineTime: isOnline ? null : lastActive,
                  formattedLastSeen: formattedLastSeen,
                };
              }
              return prev;
            });
          } catch (err) {
            console.error("Lỗi xử lý UserStatusChanged:", err);
          }
        });

        // Event: TinNhanDaThuHoi
        connection.on("TinNhanDaThuHoi", (data) => {
          const { maTinNhan } = data;

          setDanhSachTin((prev) =>
            prev.map((msg) =>
              msg.maTinNhan === maTinNhan
                ? { ...msg, isRecalled: true }
                : msg
            )
          );

          closeAllMessageMenus();
          console.log(`Message ${maTinNhan} marked as recalled`);
        });

        // Event: CapNhatTinDang
        connection.on("CapNhatTinDang", (updatedPost) => {
          const maTinDangHT = maCuocTroChuyen.split("-").pop();
          if (
            updatedPost.MaTinDang?.toString() === maTinDangHT?.toString()
          ) {
            setInfoTinDang((prev) => ({
              ...prev,
              tieuDe:
                updatedPost.TieuDe || updatedPost.tieuDe || prev.tieuDe,
              gia: updatedPost.Gia || updatedPost.gia || prev.gia,
              anh:
                updatedPost.AnhDaiDien ||
                updatedPost.anhDaiDien ||
                prev.anh,
              maTinDang: updatedPost.MaTinDang || prev.maTinDang,
              isPostDeleted: updatedPost.IsDeleted || false,
            }));
          }
        });

        // Event: DaXemTinNhan
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

  // Effect: Reset isFirstLoad khi đổi cuộc trò chuyện
  useEffect(() => {
    setIsFirstLoad(true);
  }, [maCuocTroChuyen]);

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

    const timer = setTimeout(() => {
      if (connectionRef.current && isConnected && user && maCuocTroChuyen) {
        connectionRef.current
          .invoke("DanhDauDaXem", maCuocTroChuyen, user.id)
          .catch(console.error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [danhSachTin, isConnected, maCuocTroChuyen, user]);

  // ==================== COMPUTED - LAST SEEN MESSAGE ====================
  const lastSeenMsgId = React.useMemo(() => {
    if (!user) return null;
    const myMessages = danhSachTin.filter((m) => m.maNguoiGui === user.id);
    if (myMessages.length === 0) return null;
    const lastMessage = myMessages.sort(
      (a, b) => new Date(b.thoiGianGui) - new Date(a.thoiGianGui)
    )[0];
    return lastMessage.daXem ? lastMessage.maTinNhan : null;
  }, [danhSachTin, user]);

  // ==================== RENDER ====================
  return (
    <div className="chatbox-container">
      {/* ==================== HEADER ==================== */}
      <div className="chatbox-header">
        <div className="chatbox-seller-frame">
          <div className="chatbox-avatar-status-group">
            <div className="chatbox-avatar-wrapper">
              <img
                src={displayAvatar || "/src/assets/default-avatar.png"}
                alt="avatar"
                className="chatbox-seller-avatar"
              />
              {shouldShowStatus && (
                <span
                  className={
                    displayIsOnline
                      ? "chatbox-status-dot online"
                      : "chatbox-status-dot offline"
                  }
                ></span>
              )}
            </div>
            <div className="chatbox-seller-meta">
              <span className="chatbox-seller-name">
                {displayTen || "Chủ sản phẩm"}
              </span>
              {shouldShowStatus && getLastOnlineText() && (
                <span className="chatbox-last-online">
                  {getLastOnlineText()}
                </span>
              )}
            </div>
          </div>
          <div className="chatbox-header-menu">
            {!isBlockedByMe && !isBlockedByOther ? (
              <button
                className="chatbox-header-menu-button"
                onClick={handleBlockUser}
              >
                <FaBan size={20} />
                <span>Chặn</span>
              </button>
            ) : isBlockedByMe ? (
              <button
                className="chatbox-header-menu-button unblock"
                onClick={handleUnblockUser}
              >
                <FaUnlock size={20} />
                <span>Gỡ chặn</span>
              </button>
            ) : null}
          </div>
        </div>

        <div
          className="chatbox-product-frame"
          onClick={handleImageClick}
          style={{ opacity: infoTinDang.isPostDeleted ? 0.6 : 1 }}
        >
          <div className="chatbox-product-info">
            <img
              src={getFullImageUrl(infoTinDang.anh)}
              alt="Ảnh tin đăng"
              className="chatbox-product-img"
            />
            <div className="chatbox-product-meta">
              <span className="chatbox-product-name">
                {infoTinDang.isPostDeleted
                  ? `${infoTinDang.tieuDe} `
                  : infoTinDang.tieuDe}
              </span>
              <span className="chatbox-product-price">
                {infoTinDang.gia.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </span>
            </div>
            {infoTinDang.isPostDeleted && (
              <span
                className="post-deleted-badge"
                style={{
                  color: "#ff6b6b",
                  fontSize: "12px",
                  marginLeft: "5px",
                }}
              >
                Tin đã xóa
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ==================== MESSAGES ==================== */}
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
          danhSachTin.map((msg, idx) => (
            <div key={idx} className="message-wrapper">
              <div
                className={`message ${
                  msg.maNguoiGui === user?.id ? "sent" : "received"
                } ${msg.isRecalled ? "recalled" : ""}`}
              >
                <div className="message-content">
                  {msg.isRecalled ? (
                    <p className="recalled-message">
                      Tin nhắn đã được thu hồi
                    </p>
                  ) : msg.loaiTinNhan === "image" ? (
                    <img
                      src={msg.noiDung}
                      alt="img-chat"
                      className="message-image clickable-media"
                      onClick={() => openImageModal(msg.noiDung)}
                    />
                  ) : msg.loaiTinNhan === "video" ? (
                    <video
                      src={msg.noiDung}
                      controls
                      className="message-video"
                    />
                  ) : (
                    <p>{msg.noiDung}</p>
                  )}
                </div>

                <div className="message-info">
                  <div className="message-time">{formatTime(msg.thoiGian)}</div>
                  {msg.maNguoiGui === user?.id &&
                    msg.maTinNhan === lastSeenMsgId &&
                    !msg.isRecalled && (
                      <div className="message-status">Đã xem</div>
                    )}
                </div>

                {msg.maNguoiGui === user?.id && !msg.isRecalled && (
                  <div className="message-menu-container">
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
                        {canRecallMessage(msg.thoiGianGui) ? (
                          <button
                            className="message-menu-item recall-available"
                            onClick={() => {
                              if (
                                msg.loaiTinNhan === "image" ||
                                msg.loaiTinNhan === "video"
                              ) {
                                handleRecallMediaMessage(
                                  msg.maTinNhan,
                                  msg.thoiGianGui,
                                  msg.loaiTinNhan
                                );
                              } else {
                                handleRecallTextMessage(
                                  msg.maTinNhan,
                                  msg.thoiGianGui
                                );
                              }
                            }}
                          >
                            <FaTrash size={12} />
                            <span>Thu hồi</span>
                            <div className="recall-timer">
                              <FaClock size={10} />
                              {Math.floor(
                                getRecallTimeRemaining(msg.thoiGianGui)
                              )}
                              :
                              {Math.floor(
                                (getRecallTimeRemaining(msg.thoiGianGui) %
                                  1) *
                                  60
                              )
                                .toString()
                                .padStart(2, "0")}
                            </div>
                          </button>
                        ) : (
                          <button
                            className="message-menu-item recall-disabled"
                            disabled
                          >
                            <FaTrash size={12} />
                            <span>Hết hạn thu hồi</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
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

      {/* ==================== INPUT ==================== */}
      <div className="chatbox-input-container">
        {!isConnected && (
          <div className="connection-warning">
            ⚠️ Mất kết nối. Đang thử kết nối lại...
          </div>
        )}

        <div
          className="chatbox-input"
          style={{
            opacity: isBlockedByMe || isBlockedByOther ? 0.5 : 1,
            pointerEvents:
              isBlockedByMe || isBlockedByOther ? "none" : "auto",
          }}
        >
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
              placeholder={
                isBlockedByMe || isBlockedByOther
                  ? "Không thể gửi tin nhắn"
                  : "Nhập tin nhắn..."
              }
              disabled={isBlockedByMe || isBlockedByOther}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          <button
            className="send-btn"
            onClick={handleSend}
            disabled={
              isBlockedByMe ||
              isBlockedByOther ||
              !(
                tinNhan.trim() ||
                imagePreviewList.length ||
                videoPreviewList.length
              )
            }
          >
            ➔
          </button>
        </div>

        <div className="chatbox-media-preview-list">
          {imagePreviewList.map((file, idx) => (
            <div key={idx} className="chatbox-media-thumb">
              <button
                className="chatbox-media-thumb-remove"
                onClick={() =>
                  setImagePreviewList(
                    imagePreviewList.filter((_, i) => i !== idx)
                  )
                }
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
                onClick={() =>
                  setVideoPreviewList(
                    videoPreviewList.filter((_, i) => i !== idx)
                  )
                }
              >
                ×
              </button>
              <video src={URL.createObjectURL(file)} controls />
            </div>
          ))}
        </div>
      </div>

      {/* ==================== MODAL ==================== */}
      {modalImage && (
        <div className="media-modal-overlay" onClick={closeImageModal}>
          <div
            className="media-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="media-modal-close" onClick={closeImageModal}>
              <FaTimes size={24} />
            </button>
            <img
              src={modalImage}
              alt="Phóng to ảnh"
              className="media-modal-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;