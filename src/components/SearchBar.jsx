import React, { useContext, useState, useEffect } from "react";
import "./SearchBar.css";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { SearchContext } from "../context/SearchContext";
import { useNavigate, useLocation } from "react-router-dom";

const SearchBar = () => {
  const { setSearchTerm } = useContext(SearchContext);
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Khi trang load lại, lấy giá trị query parameter (nếu có)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get("search");
    if (searchQuery) {
      setInputValue(searchQuery);
      setSearchTerm(searchQuery); // Đặt từ khóa tìm kiếm cho SearchContext
    }
  }, [location.search, setSearchTerm]);

  const handleSearch = () => {
    setSearchTerm(inputValue);

    // Thêm query parameter vào URL và chuyển đến /market
    if (location.pathname !== "/market") {
      navigate(`/market?search=${inputValue}`);
    } else {
      // Nếu đã ở trang /market, chỉ cập nhật query parameter
      navigate(`?search=${inputValue}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="search-bar">
      <div className="location">
        <FaMapMarkerAlt className="location-icon" />
        <span>Tp Hồ Chí Minh ▼</span>
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
