import React, { useState, useEffect, useContext } from "react"; 
import axios from "axios";
import "./TinDangDanhChoBan.css";
import { CategoryContext } from "../context/CategoryContext"; // Import CategoryContext để lấy danh mục
import { SearchContext } from "../context/SearchContext"; // Import SearchContext để lấy từ khóa tìm kiếm
import { Link } from "react-router-dom"; // Import Link để tạo liên kết cho từng tin đăng

const TinDangDanhChoBan = () => {
  const [posts, setPosts] = useState([]); // Trạng thái để lưu danh sách tin đăng
  const [visiblePosts, setVisiblePosts] = useState(25); // Số lượng tin đăng hiển thị ban đầu

  const { searchTerm } = useContext(SearchContext); // Lấy từ khóa tìm kiếm từ context
  const { selectedCategory } = useContext(CategoryContext); // Lấy danh mục đã chọn từ context

  // Fetch (lấy) danh sách tin đăng từ API khi component được mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/tindang/get-posts");
        setPosts(response.data); // Lưu danh sách tin đăng vào state
        console.log("Fetched posts:", response.data); // In ra dữ liệu tin đăng đã lấy được để kiểm tra
      } catch (error) {
        console.error("Error fetching posts:", error); // Nếu có lỗi, in ra lỗi
      }
    };

    fetchPosts(); // Gọi hàm fetchPosts khi component được render
  }, []); // useEffect chỉ chạy một lần khi component được mount (tương đương componentDidMount)

  // Lọc tin đăng theo từ khóa tìm kiếm (không xét đến danh mục)
  const filterBySearchTerm = (posts) => {
    const filtered = posts.filter((post) =>
      post.tieuDe && post.tieuDe.toLowerCase().includes(searchTerm.toLowerCase()) // Kiểm tra nếu tiêu đề tin đăng có chứa từ khóa tìm kiếm
    );
    console.log("Filtered by search term:", filtered); // In ra danh sách tin đăng sau khi lọc theo từ khóa tìm kiếm
    return filtered;
  };

  // Lọc tin đăng theo danh mục đã chọn
  const filterByCategory = (posts) => {
    const filtered = posts.filter((post) => {
      return selectedCategory
        ? post.danhMucCha && post.danhMucCha.toLowerCase() === selectedCategory.toLowerCase() // Kiểm tra nếu danh mục cha của tin đăng trùng với danh mục đã chọn
        : true; // Nếu không có danh mục chọn, không lọc theo danh mục
    });
    console.log("Filtered by category:", filtered); // In ra danh sách tin đăng sau khi lọc theo danh mục
    return filtered;
  };

  // Áp dụng các bộ lọc: lọc theo danh mục trước, sau đó là từ khóa tìm kiếm
  const filteredPosts = filterByCategory(posts);
  const filteredPostsBySearch = filterBySearchTerm(filteredPosts);

  // Hàm xử lý khi nhấn nút "Xem thêm" để hiển thị thêm 25 tin đăng
  const handleShowMore = () => {
    setVisiblePosts((prev) => prev + 25); // Tăng số lượng tin đăng hiển thị lên 25
  };

  // Hàm định dạng giá tiền theo kiểu tiền tệ (VND)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // Xử lý thông báo khi không có tin đăng
  const renderNoPostsMessage = () => {
    if (filteredPostsBySearch.length === 0) {
      if (selectedCategory) {
        // Nếu có danh mục cha đã chọn
        return selectedCategory && searchTerm
          ? `Không có tin đăng với từ khóa "${searchTerm}" trong danh mục "${selectedCategory}"`
          : `Không có tin đăng trong danh mục "${selectedCategory}"`;
      } else if (searchTerm) {
        // Nếu không có danh mục và có từ khóa tìm kiếm
        return `Không có tin đăng với từ khóa "${searchTerm}"`;
      } else {
        // Nếu không có cả danh mục và từ khóa tìm kiếm
        return "Không có tin đăng nào.";
      }
    }
    return null; // Nếu có tin đăng, không cần hiển thị thông báo
  };

  return (
    <div className="tin-dang-danh-cho-ban">
      <h2>Tin Đăng Dành Cho Bạn</h2>
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
