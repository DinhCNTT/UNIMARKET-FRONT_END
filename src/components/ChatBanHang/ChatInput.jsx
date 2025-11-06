import React, { useState, useRef } from "react";
import { useChat } from "./context/ChatContext";
import { FaImage, FaVideo } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";

// Constants (di chuyển từ ChatBox.jsx)
const CLOUDINARY_UPLOAD_PRESET = "unimarket_upload";
const CLOUDINARY_CLOUD_NAME = "dcwe8drcu";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

const ChatInput = () => {
  const { isConnected, isBlockedByMe, isBlockedByOther, sendMessageService } =
    useChat();

  // === State riêng của Input ===
  const [tinNhan, setTinNhan] = useState("");
  const [imagePreviewList, setImagePreviewList] = useState([]);
  const [videoPreviewList, setVideoPreviewList] = useState([]);
  const inputRef = useRef(null);

  // === Helpers (di chuyển từ ChatBox.jsx) ===
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "doan-chat");
    try {
      const { data } = await axios.post(CLOUDINARY_URL, formData);
      return data.secure_url;
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire("Lỗi", "Không thể upload file lên Cloudinary!", "error");
      return null;
    }
  };

  // === Handlers (di chuyển từ ChatBox.jsx) ===
  const handleFileInputChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === "image") {
      setImagePreviewList((prev) => [
        ...prev,
        ...files.filter((f) => f.type.startsWith("image")),
      ]);
    } else {
      setVideoPreviewList((prev) => [
        ...prev,
        ...files.filter((f) => f.type.startsWith("video")),
      ]);
    }
    e.target.value = null; // Reset input
  };

  const handleSend = async () => {
    if (
      !tinNhan.trim() &&
      imagePreviewList.length === 0 &&
      videoPreviewList.length === 0
    ) {
      Swal.fire("Lỗi", "Vui lòng nhập tin nhắn hoặc gửi ảnh/video", "error");
      return;
    }

    if (isBlockedByOther || isBlockedByMe) {
      Swal.fire("Lỗi", "Không thể gửi tin nhắn vì bạn đã bị chặn.", "error");
      return;
    }

    if (!isConnected) {
      Swal.fire("Lỗi", "Kết nối SignalR không sẵn sàng!", "error");
      return;
    }

    try {
      // 1. Gửi tin nhắn text
      if (tinNhan.trim()) {
        await sendMessageService(tinNhan.trim(), "text");
      }

      // 2. Gửi ảnh
      for (const file of imagePreviewList) {
        const url = await uploadToCloudinary(file);
        if (url) {
          await sendMessageService(url, "image");
        }
      }

      // 3. Gửi video
      for (const file of videoPreviewList) {
        const url = await uploadToCloudinary(file);
        if (url) {
          await sendMessageService(url, "video");
        }
      }

      // 4. Reset state của input
      setTinNhan("");
      setImagePreviewList([]);
      setVideoPreviewList([]);
      inputRef.current?.focus();
    } catch (err) {
      Swal.fire("Lỗi", err.message || "Không thể gửi tin nhắn!", "error");
      console.error("Send error:", err);
    }
  };

  const isDisabled = isBlockedByMe || isBlockedByOther;

  return (
    <div className="chatbox-input-container">
      {!isConnected && (
        <div className="connection-warning">
          ⚠️ Mất kết nối. Đang thử kết nối lại...
        </div>
      )}

      <div
        className="chatbox-input"
        style={{
          opacity: isDisabled ? 0.5 : 1,
          pointerEvents: isDisabled ? "none" : "auto",
        }}
      >
        <div className="chatbox-media-upload-group">
          <label className="chatbox-media-upload-label">
            <FaImage size={28} />
            <input
              type="file" style={{ display: "none" }}
              onChange={(e) => handleFileInputChange(e, "image")}
              accept="image/*" multiple
            />
          </label>
          <label className="chatbox-media-upload-label">
            <FaVideo size={28} />
            <input
              type="file" style={{ display: "none" }}
              onChange={(e) => handleFileInputChange(e, "video")}
              accept="video/*" multiple
            />
          </label>
        </div>

        <div className="input-field">
          <textarea
            ref={inputRef}
            value={tinNhan}
            onChange={(e) => setTinNhan(e.target.value)}
            placeholder={isDisabled ? "Không thể gửi tin nhắn" : "Nhập tin nhắn..."}
            disabled={isDisabled}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={
            isDisabled ||
            !(
              tinNhan.trim() ||
              imagePreviewList.length ||
              videoPreviewList.length
            )
          }
        >
          ➔
        </button>
      </div>

      <div className="chatbox-media-preview-list">
        {imagePreviewList.map((file, idx) => (
          <div key={idx} className="chatbox-media-thumb">
            <button
              className="chatbox-media-thumb-remove"
              onClick={() =>
                setImagePreviewList(imagePreviewList.filter((_, i) => i !== idx))
              }
            >
              ×
            </button>
            <img src={URL.createObjectURL(file)} alt={`preview-img-${idx}`} />
          </div>
        ))}
        {videoPreviewList.map((file, idx) => (
          <div key={idx} className="chatbox-media-thumb">
            <button
              className="chatbox-media-thumb-remove"
              onClick={() =>
                setVideoPreviewList(videoPreviewList.filter((_, i) => i !== idx))
              }
            >
              ×
            </button>
            <video src={URL.createObjectURL(file)} controls />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatInput;