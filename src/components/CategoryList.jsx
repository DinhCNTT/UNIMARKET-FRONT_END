import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "./CategoryList.css";
import { CategoryContext } from "../context/CategoryContext"; // Import CategoryContext

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const placeholderImage = "https://dummyimage.com/150"; // Ảnh mặc định
  const { setSelectedCategory } = useContext(CategoryContext); // Lấy setSelectedCategory từ context

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/category");

        // Sử dụng ảnh trả về từ API, kết hợp baseUrl với đường dẫn ảnh
        const fixedCategories = response.data.map((category) => ({
          tenDanhMucCha: category.tenDanhMucCha,
          anhDanhMuc: category.anhDanhMucCha
            ? `http://localhost:5133${category.anhDanhMucCha}` // Kết hợp baseUrl với ảnh
            : placeholderImage, // Nếu không có ảnh, dùng ảnh mặc định
        }));

        setCategories(fixedCategories);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName); // Cập nhật danh mục khi nhấn
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
              onClick={() => handleCategoryClick(category.tenDanhMucCha)} // Khi nhấn vào, cập nhật danh mục
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
