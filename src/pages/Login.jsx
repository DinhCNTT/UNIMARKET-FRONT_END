import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import authService from "../services/authService";
import "./Login.css";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { FaFacebookF } from 'react-icons/fa';
import axios from "axios";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  // Initialize Facebook SDK
  useEffect(() => {
    if (window.FB) {
      setSdkReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '1838308526739877',
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
      setSdkReady(true);
    };

    const scriptId = 'facebook-jssdk';
    if (!document.getElementById(scriptId)) {
      const js = document.createElement('script');
      js.id = scriptId;
      js.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      document.body.appendChild(js);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userData = await authService.login(email, password);
      if (!userData || !userData.token || !userData.role) {
        toast.error("❌ Không thể xác thực tài khoản!", {
          style: {
            background: "#fff5f5",
            color: "#c53030",
            fontWeight: "400",
            padding: "12px 16px",
            border: "1px solid #fed7d7",
            borderRadius: "4px",
            fontSize: "13px",
          },
        });
        setIsLoading(false);
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
            background: "#fffaf0",
            color: "#c05621",
            border: "1px solid #fbd38d",
            padding: "12px 16px",
            fontWeight: "400",
            borderRadius: "4px",
            fontSize: "13px",
          },
        });
      } else {
        toast.success("🎉 Đăng nhập thành công!", {
          style: {
            background: "#f0fff4",
            color: "#276749",
            fontSize: "13px",
            fontWeight: "400",
            padding: "12px 16px",
            border: "1px solid #9ae6b4",
            borderRadius: "4px",
          },
        });
      }
      setTimeout(() => {
        navigate(userData.role === "Admin" ? "/admin" : "/market");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      const errMsg =
        error.response?.data?.message || "Đăng nhập thất bại!";
      toast.error(`❌ ${errMsg}`, {
        style: {
          background: "#fff5f5",
          color: "#c53030",
          fontSize: "13px",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #fed7d7",
          borderRadius: "4px",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    if (!credentialResponse || !credentialResponse.credential) {
      toast.error("Google credential không hợp lệ", {
        style: {
          background: "#fff5f5",
          color: "#c53030",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #fed7d7",
          borderRadius: "4px",
          fontSize: "13px",
        },
      });
      return;
    }

    const IdToken = credentialResponse.credential;
    const decoded = jwtDecode(IdToken);
    console.log("Google token info:", decoded);

    setGoogleLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5133/api/emailverification/google-login",
        { IdToken },
        { headers: { "Content-Type": "application/json" } }
      );

      const userData = res.data;
      const userObject = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role || "User",
        phoneNumber: userData.phoneNumber || "",
        avatarUrl: userData.avatarUrl || "",
        emailConfirmed: userData.emailConfirmed || true,
        loginProvider: "Google",
        token: userData.token
      };

      setUser(userObject);
      setToken(userData.token);

      toast.success("🎉 Đăng nhập Google thành công!", {
        style: {
          background: "#f0fff4",
          color: "#276749",
          fontSize: "13px",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #9ae6b4",
          borderRadius: "4px",
        },
      });

      setTimeout(() => {
        navigate("/market");
      }, 1000);

    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Đăng nhập Google thất bại", {
        style: {
          background: "#fff5f5",
          color: "#c53030",
          fontSize: "13px",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #fed7d7",
          borderRadius: "4px",
        },
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Facebook Login
  const sendAccessTokenToBackend = async (accessToken) => {
    try {
      const res = await fetch('http://localhost:5133/api/emailverification/facebook-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();

      if (res.ok) {
        const userObject = {
          id: data.id,
          email: data.email,
          fullName: data.fullName,
          role: data.role || "User",
          phoneNumber: data.phoneNumber || "",
          avatarUrl: data.avatarUrl || "",
          emailConfirmed: data.emailConfirmed || false,
          loginProvider: "Facebook",
          token: data.token
        };

        setUser(userObject);
        setToken(data.token);

        toast.success("🎉 Đăng nhập Facebook thành công!", {
          style: {
            background: "#f0fff4",
            color: "#276749",
            fontSize: "13px",
            fontWeight: "400",
            padding: "12px 16px",
            border: "1px solid #9ae6b4",
            borderRadius: "4px",
          },
        });

        setTimeout(() => {
          navigate("/market");
        }, 1000);

      } else {
        toast.error(data.message || "Đăng nhập Facebook thất bại", {
          style: {
            background: "#fff5f5",
            color: "#c53030",
            fontSize: "13px",
            fontWeight: "400",
            padding: "12px 16px",
            border: "1px solid #fed7d7",
            borderRadius: "4px",
          },
        });
      }
    } catch (error) {
      toast.error("Lỗi kết nối tới server backend", {
        style: {
          background: "#fff5f5",
          color: "#c53030",
          fontSize: "13px",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #fed7d7",
          borderRadius: "4px",
        },
      });
      console.error('Lỗi khi gọi API Facebook Login:', error);
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      toast.error("Facebook SDK chưa sẵn sàng. Vui lòng thử lại sau.", {
        style: {
          background: "#fff5f5",
          color: "#c53030",
          fontSize: "13px",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #fed7d7",
          borderRadius: "4px",
        },
      });
      return;
    }

    setFacebookLoading(true);
    window.FB.login(
      function (response) {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          sendAccessTokenToBackend(accessToken);
        } else {
          toast.error("Bạn đã huỷ đăng nhập Facebook", {
            style: {
              background: "#fff5f5",
              color: "#c53030",
              fontSize: "13px",
              fontWeight: "400",
              padding: "12px 16px",
              border: "1px solid #fed7d7",
              borderRadius: "4px",
            },
          });
        }
        setFacebookLoading(false);
      },
      { scope: 'email' }
    );
  };



  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Đăng nhập</h2>

        <form className="login-form" onSubmit={handleLogin} autoComplete="on">
          <input
            type="email"
            name="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={isLoading}
            aria-label="Email"
          />
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={isLoading}
            aria-label="Mật khẩu"
          />
          <div className="forgot-password">
            <a href="/forgot-password">Quên mật khẩu?</a>
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className={isLoading ? 'loading' : ''}
            aria-label={isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          >
            {isLoading ? '' : 'Đăng nhập'}
          </button>
        </form>

        <div className="divider">
          <span>Hoặc đăng nhập bằng</span>
        </div>

        <div className="social-login">
          <div className="google-login-container">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => {
                toast.error("Đăng nhập Google thất bại", {
                  style: {
                    background: "#fff5f5",
                    color: "#c53030",
                    fontSize: "13px",
                    fontWeight: "400",
                    padding: "12px 16px",
                    border: "1px solid #fed7d7",
                    borderRadius: "4px",
                  },
                });
              }}
              disabled={googleLoading}
              text="signin_with"
              theme="outline"
              size="large"
              width="100%"
            />
            {googleLoading && (
              <div className="social-loading">
                Đang xử lý đăng nhập Google...
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={!sdkReady || facebookLoading}
            className="facebook-button styled-facebook-btn"
            aria-label={facebookLoading ? 'Đang xử lý Facebook...' : 'Đăng nhập với Facebook'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 7,
              width: 100,
              height: 39,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              cursor: !sdkReady || facebookLoading ? 'not-allowed' : 'pointer',
              padding: 0,
              gap: 8,
              marginTop: '1px'
            }}
          >
            <FaFacebookF style={{ fontSize: 24, color: '#1877F2' }} />
            <span style={{ color: '#1877F2', fontWeight: 500, fontSize: 15 }}>
              {facebookLoading ? 'Đang xử lý...' : 'Facebook'}
            </span>
          </button>
        </div>

        <p className="signup-link">
          Chưa có tài khoản? <a href="/register">Đăng ký tài khoản mới</a>
        </p>

        <div className="footer-links">
          <a href="/terms" target="_blank" rel="noopener noreferrer">
            Quy chế hoạt động sàn
          </a>
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            Chính sách bảo mật
          </a>
          <a href="/support" target="_blank" rel="noopener noreferrer">
            Liên hệ hỗ trợ
          </a>
        </div>

        <div className="brand-logos">
          <p>Được phát triển bởi</p>
          <div className="logos-container">
            <span className="logo-item unimarket">UniMarket</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;