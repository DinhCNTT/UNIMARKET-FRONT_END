import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import styles from "./LocTinDang.module.css";
import { CategoryContext } from "../context/CategoryContext";
import { SearchContext } from "../context/SearchContext";
import { LocationContext } from "../context/LocationContext";
import TopNavbar from "./TopNavbar/TopNavbar";
import LocMoRong from "./LocMoRong";
import defaultAvatar from "../assets/default-avatar.png";

// --- ICONS ---
const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14px" height="14px" className={styles.locationIcon}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

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

// --- HELPERS ---
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

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

// --- MAIN COMPONENT ---
const LocTinDang = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  // minPrice/maxPrice này dùng cho thanh lọc cơ bản (nếu có), nhưng chủ yếu giờ ta dùng từ advancedFilters
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSubCategory, selectedLocation, selectedDistrict, minPrice, maxPrice, sortOrder, advancedFilters]);


  // --- LOGIC LỌC DỮ LIỆU (TỐI ƯU HÓA) ---
  const filteredAndSortedPosts = useMemo(() => {
    let result = posts;

    // 1. Lọc Location
    if (contextCity) {
      result = result.filter(p => p.tinhThanh === contextCity);
    }

    // 2. Lọc Category
    if (selectedSubCategory) {
       result = result.filter(p => p.danhMuc && p.danhMuc.toLowerCase().includes(selectedSubCategory.toLowerCase()));
    } else if (selectedCategory) {
       result = result.filter(p => p.danhMucCha && p.danhMucCha.toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    // 3. Lọc District
    const targetDistrict = selectedDistrict || contextDistrict;
    if (targetDistrict) {
      result = result.filter(p => p.quanHuyen && p.quanHuyen.trim() === targetDistrict.trim());
    }

    // 4. Lọc GIÁ (Quan trọng: Ưu tiên giá từ Bộ lọc mở rộng)
    // Nếu trong advancedFilters có giá thì lấy, nếu không thì lấy giá mặc định
    const effectiveMin = (advancedFilters.minPrice !== undefined && advancedFilters.minPrice !== null) ? advancedFilters.minPrice : minPrice;
    const effectiveMax = (advancedFilters.maxPrice !== undefined && advancedFilters.maxPrice !== null) ? advancedFilters.maxPrice : maxPrice;

    result = result.filter(p => {
        const price = Number(p.gia);
        if (effectiveMin > 0 && price < effectiveMin) return false;
        // Nếu maxPrice > 0 thì mới check, vì 0 hoặc null thường nghĩa là không giới hạn
        if (effectiveMax > 0 && price > effectiveMax) return false;
        return true;
    });

    // 5. Lọc Nâng cao (Hãng, Màu, Dung lượng, Tình trạng)
    if (Object.keys(advancedFilters).length > 0) {
        
        result = result.filter(post => {
            const details = post.ChiTietObj || {};
            let isMatch = true;

            // Helper Check Field
            const checkField = (filterKey, dbKeys) => {
                if (!advancedFilters[filterKey]) return true; 
                
                const valFilter = advancedFilters[filterKey].toLowerCase().trim();
                let valDB = "";

                for (const k of dbKeys) {
                    if (details[k]) { valDB = details[k].toString().toLowerCase().trim(); break; }
                }
                
                // Fallback cho Hãng
                if (filterKey === 'Hang' && valDB === "") {
                    const title = (post.tieuDe || "").toLowerCase();
                    if (valFilter === 'apple' && title.includes('iphone')) return true;
                    if (title.includes(valFilter)) return true;
                }
                
                return valDB.includes(valFilter);
            };

            if (!checkField('Hang', ['Hang', 'hang'])) isMatch = false;
            if (isMatch && !checkField('DungLuong', ['DungLuong', 'dungLuong', 'dungluong'])) isMatch = false;
            if (isMatch && !checkField('MauSac', ['MauSac', 'mauSac', 'mausac'])) isMatch = false;

            // [FIX] Kiểm tra Tình trạng (Fix lỗi không lọc được)
            if (isMatch && advancedFilters.TinhTrang) {
                 const filterVal = advancedFilters.TinhTrang.toLowerCase().trim();
                 
                 // Dữ liệu từ Mongo (thường là "Còn bảo hành", "Hết bảo hành")
                 const dbBaoHanh = (details.BaoHanh || details.baoHanh || "").toLowerCase().trim();
                 // Dữ liệu từ SQL (thường là "Mới", "Đã sử dụng")
                 const sqlTinhTrang = (post.TinhTrang || "").toLowerCase().trim();
                 
                 let conditionMatch = false;

                 // Case 1: Lọc "Còn bảo hành"
                 if (filterVal.includes("bảo hành")) {
                     if (dbBaoHanh.includes("còn") || dbBaoHanh.includes("yes") || dbBaoHanh.includes("có")) {
                         conditionMatch = true;
                     }
                     if (dbBaoHanh.includes(filterVal)) conditionMatch = true;
                 }
                 // Case 2: Lọc "Mới" / "Cũ" / "99%"
                 else {
                     // Kiểm tra cột TinhTrang trước
                     if (sqlTinhTrang.includes(filterVal)) conditionMatch = true;
                     if (filterVal.includes(sqlTinhTrang)) conditionMatch = true; // ngược lại VD filter "mới cứng" khớp db "mới"
                 }

                 // Case 3: Fallback check chéo
                 if (!conditionMatch) {
                     if (dbBaoHanh.includes(filterVal) || sqlTinhTrang.includes(filterVal)) conditionMatch = true;
                 }

                 if (!conditionMatch) isMatch = false;
            }

            return isMatch;
        });
    }

    // 6. Search Text
    if (searchTerm) {
      result = result.filter(p => p.tieuDe && p.tieuDe.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // 7. Sort
    return result.sort((a, b) => {
       const dateA = new Date(a.ngayDang);
       const dateB = new Date(b.ngayDang);
       return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  }, [posts, contextCity, selectedCategory, selectedSubCategory, selectedDistrict, contextDistrict, minPrice, maxPrice, advancedFilters, searchTerm, sortOrder]);


  // --- PAGINATION ---
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredAndSortedPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderNoPostsMessage = () => {
if (filteredAndSortedPosts.length > 0) return null;

let message = `Không có tin đăng`;
if (contextCity) message += ` tại ${contextCity}`;
if (selectedDistrict || contextDistrict) message += ` - ${selectedDistrict || contextDistrict}`;
if (selectedSubCategory) message += ` trong danh mục "${selectedSubCategory}"`;
else if (selectedCategory) message += ` trong danh mục "${selectedCategory}"`;
if (searchTerm) message += ` với từ khóa "${searchTerm}"`;
if (advancedFilters.Hang) message += ` (Hãng: ${advancedFilters.Hang})`;

// [FIX] Hiển thị giá đúng (check null/undefined thay vì truthy check để ko mất số 0)
const hasMin = advancedFilters.minPrice !== undefined && advancedFilters.minPrice !== null;
const hasMax = advancedFilters.maxPrice !== undefined && advancedFilters.maxPrice !== null;

if (hasMin || hasMax) {
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
            {/* Hiển thị khoảng giá nếu có */}
            {(advancedFilters.minPrice || advancedFilters.maxPrice) && <p>Giá: <strong>{formatCurrency(advancedFilters.minPrice || 0)} - {advancedFilters.maxPrice ? formatCurrency(advancedFilters.maxPrice) : '∞'}</strong></p>}
          </div>

          {isLoading && <div className={styles.loading}>Đang tải tin đăng...</div>}
          {error && <div className={styles.error} style={{color: 'red', textAlign: 'center', margin: '20px 0'}}>{error}</div>}

          {!isLoading && !error && (
              <div className={`${styles.list} ${viewMode === "grid" ? styles.gridView : styles.listView}`}>
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
                                loading="lazy" 
                              />
                            ) : (
                              <div className={styles.noImage}>Không có ảnh</div>
                            )}
                            {post.ngayDang && <span className={styles.time}>{timeAgo(post.ngayDang)}</span>}
                          </div>

                          <div className={styles.info}>
                            <div>
                              <h3 className={styles.itemTitle}>{post.tieuDe}</h3>
                              <p className={styles.price}>{formatCurrency(post.gia)}</p>
                            </div>
                            <div className={styles.bottomFooter}>
                              <div className={styles.locationRow}>
                                <LocationIcon />
                                <span className={styles.locationText}>{post.tinhThanh} - {post.quanHuyen}</span>
                              </div>
                              <div className={styles.userRow}>
                                <img
                                  src={post.avatar ? (post.avatar.startsWith("http") ? post.avatar : `http://localhost:5133${post.avatar}`) : defaultAvatar}
                                  alt="Seller"
                                  className={styles.userAvatar}
                                  loading="lazy"
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
          )}

          {!isLoading && !error && totalPages > 1 && (
            <div className={styles.pagination}>
               <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>&lt;</button>
               {pageNumbers.map(n => (
                   <button key={n} onClick={() => setCurrentPage(n)} className={currentPage === n ? styles.active : ""}>{n}</button>
               ))}
               <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>&gt;</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocTinDang;