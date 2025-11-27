import React from 'react';
import './NotificationDetailModal.css';

export default function NotificationDetailModal({ open, notification, postTitle, onClose, onGoToPost }) {
  if (!open || !notification) return null;

  const msg = (notification.message || '').toString();

  // Try to extract reason and details from the server-generated message
  const reasonMatch = msg.match(/Lý do:\s*'([^']+)'/i);
  const detailsMatch = msg.match(/Chi tiết:\s*'([^']+)'/i);
  const reason = reasonMatch ? reasonMatch[1] : null;
  const details = detailsMatch ? detailsMatch[1] : null;

  // If we extracted reason/details, avoid repeating the full message body which already contains them.
  const showFullMessage = !reason && !details;

  return (
    <div className="um-notif-modal-overlay" role="dialog" aria-modal="true">
      <div className="um-notif-modal">
        <h3 className="um-notif-modal-title">{postTitle ? `Tin đăng: ${postTitle}` : notification.title}</h3>
        <div className="um-notif-modal-body">
          {reason && (
            <div className="um-notif-reason"><strong>Lý do báo cáo:</strong> {reason}</div>
          )}
          {details && (
            <div className="um-notif-details"><strong>Chi tiết:</strong> {details}</div>
          )}
          {showFullMessage && (
            <p className="um-notif-message-full">{notification.message}</p>
          )}
          <div className="um-notif-modal-time">{new Date(notification.createdAt).toLocaleString()}</div>
        </div>
        <div className="um-notif-modal-actions">
          <button className="um-btn um-btn-primary" onClick={() => onGoToPost && onGoToPost()}>
            Chuyển tới tin đăng
          </button>
          <button className="um-btn" onClick={() => onClose && onClose()}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
