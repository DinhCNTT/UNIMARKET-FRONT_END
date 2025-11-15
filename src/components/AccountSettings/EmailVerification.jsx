import React, { useState, useEffect } from "react";
import styles from "./PersonalInfo.module.css";
import VerificationPopup from "./VerificationPopup.jsx";
import { FaCheckCircle } from "react-icons/fa";
import { notifyPromise, notifyError } from "./helpers/notificationService";
import { updateEmail, sendVerificationCode } from "./services/userProfileService";

const EmailVerification = ({ initialEmail, isConfirmed, canChange, token, onUpdate }) => {
  const [newEmail, setNewEmail] = useState(initialEmail);
  const [showPopup, setShowPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setNewEmail(initialEmail);
  }, [initialEmail]);

  // 1. Cập nhật email mới (chưa xác minh)
  const handleUpdateEmail = async () => {
    if (newEmail === initialEmail) {
      notifyError("Vui lòng nhập email khác với email hiện tại.");
      return;
    }

    setIsProcessing(true);
    const promise = updateEmail(token, newEmail);

    notifyPromise(promise, {
      loading: "Đang cập nhật email...",
      success: () => {
        // Báo cho cha cập nhật state email mới
        onUpdate({ 
          email: newEmail, 
          emailConfirmed: false, 
          canChangeEmail: true 
        });
        return "Đã cập nhật email. Vui lòng gửi mã xác minh.";
      },
      error: (err) => err.response?.data?.message || "Lỗi cập nhật email",
    }).finally(() => {
      setIsProcessing(false);
    });
  };

  // 2. Gửi mã xác minh
  const handleSendCode = async () => {
    setIsProcessing(true);
    const promise = sendVerificationCode(token);

    notifyPromise(promise, {
      loading: "Đang gửi mã...",
      success: () => {
        setShowPopup(true); // Mở popup khi gửi mã thành công
        return "Đã gửi mã xác minh. Vui lòng kiểm tra email!";
      },
      error: (err) => err.response?.data?.message || "Không thể gửi mã.",
    }).finally(() => {
      setIsProcessing(false);
    });
  };

  // 3. Xử lý khi xác minh thành công (từ popup)
  const handleVerified = () => {
    onUpdate({ 
      emailConfirmed: true, 
      canChangeEmail: false 
    });
    setShowPopup(false);
  };

  return (
    <>
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>Email:</label>
        <div className={styles.emailInputWrapper}>
          <input
            id="email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={isConfirmed || isProcessing}
            className={styles.input}
          />
          {isConfirmed ? (
            <FaCheckCircle className={styles.verifiedIcon} title="Đã xác minh" />
          ) : (
            <button 
              onClick={handleSendCode} 
              className={styles.button}
              disabled={isProcessing}
            >
              Gửi mã
            </button>
          )}
        </div>
      </div>

      {canChange && !isConfirmed && (
        <button 
          className={styles.button} 
          onClick={handleUpdateEmail}
          disabled={isProcessing}
        >
          {isProcessing ? "Đang xử lý..." : "Cập nhật email mới"}
        </button>
      )}

      {showPopup && (
        <VerificationPopup
          email={newEmail}
          token={token}
          onClose={() => setShowPopup(false)}
          onVerified={handleVerified}
        />
      )}
    </>
  );
};

export default EmailVerification;