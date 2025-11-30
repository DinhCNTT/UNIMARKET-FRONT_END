import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext"; // Lưu ý đường dẫn import
import TopNavbar from "../../components/TopNavbar"; // Lưu ý đường dẫn import
import styles from "./CapNhatTin.module.css";

// Import components con
import MediaManager from "./MediaManager";
import CategorySpecRenderer from "./CategorySpecs/CategorySpecRenderer";

const CapNhatTin = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  // State thông tin cơ bản
  const [categoryId, setCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [displayPrice, setDisplayPrice] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [condition, setCondition] = useState("Moi");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [tinhThanhList, setTinhThanhList] = useState([]);
  const [quanHuyenList, setQuanHuyenList] = useState([]);

  // State Media
  const [imagePreviewList, setImagePreviewList] = useState([]);
  const [videoPreviewList, setVideoPreviewList] = useState([]);
  const [oldImagesToDelete, setOldImagesToDelete] = useState([]);
  const [oldVideosToDelete, setOldVideosToDelete] = useState([]);

  // State Dynamic
  const [dynamicData, setDynamicData] = useState({});

  // --- Handlers ---
  const handleDynamicChange = (key, value) => {
    setDynamicData(prev => ({ ...prev, [key]: value }));
  };

  const formatPrice = (value) => {
    if (!value) return "";
    const numericValue = value.toString().replace(/[^\d]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    setPrice(rawValue);
    setDisplayPrice(formatPrice(rawValue));
  };

  // --- Fetch Data ---
  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:5133/api/TinDang/get-post/${id}`)
        .then((response) => {
          const tinDang = response.data;
          setTitle(tinDang.tieuDe);
          setDescription(tinDang.moTa);
          setPrice(tinDang.gia);
          setDisplayPrice(formatPrice(tinDang.gia));
          setContactInfo(tinDang.diaChi);
          setCondition(tinDang.tinhTrang);
          setProvince(tinDang.maTinhThanh);
          setDistrict(tinDang.maQuanHuyen);
          setCategoryId(tinDang.maDanhMuc);
          setCategoryName(tinDang.danhMuc?.tenDanhMuc);

          if (tinDang.thongTinChiTiet) {
            try {
              const parsed = typeof tinDang.thongTinChiTiet === 'string' 
                ? JSON.parse(tinDang.thongTinChiTiet) 
                : tinDang.thongTinChiTiet;
              setDynamicData(parsed || {});
            } catch (e) {
              console.error("Lỗi parse thông tin chi tiết:", e);
            }
          }

          if (tinDang.anhTinDangs && tinDang.anhTinDangs.length > 0) {
            const images = [];
            const videos = [];
            const sortedMedia = tinDang.anhTinDangs.sort((a, b) => (a.order || 0) - (b.order || 0));
            
            sortedMedia.forEach(media => {
              const url = media.duongDan.startsWith('http') ? media.duongDan : `http://localhost:5133${media.duongDan}`;
              const mediaItem = {
                type: 'old',
                url: url,
                id: media.maAnh,
                originalOrder: media.order || 0,
                fileName: media.duongDan.split('/').pop()
              };
              
              const isVideo = media.loaiMedia === 1 || /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(media.duongDan);
              if (isVideo) videos.push(mediaItem);
              else images.push(mediaItem);
            });
            setImagePreviewList(images);
            setVideoPreviewList(videos);
          }
        })
        .catch((error) => {
          console.error("Lỗi lấy tin:", error);
          alert("Không thể lấy thông tin tin đăng.");
        });
    }
  }, [id]);

  useEffect(() => {
    fetch("http://localhost:5133/api/tindang/tinhthanh").then(res => res.json()).then(setTinhThanhList);
  }, []);

  useEffect(() => {
    if (province) {
      fetch(`http://localhost:5133/api/tindang/tinhthanh/${province}/quanhuynh`).then(res => res.json()).then(setQuanHuyenList);
    }
  }, [province]);

  // --- Media Handlers ---
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 7 - imagePreviewList.length);
    const newItems = files.map(file => ({
      type: 'new',
      file,
      url: URL.createObjectURL(file),
      fileName: file.name
    }));
    setImagePreviewList(prev => [...prev, ...newItems]);
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 1 - videoPreviewList.length);
    const newItems = files.map(file => ({
      type: 'new',
      file,
      url: URL.createObjectURL(file),
      fileName: file.name
    }));
    setVideoPreviewList(prev => [...prev, ...newItems]);
  };

  const handleRemoveImage = (idx) => {
    setImagePreviewList(prev => {
      const removed = prev[idx];
      if (removed.type === 'old') {
        setOldImagesToDelete(ids => [...ids, removed.id]);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleRemoveVideo = (idx) => {
    setVideoPreviewList(prev => {
      const removed = prev[idx];
      if (removed.type === 'old') {
        setOldVideosToDelete(ids => [...ids, removed.id]);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const moveImage = (fromIdx, toIdx) => {
    setImagePreviewList(prev => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return alert("Vui lòng đăng nhập!");

    // Validate Mobile đơn giản (có thể chuyển vào renderer nếu muốn)
    if (categoryName?.toLowerCase().includes("điện thoại")) {
        if (!dynamicData.Hang || !dynamicData.MauSac || !dynamicData.DungLuong) {
            alert("Vui lòng điền đầy đủ Hãng, Màu sắc và Dung lượng!");
            return;
        }
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

    // Gửi JSON thông tin chi tiết
    if (Object.keys(dynamicData).length > 0) {
        formData.append("thongTinChiTiet", JSON.stringify(dynamicData));
    }

    // Logic Order Map
    const imageOrderMap = [];
    const videoOrderMap = [];

    imagePreviewList.forEach((img, index) => {
      if (img.type === 'old') {
        imageOrderMap.push({ type: 'old', id: img.id, position: index });
      } else {
        const newFileIndex = imagePreviewList.filter((item, idx) => item.type === 'new' && idx <= index).length - 1;
        imageOrderMap.push({ type: 'new', id: -1, fileIndex: newFileIndex, position: index });
      }
    });

    videoPreviewList.forEach((vid, index) => {
      if (vid.type === 'old') {
        videoOrderMap.push({ type: 'old', id: vid.id, position: index });
      } else {
        const newFileIndex = videoPreviewList.filter((item, idx) => item.type === 'new' && idx <= index).length - 1;
        videoOrderMap.push({ type: 'new', id: -1, fileIndex: newFileIndex, position: index });
      }
    });

    formData.append('imageOrderMap', JSON.stringify(imageOrderMap));
    formData.append('videoOrderMap', JSON.stringify(videoOrderMap));

    // Append files
    const newImageFiles = imagePreviewList.filter(i => i.type === 'new');
    newImageFiles.forEach((img) => formData.append('newImages', img.file));
    const newVideoFiles = videoPreviewList.filter(i => i.type === 'new');
    newVideoFiles.forEach((vid) => formData.append('newVideos', vid.file));

    // Delete lists
    if (oldImagesToDelete.length > 0) formData.append('oldImagesToDelete', JSON.stringify(oldImagesToDelete));
    if (oldVideosToDelete.length > 0) formData.append('oldVideosToDelete', JSON.stringify(oldVideosToDelete));

    try {
      await axios.put(`http://localhost:5133/api/TinDang/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setStatusMessage("✅ Tin bạn đã được cập nhật!");
      alert("Tin bạn đã được cập nhật!");
      navigate("/quan-ly-tin");
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      setStatusMessage("❌ Cập nhật thất bại!");
      alert(`Lỗi: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <TopNavbar />
      {statusMessage && <p className={`${styles.statusMessage} ${statusMessage.includes("thất bại") ? styles.error : ""}`}>{statusMessage}</p>}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.layoutWrapper}>

          {/* === CỘT TRÁI: QUẢN LÝ MEDIA === */}
          <MediaManager 
            imagePreviewList={imagePreviewList}
            videoPreviewList={videoPreviewList}
            handleImageChange={handleImageChange}
            handleVideoChange={handleVideoChange}
            handleRemoveImage={handleRemoveImage}
            handleRemoveVideo={handleRemoveVideo}
            moveImage={moveImage}
          />

          {/* === CỘT PHẢI: INPUTS === */}
          <div className={styles.rightColumn}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tiêu đề</label>
              <input type="text" className={styles.input} value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            {/* 🔥 RENDER FORM CHI TIẾT DỰA VÀO DANH MỤC 🔥 */}
            <CategorySpecRenderer 
              categoryName={categoryName}
              dynamicData={dynamicData}
              onDynamicChange={handleDynamicChange}
            />

            <div className={styles.formGroup}>
              <label className={styles.label}>Mô tả</label>
              <textarea className={styles.textarea} value={description} onChange={e => setDescription(e.target.value)} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Giá (VNĐ)</label>
              <input type="text" className={styles.input} value={displayPrice} onChange={handlePriceChange} placeholder="Ví dụ: 200.000" required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Địa chỉ cụ thể</label>
              <input type="text" className={styles.input} value={contactInfo} onChange={e => setContactInfo(e.target.value)} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tình trạng sản phẩm</label>
              <select className={styles.select} value={condition} onChange={e => setCondition(e.target.value)} required>
                <option value="Moi">Mới</option>
                <option value="DaSuDung">Đã Sử Dụng</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tỉnh/Thành phố</label>
              <select className={styles.select} value={province} onChange={e => setProvince(e.target.value)} required>
                <option value="">Chọn tỉnh/thành phố</option>
                {tinhThanhList.map(tinh => <option key={tinh.maTinhThanh} value={tinh.maTinhThanh}>{tinh.tenTinhThanh}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Quận/Huyện</label>
              <select className={styles.select} value={district} onChange={e => setDistrict(e.target.value)} required>
                <option value="">Chọn quận/huyện</option>
                {quanHuyenList.map(quan => <option key={quan.maQuanHuyen} value={quan.maQuanHuyen}>{quan.tenQuanHuyen}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitBtn}>Cập nhật Tin</button>
        </div>
      </form>
    </div>
  );
};

export default CapNhatTin;