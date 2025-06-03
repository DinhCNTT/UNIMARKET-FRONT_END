import React, { useState, useRef, useEffect } from "react";
import "./UniMarketIntro.css";

const UniMarketIntro = () => {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef(null);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);

  useEffect(() => {
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
        <h2>UniMarket.com – Sứ mệnh kết nối, khai phóng tiềm năng mua bán trực tuyến cho người Việt</h2>
        <p>
          Lần đầu tiên ra mắt tại thị trường Việt Nam, <strong>UniMarket.com</strong> mang theo sứ mệnh tạo ra một nền tảng rao vặt trung gian hiện đại, thông minh – nơi mọi người có thể kết nối, trao đổi, mua bán một cách <strong>an toàn, thuận tiện và siêu tốc</strong>.
        </p>

        <p>
          Với giao diện thân thiện và công nghệ tối ưu, UniMarket không chỉ đơn thuần là chợ online – mà còn là không gian để mọi người giải phóng giá trị những món đồ cũ, tìm thấy những món đồ cần thiết và tận hưởng trải nghiệm giao dịch đáng tin cậy.
        </p>

        <p>
          Từ Bất động sản, Xe cộ, Đồ điện tử, Thú cưng, Đồ cá nhân đến Việc làm, Dịch vụ – Du lịch… UniMarket là chiếc cầu nối hiệu quả giữa người cần bán và người muốn mua.
        </p>

        <p>Bạn có thể dễ dàng mua bán mọi loại hàng hóa – cũ hay mới – với nhiều lĩnh vực đa dạng:</p>

        <ul>
          <li><strong>Bất động sản:</strong> Nhà đất, căn hộ, phòng trọ, văn phòng kinh doanh… đa dạng vị trí, diện tích.</li>
          <li><strong>Phương tiện đi lại:</strong> Ô tô, xe máy chính chủ, giá tốt, đầy đủ giấy tờ.</li>
          <li><strong>Đồ dùng cá nhân:</strong> Thời trang, túi xách, đồng hồ, giày dép… đủ gu, đủ chất.</li>
          <li><strong>Đồ điện tử:</strong> Smartphone, laptop, TV, máy lạnh… từ các thương hiệu lớn.</li>
          <li><strong>Thú cưng:</strong> Poodle, Pug, Mèo Anh, Munchkin, Hamster, chim, cá cảnh… đáng yêu giá tốt.</li>
          <li><strong>Việc làm:</strong> Hàng ngàn cơ hội tuyển dụng hấp dẫn mỗi ngày.</li>
          <li><strong>Dịch vụ - Du lịch:</strong> Tour, vé máy bay, voucher, khách sạn… tiện lợi và tiết kiệm.</li>
          <li><strong>Thực phẩm:</strong> Đặc sản vùng miền, món ngon nhà làm, đồ tươi sạch, an toàn.</li>
        </ul>

        <p><strong>Và còn nhiều món thú vị khác chờ bạn khám phá!</strong></p>

        <p>Với UniMarket, bạn có thể:</p>
        <ul>
          <li><strong>Đăng tin bán đồ dễ như chơi</strong> – up hình, mô tả ngắn, chọn danh mục là xong.</li>
          <li><strong>Lọc tin theo khu vực, danh mục, giá cả</strong> – tìm món ưng ngay trong 1 nốt nhạc.</li>
          <li><strong>Nhắn tin trực tiếp người mua & người bán</strong> – không qua trung gian.</li>
          <li><strong>Chỉnh sửa, xoá tin bất cứ khi nào</strong> – bạn là boss!</li>
        </ul>

        <p>
          Đừng để những món đồ bạn không dùng tới bị lãng phí! Hãy chụp vài tấm ảnh đẹp, viết mô tả ngắn gọn và sử dụng tính năng <strong>Đăng Tin Miễn Phí</strong> – bạn sẽ nhanh chóng tiếp cận hàng ngàn người mua tiềm năng.
        </p>

        <p><strong>UniMarket – nơi mọi món đồ đều có cơ hội được tìm thấy chủ nhân mới. Chúc bạn mua may – bán đắt!</strong></p>
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
