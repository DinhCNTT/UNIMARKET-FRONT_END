import React, { useState, useEffect, useContext } from "react";
import styles from "./PersonalInfo.module.css";
import defaultAvatar from "../../assets/default-avatar.png";
import { notifyPromise } from "./helpers/notificationService";
import { uploadAvatar } from "./services/userProfileService";
import { AuthContext } from "../../context/AuthContext";

const AvatarUploader = ({ initialAvatarUrl, token }) => {
  const { updateUser } = useContext(AuthContext);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl || defaultAvatar);
  const [isUploading, setIsUploading] = useState(false);

  // Cập nhật preview khi avatar từ context (cha) thay đổi
  useEffect(() => {
    setAvatarPreview(initialAvatarUrl || defaultAvatar);
  }, [initialAvatarUrl]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append("avatar", avatarFile);
    setIsUploading(true);

    const promise = uploadAvatar(token, formData);

    notifyPromise(promise, {
      loading: "Đang cập nhật ảnh...",
      success: (res) => {
        const { avatarUrl } = res.data;
        updateUser({ avatarUrl }); // Cập nhật context
        setAvatarFile(null); // Xóa file đã chọn
        return "Cập nhật ảnh đại diện thành công!";
      },
      error: "Lỗi khi cập nhật ảnh đại diện!",
    }).finally(() => {
        setIsUploading(false);
    });
  };

  const triggerFileInput = () => {
    document.getElementById("avatar-upload-input").click();
  };

  return (
    <div className={styles.avatarSection}>
      <img
        src={avatarPreview}
        alt="Avatar"
        className={styles.avatarPreview}
      />

      {/* Input ẩn để chọn file */}
      <input
        id="avatar-upload-input"
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        style={{ display: "none" }}
      />

      {/* Nút dấu + để mở input */}
      <button
        type="button"
        className={styles.avatarUploadBtn}
        onClick={triggerFileInput}
        title="Tải ảnh đại diện mới"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#2ecc40" />
          <rect x="11" y="6" width="2" height="12" rx="1" fill="white" />
          <rect x="6" y="11" width="12" height="2" rx="1" fill="white" />
        </svg>
      </button>

      {/* Nút Cập nhật ảnh, chỉ hiện khi có file mới */}
      {avatarFile && (
        <button
          className={styles.button}
          onClick={handleAvatarUpload}
          disabled={isUploading}
        >
          {isUploading ? "Đang tải..." : "Cập nhật ảnh"}
        </button>
      )}
    </div>
  );
};

export default AvatarUploader;