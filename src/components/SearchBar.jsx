import React, { useContext, useState, useEffect, useRef } from "react";
import "./SearchBar.css";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { SearchContext } from "../context/SearchContext";
import { LocationContext } from "../context/LocationContext";
import { useNavigate, useLocation } from "react-router-dom";

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
      setSearchTerm(searchQuery); // Đặt từ khóa tìm kiếm cho SearchContext
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    setSearchTerm(inputValue);

    // Thêm query parameter vào URL và chuyển đến /market
    if (location.pathname !== "/loc-tin-dang") {
      navigate(`/loc-tin-dang?search=${inputValue}`);
    } else {
      // Nếu đã ở trang /loc-tin-dang, chỉ cập nhật query parameter
      navigate(`?search=${inputValue}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

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