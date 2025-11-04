// File: src/components/SocialChatViewer/VideoMessage.jsx
import React, { forwardRef } from 'react';
import { PlayCircle } from 'lucide-react';
import ParentMessagePreview from './ParentMessagePreview';
import MessageActions from './MessageActions';

// ✅ Dùng forwardRef để cha (SocialChatViewer) có thể "scroll tới" tin nhắn này
const VideoMessage = forwardRef(
  (
    {
      message,
      currentUserId,
      onStartReply,
      onOpenDeleteModal,
      onJumpToMessage, // ✅ Thêm prop để click reply có thể nhảy đến tin gốc
    },
    ref
  ) => {
    const isSender = message.maNguoiGui === currentUserId;

    // =========================
    // 1️⃣ Trường hợp tin nhắn bị thu hồi
    // =========================
    if (message.isRecalled) {
      return (
        <div
          ref={ref}
          className={`video-message-wrapper ${isSender ? 'sent' : 'received'}`}
        >
          {!isSender && (
            <img
              src={message.sender?.avatarUrl || '/default-avatar.png'}
              alt="avatar"
              className="message-avatar"
            />
          )}

          <div className="text-message-bubble recalled-bubble">
            <em>
              {isSender
                ? 'Bạn đã thu hồi một tin nhắn'
                : 'Tin nhắn đã được thu hồi'}
            </em>
          </div>

          {isSender && (
            <img
              src={message.sender?.avatarUrl || '/default-avatar.png'}
              alt="avatar"
              className="message-avatar"
            />
          )}

          <MessageActions
            message={message}
            isSender={isSender}
            onStartReply={onStartReply}
            onOpenDeleteModal={onOpenDeleteModal}
          />
        </div>
      );
    }

    // =========================
    // 2️⃣ Trường hợp tin nhắn video bình thường
    // =========================
    const shareInfo = message.share;
    if (!shareInfo || !shareInfo.previewImage) {
      return null; // Không có thông tin preview thì bỏ qua
    }

    const parts = message.noiDung.match(/\[ShareId:\d+.*?\]\s*(.*)/);
    const extraText = parts ? parts[1].trim() : '';
    const videoLink = shareInfo.shareLink || shareInfo.previewVideo;

    // =========================
    // 3️⃣ Giao diện chính
    // =========================
    return (
      <div
        ref={ref}
        className={`video-message-wrapper ${isSender ? 'sent' : 'received'}`}
      >
        {/* Avatar bên trái nếu là người nhận */}
        {!isSender && (
          <img
            src={message.sender?.avatarUrl || '/default-avatar.png'}
            alt="avatar"
            className="message-avatar"
          />
        )}

        <div className="video-content-container">
          {/* Nếu có tin nhắn cha (reply) thì hiển thị preview */}
          {message.parentMessage && (
            <div className="text-message-bubble parent-in-video">
              <ParentMessagePreview
                message={message.parentMessage}
                onJump={onJumpToMessage} // ✅ Truyền hàm click "nhảy tới tin gốc"
              />
            </div>
          )}

          {/* Card video preview */}
          <a
            href={videoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="video-message-card"
            style={{ backgroundImage: `url(${shareInfo.previewImage})` }}
          >
            <div className="video-play-icon">
              <PlayCircle size={52} strokeWidth={1.6} color="#ffffffcc" />
            </div>
            <div className="video-message-content">
              <div className="video-message-title">
                {shareInfo.previewTitle}
              </div>
            </div>
          </a>

          {/* Nếu có text phụ đi kèm video */}
          {extraText && (
            <div className="text-message-bubble extra-text-bubble">
              {extraText}
            </div>
          )}
        </div>

        {/* Avatar bên phải nếu là người gửi */}
        {isSender && (
          <img
            src={message.sender?.avatarUrl || '/default-avatar.png'}
            alt="avatar"
            className="message-avatar"
          />
        )}

        {/* Menu hành động */}
        <MessageActions
          message={message}
          isSender={isSender}
          onStartReply={onStartReply}
          onOpenDeleteModal={onOpenDeleteModal}
        />
      </div>
    );
  }
);

export default VideoMessage;
