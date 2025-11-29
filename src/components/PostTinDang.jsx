import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import styles from "./PostTinDang.module.css";
import PreviewModal from "./PreviewModal";
import MobileForm from "./CategoryForms/MobileForm";
const PostTinDang = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const location = useLocation();

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
  const [activePreviewMedia, setActivePreviewMedia] = useState(0);
  const [dynamicData, setDynamicData] = useState({});

  // Kiểm tra xem có phải danh mục điện thoại không
  const isMobileCategory = categoryName?.toLowerCase().includes("điện thoại");

  // Hàm nhận dữ liệu từ MobileForm
  const handleDynamicDataChange = (key, value) => {
    setDynamicData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const TITLE_MAX_LENGTH = 80;
  const DESCRIPTION_MAX_LENGTH = 900;
  const MAX_IMAGES = 7;
  const MAX_VIDEOS = 1;

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

  const updateInputFiles = (inputRef, files) => {
    if (inputRef.current) {
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      inputRef.current.files = dt.files;
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setCategoryId(queryParams.get("categoryId"));
    setCategoryName(queryParams.get("categoryName"));
  }, [location]);

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

  useEffect(() => {
    updateInputFiles(imageInputRef, imageFiles);
  }, [imageFiles]);

  useEffect(() => {
    updateInputFiles(videoInputRef, videoFiles);
  }, [videoFiles]);

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

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
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
        URL.revokeObjectURL(videoUrl);
        alert("❌ Video không được dài quá 60 giây!");
        return;
      }

      setVideoFiles([file]);
      setPreviewVideos([{ url: videoUrl, type: file.type }]);
    };
  };

  const removeImage = (index) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    
    setImageFiles(newImageFiles);
    setPreviewImages(newPreviews);
  };

  const removeVideo = (index) => {
    const urlToRevoke = previewVideos[index]?.url;
    if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);

    const newVideoFiles = videoFiles.filter((_, i) => i !== index);
    const newPreviews = previewVideos.filter((_, i) => i !== index);

    setVideoFiles(newVideoFiles);
    setPreviewVideos(newPreviews);
  };

  const handlePreview = () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }

    if (!title || !description || !price || !contactInfo || !province || !district) {
      alert("Vui lòng điền đầy đủ thông tin trước khi xem trước.");
      return;
    }

    let detailsDisplay = null;
    if (isMobileCategory) {
        detailsDisplay = {
            "Hãng": dynamicData.Hang,
            "Màu sắc": dynamicData.MauSac,
            "Dung lượng": dynamicData.DungLuong,
            "Xuất xứ": dynamicData.XuatXu,
            "Bảo hành": dynamicData.BaoHanh
        };
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
      details: detailsDisplay,
      images: allMedia, // 'images' bây giờ chứa cả ảnh và video
    });

    setActivePreviewMedia(0); // <-- THÊM DÒNG NÀY
    setShowPreview(true);
  };

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

    if (isMobileCategory) {
        if (!dynamicData.Hang || !dynamicData.MauSac || !dynamicData.DungLuong) {
            alert("Vui lòng điền đầy đủ Hãng, Màu sắc và Dung lượng!");
            return;
        }
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

    if (isMobileCategory && Object.keys(dynamicData).length > 0) {
        formData.append("thongTinChiTiet", JSON.stringify(dynamicData));
    }

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
    <div className={styles.container}>
      <TopNavbar />
      {statusMessage && (
        <p className={`${styles.status} ${statusMessage.includes("thất bại") ? styles.error : ""}`}>
          {statusMessage}
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        {categoryName && (
          <div className={styles.formGroup}>
            <label>Danh mục con đã chọn</label>
            <textarea value={`Danh mục con đã chọn: ${categoryName}`} readOnly rows="4" cols="50" />
          </div>
        )}

        {isMobileCategory && (
            <MobileForm 
                data={dynamicData} 
                onChange={handleDynamicDataChange} 
            />
        )}

        <div className={styles.formGroup}>
          <label>Tiêu đề (tối đa {TITLE_MAX_LENGTH} ký tự)</label>
          <input type="text" value={title} onChange={handleTitleChange} maxLength={TITLE_MAX_LENGTH} required />
          <div className={styles.charCounter}>
            {title.length}/{TITLE_MAX_LENGTH}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Mô tả (tối đa {DESCRIPTION_MAX_LENGTH} ký tự)</label>
          <textarea value={description} onChange={handleDescriptionChange} maxLength={DESCRIPTION_MAX_LENGTH} required />
          <div className={styles.charCounter}>
            {description.length}/{DESCRIPTION_MAX_LENGTH}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Giá</label>
          <input type="text" value={price} onChange={handlePriceChange} required />
        </div>

        <div className={styles.formGroup}>
          <label>Địa chỉ cụ thể</label>
          <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required />
        </div>

        <div className={styles.formGroup}>
          <label>Tình trạng sản phẩm</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} required>
            <option value="Moi">{conditionMap.Moi}</option>
            <option value="DaSuDung">{conditionMap.DaSuDung}</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>
            <input type="checkbox" checked={canNegotiate} onChange={(e) => setCanNegotiate(e.target.checked)} />
            Có thể thương lượng
          </label>
        </div>

        <div className={styles.formGroup}>
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

        <div className={styles.formGroup}>
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

        <div className={styles.mediaSection}>
          <div className={styles.mediaBox}>
            <label className={styles.uploadBox}>
              <div className={styles.boxHeader}>
                <i className={styles.infoIcon}>ℹ️</i>
                <span className={styles.mediaTitle}>Hình ảnh hợp lệ</span>
              </div>
              <div className={styles.iconContainer}>
                <div className={styles.cameraIcon} />
              </div>
              <p className={styles.uploadText}>ĐĂNG TỪ 01 ĐẾN 07 HÌNH</p>
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
              <p className={styles.errorText}>Đã đạt giới hạn tối đa {MAX_IMAGES} ảnh</p>
            )}
            <div className={styles.previewList}>
              {previewImages.map((image, idx) => (
                <div key={idx} className={styles.previewItem}>
                  <img src={image.url} alt={`preview ${idx}`} />
                  <button type="button" onClick={() => removeImage(idx)}>×</button>
                </div>
              ))}
            </div>

            <label className={styles.uploadBox}>
              <div className={styles.boxHeader}>
                <i className={styles.infoIcon}>ℹ️</i>
                <span className={styles.mediaTitle}>Bán nhanh hơn với <span className={styles.highlight}>Unimarket Video</span></span>
              </div>
              <div className={styles.iconContainer}>
                <div className={styles.videoIcon} />
              </div>
              <p className={styles.subNote}>Video sẽ xuất hiện <span className={styles.highlight}>MIỄN PHÍ</span> trên Unimarket Video</p>
              <p className={styles.subNote}>Chỉ được đăng <span className={styles.highlight}>1 VIDEO DƯỚI 60 GIÂY</span></p>
              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoChange}
                accept="video/*"
                disabled={videoFiles.length >= MAX_VIDEOS}
              />
            </label>
            {videoFiles.length >= MAX_VIDEOS && (
              <p className={styles.errorText}>Chỉ cho phép 1 video</p>
            )}
            <div className={styles.previewList}>
              {previewVideos.map((video, idx) => (
                <div key={idx} className={styles.previewItem}>
                  <video src={video.url} controls />
                  <button type="button" onClick={() => removeVideo(idx)}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.btnGroup}>
          <button
            type="button"
            onClick={handlePreview}
            className={showPreview ? styles.active : ""}
          >
            {showPreview ? "Đóng Xem trước" : "Xem Trước"}
          </button>
          <button type="submit">Đăng Tin</button>
        </div>

        <PreviewModal 
  showPreview={showPreview}
  previewData={previewData}
  activePreviewMedia={activePreviewMedia}
  setActivePreviewMedia={setActivePreviewMedia}
  onClose={handlePreview}
/>
      </form>
    </div>
  );
};

export default PostTinDang;