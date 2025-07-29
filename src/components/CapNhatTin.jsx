import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import "./CapNhatTin.css";

const CapNhatTin = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

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

  // State cho preview ảnh và video
  const [imagePreviewList, setImagePreviewList] = useState([]);
  const [videoPreviewList, setVideoPreviewList] = useState([]);
  const [oldImagesToDelete, setOldImagesToDelete] = useState([]);
  const [oldVideosToDelete, setOldVideosToDelete] = useState([]);

  // Hàm format số tiền
  const formatPrice = (value) => {
    if (!value) return "";
    const numericValue = value.toString().replace(/[^\d]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Hàm xử lý thay đổi giá
  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    setPrice(rawValue);
    setDisplayPrice(formatPrice(rawValue));
  };

  // Lấy thông tin tin đăng từ API
  // Thay thế useEffect trong frontend (dòng 45-91)
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
        
        // Tách ảnh và video với thông tin đầy đủ
        if (tinDang.anhTinDangs && tinDang.anhTinDangs.length > 0) {
          const images = [];
          const videos = [];
          
          // Sắp xếp theo thứ tự Order (không phải thuTu)
          const sortedMedia = tinDang.anhTinDangs.sort((a, b) => (a.order || 0) - (b.order || 0));
          
          sortedMedia.forEach(media => {
            const url = media.duongDan.startsWith('http') ? media.duongDan : `http://localhost:5133${media.duongDan}`;
            const mediaItem = {
              type: 'old',
              url: url,
              id: media.maAnh,
              originalOrder: media.order || 0, // Sử dụng Order thay vì thuTu
              fileName: media.duongDan.split('/').pop()
            };
            
            // Kiểm tra loại media dựa trên LoaiMedia hoặc đuôi file
            const isVideo = media.loaiMedia === 1 || /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(media.duongDan);
            if (isVideo) {
              videos.push(mediaItem);
            } else {
              images.push(mediaItem);
            }
          });
          
          setImagePreviewList(images);
          setVideoPreviewList(videos);
          
          console.log('📸 Loaded images:', images.length);
          console.log('🎥 Loaded videos:', videos.length);
        } else {
          setImagePreviewList([]);
          setVideoPreviewList([]);
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

  // Xử lý khi chọn ảnh mới
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

  // Xử lý khi chọn video mới
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

  // Xóa ảnh khỏi imagePreviewList
  const handleRemoveImage = (idx) => {
    setImagePreviewList(prev => {
      const removed = prev[idx];
      if (removed.type === 'old') {
        setOldImagesToDelete(ids => [...ids, removed.id]);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Xóa video khỏi videoPreviewList
  const handleRemoveVideo = (idx) => {
    setVideoPreviewList(prev => {
      const removed = prev[idx];
      if (removed.type === 'old') {
        setOldVideosToDelete(ids => [...ids, removed.id]);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Đổi vị trí ảnh trong imagePreviewList
  const moveImage = (fromIdx, toIdx) => {
    setImagePreviewList(prev => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
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

  // **QUAN TRỌNG: Tạo danh sách thứ tự tổng thể cho tất cả media**
  const imageOrderMap = []; // [{type: 'old'|'new', id: number, fileIndex?: number}]
  const videoOrderMap = [];

  // Xử lý images - lưu thứ tự tổng thể
  imagePreviewList.forEach((img, index) => {
    if (img.type === 'old') {
      imageOrderMap.push({
        type: 'old',
        id: img.id,
        position: index
      });
    } else {
      imageOrderMap.push({
        type: 'new',
        id: -1, // Tạm thời -1, sẽ dùng fileIndex
        fileIndex: imagePreviewList.filter((i, idx) => i.type === 'new' && idx <= index).length - 1,
        position: index
      });
    }
  });

  // Xử lý videos - lưu thứ tự tổng thể  
  videoPreviewList.forEach((vid, index) => {
    if (vid.type === 'old') {
      videoOrderMap.push({
        type: 'old',
        id: vid.id,
        position: index
      });
    } else {
      videoOrderMap.push({
        type: 'new',
        id: -1,
        fileIndex: videoPreviewList.filter((v, idx) => v.type === 'new' && idx <= index).length - 1,
        position: index
      });
    }
  });

  console.log("📋 Image Order Map:", imageOrderMap);
  console.log("🎥 Video Order Map:", videoOrderMap);
  
  // Gửi thông tin thứ tự tổng thể
  formData.append('imageOrderMap', JSON.stringify(imageOrderMap));
  formData.append('videoOrderMap', JSON.stringify(videoOrderMap));

  // **Gửi file ảnh mới theo đúng thứ tự trong imagePreviewList**
  const newImageFiles = imagePreviewList.filter(i => i.type === 'new');
  console.log("📸 Gửi ảnh mới theo thứ tự:", newImageFiles.map((img, idx) => `${idx}: ${img.fileName}`));
  
  newImageFiles.forEach((img, index) => {
    formData.append('newImages', img.file);
  });

  // **Gửi file video mới theo đúng thứ tự trong videoPreviewList**
  const newVideoFiles = videoPreviewList.filter(i => i.type === 'new');
  console.log("🎥 Gửi video mới theo thứ tự:", newVideoFiles.map((vid, idx) => `${idx}: ${vid.fileName}`));
  
  newVideoFiles.forEach((vid, index) => {
    formData.append('newVideos', vid.file);
  });

  // Danh sách ID cần xóa
  if (oldImagesToDelete.length > 0) {
    console.log("🗑️ Ảnh cần xóa:", oldImagesToDelete);
    formData.append('oldImagesToDelete', JSON.stringify(oldImagesToDelete));
  }
  if (oldVideosToDelete.length > 0) {
    console.log("🗑️ Video cần xóa:", oldVideosToDelete);
    formData.append('oldVideosToDelete', JSON.stringify(oldVideosToDelete));
  }

  try {
    const response = await axios.put(
      `http://localhost:5133/api/TinDang/${id}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    console.log("Response:", response.data);
    setStatusMessage("✅ Tin bạn đã được cập nhật!");
    alert("Tin bạn đã được cập nhật!");
    navigate("/quan-ly-tin");
  } catch (error) {
    console.error("Lỗi khi cập nhật tin:", error);
    setStatusMessage("❌ Cập nhật tin thất bại!");
    alert(`Lỗi: ${error.response?.data?.message || error.message}`);
  }
};
  return (
    <div className="capnhat-container">
      <TopNavbar />
      {statusMessage && (
        <p className={`capnhat-status ${statusMessage.includes("thất bại") ? "error" : ""}`}>
          {statusMessage}
        </p>
      )}
      <form className="capnhat-form" onSubmit={handleSubmit}>
        <div className="capnhat-group">
          <label className="capnhat-label">Tiêu đề</label>
          <input 
            type="text" 
            className="capnhat-input"
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
        </div>
        
        <div className="capnhat-group">
          <label className="capnhat-label">Mô tả</label>
          <textarea 
            className="capnhat-textarea"
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            required 
          />
        </div>
        
        <div className="capnhat-group">
          <label className="capnhat-label">Giá (VNĐ)</label>
          <input 
            type="text" 
            className="capnhat-input"
            value={displayPrice} 
            onChange={handlePriceChange} 
            placeholder="Ví dụ: 200.000"
            required 
          />
        </div>
        
        <div className="capnhat-group">
          <label className="capnhat-label">Địa chỉ cụ thể</label>
          <input 
            type="text" 
            className="capnhat-input"
            value={contactInfo} 
            onChange={e => setContactInfo(e.target.value)} 
            required 
          />
        </div>
        
        <div className="capnhat-group">
          <label className="capnhat-label">Tình trạng sản phẩm</label>
          <select 
            className="capnhat-select"
            value={condition} 
            onChange={e => setCondition(e.target.value)} 
            required
          >
            <option value="Moi">Mới</option>
            <option value="DaSuDung">Đã Sử Dụng</option>
            <option value="CanThanh">Cần Thanh Lý</option>
          </select>
        </div>
        
        {/* Phần upload ảnh */}
        <div className="capnhat-media-box">
          <div className="capnhat-media-header">
            <div className="capnhat-camera-icon"></div>
            <span className="capnhat-media-title">
              Hình ảnh sản phẩm
              <span className="capnhat-note">(tối đa 7 ảnh)</span>
            </span>
          </div>
          
          <div className="capnhat-upload-area">
            <input
              type="file"
              className="capnhat-file-input"
              onChange={handleImageChange}
              multiple
              accept="image/*"
              disabled={imagePreviewList.length >= 7}
            />
            <div className="capnhat-upload-text">
              <span className="capnhat-highlight">Chọn ảnh</span> để tải lên
            </div>
            <div className="capnhat-sub-note">
              Ảnh đầu tiên sẽ là <span className="capnhat-highlight">ảnh bìa</span>
            </div>
          </div>
          
          {imagePreviewList.length > 0 && (
            <div className="capnhat-preview-list">
              {imagePreviewList.map((img, idx) => (
                <div key={`${img.type}-${img.id || img.fileName || idx}`} className="capnhat-preview-item">
                  <img src={img.url} alt={`Ảnh ${idx + 1}`} />
                  {idx === 0 && <div className="capnhat-cover-badge">Ảnh bìa</div>}
                  {img.type === 'old' && <div className="capnhat-cover-badge" style={{top: '25px', backgroundColor: '#28a745'}}>CŨ</div>}
                  {img.type === 'new' && <div className="capnhat-cover-badge" style={{top: '25px', backgroundColor: '#007bff'}}>MỚI</div>}
                  <button
                    type="button"
                    className="capnhat-remove-btn"
                    onClick={() => handleRemoveImage(idx)}
                    title="Xóa ảnh"
                  >×</button>
                  <div className="capnhat-move-controls">
                    <button
                      type="button"
                      className="capnhat-move-btn capnhat-move-left"
                      onClick={() => moveImage(idx, idx - 1)}
                      title="Di chuyển sang trái"
                      disabled={idx === 0}
                    >‹</button>
                    <button
                      type="button"
                      className="capnhat-move-btn capnhat-move-right"
                      onClick={() => moveImage(idx, idx + 1)}
                      title="Di chuyển sang phải"
                      disabled={idx === imagePreviewList.length - 1}
                    >›</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="capnhat-counter">
            Đã chọn {imagePreviewList.length}/7 ảnh 
            ({imagePreviewList.filter(i => i.type === 'old').length} cũ, {imagePreviewList.filter(i => i.type === 'new').length} mới)
          </div>
        </div>

        {/* Phần upload video */}
        <div className="capnhat-media-box">
          <div className="capnhat-media-header">
            <div className="capnhat-video-icon"></div>
            <span className="capnhat-media-title">
              Video sản phẩm
              <span className="capnhat-note">(tối đa 1 video)</span>
            </span>
          </div>
          
          <div className="capnhat-upload-area">
            <input
              type="file"
              className="capnhat-file-input"
              onChange={handleVideoChange}
              accept="video/*"
              disabled={videoPreviewList.length >= 1}
            />
            <div className="capnhat-upload-text">
              <span className="capnhat-highlight">Chọn video</span> để tải lên
            </div>
          </div>
          
          {videoPreviewList.length > 0 && (
            <div className="capnhat-preview-list">
              {videoPreviewList.map((video, idx) => (
                <div key={`${video.type}-${video.id || video.fileName || idx}`} className="capnhat-preview-item">
                  <video 
                    src={video.url} 
                    controls
                    muted
                  />
                  {video.type === 'old' && <div className="capnhat-cover-badge" style={{backgroundColor: '#28a745'}}>CŨ</div>}
                  {video.type === 'new' && <div className="capnhat-cover-badge" style={{backgroundColor: '#007bff'}}>MỚI</div>}
                  <button
                    type="button"
                    className="capnhat-remove-btn"
                    onClick={() => handleRemoveVideo(idx)}
                    title="Xóa video"
                  >×</button>
                </div>
              ))}
            </div>
          )}
          
          <div className="capnhat-counter">
            Đã chọn {videoPreviewList.length}/1 video
            ({videoPreviewList.filter(i => i.type === 'old').length} cũ, {videoPreviewList.filter(i => i.type === 'new').length} mới)
          </div>
        </div>

        {/* Phần tỉnh thành */}
        <div className="capnhat-group">
          <label className="capnhat-label">Tỉnh/Thành phố</label>
          <select 
            className="capnhat-select"
            value={province} 
            onChange={e => setProvince(e.target.value)} 
            required
          >
            <option value="">Chọn tỉnh/thành phố</option>
            {tinhThanhList.map(tinh => (
              <option key={tinh.maTinhThanh} value={tinh.maTinhThanh}>
                {tinh.tenTinhThanh}
              </option>
            ))}
          </select>
        </div>

        <div className="capnhat-group">
          <label className="capnhat-label">Quận/Huyện</label>
          <select 
            className="capnhat-select"
            value={district} 
            onChange={e => setDistrict(e.target.value)} 
            required
          >
            <option value="">Chọn quận/huyện</option>
            {quanHuyenList.map(quan => (
              <option key={quan.maQuanHuyen} value={quan.maQuanHuyen}>
                {quan.tenQuanHuyen}
              </option>
            ))}
          </select>
        </div>

        <div className="capnhat-button-group">
          <button type="submit" className="capnhat-submit-btn">
            Cập nhật Tin
          </button>
        </div>
      </form>
    </div>
  );
};

export default CapNhatTin;