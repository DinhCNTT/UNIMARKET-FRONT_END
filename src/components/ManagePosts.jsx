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

                const updatedPosts = posts.map(post =>
                    post.maTinDang === id ? { ...post, trangThai: 1 } : post
                );
                setPosts(updatedPosts);
                updateDisplayedPosts(updatedPosts, currentPage);
            } catch (error) {
                Swal.fire('Lỗi', 'Có lỗi khi duyệt tin đăng!', 'error');
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

                const updatedPosts = posts.map(post =>
                    post.maTinDang === id ? { ...post, trangThai: 2 } : post
                );
                setPosts(updatedPosts);
                updateDisplayedPosts(updatedPosts, currentPage);
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
                        <th className="id-column">ID</th>
                        <th className="title-column">Tiêu Đề</th>
                        <th className="seller-column">Người Bán</th>
                        <th className="date-column">Ngày Đăng</th>
                        <th className="price-column">Giá</th>
                        <th className="post-description">Mô Tả</th>
                        <th className="image-column">Hình Ảnh</th>
                        <th className="status-column">Trạng Thái</th>
                        <th className="action-column">Thao Tác</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(displayedPosts) && displayedPosts.length > 0 ? (
                        displayedPosts.map(post => (
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
                                        post.hinhAnh.map((imgUrl, index) => (
                                            <img
                                                key={index}
                                                src={`http://localhost:5133/${imgUrl}`}
                                                alt={`Image ${index + 1}`}
                                                className="post-image-manage-posts"
                                                onClick={() => handleImageClick(`http://localhost:5133/${imgUrl}`)}
                                            />
                                        ))
                                    ) : (
                                        <span>Không có ảnh</span>
                                    )}
                                </td>
                                <td className={`manage-posts-status-${post.trangThai}`}>
                                    {post.trangThai === 1
                                        ? "Đã duyệt"
                                        : post.trangThai === 2
                                        ? "Đã từ chối"
                                        : "Chờ duyệt"}
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
                        ))
                    ) : (
                        <tr>
                            <td colSpan="9">Không có tin đăng nào để hiển thị.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="pagination">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    Trước
                </button>
                <span>Trang {currentPage} / {totalPages}</span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    Sau
                </button>
            </div>

            {selectedImage && (
                <div className="image-popup-overlay" onClick={closeImagePopup}>
                    <div className="image-popup-container">
                        <span className="close-popup" onClick={closeImagePopup}>X</span>
                        <img src={selectedImage} alt="Hình ảnh phóng to" className="popup-image" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePosts;
