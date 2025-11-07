import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
  Suspense,
  lazy,
} from "react";
import { AuthContext } from "../../context/AuthContext"; // ✅ Đảm bảo đường dẫn đúng
import api from "../../services/api"; // ✅ Đảm bảo đường dẫn đúng
import Swal from "sweetalert2";
import "animate.css";
import styles from "./ModuleChatCss/MessageList.module.css";

// Context & Hook
import { ChatContext } from "./context/ChatContext";
import { useSignalR } from "./hooks/useSignalR";

// Components (Tách ra)
import ChatHeader from "./ChatHeader";
import ChatProductBanner from "./ChatProductBanner";
import MessageList from "./MessageList/MessageList";
import ChatInput from "./ChatInput";

// Lazy load ImageModal
const ImageModal = lazy(() => import("./ImageModal"));

const ChatBox = ({ maCuocTroChuyen }) => {
  const { user } = useContext(AuthContext);

  // ==================== STATE (Điều phối) ====================
  // 1. State từ hook SignalR
  const {
    danhSachTin,
    isConnected,
    connection, // Lấy connection để lắng nghe
    recallMessage,
    recallMedia,
    markAsRead,
    sendMessageService,
  } = useSignalR(maCuocTroChuyen, user);

  // 2. State do ChatBox quản lý (API, UI)
  const [infoTinDang, setInfoTinDang] = useState({
    tieuDe: "", gia: 0, anh: "", maTinDang: null,
    avatarChuSanPham: "", tenChuSanPham: "", isOnline: false,
    lastOnlineTime: null, formattedLastSeen: null,
    maChuSanPham: null, isPostDeleted: false,
  });
  const [infoNguoiConLai, setInfoNguoiConLai] = useState({
    id: "", avatar: "", ten: "", isOnline: false,
    lastOnlineTime: null, formattedLastSeen: null,
  });
  const [modalImage, setModalImage] = useState(null);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [maNguoiConLai, setMaNguoiConLai] = useState(null);

  // ==================== API HELPERS ====================
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

  // ==================== EVENT HANDLERS (Điều phối) ====================

  const handleBlockUser = useCallback(async () => {
    const result = await Swal.fire({
      title: "Chặn người dùng?", text: "Người này sẽ không thể gửi tin nhắn cho bạn nữa.",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6", confirmButtonText: "Chặn", cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await api.post("/chat/block-user", {
          BlockerId: user.id,
          BlockedId: maNguoiConLai,
        });
      } catch (error) {
        Swal.fire({
          icon: "error", title: "Lỗi", text: "Không thể chặn người dùng. Vui lòng thử lại.",
          confirmButtonColor: "#d33",
        });
      }
    }
  }, [user?.id, maNguoiConLai]);

  const handleUnblockUser = useCallback(async () => {
    const result = await Swal.fire({
      title: "Gỡ chặn người dùng?", text: "Bạn sẽ có thể nhận tin nhắn từ người này.",
      icon: "question", showCancelButton: true, confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33", confirmButtonText: "Gỡ chặn", cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await api.post("/chat/unblock-user", {
          BlockerId: user.id,
          BlockedId: maNguoiConLai,
        });
      } catch (error) {
        Swal.fire({
          icon: "error", title: "Lỗi", text: "Không thể gỡ chặn người dùng. Vui lòng thử lại.",
          confirmButtonColor: "#d33",
        });
      }
    }
  }, [user?.id, maNguoiConLai]);

  const openImageModal = useCallback((imageUrl) => {
    setModalImage(imageUrl);
  }, []);

  const closeImageModal = useCallback(() => {
    setModalImage(null);
  }, []);

  // ==================== EFFECTS (Điều phối) ====================

  // Effect: Fetch thông tin cuộc trò chuyện (API)
  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return;

    const fetchChatInfo = async () => {
      try {
        const res = await api.get(`/chat/info/${maCuocTroChuyen}`);
        if (!res.data) throw new Error("Lỗi lấy thông tin cuộc trò chuyện");
        const data = res.data;

        setInfoTinDang({
          tieuDe: data.tieuDeTinDang, gia: data.giaTinDang, anh: data.anhDaiDienTinDang,
          maTinDang: data.maTinDang, avatarChuSanPham: data.avatarChuSanPham || "",
          tenChuSanPham: data.tenChuSanPham || "", isOnline: data.trangThaiChuSanPham?.isOnline || false,
          lastOnlineTime: data.trangThaiChuSanPham?.lastActive || null,
          formattedLastSeen: data.trangThaiChuSanPham?.formattedLastSeen || null,
          maChuSanPham: data.maChuSanPham || null, isPostDeleted: data.isPostDeleted || false,
        });

        const resParticipants = await api.get(`/chat/user/${user.id}`);
        const chats = resParticipants.data;
        const currentChat = Array.isArray(chats)
  ? chats.find((c) => c.maCuocTroChuyen === maCuocTroChuyen)
  : null;
        if (currentChat) {
          const otherUserId = currentChat.maNguoiConLai;
          setMaNguoiConLai(otherUserId);

          setInfoNguoiConLai({
            id: otherUserId, avatar: data.avatarNguoiConLai || "",
            ten: data.tenNguoiConLai || "", isOnline: data.trangThaiNguoiConLai?.isOnline || false,
            lastOnlineTime: data.trangThaiNguoiConLai?.lastActive || null,
            formattedLastSeen: data.trangThaiNguoiConLai?.formattedLastSeen || null,
          });

          const resBlockMe = await api.get(`/chat/check-block/${user.id}/${otherUserId}`);
          setIsBlockedByMe(resBlockMe.data.isBlocked || resBlockMe.data.IsBlocked);

          const resBlockOther = await api.get(`/chat/check-block/${otherUserId}/${user.id}`);
          setIsBlockedByOther(resBlockOther.data.isBlocked || resBlockOther.data.IsBlocked);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin cuộc trò chuyện:", error);
      }
    };

    fetchChatInfo();
  }, [maCuocTroChuyen, user?.id]);

  // Effect: Lắng nghe sự kiện SignalR (dùng `connection` từ hook)
  useEffect(() => {
    if (!connection || !user?.id || !maNguoiConLai) return;

    // Event: UserStatusChanged
    const userStatusHandler = (data) => {
      try {
        const userId = data.userId || data.userid || data.UserId;
        const isOnline = data.isOnline ?? data.IsOnline ?? false;
        const lastActive = data.lastSeen || data.lastActive || data.LastActive || null;
        const formattedLastSeen = data.formattedLastSeen || null;

        setInfoNguoiConLai((prev) =>
          prev.id === userId
            ? { ...prev, isOnline, lastOnlineTime: isOnline ? null : lastActive, formattedLastSeen }
            : prev
        );
        setInfoTinDang((prev) =>
          prev.maChuSanPham === userId
            ? { ...prev, isOnline, lastOnlineTime: isOnline ? null : lastActive, formattedLastSeen }
            : prev
        );
      } catch (err) {
        console.error("Lỗi xử lý UserStatusChanged:", err);
      }
    };

    // Event: CapNhatTinDang
    const postUpdateHandler = (updatedPost) => {
      const maTinDangHT = maCuocTroChuyen.split("-").pop();
      if (updatedPost.MaTinDang?.toString() === maTinDangHT?.toString()) {
        setInfoTinDang((prev) => ({
          ...prev,
          tieuDe: updatedPost.TieuDe || updatedPost.tieuDe || prev.tieuDe,
          gia: updatedPost.Gia || updatedPost.gia || prev.gia,
          anh: updatedPost.AnhDaiDien || updatedPost.anhDaiDien || prev.anh,
          maTinDang: updatedPost.MaTinDang || prev.maTinDang,
          isPostDeleted: updatedPost.IsDeleted || false,
        }));
      }
    };

    // Event: Block/Unblock
    const blockHandler = (data) => {
      const { blockedUserId, actionType } = data;
      if (actionType === "block" && blockedUserId === maNguoiConLai) {
        setIsBlockedByMe(true);
        // ... (Swal.fire)
      } else if (actionType === "unblock" && blockedUserId === maNguoiConLai) {
        setIsBlockedByMe(false);
        // ... (Swal.fire)
      } else if (actionType === "blocked_by" && blockedUserId === user.id) {
        setIsBlockedByOther(true);
        // ... (Swal.fire)
      } else if (actionType === "unblocked_by" && blockedUserId === user.id) {
        setIsBlockedByOther(false);
        // ... (Swal.fire)
      }
    };

    // Event: ChatStatusChanged
    const chatStatusHandler = (data) => {
        const { chatId, isBlocked, blockedByMe } = data;
        if (chatId === maCuocTroChuyen) {
            setIsBlockedByMe(isBlocked && blockedByMe);
            setIsBlockedByOther(isBlocked && !blockedByMe);
        }
    };

    connection.on("UserStatusChanged", userStatusHandler);
    connection.on("CapNhatTinDang", postUpdateHandler);
    connection.on("UserBlocked", blockHandler);
    connection.on("ChatStatusChanged", chatStatusHandler);

    return () => {
      connection.off("UserStatusChanged", userStatusHandler);
      connection.off("CapNhatTinDang", postUpdateHandler);
      connection.off("UserBlocked", blockHandler);
      connection.off("ChatStatusChanged", chatStatusHandler);
    };
  }, [connection, user?.id, maNguoiConLai, maCuocTroChuyen]);

  // Effect: Làm mới trạng thái người dùng định kỳ (API)
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
  }, [isConnected, user?.id, infoNguoiConLai.id, infoTinDang.maChuSanPham]);

  // ==================== COMPUTED VALUES ====================
  // Tính toán các giá trị hiển thị 1 lần ở đây và truyền xuống
  const isChuSanPham = useMemo(
    () => infoTinDang && user && user.id === infoTinDang.maChuSanPham,
    [infoTinDang, user]
  );
  
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
    
  const displayFormattedLastSeen = isChuSanPham
    ? infoNguoiConLai.formattedLastSeen
    : infoTinDang.formattedLastSeen;
    
  const shouldShowStatus = !!(isChuSanPham
    ? infoNguoiConLai.id && infoNguoiConLai.ten
    : infoTinDang.maChuSanPham && infoTinDang.tenChuSanPham);

  // ==================== CONTEXT VALUE ====================
const contextValue = {
  // Data
  danhSachTin,
  infoTinDang,
  user,
  maCuocTroChuyen,

  // ✅ Thêm biến modalImage vào context
  modalImage,

  // Trạng thái
  isConnected,
  isBlockedByMe,
  isBlockedByOther,

  // Giá trị đã tính
  displayAvatar,
  displayTen,
  displayIsOnline,
  displayLastOnline,
  displayFormattedLastSeen,
  shouldShowStatus,

  // Hàm (Handlers)
  handleBlockUser,
  handleUnblockUser,
  openImageModal,
  closeImageModal,

  // Hàm từ hook SignalR
  recallMessage,
  recallMedia,
  markAsRead,
  sendMessageService,
};

  // ==================== RENDER ====================
  return (
    <ChatContext.Provider value={contextValue}>
  <div className={styles.chatboxContainer}>
        <ChatHeader />
        <ChatProductBanner />
        <MessageList />
        <ChatInput />

        <Suspense fallback={<div>Đang tải...</div>}>
          {modalImage && <ImageModal />}
        </Suspense>
      </div>
    </ChatContext.Provider>
  );
};

export default ChatBox;