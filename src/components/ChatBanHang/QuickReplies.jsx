import React, { useCallback } from "react";
import Swal from "sweetalert2";
import styles from "./ModuleChatCss/QuickReplies.module.css"; // Sử dụng module CSS riêng

// Danh sách tin nhắn nhanh được định nghĩa nội bộ
const QUICK_REPLIES_LIST = [
  "Bạn có ship hàng không?",
  "Sản phẩm còn bảo hành không?",
  "Sản phẩm này đã qua sửa chữa chưa?",
  "Có phụ kiện đi kèm theo sản phẩm?",
  "Sản phẩm có lỗi gì không?",
  "Đây là hàng chính hãng hay xách tay?",
  "Sản phẩm này còn không ạ?",
  "Tôi muốn mua sản phẩm này.",
];

/**
 * Component hiển thị và xử lý các nút tin nhắn nhanh.
 * @param {object} props
 * @param {boolean} props.isDisabled - Trạng thái vô hiệu hóa chung (đang upload, bị chặn).
 * @param {boolean} props.isConnected - Trạng thái kết nối SignalR.
 * @param {function} props.sendMessageService - Hàm gửi tin nhắn từ Context.
 * @param {function} props.onQuickReplySent - Callback được gọi sau khi gửi thành công.
 */
const QuickReplies = ({
  isDisabled,
  isConnected,
  sendMessageService,
  onQuickReplySent,
}) => {
  
  // Xử lý gửi tin nhắn nhanh
  const handleQuickReply = useCallback(
    async (text) => {
      if (!text) return;

      if (isDisabled) {
        Swal.fire("Lỗi", "Không thể gửi tin nhắn lúc này.", "error");
        return;
      }

      if (!isConnected) {
        Swal.fire("Lỗi", "Kết nối SignalR không sẵn sàng!", "error");
        return;
      }

      try {
        await sendMessageService(text, "text");
        // Gọi callback về cho component cha để xử lý (ví dụ: focus input)
        if (onQuickReplySent) {
          onQuickReplySent(text);
        }
      } catch (err) {
        console.error("Quick reply send error:", err);
        Swal.fire("Lỗi", "Không thể gửi tin nhắn nhanh!", "error");
      }
    },
    [isDisabled, isConnected, sendMessageService, onQuickReplySent]
  );

  return (
    <div className={styles.quickReplies} aria-hidden={isDisabled}>
      {QUICK_REPLIES_LIST.map((q, idx) => (
        <button
          key={`qr-${idx}`}
          type="button"
          className={styles.quickReplyBtn}
          onClick={() => handleQuickReply(q)}
          disabled={isDisabled}
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export default React.memo(QuickReplies); // Bọc trong React.memo để tối ưu