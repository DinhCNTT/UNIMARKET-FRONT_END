import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import "./PersonalInfo.css";
import defaultAvatar from "../../assets/default-avatar.png";

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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const { token, updateUser, user } = useContext(AuthContext);
  const API_BASE = "http://localhost:5133/api/userprofile";

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

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarPreview(user.avatarUrl);
    }
  }, [user]);

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
        updateUser({ emailConfirmed: true });
      })
      .catch(() => {
        setError("❌ Mã xác minh không đúng hoặc đã hết hạn");
      });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async (e) => {
    if (e) e.preventDefault();
    if (!avatarFile) {
      setError("Vui lòng chọn ảnh đại diện mới!");
      return;
    }
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      const res = await axios.post(`${API_BASE}/upload-avatar`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { avatarUrl } = res.data;
      setMessage("✅ Đã cập nhật ảnh đại diện!");
      setAvatarFile(null);
      updateUser({ avatarUrl });
    } catch (err) {
      setError("❌ Lỗi khi cập nhật ảnh đại diện");
    }
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="pi-page-container">
      <div className="pi-card-wrapper">
        <div className="pi-card-inner">
          <h2 className="pi-title">Thông tin cá nhân</h2>

          {/* Avatar section */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
            <img
              src={
                avatarPreview
                  ? avatarPreview
                  : defaultAvatar
              }
              alt="avatar"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #eee",
              }}
            />

            <input
              id="avatar-upload-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="pi-avatar-upload-btn"
              onClick={() => document.getElementById("avatar-upload-input").click()}
              style={{
                background: "#e6f9ec",
                border: "2px dashed #2ecc40",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                transform: "translate(-15px, -33px)" // Dịch lên trên và sang trái
              }}
              title="Tải ảnh đại diện mới"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#2ecc40" />
                <rect x="11" y="6" width="2" height="12" rx="1" fill="white" />
                <rect x="6" y="11" width="12" height="2" rx="1" fill="white" />
              </svg>
            </button>
            {avatarFile && (
              <button
                className="pi-update-btn"
                style={{ width: "auto", marginLeft: 12 }}
                onClick={handleAvatarUpload}
              >
                Cập nhật ảnh
              </button>
            )}
          </div>

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
                <button className="pi-send-code-btn" onClick={verifyCode}>
                  Xác minh
                </button>
                <button className="pi-send-code-btn" onClick={() => setShowPopup(false)}>
                  Đóng
                </button>
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
