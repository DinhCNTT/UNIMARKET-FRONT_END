import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./ChiTietTinDang.css";
import TopNavbar from "../components/TopNavbar";

// Hàm định dạng ngày thành ngày-tháng-năm
const formatDate = (dateString) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Trả về chuỗi gốc nếu không phải ngày hợp lệ
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

const ChiTietTinDang = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [similarPosts, setSimilarPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const scrollRef = useRef(null); // Ref để cuộn ngang

  const handleShowPhoneNumber = () => {
    setShowPhoneNumber(!showPhoneNumber); // Toggle hiển thị số điện thoại
  };

  const handleScroll = (direction) => {
    const container = scrollRef.current;
    if (direction === "left") {
      container.scrollBy({ left: -300, behavior: "smooth" });
    } else {
      container.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5133/api/tindang/get-post-and-similar/${id}`);
        setPost(response.data.post);
        setSimilarPosts(response.data.similarPosts);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi lấy tin đăng:", error);
        setLoading(false);
        setPost(null);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return <div>Đang tải thông tin...</div>;
  }

  if (!post) {
    return <div>Không tìm thấy tin đăng.</div>;
  }

  // Định dạng giá thành VND
  const formattedPrice = post.gia.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VND";

  return (
    <div className="chi-tiet-tin-dang">
         <TopNavbar />
      {/* Chi tiết tin đăng */}
      <div className="tin-dang-header">
        {/* Ảnh nằm bên trái */}
        <div className="image-container">
          {post.images && post.images.map((image, index) => (
            <img key={index} src={`http://localhost:5133${image}`} alt={`Image ${index + 1}`} />
          ))}
        </div>

        {/* Thông tin bên phải */}
        <div className="chi-tiet-tin-dang-info">
          <h1>{post.tieuDe}</h1>
          <p><strong>Giá:</strong> <span className="price">{formattedPrice}</span></p>
          <p><strong>Địa chỉ:</strong> {post.diaChi}</p>
          <p><strong>Ngày đăng:</strong> {formatDate(post.ngayDang)}</p>

          {/* Số điện thoại */}
          <div className="sdt-chat">
            <button className="sdt" onClick={handleShowPhoneNumber}>
              {showPhoneNumber ? post.phoneNumber : `Hiện số ${post.phoneNumber.substring(0, 6)}****`}
            </button>
          </div>

          {/* Tên người bán nằm dưới số điện thoại */}
          <div className="seller-info">
            <div className="seller-name">Người bán tên: {post.nguoiBan}</div>
          </div>
        </div>
      </div>

      {/* Mô tả chi tiết */}
      <div className="mo-ta-chi-tiet">
        <p>
          <strong>Số điện thoại:</strong> 
          <span onClick={handleShowPhoneNumber} style={{ color: 'blue', cursor: 'pointer' }}>
            {showPhoneNumber ? post.phoneNumber : `${post.phoneNumber.substring(0, 6)}****`}
          </span>
        </p>
        <p>{post.moTa}</p>
      </div>

      {/* Tin đăng tương tự */}
      <div className="tin-dang-tuong-tu">
        <h2>Tin đăng tương tự</h2>

        <div className="similar-posts-wrapper">
          {/* Nút cuộn trái */}
          <button className="scroll-btn left" onClick={() => handleScroll("left")}>&lt;</button>

          {/* Danh sách tin tương tự */}
          <div className="similar-posts-container" ref={scrollRef}>
            {similarPosts.map((post) => (
              <div key={post.maTinDang} className="similar-post-card">
                <div className="image-wrapper">
                  <img src={`http://localhost:5133${post.images[0]}`} alt={post.tieuDe} />
                  <span className="image-count">{post.images.length}</span>
                </div>
                <h3>{post.tieuDe}</h3>
                <p className="gia">{post.gia}</p>
                <p>{post.diaChi}</p>
                <p className="nho">{formatDate(post.ngayDang)}</p>
              </div>
            ))}
          </div>

          {/* Nút cuộn phải */}
          <button className="scroll-btn right" onClick={() => handleScroll("right")}>&gt;</button>
        </div>
      </div>
    </div>
  );
};

export default ChiTietTinDang;