import { useState, useEffect } from "react"; 
import axios from "axios";
import "./AddParentCategory.css";

const AddParentCategory = () => {
    const [tenDanhMucCha, setTenDanhMucCha] = useState("");
    const [anhDanhMucCha, setAnhDanhMucCha] = useState(null); // For image
    const [icon, setIcon] = useState(null); // For icon
    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/admin/get-parent-categories");
            setCategories(res.data);
        } catch (error) {
            console.error("Lỗi khi lấy danh mục cha:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tenDanhMucCha.trim()) return alert("Vui lòng nhập tên danh mục!");

        const formData = new FormData();
        formData.append("tenDanhMucCha", tenDanhMucCha);
        if (anhDanhMucCha) formData.append("anhDanhMucCha", anhDanhMucCha);
        if (icon) formData.append("icon", icon);

        try {
            const res = await axios.post("http://localhost:5133/api/admin/add-parent-category", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setMessage(res.data.message);
            setTenDanhMucCha("");
            setAnhDanhMucCha(null); // Reset image
            setIcon(null); // Reset icon
            fetchCategories();
        } catch (error) {
            setMessage(error.response?.data || "Lỗi khi thêm danh mục cha!");
        }
    };

    return (
        <div className="parent-category-page-container">
            <h2 className="parent-category-title">Thêm Danh Mục Cha</h2>

            <form className="parent-category-form" onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="form-group">
                    <label htmlFor="tenDanhMucCha">Tên Danh Mục Cha:</label>
                    <input
                        id="tenDanhMucCha"
                        type="text"
                        placeholder="Nhập tên danh mục cha"
                        value={tenDanhMucCha}
                        onChange={(e) => setTenDanhMucCha(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="anhDanhMucCha">Chọn Ảnh Danh Mục:</label>
                    <input
                        id="anhDanhMucCha"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAnhDanhMucCha(e.target.files[0])}
                        placeholder="Chọn ảnh danh mục"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="icon">Chọn Icon:</label>
                    <input
                        id="icon"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setIcon(e.target.files[0])}
                        placeholder="Chọn icon"
                    />
                </div>

                <button className="parent-category-submit-button" type="submit">Thêm</button>
            </form>

            {message && <p className="parent-category-message">{message}</p>}

            <div className="parent-category-list">
                <h3>Danh Mục Cha</h3>
                <ul>
                    {categories.map((cat) => (
                        <li key={cat.maDanhMucCha}>{cat.tenDanhMucCha}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AddParentCategory;