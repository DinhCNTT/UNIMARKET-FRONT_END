//ChatBanHang/hooks/useSignalR.js
import { useState, useEffect, useRef, useCallback } from "react";
import { connectToChatHub, sendMessage } from "../../../services/chatService";
import api from "../../../services/api";
import Swal from "sweetalert2";

// 🔥 Tăng lên 30 để load nhiều hơn, ít phải load lại
const PAGE_SIZE = 30;

const mapMessage = (msg) => {
  let timeStr = msg.thoiGianGui;
  if (timeStr && !timeStr.endsWith("Z")) {
    timeStr += "Z";
  }
  return {
    ...msg,
    thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    thoiGianGui: timeStr,
    daXem: msg.daXem || false,
  };
};

export const useSignalR = (maCuocTroChuyen, user) => {
  const [danhSachTin, setDanhSachTin] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef(null);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return;

    let isMounted = true;

    // 1. Fetch History ban đầu
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
          params: {
            userId: user.id,
            page: 1,
            pageSize: PAGE_SIZE,
          },
        });

        if (isMounted && response.data) {
          const messages = response.data.map(mapMessage).reverse();
          setDanhSachTin(messages);
          setPage(1);
          setHasMore(messages.length >= PAGE_SIZE);
        }
      } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error);
      }
    };

    fetchHistory();

    // 2. Connect SignalR
    const connect = async () => {
      try {
        const onReceiveMessage = (msg) => {
          if (!isMounted) return;
          const newMsg = mapMessage(msg);

          setDanhSachTin((prev) => {
            // Logic xử lý khi chat đã bị xóa (giữ nguyên logic cũ của bạn)
            let deletedMap = {};
            try {
               const raw = localStorage.getItem("deletedConversations");
               deletedMap = raw ? JSON.parse(raw) : {};
            } catch(e){}
            const hadDeleted = !!deletedMap[maCuocTroChuyen];

            if (hadDeleted && prev.length === 0) {
               // Reset nếu là tin nhắn đầu tiên sau khi xóa
               try { delete deletedMap[maCuocTroChuyen]; localStorage.setItem("deletedConversations", JSON.stringify(deletedMap)); } catch(e){}
               setPage(1);
               setHasMore(false);
               return [newMsg];
            } else if (hadDeleted) {
                try { delete deletedMap[maCuocTroChuyen]; localStorage.setItem("deletedConversations", JSON.stringify(deletedMap)); } catch(e){}
            }

            // Kiểm tra trùng lặp cho chắc chắn (dù tin mới ít khi trùng)
            if (prev.some(m => m.maTinNhan === newMsg.maTinNhan)) return prev;
            return [...prev, newMsg];
          });
        };

        const connection = await connectToChatHub(maCuocTroChuyen, onReceiveMessage);

        connection.on("TinNhanDaThuHoi", (data) => {
          if (!isMounted) return;
          setDanhSachTin((prev) =>
            prev.map((msg) =>
              msg.maTinNhan === data.maTinNhan
                ? { ...msg, isRecalled: true, noiDung: "Tin nhắn đã được thu hồi" }
                : msg
            )
          );
        });

        connection.on("DaXemTinNhan", (data) => {
          if (!isMounted) return;
          const MaTinNhanCuoi = data?.MaTinNhanCuoi;
          if (MaTinNhanCuoi) {
            setDanhSachTin((prev) =>
              prev.map((msg) =>
                msg.maTinNhan.toString() === MaTinNhanCuoi.toString()
                  ? { ...msg, daXem: true }
                  : msg
              )
            );
          }
        });

        if (isMounted) {
          connectionRef.current = connection;
          setIsConnected(connection && connection.state === "Connected");
        }
        
        connection.onclose(() => { if(isMounted) setIsConnected(false); });
        connection.onreconnected(() => { if(isMounted) setIsConnected(true); });

      } catch (err) {
        console.error("Lỗi kết nối SignalR:", err);
      }
    };

    connect();

    return () => {
      isMounted = false;
      // 🔥 FIX: Chỉ cleanup listener, KHÔNG stop connection (vì dùng chung)
      if (connectionRef.current) {
         try {
             connectionRef.current.off("TinNhanDaThuHoi");
             connectionRef.current.off("DaXemTinNhan");
         } catch(e){}
         connectionRef.current = null;
      }
      setDanhSachTin([]);
      setPage(1);
      setHasMore(true);
      setIsLoadingMore(false);
    };
  }, [maCuocTroChuyen, user?.id]);

  // --- Các hàm tiện ích ---
  const recallMessage = useCallback(async (maTinNhan) => {
    if (connectionRef.current?.state === "Connected") {
      await connectionRef.current.invoke("ThuHoiTinNhan", maTinNhan, user.id);
    }
  }, [user?.id]);

  const recallMedia = useCallback(async (maTinNhan) => {
    if (connectionRef.current?.state === "Connected") {
      await connectionRef.current.invoke("ThuHoiAnhVideo", maTinNhan, user.id);
    }
  }, [user?.id]);

  const markAsRead = useCallback(() => {
    if (connectionRef.current?.state === "Connected" && user && maCuocTroChuyen) {
      connectionRef.current.invoke("DanhDauDaXem", maCuocTroChuyen, user.id).catch(()=>{});
    }
  }, [user?.id, maCuocTroChuyen, isConnected]);

  const sendMessageService = useCallback(async (text, type = "text") => {
    if (!maCuocTroChuyen || !user?.id) throw new Error("Thiếu thông tin");
    await sendMessage(maCuocTroChuyen, user.id, text, type);
  }, [maCuocTroChuyen, user?.id]);

  const deleteLocalMessage = useCallback((maTinNhan) => {
    setDanhSachTin((prev) => prev.filter((msg) => msg.maTinNhan !== maTinNhan));
  }, []);

  // 🔥🔥🔥 HÀM LOAD MORE ĐÃ FIX TRÙNG LẶP BACKEND 🔥🔥🔥
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
        params: {
          userId: user.id,
          page: nextPage,
          pageSize: PAGE_SIZE,
        },
      });

      const newMessages = response.data.map(mapMessage).reverse();

      if (newMessages.length === 0) {
        setHasMore(false);
      } else {
        setDanhSachTin((prev) => {
          // --- BẮT BUỘC: Lọc trùng lặp do Backend Skip/Take ---
          const existingIds = new Set(prev.map((m) => m.maTinNhan));
          
          // Chỉ lấy những tin chưa tồn tại
          const uniqueNewMessages = newMessages.filter(
            (msg) => !existingIds.has(msg.maTinNhan)
          );
          // ----------------------------------------------------

          return [...uniqueNewMessages, ...prev];
        });

        setPage(nextPage);
        // Nếu số tin lấy về < PAGE_SIZE nghĩa là đã hết sạch tin
        setHasMore(newMessages.length >= PAGE_SIZE);
      }
    } catch (error) {
      console.error("Lỗi tải tin nhắn cũ:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, maCuocTroChuyen, user?.id]);

  return {
    danhSachTin,
    isConnected,
    connection: connectionRef.current,
    recallMessage,
    recallMedia,
    markAsRead,
    sendMessageService,
    deleteLocalMessage,
    loadMoreMessages,
    isLoadingMore,
    hasMore,
  };
};