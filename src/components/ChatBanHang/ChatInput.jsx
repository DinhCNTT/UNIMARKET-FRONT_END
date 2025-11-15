import React, { useState, useRef, useCallback } from "react";
import { useChat } from "./context/ChatContext";
import { FaImage, FaVideo, FaPaperPlane, FaTimes } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import styles from './ModuleChatCss/ChatInput.module.css';

const CLOUDINARY_UPLOAD_PRESET = "unimarket_upload";
const CLOUDINARY_CLOUD_NAME = "dcwe8drcu";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

const ChatInput = ({ tinNhan, setTinNhan, isUploading, setIsUploading, isDisabled, inputRef }) => {
  const { isConnected, isBlockedByMe, isBlockedByOther, sendMessageService } = useChat();

  const [imagePreviewList, setImagePreviewList] = useState([]);
  const [videoPreviewList, setVideoPreviewList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const abortControllerRef = useRef(null);
  const fileInputImageRef = useRef(null);
  const fileInputVideoRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const images = files.filter(f => f.type.startsWith("image/"));
    const videos = files.filter(f => f.type.startsWith("video/"));

    if (images.length > 0) {
      const validImages = images.filter(f => {
        if (f.size > MAX_FILE_SIZE) {
          Swal.fire("Lỗi", `Ảnh "${f.name}" quá lớn (tối đa 10MB)!`, "error");
          return false;
        }
        return true;
      }).slice(0, MAX_FILES - imagePreviewList.length);
      setImagePreviewList(prev => [...prev, ...validImages]);
    }

    if (videos.length > 0) {
      const validVideos = videos.filter(f => {
        if (f.size > MAX_FILE_SIZE) {
          Swal.fire("Lỗi", `Video "${f.name}" quá lớn (tối đa 10MB)!`, "error");
          return false;
        }
        return true;
      }).slice(0, MAX_FILES - videoPreviewList.length);
      setVideoPreviewList(prev => [...prev, ...validVideos]);
    }
  }, [imagePreviewList.length, videoPreviewList.length]);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file && file.size <= MAX_FILE_SIZE) {
          setImagePreviewList(prev => {
            if (prev.length >= MAX_FILES) {
              Swal.fire("Cảnh báo", `Chỉ được chọn tối đa ${MAX_FILES} ảnh!`, "warning");
              return prev;
            }
            return [...prev, file];
          });
        } else if (file) {
          Swal.fire("Lỗi", "Ảnh dán quá lớn (tối đa 10MB)!", "error");
        }
      }
    }
  }, []);

  const uploadToCloudinary = useCallback(async (file, onProgress) => {
    if (file.size > MAX_FILE_SIZE) {
      Swal.fire("Lỗi", `File "${file.name}" quá lớn. Tối đa 10MB!`, "error");
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "doan-chat");

    abortControllerRef.current = new AbortController();

    try {
      const { data } = await axios.post(CLOUDINARY_URL, formData, {
        signal: abortControllerRef.current.signal,
        timeout: 30000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        }
      });
      return data.secure_url;
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Upload cancelled");
        return null;
      }
      console.error("Upload error:", err);
      Swal.fire("Lỗi", `Không thể upload "${file.name}"!`, "error");
      return null;
    }
  }, []);

  const handleFileInputChange = useCallback((e, type) => {
    const files = Array.from(e.target.files);

    if (type === "image") {
      const currentTotal = imagePreviewList.length;
      if (currentTotal + files.length > MAX_FILES) {
        Swal.fire("Cảnh báo", `Chỉ được chọn tối đa ${MAX_FILES} ảnh!`, "warning");
        return;
      }

      const validImages = files.filter((f) => {
        if (!f.type.startsWith("image")) return false;
        if (f.size > MAX_FILE_SIZE) {
          Swal.fire("Lỗi", `Ảnh "${f.name}" quá lớn (tối đa 10MB)!`, "error");
          return false;
        }
        return true;
      });
      setImagePreviewList((prev) => [...prev, ...validImages]);
    } else {
      const currentTotal = videoPreviewList.length;
      if (currentTotal + files.length > MAX_FILES) {
        Swal.fire("Cảnh báo", `Chỉ được chọn tối đa ${MAX_FILES} video!`, "warning");
        return;
      }

      const validVideos = files.filter((f) => {
        if (!f.type.startsWith("video")) return false;
        if (f.size > MAX_FILE_SIZE) {
          Swal.fire("Lỗi", `Video "${f.name}" quá lớn (tối đa 10MB)!`, "error");
          return false;
        }
        return true;
      });
      setVideoPreviewList((prev) => [...prev, ...validVideos]);
    }
    e.target.value = null;
  }, [imagePreviewList.length, videoPreviewList.length]);

  const removeImagePreview = useCallback((idx) => {
    setImagePreviewList((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const removeVideoPreview = useCallback((idx) => {
    setVideoPreviewList((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSend = useCallback(async () => {
    if (!tinNhan.trim() && imagePreviewList.length === 0 && videoPreviewList.length === 0) {
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

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (tinNhan.trim()) {
        await sendMessageService(tinNhan.trim(), "text");
        setTinNhan("");
      }

      const totalFiles = imagePreviewList.length + videoPreviewList.length;
      let uploadedCount = 0;

      if (imagePreviewList.length > 0) {
        const imageUploads = imagePreviewList.map(async (file) => {
          const url = await uploadToCloudinary(file, (progress) => {
            const fileProgress = (uploadedCount / totalFiles) * 100;
            setUploadProgress(fileProgress + (progress / totalFiles));
          });
          uploadedCount++;
          if (url) {
            await sendMessageService(url, "image");
          }
          return url;
        });
        await Promise.allSettled(imageUploads);
      }

      if (videoPreviewList.length > 0) {
        const videoUploads = videoPreviewList.map(async (file) => {
          const url = await uploadToCloudinary(file, (progress) => {
            const fileProgress = (uploadedCount / totalFiles) * 100;
            setUploadProgress(fileProgress + (progress / totalFiles));
          });
          uploadedCount++;
          if (url) {
            await sendMessageService(url, "video");
          }
          return url;
        });
        await Promise.allSettled(videoUploads);
      }

      setUploadProgress(100);
      setImagePreviewList([]);
      setVideoPreviewList([]);
      inputRef.current?.focus();
    } catch (err) {
      Swal.fire("Lỗi", err.message || "Không thể gửi tin nhắn!", "error");
      console.error("Send error:", err);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 300);
    }
  }, [
    tinNhan, imagePreviewList, videoPreviewList, isBlockedByOther,
    isBlockedByMe, isConnected, sendMessageService, uploadToCloudinary,
    setIsUploading, setTinNhan, inputRef
  ]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Listen for quick-reply events to send immediately in this chat context
  React.useEffect(() => {
    const onQuickReply = async (e) => {
      const text = e?.detail?.text;
      if (!text) return;
      try {
        // Use the context sendMessageService if available
        if (sendMessageService) {
          await sendMessageService(text.trim(), 'text');
        } else {
          // fallback: set input and call handleSend
          setTinNhan(text);
          await handleSend();
        }
      } catch (err) {
        console.error('Lỗi gửi quick-reply (ChatBanHang):', err);
      }
    };
    window.addEventListener('quick-reply', onQuickReply);
    return () => window.removeEventListener('quick-reply', onQuickReply);
  }, [sendMessageService, handleSend, setTinNhan]);

  const handleTextChange = useCallback((e) => {
    setTinNhan(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  }, [setTinNhan]);

  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      imagePreviewList.forEach(file => {
        if (file) URL.revokeObjectURL(URL.createObjectURL(file));
      });
      videoPreviewList.forEach(file => {
        if (file) URL.revokeObjectURL(URL.createObjectURL(file));
      });
    };
  }, [imagePreviewList, videoPreviewList]);

  return (
    <div
      className={`${styles.chatInput} ${isDragging ? styles.dragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragContent}>
            <FaImage size={48} />
            <p>Thả file vào đây để upload</p>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className={styles.warning}>
          ⚠️ Mất kết nối. Đang thử kết nối lại...
        </div>
      )}

      {isUploading && (
        <div className={styles.uploadProgress}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
          </div>
          <span className={styles.progressText}>
            Đang upload... {Math.round(uploadProgress)}%
          </span>
        </div>
      )}

      {(imagePreviewList.length > 0 || videoPreviewList.length > 0) && (
        <div className={styles.previews}>
          {imagePreviewList.map((file, idx) => (
            <div key={`img-${idx}-${file.name}`} className={styles.thumb}>
              <button
                className={styles.thumbRemove}
                onClick={() => removeImagePreview(idx)}
                aria-label="Xóa ảnh"
              >
                <FaTimes />
              </button>
              <img src={URL.createObjectURL(file)} alt={`preview-img-${idx}`} loading="lazy" />
              <div className={styles.thumbInfo}>
                <span>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
              </div>
            </div>
          ))}
          {videoPreviewList.map((file, idx) => (
            <div key={`vid-${idx}-${file.name}`} className={styles.thumb}>
              <button
                className={styles.thumbRemove}
                onClick={() => removeVideoPreview(idx)}
                aria-label="Xóa video"
              >
                <FaTimes />
              </button>
              <video src={URL.createObjectURL(file)} controls preload="metadata" />
              <div className={styles.thumbInfo}>
                <span>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={styles.inputWrap}
        style={{
          opacity: isDisabled ? 0.5 : 1,
          pointerEvents: isDisabled ? "none" : "auto",
        }}
      >
        <div className={styles.actions}>
          <label className={styles.actionBtn} title="Chọn ảnh">
            <FaImage size={20} />
            <input
              ref={fileInputImageRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => handleFileInputChange(e, "image")}
              accept="image/*"
              multiple
              disabled={isDisabled}
            />
          </label>
          <label className={styles.actionBtn} title="Chọn video">
            <FaVideo size={20} />
            <input
              ref={fileInputVideoRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => handleFileInputChange(e, "video")}
              accept="video/*"
              multiple
              disabled={isDisabled}
            />
          </label>
        </div>

        <div className={styles.textWrap}>
          <textarea
            ref={inputRef}
            value={tinNhan}
            onChange={handleTextChange}
            onPaste={handlePaste}
            placeholder={
              isUploading
                ? "Đang upload..."
                : isDisabled
                ? "Không thể gửi tin nhắn"
                : "Aa"
            }
            disabled={isDisabled}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>

        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={
            isDisabled ||
            !(tinNhan.trim() || imagePreviewList.length || videoPreviewList.length)
          }
          aria-label="Gửi tin nhắn"
          title="Gửi"
        >
          <FaPaperPlane size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;