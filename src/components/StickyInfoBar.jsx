import React, { useState, useEffect, useRef } from "react";
import { FaPhoneAlt } from "react-icons/fa";
import { SiMinutemailer } from "react-icons/si";
import "./StickyInfoBar.css";

const StickyInfoBar = ({
  data,
  user,
  onOpenChat,
  panelRef, // ref đến div scroll
}) => {
  const [showSticky, setShowSticky] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview | description
  const [showPhone, setShowPhone] = useState(false); // ẩn/hiện SĐT
  const descriptionRef = useRef(null); // Ref này sẽ được gán khi data tải xong

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    let descEl = null;
    if (data) {
      descEl = panel.querySelector(".description-section");
      if (descEl) {
        descriptionRef.current = descEl;
      }
    }

    const handleScroll = () => {
      const scrollTop = panel.scrollTop;
      setShowSticky(scrollTop > 100);

      // check highlight tab
      if (descriptionRef.current) {
        const descTop = descriptionRef.current.offsetTop;
        
        // SỬA LỖI Ở ĐÂY: Tăng giá trị offset
        // 90 là quá nhỏ, 115 là chiều cao thật của 2 thanh sticky cộng lại
        const stickyBarOffset = 115; // <-- THAY ĐỔI TỪ 90 LÊN 115
        
        // Khi đỉnh của "Mô tả" cách đỉnh scroll 115px, active tab
        setActiveTab(
          scrollTop >= descTop - stickyBarOffset ? "description" : "overview"
        );
      }
    };

    panel.addEventListener("scroll", handleScroll);

    return () => panel.removeEventListener("scroll", handleScroll);
  }, [panelRef, data]);

  const scrollTo = (tab) => {
    if (!panelRef?.current) return;

    // SỬA LỖI Ở ĐÂY: Dùng chung một giá trị offset
    const stickyBarOffset = 115; // <-- THAY ĐỔI TỪ 90 LÊN 115

    // Yêu cầu 2: Ấn "Tổng quan" scroll về đầu
    if (tab === "overview") {
      panelRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return; // Dừng
    }

    // Yêu cầu 1: Ấn "Mô tả chi tiết"
    if (tab === "description" && descriptionRef.current) {
      panelRef.current.scrollTo({
        // Scroll đến đỉnh của section, trừ đi chiều cao của thanh sticky
        top: descriptionRef.current.offsetTop - stickyBarOffset,
        behavior: "smooth",
      });
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return "";
    return showPhone ? phone : phone.slice(0, 6) + "***";
  };

  const getPhone = () => {
    return (
      data?.nguoiDang?.phoneNumber ||
      data?.nguoiDang?.sdt ||
      data?.soDienThoai ||
      "0900000000"
    );
  };

  // Logic này giữ nguyên: chỉ render khi có data
  if (!data) return null;

  return (
    <>
      {/* Sticky container */}
      {showSticky && (
        <div className="sticky-container">
          {/* Thanh thông tin chính */}
          <div className="sticky-info-content">
            <div className="sticky-left">
              <img
                src={data.danhSachAnh?.[0]?.url || data.danhSachAnh?.[0] || "/default.png"}
                alt="thumb"
                className="sticky-thumb"
              />
            </div>
            <div className="sticky-center">
              <div className="sticky-title">{data.tieuDe}</div>
              <div className="sticky-price">{data.gia?.toLocaleString()} đ</div>
            </div>
            <div className="sticky-right">
              <button
                className="sticky-btn phone"
                onClick={() => setShowPhone((prev) => !prev)}
              >
                <FaPhoneAlt />
                {formatPhone(getPhone())}
              </button>
              <button
                className="sticky-btn chat"
                onClick={onOpenChat}
              >
                <SiMinutemailer /> Chat
              </button>
            </div>
          </div>

          {/* Thanh Tab */}
          <div className="sticky-tab-content">
            <button
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => scrollTo("overview")}
            >
              Tổng quan
            </button>
            <button
              className={`tab-btn ${
                activeTab === "description" ? "active" : ""
              }`}
              onClick={() => scrollTo("description")}
            >
              Mô tả chi tiết
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StickyInfoBar;