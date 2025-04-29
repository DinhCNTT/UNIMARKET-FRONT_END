import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select"; // 🛠 Import React-Select
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // 🛠 Import icon mắt
import Sidebar from "./Sidebar";
import "./AddEmployee.css";

const AddEmployee = () => {
  const [employees, setEmployees] = useState([]); // Danh sách nhân viên
  const [selectedEmail, setSelectedEmail] = useState(null); // Email được chọn
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [showPassword, setShowPassword] = useState(false); // Trạng thái hiển thị mật khẩu

  useEffect(() => {
    axios
      .get("http://localhost:5133/api/admin/users")
      .then((res) => {
        console.log("Dữ liệu nhân viên:", res.data); // 🛠 Kiểm tra API có dữ liệu không
        setEmployees(res.data);
      })
      .catch((err) => console.error("Lỗi khi lấy danh sách email", err));
  }, []);

  // Xử lý chọn email
  const handleSelectEmail = (selectedOption) => {
    setSelectedEmail(selectedOption);
    
    // Tìm thông tin nhân viên theo email đã chọn
    const selectedEmployee = employees.find(emp => emp.email === selectedOption.value);

    if (selectedEmployee) {
      setFullName(selectedEmployee.fullName || ""); // Nếu không có fullName thì để trống
      setPhoneNumber(selectedEmployee.phoneNumber || "");
      setPassword(selectedEmployee.password || ""); // 🛠 Hiển thị mật khẩu (nếu API trả về)
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fullName || !selectedEmail || !phoneNumber || !password) {
      toast.error("⚠️ Vui lòng điền đầy đủ thông tin!", { position: "top-right" });
      return;
    }

    const newEmployee = {
      fullName,
      email: selectedEmail.value,
      phoneNumber,
      password,
      role,
    };

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://127.0.0.1:5133/api/admin/add-or-update-employee",
        newEmployee,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("✅ Thêm nhân viên thành công!", { position: "top-right" });

      // Reset form sau khi thêm thành công
      setSelectedEmail(null);
      setFullName("");
      setPhoneNumber("");
      setPassword("");
      setRole("Employee");
    } catch (err) {
      console.error("Lỗi khi thêm nhân viên:", err.response?.data || err.message);
      toast.error(`❌ Lỗi: ${err.response?.data?.message || "Không thể thêm nhân viên!"}`);
    }
  };

  return (
    <div className="add-employee-container">
      <Sidebar />
      <h2>Thêm Nhân Viên</h2>
      <form className="add-employee-form" onSubmit={handleSubmit}>
        {/* Tìm kiếm email */}
        <div className="form-group">
          <label>Chọn Email:</label>
          <Select
            options={employees.map((emp) => ({
              value: emp.email,
              label: emp.email,
            }))}
            value={selectedEmail}
            onChange={handleSelectEmail}
            placeholder="Tìm email..."
            isSearchable
          />
        </div>

        {/* Họ và tên */}
        <div className="form-group">
          <label>Họ và Tên:</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        {/* Số điện thoại */}
        <div className="form-group">
          <label>Số Điện Thoại:</label>
          <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
        </div>

        {/* Mật khẩu có nút Ẩn/Hiện */}
        <div className="form-group">
          <label>Mật khẩu:</label>
          <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <input 
              type={showPassword ? "text" : "password"}  // Ẩn/hiện mật khẩu
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ flex: 1, paddingRight: "40px" }} // Chừa chỗ cho icon
            />
            <span 
              onClick={() => setShowPassword(!showPassword)} 
              style={{
                position: "absolute",
                right: "10px",
                cursor: "pointer",
                color: "#888"
              }}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
        </div>

        {/* Chức vụ */}
        <div className="form-group">
          <label>Chức vụ:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="Admin">Admin</option>
            <option value="Employee">Employee</option>
            <option value="User">User</option>
          </select>
        </div>

        <button type="submit" className="add-employee-button">
          Thêm Nhân Viên
        </button>
      </form>
      <ToastContainer autoClose={3000} />
    </div>
  );
};

export default AddEmployee;
