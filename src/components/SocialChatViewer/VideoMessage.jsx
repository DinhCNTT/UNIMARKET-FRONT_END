import React, { forwardRef } from 'react';
import { PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom'; // ✅ Thêm Link
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
      onJumpToMessage, // ✅ Dùng để nhảy đến tin gốc
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

    // ✅ Lấy thông tin quan trọng từ shareInfo
    const tinDangId = shareInfo.tinDangId || shareInfo.shareId;
    const videoUrl = shareInfo.previewVideo;

    // ✅ Tạo "shallow video" gửi qua state
    const shallowVideoData = {
      maTinDang: tinDangId,
      tieuDe: shareInfo.previewTitle,
      thumbnail: shareInfo.previewImage,
      videoUrl: videoUrl,
    };

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
                onJump={onJumpToMessage}
              />
            </div>
          )}

          {/* ✅ Thay thế <a> bằng <Link> để điều hướng nội bộ */}
          <Link
            to={`/liked-videos/${tinDangId}`} // <-- route LikedVideoDetailViewer
            state={{
              videos: [shallowVideoData],
              initialIndex: 0,
            }}
            target="_blank" // ✅ Mở tab mới
            rel="noopener noreferrer"
            className="video-message-card"
            style={{ backgroundImage: `url(${shareInfo.previewImage})` }}
            onClick={(e) => e.stopPropagation()} // Ngăn click nổi bọt
          >
            <div className="video-play-icon">
              <PlayCircle size={52} strokeWidth={1.6} color="#ffffffcc" />
            </div>
            <div className="video-message-content">
              <div className="video-message-title">
                {shareInfo.previewTitle}
              </div>
            </div>
          </Link>
          {/* ✅ Kết thúc thẻ Link */}

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

        {/* Menu hành động (Reply / Xóa) */}
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
