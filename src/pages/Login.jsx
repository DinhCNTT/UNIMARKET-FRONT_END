import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import authService from "../services/authService";
import "./Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const { setUser, setRole, setFullName, setToken } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        try {
            const userData = await authService.login(email, password);

            if (!userData || !userData.token || !userData.role) {
                setErrorMessage("Không thể xác thực tài khoản!");
                return;
            }

            // Lưu vào context (không lưu vào localStorage nữa)
            setUser(userData);
            setRole(userData.role);
            setFullName(userData.fullName);
            setToken(userData.token);

            // Điều hướng theo vai trò
            navigate(userData.role === "Admin" ? "/admin" : "/market");
        } catch (error) {
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

                <form onSubmit={handleLogin} autoComplete="on">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email" // Chrome sẽ gợi ý và lưu email nếu người dùng chọn
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password" // Chrome sẽ gợi ý và lưu mật khẩu nếu người dùng chọn
                        required
                    />

                    <button type="submit">Đăng nhập</button>
                </form>

                <p className="signup-link">
                    Chưa có tài khoản? <a href="/register">Đăng ký</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
