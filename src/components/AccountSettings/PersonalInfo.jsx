import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import "./PersonalInfo.css";
import defaultAvatar from "../../assets/default-avatar.png";
import toast from 'react-hot-toast';
import { FaCheckCircle } from "react-icons/fa";

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
        toast.error("🚫 Không thể lấy thông tin cá nhân!", {
  duration: 4000,
  position: "top-center",
  style: {
    background: "#fef2f2",           // Hồng nhạt tinh tế
    color: "#991b1b",                // Chữ đỏ đậm
    fontSize: "16px",
    fontWeight: "600",
    padding: "16px 22px",
    borderRadius: "14px",
    border: "1px solid #fca5a5",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    backdropFilter: "blur(2px)",
  },
  icon: "❗",
});
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
      toast.success("🎉 Cập nhật thông tin thành công!", {
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
      })
      .catch(() => toast.error(" Cập nhật thất bại. Vui lòng thử lại!", {
  duration: 4000,
  position: "top-center",
  style: {
    background: "#fef2f2",             // Hồng nhạt hiện đại (error nhẹ nhàng)
    color: "#991b1b",                  // Đỏ đậm (chữ dễ đọc)
    fontSize: "16px",                  // Dễ nhìn
    fontWeight: "600",                 // Chữ đậm nhẹ
    padding: "16px 22px",              // Thoáng
    borderRadius: "14px",              // Bo góc nhiều giống success
    border: "1px solid #fca5a5",       // Viền đỏ nhạt mềm
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)", // Bóng nhẹ chuyên nghiệp
    backdropFilter: "blur(2px)",       // Mờ nhẹ đẹp như mobile native
      },
  icon: "🚫",
      
}));
}
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
        toast.success("Đã cập nhật email mới, hãy xác minh.", {
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
      })
      .catch((err) => {
        const errMsg = err.response?.data?.message || "Lỗi cập nhật email";
        toast.error(`❌ ${errMsg}`, {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  style: {
    background: "#fff1f2",
    color: "#991b1b",
    fontWeight: "bold",
    fontSize: "15px",
    borderLeft: "6px solid #ef4444",
    padding: "12px 16px",
  },
});
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
        toast.error(`❌ ${errMsg}`, {
  duration: 4000,
  position: "top-center",
  style: {
    background: "#fef2f2",            // hồng nhạt
    color: "#991b1b",                 // đỏ đậm
    fontSize: "16px",
    fontWeight: "600",
    padding: "16px 24px",
    borderRadius: "14px",
    border: "1px solid #fca5a5",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    backdropFilter: "blur(2px)",
  },
  icon: "📧", 
});
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
        toast.success("Email đã được xác minh", {
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

        setCodeSent(false);
        setShowPopup(false);
        setVerificationCode("");
        updateUser({ emailConfirmed: true });
      })
      .catch(() => {
        toast.error(" Mã xác minh không đúng hoặc đã hết hạn!", {
  duration: 4000,
  position: "top-center",
  style: {
    background: "#fef2f2",           // Hồng nhạt
    color: "#991b1b",                // Đỏ đậm
    fontSize: "16px",
    fontWeight: "600",
    padding: "16px 24px",
    borderRadius: "14px",
    border: "1px solid #fca5a5",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    backdropFilter: "blur(2px)",
  },
  icon: "❌",
});
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
      toast.success("Đã cập nhật ảnh đại diện!", {
  position: "top-right",
  autoClose: 3000,
  style: {
    background: "#ecfdf5",
    color: "#065f46",
    fontWeight: "600",
    fontSize: "15px",
    borderLeft: "6px solid #34d399",
    padding: "12px 16px",
  },
});
      setAvatarFile(null);
      updateUser({ avatarUrl });
    } catch (err) {
      toast.error("Lỗi khi cập nhật ảnh đại diện!", {
  duration: 4000,
  position: "top-center",
  style: {
    background: "#fef2f2",           // Hồng nhạt nền lỗi
    color: "#991b1b",                // Đỏ đậm
    fontSize: "16px",
    fontWeight: "600",
    padding: "16px 24px",
    borderRadius: "14px",
    border: "1px solid #fca5a5",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    backdropFilter: "blur(2px)",
  },
});
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
                <FaCheckCircle className="pi-verified-icon" />
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