import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterForm.css";
import GoogleLoginButton from "./GoogleLoginButton"; // import nút Google
import { toast } from "react-toastify";

const RegisterForm = () => {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

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
  icon: "⚠️", // hoặc dùng icon như ❌ nếu muốn
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
    <div className="register-container">
      <div className="register-box">
        <h2 className="register-title">Đăng ký tài khoản</h2>
        <form className="register-form" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Họ và tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="register-input"
          />
          <input
            type="tel"
            placeholder="Số điện thoại"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="register-input"
          />
          <input
            type="email"
            placeholder="Email (gmail)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="register-input"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="register-input"
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="register-input"
          />

          <p className="register-terms">
            Khi đăng ký, bạn đồng ý với{" "}
            <a href="#">Điều khoản sử dụng</a> và{" "}
            <a href="#">Chính sách bảo mật</a>.
          </p>

          <button type="submit" className="register-button">
            Đăng ký
          </button>
        </form>
          <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p>Hoặc đăng ký bằng</p>
          {/* Nút đăng ký Google */}
          <GoogleLoginButton />
      </div>
    </div>
    </div>
  );
};

export default RegisterForm;