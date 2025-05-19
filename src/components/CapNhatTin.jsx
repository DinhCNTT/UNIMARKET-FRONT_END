import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
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
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [tinhThanhList, setTinhThanhList] = useState([]);
  const [quanHuyenList, setQuanHuyenList] = useState([]);
  const [oldImageIds, setOldImageIds] = useState([]);

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
          if (tinDang.anhTinDangs) {
            setOldImageIds(tinDang.anhTinDangs.map(img => img.maAnh));
            setImagePreviews(tinDang.anhTinDangs.map(img => img.duongDan));
          }
        })
        .catch((error) => {
          console.error("Lỗi khi lấy thông tin tin đăng:", error);
          alert("Không thể lấy thông tin tin đăng.");
        });
    }
  }, [id]);

  useEffect(() => {
    fetch("http://localhost:5133/api/tindang/tinhthanh")
      .then(res => res.json())
      .then(setTinhThanhList);
  }, []);

  useEffect(() => {
    if (province) {
      fetch(`http://localhost:5133/api/tindang/tinhthanh/${province}/quanhuynh`)
        .then(res => res.json())
        .then(setQuanHuyenList);
    }
  }, [province]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).slice(0, 5);
    setImages(selectedFiles);
    setImagePreviews(selectedFiles.map(file => URL.createObjectURL(file)));
    setOldImageIds([]); // Xóa hết ảnh cũ khi chọn ảnh mới
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      alert("Vui lòng đăng nhập!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("contactInfo", contactInfo);
    formData.append("condition", condition);
    formData.append("canNegotiate", true);
    formData.append("province", province);
    formData.append("district", district);
    formData.append("categoryId", categoryId);
    formData.append("userId", user.id);
    formData.append("oldImagesToDelete", JSON.stringify(oldImageIds));
    formData.append("oldImageOrder", JSON.stringify([]));

    images.forEach(image => {
      formData.append("newImages", image);
    });

    try {
      const response = await axios.put(`http://localhost:5133/api/TinDang/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const updatedImages = Array.isArray(response.data.anhTinDangs)
        ? response.data.anhTinDangs.map(image =>
            image.duongDan.startsWith("http")
              ? image.duongDan
              : `http://localhost:5133${image.duongDan}`
          )
        : [];

      setImagePreviews(updatedImages);
      setImages([]);
      setOldImageIds([]);
      setStatusMessage("✅ Tin bạn đã được cập nhật!");
      alert("Tin bạn đã được cập nhật!");
      navigate("/quan-ly-tin");

    } catch (error) {
      console.error("Lỗi khi cập nhật tin:", error);
      setStatusMessage("❌ Cập nhật tin thất bại!");
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
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="post-tindang-group">
          <label>Mô tả</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} required />
        </div>
        <div className="post-tindang-group">
          <label>Giá</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} required />
        </div>
        <div className="post-tindang-group">
          <label>Địa chỉ cụ thể</label>
          <input type="text" value={contactInfo} onChange={e => setContactInfo(e.target.value)} required />
        </div>
        <div className="post-tindang-group">
          <label>Tình trạng sản phẩm</label>
          <select value={condition} onChange={e => setCondition(e.target.value)} required>
            <option value="Moi">Mới</option>
            <option value="DaSuDung">Đã Sử Dụng</option>
          </select>
        </div>
        <div className="post-tindang-group">
          <label>Ảnh mới (tối đa 5)</label>
          <input type="file" multiple accept="image/*" onChange={handleFileChange} />
          <div className="image-preview-container">
            {imagePreviews.map((url, index) => (
              <img key={index} src={url} alt={`Preview ${index}`} style={{ maxWidth: 100, margin: 4 }} />
            ))}
          </div>
        </div>
        <div className="post-tindang-button-group">
          <button type="submit">Cập nhật Tin</button>
        </div>
      </form>
    </div>
  );
};

export default CapNhatTin;