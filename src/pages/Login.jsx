import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import authService from "../services/authService";
import "./Login.css";
import GoogleLoginButton from "./GoogleLoginButton";
import FacebookLoginButton from "./FacebookLoginButton";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setWarningMessage("");

    try {
      const userData = await authService.login(email, password);

      if (!userData || !userData.token || !userData.role) {
        setErrorMessage("Không thể xác thực tài khoản!");
        return;
      }

      // ✅ Tạo user object hoàn chỉnh
      const userObject = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName || "",
        role: userData.role,
        phoneNumber: userData.phoneNumber || "",
        avatarUrl: userData.avatarUrl || "",
        emailConfirmed: userData.emailConfirmed || false,
        loginProvider: userData.loginProvider || "Email",
        token: userData.token // ✅ Quan trọng: token phải có trong user object
      };

      // ✅ Set user trước (bao gồm token)
      setUser(userObject);
      
      // ✅ Set token riêng biệt (đảm bảo consistency)
      setToken(userData.token);

      console.log("Login successful:", {
        user: userObject,
        token: userData.token
      });

      // ✅ Hiển thị warning nếu Facebook chưa xác minh email
      if (
        userData.loginProvider === "Facebook" &&
        userData.emailConfirmed === false
      ) {
        setWarningMessage(
          "⚠️ Vui lòng xác minh email trong cài đặt tài khoản trước khi đăng tin."
        );
      }

      navigate(userData.role === "Admin" ? "/admin" : "/market");
    } catch (error) {
      console.error("Login error:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Đăng nhập thất bại!");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Đăng nhập</h2>

        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {warningMessage && <div className="warning-message">{warningMessage}</div>}

        <form onSubmit={handleLogin} autoComplete="on">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button type="submit">Đăng nhập</button>
        </form>

        <div style={{ margin: "16px 0", textAlign: "center" }}>
          <span>Hoặc đăng nhập với</span>
          <GoogleLoginButton />
          <FacebookLoginButton />
        </div>

        <p className="signup-link">
          Chưa có tài khoản? <a href="/register">Đăng ký</a>
        </p>
      </div>
    </div>
  );
};

export default Login;