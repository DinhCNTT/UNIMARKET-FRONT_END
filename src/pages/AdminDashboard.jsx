import { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../components/Sidebar";
import "./AdminDashboard.css";

const API_URL = "http://localhost:5133/api/admin"; // Cập nhật đường dẫn backend

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingUser, setProcessingUser] = useState(null); // Xử lý trạng thái

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`${API_URL}/users`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    withCredentials: true,
                });

                setUsers(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách người dùng:", error);
                setError("Không thể lấy danh sách người dùng!");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Hàm xóa người dùng
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
        setProcessingUser(userId);

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/delete-user/${userId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                withCredentials: true,
            });

            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));

            toast.success("✅ Người dùng đã bị xóa!", {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
            });
        } catch (error) {
            console.error("Lỗi khi xóa người dùng:", error);
            toast.error("⛔ Không thể xóa người dùng!", {
                position: "top-right",
                autoClose: 4000,
                theme: "dark",
            });
        } finally {
            setProcessingUser(null);
        }
    };
    

    const handleLogout = () => {
        console.log("👉 Đang đăng xuất...");
        localStorage.removeItem("token"); // Xóa token khỏi localStorage
        window.location.href = "/login"; // Chuyển hướng về trang đăng nhập
    };

    const handleToggleLockUser = async (userId, isLocked) => {
        if (!window.confirm(`Bạn có chắc muốn ${isLocked ? "mở khóa" : "khóa"} người dùng này?`)) return;
        setProcessingUser(userId);
    
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${API_URL}/toggle-lock/${userId}`, {}, { // ⚠️ Thay PUT → POST
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                withCredentials: true,
            });
    
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === userId ? { ...user, isLocked: !isLocked } : user
                )
            );
    
            toast.success(`✅ Người dùng đã được ${isLocked ? "mở khóa" : "khóa"}!`, {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
            });
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái người dùng:", error);
            toast.error("⛔ Không thể cập nhật trạng thái người dùng!", {
                position: "top-right",
                autoClose: 4000,
                theme: "dark",
            });
        } finally {
            setProcessingUser(null);
        }
    };
    if (loading) return <p>Đang tải...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (users.length === 0) return <p>Không có người dùng nào!</p>;

    

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <Sidebar onLogout={handleLogout} />
            <div className="content">
                <h2>Quản lý Người Dùng</h2>
                <div className="user-table-container">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Email</th>
                                <th>Họ Tên</th>
                                <th>Số Điện Thoại</th>
                                <th>Vai Trò</th>
                                <th>Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={user.id}>
                                    <td>{index + 1}</td>
                                    <td>{user.email}</td>
                                    <td>{user.fullName}</td>
                                    <td>{user.phoneNumber}</td>
                                    <td>{user.role}</td>
                                    <td>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="delete-btn"
                                            disabled={processingUser === user.id}
                                        >
                                            {processingUser === user.id ? "Đang xóa..." : "Xóa"}
                                        </button>
                                        <button
                                            onClick={() => handleToggleLockUser(user.id, user.isLocked)}
                                            className={`lock-btn ${user.isLocked ? "unlocked" : "locked"}`}
                                            disabled={processingUser === user.id}
                                        >
                                            {processingUser === user.id ? "Đang xử lý..." : (user.isLocked ? "Mở khóa" : "Khóa")}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default AdminDashboard;
