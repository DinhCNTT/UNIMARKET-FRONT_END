import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import { useChat } from "../context/ChatContext";
import MessageItem from "./MessageItem";
import styles from "../ModuleChatCss/MessageList.module.css";
import { MessageSquareText } from "lucide-react";
import { FaBan } from "react-icons/fa";
import { useVirtualizer } from "@tanstack/react-virtual";

const MessageList = () => {
  const {
    danhSachTin,
    user,
    markAsRead,
    isBlockedByMe,
    isBlockedByOther,
    loadMoreMessages,
    isLoadingMore,
    hasMore,
  } = useChat();

  // console.log("MessageList render, isLoadingMore:", isLoadingMore);

  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const parentRef = useRef(null);
  const prevScrollHeight = useRef(0);

  const rowVirtualizer = useVirtualizer({
    count: danhSachTin.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Nhớ chỉnh lại số này cho đúng
    overscan: 20,
  });

  // Logic xử lý cuộn (Kích hoạt Phân trang)
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop } = parentRef.current;

    // Nới lỏng điều kiện
    if (scrollTop < 5 && hasMore && !isLoadingMore) {
      // console.log("ĐÃ CUỘN LÊN ĐỈNH! Đang gọi loadMoreMessages...");
      prevScrollHeight.current = parentRef.current.scrollHeight;
      loadMoreMessages();
    }
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  // Effect: Đánh dấu đã xem
  useEffect(() => {
    const timer = setTimeout(() => {
      markAsRead();
    }, 500);
    return () => clearTimeout(timer);
  }, [danhSachTin.length, markAsRead]);

  // Effect: Reset isFirstLoad khi đổi cuộc trò chuyện
  useEffect(() => {
    setIsFirstLoad(true);
  }, [user, markAsRead]);

  // Effect: Tự cuộn xuống dưới cùng KHI MỚI VÀO CHAT
  useEffect(() => {
    if (isFirstLoad && danhSachTin.length > 0) {
      rowVirtualizer.scrollToIndex(danhSachTin.length - 1, {
        align: "end",
        behavior: "auto", // 'auto' là đúng khi mới tải trang
      });
      setIsFirstLoad(false);
    }
  }, [isFirstLoad, danhSachTin.length, rowVirtualizer]);

  // Effect: Tự cuộn khi CÓ TIN NHẮN MỚI
  const lastMessageId = danhSachTin[danhSachTin.length - 1]?.maTinNhan;
  useEffect(() => {
    if (!isFirstLoad && danhSachTin.length > 0) {
      //
      // 🚀 FIX: Sửa 'smooth' thành 'auto'
      // 'auto' là dịch chuyển tức thời, sẽ hết lỗi
      //
      rowVirtualizer.scrollToIndex(danhSachTin.length - 1, {
        align: "end",
        behavior: "auto", // <--- SỬA LỖI Ở ĐÂY
      });
    }
  }, [lastMessageId, isFirstLoad, rowVirtualizer]); // Chạy khi tin nhắn cuối cùng thay đổi

  // Effect: Giữ vị trí cuộn KHI TẢI TIN CŨ
  useLayoutEffect(() => {
    if (!isLoadingMore && prevScrollHeight.current > 0 && parentRef.current) {
      const newScrollHeight = parentRef.current.scrollHeight;
      parentRef.current.scrollTop = newScrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = 0;
    }
  }, [isLoadingMore]);

  // Tính toán tin nhắn cuối cùng đã xem
  const lastSeenMsgId = useMemo(() => {
    if (!user) return null;
    const myMessages = danhSachTin.filter((m) => m.maNguoiGui === user.id);
    if (myMessages.length === 0) return null;

    // Sắp xếp lại để lấy tin nhắn cuối cùng
    const lastMessage = myMessages.sort(
      (a, b) => new Date(b.thoiGianGui) - new Date(a.thoiGianGui)
    )[0];

    return lastMessage.daXem ? lastMessage.maTinNhan : null;
  }, [danhSachTin, user]);

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    /* FIX BƯỚC 1: Thêm <div> cha làm "mỏ neo"
      Nó KHÔNG cuộn, và có position: relative
    */
    <div className={styles.chatWindowWrapper}>
      {/* FIX BƯỚC 2: Đây là <div> CŨ của bạn, GIỜ CHỈ ĐỂ CUỘN 
      */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className={styles.chatboxMessages}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {/* Hiển thị spinner */}
          {isLoadingMore && (
            <div className={styles.loadingMore}>
              <div className={styles.spinner}></div>
            </div>
          )}

          {/* Kiểm tra rỗng */}
          {!isLoadingMore && danhSachTin.length === 0 ? (
            <div className={styles.chatboxEmptyChat}>
              <div className={styles.chatboxEmptyIcon}>
                <MessageSquareText size={70} className="text-gray-400" />
              </div>
              <p className={styles.emptyText}>Chưa có tin nhắn nào</p>
              <p className={styles.emptyText}>Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          ) : (
            // Dùng virtualItems.map()
            virtualItems.map((virtualItem) => {
              // Kiểm tra msg có tồn tại
              const msg = danhSachTin[virtualItem.index];
              if (!msg) return null; // Thêm kiểm tra an toàn

              return (
                <div
                  key={msg.maTinNhan}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualItem.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <MessageItem
                    message={msg}
                    showSeenStatus={msg.maTinNhan === lastSeenMsgId}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* FIX BƯỚC 3: XÓA thanh thông báo chặn ra khỏi <div> cuộn này
        */}
      </div>
      {/* (Đóng .chatboxMessages) */}

      {/* FIX BƯỚC 4: DÁN thanh thông báo chặn VÀO ĐÂY
        (Nằm bên ngoài div cuộn, nhưng bên trong div "mỏ neo")
      */}
      {(isBlockedByMe || isBlockedByOther) && (
        <div className={styles.blockedNotice}>
          <FaBan size={24} />
          <p>
            {isBlockedByMe
              ? "Bạn đã chặn người dùng này."
              : "Bạn đã bị chặn bởi người dùng này."}
          </p>
        </div>
      )}
    </div> /* (Đóng .chatWindowWrapper) */
  );
};

export default MessageList;