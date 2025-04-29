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

    useEffect(() => {
        axios.get("http://localhost:5133/api/admin/get-parent-categories")
            .then((response) => {
                console.log("Dữ liệu danh mục cha nhận được:", response.data);
                setParentCategories(response.data);
            })
            .catch((error) => console.error("Lỗi khi lấy danh mục cha:", error));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!tenDanhMuc) {
            toast.error("❌ Vui lòng nhập tên danh mục!");
            return;
        }
    
        if (!maDanhMucCha) {
            toast.error("❌ Vui lòng chọn danh mục cha!");
            return;
        }
    
        try {
            const formData = new FormData();
            formData.append("tenDanhMuc", tenDanhMuc);
            formData.append("maDanhMucCha", maDanhMucCha);
    
            await axios.post("http://localhost:5133/api/admin/add-category", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
    
            toast.success("✅ Thêm danh mục thành công!");
            setTenDanhMuc("");
            setMaDanhMucCha("");
        } catch (error) {
            console.error("Chi tiết lỗi:", error.response?.data);
            toast.error(`❌ ${error.response?.data?.message || "Thêm danh mục thất bại!"}`);
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
                        onChange={(e) => setMaDanhMucCha(e.target.value)}
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

                <button type="submit" className="category-submit-button">
                    Thêm Danh Mục
                </button>
            </form>
            <ToastContainer autoClose={3000} />
        </div>
    );
};


export default CategoryForm;
