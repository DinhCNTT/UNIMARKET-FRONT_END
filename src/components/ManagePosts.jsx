import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./ManagePosts.css";

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const postsPerPage = 4;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:5133/api/tindang/get-posts-admin');
      const data = response.data;
      if (Array.isArray(data)) {
        setPosts(data);
        setTotalPages(Math.ceil(data.length / postsPerPage));
        updateDisplayedPosts(data, currentPage);
      } else {
        console.error("Dữ liệu không phải là mảng");
      }
    } catch (error) {
      console.error("Lỗi khi tải tin đăng", error);
    }
  };

  const updateDisplayedPosts = (postsList, page) => {
    const startIndex = (page - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    setDisplayedPosts(postsList.slice(startIndex, endIndex));
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      updateDisplayedPosts(posts, pageNumber);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const toggleDescription = (postId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleMediaClick = (mediaList, initialIndex = 0) => {
    const fullMedias = mediaList.map(media =>
      media.startsWith("http") ? media : `http://localhost:5133/${media}`
    );
    setSelectedMedia({ 
      medias: fullMedias, 
      currentIndex: initialIndex 
    });
  };

  const closeMediaPopup = () => {
    setSelectedMedia(null);
  };

  const handleApprove = async (id) => {
    const result = await Swal.fire({
      title: 'Bạn chắc chắn duyệt tin này?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Duyệt',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const response = await axios.post(`http://localhost:5133/api/admin/approve-post/${id}`);
        Swal.fire('Thành công', response.data.message, 'success');
        await fetchPosts();
      } catch (error) {
        let message = "Có lỗi khi duyệt tin đăng!";
        if (error.response?.data?.message) message = error.response.data.message;
        Swal.fire('Lỗi', message, 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReject = async (id) => {
    const result = await Swal.fire({
      title: 'Bạn chắc chắn từ chối tin này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const response = await axios.post(`http://localhost:5133/api/admin/reject-post/${id}`);
        Swal.fire('Thành công', response.data.message, 'success');
        await fetchPosts();
      } catch (error) {
        Swal.fire('Lỗi', 'Có lỗi khi từ chối tin đăng!', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper function để kiểm tra đuôi file có phải video không
  const isVideoFile = (url) => {
    return url.match(/\.(mp4|mov|avi|webm|mkv)$/i);
  };

  return (
    <div className="manage-posts-container">
      <h2 className="manage-posts-title">Quản Lý Tin Đăng</h2>

      {loading && <div className="loading-overlay">Đang xử lý...</div>}

      <table className="manage-posts-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tiêu Đề</th>
            <th>Người Bán</th>
            <th>Ngày Đăng</th>
            <th>Giá</th>
            <th>Mô Tả</th>
            <th>Media</th>
            <th>Trạng Thái</th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {displayedPosts.length > 0 ? displayedPosts.map(post => (
            <tr key={post.maTinDang}>
              <td>{post.maTinDang}</td>
              <td>{post.tieuDe}</td>
              <td>{post.nguoiBan}</td>
              <td>{formatDate(post.ngayDang)}</td>
              <td>{formatCurrency(post.gia)} ₫</td>
              <td
                className={`description-cell ${expandedDescriptions[post.maTinDang] ? 'expanded' : ''}`}
                onClick={() => toggleDescription(post.maTinDang)}
              >
                <div
                  className="description-content"
                  dangerouslySetInnerHTML={{ __html: (post.moTa || "").replace(/\n/g, "<br/>") }}
                />
              </td>
              <td>
                {post.hinhAnh && post.hinhAnh.length > 0 ? (
                  <div className="media-preview-container">
                    {/* Hiển thị media đầu tiên */}
                    <div className="media-thumbnail" onClick={() => handleMediaClick(post.hinhAnh, 0)}>
                      {isVideoFile(post.hinhAnh[0]) ? (
                        <video
                          src={post.hinhAnh[0].startsWith("http") ? post.hinhAnh[0] : `http://localhost:5133/${post.hinhAnh[0]}`}
                          className="post-media-thumbnail"
                          muted
                        />
                      ) : (
                        <img
                          src={post.hinhAnh[0].startsWith("http") ? post.hinhAnh[0] : `http://localhost:5133/${post.hinhAnh[0]}`}
                          alt="Ảnh đại diện"
                          className="post-media-thumbnail"
                        />
                      )}
                      {/* Hiển thị số lượng media nếu có nhiều hơn 1 */}
                      {post.hinhAnh.length > 1 && (
                        <div className="media-count-badge">
                          +{post.hinhAnh.length - 1}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <span>Không có media</span>
                )}
              </td>
              <td className={`manage-posts-status-${post.trangThai}`}>
                {post.trangThai === 1 ? "Đã duyệt" : post.trangThai === 2 ? "Đã từ chối" : "Chờ duyệt"}
              </td>
              <td>
                <button
                  className="manage-posts-approve-btn"
                  onClick={() => handleApprove(post.maTinDang)}
                  disabled={post.trangThai !== 0 || loading}
                >
                  Duyệt
                </button>
                <button
                  className="manage-posts-reject-btn"
                  onClick={() => handleReject(post.maTinDang)}
                  disabled={post.trangThai !== 0 || loading}
                >
                  Từ Chối
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="9">Không có tin đăng nào để hiển thị.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Trước</button>
        <span>Trang {currentPage} / {totalPages}</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Sau</button>
      </div>

      {/* Media popup với carousel giống Chợ Tốt */}
      {selectedMedia && (
        <MediaCarousel 
          medias={selectedMedia.medias}
          initialIndex={selectedMedia.currentIndex}
          onClose={closeMediaPopup}
        />
      )}
    </div>
  );
};

// Component MediaCarousel giống Chợ Tốt
const MediaCarousel = ({ medias, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Xử lý phím ESC để đóng popup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const goToPrevious = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? medias.length - 1 : prevIndex - 1
    );
    setIsZoomed(false);
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === medias.length - 1 ? 0 : prevIndex + 1
    );
    setIsZoomed(false);
  };

  const isVideoFile = (url) => {
    return url.match(/\.(mp4|mov|avi|webm|mkv)$/i);
  };

  const currentMedia = medias[currentIndex];
  const isVideo = isVideoFile(currentMedia);

  return (
    <div className="media-carousel-overlay" onClick={onClose}>
      <div className="media-carousel-container" onClick={e => e.stopPropagation()}>
        {/* Nút đóng */}
        <button className="carousel-close-btn" onClick={onClose}>
          ✕
        </button>

        {/* Media chính */}
        <div className="carousel-media-wrapper">
          {medias.length > 1 && (
            <button className="carousel-nav-btn carousel-prev" onClick={goToPrevious}>
              ❮
            </button>
          )}

          <div className={`carousel-media-container ${isZoomed ? 'zoomed' : ''}`}>
            {isVideo ? (
              <video
                src={currentMedia}
                controls
                className="carousel-media"
                key={currentMedia} // Force reload when changing video
                autoPlay={false}
              />
            ) : (
              <img
                src={currentMedia}
                alt={`Media ${currentIndex + 1}`}
                className="carousel-media"
                onClick={() => setIsZoomed(!isZoomed)}
                style={{ cursor: 'zoom-in' }}
              />
            )}
          </div>

          {medias.length > 1 && (
            <button className="carousel-nav-btn carousel-next" onClick={goToNext}>
              ❯
            </button>
          )}
        </div>

        {/* Thông tin media */}
        <div className="carousel-info">
          <div className="carousel-counter">
            {currentIndex + 1} / {medias.length}
          </div>
          {!isVideo && (
            <div className="carousel-zoom-hint">
              Click để phóng to/thu nhỏ
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePosts; 