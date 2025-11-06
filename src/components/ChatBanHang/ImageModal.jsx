import React from "react";
import { useChat } from "./context/ChatContext";
import { FaTimes } from "react-icons/fa";

const ImageModal = () => {
  // Lấy state và hàm từ ChatBox (thông qua Context)
  const { modalImage, closeImageModal } = useChat();

  if (!modalImage) return null;

  return (
    <div className="media-modal-overlay" onClick={closeImageModal}>
      <div
        className="media-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="media-modal-close" onClick={closeImageModal}>
          <FaTimes size={24} />
        </button>
        <img
          src={modalImage}
          alt="Phóng to ảnh"
          className="media-modal-image"
        />
      </div>
    </div>
  );
};

export default ImageModal;