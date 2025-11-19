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

  // Estimate size hợp lý
  const estimateSize = useCallback(
    (index) => {
      const msg = danhSachTin[index];
      if (!msg) return 100;

      if (msg.loaiTinNhan === "image" || msg.loaiTinNhan === "video") {
        return 320;
      }

      if (msg.isRecalled) {
        return 70;
      }

      const textLength = msg.noiDung?.length || 50;

      return Math.min(1000, 70 + textLength * 0.3);
    },
    [danhSachTin]
  );

  const rowVirtualizer = useVirtualizer({
    count: danhSachTin.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
    getItemKey: (index) => danhSachTin[index]?.maTinNhan || index,
    lanes: 1,
  });

  // Khi media load xong → đo lại item
  const handleMediaLoaded = useCallback(
    (maTinNhan) => {
      const index = danhSachTin.findIndex((msg) => msg.maTinNhan === maTinNhan);
      if (index !== -1 && parentRef.current) {
        requestAnimationFrame(() => {
          const element = parentRef.current.querySelector(
            `[data-index="${index}"]`
          );
          if (element) {
            rowVirtualizer.measureElement(element);
          }
        });
      }
    },
    [danhSachTin, rowVirtualizer]
  );

  // Xử lý scroll để load thêm
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop } = parentRef.current;

    if (scrollTop < 5 && hasMore && !isLoadingMore) {
      prevScrollHeight.current = parentRef.current.scrollHeight;
      loadMoreMessages();
    }
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  // Đánh dấu đã xem
  useEffect(() => {
    const timer = setTimeout(() => {
      markAsRead();
    }, 500);
    return () => clearTimeout(timer);
  }, [danhSachTin.length, markAsRead]);

  // Reset khi đổi cuộc trò chuyện
  useEffect(() => {
    setIsFirstLoad(true);
  }, [user, markAsRead]);

  // Tự cuộn xuống khi mở chat lần đầu
  useEffect(() => {
    if (isFirstLoad && danhSachTin.length > 0) {
      const timer = setTimeout(() => {
        rowVirtualizer.measure();
        setTimeout(() => {
          rowVirtualizer.scrollToIndex(danhSachTin.length - 1, {
            align: "end",
            behavior: "auto",
            smooth: false,
          });
          setIsFirstLoad(false);
        }, 50);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isFirstLoad, danhSachTin.length, rowVirtualizer]);

  // Cuộn khi có tin nhắn mới
  const lastMessageId = danhSachTin[danhSachTin.length - 1]?.maTinNhan;
  useEffect(() => {
    if (!isFirstLoad && danhSachTin.length > 0) {
      requestAnimationFrame(() => {
        rowVirtualizer.measure();
        setTimeout(() => {
          rowVirtualizer.scrollToIndex(danhSachTin.length - 1, {
            align: "end",
            behavior: "smooth",
          });
        }, 100);
      });
    }
  }, [lastMessageId, isFirstLoad, rowVirtualizer]);

  // Giữ vị trí khi load tin cũ
  useLayoutEffect(() => {
    if (!isLoadingMore && prevScrollHeight.current > 0 && parentRef.current) {
      const newScrollHeight = parentRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeight.current;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (parentRef.current) {
            parentRef.current.scrollTop = diff;
            prevScrollHeight.current = 0;
          }
        });
      });
    }
  }, [isLoadingMore]);

  // Tin nhắn cuối đã xem
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
          {isLoadingMore && (
            <div className={styles.loadingMore}>
              <div className={styles.spinner}></div>
            </div>
          )}

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
