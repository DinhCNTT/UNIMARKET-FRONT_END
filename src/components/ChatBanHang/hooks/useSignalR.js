import { useState, useEffect, useRef, useCallback } from "react";
import { connectToChatHub, sendMessage } from "../../../services/chatService"; // Đảm bảo đường dẫn đúng
import api from "../../../services/api";

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

    // 1. Fetch History
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
          params: { userId: user.id, page: 1, pageSize: PAGE_SIZE },
        });

        if (isMounted && response.data) {
          const messages = response.data.map(mapMessage).reverse();
          setDanhSachTin(messages);
          setPage(1);
          setHasMore(messages.length >= PAGE_SIZE);
        }
      } catch (error) {
        console.error("❌ Lỗi lấy lịch sử chat:", error);
      }
    };

    fetchHistory();

    // 2. Connect SignalR
    const connect = async () => {
      try {
        console.log("🔄 [SIGNALR] Đang kết nối...");

        const onReceiveMessage = (msg) => {
          if (!isMounted) return;
          console.log("📩 [SIGNALR] Nhận tin nhắn mới:", msg);
          const newMsg = mapMessage(msg);

          setDanhSachTin((prev) => {
             // Logic xử lý tin nhắn trùng / deleted conversation
             let deletedMap = {};
             try {
                const raw = localStorage.getItem("deletedConversations");
                deletedMap = raw ? JSON.parse(raw) : {};
             } catch(e){}
             const hadDeleted = !!deletedMap[maCuocTroChuyen];

             if (hadDeleted && prev.length === 0) {
                try { delete deletedMap[maCuocTroChuyen]; localStorage.setItem("deletedConversations", JSON.stringify(deletedMap)); } catch(e){}
                setPage(1);
                setHasMore(false);
                return [newMsg];
             } else if (hadDeleted) {
                 try { delete deletedMap[maCuocTroChuyen]; localStorage.setItem("deletedConversations", JSON.stringify(deletedMap)); } catch(e){}
             }

            if (prev.some((m) => m.maTinNhan === newMsg.maTinNhan)) return prev;
            return [...prev, newMsg];
          });
        };

        const connection = await connectToChatHub(
          maCuocTroChuyen,
          onReceiveMessage
        );

        // ✅ FIX 2: Sửa tên sự kiện thành ReceiveReadStatus (khớp Backend)
        connection.on("ReceiveReadStatus", (data) => {
          console.log("👀 [SIGNALR] Đối phương đã xem:", data);

          if (!isMounted) return;
          
          // Chỉ update nếu đúng cuộc trò chuyện
          if (data.maCuocTroChuyen === maCuocTroChuyen) {
              setDanhSachTin((prev) => {
                // Kiểm tra xem có tin nhắn nào chưa xem của mình không
                const hasUnread = prev.some((msg) => !msg.daXem && msg.maNguoiGui !== data.maNguoiDaXem);
                if (!hasUnread) return prev;

                return prev.map((msg) => {
                  // Mark tin nhắn của mình (người gửi != người vừa xem) thành đã xem
                  if (!msg.daXem && msg.maNguoiGui !== data.maNguoiDaXem) {
                    return { ...msg, daXem: true, thoiGianXem: data.thoiGianXem };
                  }
                  return msg;
                });
              });
          }
        });

        // --- HANDLER: THU HỒI ---
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

        if (isMounted) {
          connectionRef.current = connection;
          setIsConnected(connection && connection.state === "Connected");
          console.log("🟢 [SIGNALR] Kết nối thành công! ID:", connection.connectionId);
        }
        
        connection.onclose(() => { if(isMounted) setIsConnected(false); });
        connection.onreconnected(() => { if(isMounted) setIsConnected(true); });

      } catch (err) {
        console.error("❌ [SIGNALR] Lỗi kết nối:", err);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (connectionRef.current) {
          try {
              connectionRef.current.off("TinNhanDaThuHoi");
              connectionRef.current.off("ReceiveReadStatus"); // ✅ Off đúng sự kiện
          } catch(e){}
          // Không stop connection ở đây nếu dùng shared connection, 
          // nhưng nếu logic của bạn tạo connection mới mỗi lần thì nên stop hoặc để null
          connectionRef.current = null;
      }
      setDanhSachTin([]);
      setPage(1);
      setHasMore(true);
      setIsLoadingMore(false);
    };
  }, [maCuocTroChuyen, user?.id]);

  // --- Các hàm tiện ích ---
  
  // ✅ FIX 3: Gọi API thay vì Invoke SignalR
  const markAsRead = useCallback(async () => {
    if (!maCuocTroChuyen || !user?.id) return;
    
    // Kiểm tra xem có tin nhắn nào chưa đọc của đối phương không để tránh spam API
    // (Logic này tùy chọn, có thể bỏ qua để luôn gọi cho chắc)
    const hasUnreadFromOther = danhSachTin.some(m => !m.daXem && m.maNguoiGui !== user.id);
    if (!hasUnreadFromOther && danhSachTin.length > 0) return;

    try {
        // Gọi API Controller mark-as-read
        await api.post("/chat/mark-as-read", {
            maCuocTroChuyen: maCuocTroChuyen,
            userId: user.id
        });
        // Console log để debug
        // console.log("✅ [API] Marked as read sent");
    } catch (err) {
        console.error("❌ [API] Failed to mark as read:", err);
    }
  }, [maCuocTroChuyen, user?.id, danhSachTin]);

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

  const sendMessageService = useCallback(async (text, type = "text") => {
    if (!maCuocTroChuyen || !user?.id) throw new Error("Thiếu thông tin");
    await sendMessage(maCuocTroChuyen, user.id, text, type);
  }, [maCuocTroChuyen, user?.id]);

  const deleteLocalMessage = useCallback((maTinNhan) => {
    setDanhSachTin((prev) => prev.filter((msg) => msg.maTinNhan !== maTinNhan));
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    // Giả lập delay nhẹ để UI không bị giật
    await new Promise((resolve) => setTimeout(resolve, 500)); 
    try {
      const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
        params: { userId: user.id, page: nextPage, pageSize: PAGE_SIZE },
      });
      const newMessages = response.data.map(mapMessage).reverse();
      if (newMessages.length === 0) {
        setHasMore(false);
      } else {
        setDanhSachTin((prev) => {
          const existingIds = new Set(prev.map((m) => m.maTinNhan));
          const uniqueNewMessages = newMessages.filter(
            (msg) => !existingIds.has(msg.maTinNhan)
          );
          return [...uniqueNewMessages, ...prev];
        });
        setPage(nextPage);
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
    setDanhSachTin, // ✅ FIX 1: QUAN TRỌNG NHẤT - Phải return hàm này
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