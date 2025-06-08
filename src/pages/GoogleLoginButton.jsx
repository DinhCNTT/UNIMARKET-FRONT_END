import React, { useContext, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const GoogleLoginButton = () => {
  const { setUser, setToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    if (!credentialResponse || !credentialResponse.credential) {
      alert("Google credential không hợp lệ");
      return;
    }

    const IdToken = credentialResponse.credential;
    const decoded = jwtDecode(IdToken);
    console.log("Google token info:", decoded);

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5133/api/emailverification/google-login",
        { IdToken },
        { headers: { "Content-Type": "application/json" } }
      );

      const userData = res.data;

      // ✅ Lưu vào Context
      setUser({
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        emailConfirmed: userData.emailConfirmed,
        avatarUrl: userData.avatarUrl,
      });

      setToken(userData.token);

      // ✅ Lưu vào localStorage để giữ lại sau reload
      localStorage.setItem("token", userData.token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userId", userData.id);
      localStorage.setItem("userEmail", userData.email || "");
      localStorage.setItem("userFullName", userData.fullName || "");
      localStorage.setItem("userPhoneNumber", userData.phoneNumber || "");

      if (userData.avatarUrl) {
        localStorage.setItem("userAvatar", userData.avatarUrl);
      }

      alert("Đăng nhập Google thành công!");
      navigate("/market");
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <GoogleLogin
        onSuccess={handleGoogleLoginSuccess}
        onError={() => alert("Đăng nhập Google thất bại")}
        disabled={loading}
      />
      {loading && <p>Đang xử lý đăng nhập...</p>}
    </div>
  );
};

export default GoogleLoginButton;