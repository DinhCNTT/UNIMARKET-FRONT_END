import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import styles from "./LocTinDang.module.css";

// Contexts
import { CategoryContext } from "../../context/CategoryContext";
import { SearchContext } from "../../context/SearchContext";
import { LocationContext } from "../../context/LocationContext";

// Components
import TopNavbar from "../TopNavbar/TopNavbar"; 
import LocMoRong from "../LocMoRong"; 
import ProductItem from "../ProductItem/ProductItem";
import Pagination from "../Pagination/Pagination";

// Hook
import { usePostFilter } from "../../hooks/usePostFilter";

// Icons
const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

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

const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const LocTinDang = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState("list");
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const postsPerPage = 10;

  const { searchTerm } = useContext(SearchContext);
  const { selectedCategory, setSelectedCategory, selectedSubCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { selectedLocation } = useContext(LocationContext);

  const { contextCity, contextDistrict } = useMemo(() => {
    if (!selectedLocation || selectedLocation === "Toàn quốc") {
      return { contextCity: "", contextDistrict: "" };
    }
    const parts = selectedLocation.split(",");
    if (parts.length > 1) {
       return { contextDistrict: parts[0].trim(), contextCity: parts[1].trim() };
    }
    return { contextCity: selectedLocation, contextDistrict: "" };
  }, [selectedLocation]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [postsRes, catsRes] = await Promise.all([
           axios.get("http://localhost:5133/api/tindang/get-posts"),
           axios.get("http://localhost:5133/api/category/get-categories-with-icon")
        ]);
        const parsedPosts = postsRes.data.map(post => ({
            ...post,
            ChiTietObj: post.chiTietObj || post.ChiTietObj || {} 
        }));
        setPosts(parsedPosts);
        setCategories(catsRes.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        setError("Không thể tải danh sách tin đăng. Vui lòng kiểm tra kết nối server.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAndSortedPosts = usePostFilter({
    posts, contextCity, contextDistrict, selectedCategory, selectedSubCategory,
    selectedDistrict, minPrice, maxPrice, advancedFilters, searchTerm, sortOrder
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredAndSortedPosts]);

  const indexOfLastPost = currentPage * postsPerPage;
  const currentPosts = filteredAndSortedPosts.slice(indexOfLastPost - postsPerPage, indexOfLastPost);
  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage);

  const renderNoPostsMessage = () => {
    if (filteredAndSortedPosts.length > 0) return null;
    let message = `Không có tin đăng`;
    if (contextCity) message += ` tại ${contextCity}`;
    if (selectedDistrict || contextDistrict) message += ` - ${selectedDistrict || contextDistrict}`;
    if (selectedSubCategory) message += ` trong danh mục "${selectedSubCategory}"`;
    else if (selectedCategory) message += ` trong danh mục "${selectedCategory}"`;
    if (searchTerm) message += ` với từ khóa "${searchTerm}"`;
    
    if (advancedFilters.minPrice || advancedFilters.maxPrice) {
       const minStr = formatCurrency(advancedFilters.minPrice || 0);
       const maxStr = advancedFilters.maxPrice ? formatCurrency(advancedFilters.maxPrice) : '∞';
       message += ` (Giá: ${minStr} - ${maxStr})`;
    }
    return message;
  };

  return (
    <div className={styles.pageWrapper}>
      <TopNavbar />
      
      <div className={styles.contentContainer}>
        <LocMoRong
          onDistrictChange={setSelectedDistrict}
          onPriceChange={(min, max) => { setMinPrice(min); setMaxPrice(max); }}
          onParentCategoryChange={(cat) => { setSelectedCategory(cat); setSelectedSubCategory(""); }}
          categories={categories}
          onSortOrderChange={setSortOrder}
          onAdvancedFilterChange={setAdvancedFilters} 
        />

        <div className={styles.listBlock}>
          <div className={styles.headerRow}>
              <h2 className={styles.title}>Tin đăng dành cho bạn</h2>
              <button className={styles.viewToggleBtn} onClick={() => setViewMode(prev => prev === "list" ? "grid" : "list")}>
                {viewMode === "list" ? <GridIcon /> : <ListIcon />} 
                <span>{viewMode === "list" ? "Dạng lưới" : "Dạng danh sách"}</span>
              </button>
          </div>
          
          <div className={styles.filterInfo}>
            {contextCity && <p>Khu vực: <strong>{contextCity}</strong></p>}
            {(selectedDistrict || contextDistrict) && <p>Quận/Huyện: <strong>{selectedDistrict || contextDistrict}</strong></p>}
            {(selectedSubCategory || selectedCategory) && <p>Danh mục: <strong>{selectedSubCategory || selectedCategory}</strong></p>}
            {searchTerm && <p>Từ khóa: <strong>{searchTerm}</strong></p>}
            {advancedFilters.Hang && <p>Hãng: <strong>{advancedFilters.Hang}</strong></p>}
          </div>

          {isLoading && <div className={styles.loading}>Đang tải tin đăng...</div>}
          {error && <div className={styles.error}>{error}</div>}

          {!isLoading && !error && (
              <div className={`${styles.list} ${viewMode === "grid" ? styles.gridView : styles.listView}`}>
                {renderNoPostsMessage() ? (
                  <p className={styles.noResult}>{renderNoPostsMessage()}</p>
                ) : (
                  currentPosts.map((post) => (
                    <ProductItem 
                        key={post.maTinDang} 
                        post={post} 
                        viewMode={viewMode} 
                    />
                  ))
                )}
              </div>
          )}

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default LocTinDang;