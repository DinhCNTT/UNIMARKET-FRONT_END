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
    const [selectedImage, setSelectedImage] = useState(null);
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

    const handleImageClick = (imgUrl) => {
        setSelectedImage(imgUrl);
    };

    const closeImagePopup = () => {
        setSelectedImage(null);
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
                        <th>Hình Ảnh</th>
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
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <img
                                            src={post.hinhAnh[0].startsWith("http") ? post.hinhAnh[0] : `http://localhost:5133/${post.hinhAnh[0]}`}
                                            alt="Ảnh đại diện"
                                            className="post-image-manage-posts"
                                            onClick={() => handleImageClick(post.hinhAnh[0].startsWith("http") ? post.hinhAnh[0] : `http://localhost:5133/${post.hinhAnh[0]}`)}
                                        />
                                        {post.hinhAnh.length > 1 && (
                                            <button
                                                className="manage-posts-more-img-btn"
                                                style={{ marginTop: 4 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const fullImages = post.hinhAnh.map(img => img.startsWith("http") ? img : `http://localhost:5133/${img}`);
                                                    setSelectedImage({ images: fullImages, index: 0 });
                                                }}
                                            >Xem thêm</button>
                                        )}
                                    </div>
                                ) : <span>Không có ảnh</span>}
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

            {selectedImage && (
                <div className="image-popup-overlay" onClick={closeImagePopup}>
                    <div className="image-popup-container" onClick={e => e.stopPropagation()}>
                        <span className="close-popup" onClick={closeImagePopup}>X</span>
                        {Array.isArray(selectedImage.images) ? (
                            <ImageCarousel images={selectedImage.images} startIndex={selectedImage.index} />
                        ) : (
                            <img src={selectedImage} alt="Hình ảnh phóng to" className="popup-image" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Component carousel tách riêng
const ImageCarousel = ({ images, startIndex = 0 }) => {
    const [current, setCurrent] = useState(startIndex);
    if (!images || images.length === 0) return null;

    const prev = () => setCurrent(c => (c === 0 ? images.length - 1 : c - 1));
    const next = () => setCurrent(c => (c === images.length - 1 ? 0 : c + 1));

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 400 }}>
            {images.length > 1 && <button onClick={prev} style={carouselBtnStyle}>&#8592;</button>}
            <img src={images[current]} alt={`Ảnh ${current + 1}`} style={{ maxWidth: 500, maxHeight: 400, borderRadius: 8 }} />
            {images.length > 1 && <button onClick={next} style={carouselBtnStyle}>&#8594;</button>}
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>{current + 1} / {images.length}</div>
        </div>
    );
};

const carouselBtnStyle = {
    fontSize: 28,
    margin: "0 12px",
    border: "2px solid #222",
    borderRadius: "50%",
    width: 40,
    height: 40,
    background: "#fff",
    color: "#222",
    cursor: "pointer"
};

export default ManagePosts;
