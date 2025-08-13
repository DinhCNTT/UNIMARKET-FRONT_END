import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterForm.css";
import GoogleLoginButton from "./GoogleLoginButton";
import FacebookLoginButton from "./FacebookLoginButton";
import { toast } from "react-toastify";

const RegisterForm = () => {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const navigate = useNavigate();

  // Common toast style
  const sameStyle = {
    position: "top-right",
    autoClose: 3500,
    closeButton: false,
    style: {
      background: "#fff1f2",
      color: "#b91c1c",
      fontWeight: "600",
      borderRadius: "12px",
      padding: "14px 16px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
  };

  // Password criteria check
  const passwordCriteria = [
    {
      label: "Ít nhất 8 ký tự",
      test: (pw) => pw.length >= 8,
    },
    {
      label: "Có chữ hoa (A-Z)",
      test: (pw) => /[A-Z]/.test(pw),
    },
    {
      label: "Có chữ thường (a-z)",
      test: (pw) => /[a-z]/.test(pw),
    },
    {
      label: "Có số (0-9)",
      test: (pw) => /[0-9]/.test(pw),
    },
    {
      label: "Có ký tự đặc biệt (@$!%*?&)",
      test: (pw) => /[@$!%*?&]/.test(pw),
    },
  ];

  const passwordCriteriaStatus = passwordCriteria.map((c) => c.test(password));

  const handlePasswordFocus = () => {
    setShowPasswordCriteria(true);
    setPasswordTouched(true);
  };
  
  const handlePasswordBlur = () => {
    setShowPasswordCriteria(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Kiểm tra số điện thoại
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("❌ Số điện thoại không hợp lệ!", {
        position: "top-right",
        autoClose: 3500,
        closeButton: false,
        icon: "📱",
        style: {
          background: "#fff1f2",
          color: "#b91c1c",
          fontWeight: "600",
          borderRadius: "12px",
          padding: "14px 16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      });
      return;
    }

    // Kiểm tra email là Gmail
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      toast.error("Email phải là địa chỉ Gmail", {
        icon: "📧",
        ...sameStyle
      });
      return;
    }

    // Kiểm tra mật khẩu mạnh
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error(" Mật khẩu phải đủ mạnh", {
        icon: "🔒",
        ...sameStyle
      });
      return;
    }

    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      toast.error("❌ Mật khẩu xác nhận không khớp", {
        icon: "🔁",
        ...sameStyle
      });
      return;
    }

    // Tạo object user
    const userData = {
      fullName,
      phoneNumber,
      email,
      password,
      confirmPassword,
    };

    try {
      const response = await fetch("http://localhost:5133/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.errors) {
          // Hiển thị tất cả lỗi từ server (nếu có)
          const errorMessages = Object.values(data.errors).flat().join("\n");
          throw new Error(errorMessages);
        } else if (data && data.message) {
          throw new Error(data.message);
        } else {
          throw new Error("Đăng ký thất bại! Vui lòng thử lại.");
        }
      }

      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.", {
        position: "top-right",
        autoClose: 4000,
        closeButton: false,
        icon: "📬",
        style: {
          background: "#f0fff4",
          color: "#065f46",
          fontWeight: "600",
          borderRadius: "12px",
          padding: "14px 16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      });
      navigate("/login");
    } catch (error) {
      toast.error(`Lỗi: ${error.message}`, {
        position: "top-right",
        autoClose: 4000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        hideProgressBar: false,
        icon: "⚠️",
        style: {
          background: "#fff",
          color: "#d32f2f",
          fontWeight: "500",
          fontSize: "15px",
          borderLeft: "5px solid #d32f2f",
          boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
          borderRadius: "8px",
        },
      });
    }
  };

  return (
    <div className="rf-register-container">
      <div className="rf-register-box">
        <h2 className="rf-register-title">Đăng ký tài khoản</h2>
        <form className="rf-register-form" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Họ và tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="rf-register-input"
          />
          <input
            type="tel"
            placeholder="Số điện thoại"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="rf-register-input"
          />
          <input
            type="email"
            placeholder="Email (gmail)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rf-register-input"
          />
          <div className="rf-password-wrapper">
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
              required
              className="rf-register-input"
            />
            {showPasswordCriteria && (
              <div className="rf-password-criteria">
                <div className="rf-password-criteria-title">Mật khẩu cần có:</div>
                <ul className="rf-password-criteria-list">
                  {passwordCriteria.map((c, idx) => (
                    <li 
                      key={c.label} 
                      className={`rf-password-criteria-item ${passwordCriteriaStatus[idx] ? 'rf-valid' : 'rf-invalid'}`}
                    >
                      {passwordCriteriaStatus[idx] ? '✔️' : '❌'} {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="rf-register-input"
          />
          
          {/* Hiển thị lỗi tiêu chí nếu đã chạm vào và chưa đạt */}
          {passwordTouched && !passwordCriteriaStatus.every(Boolean) && !showPasswordCriteria && (
            <div className="rf-password-error">
              Mật khẩu chưa đáp ứng đủ tiêu chí:
              <ul className="rf-password-error-list">
                {passwordCriteria.map((c, idx) =>
                  !passwordCriteriaStatus[idx] ? (
                    <li key={c.label} className="rf-password-error-item">
                      {c.label}
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          )}

          <div className="rf-register-terms">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              required
            />
            <label htmlFor="agree-terms">
              Khi đăng ký, bạn đồng ý với <a href="#">Điều khoản sử dụng</a> và <a href="#">Chính sách bảo mật</a>.
            </label>
          </div>

          <button 
            type="submit" 
            className="rf-register-button" 
            disabled={!agreed}
          >
            Đăng ký
          </button>
        </form>
        
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p>Hoặc đăng ký bằng</p>
          <div className="rf-social-login">
            <GoogleLoginButton />
            <FacebookLoginButton />
          </div>
        </div>
        
        <div className="rf-login-link">
          Đã có tài khoản? <a href="/login">Đăng nhập</a>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;