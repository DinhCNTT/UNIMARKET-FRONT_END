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

  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const parentRef = useRef(null);
  const prevScrollHeight = useRef(0);

  // ✅ FIX CHÍNH: Estimate hợp lý + enable dynamic sizing
  const estimateSize = useCallback((index) => {
    const msg = danhSachTin[index];
    if (!msg) return 100;
    
    // Ước tính HỢP LÝ (không quá lớn, không quá nhỏ)
    if (msg.loaiTinNhan === "image" || msg.loaiTinNhan === "video") {
      return 320; // 👈 Giảm xuống 320px
    }
    if (msg.isRecalled) {
      return 70; // 👈 Giảm xuống 70px
    }
    // Text: Tính dựa trên độ dài
    const textLength = msg.noiDung?.length || 50;
    return Math.min(150, 70 + textLength * 0.3); // 👈 Max 150px
  }, [danhSachTin]);

  const rowVirtualizer = useVirtualizer({
    count: danhSachTin.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateSize, // 👈 Dùng estimate hợp lý
    overscan: 5, // 👈 Giảm overscan xuống 5
    getItemKey: (index) => danhSachTin[index]?.maTinNhan || index,
    // 👇 QUAN TRỌNG: Enable dynamic measurement
    lanes: 1,
  });

  // 👇 Callback xử lý khi media loaded
  const handleMediaLoaded = useCallback((maTinNhan) => {
    // Tìm index và measure lại chính xác item đó
    const index = danhSachTin.findIndex(msg => msg.maTinNhan === maTinNhan);
    if (index !== -1 && parentRef.current) {
      requestAnimationFrame(() => {
        const element = parentRef.current.querySelector(`[data-index="${index}"]`);
        if (element) {
          // Measure lại item cụ thể
          const height = element.getBoundingClientRect().height;
          // Force virtualizer cập nhật size
          rowVirtualizer.measureElement(element);
        }
      });
    }
  }, [danhSachTin, rowVirtualizer]);

  // Logic xử lý cuộn (Kích hoạt Phân trang)
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop } = parentRef.current;

    if (scrollTop < 5 && hasMore && !isLoadingMore) {
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

  // ✅ Effect: Measure TẤT CẢ items sau khi render
  useEffect(() => {
    if (danhSachTin.length > 0 && parentRef.current) {
      // Đợi DOM render xong
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Measure toàn bộ
          rowVirtualizer.measure();
        });
      });
    }
  }, [danhSachTin.length, rowVirtualizer]);

  // Effect: Tự cuộn xuống dưới cùng KHI MỚI VÀO CHAT
  useEffect(() => {
    if (isFirstLoad && danhSachTin.length > 0) {
      // ✅ FIX: Hiện lập tức không trượt
      const timer = setTimeout(() => {
        // Measure trước
        rowVirtualizer.measure();
        // Đợi measure xong rồi scroll
        setTimeout(() => {
          rowVirtualizer.scrollToIndex(danhSachTin.length - 1, {
            align: "end",
            behavior: "auto",
            smooth: false, // 👈 Hiện lập tức
          });
          setIsFirstLoad(false);
        }, 50); // 👈 Giảm xuống 50ms để nhanh hơn
      }, 100); // 👈 Giảm xuống 100ms
      return () => clearTimeout(timer);
    }
  }, [isFirstLoad, danhSachTin.length, rowVirtualizer]);

  // Effect: Tự cuộn khi CÓ TIN NHẮN MỚI
  const lastMessageId = danhSachTin[danhSachTin.length - 1]?.maTinNhan;
  useEffect(() => {
    if (!isFirstLoad && danhSachTin.length > 0) {
      // Measure trước rồi scroll
      requestAnimationFrame(() => {
        rowVirtualizer.measure();
        setTimeout(() => {
          rowVirtualizer.scrollToIndex(danhSachTin.length - 1, {
            align: "end",
            behavior: "smooth", // 👈 Đổi thành smooth
          });
        }, 100);
      });
    }
  }, [lastMessageId, isFirstLoad, rowVirtualizer]);

  // ✅ Giữ vị trí cuộn KHI TẢI TIN CŨ
  useLayoutEffect(() => {
    if (!isLoadingMore && prevScrollHeight.current > 0 && parentRef.current) {
      const newScrollHeight = parentRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - prevScrollHeight.current;
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (parentRef.current) {
            parentRef.current.scrollTop = scrollDiff;
            prevScrollHeight.current = 0;
          }
        });
      });
    }
  }, [isLoadingMore]);

  // Tính toán tin nhắn cuối cùng đã xem
  const lastSeenMsgId = useMemo(() => {
    if (!user) return null;
    const myMessages = danhSachTin.filter((m) => m.maNguoiGui === user.id);
    if (myMessages.length === 0) return null;

    const lastMessage = myMessages.sort(
      (a, b) => new Date(b.thoiGianGui) - new Date(a.thoiGianGui)
    )[0];

    return lastMessage.daXem ? lastMessage.maTinNhan : null;
  }, [danhSachTin, user]);

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className={styles.chatWindowWrapper}>
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
            virtualItems.map((virtualItem) => {
              const msg = danhSachTin[virtualItem.index];
              if (!msg) return null;

              return (
                <div
                  key={msg.maTinNhan}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
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
                    onMediaLoaded={handleMediaLoaded}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Thanh thông báo chặn */}
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
    </div>
  );
};

export default MessageList;