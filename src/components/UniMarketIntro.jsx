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
        <h2>UniMarket – Nền Tảng Mua Bán Đồ Cũ, Rao Vặt Trực Tuyến Tiện Lợi</h2>
        <p>
          <strong>UniMarket</strong> là nền tảng mua bán đồ cũ và rao vặt trực tuyến, giúp kết nối
          <strong> sinh viên và người bán hàng</strong> một cách nhanh chóng, dễ dàng và tiết kiệm.
          Đây là nơi bạn có thể <strong>đăng tin rao bán miễn phí</strong>, tìm kiếm món đồ cần mua,
          hoặc đăng bài giới thiệu sản phẩm đến đúng đối tượng người dùng.
        </p>
  
        <p>Tại UniMarket, bạn có thể dễ dàng mua bán nhiều loại sản phẩm phổ biến:</p>
        <ul>
          <li>🎓 <strong>Đồ học tập</strong>: Sách vở, tài liệu, laptop cũ, dụng cụ học tập…</li>
          <li>🪑 <strong>Đồ dùng sinh hoạt</strong>: Bàn ghế, tủ kệ, đèn học, đồ nội thất nhỏ gọn…</li>
          <li>📱 <strong>Thiết bị điện tử</strong>: Điện thoại, laptop, tai nghe, màn hình, loa bluetooth…</li>
          <li>🧥 <strong>Thời trang</strong>: Quần áo, giày dép, phụ kiện…</li>
          <li>🛵 <strong>Phương tiện di chuyển</strong>: Xe đạp, xe máy, xe điện giá tốt…</li>
          <li>🍳 <strong>Đồ gia dụng mini</strong>: Bếp điện, quạt, nồi cơm, tủ lạnh mini…</li>
        </ul>
  
        <p>Với UniMarket, bạn có thể:</p>
        <ul>
          <li>✅ <strong>Đăng tin bán hàng nhanh chóng</strong> chỉ với vài thao tác: chụp hình, nhập mô tả, chọn danh mục.</li>
          <li>🔍 <strong>Tìm kiếm tin đăng dễ dàng</strong> theo danh mục, khu vực, mức giá.</li>
          <li>🔄 <strong>Kết nối trực tiếp giữa người mua và người bán</strong>, không qua trung gian.</li>
          <li>🛠️ <strong>Quản lý tin đăng linh hoạt</strong>: chỉnh sửa, xóa tin bất kỳ lúc nào.</li>
        </ul>
  
        <p>
          <strong>UniMarket – Mua Bán Đơn Giản, Giao Dịch Tiện Lợi.</strong><br />
          Biến món đồ bạn không còn dùng đến thành giá trị cho người khác – bắt đầu đăng tin ngay hôm nay!
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
