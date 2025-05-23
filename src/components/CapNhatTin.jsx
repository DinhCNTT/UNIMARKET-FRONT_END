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
  const [displayPrice, setDisplayPrice] = useState(""); // Giá hiển thị có format
  const [contactInfo, setContactInfo] = useState("");
  const [condition, setCondition] = useState("Moi");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [tinhThanhList, setTinhThanhList] = useState([]);
  const [quanHuyenList, setQuanHuyenList] = useState([]);

  // State cho preview ảnh và video (tách riêng)
  const [imagePreviewList, setImagePreviewList] = useState([]); // Tối đa 7 ảnh
  const [videoPreviewList, setVideoPreviewList] = useState([]); // Tối đa 1 video
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
    const rawValue = e.target.value.replace(/[^\d]/g, ''); // Chỉ lấy số
    setPrice(rawValue); // Lưu giá trị thô
    setDisplayPrice(formatPrice(rawValue)); // Hiển thị có format
  };

  // Lấy thông tin tin đăng từ API
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
          
          // Tách ảnh và video
          if (tinDang.anhTinDangs && tinDang.anhTinDangs.length > 0) {
            const images = [];
            const videos = [];
            
            tinDang.anhTinDangs.forEach(media => {
              const url = media.duongDan.startsWith('http') ? media.duongDan : `http://localhost:5133${media.duongDan}`;
              const mediaItem = {
                type: 'old',
                url: url,
                id: media.maAnh
              };
              
              // Kiểm tra có phải video không (dựa vào extension)
              const isVideo = /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(media.duongDan);
              if (isVideo) {
                videos.push(mediaItem);
              } else {
                images.push(mediaItem);
              }
            });
            
            setImagePreviewList(images);
            setVideoPreviewList(videos);
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
      url: URL.createObjectURL(file)
    }));
    setImagePreviewList(prev => [...prev, ...newItems]);
  };

  // Xử lý khi chọn video mới
  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 1 - videoPreviewList.length);
    const newItems = files.map(file => ({
      type: 'new',
      file,
      url: URL.createObjectURL(file)
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
    formData.append("price", price); // Gửi giá trị thô không có format
    formData.append("contactInfo", contactInfo);
    formData.append("condition", condition);
    formData.append("canNegotiate", true);
    formData.append("province", province);
    formData.append("district", district);
    formData.append("categoryId", categoryId);
    formData.append("userId", user.id);
    
    // Gửi thứ tự id ảnh cũ còn lại
    const oldImageOrder = imagePreviewList.filter(i => i.type === 'old').map(i => i.id);
    formData.append('oldImageOrder', JSON.stringify(oldImageOrder));
    
    // Gửi thứ tự id video cũ còn lại
    const oldVideoOrder = videoPreviewList.filter(i => i.type === 'old').map(i => i.id);
    formData.append('oldVideoOrder', JSON.stringify(oldVideoOrder));
    
    // Gửi file ảnh mới
    imagePreviewList.filter(i => i.type === 'new').forEach(i => {
      formData.append('newImages', i.file);
    });
    
    // Gửi file video mới
    videoPreviewList.filter(i => i.type === 'new').forEach(i => {
      formData.append('newVideos', i.file);
    });
    
    // Gửi id ảnh và video cũ bị xóa
    if (oldImagesToDelete.length > 0) {
      formData.append('oldImagesToDelete', JSON.stringify(oldImagesToDelete));
    }
    if (oldVideosToDelete.length > 0) {
      formData.append('oldVideosToDelete', JSON.stringify(oldVideosToDelete));
    }
    
    try {
      const response = await axios.put(
        `http://localhost:5133/api/TinDang/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
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
          <label>Giá (VNĐ)</label>
          <input 
            type="text" 
            value={displayPrice} 
            onChange={handlePriceChange} 
            placeholder="Ví dụ: 200.000"
            required 
          />
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
            <option value="CanThanh">Cần Thanh Lý</option>
          </select>
        </div>
        
        {/* Phần upload ảnh */}
        <div className="post-tindang-group">
          <label>Ảnh sản phẩm (tối đa 7 ảnh):</label>
          <input
            type="file"
            onChange={handleImageChange}
            multiple
            accept="image/*"
            disabled={imagePreviewList.length >= 7}
          />
          {imagePreviewList.length > 0 && (
            <div className="image-preview-list" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
              {imagePreviewList.map((img, idx) => (
                <div key={img.id || img.url || idx} style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={img.url} alt={`Ảnh ${idx + 1}`} style={{ maxWidth: 90, maxHeight: 90, border: '1px solid #ccc', borderRadius: 4 }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', color: '#d00', fontWeight: 'bold', lineHeight: '20px', padding: 0 }}
                    title="Xóa ảnh"
                  >×</button>
                  <button
                    type="button"
                    onClick={() => moveImage(idx, idx - 1)}
                    style={{ position: 'absolute', bottom: 0, left: 0, background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', color: '#333', fontWeight: 'bold', lineHeight: '20px', padding: 0 }}
                    title="Di chuyển sang trái"
                    disabled={idx === 0}
                  >&lt;</button>
                  <button
                    type="button"
                    onClick={() => moveImage(idx, idx + 1)}
                    style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', color: '#333', fontWeight: 'bold', lineHeight: '20px', padding: 0 }}
                    title="Di chuyển sang phải"
                    disabled={idx === imagePreviewList.length - 1}
                  >&gt;</button>
                </div>
              ))}
            </div>
          )}
          <small style={{ color: '#666' }}>
            Đã chọn {imagePreviewList.length}/7 ảnh
          </small>
        </div>

        {/* Phần upload video */}
        <div className="post-tindang-group">
          <label>Video sản phẩm (tối đa 1 video):</label>
          <input
            type="file"
            onChange={handleVideoChange}
            accept="video/*"
            disabled={videoPreviewList.length >= 1}
          />
          {videoPreviewList.length > 0 && (
            <div className="video-preview-list" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
              {videoPreviewList.map((video, idx) => (
                <div key={video.id || video.url || idx} style={{ position: 'relative', display: 'inline-block' }}>
                  <video 
                    src={video.url} 
                    style={{ maxWidth: 150, maxHeight: 90, border: '1px solid #ccc', borderRadius: 4 }}
                    controls
                    muted
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(idx)}
                    style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', color: '#d00', fontWeight: 'bold', lineHeight: '20px', padding: 0 }}
                    title="Xóa video"
                  >×</button>
                </div>
              ))}
            </div>
          )}
          <small style={{ color: '#666' }}>
            Đã chọn {videoPreviewList.length}/1 video
          </small>
        </div>

        {/* Phần tỉnh thành */}
        <div className="post-tindang-group">
          <label>Tỉnh/Thành phố</label>
          <select value={province} onChange={e => setProvince(e.target.value)} required>
            <option value="">Chọn tỉnh/thành phố</option>
            {tinhThanhList.map(tinh => (
              <option key={tinh.maTinhThanh} value={tinh.maTinhThanh}>
                {tinh.tenTinhThanh}
              </option>
            ))}
          </select>
        </div>

        <div className="post-tindang-group">
          <label>Quận/Huyện</label>
          <select value={district} onChange={e => setDistrict(e.target.value)} required>
            <option value="">Chọn quận/huyện</option>
            {quanHuyenList.map(quan => (
              <option key={quan.maQuanHuyen} value={quan.maQuanHuyen}>
                {quan.tenQuanHuyen}
              </option>
            ))}
          </select>
        </div>

        <div className="post-tindang-button-group">
          <button type="submit">Cập nhật Tin</button>
        </div>
      </form>
    </div>
  );
};

export default CapNhatTin;