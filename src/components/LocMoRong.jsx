import React, { useContext, useState } from "react";
import "./LocMoRong.css";
import { CategoryContext } from "../context/CategoryContext";
import { LocationContext } from "../context/LocationContext";

const DISTRICTS = {
  "Hồ Chí Minh": [
    "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5",
    "Quận 6", "Quận 7", "Quận 8", "Quận 9", "Quận 10",
    "Quận 11", "Quận 12", "Tân Bình", "Tân Phú", "Bình Thạnh",
    "Phú Nhuận", "Gò Vấp", "Bình Tân", "Thủ Đức", "Nhà Bè"
  ],
  "Hà Nội": [
    "Ba Đình", "Hoàn Kiếm", "Đống Đa", "Hai Bà Trưng", "Thanh Xuân",
    "Cầu Giấy", "Hoàng Mai", "Long Biên", "Tây Hồ", "Nam Từ Liêm",
    "Bắc Từ Liêm", "Hà Đông", "Thanh Trì", "Gia Lâm", "Đông Anh"
  ]
};

const LocMoRong = ({ onDistrictChange, onPriceChange, onParentCategoryChange, categories }) => {
  const { selectedLocation } = useContext(LocationContext);
  const { selectedCategory, setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);

  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [minPrice, setMinPrice] = useState(5000000);
  const [maxPrice, setMaxPrice] = useState(15000000);
  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(100000000);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [showDistricts, setShowDistricts] = useState(false);
  const [showParentCategories, setShowParentCategories] = useState(false);

  const handleApplyPrice = () => {
    onPriceChange(minPrice, maxPrice);
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setShowPriceFilter(false);
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    onDistrictChange(district);
    setShowDistricts(false);
  };

  const handleClearDistrict = () => {
    setSelectedDistrict("");
    onDistrictChange("");
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

  const availableDistricts = DISTRICTS[selectedLocation] || [];

  return (
    <div className="loc-mo-rong-wrapper">
      {/* Các nút lọc */}
      <div className="loc-mo-rong-buttons">
        {/* Lọc quận/huyện */}
        {availableDistricts.length > 0 && (
          <div className="loc-mo-rong-filter-item">
            <button onClick={() => setShowDistricts(!showDistricts)} className="loc-mo-rong-button">
              Lọc theo Quận/Huyện
            </button>
            {showDistricts && (
              <div className="loc-mo-rong-dropdown-quan-huyen">
                {availableDistricts.map((q) => (
                  <div key={q} className="loc-mo-rong-option" onClick={() => handleDistrictSelect(q)}>
                    {q}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lọc giá */}
        <div className="loc-mo-rong-filter-item">
          <button onClick={() => setShowPriceFilter(!showPriceFilter)} className="loc-mo-rong-button">
            Lọc theo giá
          </button>
          {showPriceFilter && (
            <div className="loc-mo-rong-dropdown-gia">
              <div className="loc-mo-rong-range-slider">
                <input 
                  type="range"
                  min={0}
                  max={100000000}
                  step={1000000}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={0}
                  max={100000000}
                  step={1000000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
              </div>
              <div className="loc-mo-rong-price-inputs">
                <div className="loc-mo-rong-price-box">
                  <label>Giá tối thiểu</label>
                  <input
                    type="text"
                    value={minPrice.toLocaleString("vi-VN")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setMinPrice(Number(raw));
                    }}
                  />
                </div>
                <span style={{ padding: "0 8px" }}>-</span>
                <div className="loc-mo-rong-price-box">
                  <label>Giá tối đa</label>
                  <input
                    type="text"
                    value={maxPrice.toLocaleString("vi-VN")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setMaxPrice(Number(raw));
                    }}
                  />
                </div>
              </div>
              <div className="loc-mo-rong-price-actions">
                <button onClick={handleClearPrice}>Xóa lọc</button>
                <button className="ap-dung-btn" onClick={handleApplyPrice}>Áp dụng</button>
              </div>
            </div>
          )}
        </div>

        {/* Lọc danh mục cha */}
        <div className="loc-mo-rong-filter-item">
          <button onClick={() => setShowParentCategories(!showParentCategories)} className="loc-mo-rong-button">
            Lọc theo Danh mục cha
          </button>
          {showParentCategories && (
            <div className="loc-mo-rong-dropdown-danh-muc-cha">
              {categories.map((c) => (
                <div key={c.id} className="loc-mo-rong-option" onClick={() => {
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
      </div>

      {/* Thẻ lọc đang được áp dụng (hiển thị dưới các nút lọc) */}
      <div className="loc-mo-rong-active-filters">
        {selectedDistrict && (
          <span className="loc-mo-rong-tag">
            {selectedDistrict}
            <button onClick={handleClearDistrict}>❌</button>
          </span>
        )}
        {(appliedMinPrice > 0 || appliedMaxPrice < 100000000) && (
          <span className="loc-mo-rong-tag">
            {appliedMinPrice.toLocaleString("vi-VN")}đ - {appliedMaxPrice.toLocaleString("vi-VN")}đ
            <button onClick={handleClearPrice}>❌</button>
          </span>
        )}
        {selectedCategory && (
          <span className="loc-mo-rong-tag">
            {selectedCategory}
            <button onClick={handleClearCategory}>❌</button>
          </span>
        )}
      </div>
    </div>
  );
};

export default LocMoRong;
