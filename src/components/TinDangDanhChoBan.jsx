import React, { useState, useEffect, useContext } from "react"; 
import axios from "axios";
import "./TinDangDanhChoBan.css";
import { CategoryContext } from "../context/CategoryContext"; 
import { SearchContext } from "../context/SearchContext"; 
import { LocationContext } from "../context/LocationContext";
import { Link } from "react-router-dom"; 

const TinDangDanhChoBan = () => {
  const [posts, setPosts] = useState([]); 
  const [visiblePosts, setVisiblePosts] = useState(25); 

  const { searchTerm } = useContext(SearchContext); 
  const { selectedCategory, selectedSubCategory } = useContext(CategoryContext);
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

    fetchPosts(); 
  }, []); 

  // Lọc tin đăng theo từ khóa tìm kiếm
  const filterBySearchTerm = (posts) => {
    if (!searchTerm) return posts;
    
    const filtered = posts.filter((post) =>
      post.tieuDe && post.tieuDe.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log("Filtered by search term:", filtered); 
    return filtered;
  };

  // Lọc tin đăng theo danh mục (cả danh mục cha và danh mục con)
  const filterByCategory = (posts) => {
    // Nếu không có danh mục nào được chọn, trả về tất cả tin đăng
    if (!selectedCategory && !selectedSubCategory) return posts;
    
    // Lọc theo danh mục cha và danh mục con (nếu có)
    const filtered = posts.filter((post) => {
      // Nếu đã chọn danh mục con
      if (selectedSubCategory) {
        return post.danhMuc && post.danhMuc.toLowerCase() === selectedSubCategory.toLowerCase();
      }
      // Nếu chỉ chọn danh mục cha
      else if (selectedCategory) {
        return post.danhMucCha && post.danhMucCha.toLowerCase() === selectedCategory.toLowerCase();
      }
      
      return true;
    });
    
    console.log("Filtered by category:", filtered); 
    return filtered;
  };

  // Lọc tin đăng theo thành phố đã chọn
  const filterByLocation = (posts) => {
    if (!selectedLocation) return posts;
    
    const filtered = posts.filter((post) =>
      post.tinhThanh && post.tinhThanh.includes(selectedLocation)
    );
    console.log("Filtered by location:", filtered);
    return filtered;
  };

  // Áp dụng tất cả các bộ lọc: lọc theo thành phố, danh mục, và từ khóa tìm kiếm
  const filteredByLocation = filterByLocation(posts);
  const filteredByCategory = filterByCategory(filteredByLocation);
  const filteredPostsBySearch = filterBySearchTerm(filteredByCategory);

  const handleShowMore = () => {
    setVisiblePosts((prev) => prev + 25); 
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // Xử lý thông báo khi không có tin đăng
  const renderNoPostsMessage = () => {
    if (filteredPostsBySearch.length === 0) {
      let message = `Không có tin đăng`;
      
      if (selectedLocation) {
        message += ` tại ${selectedLocation}`;
      }
      
      if (selectedSubCategory) {
        message += ` trong danh mục "${selectedSubCategory}"`;
      } else if (selectedCategory) {
        message += ` trong danh mục "${selectedCategory}"`;
      }
      
      if (searchTerm) {
        message += ` với từ khóa "${searchTerm}"`;
      }
      
      return message;
    }
    return null; // Nếu có tin đăng, không cần hiển thị thông báo
  };

  return (
    <div className="tin-dang-danh-cho-ban">
      <h2 className="tieu-de">Tin Đăng Dành Cho Bạn</h2>
      <div className="filter-info">
        {selectedLocation && (
          <p>Đang hiển thị tin đăng tại: <strong>{selectedLocation}</strong></p>
        )}
        {selectedSubCategory && (
          <p>Đang hiển thị tin đăng thuộc danh mục: <strong>{selectedSubCategory}</strong></p>
        )}
      </div>
      <div className="post-list">
        {renderNoPostsMessage() ? (
          <p>{renderNoPostsMessage()}</p> // Hiển thị thông báo nếu không có tin đăng
        ) : (
          filteredPostsBySearch.slice(0, visiblePosts).map((post) => (
            <div key={post.maTinDang} className="post-item">
              <Link to={`/tin-dang/${post.maTinDang}`} className="post-link">
                {/* Hiển thị ảnh của tin đăng */}
                <div className="post-images-tin-dang-danh-cho-ban">
                  {post.images && post.images.length > 0 ? (
                    post.images.map((image, index) => (
                      <img
                        key={index}
                        src={`http://localhost:5133${image}`}
                        alt={`Image ${index + 1}`}
                        className="post-image"
                      />
                    ))
                  ) : (
                    <p>Không có ảnh.</p> // Nếu không có ảnh, hiển thị thông báo
                  )}
                </div>

                {/* Hiển thị thông tin tin đăng (tiêu đề, giá, địa chỉ) */}
                <div className="post-info">
                  <h3>{post.tieuDe}</h3> {/* Tiêu đề */}
                  <p className="price">{formatCurrency(post.gia)}</p> {/* Giá */}
                  <p className="post-description">
                    {post.tinhThanh} - {post.quanHuyen} {/* Địa chỉ (tỉnh/thành, quận/huyện) */}
                  </p>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {visiblePosts < filteredPostsBySearch.length && (
        <button className="xem-them-btn" onClick={handleShowMore}>
          Xem thêm
        </button> // Hiển thị nút "Xem thêm" nếu còn tin đăng để hiển thị
      )}
    </div>
  );
};

export default TinDangDanhChoBan;