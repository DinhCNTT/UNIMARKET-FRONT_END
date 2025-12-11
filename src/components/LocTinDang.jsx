import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import styles from "./LocTinDang.module.css";
import { CategoryContext } from "../context/CategoryContext";
import { SearchContext } from "../context/SearchContext";
import { LocationContext } from "../context/LocationContext";
import { Link } from "react-router-dom";
import TopNavbar from "./TopNavbar/TopNavbar";
import LocMoRong from "../components/LocMoRong";

// Helper tính thời gian (giữ nguyên)
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // Sort order state
  const [sortOrder, setSortOrder] = useState("newest");

  // Contexts
  const { searchTerm } = useContext(SearchContext);
  const { selectedCategory, setSelectedCategory, selectedSubCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { selectedLocation } = useContext(LocationContext);

  // --- 1. XỬ LÝ LOCATION TỪ CONTEXT (QUAN TRỌNG) ---
  // Tách chuỗi "Quận 1, Hồ Chí Minh" thành { city: "Hồ Chí Minh", dist: "Quận 1" }
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


  // --- 2. FETCH DATA ---
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

  // --- 3. LOGIC FILTER (ĐÃ SỬA) ---

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

  // FIX: Lọc theo Tỉnh Thành (Dùng contextCity đã tách)
  const filterByLocation = (posts) => {
    if (!contextCity) return posts; // Nếu là Toàn quốc hoặc rỗng thì trả về hết
    return posts.filter((post) => post.tinhThanh && post.tinhThanh.includes(contextCity));
  };

  // FIX: Lọc theo Quận Huyện (Ưu tiên bộ lọc LocMoRong > SearchBar)
  const filterByDistrict = (posts) => {
    // Nếu user chọn quận ở LocMoRong thì dùng nó.
    // Nếu không, kiểm tra xem SearchBar có chọn quận cụ thể không (contextDistrict)
    const targetDistrict = selectedDistrict || contextDistrict;
    
    if (!targetDistrict) return posts;
    return posts.filter((post) => post.quanHuyen && post.quanHuyen.includes(targetDistrict));
  };

  const filterByPrice = (posts) => {
    return posts.filter((post) => post.gia >= minPrice && post.gia <= maxPrice);
  };

  // --- 4. ÁP DỤNG FILTER ---
  const filteredByLocation = filterByLocation(posts);
  const filteredByCategory = filterByCategory(filteredByLocation);
  const filteredByDistrict = filterByDistrict(filteredByCategory); // Chạy sau filterByLocation
  const filteredByPrice = filterByPrice(filteredByDistrict);
  const filteredPostsBySearch = filterBySearchTerm(filteredByPrice);

  // --- 5. SORT & PAGINATION ---
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

  // Reset trang khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSubCategory, selectedLocation, selectedDistrict, minPrice, maxPrice, sortOrder]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const renderNoPostsMessage = () => {
    if (sortedPosts.length === 0) {
      let message = `Không có tin đăng`;
      // Hiển thị thông báo thông minh hơn
      if (contextCity) message += ` tại ${contextCity}`;
      if (selectedDistrict || contextDistrict) message += ` - ${selectedDistrict || contextDistrict}`;
      if (selectedSubCategory) message += ` trong danh mục "${selectedSubCategory}"`;
      else if (selectedCategory) message += ` trong danh mục "${selectedCategory}"`;
      if (searchTerm) message += ` với từ khóa "${searchTerm}"`;
      return message;
    }
    return null;
  };

  return (
    <div className={styles.container}>
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

      <h2 className={styles.title}>Kết Quả Lọc Tin Đăng</h2>
      
      <div className={styles.filterInfo}>
        {contextCity && (
          <p>Khu vực: <strong>{contextCity}</strong></p>
        )}
        {(selectedDistrict || contextDistrict) && (
          <p>Quận/Huyện: <strong>{selectedDistrict || contextDistrict}</strong></p>
        )}
        {(selectedSubCategory || selectedCategory) && (
          <p>Danh mục: <strong>{selectedSubCategory || selectedCategory}</strong></p>
        )}
        {searchTerm && (
          <p>Từ khóa: <strong>{searchTerm}</strong></p>
        )}
      </div>

      <div className={styles.list}>
        {renderNoPostsMessage() ? (
          <p className={styles.noResult}>{renderNoPostsMessage()}</p>
        ) : (
          currentPosts.map((post) => (
            <div key={post.maTinDang} className={styles.item}>
              <Link to={`/tin-dang/${post.maTinDang}`} className={styles.link}>
                <div className={styles.content}>
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
                  </div>
                  <div className={styles.info}>
                    <h3 className={styles.itemTitle}>{post.tieuDe}</h3>
                    <p className={styles.price}>{formatCurrency(post.gia)}</p>
                    <p className={styles.location}>
                      {post.tinhThanh} - {post.quanHuyen}
                    </p>
                    {post.ngayDang && <p className={styles.time}>{timeAgo(post.ngayDang)}</p>}
                    {post.moTa && (
                      <p className={styles.description}>
                        {post.moTa.length > 100 ? `${post.moTa.substring(0, 100)}...` : post.moTa}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            &lt;
          </button>
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={currentPage === number ? styles.active : ""}
            >
              {number}
            </button>
          ))}
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default LocTinDang;