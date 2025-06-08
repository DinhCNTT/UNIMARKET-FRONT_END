import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import PasswordChange from "./PasswordChange";
import PersonalInfo from "./PersonalInfo";
import "./AccountSettings.css";
import TopNavbar from "../TopNavbar";
import { useNavigate } from "react-router-dom";

const AccountSettings = () => {
  const { token } = useContext(AuthContext);
  const [selectedTab, setSelectedTab] = useState("personal");
  const navigate = useNavigate();

  // 🔥 Nếu token mất đi thì chuyển hướng về trang đăng nhập
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Có thể giữ đoạn này để hiển thị ngắn trong thời gian render
  if (!token) {
    return <p>Đang chuyển hướng đến trang đăng nhập...</p>;
  }

  return (
    <div className="acc-settings">
      <TopNavbar />
      {/* Sidebar trái */}
      <div className="acc-sidebar">
        <h3>Thông tin tài khoản</h3>
        <ul>
          <li
            className={selectedTab === "personal" ? "acc-active" : ""}
            onClick={() => setSelectedTab("personal")}
          >
            Thông tin cá nhân
          </li>
          <li
            className={selectedTab === "password" ? "acc-active" : ""}
            onClick={() => setSelectedTab("password")}
          >
            Cài đặt tài khoản
          </li>
        </ul>
      </div>

      {/* Nội dung bên phải */}
      <div className="acc-content">
        {selectedTab === "personal" && <PersonalInfo />}
        {selectedTab === "password" && <PasswordChange />}
      </div>
    </div>
  );
};

export default AccountSettings;
