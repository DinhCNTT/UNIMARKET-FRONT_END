import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "./CategoryList.css";
import { CategoryContext } from "../context/CategoryContext";
import { useNavigate } from "react-router-dom"; // ✅ THÊM

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const placeholderImage = "https://dummyimage.com/150";
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const navigate = useNavigate(); // ✅ THÊM

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/category");

        const fixedCategories = response.data.map((category) => ({
          tenDanhMucCha: category.tenDanhMucCha,
          anhDanhMuc: category.anhDanhMucCha
            ? `http://localhost:5133${category.anhDanhMucCha}`
            : placeholderImage,
        }));

        setCategories(fixedCategories);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubCategory("");
    navigate("/loc-tin-dang"); // ✅ CHUYỂN TRANG SAU KHI SET CONTEXT
  };

  return (
    <div className="category-container">
      <h2 className="category-title">Khám phá danh mục</h2>
      <ul className="category-grid">
        {categories.map((category, index) => (
          <li key={index} className="category-item">
            <img
              src={category.anhDanhMuc}
              alt={category.tenDanhMucCha}
              className="category-image"
              onClick={() => handleCategoryClick(category.tenDanhMucCha)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = placeholderImage;
              }}
            />
            <p className="category-name">{category.tenDanhMucCha}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryList;
