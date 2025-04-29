import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; 
import "./EmployeeList.css";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("http://localhost:5133/api/admin/employees");
      setEmployees(response.data);
    } catch (error) {
      console.error("❌ Lỗi khi lấy danh sách nhân viên:", error);
    }
  };

  const toggleLock = async (userId, isLocked) => {
    console.log("🔄 Gửi request:", `/api/admin/toggle-lock/${userId}`);

    try {
      await axios.post(`http://localhost:5133/api/admin/toggle-lock/${userId}`);
      
      if (!isLocked) {
        toast.success("🔒 Nhân viên đã bị khóa!");
      } else {
        toast.success("✅ Nhân viên đã được mở khóa!");
      }

      fetchEmployees(); 
    } catch (error) {
      toast.error("❌ Lỗi khi thay đổi trạng thái tài khoản!");
      console.error("❌ Lỗi khi thay đổi trạng thái tài khoản:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="employee-list-container">
      <h2 className="employee-title">Quản Lý Nhân Viên</h2>

      <ToastContainer 
      autoClose={3000} />

      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ Tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Chức vụ</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees.map((emp, index) => (
                <tr key={index}>
                  <td>{emp.employeeCode || "N/A"}</td>
                  <td>{emp.fullName || "Chưa có dữ liệu"}</td>
                  <td>{emp.email || "N/A"}</td>
                  <td>{emp.phoneNumber || "N/A"}</td>
                  <td>{emp.role || "Không rõ"}</td>
                  <td>
                    {emp.isLocked ? (
                      <span className="locked-status">🔒 Bị khóa</span>
                    ) : (
                      <span className="active-status">✅ Hoạt động</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleLock(emp.userId, emp.isLocked)}
                      className={`toggle-lock-button ${emp.isLocked ? "unlock" : "lock"}`}
                    >
                      {emp.isLocked ? "Mở khóa" : "Khóa"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data-message">Chưa có nhân viên nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeList;