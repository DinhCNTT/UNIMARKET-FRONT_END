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
  const scrollContainerRef = useRef(null);
  
  // Biến dùng để thực hiện "ảo thuật" giữ vị trí
  const prevScrollHeight = useRef(0);
  const prevScrollTop = useRef(0);

  // 1. XỬ LÝ SỰ KIỆN CUỘN
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight } = scrollContainerRef.current;

    if (scrollTop < 50 && hasMore && !isLoadingMore) {
      // 📸 CHỤP ẢNH LẠI
      prevScrollHeight.current = scrollHeight;
      prevScrollTop.current = scrollTop;
      loadMoreMessages();
    }
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  // 2. GIỮ VỊ TRÍ (CHỐNG NHẢY)
  useLayoutEffect(() => {
    // Nếu có snapshot cũ (đang load more)
    if (prevScrollHeight.current > 0 && scrollContainerRef.current) {
      const currentScrollHeight = scrollContainerRef.current.scrollHeight;
      const heightDifference = currentScrollHeight - prevScrollHeight.current;

      // Nếu chiều cao tăng lên (tin nhắn cũ đã chèn vào)
      if (heightDifference > 0) {
        // Dịch chuyển thanh cuộn
        scrollContainerRef.current.scrollTop = prevScrollTop.current + heightDifference;
      }
      
      // 🔥 QUAN TRỌNG: KHÔNG ĐƯỢC RESET prevScrollHeight Ở ĐÂY!!!
      // Nếu reset ở đây, useEffect bên dưới sẽ tưởng là tin nhắn mới và kéo xuống đáy.
    }
  }, [danhSachTin.length]);

  // 3. TỰ CUỘN XUỐNG ĐÁY (Logic đã sửa)
  useEffect(() => {
    if (danhSachTin.length > 0) {
      // TRƯỜNG HỢP 1: Đang load tin cũ (Biến snapshot > 0)
      if (prevScrollHeight.current > 0) {
        // Chúng ta đã xử lý vị trí ở useLayoutEffect rồi.
        // Bây giờ mới là lúc an toàn để reset biến này về 0.
        // Và TUYỆT ĐỐI KHÔNG cuộn xuống đáy.
        prevScrollHeight.current = 0;
        prevScrollTop.current = 0;
      } 
      // TRƯỜNG HỢP 2: Tin nhắn mới (Gửi đi hoặc nhận được) hoặc Lần đầu vào
      else {
        if (scrollContainerRef.current) {
          const { scrollHeight, clientHeight } = scrollContainerRef.current;
          const maxScrollTop = scrollHeight - clientHeight;
          
          scrollContainerRef.current.scrollTo({
              top: maxScrollTop,
              behavior: isFirstLoad ? "auto" : "smooth"
          });
          
          if (isFirstLoad) setIsFirstLoad(false);
        }
      }
    }
  }, [danhSachTin.length, isFirstLoad]);

  // Đánh dấu đã xem
  useEffect(() => {
    const timer = setTimeout(() => {
      markAsRead();
    }, 1000);
    return () => clearTimeout(timer);
  }, [danhSachTin.length, markAsRead]);

  // Reset khi đổi chat
  useEffect(() => {
    setIsFirstLoad(true);
    prevScrollHeight.current = 0;
  }, [user, markAsRead]);

  const lastSeenMsgId = useMemo(() => {
    if (!user) return null;
    const myMessages = danhSachTin.filter((m) => m.maNguoiGui === user.id);
    if (myMessages.length === 0) return null;
    const lastMessage = myMessages[myMessages.length - 1];
    return lastMessage?.daXem ? lastMessage.maTinNhan : null;
  }, [danhSachTin, user]);

  return (
    <div className={styles.chatWindowWrapper}>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={styles.chatboxMessages}
        style={{ overflowAnchor: "none" }} 
      >
        {isLoadingMore && (
          <div className={styles.loadingMore}>
            <div className={styles.spinner}></div>
          </div>
        )}

        {danhSachTin.length === 0 && !isLoadingMore ? (
          <div className={styles.chatboxEmptyChat}>
            <div className={styles.chatboxEmptyIcon}>
              <MessageSquareText size={70} className="text-gray-400" />
            </div>
            <p className={styles.emptyText}>Chưa có tin nhắn nào</p>
            <p className={styles.emptyText}>Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {danhSachTin.map((msg, index) => (
              <MessageItem
                key={msg.maTinNhan} 
                message={msg}
                showSeenStatus={msg.maTinNhan === lastSeenMsgId}
                onResize={() => {}} 
                isFirstMessage={index === 0}
              />
            ))}
          </div>
        )}
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