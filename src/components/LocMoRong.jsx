import React, { useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import styles from "./LocMoRong.module.css";
import { CategoryContext } from "../context/CategoryContext";
import { LocationContext } from "../context/LocationContext";
import { SearchContext } from "../context/SearchContext";
import { FaMobileAlt, FaChevronDown, FaLaptop, FaHome } from "react-icons/fa";
import { FILTER_COMPONENTS } from "./CategoryFilters/FilterRegistry";

const DISTRICTS = {
  "Hồ Chí Minh": ["Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 9", "Quận 10", "Quận 11", "Quận 12", "Tân Bình", "Tân Phú", "Bình Thạnh", "Phú Nhuận", "Gò Vấp", "Bình Tân", "Thủ Đức", "Nhà Bè"],
  "Hà Nội": ["Ba Đình", "Hoàn Kiếm", "Đống Đa", "Hai Bà Trưng", "Thanh Xuân", "Cầu Giấy", "Hoàng Mai", "Long Biên", "Tây Hồ", "Nam Từ Liêm", "Bắc Từ Liêm", "Hà Đông", "Thanh Trì", "Gia Lâm", "Đông Anh"]
};

const LocMoRong = ({ onDistrictChange, onPriceChange, onParentCategoryChange, categories, onSortOrderChange, onAdvancedFilterChange }) => {
  const { selectedLocation } = useContext(LocationContext);
  const { selectedCategory, setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { searchTerm } = useContext(SearchContext);

  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [showDistricts, setShowDistricts] = useState(false);
  const [showParentCategories, setShowParentCategories] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000000);
  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(100000000);

  const [detectedCategory, setDetectedCategory] = useState(null);
  const [activeMode, setActiveMode] = useState(null); 
  const [advancedFilters, setAdvancedFilters] = useState({});

  // 1. State lưu lịch sử chọn để hiển thị Breadcrumb theo thứ tự
  const [filterHistory, setFilterHistory] = useState([]);

  useEffect(() => {
    onSortOrderChange(sortOrder);
  }, [sortOrder, onSortOrderChange]);

  // Detect Category
  useEffect(() => {
    const detectIntent = async () => {
      setDetectedCategory(null);
      
      if (!searchTerm || searchTerm.trim().length < 2) return;
      try {
        const res = await axios.get(`http://localhost:5133/api/tindang/detect-category?query=${encodeURIComponent(searchTerm.trim())}`);
        if (res.data && res.data.name) {
            const catName = res.data.name.toLowerCase();
            if (catName.includes("điện thoại")) {
                setDetectedCategory({ name: "Điện thoại", original: res.data.name });
            } 
        }
      } catch (error) { console.error("Detect error:", error); }
    };
    const timer = setTimeout(() => detectIntent(), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- QUẢN LÝ LỊCH SỬ CHỌN (Breadcrumb Logic) ---
  const updateHistory = (type, action) => {
      setFilterHistory(prev => {
          if (action === 'add') {
              if (prev.includes(type)) return prev; // Đã có thì thôi
              return [...prev, type]; // Thêm vào cuối
          } else {
              return prev.filter(item => item !== type); // Xóa đi
          }
      });
  };

  // Theo dõi Location thay đổi
  useEffect(() => {
      if (selectedLocation && selectedLocation !== "Toàn quốc") {
          updateHistory('LOCATION', 'add');
      } else {
          updateHistory('LOCATION', 'remove');
      }
  }, [selectedLocation]);

  // Theo dõi Category thay đổi (activeMode)
  useEffect(() => {
      if (activeMode) {
          updateHistory('CATEGORY', 'add');
      } else {
          updateHistory('CATEGORY', 'remove');
      }
  }, [activeMode]);


  // Handlers
  const handleActivateMode = (modeName) => {
      setActiveMode(modeName);
      setSelectedSubCategory(modeName);
      // updateHistory được gọi trong useEffect
  };

  const handleExitMode = () => {
      setActiveMode(null);
      setAdvancedFilters({});
      if (onAdvancedFilterChange) onAdvancedFilterChange({});
      setSelectedSubCategory(""); 
      setSelectedCategory(""); 
      if (onParentCategoryChange) onParentCategoryChange(""); 
  };

  const handleFilterChange = (key, value) => {
      setAdvancedFilters(prev => {
          const newFilters = { ...prev, [key]: value };
          if (value === null || value === undefined) delete newFilters[key]; 
          return newFilters;
      });
  };

  useEffect(() => {
      if (onAdvancedFilterChange) onAdvancedFilterChange(advancedFilters);
  }, [advancedFilters]);

  // Helpers
  const availableDistricts = useMemo(() => {
    if (!selectedLocation) return [];
    let cityKey = selectedLocation;
    if (selectedLocation.includes(",")) cityKey = selectedLocation.split(",")[1].trim(); 
    return DISTRICTS[cityKey] || [];
  }, [selectedLocation]);

  // --- TÍNH TOÁN BREADCRUMB & SLOGAN LINH HOẠT ---
  const headerInfo = useMemo(() => {
    // 1. Chuẩn bị dữ liệu Location
    let locationStr = "";
    let city = "";
    let district = "";
    
    if (selectedLocation && selectedLocation !== "Toàn quốc") {
       if (selectedLocation.includes(",")) {
         const parts = selectedLocation.split(",");
         district = parts[0].trim();
         city = parts[1].trim();
         locationStr = `${city} / ${district}`;
       } else {
         city = selectedLocation;
         locationStr = city;
       }
       if (selectedDistrict) {
           district = selectedDistrict;
           locationStr = `${city} / ${district}`;
       }
    }

    // 2. Chuẩn bị dữ liệu Category
    const categoryStr = activeMode || selectedCategory || "";

    // 3. Xây dựng Breadcrumb dựa trên lịch sử
    let parts = ["Unimarket"];
    
    // Duyệt qua lịch sử để xếp thứ tự
    filterHistory.forEach(type => {
        if (type === 'LOCATION' && locationStr) parts.push(locationStr);
        if (type === 'CATEGORY' && categoryStr) parts.push(categoryStr);
    });

    // Nếu không có trong lịch sử (VD: load trang lần đầu có sẵn location), fallback
    if (locationStr && !parts.join('/').includes(locationStr.replace(' / ', '/'))) {
        // Kiểm tra xem đã add chưa để tránh duplicate
        const isLocAdded = parts.some(p => p.includes(city));
        if (!isLocAdded) parts.push(locationStr);
    }
    if (categoryStr && !parts.includes(categoryStr)) {
        parts.push(categoryStr);
    }

    const breadcrumb = parts.join(" / ");

    // 4. Xây dựng Slogan
    let slogan = `Mua Bán Rao Vặt Nhanh Chóng, Uy Tín Tại Unimarket`;
    if (district) slogan += ` ${district}`;
    if (city) slogan += ` ${city}`;
    if (activeMode) slogan += ` - ${activeMode}`;

    return { breadcrumb, slogan };
  }, [selectedLocation, selectedDistrict, activeMode, selectedCategory, filterHistory]);

  const handleDistrictSelect = (d) => { setSelectedDistrict(d); onDistrictChange(d); setShowDistricts(false); };
  const handleClearDistrict = () => { setSelectedDistrict(""); onDistrictChange(""); };
  const handleApplyPrice = () => { onPriceChange(minPrice, maxPrice); setAppliedMinPrice(minPrice); setAppliedMaxPrice(maxPrice); setShowPriceFilter(false); };
  const handleClearPrice = () => { setMinPrice(0); setMaxPrice(100000000); setAppliedMinPrice(0); setAppliedMaxPrice(100000000); onPriceChange(0, 100000000); };
  const handleClearCategory = () => { setSelectedCategory(""); setSelectedSubCategory(""); onParentCategoryChange(""); };

  const ActiveFilterComponent = activeMode ? FILTER_COMPONENTS[activeMode] : null;

  // --- RENDER ---
  // Tách phần Header ra để tái sử dụng cho cả 2 trường hợp return
  const renderHeader = () => (
      <div className={styles.headerText}>
          <div className={styles.breadcrumb}>{headerInfo.breadcrumb}</div>
          <h1 className={styles.slogan}>{headerInfo.slogan}</h1>
      </div>
  );

  if (ActiveFilterComponent) {
      return (
          <div className={styles.filterContainer}>
              {renderHeader()}
              <ActiveFilterComponent 
                  activeFilters={advancedFilters}
                  onFilterChange={handleFilterChange}
                  onExit={handleExitMode}
              />
          </div>
      );
  }

  return (
    <div className={styles.filterContainer}>
      {renderHeader()}

      <div className={styles.controlsRow}>
        <div className={styles.filterItem}>
          <button onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")} className={styles.filterBtn}>
            {sortOrder === "newest" ? "Mới nhất" : "Cũ nhất"}
          </button>
        </div>

        <div className={styles.filterItem}>
          <button onClick={() => setShowParentCategories(!showParentCategories)} className={styles.filterBtn}>
            {selectedCategory || "Danh mục"} <FaChevronDown size={10} style={{marginLeft: 4}}/>
          </button>
          {showParentCategories && (
            <div className={styles.listDropdown}>
              {categories.map((c) => (
                <div key={c.id} className={styles.option} onClick={() => {
                  onParentCategoryChange(c.tenDanhMucCha);
                  setSelectedCategory(c.tenDanhMucCha);
                  setShowParentCategories(false);
                }}>
                  {c.tenDanhMucCha}
                </div>
              ))}
            </div>
          )}
        </div>

        {availableDistricts.length > 0 && (
          <div className={styles.filterItem}>
            <button onClick={() => setShowDistricts(!showDistricts)} className={styles.filterBtn}>
              {selectedDistrict || "Khu vực"} <FaChevronDown size={10} style={{marginLeft: 4}}/>
            </button>
            {showDistricts && (
              <div className={styles.listDropdown}>
                {availableDistricts.map((q) => (
                  <div key={q} className={styles.option} onClick={() => handleDistrictSelect(q)}>{q}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.filterItem}>
          <button onClick={() => setShowPriceFilter(!showPriceFilter)} className={styles.filterBtn}>
              Giá <FaChevronDown size={10} style={{marginLeft: 4}}/>
          </button>
          {showPriceFilter && (
            <div className={styles.priceDropdown}>
              <div className={styles.priceInputs}>
                <div className={styles.inputGroup}>
                   <input type="text" placeholder="Thấp nhất" value={minPrice.toLocaleString("vi-VN")} onChange={(e) => setMinPrice(Number(e.target.value.replace(/\D/g, "")))} />
                </div>
                <span>-</span>
                <div className={styles.inputGroup}>
                  <input type="text" placeholder="Cao nhất" value={maxPrice.toLocaleString("vi-VN")} onChange={(e) => setMaxPrice(Number(e.target.value.replace(/\D/g, "")))} />
                </div>
              </div>
              <div className={styles.actions}>
                <button onClick={handleClearPrice} className={styles.clearBtn}>Xóa</button>
                <button onClick={handleApplyPrice} className={styles.applyBtn}>Áp dụng</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {detectedCategory && (
        <div className={styles.suggestionBlock}>
            <button className={styles.categoryTileBtn} onClick={() => handleActivateMode(detectedCategory.name)}>
                <FaMobileAlt size={28} /> 
                <span>{detectedCategory.name}</span>
            </button>
        </div>
      )}

      {(selectedDistrict || (appliedMinPrice > 0 || appliedMaxPrice < 100000000) || selectedCategory) && (
        <div className={styles.activeFilters}>
           {selectedCategory && (
            <span className={styles.tag}>
              {selectedCategory} <button className={styles.closeBtn} onClick={handleClearCategory}>×</button>
            </span>
          )}
          {selectedDistrict && (
            <span className={styles.tag}>
              {selectedDistrict} <button className={styles.closeBtn} onClick={handleClearDistrict}>×</button>
            </span>
          )}
          {(appliedMinPrice > 0 || appliedMaxPrice < 100000000) && (
            <span className={styles.tag}>
              {appliedMinPrice.toLocaleString("vi-VN")} - {appliedMaxPrice.toLocaleString("vi-VN")}
              <button className={styles.closeBtn} onClick={handleClearPrice}>×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LocMoRong;