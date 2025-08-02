import React, { useContext, useState, useEffect, useRef } from "react";
import "./SearchBar.css";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { SearchContext } from "../context/SearchContext";
import { LocationContext } from "../context/LocationContext";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

const SearchBar = () => {
  const { setSearchTerm } = useContext(SearchContext);
  const { selectedLocation, setSelectedLocation } = useContext(LocationContext);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Các tùy chọn thành phố
  const cities = ["Hồ Chí Minh", "Hà Nội"];

  // Khi trang load lại, lấy giá trị query parameter (nếu có)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get("search");
    if (searchQuery) {
      setInputValue(searchQuery);
      setSearchTerm(searchQuery);
    }
  }, [location.search, setSearchTerm]);

  // Xử lý click bên ngoài dropdown để đóng nó
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hàm xử lý tìm kiếm
  const handleSearch = () => {
    if (!inputValue.trim()) {
      toast.error("⚡ Vui lòng nhập từ khóa tìm kiếm!", {
  id: "search-error", // 🔹 ngăn không cho hiển thị trùng lặp
  duration: 2000, // 🔹 thời gian hiển thị 2 giây
 position: "top-right",
  style: {
    background: "linear-gradient(135deg, #ff512f, #dd2476)",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "15px",
    padding: "14px 18px",
    borderRadius: "12px",
    border: "1px solid #ff6b81",
    boxShadow: "0 0 15px rgba(255, 0, 70, 0.6)",
    textShadow: "0 0 5px rgba(0,0,0,0.3)",
  },
  icon: "🚫",
  className: "SearchBar-shake-toast",
});

      return;
    }

    setSearchTerm(inputValue);

    if (location.pathname !== "/loc-tin-dang") {
      navigate(`/loc-tin-dang?search=${inputValue}`);
    } else {
      navigate(`?search=${inputValue}`);
    }
  };

  // Bắt sự kiện Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // Hiển thị dropdown chọn vị trí
  const handleLocationClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleCitySelect = (city) => {
    setSelectedLocation(city);
    setShowDropdown(false);
  };

  return (
    <div className="search-bar">
      <div className="location" onClick={handleLocationClick} ref={dropdownRef}>
        <FaMapMarkerAlt className="location-icon" />
        <span>{selectedLocation} ▼</span>
        {showDropdown && (
          <div className="location-dropdown">
            {cities.map((city) => (
              <div
                key={city}
                className="location-option"
                onClick={() => handleCitySelect(city)}
              >
                {city}
              </div>
            ))}
          </div>
        )}
      </div>

      <input
        type="text"
        placeholder="Tìm kiếm sản phẩm trên Unimarket"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button className="search-btn" onClick={handleSearch}>
        <FaSearch />
      </button>
    </div>
  );
};

export default SearchBar;
