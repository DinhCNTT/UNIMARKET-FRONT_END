import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterForm.css";
import GoogleLoginButton from "./GoogleLoginButton"; // import nút Google

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
      alert("❌ Số điện thoại không hợp lệ! Vui lòng nhập 10-11 số.");
      return;
    }

    // Kiểm tra email là Gmail
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      alert("❌ Email phải là địa chỉ Gmail (ví dụ: example@gmail.com).");
      return;
    }

    // Kiểm tra mật khẩu mạnh
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("❌ Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
      return;
    }

    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      alert("❌ Mật khẩu xác nhận không khớp.");
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

      alert("✅ Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản trước khi đăng nhập.");
      navigate("/login");
    } catch (error) {
      alert("❌ Lỗi: " + error.message);
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
