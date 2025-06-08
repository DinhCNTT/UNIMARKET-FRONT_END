import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import "./PersonalInfo.css";

const PersonalInfo = () => {
  const [info, setInfo] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    emailConfirmed: false,
    canChangeEmail: false,
  });

  const [newEmail, setNewEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  const token = localStorage.getItem("token");
  const API_BASE = "http://localhost:5133/api/userprofile";

  // ✅ Dùng context để cập nhật user toàn cục
  const { updateUser } = useContext(AuthContext);

  useEffect(() => {
    if (!token) {
      setError("❌ Bạn chưa đăng nhập hoặc token đã hết hạn");
      setLoading(false);
      return;
    }

    axios
      .get(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        setInfo(data);
        setNewEmail(data.email);
        setLoading(false);
      })
      .catch(() => {
        setError("❌ Không thể lấy thông tin cá nhân");
        setLoading(false);
      });
  }, [token]);

  const handleUpdateInfo = () => {
    axios
      .put(
        `${API_BASE}/update`,
        {
          fullName: info.fullName,
          phoneNumber: info.phoneNumber,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setMessage("✅ Cập nhật thông tin thành công");
        setError("");
      })
      .catch(() => setError("❌ Cập nhật thất bại"));
  };

  const handleUpdateEmail = () => {
    if (newEmail === info.email) {
      setError("⚠️ Vui lòng nhập email khác với email hiện tại.");
      return;
    }

    axios
      .put(
        `${API_BASE}/email`,
        { newEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setInfo((prev) => ({
          ...prev,
          email: newEmail,
          emailConfirmed: false,
          canChangeEmail: true,
        }));
        setMessage("✅ Đã cập nhật email mới, hãy xác minh.");
        setError("");
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || "Lỗi cập nhật email";
        setError(`❌ ${errMsg}`);
      });
  };

  const sendVerificationCode = () => {
    axios
      .post("http://localhost:5133/api/emailverification/send-code", null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setCodeSent(true);
        setShowPopup(true);
        setMessage("");
        setError("");
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Không thể gửi mã xác minh";
        setError(`❌ ${msg}`);
      });
  };

  const verifyCode = () => {
    axios
      .post(
        "http://localhost:5133/api/emailverification/verify-code",
        { email: info.email, code: verificationCode },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setInfo((prev) => ({
          ...prev,
          emailConfirmed: true,
          canChangeEmail: false,
        }));
        setMessage("✅ Email đã được xác minh");
        setCodeSent(false);
        setShowPopup(false);
        setVerificationCode("");

        // ✅ Cập nhật AuthContext để không cần đăng nhập lại
        updateUser({ emailConfirmed: true });
      })
      .catch(() => {
        setError("❌ Mã xác minh không đúng hoặc đã hết hạn");
      });
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;

return (
  <div className="pi-page-container"> {/* ✅ Thêm lớp bọc này để căn giữa */}
    <div className="pi-card-wrapper">
      <div className="pi-card-inner">
        <h2 className="pi-title">Thông tin cá nhân</h2>

        <div className="pi-form-group">
          <label className="pi-label">Họ tên:</label>
          <input
            className="pi-input"
            name="fullName"
            value={info.fullName}
            onChange={(e) => setInfo({ ...info, fullName: e.target.value })}
            placeholder="Họ tên"
          />
        </div>

        <div className="pi-form-group">
          <label className="pi-label">Số điện thoại:</label>
          <input
            className="pi-input"
            name="phoneNumber"
            value={info.phoneNumber}
            onChange={(e) => setInfo({ ...info, phoneNumber: e.target.value })}
            placeholder="Số điện thoại"
          />
        </div>

        <button className="pi-update-btn" onClick={handleUpdateInfo}>
          Cập nhật thông tin
        </button>

        <hr className="pi-divider" />

        <div className="pi-form-group">
          <label className="pi-label">Email:</label>
          <div className="pi-email-input-wrapper">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={info.emailConfirmed}
              className={`pi-input ${info.emailConfirmed ? "pi-email-confirmed" : ""}`}
            />
            {info.emailConfirmed ? (
              <span className="pi-verified-icon">✅</span>
            ) : (
              <button onClick={sendVerificationCode} className="pi-send-code-btn">
                Gửi mã
              </button>
            )}
          </div>
        </div>

        {info.canChangeEmail && !info.emailConfirmed && (
          <button className="pi-update-btn" onClick={handleUpdateEmail}>
            Cập nhật email mới
          </button>
        )}

        {showPopup && (
          <div className="pi-popup-overlay">
            <div className="pi-popup-content">
              <h3>Xác minh Email</h3>
              <input
                className="pi-input"
                placeholder="Nhập mã xác minh"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <button className="pi-send-code-btn" onClick={verifyCode}>Xác minh</button>
              <button className="pi-send-code-btn" onClick={() => setShowPopup(false)}>Đóng</button>
            </div>
          </div>
        )}

        {message && <div className="pi-message pi-success">{message}</div>}
        {error && <div className="pi-message pi-error">{error}</div>}
      </div>
    </div>
  </div>
);



};

export default PersonalInfo;
