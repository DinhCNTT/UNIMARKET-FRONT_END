import { useState, useEffect } from "react";
import axios from "axios";
import "./PasswordChange.css";

const PasswordChange = () => {
  const [hasPassword, setHasPassword] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("http://localhost:5133/api/userprofile/has-password", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setHasPassword(res.data.hasPassword))
      .catch(() => setError("Không thể kiểm tra trạng thái mật khẩu"));
  }, [token]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (form.newPassword !== form.confirmNewPassword) {
      setError("⚠️ Mật khẩu mới và xác nhận không khớp.");
      return;
    }

    const url = "http://localhost:5133/api/userprofile/password";
    const payload = hasPassword
      ? {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmNewPassword: form.confirmNewPassword,
        }
      : {
          currentPassword: null,
          newPassword: form.newPassword,
          confirmNewPassword: form.confirmNewPassword,
        };

    axios
      .put(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMessage("✅ Cập nhật mật khẩu thành công!");
        setError("");
        setForm({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Lỗi cập nhật mật khẩu";
        setError(`❌ ${msg}`);
        setMessage("");
      });
  };

  const handleDeleteAccount = () => {
    axios
      .delete("http://localhost:5133/api/userprofile/delete", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("Tài khoản đã được xóa. Bạn sẽ được đăng xuất.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Xóa tài khoản thất bại.";
        setError(`❌ ${msg}`);
      })
      .finally(() => setShowDeleteConfirm(false));
  };

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
          />
        )}
        <input
          type="password"
          name="newPassword"
          placeholder="Mật khẩu mới"
          value={form.newPassword}
          onChange={handleChange}
        />
        <input
          type="password"
          name="confirmNewPassword"
          placeholder="Nhập lại mật khẩu"
          value={form.confirmNewPassword}
          onChange={handleChange}
        />
        <button onClick={handleSubmit}>Xác nhận</button>

        <hr />

        <button
          className="delete-btn"
          onClick={() => setShowDeleteConfirm(true)}
        >
          🗑️ Yêu cầu xóa tài khoản
        </button>

        {message && <div className="pc-message pc-success">{message}</div>}
        {error && <div className="pc-message pc-error">{error}</div>}
      </div>

      {/* Modal xác nhận xóa tài khoản */}
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