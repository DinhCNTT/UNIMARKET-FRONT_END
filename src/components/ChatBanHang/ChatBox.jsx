import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
  Suspense,
  lazy,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "animate.css";

import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import {
  deleteConversationForMe,
  setChatState,
} from "../../services/chatService";
import styles from "./ModuleChatCss/MessageList.module.css";

import { ChatContext } from "./context/ChatContext";
import { useSignalR } from "./hooks/useSignalR";
import { useQuickMessages } from "../ChatList/useQuickMessages";

import ChatHeader from "./ChatHeader";
import ChatProductBanner from "./ChatProductBanner";
import MessageList from "./MessageList/MessageList";
import ChatInput from "./ChatInput";
import ChatInfoSidebar from "./ChatInfoSidebar";
import QuickReplies from "./QuickReplies";
import { useLocation } from "react-router-dom";

const ImageModal = lazy(() => import("./ImageModal"));
const VideoModal = lazy(() => import("./VideoModal"));
const QuickMessageModal = lazy(() =>
  import("../ChatList/QuickMessageModal.jsx")
);

const ModalLoadingFallback = () => (
  <div className={styles.modalLoadingOverlay}>
    <div className={styles.modalLoadingSpinner}></div>
  </div>
);

const ChatBox = ({ maCuocTroChuyen }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================================
  // HOOKS
  // ============================================================================

  // SignalR Hook
  const {
    danhSachTin,
    isConnected,
    connection,
    recallMessage,
    recallMedia,
    markAsRead,
    sendMessageService,
    deleteLocalMessage,
    loadMoreMessages,
    isLoadingMore,
    hasMore,
  } = useSignalR(maCuocTroChuyen, user);

  useEffect(() => {
    // Chỉ gửi khi đã kết nối SignalR và có dữ liệu autoSend
    if (isConnected && location.state?.autoSend) {
       console.log("🚀 Auto sending message:", location.state.autoSend);
       
       // Gọi hàm gửi tin nhắn (dạng text)
       sendMessageService(location.state.autoSend, "text");
       
       // Xóa state trong history để tránh gửi lại tin nhắn khi user F5 lại trang
       window.history.replaceState({}, document.title);
    }
  }, [isConnected, location.state, sendMessageService]);

  // Quick Messages Hook
  const {
    quickMessages,
    saveQuickMessages,
    deleteQuickMessage,
    editingId,
    editingContent,
    setEditingContent,
    startEditMessage,
    cancelEdit,
    isLoadingQuickMessages,
    isSavingQuickMessages,
  } = useQuickMessages(user?.id);

  // ============================================================================
  // STATE - Thông tin chat
  // ============================================================================

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

  // ============================================================================
  // STATE - UI & Modal
  // ============================================================================

  const [modalImage, setModalImage] = useState(null);
  const [videoModalUrl, setVideoModalUrl] = useState(null);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [maNguoiConLai, setMaNguoiConLai] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tinNhan, setTinNhan] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showQuickMsgModal, setShowQuickMsgModal] = useState(false);

  const inputRef = useRef(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isDisabled = useMemo(
    () => isBlockedByMe || isBlockedByOther || isUploading,
    [isBlockedByMe, isBlockedByOther, isUploading]
  );

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

  const displayUserId = isChuSanPham
    ? infoNguoiConLai.id
    : infoTinDang.maChuSanPham;

  const shouldShowStatus = !!(isChuSanPham
    ? infoNguoiConLai.id && infoNguoiConLai.ten
    : infoTinDang.maChuSanPham && infoTinDang.tenChuSanPham);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

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

  // ============================================================================
  // EVENT HANDLERS - Quick Messages
  // ============================================================================

  const handleOpenAddModal = useCallback(() => {
    cancelEdit();
    setShowQuickMsgModal(true);
  }, [cancelEdit]);

  const handleQuickReplySent = useCallback((sentText) => {
    setTinNhan((prev) => (prev.trim() === sentText.trim() ? "" : prev));
    inputRef.current?.focus();
  }, []);

  // ============================================================================
  // EVENT HANDLERS - Block/Unblock
  // ============================================================================

  const handleBlockUser = useCallback(async () => {
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
        Swal.fire("Lỗi", "Không thể chặn người dùng.", "error");
      }
    }
  }, [user?.id, maNguoiConLai]);

  const handleUnblockUser = useCallback(async () => {
    const result = await Swal.fire({
      title: "Gỡ chặn?",
      text: "Bạn sẽ nhận được tin nhắn từ người này.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Gỡ chặn",
    });

    if (result.isConfirmed) {
      try {
        await api.post("/chat/unblock-user", {
          BlockerId: user.id,
          BlockedId: maNguoiConLai,
        });
      } catch (error) {
        Swal.fire("Lỗi", "Không thể gỡ chặn.", "error");
      }
    }
  }, [user?.id, maNguoiConLai]);

  // ============================================================================
  // EVENT HANDLERS - Delete Conversation
  // ============================================================================

  const handleDeleteConversation = useCallback(async () => {
    if (!maCuocTroChuyen || !user?.id) return;

    const result = await Swal.fire({
      title: "Xác nhận xóa cuộc trò chuyện",
      text: "Cuộc trò chuyện sẽ bị xóa ở phía bạn.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
    });

    if (!result.isConfirmed) return;

    try {
      const deleteRes = await deleteConversationForMe(
        maCuocTroChuyen,
        user.id
      );

      try {
        await setChatState(maCuocTroChuyen, false, true, user.id);
      } catch (e) {}

      window.dispatchEvent(new Event("refreshChatList"));

      try {
        const raw = localStorage.getItem("deletedConversations");
        const map = raw ? JSON.parse(raw) : {};
        const serverHidden =
          deleteRes && (deleteRes.hidden || deleteRes.Hidden);
        const thoiGianAn =
          serverHidden &&
          (serverHidden.ThoiGianAn || serverHidden.thoiGianAn)
            ? new Date(
                serverHidden.ThoiGianAn || serverHidden.thoiGianAn
              ).toISOString()
            : new Date().toISOString();

        map[maCuocTroChuyen] = thoiGianAn;
        localStorage.setItem("deletedConversations", JSON.stringify(map));
      } catch (e) {
        console.warn("LocalStorage error", e);
      }

      await Swal.fire("Thành công", "Đã xóa cuộc trò chuyện.", "success");
      navigate("/chat");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      Swal.fire("Lỗi", "Không thể xóa cuộc trò chuyện.", "error");
    }
  }, [maCuocTroChuyen, user?.id, navigate]);

  // ============================================================================
  // EVENT HANDLERS - Modal
  // ============================================================================

  const openImageModal = useCallback((imageUrl) => setModalImage(imageUrl), []);
  const closeImageModal = useCallback(() => setModalImage(null), []);
  const openVideoModal = useCallback(
    (videoUrl) => setVideoModalUrl(videoUrl),
    []
  );
  const closeVideoModal = useCallback(() => setVideoModalUrl(null), []);
  const toggleSidebar = useCallback(
    () => setIsSidebarOpen((prev) => !prev),
    []
  );
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  // ============================================================================
  // EFFECTS - Fetch Chat Info
  // ============================================================================

  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return;

    const fetchChatInfo = async () => {
      try {
        // Lấy thông tin chat
        const res = await api.get(`/chat/info/${maCuocTroChuyen}`);
        if (!res.data) throw new Error("Lỗi lấy thông tin");

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

        // Lấy thông tin người tham gia
        const resParticipants = await api.get(`/chat/user/${user.id}`);
        const chats = resParticipants.data;
        const currentChat = Array.isArray(chats)
          ? chats.find((c) => c.maCuocTroChuyen === maCuocTroChuyen)
          : null;

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

          // Kiểm tra trạng thái block
          const resBlockMe = await api.get(
            `/chat/check-block/${user.id}/${otherUserId}`
          );
          setIsBlockedByMe(
            resBlockMe.data.isBlocked || resBlockMe.data.IsBlocked
          );

          const resBlockOther = await api.get(
            `/chat/check-block/${otherUserId}/${user.id}`
          );
          setIsBlockedByOther(
            resBlockOther.data.isBlocked || resBlockOther.data.IsBlocked
          );
        }
      } catch (error) {
        console.error("Lỗi chat info:", error);
      }
    };

    fetchChatInfo();
  }, [maCuocTroChuyen, user?.id]);

  // ============================================================================
  // EFFECTS - SignalR Event Handlers
  // ============================================================================

  useEffect(() => {
    if (!connection || !user?.id || !maNguoiConLai) return;

    // Handler: User Status Changed
    const userStatusHandler = (data) => {
      const userId = data.userId || data.userid || data.UserId;
      const isOnline = data.isOnline ?? data.IsOnline ?? false;
      const lastActive =
        data.lastSeen || data.lastActive || data.LastActive || null;
      const formattedLastSeen = data.formattedLastSeen || null;

      setInfoNguoiConLai((prev) =>
        prev.id === userId
          ? {
              ...prev,
              isOnline,
              lastOnlineTime: isOnline ? null : lastActive,
              formattedLastSeen,
            }
          : prev
      );

      setInfoTinDang((prev) =>
        prev.maChuSanPham === userId
          ? {
              ...prev,
              isOnline,
              lastOnlineTime: isOnline ? null : lastActive,
              formattedLastSeen,
            }
          : prev
      );
    };

    // Handler: Post Update
    const postUpdateHandler = (updatedPost) => {
      const maTinDangHT = maCuocTroChuyen.split("-").pop();

      if (updatedPost.MaTinDang?.toString() === maTinDangHT?.toString()) {
        setInfoTinDang((prev) => ({
          ...prev,
          tieuDe: updatedPost.TieuDe || prev.tieuDe,
          gia: updatedPost.Gia || prev.gia,
          anh: updatedPost.AnhDaiDien || prev.anh,
          maTinDang: updatedPost.MaTinDang || prev.maTinDang,
          isPostDeleted: updatedPost.IsDeleted || false,
        }));
      }
    };

    // Handler: Block/Unblock
    const blockHandler = (data) => {
      const { blockedUserId, actionType } = data;

      if (actionType === "block" && blockedUserId === maNguoiConLai) {
        setIsBlockedByMe(true);
      } else if (actionType === "unblock" && blockedUserId === maNguoiConLai) {
        setIsBlockedByMe(false);
      } else if (actionType === "blocked_by" && blockedUserId === user.id) {
        setIsBlockedByOther(true);
      } else if (actionType === "unblocked_by" && blockedUserId === user.id) {
        setIsBlockedByOther(false);
      }
    };

    // Handler: Chat Status Changed
    const chatStatusHandler = (data) => {
      if (data.chatId === maCuocTroChuyen) {
        setIsBlockedByMe(data.isBlocked && data.blockedByMe);
        setIsBlockedByOther(data.isBlocked && !data.blockedByMe);
      }
    };

    // Register event handlers
    connection.on("UserStatusChanged", userStatusHandler);
    connection.on("CapNhatTinDang", postUpdateHandler);
    connection.on("UserBlocked", blockHandler);
    connection.on("ChatStatusChanged", chatStatusHandler);

    // Cleanup
    return () => {
      connection.off("UserStatusChanged", userStatusHandler);
      connection.off("CapNhatTinDang", postUpdateHandler);
      connection.off("UserBlocked", blockHandler);
      connection.off("ChatStatusChanged", chatStatusHandler);
    };
  }, [connection, user?.id, maNguoiConLai, maCuocTroChuyen]);

  // ============================================================================
  // EFFECTS - Refresh Status Interval
  // ============================================================================

  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const refreshStatus = async () => {
      // Refresh status cho người còn lại
      if (infoNguoiConLai.id) {
        const status = await fetchUserStatus(infoNguoiConLai.id);
        if (status) {
          setInfoNguoiConLai((p) => ({
            ...p,
            isOnline: status.isOnline,
            lastOnlineTime: status.lastActive,
            formattedLastSeen: status.formattedLastSeen,
          }));
        }
      }

      // Refresh status cho chủ sản phẩm
      if (infoTinDang.maChuSanPham) {
        const status = await fetchUserStatus(infoTinDang.maChuSanPham);
        if (status) {
          setInfoTinDang((p) => ({
            ...p,
            isOnline: status.isOnline,
            lastOnlineTime: status.lastActive,
            formattedLastSeen: status.formattedLastSeen,
          }));
        }
      }
    };

    refreshStatus();
    const interval = setInterval(refreshStatus, 30000);

    return () => clearInterval(interval);
  }, [isConnected, user?.id, infoNguoiConLai.id, infoTinDang.maChuSanPham]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue = useMemo(
    () => ({
      danhSachTin,
      infoTinDang,
      user,
      maCuocTroChuyen,
      modalImage,
      isConnected,
      isBlockedByMe,
      isBlockedByOther,
      displayAvatar,
      displayTen,
      displayIsOnline,
      displayLastOnline,
      displayFormattedLastSeen,
      shouldShowStatus,
      displayUserId,
      handleBlockUser,
      handleUnblockUser,
      openImageModal,
      closeImageModal,
      openVideoModal,
      closeVideoModal,
      recallMessage,
      recallMedia,
      markAsRead,
      sendMessageService,
      deleteLocalMessage,
      loadMoreMessages,
      isLoadingMore,
      hasMore,
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
    }),
    [
      danhSachTin,
      infoTinDang,
      user,
      maCuocTroChuyen,
      modalImage,
      isConnected,
      isBlockedByMe,
      isBlockedByOther,
      displayAvatar,
      displayTen,
      displayIsOnline,
      displayLastOnline,
      displayFormattedLastSeen,
      shouldShowStatus,
      displayUserId,
      handleBlockUser,
      handleUnblockUser,
      openImageModal,
      closeImageModal,
      openVideoModal,
      closeVideoModal,
      recallMessage,
      recallMedia,
      markAsRead,
      sendMessageService,
      deleteLocalMessage,
      loadMoreMessages,
      isLoadingMore,
      hasMore,
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
    ]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <ChatContext.Provider value={contextValue}>
      <div className={styles.chatPageWrapper}>
        <div className={styles.chatboxContainer}>
          <ChatHeader />
          <ChatProductBanner />
          <MessageList />

          <QuickReplies
            isDisabled={isDisabled}
            isConnected={isConnected}
            sendMessageService={sendMessageService}
            onQuickReplySent={handleQuickReplySent}
            customQuickMessages={quickMessages}
            onOpenSettings={handleOpenAddModal}
          />

          <ChatInput
            tinNhan={tinNhan}
            setTinNhan={setTinNhan}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
            isDisabled={isDisabled}
            inputRef={inputRef}
          />
        </div>

        <ChatInfoSidebar />

        <Suspense fallback={<ModalLoadingFallback />}>
          {modalImage && <ImageModal />}

          {videoModalUrl && (
            <VideoModal url={videoModalUrl} onClose={closeVideoModal} />
          )}

          {showQuickMsgModal && (
            <QuickMessageModal
              show={showQuickMsgModal}
              onClose={() => setShowQuickMsgModal(false)}
              quickMessages={quickMessages}
              editingId={editingId}
              editingContent={editingContent}
              isLoading={isLoadingQuickMessages}
              isSaving={isSavingQuickMessages}
              onContentChange={setEditingContent}
              onSave={async () => {
                const success = await saveQuickMessages();
                if (success) {
                  setShowQuickMsgModal(false);
                }
              }}
              onDelete={deleteQuickMessage}
              onEdit={startEditMessage}
              onCancelEdit={cancelEdit}
            />
          )}
        </Suspense>
      </div>
    </ChatContext.Provider>
  );
};

export default ChatBox;