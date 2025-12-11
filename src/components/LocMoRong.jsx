import React, { useContext, useState, useEffect, useMemo } from "react";
import styles from "./LocMoRong.module.css";
import { CategoryContext } from "../context/CategoryContext";
import { LocationContext } from "../context/LocationContext";

// Dữ liệu Fix cứng (Mapping Quận Huyện)
const DISTRICTS = {
  "Hồ Chí Minh": [
    "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 9", "Quận 10",
    "Quận 11", "Quận 12", "Tân Bình", "Tân Phú", "Bình Thạnh", "Phú Nhuận", "Gò Vấp", "Bình Tân", "Thủ Đức", "Nhà Bè"
  ],
  "Hà Nội": [
    "Ba Đình", "Hoàn Kiếm", "Đống Đa", "Hai Bà Trưng", "Thanh Xuân", "Cầu Giấy", "Hoàng Mai", "Long Biên",
    "Tây Hồ", "Nam Từ Liêm", "Bắc Từ Liêm", "Hà Đông", "Thanh Trì", "Gia Lâm", "Đông Anh"
  ]
};

const LocMoRong = ({
  onDistrictChange,
  onPriceChange,
  onParentCategoryChange,
  categories,
  onSortOrderChange,
}) => {
  // --- Context ---
  // Lấy location từ context chung (đã được SearchBar cập nhật)
  const { selectedLocation } = useContext(LocationContext);
  const { selectedCategory, setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);

  // --- Local State ---
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [showDistricts, setShowDistricts] = useState(false);
  const [showParentCategories, setShowParentCategories] = useState(false);
  
  // State Sắp xếp & Giá
  const [sortOrder, setSortOrder] = useState("newest");
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [minPrice, setMinPrice] = useState(5000000);
  const [maxPrice, setMaxPrice] = useState(15000000);
  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(100000000);

  // --- Effects ---
  useEffect(() => {
    onSortOrderChange(sortOrder);
  }, [sortOrder, onSortOrderChange]);

  // --- FIX LOGIC TÌM QUẬN (QUAN TRỌNG) ---
  // Logic: Nếu location là "Quận 1, Hồ Chí Minh" -> Cắt chuỗi lấy "Hồ Chí Minh"
  const availableDistricts = useMemo(() => {
    if (!selectedLocation) return [];
    
    let cityKey = selectedLocation;
    
    // Nếu chuỗi có chứa dấu phẩy (VD: "Quận 1, Hồ Chí Minh")
    if (selectedLocation.includes(",")) {
      const parts = selectedLocation.split(",");
      // Lấy phần tử cuối cùng và xóa khoảng trắng (thường là Tên Tỉnh/Thành phố)
      cityKey = parts[parts.length - 1].trim(); 
    }

    return DISTRICTS[cityKey] || [];
  }, [selectedLocation]);

  // --- Handlers ---
  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    onDistrictChange(district);
    setShowDistricts(false);
  };

  const handleClearDistrict = () => {
    setSelectedDistrict("");
    onDistrictChange("");
  };

  const handleApplyPrice = () => {
    onPriceChange(minPrice, maxPrice);
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setShowPriceFilter(false);
  };

  const handleClearPrice = () => {
    setMinPrice(0);
    setMaxPrice(100000000);
    setAppliedMinPrice(0);
    setAppliedMaxPrice(100000000);
    onPriceChange(0, 100000000);
  };

  const handleClearCategory = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    onParentCategoryChange("");
  };

  // --- Render ---
  return (
    <div className={styles.wrapper}>
      {/* 1. Nút Sắp xếp */}
      <div className={styles.filterItem}>
        <button
          onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
          className={styles.filterBtn}
        >
          {sortOrder === "newest" ? "Mới nhất" : "Cũ nhất"}
        </button>
      </div>

      {/* 2. Nút Chọn Quận Huyện (Chỉ hiện nếu tìm thấy danh sách quận) */}
      {availableDistricts.length > 0 && (
        <div className={styles.filterItem}>
          <button onClick={() => setShowDistricts(!showDistricts)} className={styles.filterBtn}>
            {selectedDistrict || "Khu vực"} ▼
          </button>
          {showDistricts && (
            <div className={styles.listDropdown}>
              {availableDistricts.map((q) => (
                <div key={q} className={styles.option} onClick={() => handleDistrictSelect(q)}>
                  {q}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Nút Lọc Giá */}
      <div className={styles.filterItem}>
        <button onClick={() => setShowPriceFilter(!showPriceFilter)} className={styles.filterBtn}>
           Giá ▼
        </button>
        {showPriceFilter && (
          <div className={styles.priceDropdown}>
            {/* Slider Range */}
            <div className={styles.sliderContainer}>
              <input
                type="range" min={0} max={100000000} step={1000000}
                value={minPrice}
                onChange={(e) => {
                   const val = Number(e.target.value);
                   if (val < maxPrice) setMinPrice(val);
                }}
              />
              <input
                type="range" min={0} max={100000000} step={1000000}
                value={maxPrice}
                onChange={(e) => {
                   const val = Number(e.target.value);
                   if (val > minPrice) setMaxPrice(val);
                }}
              />
            </div>

            {/* Input Số */}
            <div className={styles.priceInputs}>
              <div className={styles.inputGroup}>
                <label>Tối thiểu</label>
                <input
                  type="text"
                  value={minPrice.toLocaleString("vi-VN")}
                  onChange={(e) => setMinPrice(Number(e.target.value.replace(/\D/g, "")))}
                />
              </div>
              <span className={styles.separator}>—</span>
              <div className={styles.inputGroup}>
                <label>Tối đa</label>
                <input
                  type="text"
                  value={maxPrice.toLocaleString("vi-VN")}
                  onChange={(e) => setMaxPrice(Number(e.target.value.replace(/\D/g, "")))}
                />
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button onClick={handleClearPrice} className={styles.clearBtn}>Xóa</button>
              <button onClick={handleApplyPrice} className={styles.applyBtn}>Áp dụng</button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Nút Danh mục */}
      <div className={styles.filterItem}>
        <button onClick={() => setShowParentCategories(!showParentCategories)} className={styles.filterBtn}>
          {selectedCategory || "Danh mục"} ▼
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

      {/* 5. Tags hiển thị (Active Filters) */}
      <div className={styles.activeFilters}>
        {selectedDistrict && (
          <span className={styles.tag}>
            {selectedDistrict}
            <button className={styles.closeBtn} onClick={handleClearDistrict}>✕</button>
          </span>
        )}
        {(appliedMinPrice > 0 || appliedMaxPrice < 100000000) && (
          <span className={styles.tag}>
            {appliedMinPrice.toLocaleString("vi-VN")} - {appliedMaxPrice.toLocaleString("vi-VN")}
            <button className={styles.closeBtn} onClick={handleClearPrice}>✕</button>
          </span>
        )}
        {selectedCategory && (
          <span className={styles.tag}>
            {selectedCategory}
            <button className={styles.closeBtn} onClick={handleClearCategory}>✕</button>
          </span>
        )}
      </div>
    </div>
  );
};

export default LocMoRong;