import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ManageCategories.css";

const ManageCategories = () => {
    const [categories, setCategories] = useState([]);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newName, setNewName] = useState("");
    const [parentId, setParentId] = useState(0);
    const [parentCategories, setParentCategories] = useState([]);

    useEffect(() => {
        fetchCategories();
        fetchParentCategories();
    }, []);

    // Lấy danh sách danh mục con
    const fetchCategories = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/admin/get-categories");
            console.log("Categories fetched:", res.data);  // Debug log for categories
            setCategories(res.data);
        } catch (error) {
            console.error("Lỗi khi lấy danh mục con:", error);
            toast.error("Lỗi khi tải danh sách danh mục con");
        }
    };

    // Lấy danh sách danh mục cha
    const fetchParentCategories = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/admin/get-parent-categories");
            console.log("Parent categories fetched:", res.data);  // Debug log for parent categories
            setParentCategories(res.data);
        } catch (error) {
            console.error("Lỗi khi lấy danh mục cha:", error);
            toast.error("Không thể lấy danh mục cha");
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setNewName(category.tenDanhMuc);
        setParentId(category.maDanhMucCha); // Make sure this is the correct property for the parent ID
    };

    const handleUpdate = async () => {
        if (!newName.trim()) {
            toast.error("Vui lòng nhập tên danh mục!");
            return;
        }

        try {
            await axios.put(
                `http://localhost:5133/api/admin/update-category/${editingCategory.maDanhMuc}`,
                {
                    tenDanhMuc: newName,
                    danhMucChaId: parentId
                }
            );
            toast.success("Cập nhật danh mục thành công!");
            fetchCategories(); // Re-fetch categories after update
            setEditingCategory(null); // Close the edit form
        } catch (error) {
            console.error("Lỗi khi cập nhật danh mục:", error);
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

        try {
            await axios.delete(`http://localhost:5133/api/admin/delete-category/${id}`);
            toast.success("Xóa danh mục thành công!");
            fetchCategories(); // Re-fetch categories after delete
        } catch (error) {
            console.error("Lỗi khi xóa danh mục:", error);
            toast.error(error.response?.data?.message || "Lỗi khi xóa danh mục!");
        }
    };

    // Tìm tên danh mục cha dựa vào ID
    const getParentCategoryName = (parentId) => {
        const parent = parentCategories.find((p) => p.maDanhMucCha === parentId);
        return parent ? parent.tenDanhMucCha : "Không xác định";
    };

    return (
        <div className="category-page-container">
            <h2>Quản Lý Danh Mục Con</h2>
            <ToastContainer autoClose={3000} />

            <table className="category-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Tên Danh Mục</th>
                        <th>Danh Mục Cha</th>
                        <th>Thao Tác</th>  
                    </tr>
                </thead>
                <tbody>
                    {categories.length > 0 ? (
                        categories.map((cat, index) => (
                            <tr key={cat.maDanhMuc}>
                                <td>{index + 1}</td> {/* Hiển thị thứ tự theo index */}
                                <td>
                                    {editingCategory?.maDanhMuc === cat.maDanhMuc ? (
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="edit-input"
                                        />
                                    ) : (
                                        cat.tenDanhMuc
                                    )}
                                </td>
                                <td>
                                    {editingCategory?.maDanhMuc === cat.maDanhMuc ? (
                                        <select
                                            value={parentId}
                                            onChange={(e) => setParentId(parseInt(e.target.value))}
                                        >
                                            {parentCategories.length > 0 ? (
                                                parentCategories.map((parent) => (
                                                    <option key={parent.maDanhMucCha} value={parent.maDanhMucCha}>
                                                        {parent.tenDanhMucCha}
                                                    </option>
                                                ))
                                            ) : (
                                                <option>Không có danh mục cha</option>
                                            )}
                                        </select>
                                    ) : (
                                        cat.tenDanhMucCha || getParentCategoryName(cat.maDanhMucCha)
                                    )}
                                </td>
                                <td>
                                    {editingCategory?.maDanhMuc === cat.maDanhMuc ? (
                                        <>
                                            <button className="save-btn" onClick={handleUpdate}>
                                                💾 Lưu
                                            </button>
                                            <button className="cancel-btn" onClick={() => setEditingCategory(null)}>
                                                ❌ Hủy
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="edit-btn" onClick={() => handleEdit(cat)}>
                                                ✏️ Sửa
                                            </button>
                                            <button className="delete-btn" onClick={() => handleDelete(cat.maDanhMuc)}>
                                                🗑️ Xóa
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" style={{ textAlign: "center" }}>Không có danh mục nào</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}; 

export default ManageCategories;
