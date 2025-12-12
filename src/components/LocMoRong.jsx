import React, { useContext, useState, useEffect, useMemo } from "react";
import styles from "./LocMoRong.module.css";
import { CategoryContext } from "../context/CategoryContext";
import { LocationContext } from "../context/LocationContext";

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
  const { selectedLocation } = useContext(LocationContext);
  const { selectedCategory, setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);

  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [showDistricts, setShowDistricts] = useState(false);
  const [showParentCategories, setShowParentCategories] = useState(false);
  
  const [sortOrder, setSortOrder] = useState("newest");
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [minPrice, setMinPrice] = useState(5000000);
  const [maxPrice, setMaxPrice] = useState(15000000);
  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(100000000);

  useEffect(() => {
    onSortOrderChange(sortOrder);
  }, [sortOrder, onSortOrderChange]);

  // --- LOGIC 1: Lấy danh sách quận huyện ---
  const availableDistricts = useMemo(() => {
    if (!selectedLocation) return [];
    let cityKey = selectedLocation;
    if (selectedLocation.includes(",")) {
      const parts = selectedLocation.split(",");
      cityKey = parts[parts.length - 1].trim(); 
    }
    return DISTRICTS[cityKey] || [];
  }, [selectedLocation]);

  // --- LOGIC 2: Xử lý hiển thị Header & Slogan ---
  const headerInfo = useMemo(() => {
    let city = "";
    let district = "";

    // Phân tích location từ SearchBar
    if (selectedLocation && selectedLocation !== "Toàn quốc") {
       if (selectedLocation.includes(",")) {
         const parts = selectedLocation.split(",");
         district = parts[0].trim();
         city = parts[1].trim();
       } else {
         city = selectedLocation;
       }
    }

    // Nếu user chọn quận trong filter, ưu tiên hiển thị
    if (selectedDistrict) {
        district = selectedDistrict;
    }

    let breadcrumb = "Unimarket";
    let slogan = "Mua Bán Rao Vặt Nhanh Chóng, Uy Tín Tại Unimarket Toàn quốc";

    if (city) {
        if (district) {
            breadcrumb = `Unimarket / ${city} / ${district}`;
            slogan = `Mua Bán Rao Vặt Nhanh Chóng, Uy Tín Tại Unimarket ${district} ${city}`;
        } else {
            breadcrumb = `Unimarket / ${city}`;
            slogan = `Mua Bán Rao Vặt Nhanh Chóng, Uy Tín Tại Unimarket ${city}`;
        }
    }

    return { breadcrumb, slogan };
  }, [selectedLocation, selectedDistrict]);

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

  return (
    // === KHỐI TRẮNG CHÍNH (Đã đưa Header vào trong này) ===
    <div className={styles.filterContainer}>
      
      {/* --- PHẦN HEADER & SLOGAN NẰM TRONG KHUNG --- */}
      <div className={styles.headerText}>
          <div className={styles.breadcrumb}>{headerInfo.breadcrumb}</div>
          <h1 className={styles.slogan}>{headerInfo.slogan}</h1>
      </div>

      {/* --- CÁC NÚT LỌC --- */}
      <div className={styles.controlsRow}>
        {/* Nút Sắp xếp */}
        <div className={styles.filterItem}>
          <button
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            className={styles.filterBtn}
          >
            {sortOrder === "newest" ? "Mới nhất" : "Cũ nhất"}
          </button>
        </div>

        {/* Nút Danh mục */}
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

        {/* Nút Quận Huyện */}
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

        {/* Nút Giá */}
        <div className={styles.filterItem}>
          <button onClick={() => setShowPriceFilter(!showPriceFilter)} className={styles.filterBtn}>
             Giá ▼
          </button>
          {showPriceFilter && (
            <div className={styles.priceDropdown}>
              <div className={styles.priceInputs}>
                <div className={styles.inputGroup}>
                   <input
                    type="text" placeholder="Thấp nhất"
                    value={minPrice.toLocaleString("vi-VN")}
                    onChange={(e) => setMinPrice(Number(e.target.value.replace(/\D/g, "")))}
                  />
                </div>
                <span>-</span>
                <div className={styles.inputGroup}>
                  <input
                    type="text" placeholder="Cao nhất"
                    value={maxPrice.toLocaleString("vi-VN")}
                    onChange={(e) => setMaxPrice(Number(e.target.value.replace(/\D/g, "")))}
                  />
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

      {/* Hiển thị các filters đang chọn */}
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