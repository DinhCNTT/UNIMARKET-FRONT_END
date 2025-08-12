import { useState, useEffect } from "react";
import axios from "axios";  
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ManageParentCategories.css";

const ManageParentCategories = () => {
    const [categories, setCategories] = useState([]);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newName, setNewName] = useState("");
    const [newImage, setNewImage] = useState(null);
    const [newIcon, setNewIcon] = useState(null);
    const [previewImage, setPreviewImage] = useState("");
    const [previewIcon, setPreviewIcon] = useState("");

    const baseUrl = "http://localhost:5133/";

    useEffect(() => {
        fetchCategories();
    }, []);
    
    const fetchCategories = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/admin/get-parent-categories");
            setCategories(res.data);
        } catch (error) {
            toast.error("Lỗi khi tải danh sách danh mục cha");
        }
    };
    
    const handleEdit = (category) => {
        setEditingCategory(category);
        setNewName(category.tenDanhMucCha);
        setPreviewImage(category.anhDanhMucCha);
        setPreviewIcon(category.icon);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setNewImage(file);
        setPreviewImage(URL.createObjectURL(file));
    };

    const handleIconChange = (e) => {
        const file = e.target.files[0];
        setNewIcon(file);
        setPreviewIcon(URL.createObjectURL(file));
    };

    const handleUpdate = async () => {
        if (!newName.trim()) {
            toast.error("Vui lòng nhập tên danh mục!");
            return;
        }

        const formData = new FormData();
        formData.append("tenDanhMucCha", newName);
        if (newImage) formData.append("anhDanhMuc", newImage);
        if (newIcon) formData.append("icon", newIcon);

        try {
            await axios.put(
                `http://localhost:5133/api/admin/update-parent-category/${editingCategory.maDanhMucCha}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            toast.success("Cập nhật danh mục cha thành công!");
            fetchCategories();
            setEditingCategory(null);
            setNewImage(null);
            setNewIcon(null);
            setPreviewImage("");
            setPreviewIcon("");
        } catch (error) {
            toast.error("Lỗi khi cập nhật");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

        try {
            const childCategoriesResponse = await axios.get("http://localhost:5133/api/admin/get-categories");
            const childCategories = childCategoriesResponse.data;
            const relatedChildCategories = childCategories.filter(child => child.maDanhMucCha === id);

            if (relatedChildCategories.length > 0) {
                const childCategoryNames = relatedChildCategories.map(child => child.tenDanhMuc).join(", ");
                toast.error(`Không thể xóa danh mục vì đang tồn tại các danh mục con: ${childCategoryNames}`);
                return;
            }

            await axios.delete(`http://localhost:5133/api/admin/delete-parent-category/${id}`);
            toast.success("Xóa danh mục cha thành công!");
            fetchCategories();
        } catch (error) {
            toast.error("Lỗi khi xóa danh mục cha!");
        }
    };

    return (
        <div className="manage-parent-categories">
            <h2 className="manage-parent-categories__title">Quản Lý Danh Mục Cha</h2>
            <ToastContainer autoClose={3000} />

            <table className="manage-parent-categories__table">
                <thead>
                    <tr>
                        <th>Mã DM</th>
                        <th>Tên Danh Mục</th>
                        <th>Ảnh</th>
                        <th>Icon</th>
                        <th>Thao Tác</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.length > 0 ? (
                        categories.map(cat => (
                            <tr key={cat.maDanhMucCha}>
                                <td>{cat.maDanhMucCha}</td>
                                <td>
                                    {editingCategory?.maDanhMucCha === cat.maDanhMucCha ? (
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                            className="manage-parent-categories__input"
                                        />
                                    ) : (
                                        cat.tenDanhMucCha
                                    )}
                                </td>
                                <td>
                                    {editingCategory?.maDanhMucCha === cat.maDanhMucCha ? (
                                        <div className="manage-parent-categories__file-upload">
                                            <input type="file" onChange={handleImageChange} />
                                            {previewImage && (
                                                <img src={previewImage} alt="Ảnh preview" className="manage-parent-categories__image-preview" />
                                            )}
                                        </div>
                                    ) : (
                                        <img
                                            src={cat.anhDanhMucCha}
                                            alt="Ảnh danh mục"
                                            className="manage-parent-categories__image"
                                        />
                                    )}
                                </td>
                                <td>
                                    {editingCategory?.maDanhMucCha === cat.maDanhMucCha ? (
                                        <div className="manage-parent-categories__file-upload">
                                            <input type="file" onChange={handleIconChange} />
                                            {previewIcon && (
                                                <img src={previewIcon} alt="Icon preview" className="manage-parent-categories__icon-preview" />
                                            )}
                                        </div>
                                    ) : (
                                        <img
                                            src={cat.icon}
                                            alt="Icon danh mục"
                                            className="manage-parent-categories__icon"
                                        />
                                    )}
                                </td>
                                <td>
                                    {editingCategory?.maDanhMucCha === cat.maDanhMucCha ? (
                                        <>
                                            <button className="manage-parent-categories__btn manage-parent-categories__btn--save" onClick={handleUpdate}>💾 Lưu</button>
                                            <button className="manage-parent-categories__btn manage-parent-categories__btn--cancel" onClick={() => setEditingCategory(null)}>❌ Hủy</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="manage-parent-categories__btn manage-parent-categories__btn--edit" onClick={() => handleEdit(cat)}>✏️ Sửa</button>
                                            <button className="manage-parent-categories__btn manage-parent-categories__btn--delete" onClick={() => handleDelete(cat.maDanhMucCha)}>🗑️ Xóa</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="manage-parent-categories__empty">Không có danh mục cha nào</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ManageParentCategories;
