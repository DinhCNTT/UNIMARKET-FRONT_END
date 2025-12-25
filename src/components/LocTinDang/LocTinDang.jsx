import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./LocTinDang.module.css";

// Icons xịn xò từ react-icons
import { FiGrid, FiList, FiFilter, FiTrash2, FiSearch, FiMapPin, FiX } from "react-icons/fi";
import { BiCategory, BiSort } from "react-icons/bi";
import { MdOutlinePriceChange } from "react-icons/md";

// Contexts
import { CategoryContext } from "../../context/CategoryContext";
import { SearchContext } from "../../context/SearchContext";
import { LocationContext } from "../../context/LocationContext";
import { AuthContext } from "../../context/AuthContext";

// Components
import TopNavbar from "../TopNavbar/TopNavbar";
import LocMoRong from "../LocMoRong";
import ProductItem from "../ProductItem/ProductItem";
import Pagination from "../Pagination/Pagination";

const LocTinDang = () => {
  // --- STATE DỮ LIỆU ---
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // --- STATE BỘ LỌC ---
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState(""); 
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [sortOrder, setSortOrder] = useState("newest");

  // --- STATE UI ---
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- CONTEXT ---
  const [savedIds, setSavedIds] = useState([]);
  const { user, token } = useContext(AuthContext);
  const isLoggedIn = !!(user && (token || user.token));
  
  // Lấy cả hàm SET để có thể reset được
  const { searchTerm, setSearchTerm } = useContext(SearchContext); 
  const { selectedCategory, setSelectedCategory, selectedSubCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { selectedLocation, setSelectedLocation } = useContext(LocationContext);

  // --- LOGIC TÁCH ĐỊA ĐIỂM ---
  const { contextCity, contextDistrict } = useMemo(() => {
    if (!selectedLocation || selectedLocation === "Toàn quốc") return { contextCity: "", contextDistrict: "" };
    const parts = selectedLocation.split(",");
    return parts.length > 1 
      ? { contextDistrict: parts[0].trim(), contextCity: parts[1].trim() }
      : { contextCity: selectedLocation, contextDistrict: "" };
  }, [selectedLocation]);

  // --- FETCH DATA ---
  useEffect(() => {
    axios.get("http://localhost:5133/api/category/get-categories-with-icon")
      .then(res => setCategories(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchSaved = async () => {
      const authToken = token || user?.token;
      if (isLoggedIn && authToken) {
        try {
          const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          setSavedIds(res.data.map((p) => p.maTinDang));
        } catch (error) {}
      }
    };
    fetchSaved();
  }, [isLoggedIn, token, user]);

  // --- GỌI API LỌC ---
  const timeoutRef = useRef(null);

  useEffect(() => {
    const fetchFilteredPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const mongoFilters = { ...advancedFilters };
        let finalMinPrice = minPrice;
        let finalMaxPrice = maxPrice;

        if (mongoFilters.minPrice !== undefined) {
             if (finalMinPrice === null) finalMinPrice = mongoFilters.minPrice; 
             delete mongoFilters.minPrice;
        }
        if (mongoFilters.maxPrice !== undefined) {
             if (finalMaxPrice === null) finalMaxPrice = mongoFilters.maxPrice;
             delete mongoFilters.maxPrice;
        }

        const params = {
            Page: currentPage,
            Limit: 10,
            SortOrder: sortOrder,
            SearchTerm: searchTerm, 
            CategoryGroup: selectedCategory,
            SubCategory: selectedSubCategory,
            MinPrice: finalMinPrice,
            MaxPrice: finalMaxPrice,
            ProvinceName: contextCity, 
            DistrictName: selectedDistrictFilter || contextDistrict,
            AdvancedFilters: JSON.stringify(mongoFilters)
        };

        const res = await axios.get("http://localhost:5133/api/tindang/get-posts", { params });
        const data = res.data;
        
        // Handle response structure
        const listData = data.Data || data.data || (Array.isArray(data) ? data : []);
        const pagination = data.Pagination || data.pagination || {};

        setPosts(listData);
        setTotalPages(pagination.totalPages || pagination.TotalPages || 1);
        setTotalItems(pagination.totalItems || pagination.TotalItems || 0);
        
      } catch (err) {
        console.error("Lỗi:", err);
        setError("Không thể tải dữ liệu.");
      } finally {
        setIsLoading(false);
      }
    };

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fetchFilteredPosts(), 500);

    return () => clearTimeout(timeoutRef.current);

  }, [currentPage, searchTerm, selectedCategory, selectedSubCategory, selectedDistrictFilter, minPrice, maxPrice, advancedFilters, sortOrder, contextCity, contextDistrict]);

  // Reset trang 1 khi filter đổi
  useEffect(() => setCurrentPage(1), [searchTerm, selectedCategory, selectedSubCategory, selectedDistrictFilter, minPrice, maxPrice, advancedFilters, sortOrder, contextCity]);

  // --- ACTION HANDLERS ---
  
  // 🔥 FIX QUAN TRỌNG: Hàm xóa sạch bộ lọc
  const handleClearAllFilters = () => {
    setSearchTerm("");
    setSelectedLocation(""); // Reset Location Context
    setSelectedCategory(""); // Reset Category Context
    setSelectedSubCategory("");
    setSelectedDistrictFilter("");
    setMinPrice(null);
    setMaxPrice(null);
    setAdvancedFilters({});
    setSortOrder("newest");
    toast.success("Đã xóa toàn bộ bộ lọc!");
  };

  const handleToggleSave = async (postId, isSaved) => {
    const authToken = token || user?.token;
    if (!isLoggedIn) return toast.error("Vui lòng đăng nhập!");
    try {
      if (isSaved) {
        await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${postId}`, { headers: { Authorization: `Bearer ${authToken}` } });
        setSavedIds(prev => prev.filter(id => id !== postId));
        toast.success("Đã bỏ lưu");
      } else {
        await axios.post(`http://localhost:5133/api/yeuthich/luu/${postId}`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
        setSavedIds(prev => [...prev, postId]);
        toast.success("Đã lưu tin");
      }
    } catch (err) { toast.error("Lỗi thao tác"); }
  };

  // --- RENDER HELPERS ---
  const hasActiveFilters = searchTerm || selectedCategory || contextCity || minPrice || maxPrice;

  return (
    <div className={styles.pageWrapper}>
      <TopNavbar />
      
      <div className={styles.contentContainer}>
        {/* Component Lọc Mở Rộng */}
        <LocMoRong
          onDistrictChange={setSelectedDistrictFilter}
          onPriceChange={(min, max) => { setMinPrice(min); setMaxPrice(max); }}
          onParentCategoryChange={(cat) => { setSelectedCategory(cat); setSelectedSubCategory(""); }}
          categories={categories}
          onSortOrderChange={setSortOrder}
          onAdvancedFilterChange={setAdvancedFilters} 
        />

        <div className={styles.mainContent}>
          {/* Header & View Switcher */}
          <div className={styles.headerRow}>
              <div className={styles.headerTitle}>
                <h2>{selectedCategory || "Tin đăng mới nhất"}</h2>
                {totalItems > 0 && <span className={styles.countBadge}>{totalItems} tin</span>}
              </div>
              
              <div className={styles.viewSwitcher}>
                <button 
                  className={`${styles.switchBtn} ${viewMode === "list" ? styles.active : ""}`}
                  onClick={() => setViewMode("list")}
                  title="Danh sách"
                >
                  <FiList />
                </button>
                <button 
                  className={`${styles.switchBtn} ${viewMode === "grid" ? styles.active : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Lưới"
                >
                  <FiGrid />
                </button>
              </div>
          </div>

          {/* 🔥 ACTIVE FILTERS (TAGS) - Giao diện hiện đại */}
          {hasActiveFilters && (
            <div className={styles.activeFiltersRow}>
              <span className={styles.filterLabel}><FiFilter /> Đang lọc:</span>
              
              {contextCity && (
                <div className={styles.filterTag}>
                  <FiMapPin /> {contextCity} {contextDistrict ? `- ${contextDistrict}` : ""}
                  <button onClick={() => setSelectedLocation("")}><FiX /></button>
                </div>
              )}
              
              {selectedCategory && (
                <div className={styles.filterTag}>
                  <BiCategory /> {selectedCategory} {selectedSubCategory ? `/ ${selectedSubCategory}` : ""}
                  <button onClick={() => setSelectedCategory("")}><FiX /></button>
                </div>
              )}

              {searchTerm && (
                <div className={styles.filterTag}>
                  <FiSearch /> "{searchTerm}"
                  <button onClick={() => setSearchTerm("")}><FiX /></button>
                </div>
              )}

              {(minPrice !== null || maxPrice !== null) && (
                <div className={styles.filterTag}>
                  <MdOutlinePriceChange /> Giá tùy chỉnh
                  <button onClick={() => {setMinPrice(null); setMaxPrice(null)}}><FiX /></button>
                </div>
              )}

              <button className={styles.clearAllBtn} onClick={handleClearAllFilters}>
                <FiTrash2 /> Xóa tất cả
              </button>
            </div>
          )}
          
          {/* Loading & Error & List */}
          {isLoading ? (
             <div className={styles.stateMessage}>
                <div className="spinner"></div> 
                <p>Đang tải dữ liệu...</p>
             </div>
          ) : error ? (
             <div className={styles.stateMessage} style={{color: '#dc3545'}}>
                <p>{error}</p>
             </div>
          ) : posts.length === 0 ? (
             // 🔥 EMPTY STATE ĐẸP
             <div className={styles.emptyState}>
                <img src="https://cdni.iconscout.com/illustration/premium/thumb/search-result-not-found-2130361-1800925.png" alt="No Result" />
                <h3>Không tìm thấy kết quả nào!</h3>
                <p>Hãy thử xóa bộ lọc hoặc tìm kiếm với từ khóa khác.</p>
                <button onClick={handleClearAllFilters} className={styles.primaryBtn}>
                  Xóa bộ lọc & Thử lại
                </button>
             </div>
          ) : (
            // LIST POSTS
            <div className={`${styles.listGrid} ${viewMode === "grid" ? styles.gridView : styles.listView}`}>
              {posts.map((post) => (
                <ProductItem
                    key={post.maTinDang}
                    post={post}
                    viewMode={viewMode}
                    isLoggedIn={isLoggedIn}
                    isSaved={savedIds.includes(post.maTinDang)}
                    onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocTinDang;