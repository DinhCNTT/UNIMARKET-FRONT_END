// LocTinDang.jsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "./LocTinDang.css";
import { CategoryContext } from "../context/CategoryContext";
import { SearchContext } from "../context/SearchContext";
import { LocationContext } from "../context/LocationContext";
import { Link } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";
import LocMoRong from "../components/LocMoRong";

const LocTinDang = () => {
  const [posts, setPosts] = useState([]);
  const [visiblePosts, setVisiblePosts] = useState(25);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [categories, setCategories] = useState([]);

  const { searchTerm } = useContext(SearchContext);
  const { selectedCategory, setSelectedCategory, selectedSubCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { selectedLocation } = useContext(LocationContext);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/tindang/get-posts");
        setPosts(response.data);
        console.log("Fetched posts:", response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
        setCategories(res.data);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
      }
    };

    fetchPosts();
    fetchCategories();
  }, []);

  const filterBySearchTerm = (posts) => {
    if (!searchTerm) return posts;
    return posts.filter((post) =>
      post.tieuDe && post.tieuDe.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filterByCategory = (posts) => {
    if (!selectedCategory && !selectedSubCategory) return posts;
    return posts.filter((post) => {
      if (selectedSubCategory) {
        return post.danhMuc && post.danhMuc.toLowerCase() === selectedSubCategory.toLowerCase();
      }
      if (selectedCategory) {
        return post.danhMucCha && post.danhMucCha.toLowerCase() === selectedCategory.toLowerCase();
      }
      return true;
    });
  };

  const filterByLocation = (posts) => {
    if (!selectedLocation) return posts;
    return posts.filter((post) =>
      post.tinhThanh && post.tinhThanh.includes(selectedLocation)
    );
  };

  const filterByDistrict = (posts) => {
    if (!selectedDistrict) return posts;
    return posts.filter((post) =>
      post.quanHuyen && post.quanHuyen.includes(selectedDistrict)
    );
  };

  const filterByPrice = (posts) => {
    return posts.filter((post) =>
      post.gia >= minPrice && post.gia <= maxPrice
    );
  };

  const filteredByLocation = filterByLocation(posts);
  const filteredByCategory = filterByCategory(filteredByLocation);
  const filteredByDistrict = filterByDistrict(filteredByCategory);
  const filteredByPrice = filterByPrice(filteredByDistrict);
  const filteredPostsBySearch = filterBySearchTerm(filteredByPrice);

  const handleShowMore = () => {
    setVisiblePosts((prev) => prev + 25);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const renderNoPostsMessage = () => {
    if (filteredPostsBySearch.length === 0) {
      let message = `Không có tin đăng`;
      if (selectedLocation) message += ` tại ${selectedLocation}`;
      if (selectedDistrict) message += ` - ${selectedDistrict}`;
      if (selectedSubCategory) message += ` trong danh mục "${selectedSubCategory}"`;
      else if (selectedCategory) message += ` trong danh mục "${selectedCategory}"`;
      if (searchTerm) message += ` với từ khóa "${searchTerm}"`;
      return message;
    }
    return null;
  };

  return (
    <div className="loc-tin-dang-container">
      <TopNavbar />
      <LocMoRong
        onDistrictChange={setSelectedDistrict}
        onPriceChange={(min, max) => {
          setMinPrice(min);
          setMaxPrice(max);
        }}
        onParentCategoryChange={(cat) => {
          setSelectedCategory(cat);
          setSelectedSubCategory("");
        }}
        categories={categories}
      />
      <h2 className="loc-tin-dang-title">Kết Quả Lọc Tin Đăng</h2>
      <div className="loc-tin-dang-filter-info">
        {selectedLocation && <p>Đang hiển thị tin đăng tại: <strong>{selectedLocation}</strong></p>}
        {selectedDistrict && <p>Đang lọc theo quận/huyện: <strong>{selectedDistrict}</strong></p>}
        {selectedSubCategory && <p>Danh mục: <strong>{selectedSubCategory}</strong></p>}
        {selectedCategory && !selectedSubCategory && <p>Danh mục: <strong>{selectedCategory}</strong></p>}
        {searchTerm && <p>Từ khóa: <strong>{searchTerm}</strong></p>}
      </div>

      <div className="loc-tin-dang-list">
        {renderNoPostsMessage() ? (
          <p className="loc-tin-dang-no-result">{renderNoPostsMessage()}</p>
        ) : (
          filteredPostsBySearch.slice(0, visiblePosts).map((post) => (
            <div key={post.maTinDang} className="loc-tin-dang-item">
              <Link to={`/tin-dang/${post.maTinDang}`} className="loc-tin-dang-link">
                <div className="loc-tin-dang-content">
                  <div className="loc-tin-dang-image-container">
                    {post.images && post.images.length > 0 ? (
                      <img
                        src={`http://localhost:5133${post.images[0]}`}
                        alt={post.tieuDe}
                        className="loc-tin-dang-image"
                      />
                    ) : (
                      <div className="loc-tin-dang-no-image">Không có ảnh</div>
                    )}
                  </div>
                  <div className="loc-tin-dang-info">
                    <h3 className="loc-tin-dang-title-item">{post.tieuDe}</h3>
                    <p className="loc-tin-dang-price">{formatCurrency(post.gia)}</p>
                    <p className="loc-tin-dang-location">{post.tinhThanh} - {post.quanHuyen}</p>
                    {post.moTa && (
                      <p className="loc-tin-dang-description">
                        {post.moTa.length > 100 ? `${post.moTa.substring(0, 100)}...` : post.moTa}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {visiblePosts < filteredPostsBySearch.length && (
        <button className="loc-tin-dang-xem-them-btn" onClick={handleShowMore}>
          Xem thêm
        </button>
      )}
    </div>
  );
};

export default LocTinDang;