import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import "./PostTinDang.css";

const PostTinDang = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Thêm ref cho input file
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [categoryId, setCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [condition, setCondition] = useState("Moi");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [canNegotiate, setCanNegotiate] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [tinhThanhList, setTinhThanhList] = useState([]);
  const [quanHuyenList, setQuanHuyenList] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const TITLE_MAX_LENGTH = 80;
  const DESCRIPTION_MAX_LENGTH = 900;
  const MAX_IMAGES = 7;
  const MAX_VIDEOS = 1;

  // Tách riêng ảnh và video
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewVideos, setPreviewVideos] = useState([]);

  const getProvinceName = (id) =>
    (tinhThanhList.find((p) => `${p.maTinhThanh}` === id) || {}).tenTinhThanh || id;

  const getDistrictName = (id) =>
    (quanHuyenList.find((d) => `${d.maQuanHuyen}` === id) || {}).tenQuanHuyen || id;

  const conditionMap = {
    Moi: "Mới",
    DaSuDung: "Đã sử dụng",
  };

  // Function để cập nhật FileList của input
  const updateInputFiles = (inputRef, files) => {
    if (inputRef.current) {
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      inputRef.current.files = dt.files;
    }
  };

  // Lấy categoryId và categoryName từ URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setCategoryId(queryParams.get("categoryId"));
    setCategoryName(queryParams.get("categoryName"));
  }, [location]);

  // Load tỉnh thành
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

  // Load quận huyện khi tỉnh/thành thay đổi
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

  // Cập nhật input files khi imageFiles thay đổi
  useEffect(() => {
    updateInputFiles(imageInputRef, imageFiles);
  }, [imageFiles]);

  // Cập nhật input files khi videoFiles thay đổi
  useEffect(() => {
    updateInputFiles(videoInputRef, videoFiles);
  }, [videoFiles]);

  // Định dạng giá với dấu chấm phân cách nghìn
  const formatPrice = (value) =>
    value.replace(/[^\d]/g, "").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

  const handleTitleChange = (e) => {
    if (e.target.value.length <= TITLE_MAX_LENGTH) setTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    if (e.target.value.length <= DESCRIPTION_MAX_LENGTH) setDescription(e.target.value);
  };

  const handlePriceChange = (e) => {
    setPrice(formatPrice(e.target.value));
  };

  // Xử lý chọn ảnh (tối đa 7)
  const handleImageChange = (e) => {
    const newImages = Array.from(e.target.files);
    const totalImages = [...imageFiles, ...newImages].slice(0, MAX_IMAGES);

    setImageFiles(totalImages);

    const previews = totalImages.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setPreviewImages(previews);
  };

 // Xử lý chọn video (tối đa 1)
const handleVideoChange = (e) => {
  const file = e.target.files[0]; // Chỉ chọn 1 video
  if (!file) return;

  const sizeMB = file.size / 1024 / 1024;
  if (sizeMB > 60) {
    alert(`❌ File quá nặng (${Math.round(sizeMB)}MB)! Vui lòng chọn video dưới 60MB.`);
    return;
  }

  const videoUrl = URL.createObjectURL(file);
  const video = document.createElement("video");

  video.preload = "metadata";
  video.src = videoUrl;

  video.onloadedmetadata = () => {
    if (video.duration > 60) {
      URL.revokeObjectURL(videoUrl); // Chỉ huỷ nếu không dùng
      alert("❌ Video không được dài quá 60 giây!");
      return;
    }

    // Nếu hợp lệ → set
    setVideoFiles([file]);
    setPreviewVideos([{ url: videoUrl, type: file.type }]);
  };
};


  // Xóa ảnh khỏi danh sách - CẢI TIẾN
  const removeImage = (index) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    
    setImageFiles(newImageFiles);
    setPreviewImages(newPreviews);
  };

  // Xóa video khỏi danh sách - CẢI TIẾN
  const removeVideo = (index) => {
  const urlToRevoke = previewVideos[index]?.url;
  if (urlToRevoke) URL.revokeObjectURL(urlToRevoke); // ✅ huỷ blob đúng lúc

  const newVideoFiles = videoFiles.filter((_, i) => i !== index);
  const newPreviews = previewVideos.filter((_, i) => i !== index);

  setVideoFiles(newVideoFiles);
  setPreviewVideos(newPreviews);
};


  // Xử lý xem trước
  const handlePreview = () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }

    if (!title || !description || !price || !contactInfo || !province || !district) {
      alert("Vui lòng điền đầy đủ thông tin trước khi xem trước.");
      return;
    }

    const allMedia = [...previewImages, ...previewVideos];

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
      images: allMedia,
    });

    setShowPreview(true);
  };

  // Gửi form lên backend
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!user || !user.id) {
    alert("Vui lòng đăng nhập!");
    return;
  }

  if (imageFiles.length === 0) {
    alert("Vui lòng chọn ít nhất 1 hình ảnh!");
    return;
  }

  const rawPrice = price.replace(/[^\d]/g, "");

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("price", rawPrice);
  formData.append("contactInfo", contactInfo);
  formData.append("condition", condition);
  formData.append("province", province);
  formData.append("district", district);
  formData.append("userId", user.id);
  formData.append("categoryId", categoryId);
  formData.append("categoryName", categoryName);
  formData.append("canNegotiate", canNegotiate);

  [...imageFiles, ...videoFiles].forEach((file) => formData.append("images", file));

  try {
    await axios.post("http://localhost:5133/api/tindang/add-post", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setStatusMessage("✅ Tin bạn đã được gửi đi, vui lòng đợi duyệt!");
    alert("Tin bạn đã được gửi đi, vui lòng đợi duyệt!");
    setTimeout(() => {
      navigate("/quan-ly-tin");
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
            <textarea value={`Danh mục con đã chọn: ${categoryName}`} readOnly rows="4" cols="50" />
          </div>
        )}

        <div className="post-tindang-group">
          <label>Tiêu đề (tối đa {TITLE_MAX_LENGTH} ký tự)</label>
          <input type="text" value={title} onChange={handleTitleChange} maxLength={TITLE_MAX_LENGTH} required />
          <div className="char-counter">
            {title.length}/{TITLE_MAX_LENGTH}
          </div>
        </div>

        <div className="post-tindang-group">
          <label>Mô tả (tối đa {DESCRIPTION_MAX_LENGTH} ký tự)</label>
          <textarea value={description} onChange={handleDescriptionChange} maxLength={DESCRIPTION_MAX_LENGTH} required />
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
            <input type="checkbox" checked={canNegotiate} onChange={(e) => setCanNegotiate(e.target.checked)} />
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

        {/* Section upload ảnh */}
        <div className="post-tindang-group-image-video">
  <div className="post-tindang-media-box">
    {/* Upload ảnh */}
    <label className="media-upload-box custom-file-upload">
      <div className="media-box-header">
        <i className="info-icon">ℹ️</i>
        <span className="media-title">Hình ảnh hợp lệ</span>
      </div>
      <div className="media-icon-container">
        <div className="media-camera-icon" />
      </div>
      <p className="upload-text">ĐĂNG TỪ 01 ĐẾN 07 HÌNH</p>
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageChange}
        multiple
        accept="image/*"
        disabled={imageFiles.length >= MAX_IMAGES}
      />
    </label>
    {imageFiles.length >= MAX_IMAGES && (
      <p className="error-text">Đã đạt giới hạn tối đa {MAX_IMAGES} ảnh</p>
    )}
    <div className="media-preview-list">
      {previewImages.map((image, idx) => (
        <div key={idx} className="media-preview-item">
          <img src={image.url} alt={`preview ${idx}`} />
          <button type="button" onClick={() => removeImage(idx)}>×</button>
        </div>
      ))}
    </div>

    {/* Upload video */}
    <label className="media-upload-box custom-file-upload">
      <div className="media-box-header">
        <i className="info-icon">ℹ️</i>
        <span className="media-title">Bán nhanh hơn với <span className="highlight">Unimarket Video</span></span>
      </div>
      <div className="media-icon-container">
        <div className="media-video-icon" />
      </div>
      <p className="sub-note">Video sẽ xuất hiện <span className="highlight">MIỄN PHÍ</span> trên Unimarket Video</p>
      <p className="sub-note">Chỉ được đăng <span className="highlight">1 VIDEO DƯỚI 60 GIÂY</span></p>
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoChange}
        accept="video/*"
        disabled={videoFiles.length >= MAX_VIDEOS}
      />
    </label>
    {videoFiles.length >= MAX_VIDEOS && (
      <p className="error-text">Chỉ cho phép 1 video</p>
    )}
    <div className="media-preview-list">
      {previewVideos.map((video, idx) => (
        <div key={idx} className="media-preview-item">
          <video src={video.url} controls />
          <button type="button" onClick={() => removeVideo(idx)}>×</button>
        </div>
      ))}
    </div>
  </div>
</div>

        <div className="post-tindang-button-group">
          <button
            type="button"
            onClick={handlePreview}
            className={`preview-btn ${showPreview ? "active" : ""}`}
          >
            {showPreview ? "Đóng Xem trước" : "Xem Trước"}
          </button>
          <button type="submit">Đăng Tin</button>
        </div>

        {showPreview && previewData && (
          <div className="post-tindang-preview" style={{ textAlign: "left" }}>
            <h3>Xem Trước Bài Đăng</h3>
            <table className="post-tindang-preview-table">
              <tbody>
                <tr>
                  <td>Tiêu đề</td>
                  <td>{previewData.title}</td>
                </tr>
                <tr>
                  <td>Mô tả</td>
                  <td>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: previewData.description.replace(/\n/g, "<br>"),
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Giá</td>
                  <td>{previewData.price}</td>
                </tr>
                <tr>
                  <td>Liên hệ</td>
                  <td>{previewData.contactInfo}</td>
                </tr>
                <tr>
                  <td>Tình trạng</td>
                  <td>{previewData.condition}</td>
                </tr>
                <tr>
                  <td>Tỉnh/Thành</td>
                  <td>{previewData.province}</td>
                </tr>
                <tr>
                  <td>Quận/Huyện</td>
                  <td>{previewData.district}</td>
                </tr>
                <tr>
                  <td>Danh mục</td>
                  <td>{previewData.categoryName}</td>
                </tr>
                <tr>
                  <td>Thương lượng</td>
                  <td>{previewData.canNegotiate ? "Có" : "Không"}</td>
                </tr>
                <tr>
                  <td>Media</td>
                  <td>
                    {previewData.images && previewData.images.length > 0 ? (
                      previewData.images.map((media, idx) =>
                        media.type.startsWith("video") ? (
                          <video
                            key={idx}
                            src={media.url}
                            controls
                            style={{ maxWidth: "120px", maxHeight: "120px", marginRight: 8 }}
                          />
                        ) : (
                          <img
                            key={idx}
                            src={media.url}
                            alt={`Preview ${idx + 1}`}
                            style={{ maxWidth: "120px", maxHeight: "120px", marginRight: 8 }}
                          />
                        )
                      )
                    ) : (
                      <span>Không có media</span>
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