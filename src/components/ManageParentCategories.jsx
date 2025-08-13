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

    // Địa chỉ baseUrl cho hình ảnh
    const baseUrl = "http://localhost:5133/";

    useEffect(() => {
        fetchCategories();
    }, []);
    
    const fetchCategories = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/admin/get-parent-categories");
            console.log("Data from API:", res.data); // Xem dữ liệu có icon chưa
            setCategories(res.data);
        } catch (error) {
            console.error("Lỗi khi lấy danh mục cha:", error);
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
        setPreviewImage(URL.createObjectURL(file)); // Hiển thị ảnh preview
    };

    const handleIconChange = (e) => {
        const file = e.target.files[0];
        setNewIcon(file);
        setPreviewIcon(URL.createObjectURL(file)); // Hiển thị icon preview
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
            const response = await axios.put(
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
        } catch (error) {
            toast.error("Lỗi khi cập nhật");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

        try {
            // Trước khi xóa, kiểm tra xem có danh mục con nào không
            const childCategoriesResponse = await axios.get("http://localhost:5133/api/admin/get-categories");
            const childCategories = childCategoriesResponse.data;
            
            // Lọc ra các danh mục con thuộc danh mục cha cần xóa
            const relatedChildCategories = childCategories.filter(
                (child) => child.maDanhMucCha === id
            );

            // Nếu có danh mục con, hiển thị thông báo chi tiết
            if (relatedChildCategories.length > 0) {
                const childCategoryNames = relatedChildCategories.map(
                    (child) => child.tenDanhMuc
                ).join(", ");
                
                toast.error(
                    `Không thể xóa danh mục vì đang tồn tại các danh mục con: ${childCategoryNames}`
                );
                return;
            }

            // Nếu không có danh mục con, tiến hành xóa
            await axios.delete(`http://localhost:5133/api/admin/delete-parent-category/${id}`);
            toast.success("Xóa danh mục cha thành công!");
            fetchCategories();
        } catch (error) {
            toast.error("Lỗi khi xóa danh mục cha!");
        }
    };

    return (
        <div className="ManageParentCategoriesPageContainer">
            <h2>Quản Lý Danh Mục Cha</h2>
            <ToastContainer autoClose={3000} />

            <table className="ManageParentCategoriesTable">
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
                    {categories.map((cat) => (
                        <tr key={cat.maDanhMucCha}>
                            <td>{cat.maDanhMucCha}</td>
                            <td>
                                {editingCategory?.maDanhMucCha === cat.maDanhMucCha ? (
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="ManageParentCategoriesEditInput"
                                    />
                                ) : (
                                    cat.tenDanhMucCha
                                )}
                            </td>
                            <td>
                                {editingCategory?.maDanhMucCha === cat.maDanhMucCha ? (
                                    <div className="ManageParentCategoriesFileUpload">
                                        <input type="file" onChange={handleImageChange} />
                                        {previewImage && (
                                            <img src={previewImage} alt="Preview" className="ManageParentCategoriesImagePreview" />
                                        )}
                                    </div>
                                ) : (
                                    <img
                                        src={cat.anhDanhMucCha}
                                        alt="Ảnh DM"
                                        className="ManageParentCategoriesCategoryImage"
                                    />
                                )}
                            </td>
                            <td>
                                {editingCategory?.maDanhMucCha === cat.maDanhMucCha ? (
                                    <div className="ManageParentCategoriesFileUpload">
                                        <input type="file" onChange={handleIconChange} />
                                        {previewIcon && (
                                            <img src={previewIcon} alt="Icon Preview" className="ManageParentCategoriesIconPreview" />
                                        )}
                                    </div>
                                ) : (
                                    <img
                                        src={cat.icon}
                                        alt="Icon DM"
                                        className="ManageParentCategoriesCategoryIcon"
                                    />
                                )}
                            </td>
                            <td>
                                {editingCategory?.maDanhMucCha === cat.maDanhMucCha ? (
                                    <>
                                        <button className="ManageParentCategoriesSaveBtn" onClick={handleUpdate}>💾 Lưu</button>
                                        <button className="ManageParentCategoriesCancelBtn" onClick={() => setEditingCategory(null)}>❌ Hủy</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="ManageParentCategoriesEditBtn" onClick={() => handleEdit(cat)}>✏️ Sửa</button>
                                        <button className="ManageParentCategoriesDeleteBtn" onClick={() => handleDelete(cat.maDanhMucCha)}>🗑️ Xóa</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageParentCategories;