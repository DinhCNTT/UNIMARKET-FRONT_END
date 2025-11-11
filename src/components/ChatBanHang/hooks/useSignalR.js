//ChatBanHang/hooks/useSignalR.js
import { useState, useEffect, useRef, useCallback } from "react";
import { connectToChatHub, sendMessage } from "../../../services/chatService";
import api from "../../../services/api";
import Swal from "sweetalert2";

const PAGE_SIZE = 10;

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

    const fetchHistory = async () => {
      try {
        const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
          params: {
            userId: user.id,
            page: 1,
            pageSize: PAGE_SIZE,
          },
        });

        if (!response.data) throw new Error("Lỗi lấy lịch sử chat");

        if (isMounted) {
          const messages = response.data.map(mapMessage).reverse();
          setDanhSachTin(messages);
          setPage(1);
          const conTrangSau = messages.length === PAGE_SIZE;
          setHasMore(conTrangSau);
        }
      } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error);
        if (isMounted) {
          Swal.fire(
            "Lỗi",
            error.message || "Không thể lấy lịch sử chat",
            "error"
          );
        }
      }
    };

    fetchHistory();

    const connect = async () => {
      try {
        const connection = await connectToChatHub(maCuocTroChuyen, (msg) => {
          if (!isMounted) return;
          const newMsg = mapMessage(msg);

          // ✅ FIX: Kiểm tra cả state hiện tại để quyết định logic
          setDanhSachTin((prev) => {
            // 1. Lấy trạng thái "đã xoá" từ localStorage
            let deletedMap = {};
            try {
              const raw = localStorage.getItem("deletedConversations");
              deletedMap = raw ? JSON.parse(raw) : {};
            } catch (e) {
              deletedMap = {};
            }
            const hadDeleted = !!deletedMap[maCuocTroChuyen];

            // ✅ FIX: Chỉ reset khi cuộc trò chuyện THỰC SỰ trống (chưa tái xuất)
            if (hadDeleted && prev.length === 0) {
              // Đây là tin nhắn đầu tiên sau khi xóa (tái xuất)
              console.log("🔄 Tái xuất cuộc trò chuyện với tin nhắn đầu tiên");
              
              // 1a. Xoá cờ deleted
              try {
                delete deletedMap[maCuocTroChuyen];
                localStorage.setItem(
                  "deletedConversations",
                  JSON.stringify(deletedMap)
                );
              } catch (e) { /* Bỏ qua */ }

              // 1b. Reset phân trang
              setPage(1);
              setHasMore(false);

              // 1c. Trả về state MỚI (chỉ tin nhắn này)
              return [newMsg];
              
            } else if (hadDeleted && prev.length > 0) {
              // ✅ FIX: Cuộc trò chuyện đã được tái xuất trước đó
              // Chỉ cần XÓA CỜ và THÊM tin nhắn mới vào cuối
              console.log("➕ Thêm tin nhắn mới vào cuộc trò chuyện đã tái xuất");
              
              try {
                delete deletedMap[maCuocTroChuyen];
                localStorage.setItem(
                  "deletedConversations",
                  JSON.stringify(deletedMap)
                );
              } catch (e) { /* Bỏ qua */ }

              return [...prev, newMsg]; // Giữ nguyên tin nhắn cũ, thêm tin mới
              
            } else {
              // Trường hợp bình thường: không có cờ deleted
              return [...prev, newMsg];
            }
          });
        });

        // Lắng nghe các sự kiện SignalR khác
        connection.on("TinNhanDaThuHoi", (data) => {
          if (!isMounted) return;
          const { maTinNhan } = data;
          setDanhSachTin((prev) =>
            prev.map((msg) =>
              msg.maTinNhan === maTinNhan
                ? {
                    ...msg,
                    isRecalled: true,
                    noiDung: "Tin nhắn đã được thu hồi",
                  }
                : msg
            )
          );
        });

        connection.on("DaXemTinNhan", (data) => {
          if (!isMounted) return;
          const MaTinNhanCuoi = data?.MaTinNhanCuoi || data?.maTinNhanCuoi;
          if (MaTinNhanCuoi) {
            setDanhSachTin((prev) =>
              prev.map((msg) => {
                const isMatch =
                  msg.maTinNhan.toString() === MaTinNhanCuoi.toString();
                return isMatch ? { ...msg, daXem: true } : msg;
              })
            );
          }
        });

        if (isMounted) {
          connectionRef.current = connection;
          setIsConnected(connection && connection.state === "Connected");
        }

        connection.onclose(() => {
          if (isMounted) setIsConnected(false);
          console.log("SignalR connection closed");
        });
        connection.onreconnected(() => {
          if (isMounted) setIsConnected(true);
          console.log("SignalR reconnected");
        });
      } catch (err) {
        console.error("Lỗi kết nối SignalR hoặc đăng ký sự kiện:", err);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      setDanhSachTin([]);
      setPage(1);
      setHasMore(true);
      setIsLoadingMore(false);
    };
  }, [maCuocTroChuyen, user?.id]);

  const recallMessage = useCallback(
    async (maTinNhan) => {
      if (connectionRef.current && connectionRef.current.state === "Connected") {
        await connectionRef.current.invoke("ThuHoiTinNhan", maTinNhan, user.id);
      } else {
        throw new Error("Kết nối SignalR không sẵn sàng");
      }
    },
    [user?.id]
  );

  const recallMedia = useCallback(
    async (maTinNhan) => {
      if (connectionRef.current && connectionRef.current.state === "Connected") {
        await connectionRef.current.invoke("ThuHoiAnhVideo", maTinNhan, user.id);
      } else {
        throw new Error("Kết nối SignalR không sẵn sàng");
      }
    },
    [user?.id]
  );

  const markAsRead = useCallback(() => {
    if (connectionRef.current && isConnected && user && maCuocTroChuyen) {
      connectionRef.current
        .invoke("DanhDauDaXem", maCuocTroChuyen, user.id)
        .catch(console.error);
    }
  }, [isConnected, user?.id, maCuocTroChuyen]);

  const sendMessageService = useCallback(
    async (text, type = "text") => {
      if (!maCuocTroChuyen || !user?.id) {
        throw new Error("Không có thông tin chat hoặc người dùng");
      }
      await sendMessage(maCuocTroChuyen, user.id, text, type);
    },
    [maCuocTroChuyen, user?.id]
  );

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
        params: {
          userId: user.id,
          page: nextPage,
          pageSize: PAGE_SIZE,
        },
      });

      const newMessages = response.data.map(mapMessage).reverse();
      setDanhSachTin((prev) => [...newMessages, ...prev]);
      setPage(nextPage);
      setHasMore(newMessages.length === PAGE_SIZE);
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
    loadMoreMessages,
    isLoadingMore,
    hasMore,
  };
};