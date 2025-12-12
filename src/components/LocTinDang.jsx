import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import styles from "./LocTinDang.module.css";
import { CategoryContext } from "../context/CategoryContext";
import { SearchContext } from "../context/SearchContext";
import { LocationContext } from "../context/LocationContext";
import { Link } from "react-router-dom";
import TopNavbar from "./TopNavbar/TopNavbar";
import LocMoRong from "../components/LocMoRong";
import defaultAvatar from "../assets/default-avatar.png";

// Icon vị trí
const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14px" height="14px" className={styles.locationIcon}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

// [MỚI] Icon Dạng Lưới
const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

// [MỚI] Icon Dạng Danh Sách
const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

// Helper tính thời gian
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
    if (count > 0) return `${count} ${interval.label} trước`;
  }
  return "Vừa xong";
};

const LocTinDang = () => {
  const [posts, setPosts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  const [sortOrder, setSortOrder] = useState("newest");
  
  // [MỚI] State lưu chế độ xem: 'list' (danh sách) hoặc 'grid' (lưới)
  const [viewMode, setViewMode] = useState("list");

  const { searchTerm } = useContext(SearchContext);
  const { selectedCategory, setSelectedCategory, selectedSubCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { selectedLocation } = useContext(LocationContext);

  const { contextCity, contextDistrict } = useMemo(() => {
    if (!selectedLocation || selectedLocation === "Toàn quốc") {
      return { contextCity: "", contextDistrict: "" };
    }
    if (selectedLocation.includes(",")) {
      const parts = selectedLocation.split(",");
      return {
        contextDistrict: parts[0].trim(),
        contextCity: parts[1].trim()
      };
    }
    return { contextCity: selectedLocation, contextDistrict: "" };
  }, [selectedLocation]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/tindang/get-posts");
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
        setCategories(res.data);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };
    fetchPosts();
    fetchCategories();
  }, []);

  // --- Filter Functions (Giữ nguyên) ---
  const filterBySearchTerm = (posts) => {
    if (!searchTerm) return posts;
    return posts.filter((post) => post.tieuDe && post.tieuDe.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const filterByCategory = (posts) => {
    if (!selectedCategory && !selectedSubCategory) return posts;
    return posts.filter((post) => {
      if (selectedSubCategory) {
        return post.danhMuc && post.danhMuc.toLowerCase() === selectedSubCategory.toLowerCase();
      }
      if (selectedCategory) {
        return post.danhMucCha && post.danhMucCha.toLowerCase() === selectedCategory.toLowerCase();
      }
      return true;
    });
  };

  const filterByLocation = (posts) => {
    if (!contextCity) return posts;
    return posts.filter((post) => post.tinhThanh && post.tinhThanh === contextCity);
  };

  const filterByDistrict = (posts) => {
    const targetDistrict = selectedDistrict || contextDistrict;
    if (!targetDistrict) return posts;
    return posts.filter((post) => post.quanHuyen && post.quanHuyen.trim() === targetDistrict.trim());
  };

  const filterByPrice = (posts) => {
    return posts.filter((post) => post.gia >= minPrice && post.gia <= maxPrice);
  };

  const filteredByLocation = filterByLocation(posts);
  const filteredByCategory = filterByCategory(filteredByLocation);
  const filteredByDistrict = filterByDistrict(filteredByCategory);
  const filteredByPrice = filterByPrice(filteredByDistrict);
  const filteredPostsBySearch = filterBySearchTerm(filteredByPrice);

  const sortedPosts = [...filteredPostsBySearch].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.ngayDang) - new Date(a.ngayDang);
    } else {
      return new Date(a.ngayDang) - new Date(b.ngayDang);
    }
  });

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = sortedPosts.slice(indexOfFirstPost, indexOfLastPost);

  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSubCategory, selectedLocation, selectedDistrict, minPrice, maxPrice, sortOrder]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const renderNoPostsMessage = () => {
    if (sortedPosts.length === 0) {
      let message = `Không có tin đăng`;
      if (contextCity) message += ` tại ${contextCity}`;
      if (selectedDistrict || contextDistrict) message += ` - ${selectedDistrict || contextDistrict}`;
      if (selectedSubCategory) message += ` trong danh mục "${selectedSubCategory}"`;
      else if (selectedCategory) message += ` trong danh mục "${selectedCategory}"`;
      if (searchTerm) message += ` với từ khóa "${searchTerm}"`;
      return message;
    }
    return null;
  };

  // --- Hàm chuyển đổi View Mode ---
  const toggleViewMode = () => {
    setViewMode(prev => prev === "list" ? "grid" : "list");
  };

  return (
    <div className={styles.pageWrapper}>
      <TopNavbar />
      
      <div className={styles.contentContainer}>
        {/* === KHỐI 1: BỘ LỌC === */}
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

        {/* === KHỐI 2: DANH SÁCH TIN === */}
        <div className={styles.listBlock}>
          
          {/* [MỚI] Header Row: Chứa Title và Nút View Toggle */}
          <div className={styles.headerRow}>
              <h2 className={styles.title}>Tin đăng dành cho bạn</h2>
              
             <button className={styles.viewToggleBtn} onClick={toggleViewMode}>
              {/* Logic đúng: Nếu đang là List thì hiện icon Grid, ngược lại hiện icon List */}
              {viewMode === "list" ? <GridIcon /> : <ListIcon />} 
              <span>{viewMode === "list" ? "Dạng lưới" : "Dạng danh sách"}</span>
            </button>
          </div>
          
          <div className={styles.filterInfo}>
            {contextCity && <p>Khu vực: <strong>{contextCity}</strong></p>}
            {(selectedDistrict || contextDistrict) && <p>Quận/Huyện: <strong>{selectedDistrict || contextDistrict}</strong></p>}
            {(selectedSubCategory || selectedCategory) && <p>Danh mục: <strong>{selectedSubCategory || selectedCategory}</strong></p>}
            {searchTerm && <p>Từ khóa: <strong>{searchTerm}</strong></p>}
          </div>

          {/* [MỚI] Thêm class động listView hoặc gridView vào container */}
          <div className={`${styles.list} ${viewMode === "grid" ? styles.gridView : styles.listView}`}>
            {renderNoPostsMessage() ? (
              <p className={styles.noResult}>{renderNoPostsMessage()}</p>
            ) : (
              currentPosts.map((post) => (
                <div key={post.maTinDang} className={styles.item}>
                 <Link to={`/tin-dang/${post.maTinDang}`} className={styles.link}>
                    <div className={styles.content}>
                      
                      {/* 1. KHUNG ẢNH */}
                      <div className={styles.imageContainer}>
                        {post.images && post.images.length > 0 ? (
                          <img
                            src={post.images[0].startsWith("http") ? post.images[0] : `http://localhost:5133${post.images[0]}`}
                            alt={post.tieuDe}
                            className={styles.image}
                          />
                        ) : (
                          <div className={styles.noImage}>Không có ảnh</div>
                        )}

                        {/* [QUAN TRỌNG] Đưa thời gian vào đây để nó nằm đè lên ảnh */}
                        {post.ngayDang && (
                          <span className={styles.time}>{timeAgo(post.ngayDang)}</span>
                        )}
                      </div>

                      {/* 2. KHUNG THÔNG TIN */}
                      <div className={styles.info}>
                        {/* Phần Tiêu đề và Giá (Luôn nằm trên) */}
                        <div>
                          <h3 className={styles.itemTitle}>{post.tieuDe}</h3>
                          <p className={styles.price}>{formatCurrency(post.gia)}</p>
                        </div>

                        {/* Phần Chân: Vị trí (Trên) và Người đăng (Dưới) */}
                        <div className={styles.bottomFooter}>
                          
                          {/* Dòng 1: Vị trí */}
                          <div className={styles.locationRow}>
                            <LocationIcon />
                            <span className={styles.locationText}>
                              {post.tinhThanh} - {post.quanHuyen}
                            </span>
                          </div>

                          {/* Dòng 2: Avatar & Tên */}
                          <div className={styles.userRow}>
                            <img
                              src={
                                post.avatar
                                  ? post.avatar.startsWith("http")
                                    ? post.avatar
                                    : `http://localhost:5133${post.avatar}`
                                  : defaultAvatar // 👈 ĐÃ SỬA: Dùng biến import thay vì link placeholder
                              }
                              alt="Người bán"
                              className={styles.userAvatar}
                            />
                            <span className={styles.userName}>{post.nguoiBan}</span>
                          </div>

                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>&lt;</button>
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={currentPage === number ? styles.active : ""}
                >
                  {number}
                </button>
              ))}
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>&gt;</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocTinDang;