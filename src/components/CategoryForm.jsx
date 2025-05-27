import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./Sidebar";
import "./CategoryForm.css";

const CategoryForm = () => {
    const [tenDanhMuc, setTenDanhMuc] = useState("");
    const [maDanhMucCha, setMaDanhMucCha] = useState("");
    const [parentCategories, setParentCategories] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        axios.get("http://localhost:5133/api/admin/get-parent-categories")
            .then((response) => {
                setParentCategories(response.data);
            })
            .catch((error) => {
                console.error("Lỗi khi lấy danh mục cha:", error);
                toast.error("Không thể tải danh mục cha!");
            });
    }, []);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Client-side validation
    if (!tenDanhMuc.trim()) {
        toast.error("❌ Vui lòng nhập tên danh mục!");
        return;
    }

    if (!maDanhMucCha) {
        toast.error("❌ Vui lòng chọn danh mục cha!");
        return;
    }

    try {
        const formData = new FormData();
        formData.append("tenDanhMuc", tenDanhMuc.trim());
        formData.append("maDanhMucCha", Number(maDanhMucCha));

        const response = await axios.post(
            "http://localhost:5133/api/admin/add-category",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        );

        if (response.data.success) {
            toast.success("✅ " + response.data.message);
            setTenDanhMuc("");
            setMaDanhMucCha("");
        } else {
            toast.error("❌ " + response.data.message);
        }
    } catch (error) {
        console.error("Chi tiết lỗi:", error.response?.data);
        const message = error.response?.data?.message || "❌ Có lỗi xảy ra khi thêm danh mục!";
        toast.error(message);
        
        // Hiển thị thông báo lỗi chi tiết hơn nếu có
        if (error.response?.status === 409) { // Conflict - trùng tên
            setErrorMessage(message);
        }
    }
};

    return (
        <div className="category-page-container">
            <Sidebar />
            <h2 className="category-title">Thêm Danh Mục Con</h2>
            <form className="category-form" onSubmit={handleSubmit}>
                <div className="category-form-group">
                    <label>Tên danh mục con:</label>
                    <input 
                        type="text" 
                        value={tenDanhMuc} 
                        onChange={(e) => setTenDanhMuc(e.target.value)} 
                        required 
                    />
                </div>

                <div className="category-form-group">
                    <label>Danh mục cha:</label>
                    <select 
                        value={maDanhMucCha} 
                        onChange={(e) => setMaDanhMucCha(Number(e.target.value))} // ✅ ép kiểu ở đây luôn
                        required
                    >
                        <option value="">Chọn danh mục cha</option>
                        {parentCategories.map((parent) => (
                            <option 
                                key={parent.maDanhMucCha} 
                                value={parent.maDanhMucCha}
                            >
                                {parent.tenDanhMucCha}
                            </option>
                        ))}
                    </select>
                </div>

                {errorMessage && (
                    <div style={{ color: "red", fontWeight: "500" }}>
                        {errorMessage}
                    </div>
                )}

                <button type="submit" className="category-submit-button">
                    Thêm Danh Mục
                </button>
            </form>
            <ToastContainer autoClose={3000} />
        </div>
    );
};

export default CategoryForm;
