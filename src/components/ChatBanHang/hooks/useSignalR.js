import { useState, useEffect, useRef, useCallback } from "react";
import { connectToChatHub, sendMessage } from "../../../services/chatService";
import api from "../../../services/api";
import Swal from "sweetalert2";

export const useSignalR = (maCuocTroChuyen, user) => {
  const [danhSachTin, setDanhSachTin] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef(null);

  // Effect chính: Kết nối và lắng nghe
  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return;

    let isMounted = true; // Cờ để tránh set state khi component đã unmount

    // 1. Fetch lịch sử chat
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
          params: { userId: user.id },
        });
        if (!response.data) throw new Error("Lỗi lấy lịch sử chat");

        if (isMounted) {
          setDanhSachTin(
            response.data.map((msg) => {
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
        }
      } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error);
        Swal.fire("Lỗi", error.message || "Không thể lấy lịch sử chat", "error");
      }
    };

    fetchHistory();

    // 2. Kết nối SignalR
    const connect = async () => {
      try {
        // Hàm này từ service, nhận tin nhắn mới
        const connection = await connectToChatHub(maCuocTroChuyen, (msg) => {
          if (!isMounted) return;
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

          // Logic ẩn chat (nếu cần)
          const hiddenChats =
            JSON.parse(localStorage.getItem("hiddenChats")) || [];
          const isHidden = hiddenChats.includes(maCuocTroChuyen);
          const isOwnMessage = msg.maNguoiGui === user?.id;

          if (!isHidden || isOwnMessage) {
            setDanhSachTin((prev) => [...prev, newMsg]);
          }
        });

        // 3. Lắng nghe các sự kiện khác
        
        // Event: TinNhanDaThuHoi
        connection.on("TinNhanDaThuHoi", (data) => {
          if (!isMounted) return;
          const { maTinNhan } = data;
          setDanhSachTin((prev) =>
            prev.map((msg) =>
              msg.maTinNhan === maTinNhan
                ? { ...msg, isRecalled: true }
                : msg
            )
          );
          console.log(`Message ${maTinNhan} marked as recalled`);
        });

        // Event: DaXemTinNhan
        connection.on("DaXemTinNhan", (data) => {
          if (!isMounted) return;
          const MaTinNhanCuoi = data?.MaTinNhanCuoi || data?.maTinNhanCuoi;
          if (MaTinNhanCuoi) {
            setDanhSachTin((prev) =>
              prev.map((msg) => {
                const isMatch =
                  msg.maTinNhan == MaTinNhanCuoi ||
                  msg.maTinNhan === MaTinNhanCuoi ||
                  msg.maTinNhan.toString() === MaTinNhanCuoi.toString();
                return isMatch ? { ...msg, daXem: true } : msg;
              })
            );
          }
        });

        // Cập nhật state
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

    // 4. Cleanup
    return () => {
      isMounted = false;
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [maCuocTroChuyen, user?.id]);

  // Hàm Thu hồi Tin nhắn (văn bản)
  const recallMessage = useCallback(async (maTinNhan) => {
    if (connectionRef.current && connectionRef.current.state === "Connected") {
      await connectionRef.current.invoke("ThuHoiTinNhan", maTinNhan, user.id);
    } else {
      throw new Error("Kết nối SignalR không sẵn sàng");
    }
  }, [user?.id]);

  // Hàm Thu hồi Media (ảnh/video)
  const recallMedia = useCallback(async (maTinNhan) => {
    if (connectionRef.current && connectionRef.current.state === "Connected") {
      await connectionRef.current.invoke("ThuHoiAnhVideo", maTinNhan, user.id);
    } else {
      throw new Error("Kết nối SignalR không sẵn sàng");
    }
  }, [user?.id]);

  // Hàm Đánh dấu đã xem
  const markAsRead = useCallback(() => {
    if (connectionRef.current && isConnected && user && maCuocTroChuyen) {
      connectionRef.current
        .invoke("DanhDauDaXem", maCuocTroChuyen, user.id)
        .catch(console.error);
    }
  }, [connectionRef.current, isConnected, user?.id, maCuocTroChuyen]);

  // Hàm Gửi tin nhắn (từ service)
  const sendMessageService = useCallback(
    async (text, type = "text") => {
      if (!maCuocTroChuyen || !user?.id) {
        throw new Error("Không có thông tin chat hoặc người dùng");
      }
      // Dùng hàm sendMessage gốc từ chatService
      await sendMessage(maCuocTroChuyen, user.id, text, type);
    },
    [maCuocTroChuyen, user?.id]
  );

  return {
    danhSachTin,
    isConnected,
    connection: connectionRef.current, // Trả về connection để ChatBox lắng nghe sự kiện
    recallMessage,
    recallMedia,
    markAsRead,
    sendMessageService, // Hàm gửi tin nhắn đã được chuẩn hóa
  };
};