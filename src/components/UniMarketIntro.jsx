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
        <h2>UniMarket – Nền Tảng Mua Bán Đồ Cũ, Rao Vặt Trực Tuyến Tiện Lợi Dành Cho Sinh Viên</h2>
        <p>
          UniMarket ra đời với sứ mệnh kết nối cộng đồng sinh viên và người dùng với nhau qua các giao dịch mua bán đồ cũ một cách đơn giản, nhanh chóng, an toàn và tiết kiệm. Đây là nơi bạn có thể dễ dàng đăng tin rao bán miễn phí, tìm kiếm món đồ cần mua, hoặc trao đổi vật dụng phục vụ học tập, sinh hoạt và giải trí.
        </p>
        <p>
          UniMarket hướng đến việc xây dựng một chợ đồ cũ hiện đại, nơi mọi sinh viên có thể tận dụng lại đồ dùng không còn sử dụng, đồng thời tìm được những món đồ cần thiết với giá siêu rẻ, chất lượng đảm bảo. Bạn có thể dễ dàng mua bán nhiều loại sản phẩm như:
        </p>
        <ul>
          <li>🎓 Đồ học tập: Sách vở, tài liệu chuyên ngành, dụng cụ học tập, máy tính cũ...</li>
          <li>🪑 Đồ dùng cá nhân & sinh hoạt: Bàn học, ghế, tủ, đèn, giá sách...</li>
          <li>📱 Đồ điện tử: Laptop, điện thoại, tai nghe, loa bluetooth, màn hình...</li>
          <li>🧥 Thời trang sinh viên: Quần áo, giày dép, túi xách, đồng hồ...</li>
          <li>🛵 Phương tiện đi lại: Xe máy, xe đạp, xe điện – phù hợp với túi tiền sinh viên.</li>
          <li>🍳 Đồ gia dụng mini: Bếp điện, nồi cơm, quạt, tủ lạnh nhỏ, lò vi sóng...</li>
        </ul>
        <p>
          Với UniMarket, bạn có thể dễ dàng:
          <br />
          Đăng tin bán nhanh gọn với vài thao tác đơn giản: chụp hình, nhập mô tả, chọn danh mục.
          <br />
          Duyệt và tìm kiếm hàng ngàn tin đăng được phân loại rõ ràng theo danh mục, khu vực, mức giá.
          <br />
          Kết nối trực tiếp với người bán/người mua mà không qua trung gian.
          <br />
          Quản lý tin đăng của mình, chỉnh sửa hoặc gỡ bỏ bất cứ lúc nào.
          <br />
          Trao đổi đồ miễn phí hoặc đổi đồ ngang giá trong khu vực Swap Zone độc đáo.
        </p>
        <p>
          Không chỉ là nơi trao đổi hàng hóa, UniMarket còn là nơi để sinh viên giao lưu, hỗ trợ nhau, chia sẻ mẹo tiết kiệm, kinh nghiệm mua đồ cũ an toàn và hiệu quả qua các bài viết từ Blog UniMarket.
        </p>
        <p>
          Hãy để những món đồ bạn không còn sử dụng trở nên có giá trị hơn với người khác – chỉ bằng một vài thao tác đơn giản. UniMarket – Mua Bán Đơn Giản, Giao Dịch An Tâm.
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
