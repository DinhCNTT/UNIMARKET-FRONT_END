import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "./LocTinDang.css";
import { CategoryContext } from "../context/CategoryContext";
import { SearchContext } from "../context/SearchContext";
import { LocationContext } from "../context/LocationContext";
import { Link } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";
import LocMoRong from "../components/LocMoRong";

const timeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: "năm", seconds: 31536000 },
    { label: "tháng", seconds: 2592000 },
    { label: "ngày", seconds: 86400 },
    { label: "giờ", seconds: 3600 },
    { label: "phút", seconds: 60 },
    { label: "giây", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label} trước`;
    }
  }
  return "Vừa xong";
};

const LocTinDang = () => {
  const [posts, setPosts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [categories, setCategories] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 15;

  // Sort order state: "newest" hoặc "oldest"
  const [sortOrder, setSortOrder] = useState("newest");

  const { searchTerm } = useContext(SearchContext);
  const {
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
  } = useContext(CategoryContext);
  const { selectedLocation } = useContext(LocationContext);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5133/api/tindang/get-posts"
        );
        setPosts(response.data);
        console.log("Fetched posts:", response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5133/api/category/get-categories-with-icon"
        );
        setCategories(res.data);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };

    fetchPosts();
    fetchCategories();
  }, []);

  // Các hàm filter
  const filterBySearchTerm = (posts) => {
    if (!searchTerm) return posts;
    return posts.filter(
      (post) =>
        post.tieuDe && post.tieuDe.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filterByCategory = (posts) => {
    if (!selectedCategory && !selectedSubCategory) return posts;
    return posts.filter((post) => {
      if (selectedSubCategory) {
        return (
          post.danhMuc && post.danhMuc.toLowerCase() === selectedSubCategory.toLowerCase()
        );
      }
      if (selectedCategory) {
        return (
          post.danhMucCha &&
          post.danhMucCha.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
      return true;
    });
  };

  const filterByLocation = (posts) => {
    if (!selectedLocation) return posts;
    return posts.filter((post) =>
      post.tinhThanh && post.tinhThanh.includes(selectedLocation)
    );
  };

  const filterByDistrict = (posts) => {
    if (!selectedDistrict) return posts;
    return posts.filter((post) => post.quanHuyen && post.quanHuyen.includes(selectedDistrict));
  };

  const filterByPrice = (posts) => {
    return posts.filter((post) => post.gia >= minPrice && post.gia <= maxPrice);
  };

  // Áp dụng filter
  const filteredByLocation = filterByLocation(posts);
  const filteredByCategory = filterByCategory(filteredByLocation);
  const filteredByDistrict = filterByDistrict(filteredByCategory);
  const filteredByPrice = filterByPrice(filteredByDistrict);
  const filteredPostsBySearch = filterBySearchTerm(filteredByPrice);

  // Sắp xếp theo sortOrder
  const sortedPosts = [...filteredPostsBySearch].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.ngayDang) - new Date(a.ngayDang);
    } else {
      return new Date(a.ngayDang) - new Date(b.ngayDang);
    }
  });

  // Tính toán phân trang
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = sortedPosts.slice(indexOfFirstPost, indexOfLastPost);

  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset trang khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedCategory,
    selectedSubCategory,
    selectedLocation,
    selectedDistrict,
    minPrice,
    maxPrice,
    sortOrder,
  ]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const renderNoPostsMessage = () => {
    if (sortedPosts.length === 0) {
      let message = `Không có tin đăng`;
      if (selectedLocation) message += ` tại ${selectedLocation}`;
      if (selectedDistrict) message += ` - ${selectedDistrict}`;
      if (selectedSubCategory) message += ` trong danh mục "${selectedSubCategory}"`;
      else if (selectedCategory) message += ` trong danh mục "${selectedCategory}"`;
      if (searchTerm) message += ` với từ khóa "${searchTerm}"`;
      return message;
    }
    return null;
  };

  return (
    <div className="loc-tin-dang-container">
      <TopNavbar />
      <LocMoRong
        onDistrictChange={setSelectedDistrict}
        onPriceChange={(min, max) => {
          setMinPrice(min);
          setMaxPrice(max);
        }}
        onParentCategoryChange={(cat) => {
          setSelectedCategory(cat);
          setSelectedSubCategory("");
        }}
        categories={categories}
        onSortOrderChange={setSortOrder}
      />
      <h2 className="loc-tin-dang-title">Kết Quả Lọc Tin Đăng</h2>
      <div className="loc-tin-dang-filter-info">
        {selectedLocation && (
          <p>
            Đang hiển thị tin đăng tại: <strong>{selectedLocation}</strong>
          </p>
        )}
        {selectedDistrict && (
          <p>
            Đang lọc theo quận/huyện: <strong>{selectedDistrict}</strong>
          </p>
        )}
        {selectedSubCategory && (
          <p>
            Danh mục: <strong>{selectedSubCategory}</strong>
          </p>
        )}
        {selectedCategory && !selectedSubCategory && (
          <p>
            Danh mục: <strong>{selectedCategory}</strong>
          </p>
        )}
        {searchTerm && (
          <p>
            Từ khóa: <strong>{searchTerm}</strong>
          </p>
        )}
      </div>

      <div className="loc-tin-dang-list">
        {renderNoPostsMessage() ? (
          <p className="loc-tin-dang-no-result">{renderNoPostsMessage()}</p>
        ) : (
          currentPosts.map((post) => (
            <div key={post.maTinDang} className="loc-tin-dang-item">
              <Link to={`/tin-dang/${post.maTinDang}`} className="loc-tin-dang-link">
                <div className="loc-tin-dang-content">
                  <div className="loc-tin-dang-image-container">
                    {post.images && post.images.length > 0 ? (
                      <img
                        src={
                          post.images[0].startsWith("http")
                            ? post.images[0]
                            : `http://localhost:5133${post.images[0]}`
                        }
                        alt={post.tieuDe}
                        className="loc-tin-dang-image"
                      />
                    ) : (
                      <div className="loc-tin-dang-no-image">Không có ảnh</div>
                    )}
                  </div>
                  <div className="loc-tin-dang-info">
                    <h3 className="loc-tin-dang-title-item">{post.tieuDe}</h3>
                    <p className="loc-tin-dang-price">{formatCurrency(post.gia)}</p>
                    <p className="loc-tin-dang-location">
                      {post.tinhThanh} - {post.quanHuyen}
                    </p>
                    {post.ngayDang && (
                      <p className="loc-tin-dang-time">{timeAgo(post.ngayDang)}</p>
                    )}
                    {post.moTa && (
                      <p className="loc-tin-dang-description">
                        {post.moTa.length > 100
                          ? `${post.moTa.substring(0, 100)}...`
                          : post.moTa}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </button>

          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={currentPage === number ? "active" : ""}
            >
              {number}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default LocTinDang;
