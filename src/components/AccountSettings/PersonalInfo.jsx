import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import styles from "./PersonalInfo.module.css"; // Dùng CSS Module
import { getUserProfile } from "./services/userProfileService";
import { notifyError } from "./helpers/notificationService";

// Import các component con
import AvatarUploader from "./AvatarUploader";
import UserInfoForm from "./UserInfoForm";
import EmailVerification from "./EmailVerification";

const PersonalInfo = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, user, updateUser } = useContext(AuthContext); // user từ context có thể dùng cho avatar ban đầu

  // Lấy dữ liệu khi component load
  useEffect(() => {
    if (!token) {
      setError("Bạn chưa đăng nhập hoặc token đã hết hạn.");
      setLoading(false);
      return;
    }

    getUserProfile(token)
      .then((res) => {
        setInfo(res.data);
      })
      .catch(() => {
        notifyError("Không thể lấy thông tin cá nhân!");
        setError("Lỗi tải dữ liệu.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // Hàm callback để cập nhật state chung khi component con xong việc
  const handleStateUpdate = (updatedData) => {
    setInfo((prev) => ({
      ...prev,
      ...updatedData,
    }));

    // Đồng bộ ngược lại với AuthContext nếu cần
    if (updatedData.emailConfirmed !== undefined) {
      updateUser({ emailConfirmed: updatedData.emailConfirmed });
    }
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (error) return <p className={styles.errorMessage}>{error}</p>;
  if (!info) return null; // Không có thông tin

  return (
    // Bạn có thể dùng `pi-page-container` ở file cha (Page) bọc ngoài
    // Ở đây tôi chỉ dùng cardWrapper
    <div className={styles.cardWrapper}>
      <h2 className={styles.title}>Thông tin cá nhân</h2>

      {/* 1. Component Avatar */}
      <AvatarUploader
        initialAvatarUrl={user?.avatarUrl} // Lấy avatar từ context
        token={token}
      />

      {/* 2. Component Form Thông tin */}
      <UserInfoForm
        initialData={{ fullName: info.fullName, phoneNumber: info.phoneNumber }}
        token={token}
        onUpdate={(data) => handleStateUpdate(data)}
      />

      <hr className={styles.divider} />

      {/* 3. Component Xác minh Email */}
      <EmailVerification
        initialEmail={info.email}
        isConfirmed={info.emailConfirmed}
        canChange={info.canChangeEmail}
        token={token}
        onUpdate={(data) => handleStateUpdate(data)}
      />
    </div>
  );
};

export default PersonalInfo;