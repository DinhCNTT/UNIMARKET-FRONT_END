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
        console.log("Google login response:", userData);

        // ✅ Tạo user object hoàn chỉnh
        const userObject = {
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role || "User",
          phoneNumber: userData.phoneNumber || "",
          avatarUrl: userData.avatarUrl || "",
          emailConfirmed: userData.emailConfirmed || true,
          loginProvider: "Google",
          token: userData.token // ✅ Quan trọng: token phải có trong user object
        };

        // ✅ Set user trước (bao gồm token)
        setUser(userObject);
        
        // ✅ Set token riêng biệt (đảm bảo consistency)
        setToken(userData.token);

        console.log("User object created:", userObject);
        console.log("Token set:", userData.token);

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