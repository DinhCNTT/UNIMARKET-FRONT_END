import React from 'react';


const DeleteMessageModal = ({ message, currentUserId, onConfirm, onClose }) => {
  if (!message) return null;

  const isMyMessage = message.maNguoiGui === currentUserId;

  const title = isMyMessage ? "Thu hồi tin nhắn?" : "Gỡ tin nhắn ở phía bạn?";
  const bodyText = isMyMessage
    ? "Tin nhắn này sẽ bị thu hồi với mọi người trong đoạn chat. Những người khác có thể đã xem hoặc chuyển tiếp tin nhắn đó."
    : "Tin nhắn này sẽ bị gỡ khỏi thiết bị của bạn, nhưng vẫn hiển thị với các thành viên khác trong đoạn chat.";
  const confirmButtonText = isMyMessage ? "Thu hồi" : "Gỡ";

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-message-box" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{bodyText}</p>
        <div className="delete-modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>
            Hủy
          </button>
          <button className="modal-btn confirm-delete" onClick={onConfirm}>
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
