import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import "./PostTinDang.css";

const PostTinDang = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const location = useLocation();
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
  const [canNegotiate, setCanNegotiate] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [tinhThanhList, setTinhThanhList] = useState([]);
  const [quanHuyenList, setQuanHuyenList] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [showPreview, setShowPreview] = useState(false);
  
  // Character limits
  const TITLE_MAX_LENGTH = 80;
  const DESCRIPTION_MAX_LENGTH = 900;
  
  const getProvinceName = id =>
    (tinhThanhList.find(p =>`${p.maTinhThanh}` === id) || {}).tenTinhThanh || id;
  
  const getDistrictName = id =>
    (quanHuyenList.find(d => `${d.maQuanHuyen}` === id) || {}).tenQuanHuyen || id;

  const conditionMap = {
    Moi: "Mới",
    DaSuDung: "Đã sử dụng"
  };
  
  // Lấy categoryId và categoryName từ URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setCategoryId(queryParams.get("categoryId"));
    setCategoryName(queryParams.get("categoryName"));
  }, [location]);

  // Fetch danh sách tỉnh thành từ API
  useEffect(() => {
    const fetchTinhThanh = async () => {
      try {
        const response = await fetch("http://localhost:5133/api/tindang/tinhthanh");
        if (!response.ok) throw new Error("Không thể tải danh sách tỉnh thành");
        const data = await response.json();
        setTinhThanhList(data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách tỉnh thành:", error);
      }
    };
    fetchTinhThanh();
  }, []);

  // Fetch danh sách quận huyện khi tỉnh thành được chọn
  useEffect(() => {
    if (province) {
      const fetchQuanHuyen = async () => {
        try {
          const response = await fetch(`http://localhost:5133/api/tindang/tinhthanh/${province}/quanhuynh`);
          if (!response.ok) throw new Error("Không thể tải danh sách quận huyện");
          const data = await response.json();
          setQuanHuyenList(data);
        } catch (error) {
          console.error("Lỗi khi tải danh sách quận huyện:", error);
        }
      };
      fetchQuanHuyen();
    }
  }, [province]);

  // Hàm để định dạng giá thành chuỗi với dấu phân cách
  const formatPrice = (value) => {
    return value
      .replace(/[^\d]/g, "") // Lọc bỏ tất cả ký tự không phải là số
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1."); // Thêm dấu phân cách hàng nghìn
  };

  // Xử lý khi người dùng nhập tiêu đề
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    if (newTitle.length <= TITLE_MAX_LENGTH) {
      setTitle(newTitle);
    }
  };

  // Xử lý khi người dùng nhập mô tả
  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;
    if (newDescription.length <= DESCRIPTION_MAX_LENGTH) {
      setDescription(newDescription);
    }
  };

  // Xử lý khi người dùng nhập giá
  const handlePriceChange = (e) => {
    const rawValue = e.target.value;
    const formattedValue = formatPrice(rawValue);
    setPrice(formattedValue); // Cập nhật giá đã được định dạng
  };

  // Thêm state cho preview nhiều ảnh
  const [images, setImages] = useState([]); // Nhiều file ảnh
  const [previewImages, setPreviewImages] = useState([]); // Preview nhiều ảnh

  // Xử lý khi người dùng chọn nhiều file hình ảnh
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5); // Tối đa 5 ảnh
    setImages(files); // Lưu tất cả file ảnh (tối đa 5)
    setImage(files[0] || null); // Ảnh đầu tiên là đại diện (market)
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews); // Preview tất cả ảnh
    setImagePreview(previews[0] || null); // Ảnh đầu tiên cho input preview
  };

  // Xử lý nút Xem Trước
  const handlePreview = () => {
    // Kiểm tra tất cả các trường đã điền chưa
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    if (!title || !description || !price || !contactInfo || !province || !district) {
      alert("Vui lòng điền đầy đủ thông tin trước khi xem trước.");
      return;
    }

    // Nếu đã đầy đủ, hiển thị bảng xem trước
    setPreviewData({
      title,
      description,
      price,
      contactInfo,
      condition: conditionMap[condition],
      province: getProvinceName(province),
      district: getDistrictName(district),
      canNegotiate,
      categoryName,
      images: previewImages, // Preview tối đa 5 ảnh
    });
    setShowPreview(true);
  };

  // Xử lý khi người dùng submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!user || !user.id) {
      alert("Vui lòng đăng nhập!");
      return;
    }
  
    // Loại bỏ dấu phân cách trong giá
    const rawPrice = price.replace(/[^\d]/g, ""); // Lọc bỏ tất cả ký tự không phải là số
  
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", rawPrice); // Gửi giá đã được loại bỏ dấu phân cách
    formData.append("contactInfo", contactInfo);
    formData.append("condition", condition);
    formData.append("province", province);
    formData.append("district", district);
    formData.append("userId", user.id); // Lấy user.id từ context và gửi đi
    formData.append("categoryId", categoryId); // Gửi mã danh mục con
    formData.append("categoryName", categoryName); // Gửi tên danh mục con
    formData.append("canNegotiate", canNegotiate); // Gửi giá trị canNegotiate
    images.forEach((img, idx) => formData.append("images", img)); // Gửi tối đa 5 ảnh
  
    try {
      const response = await axios.post("http://localhost:5133/api/tindang/add-post", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Thông báo thành công
      setStatusMessage("✅ Tin bạn đã được gửi đi, vui lòng đợi duyệt!");
      alert("Tin bạn đã được gửi đi, vui lòng đợi duyệt!"); // Hiển thị thông báo dạng pop-up
      setTimeout(() => {
        navigate("/quan-ly-tin"); // Chuyển hướng sau khi đăng thành công
      }, 800);
    } catch (error) {
      console.error("Lỗi khi đăng tin:", error);
      setStatusMessage("❌ Đăng tin thất bại!");
      alert("Đăng tin thất bại!");
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
        {categoryName && (
          <div className="post-tindang-group">
            <label>Danh mục con đã chọn</label>
            <textarea
              value={`Danh mục con đã chọn: ${categoryName}`}
              readOnly
              rows="4"
              cols="50"
            />
          </div>
        )}
        <div className="post-tindang-group">
          <label>Tiêu đề (tối đa {TITLE_MAX_LENGTH} ký tự)</label>
          <input 
            type="text" 
            value={title} 
            onChange={handleTitleChange} 
            maxLength={TITLE_MAX_LENGTH}
            required 
          />
          <div className="char-counter">
            {title.length}/{TITLE_MAX_LENGTH}
          </div>
        </div>
        <div className="post-tindang-group">
          <label>Mô tả (tối đa {DESCRIPTION_MAX_LENGTH} ký tự)</label>
          <textarea 
            value={description} 
            onChange={handleDescriptionChange} 
            maxLength={DESCRIPTION_MAX_LENGTH}
            required 
          />
          <div className="char-counter">
            {description.length}/{DESCRIPTION_MAX_LENGTH}
          </div>
        </div>
        <div className="post-tindang-group">
          <label>Giá</label>
          <input type="text" value={price} onChange={handlePriceChange} required />
        </div>
        <div className="post-tindang-group">
          <label>Địa chỉ cụ thể</label>
          <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required />
        </div>
        <div className="post-tindang-group">
          <label>Tình trạng sản phẩm</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} required>
            <option value="Moi">{conditionMap.Moi}</option>
            <option value="DaSuDung">{conditionMap.DaSuDung}</option>
          </select>
        </div>
        <div className="post-tindang-group">
          <label>
            <input
              type="checkbox"
              checked={canNegotiate}
              onChange={(e) => setCanNegotiate(e.target.checked)}
            />
            Có thể thương lượng
          </label>
        </div>
        <div className="post-tindang-group">
          <label>Tỉnh/Thành</label>
          <select value={province} onChange={(e) => setProvince(e.target.value)} required>
            <option value="">Chọn tỉnh thành</option>
            {tinhThanhList.map((tinh) => (
              <option key={tinh.maTinhThanh} value={tinh.maTinhThanh}>
                {tinh.tenTinhThanh}
              </option>
            ))}
          </select>
        </div>
        <div className="post-tindang-group">
          <label>Quận/Huyện</label>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} required>
            <option value="">Chọn quận huyện</option>
            {quanHuyenList.map((quan) => (
              <option key={quan.maQuanHuyen} value={quan.maQuanHuyen}>
                {quan.tenQuanHuyen}
              </option>
            ))}
          </select>
        </div>
        <div className="post-tindang-group">
          <label>Ảnh (tối đa 5 ảnh):</label>
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            accept="image/*"
            maxLength={5}
          />
          {images.length > 5 && (
            <div className="error-message" style={{ color: 'red' }}>
              Chỉ được chọn tối đa 5 ảnh.
            </div>
          )}
          {/* Hiển thị tất cả ảnh đã chọn, cho phép xóa từng ảnh */}
          {previewImages && previewImages.length > 0 && (
            <div className="image-preview-list" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {previewImages.map((src, idx) => (
                <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={src} alt={`Preview ${idx + 1}`} style={{ maxWidth: 90, maxHeight: 90, border: '1px solid #ccc', borderRadius: 4 }} />
                  <button
                    type="button"
                    onClick={() => {
                      // Xóa ảnh khỏi images và previewImages
                      const newImages = images.filter((_, i) => i !== idx);
                      const newPreviews = previewImages.filter((_, i) => i !== idx);
                      setImages(newImages);
                      setPreviewImages(newPreviews);
                      setImage(newImages[0] || null);
                      setImagePreview(newPreviews[0] || null);
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: 'rgba(255,255,255,0.8)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      cursor: 'pointer',
                      color: '#d00',
                      fontWeight: 'bold',
                      lineHeight: '20px',
                      padding: 0
                    }}
                    title="Xóa ảnh"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Button group */}
        <div className="post-tindang-button-group">
          <button 
            type="button" 
            onClick={handlePreview}
            className={`preview-btn ${showPreview ? 'active' : ''}`}
          >
            {showPreview ? 'Đóng Xem trước' : 'Xem Trước'}
          </button>
          <button type="submit">Đăng Tin</button>
        </div>

        {/* Xem trước bài đăng */}
        {showPreview && previewData && (
          <div className="post-tindang-preview" style={{ textAlign: 'left' }}>
            <h3>Xem Trước Bài Đăng</h3>
            <table className="post-tindang-preview-table">
              <tbody>
                <tr><td>Tiêu đề</td><td>{previewData.title}</td></tr>
                {/* Cập nhật mô tả để hiển thị đúng định dạng */}
                <tr><td>Mô tả</td><td>
                  <div 
                    dangerouslySetInnerHTML={{ __html: previewData.description.replace(/\n/g, "<br>") }} // Thay \n bằng <br>
                  />
                </td></tr>
                <tr><td>Giá</td><td>{previewData.price}</td></tr>
                <tr><td>Liên hệ</td><td>{previewData.contactInfo}</td></tr>
                <tr><td>Tình trạng</td><td>{previewData.condition}</td></tr>
                <tr><td>Tỉnh/Thành</td><td>{previewData.province}</td></tr>
                <tr><td>Quận/Huyện</td><td>{previewData.district}</td></tr>
                <tr><td>Danh mục</td><td>{previewData.categoryName}</td></tr>
                <tr><td>Thương lượng</td><td>{previewData.canNegotiate ? "Có" : "Không"}</td></tr>
                <tr>
                  <td>Ảnh</td>
                  <td>
                    {previewData.images && previewData.images.length > 0 ? (
                      previewData.images.map((src, idx) => (
                        <img key={idx} src={src} alt={`Preview ${idx + 1}`} style={{ maxWidth: '120px', maxHeight: '120px', marginRight: 8 }} />
                      ))
                    ) : (
                      <span>Không có ảnh</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </form>
    </div>
  );
};

export default PostTinDang;