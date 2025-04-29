import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./TopNavbar.css";
import SearchBar from "./SearchBar";
import { CategoryContext } from "../context/CategoryContext";
import { SearchContext } from "../context/SearchContext"; // Import SearchContext

const TopNavbar = () => {
  const [categories, setCategories] = useState([]);
  const { setSelectedCategory, selectedCategory } = useContext(CategoryContext);
  const { setSearchTerm } = useContext(SearchContext); // Lấy hàm setSearchTerm từ context
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (location.pathname !== "/market") {
      setSelectedCategory("");
    }
  }, [location.pathname]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
      setCategories(res.data);
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
    }
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setSearchTerm(""); // Reset search term khi chọn danh mục
    navigate("/market");
  };

  const isCategorySelected = (categoryName) => {
    return location.pathname === "/market" && selectedCategory === categoryName ? "active" : "";
  };

  const handleLogoClick = () => {
    setSelectedCategory(""); // Xóa danh mục đã chọn
    setSearchTerm("");       // Xóa từ khóa tìm kiếm
    navigate("/market");     // Chuyển về trang market
  };

  return (
    <header className="top-navbar">
      <div className="nav-left">
        <span className="logo" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
          Unimarket
        </span>

        <nav className="main-menu">
          <div className="dropdown">
            <span className="dropdown-title">Danh mục</span>
            <div className="dropdown-content">
              {categories.map((parent) => (
                <div key={parent.id} className="parent-category">
                  <span
                    className={`parent-link ${isCategorySelected(parent.tenDanhMucCha)}`}
                    onClick={() => handleCategoryClick(parent.tenDanhMucCha)}
                  >
                    {parent.icon && <img src={parent.icon} alt="icon" className="category-icon" />}
                    {parent.tenDanhMucCha}
                  </span>

                  {parent.danhMucCon.length > 0 && (
                    <div className="sub-menu">
                      {parent.danhMucCon.map((child) => (
                        <span
                          key={child.id}
                          className={`sub-link ${isCategorySelected(child.tenDanhMucCon)}`}
                          onClick={() => handleCategoryClick(child.tenDanhMucCon)}
                        >
                          {child.tenDanhMucCon}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Nút danh mục nổi bật */}
          <button
            className={`category-button-electronics ${isCategorySelected("Đồ Điện Tử")}`}
            onClick={() => handleCategoryClick("Đồ Điện Tử")}
          >
            Đồ Điện Tử
          </button>
          <button
            className={`category-button-furniture ${isCategorySelected("Nội Thất Sinh Viên")}`}
            onClick={() => handleCategoryClick("Nội Thất Sinh Viên")}
          >
            Nội Thất Sinh Viên
          </button>
          <button
            className={`category-button-homegoods ${isCategorySelected("Đồ Gia Dụng")}`}
            onClick={() => handleCategoryClick("Đồ Gia Dụng")}
          >
            Đồ Gia Dụng
          </button>
        </nav>
      </div>

      <div className="nav-search">
        <SearchBar />
      </div>

      <div className="nav-right">
        <span className="manage-post" onClick={() => navigate("/quan-ly-tin")}>Quản lý tin</span>
        <span className="post-btn" onClick={() => navigate("/dang-tin")}>ĐĂNG TIN</span>
      </div>
    </header>
  );
};

export default TopNavbar;
