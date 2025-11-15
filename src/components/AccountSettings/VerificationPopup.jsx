import React, { useState } from "react";
import styles from "./PersonalInfo.module.css";
import { notifyError, notifySuccess } from "./helpers/notificationService";
import { verifyCode } from "./services/userProfileService";

const VerificationPopup = ({ email, token, onClose, onVerified }) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!code) {
      notifyError("Vui lòng nhập mã xác minh.");
      return;
    }
    setIsVerifying(true);
    try {
      await verifyCode(token, email, code);
      notifySuccess("Email đã được xác minh!");
      onVerified(); // Báo cho cha biết đã xác minh xong
      onClose(); // Đóng popup
    } catch (err) {
      const msg = err.response?.data?.message || "Mã không đúng hoặc hết hạn.";
      notifyError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
        <h3>Xác minh Email</h3>
        <p>Một mã xác minh đã được gửi đến {email}.</p>
        <input
          className={styles.input}
          placeholder="Nhập mã xác minh"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <div className={styles.popupActions}>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={onClose}
            disabled={isVerifying}
          >
            Đóng
          </button>
          <button
            className={styles.button}
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? "Đang xác minh..." : "Xác minh"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPopup;