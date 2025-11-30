import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "./TopNavbar";
import "./CapNhatTin_old.css";

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

  // State Media (Ảnh/Video)
  const [imagePreviewList, setImagePreviewList] = useState([]);
  const [videoPreviewList, setVideoPreviewList] = useState([]);
  const [oldImagesToDelete, setOldImagesToDelete] = useState([]);
  const [oldVideosToDelete, setOldVideosToDelete] = useState([]);

  // State Thông tin chi tiết (Dynamic)
  const [dynamicData, setDynamicData] = useState({});
  // Logic kiểm tra danh mục (Điện thoại)
  const isMobileCategory = categoryName?.toLowerCase().includes("điện thoại");

  // Data mẫu dropdown
  const brands = ["Apple", "Samsung", "Xiaomi", "Oppo", "Vivo", "Huawei", "Nokia", "Sony", "Khác"];
  const colors = ["Đen", "Trắng", "Đỏ", "Xanh dương", "Xanh lá", "Vàng", "Bạc", "Xám", "Hồng", "Tím"];
  const storages = ["< 16GB", "16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "> 1TB"];
  const warranties = ["Hết bảo hành", "Còn bảo hành", "Bảo hành chính hãng", "Bảo hành cửa hàng"];

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

  // Lấy thông tin tin đăng
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

          // Parse JSON Chi tiết
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

          // Xử lý Media cũ (QUAN TRỌNG: Giữ logic 'old' để không bị xóa nhầm)
          if (tinDang.anhTinDangs && tinDang.anhTinDangs.length > 0) {
            const images = [];
            const videos = [];
            // Sắp xếp theo Order
            const sortedMedia = tinDang.anhTinDangs.sort((a, b) => (a.order || 0) - (b.order || 0));
            
            sortedMedia.forEach(media => {
              const url = media.duongDan.startsWith('http') ? media.duongDan : `http://localhost:5133${media.duongDan}`;
              const mediaItem = {
                type: 'old', // Đánh dấu là ảnh cũ
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
          } else {
            setImagePreviewList([]);
            setVideoPreviewList([]);
          }
        })
        .catch((error) => {
          console.error("Lỗi lấy tin:", error);
          alert("Không thể lấy thông tin tin đăng.");
        });
    }
  }, [id]);

  // Lấy tỉnh thành
  useEffect(() => {
    fetch("http://localhost:5133/api/tindang/tinhthanh").then(res => res.json()).then(setTinhThanhList);
  }, []);

  // Lấy quận huyện khi tỉnh thay đổi
  useEffect(() => {
    if (province) {
      fetch(`http://localhost:5133/api/tindang/tinhthanh/${province}/quanhuynh`).then(res => res.json()).then(setQuanHuyenList);
    }
  }, [province]);

  // --- Media Actions ---

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 7 - imagePreviewList.length);
    const newItems = files.map(file => ({
      type: 'new', // Đánh dấu là ảnh mới
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
      // Nếu xóa ảnh cũ -> Thêm ID vào danh sách cần xóa
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

    // Validate Mobile
    if (isMobileCategory) {
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
    if (isMobileCategory && Object.keys(dynamicData).length > 0) {
        formData.append("thongTinChiTiet", JSON.stringify(dynamicData));
    }

    // Xử lý Order Map (Quan trọng để Backend biết thứ tự ảnh)
    const imageOrderMap = [];
    const videoOrderMap = [];

    imagePreviewList.forEach((img, index) => {
      if (img.type === 'old') {
        imageOrderMap.push({ type: 'old', id: img.id, position: index });
      } else {
        // Tính toán index của file mới trong mảng newImageFiles
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

    // Append file thực tế
    const newImageFiles = imagePreviewList.filter(i => i.type === 'new');
    newImageFiles.forEach((img) => formData.append('newImages', img.file));

    const newVideoFiles = videoPreviewList.filter(i => i.type === 'new');
    newVideoFiles.forEach((vid) => formData.append('newVideos', vid.file));

    // Danh sách xóa
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
    <div className="capnhat-container">
      <TopNavbar />
      {statusMessage && <p className={`capnhat-status ${statusMessage.includes("thất bại") ? "error" : ""}`}>{statusMessage}</p>}
      
      <form className="capnhat-form" onSubmit={handleSubmit}>
        {/* --- LAYOUT 2 CỘT --- */}
        <div className="capnhat-layout-wrapper">

          {/* === CỘT TRÁI: MEDIA === */}
          <div className="capnhat-left-column">
            {/* Box Ảnh */}
            <div className="capnhat-media-box">
              <div className="capnhat-media-header">
                <div className="capnhat-camera-icon"></div>
                <span className="capnhat-media-title">Hình ảnh sản phẩm <span className="capnhat-note">(tối đa 7 ảnh)</span></span>
              </div>
              <div className="capnhat-upload-area">
                <input type="file" className="capnhat-file-input" onChange={handleImageChange} multiple accept="image/*" disabled={imagePreviewList.length >= 7} />
                <div className="capnhat-upload-text"><span className="capnhat-highlight">Chọn ảnh</span> để tải lên</div>
                <div className="capnhat-sub-note">Ảnh đầu tiên sẽ là <span className="capnhat-highlight">ảnh bìa</span></div>
              </div>
              
              {/* List Ảnh Preview */}
              {imagePreviewList.length > 0 && (
                <div className="capnhat-preview-list">
                  {imagePreviewList.map((img, idx) => (
                    <div key={`${img.type}-${img.id || img.fileName || idx}`} className="capnhat-preview-item">
                      <img src={img.url} alt={`Ảnh ${idx + 1}`} />
                      {/* Badges */}
                      {idx === 0 && <div className="capnhat-cover-badge">Ảnh bìa</div>}
                      {img.type === 'old' && <div className="capnhat-cover-badge" style={{top: '25px', backgroundColor: '#28a745'}}>CŨ</div>}
                      {img.type === 'new' && <div className="capnhat-cover-badge" style={{top: '25px', backgroundColor: '#007bff'}}>MỚI</div>}
                      
                      <button type="button" className="capnhat-remove-btn" onClick={() => handleRemoveImage(idx)}>×</button>
                      <div className="capnhat-move-controls">
                        <button type="button" className="capnhat-move-btn capnhat-move-left" onClick={() => moveImage(idx, idx - 1)} disabled={idx === 0}>‹</button>
                        <button type="button" className="capnhat-move-btn capnhat-move-right" onClick={() => moveImage(idx, idx + 1)} disabled={idx === imagePreviewList.length - 1}>›</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="capnhat-counter">Đã chọn {imagePreviewList.length}/7 ảnh</div>
            </div>

            {/* Box Video */}
            <div className="capnhat-media-box">
              <div className="capnhat-media-header">
                <div className="capnhat-video-icon"></div>
                <span className="capnhat-media-title">Video sản phẩm <span className="capnhat-note">(tối đa 1 video)</span></span>
              </div>
              <div className="capnhat-upload-area">
                <input type="file" className="capnhat-file-input" onChange={handleVideoChange} accept="video/*" disabled={videoPreviewList.length >= 1} />
                <div className="capnhat-upload-text"><span className="capnhat-highlight">Chọn video</span> để tải lên</div>
              </div>
              {videoPreviewList.length > 0 && (
                <div className="capnhat-preview-list">
                  {videoPreviewList.map((video, idx) => (
                    <div key={`${video.type}-${video.id || video.fileName || idx}`} className="capnhat-preview-item">
                      <video src={video.url} controls muted />
                      {video.type === 'old' && <div className="capnhat-cover-badge" style={{backgroundColor: '#28a745'}}>CŨ</div>}
                      {video.type === 'new' && <div className="capnhat-cover-badge" style={{backgroundColor: '#007bff'}}>MỚI</div>}
                      <button type="button" className="capnhat-remove-btn" onClick={() => handleRemoveVideo(idx)}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="capnhat-counter">Đã chọn {videoPreviewList.length}/1 video</div>
            </div>
          </div>

          {/* === CỘT PHẢI: INPUTS === */}
          <div className="capnhat-right-column">
            <div className="capnhat-group">
              <label className="capnhat-label">Tiêu đề</label>
              <input type="text" className="capnhat-input" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            {/* --- GIAO DIỆN NHẬP CHI TIẾT (ĐIỆN THOẠI) --- */}
            {isMobileCategory && (
              <div className="capnhat-dynamic-box">
                <label className="capnhat-dynamic-title">Thông tin chi tiết (Điện thoại)</label>
                <div className="capnhat-dynamic-grid">
                  <div>
                    <label className="capnhat-label">Hãng sản xuất</label>
                    <select className="capnhat-select" value={dynamicData.Hang || ""} onChange={(e) => handleDynamicChange("Hang", e.target.value)}>
                      <option value="">Chọn hãng</option>
                      {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="capnhat-label">Màu sắc</label>
                    <select className="capnhat-select" value={dynamicData.MauSac || ""} onChange={(e) => handleDynamicChange("MauSac", e.target.value)}>
                      <option value="">Chọn màu</option>
                      {colors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="capnhat-label">Dung lượng</label>
                    <select className="capnhat-select" value={dynamicData.DungLuong || ""} onChange={(e) => handleDynamicChange("DungLuong", e.target.value)}>
                      <option value="">Chọn dung lượng</option>
                      {storages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="capnhat-label">Bảo hành</label>
                    <select className="capnhat-select" value={dynamicData.BaoHanh || ""} onChange={(e) => handleDynamicChange("BaoHanh", e.target.value)}>
                      <option value="">Chọn bảo hành</option>
                      {warranties.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: "15px" }}>
                  <label className="capnhat-label">Xuất xứ</label>
                  <input type="text" className="capnhat-input" placeholder="VD: Việt Nam, Hàn Quốc..." value={dynamicData.XuatXu || ""} onChange={(e) => handleDynamicChange("XuatXu", e.target.value)} />
                </div>
              </div>
            )}
            {/* --- HẾT PHẦN CHI TIẾT --- */}

            <div className="capnhat-group">
              <label className="capnhat-label">Mô tả</label>
              <textarea className="capnhat-textarea" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>

            <div className="capnhat-group">
              <label className="capnhat-label">Giá (VNĐ)</label>
              <input type="text" className="capnhat-input" value={displayPrice} onChange={handlePriceChange} placeholder="Ví dụ: 200.000" required />
            </div>

            <div className="capnhat-group">
              <label className="capnhat-label">Địa chỉ cụ thể</label>
              <input type="text" className="capnhat-input" value={contactInfo} onChange={e => setContactInfo(e.target.value)} required />
            </div>

            <div className="capnhat-group">
              <label className="capnhat-label">Tình trạng sản phẩm</label>
              <select className="capnhat-select" value={condition} onChange={e => setCondition(e.target.value)} required>
                <option value="Moi">Mới</option>
                <option value="DaSuDung">Đã Sử Dụng</option>
              </select>
            </div>

            <div className="capnhat-group">
              <label className="capnhat-label">Tỉnh/Thành phố</label>
              <select className="capnhat-select" value={province} onChange={e => setProvince(e.target.value)} required>
                <option value="">Chọn tỉnh/thành phố</option>
                {tinhThanhList.map(tinh => <option key={tinh.maTinhThanh} value={tinh.maTinhThanh}>{tinh.tenTinhThanh}</option>)}
              </select>
            </div>

            <div className="capnhat-group">
              <label className="capnhat-label">Quận/Huyện</label>
              <select className="capnhat-select" value={district} onChange={e => setDistrict(e.target.value)} required>
                <option value="">Chọn quận/huyện</option>
                {quanHuyenList.map(quan => <option key={quan.maQuanHuyen} value={quan.maQuanHuyen}>{quan.tenQuanHuyen}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="capnhat-button-group">
          <button type="submit" className="capnhat-submit-btn">Cập nhật Tin</button>
        </div>
      </form>
    </div>
  );
};

export default CapNhatTin;