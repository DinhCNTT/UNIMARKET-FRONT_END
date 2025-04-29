import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import "./PostTinDang.css";

const CapNhatTin = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [condition, setCondition] = useState("Moi");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [tinhThanhList, setTinhThanhList] = useState([]);
  const [quanHuyenList, setQuanHuyenList] = useState([]);

  // Lấy thông tin tin đăng từ API
  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:5133/api/TinDang/get-post/${id}`)
        .then((response) => {
          const tinDang = response.data;
          setTitle(tinDang.tieuDe);
          setDescription(tinDang.moTa);
          setPrice(tinDang.gia);
          setContactInfo(tinDang.diaChi);
          setCondition(tinDang.tinhTrang);
          setProvince(tinDang.maTinhThanh);
          setDistrict(tinDang.maQuanHuyen);
          setCategoryId(tinDang.maDanhMuc);
          setCategoryName(tinDang.danhMuc?.tenDanhMuc);
          if (tinDang.AnhTinDangs && tinDang.AnhTinDangs.length > 0) {
            // Cập nhật preview ảnh đầu tiên
            setImagePreview(`http://localhost:5133/${tinDang.AnhTinDangs[0].DuongDan}`);
          }
        })
        .catch((error) => {
          console.error("Lỗi khi lấy thông tin tin đăng:", error);
          alert("Không thể lấy thông tin tin đăng.");
        });
    }
  }, [id]);

  // Fetch danh sách tỉnh thành và quận huyện
  useEffect(() => {
    const fetchTinhThanh = async () => {
      try {
        const response = await fetch("http://localhost:5133/api/tindang/tinhthanh");
        const data = await response.json();
        setTinhThanhList(data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách tỉnh thành:", error);
      }
    };
    fetchTinhThanh();
  }, []);

  useEffect(() => {
    if (province) {
      const fetchQuanHuyen = async () => {
        try {
          const response = await fetch(`http://localhost:5133/api/tindang/tinhthanh/${province}/quanhuynh`);
          const data = await response.json();
          setQuanHuyenList(data);
        } catch (error) {
          console.error("Lỗi khi tải danh sách quận huyện:", error);
        }
      };
      fetchQuanHuyen();
    }
  }, [province]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);  // Hiển thị ảnh đã chọn
      };
      reader.readAsDataURL(file);
      setImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !user.id) {
      alert("Vui lòng đăng nhập!");
      return;
    }

    const formData = new FormData();
    formData.append("TieuDe", title);
    formData.append("MoTa", description);
    formData.append("Gia", price);
    formData.append("DiaChi", contactInfo);
    formData.append("TinhTrang", condition);
    formData.append("MaNguoiBan", user.id);
    formData.append("MaDanhMuc", categoryId);
    formData.append("MaTinhThanh", province);
    formData.append("MaQuanHuyen", district);
    formData.append("CoTheThoaThuan", true);
    if (image) formData.append("image", image);

    try {
      // Gửi yêu cầu PUT để cập nhật tin đăng
      const response = await axios.put(
        `http://localhost:5133/api/TinDang/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Kiểm tra xem AnhTinDangs có tồn tại và là mảng hay không
      const updatedImages = Array.isArray(response.data.AnhTinDangs) 
  ? response.data.AnhTinDangs.map(image => 
      image.DuongDan.startsWith("http") 
        ? image.DuongDan 
        : `http://localhost:5133${image.DuongDan}`
    )
  : [];

// Nếu có ảnh thì set ảnh đầu tiên để preview
if (updatedImages.length > 0) {
  setImagePreview(updatedImages[0]);
}

      setStatusMessage("✅ Tin bạn đã được cập nhật!");
      alert("Tin bạn đã được cập nhật!");
      navigate("/quan-ly-tin");

    } catch (error) {
      console.error("Lỗi khi cập nhật tin:", error.response ? error.response.data : error.message);
      setStatusMessage("❌ Cập nhật tin thất bại!");
      alert("Cập nhật tin thất bại!");
    }
  };

  return (
    <div className="post-tindang-container">
      <TopNavbar />
      {statusMessage && (
        <p className={`post-tindang-status ${statusMessage.includes("thất bại") ? "error" : ""}`}>
          {statusMessage}
        </p>
      )}

      <form className="post-tindang-form" onSubmit={handleSubmit}>
        <div className="post-tindang-group">
          <label>Tiêu đề</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="post-tindang-group">
          <label>Mô tả</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div className="post-tindang-group">
          <label>Giá</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="post-tindang-group">
          <label>Địa chỉ cụ thể</label>
          <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required />
        </div>
        <div className="post-tindang-group">
          <label>Tình trạng sản phẩm</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} required>
            <option value="Moi">Mới</option>
            <option value="DaSuDung">Đã Sử Dụng</option>
          </select>
        </div>
        <div className="post-tindang-group">
          <label>Ảnh</label>
          <input type="file" onChange={handleFileChange} />
          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Image Preview" />
            </div>
          )}
        </div>

        <div className="post-tindang-button-group">
          <button type="submit">Cập nhật Tin</button>
        </div>
      </form>
    </div>
  );
};

export default CapNhatTin;
