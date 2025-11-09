import { useState, useEffect, useRef, useCallback } from "react";
import { connectToChatHub, sendMessage } from "../../../services/chatService";
import api from "../../../services/api";
import Swal from "sweetalert2";

// Kích thước trang cho mỗi lần tải tin nhắn
const PAGE_SIZE = 20; // Bạn có thể điều chỉnh số lượng này

/**
 * Hàm helper để xử lý map dữ liệu tin nhắn, tránh lặp code
 */
const mapMessage = (msg) => {
  let timeStr = msg.thoiGianGui;
  // Đảm bảo thời gian luôn ở định dạng UTC (có 'Z')
  if (timeStr && !timeStr.endsWith("Z")) {
    timeStr += "Z";
  }
  return {
    ...msg,
    // Chuyển đổi sang giờ địa phương
    thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    thoiGianGui: timeStr, // Giữ lại thời gian gốc (UTC) để so sánh
    daXem: msg.daXem || false,
  };
};

/**
 * Hook tùy chỉnh để quản lý kết nối SignalR và dữ liệu chat
 */
export const useSignalR = (maCuocTroChuyen, user) => {
  // State: Danh sách tin nhắn
  const [danhSachTin, setDanhSachTin] = useState([]);
  
  // State: Trạng thái kết nối
  const [isConnected, setIsConnected] = useState(false);
  
  // Ref: Lưu trữ đối tượng connection
  const connectionRef = useRef(null);

  // === State mới cho việc phân trang ===
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Giả định ban đầu là còn tin nhắn cũ

  // Effect chính: Chạy khi `maCuocTroChuyen` hoặc `user.id` thay đổi
  useEffect(() => {
    // Chỉ chạy khi có đủ thông tin
    if (!maCuocTroChuyen || !user?.id) return;

    // Cờ để kiểm soát việc set state sau khi component đã unmount
    let isMounted = true; 
    
    // 1. Tải lịch sử chat (Trang 1)
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
          params: { 
            userId: user.id,
            page: 1, // Luôn tải trang 1 khi bắt đầu
            pageSize: PAGE_SIZE 
          },
        });

        if (!response.data) throw new Error("Lỗi lấy lịch sử chat");

        if (isMounted) {
          // 🚀 FIX: Thêm .reverse() để khớp với API OrderByDescending
          // API trả về [Tin 30, Tin 29, ...], .reverse() sẽ đổi thành [..., Tin 29, Tin 30]
          const messages = response.data.map(mapMessage).reverse(); 
          
          setDanhSachTin(messages);
          setPage(1); // Reset về trang 1
          
          const conTrangSau = messages.length === PAGE_SIZE;
          console.log(`TẢI LẦN ĐẦU: Tải ${messages.length} tin, PAGE_SIZE=${PAGE_SIZE}. => setHasMore(${conTrangSau})`);
          setHasMore(conTrangSau); // Kiểm tra xem còn trang sau không
        }
      } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error);
        if (isMounted) {
            Swal.fire("Lỗi", error.message || "Không thể lấy lịch sử chat", "error");
        }
      }
    };

    fetchHistory();

    // 2. Kết nối SignalR Hub
    const connect = async () => {
      try {
        // `connectToChatHub` là hàm từ service, nhận tin nhắn mới (ReceiveMessage)
        const connection = await connectToChatHub(maCuocTroChuyen, (msg) => {
          if (!isMounted) return;
          const newMsg = mapMessage(msg);

          // Xử lý logic ẩn chat (nếu bạn có)
          const hiddenChats = JSON.parse(localStorage.getItem("hiddenChats")) || [];
          const isHidden = hiddenChats.includes(maCuocTroChuyen);
          const isOwnMessage = msg.maNguoiGui === user?.id;

          if (!isHidden || isOwnMessage) {
            // Khi có tin nhắn MỚI (real-time), thêm vào CUỐI danh sách
            setDanhSachTin((prev) => [...prev, newMsg]);
          }
        });

        // 3. Lắng nghe các sự kiện SignalR khác

        // Event: Tin nhắn đã bị thu hồi
        connection.on("TinNhanDaThuHoi", (data) => {
          if (!isMounted) return;
          const { maTinNhan } = data;
          setDanhSachTin((prev) =>
            prev.map((msg) =>
              msg.maTinNhan === maTinNhan
                ? { ...msg, isRecalled: true, noiDung: "Tin nhắn đã được thu hồi" } // Cập nhật nội dung
                : msg
            )
          );
          console.log(`Message ${maTinNhan} marked as recalled`);
        });

        // Event: Người kia đã xem tin nhắn
        connection.on("DaXemTinNhan", (data) => {
          if (!isMounted) return;
          // Đảm bảo key nhất quán (viết hoa/thường)
          const MaTinNhanCuoi = data?.MaTinNhanCuoi || data?.maTinNhanCuoi; 
          if (MaTinNhanCuoi) {
            setDanhSachTin((prev) =>
              prev.map((msg) => {
                // So sánh lỏng lẻo (==) hoặc ép kiểu string để an toàn
                const isMatch = msg.maTinNhan.toString() === MaTinNhanCuoi.toString();
                return isMatch ? { ...msg, daXem: true } : msg;
              })
            );
          }
        });

        // Cập nhật state khi kết nối thành công
        if (isMounted) {
          connectionRef.current = connection;
          setIsConnected(connection && connection.state === "Connected");
        }

        // Xử lý mất kết nối và kết nối lại
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

    // 4. Hàm dọn dẹp (Cleanup) khi component unmount
    return () => {
      isMounted = false; // Ngăn set state
      if (connectionRef.current) {
        connectionRef.current.stop(); // Dừng kết nối SignalR
        connectionRef.current = null;
      }
      // Reset toàn bộ state khi đổi cuộc trò chuyện
      setDanhSachTin([]);
      setPage(1);
      setHasMore(true);
      setIsLoadingMore(false);
    };
  }, [maCuocTroChuyen, user?.id]); // Effect này chỉ chạy lại khi đổi chat hoặc đổi user


  // === Các hàm (Actions) để gọi lên Server ===

  // Hàm Thu hồi Tin nhắn (văn bản)
  const recallMessage = useCallback(async (maTinNhan) => {
    if (connectionRef.current && connectionRef.current.state === "Connected") {
      await connectionRef.current.invoke("ThuHoiTinNhan", maTinNhan, user.id);
    } else {
      throw new Error("Kết nối SignalR không sẵn sàng");
    }
  }, [user?.id]); // Không cần thêm connectionRef.current vào dependency

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
  }, [isConnected, user?.id, maCuocTroChuyen]);

  // Hàm Gửi tin nhắn (qua service, vì nó có thể cần gọi API trước khi invoke)
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

  // === Hàm MỚI: Tải thêm tin nhắn cũ (Phân trang) ===
  const loadMoreMessages = useCallback(async () => {
    // Nếu đang tải, hoặc đã hết tin, thì không làm gì
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    // Dòng delay 2 giây của bạn để test
    console.log("ĐANG TEST: Delay 2 giây...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
        params: { 
          userId: user.id, 
          page: nextPage, 
          pageSize: PAGE_SIZE 
        },
      });

      // 🚀 FIX: Thêm .reverse() để khớp với API OrderByDescending
      const newMessages = response.data.map(mapMessage).reverse();

      // Khi tải tin CŨ, thêm vào ĐẦU danh sách
      setDanhSachTin((prev) => [...newMessages, ...prev]); 
      setPage(nextPage);
      setHasMore(newMessages.length === PAGE_SIZE); // Kiểm tra xem còn trang sau không

    } catch (error) {
      console.error("Lỗi tải tin nhắn cũ:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, maCuocTroChuyen, user?.id]); // Các dependency cho hàm tải thêm


  // === Trả về (return) tất cả state và hàm ===
  return {
    // Dữ liệu và Trạng thái
    danhSachTin,
    isConnected,
    connection: connectionRef.current, // Trả về connection để ChatBox lắng nghe sự kiện
    
    // Các hàm actions
    recallMessage,
    recallMedia,
    markAsRead,
    sendMessageService,

    // Các state và hàm mới cho phân trang
    loadMoreMessages,
    isLoadingMore,
    hasMore,
  };
};