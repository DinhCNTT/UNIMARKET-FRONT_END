import axios from "axios";

const API_URL = "http://localhost:5133/api/auth";

// Đăng ký tài khoản
const register = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/register`, { email, password });
        return response.data;
    } catch (error) {
        console.error("Đăng ký thất bại:", error.response?.data || error.message);
        throw error;
    }
};

// Đăng nhập và lưu token cùng thông tin người dùng
const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email, password });

        // Kiểm tra nếu API trả về thông tin hợp lệ
        if (response.data.token) {
            // Lưu thông tin vào localStorage
            localStorage.setItem("token", response.data.token);  // Lưu token
            localStorage.setItem("user", JSON.stringify(response.data));  // Lưu đối tượng người dùng
            localStorage.setItem("userRole", response.data.role);  // Lưu role
            localStorage.setItem("userFullName", response.data.fullName || "");  // Lưu tên người dùng

            // Lưu ID người dùng vào localStorage
            localStorage.setItem("userId", response.data.id);  // Lưu ID người dùng
        }
        return response.data;
    } catch (error) {
        console.error("Đăng nhập thất bại:", error.response?.data || error.message);
        throw error;
    }
};

// Đăng xuất, xóa thông tin người dùng và token
const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userFullName");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");  // Xóa ID người dùng khi đăng xuất
};

// Lấy thông tin người dùng từ localStorage
const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user")) || null;
    } catch (error) {
        console.error("Lỗi khi lấy user từ localStorage:", error);
        return null;
    }
};

// Lấy ID người dùng từ localStorage
const getUserId = () => {
    return localStorage.getItem("userId");  // Trả về ID người dùng từ localStorage
};

// Kiểm tra quyền Admin
const isAdmin = () => {
    const user = getUser();
    return user?.role === "Admin";
};

// Kiểm tra quyền Nhân viên
const isStaff = () => {
    const user = getUser();
    return user?.role === "Staff";
};

// Kiểm tra người dùng đã đăng nhập chưa
const isAuthenticated = () => {
    const user = getUser();
    return !!user;
};

export default { register, login, logout, getUser, getUserId, isAdmin, isStaff, isAuthenticated };
