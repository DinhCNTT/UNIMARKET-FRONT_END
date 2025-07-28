import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import authService from "../services/authService";
import "./Login.css";
import GoogleLoginButton from "./GoogleLoginButton";
import FacebookLoginButton from "./FacebookLoginButton";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const userData = await authService.login(email, password);

      if (!userData || !userData.token || !userData.role) {
        toast.error("❌ Không thể xác thực tài khoản!", {
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            fontWeight: "600",
            padding: "14px 20px",
            border: "1px solid #fca5a5",
            borderRadius: "10px",
          },
        });
        return;
      }

      const userObject = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName || "",
        role: userData.role,
        phoneNumber: userData.phoneNumber || "",
        avatarUrl: userData.avatarUrl || "",
        emailConfirmed: userData.emailConfirmed || false,
        loginProvider: userData.loginProvider || "Email",
        token: userData.token,
      };

      setUser(userObject);
      setToken(userData.token);

      if (
        userData.loginProvider === "Facebook" &&
        userData.emailConfirmed === false
      ) {
        toast("📧 Vui lòng xác minh email trong cài đặt tài khoản trước khi đăng tin.", {
          icon: "⚠️",
          style: {
            background: "#fefce8",
            color: "#92400e",
            border: "1px solid #fde68a",
            padding: "14px 20px",
            fontWeight: "600",
            borderRadius: "12px",
          },
        });
      } else {
        toast.success("🎉 Đăng nhập thành công!", {
          style: {
            background: "#ecfdf5",
            color: "#065f46",
            fontSize: "15px",
            fontWeight: "600",
            padding: "14px 20px",
            border: "1px solid #34d399",
            borderRadius: "10px",
          },
        });
      }

      navigate(userData.role === "Admin" ? "/admin" : "/market");
    } catch (error) {
      console.error("Login error:", error);
      const errMsg =
        error.response?.data?.message || "Đăng nhập thất bại!";
      toast.error(`❌ ${errMsg}`, {
        style: {
          background: "#fef2f2",
          color: "#991b1b",
          fontSize: "15px",
          fontWeight: "600",
          padding: "14px 20px",
          border: "1px solid #fca5a5",
          borderRadius: "10px",
        },
      });
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Đăng nhập</h2>

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
