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

    const fetchCategories = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/admin/get-categories");
            setCategories(res.data);
        } catch (error) {
            toast.error("Lỗi khi tải danh sách danh mục con");
        }
    };

    const fetchParentCategories = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/admin/get-parent-categories");
            setParentCategories(res.data);
        } catch (error) {
            toast.error("Không thể lấy danh mục cha");
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setNewName(category.tenDanhMuc);
        setParentId(category.maDanhMucCha);
    };

    const handleUpdate = async () => {
        if (!newName.trim()) {
            toast.error("Vui lòng nhập tên danh mục!");
            return;
        }

        try {
            await axios.put(
                `http://localhost:5133/api/admin/update-category/${editingCategory.maDanhMuc}`,
                { tenDanhMuc: newName, danhMucChaId: parentId }
            );
            toast.success("Cập nhật danh mục thành công!");
            fetchCategories();
            setEditingCategory(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

        try {
            await axios.delete(`http://localhost:5133/api/admin/delete-category/${id}`);
            toast.success("Xóa danh mục thành công!");
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa danh mục!");
        }
    };

    const getParentCategoryName = (parentId) => {
        const parent = parentCategories.find((p) => p.maDanhMucCha === parentId);
        return parent ? parent.tenDanhMucCha : "Không xác định";
    };

    return (
        <div className="manage-categories">
            <h2 className="manage-categories__title">Quản Lý Danh Mục Con</h2>
            <ToastContainer autoClose={3000} />

            <table className="manage-categories__table">
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
                                <td>{index + 1}</td>
                                <td>
                                    {editingCategory?.maDanhMuc === cat.maDanhMuc ? (
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="manage-categories__input"
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
                                            className="manage-categories__select"
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
                                            <button
                                                className="manage-categories__btn manage-categories__btn--save"
                                                onClick={handleUpdate}
                                            >
                                                💾 Lưu
                                            </button>
                                            <button
                                                className="manage-categories__btn manage-categories__btn--cancel"
                                                onClick={() => setEditingCategory(null)}
                                            >
                                                ❌ Hủy
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="manage-categories__btn manage-categories__btn--edit"
                                                onClick={() => handleEdit(cat)}
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button
                                                className="manage-categories__btn manage-categories__btn--delete"
                                                onClick={() => handleDelete(cat.maDanhMuc)}
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="manage-categories__empty">
                                Không có danh mục nào
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ManageCategories;
