import React, { useState, useRef, useEffect } from "react";
import "./UniMarketIntro.css";

const UniMarketIntro = () => {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef(null);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);

  useEffect(() => {
    // Kiểm tra xem có cần hiển thị nút "Xem thêm"
    const lineHeight = parseInt(getComputedStyle(contentRef.current).lineHeight);
    const lines = contentRef.current.scrollHeight / lineHeight;
    if (lines > 8) {
      setShouldShowToggle(true);
    }
  }, []);

  const toggleContent = () => {
    setExpanded(!expanded);
  };

 return (
  <div className="unimarket-intro-container">
    <div
      className={`unimarket-intro-content ${expanded ? "expanded" : ""}`}
      ref={contentRef}
    >
      <h2>UniMarket – Chợ Đồ Cũ Online Siêu Tiện Cho Sinh Viên</h2>
      <p>
        <strong>UniMarket</strong> là nơi tụ hội cho sinh viên và người bán hàng muốn **bán đồ cũ, tìm đồ xịn** mà **không tốn phí**.
        Chỉ vài cú click là bạn có thể <strong>đăng tin – tìm đồ – kết nối</strong> nhanh như chớp ⚡
      </p>

      <p>Mua bán đủ món, từ A đến Z:</p>
      <ul>
        <li>🎓 <strong>Đồ học tập:</strong> Sách, laptop, bút thước, đồ án "xịn xò".</li>
        <li>🪑 <strong>Đồ sinh hoạt:</strong> Bàn ghế, đèn học, nội thất gọn nhẹ.</li>
        <li>📱 <strong>Đồ công nghệ:</strong> Điện thoại, tai nghe, màn hình...</li>
        <li>🧥 <strong>Thời trang:</strong> Quần áo, giày dép, phụ kiện chất chơi.</li>
        <li>🍳 <strong>Đồ gia dụng mini:</strong> Bếp, quạt, nồi cơm, tủ lạnh mini...</li>
      </ul>

      <p>Và còn nhiều món thú vị khác chờ bạn khám phá!</p>

      <p>Với UniMarket, bạn có thể:</p>
      <ul>
        <li>✅ <strong>Đăng tin bán đồ dễ như chơi</strong> – up hình, mô tả ngắn, chọn danh mục là xong.</li>
        <li>🔍 <strong>Lọc tin theo khu vực, danh mục, giá cả</strong> – tìm món ưng ngay trong 1 nốt nhạc.</li>
        <li>🔄 <strong>Chát chít trực tiếp người mua & người bán</strong> – không qua trung gian.</li>
        <li>🛠️ <strong>Chỉnh sửa, xoá tin bất cứ khi nào</strong> – bạn là boss!</li>
      </ul>

      <p>
        <strong>UniMarket – Lên đồ cũ, kiếm tiền mới 💸</strong><br />
        Biến đồ không xài thành giá trị – <strong>bắt đầu đăng tin ngay!</strong>
      </p>
    </div>

    {shouldShowToggle && (
      <button onClick={toggleContent} className="toggle-button">
        {expanded ? "Thu gọn" : "Xem thêm"}
      </button>
    )}
  </div>
);

  
};

export default UniMarketIntro;
