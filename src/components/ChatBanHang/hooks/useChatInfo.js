//src/components/ChatBanHang/hooks/useChatInfo.js
//Quản lý dữ liệu tĩnh, gọi API lấy thông tin Chat/User ban đầu và Polling trạng thái Online định kỳ.
import { useState, useEffect, useMemo } from "react";
import api from "../../../services/api";

export const useChatInfo = (maCuocTroChuyen, user) => {
  // State thông tin tin đăng
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

  // State thông tin người còn lại
  const [infoNguoiConLai, setInfoNguoiConLai] = useState({
    id: "",
    avatar: "",
    ten: "",
    isOnline: false,
    lastOnlineTime: null,
    formattedLastSeen: null,
  });

  const [maNguoiConLai, setMaNguoiConLai] = useState(null);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);

  // --- Helpers ---
  const fetchUserStatus = async (userId) => {
    if (!userId) return null;
    try {
      const response = await api.get(`/User/status/${userId}`);
      return response.data ? {
        isOnline: response.data.isOnline,
        lastActive: response.data.lastActive,
        formattedLastSeen: response.data.formattedLastSeen,
      } : null;
    } catch (error) {
      console.error("Error fetching user status:", error);
      return null;
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return;

    const fetchChatInfo = async () => {
      // Logic xử lý AI Chat giả lập
      if (String(maCuocTroChuyen).startsWith("ai-assistant-")) {
        setInfoTinDang({
          tieuDe: "Uni.AI",
          gia: 0,
          anh: "/images/uni-ai-avatar.png",
          maTinDang: null,
          avatarChuSanPham: "/images/uni-ai-avatar.png",
          tenChuSanPham: "Uni.AI",
          isOnline: true,
          lastOnlineTime: null,
          formattedLastSeen: null,
          maChuSanPham: null,
          isPostDeleted: false,
        });
        setMaNguoiConLai("uni.ai");
        setInfoNguoiConLai({
          id: "uni.ai",
          avatar: "/images/uni-ai-avatar.png",
          ten: "Uni.AI",
          isOnline: true,
          lastOnlineTime: null,
          formattedLastSeen: null,
        });
        return;
      }

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
          formattedLastSeen: data.trangThaiChuSanPham?.formattedLastSeen || null,
          maChuSanPham: data.maChuSanPham || null,
          isPostDeleted: data.isPostDeleted || false,
        });

        // Lấy thông tin người tham gia & Block status
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
            formattedLastSeen: data.trangThaiNguoiConLai?.formattedLastSeen || null,
          });

          const [resBlockMe, resBlockOther] = await Promise.all([
            api.get(`/chat/check-block/${user.id}/${otherUserId}`),
            api.get(`/chat/check-block/${otherUserId}/${user.id}`)
          ]);

          setIsBlockedByMe(resBlockMe.data.isBlocked || resBlockMe.data.IsBlocked);
          setIsBlockedByOther(resBlockOther.data.isBlocked || resBlockOther.data.IsBlocked);
        }
      } catch (error) {
         // Xử lý fallback cho AI chat nếu 404
         if (error?.response?.status === 404 && String(maCuocTroChuyen).startsWith("ai-assistant-")) {
            // (Code fallback giống ở trên)...
            return;
         }
         console.error("Lỗi chat info:", error);
      }
    };

    fetchChatInfo();
  }, [maCuocTroChuyen, user?.id]);

  // Refresh Status Interval
  useEffect(() => {
    if (!user?.id) return;
    const refreshStatus = async () => {
      if (infoNguoiConLai.id && infoNguoiConLai.id !== "uni.ai") {
        const status = await fetchUserStatus(infoNguoiConLai.id);
        if (status) setInfoNguoiConLai((p) => ({ ...p, isOnline: status.isOnline, lastOnlineTime: status.lastActive, formattedLastSeen: status.formattedLastSeen }));
      }
      if (infoTinDang.maChuSanPham && infoTinDang.maChuSanPham !== "uni.ai") {
        const status = await fetchUserStatus(infoTinDang.maChuSanPham);
        if (status) setInfoTinDang((p) => ({ ...p, isOnline: status.isOnline, lastOnlineTime: status.lastActive, formattedLastSeen: status.formattedLastSeen }));
      }
    };
    refreshStatus();
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, [user?.id, infoNguoiConLai.id, infoTinDang.maChuSanPham]);

  // Computed Values
  const isChuSanPham = useMemo(() => infoTinDang && user && user.id === infoTinDang.maChuSanPham, [infoTinDang, user]);

  return {
    infoTinDang, setInfoTinDang,
    infoNguoiConLai, setInfoNguoiConLai,
    maNguoiConLai, setMaNguoiConLai,
    isBlockedByMe, setIsBlockedByMe,
    isBlockedByOther, setIsBlockedByOther,
    // Display Helpers
    displayAvatar: isChuSanPham ? infoNguoiConLai.avatar : infoTinDang.avatarChuSanPham,
    displayTen: isChuSanPham ? infoNguoiConLai.ten : infoTinDang.tenChuSanPham,
    displayIsOnline: isChuSanPham ? infoNguoiConLai.isOnline : infoTinDang.isOnline,
    displayLastOnline: isChuSanPham ? infoNguoiConLai.lastOnlineTime : infoTinDang.lastOnlineTime,
    displayFormattedLastSeen: isChuSanPham ? infoNguoiConLai.formattedLastSeen : infoTinDang.formattedLastSeen,
    displayUserId: isChuSanPham ? infoNguoiConLai.id : infoTinDang.maChuSanPham,
    shouldShowStatus: !!(isChuSanPham ? (infoNguoiConLai.id && infoNguoiConLai.ten) : (infoTinDang.maChuSanPham && infoTinDang.tenChuSanPham)),
  };
};