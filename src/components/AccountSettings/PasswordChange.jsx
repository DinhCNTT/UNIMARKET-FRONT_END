import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import "./PasswordChange.css";
import toast from 'react-hot-toast';

const PasswordChange = () => {
  const [hasPassword, setHasPassword] = useState(null); // null = chưa load xong
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Lấy token từ AuthContext
  const { token } = useContext(AuthContext);

  // Kiểm tra xem user có mật khẩu hiện tại không
  useEffect(() => {
    if (!token) {
      setError("❌ Bạn chưa đăng nhập hoặc token đã hết hạn");
      return;
    }

    const checkPasswordStatus = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5133/api/userprofile/has-password",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log("Has password response:", response.data); // Debug log
        setHasPassword(response.data.hasPassword);
      } catch (error) {
        console.error("Error checking password status:", error);
        setError("Không thể kiểm tra trạng thái mật khẩu");
        setHasPassword(false); // Fallback to false
      }
    };

    checkPasswordStatus();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear errors when user starts typing
    if (error) setError("");
    if (message) setMessage("");
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.newPassword.trim()) {
      setError("⚠️ Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("⚠️ Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      setError("⚠️ Mật khẩu mới và xác nhận không khớp.");
      return;
    }

    // Nếu user đã có mật khẩu nhưng không nhập mật khẩu hiện tại
    if (hasPassword && !form.currentPassword.trim()) {
      setError("⚠️ Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const url = "http://localhost:5133/api/userprofile/password";
      
      // Tạo payload dựa trên hasPassword
      const payload = {
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
      };

      // Chỉ thêm currentPassword nếu user đã có mật khẩu
      if (hasPassword) {
        payload.currentPassword = form.currentPassword;
      }

      console.log("Sending payload:", { ...payload, currentPassword: "***" }); // Debug log

      const response = await axios.put(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Password change response:", response.data); // Debug log

      toast.success("Cập Nhật Mật Khẩu Thành Công !.", {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#fff9db",             // Vàng kem nhẹ kiểu mạng xã hội
          color: "#3f3f3f",                  // Màu chữ xám than, dễ đọc
          fontSize: "16px",                  // Cỡ chữ vừa mắt
          fontWeight: "600",                 // Chữ đậm nhưng không thô
          padding: "16px 22px",              // Dày dặn
          borderRadius: "14px",              // Bo tròn nhiều cho mềm mại
          border: "1px solid #fcd34d",       // Viền vàng pastel
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)", // Đổ bóng nhẹ sang trọng
          backdropFilter: "blur(2px)",       // Làm nền mờ nhẹ (giống iOS)
        },
        icon: "🌟",
      });
      setError("");
      
      // Reset form
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      // Cập nhật hasPassword nếu trước đó là false
      if (!hasPassword) {
        setHasPassword(true);
      }

    } catch (err) {
      console.error("Password change error:", err.response?.data || err.message);
      
      const errorMsg = err.response?.data?.message || "Lỗi cập nhật mật khẩu";
      setError(`❌ ${errorMsg}`);
      setMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete("http://localhost:5133/api/userprofile/delete", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      alert("Tài khoản đã được xóa. Bạn sẽ được đăng xuất.");
      
      // Clear all storage
      sessionStorage.clear();
      localStorage.clear();
      
      // Redirect to login
      window.location.href = "/login";
    } catch (err) {
      console.error("Delete account error:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || "Xóa tài khoản thất bại.";
      setError(`❌ ${errorMsg}`);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Loading state
  if (hasPassword === null) {
    return (
      <div className="pc-wrapper">
        <div className="pc-container">
          <div className="loading">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
  <div className="pc-wrapper">
    <div className="pc-container">
      <h3 className="pc-title">
        {hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu mới"}
      </h3>

      {hasPassword && (
        <input
          type="password"
          name="currentPassword"
          placeholder="Mật khẩu hiện tại"
          value={form.currentPassword}
          onChange={handleChange}
          disabled={isLoading}
        />
      )}

      <input
        type="password"
        name="newPassword"
        placeholder="Mật khẩu mới"
        value={form.newPassword}
        onChange={handleChange}
        disabled={isLoading}
      />

      <input
        type="password"
        name="confirmNewPassword"
        placeholder="Nhập lại mật khẩu mới"
        value={form.confirmNewPassword}
        onChange={handleChange}
        disabled={isLoading}
      />

      <div className="pc-actions">
        <button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Đang xử lý..." : "Xác nhận"}
        </button>

        <button
          className="delete-btn"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isLoading}
        >
          Yêu cầu xóa tài khoản
        </button>
      </div>

      {message && <div className="pc-message pc-success">{message}</div>}
      {error && <div className="pc-message pc-error">{error}</div>}
    </div>

    {showDeleteConfirm && (
      <div className="delete-modal">
        <div className="delete-modal-content">
          <h4>Bạn có chắc muốn xóa tài khoản?</h4>
          <p>Hành động này không thể hoàn tác.</p>
          <div className="delete-modal-actions">
            <button onClick={handleDeleteAccount} className="btn-confirm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 24 24"
                style={{ marginRight: 6 }}
              >
                <path d="M20.285 2.857l-11.428 11.428-5.714-5.714-3.143 3.143 8.857 8.857 14.571-14.571z" />
              </svg>
              Đồng ý
            </button>

            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn-cancel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="#333"
                viewBox="0 0 24 24"
                style={{ marginRight: 6 }}
              >
                <path d="M18.364 5.636l-1.414-1.414L12 9.172 7.05 4.222 5.636 5.636 10.586 10.586 5.636 15.536l1.414 1.414L12 12.828l4.95 4.95 1.414-1.414-4.95-4.95z" />
              </svg>
              Hủy
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);


};

export default PasswordChange;