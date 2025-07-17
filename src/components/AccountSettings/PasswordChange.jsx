import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import "./PasswordChange.css";

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

      setMessage("✅ Cập nhật mật khẩu thành công!");
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

        {/* Debug info (remove in production) */}
        {/* <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          Debug: hasPassword = {hasPassword ? 'true' : 'false'}
        </div> */}

        {/* Chỉ hiển thị ô mật khẩu hiện tại nếu user đã có mật khẩu */}
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

        <button 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Đang xử lý..." : "Xác nhận"}
        </button>

        <hr />

        <button
          className="delete-btn"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isLoading}
        >
          🗑️ Yêu cầu xóa tài khoản
        </button>

        {message && <div className="pc-message pc-success">{message}</div>}
        {error && <div className="pc-message pc-error">{error}</div>}
      </div>

      {showDeleteConfirm && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <h4>Bạn có chắc muốn xóa tài khoản?</h4>
            <p>Hành động này không thể hoàn tác.</p>
            <div className="delete-modal-actions">
              <button onClick={handleDeleteAccount}>✅ Đồng ý</button>
              <button onClick={() => setShowDeleteConfirm(false)}>❌ Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordChange;