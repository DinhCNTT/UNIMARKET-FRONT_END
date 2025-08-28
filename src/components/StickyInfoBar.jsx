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
  const descriptionRef = useRef(null);

  useEffect(() => {
    if (!panelRef?.current) return;

    const handleScroll = () => {
      const scrollTop = panelRef.current.scrollTop;
      setShowSticky(scrollTop > 100); // xuất hiện khi scroll > 100px

      // check highlight tab
      if (descriptionRef.current) {
        const descTop = descriptionRef.current.offsetTop;
        setActiveTab(scrollTop >= descTop - 50 ? "description" : "overview");
      }
    };

    const panel = panelRef.current;
    panel.addEventListener("scroll", handleScroll);

    return () => panel.removeEventListener("scroll", handleScroll);
  }, [panelRef]);

  const scrollTo = (tab) => {
    if (!panelRef?.current) return;
    if (tab === "overview") panelRef.current.scrollTo({ top: 0, behavior: "smooth" });
    if (tab === "description" && descriptionRef.current) {
      panelRef.current.scrollTo({
        top: descriptionRef.current.offsetTop,
        behavior: "smooth",
      });
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return "";
    return showPhone ? phone : phone.slice(0, 6) + "***";
  };

  if (!data) return null;

  return (
    <>
      {/* Sticky bar */}
      {showSticky && (
        <div className="sticky-bar">
          <div className="sticky-left">
            <img
              src={data.danhSachAnh?.[0] || "/default.png"}
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
            className="sticky-btn"
            onClick={() => setShowPhone((prev) => !prev)}
          >
            <FaPhoneAlt />{" "}
            {formatPhone(
              data?.nguoiDang?.phoneNumber ||
              data?.nguoiDang?.sdt || 
              data?.soDienThoai || 
              "0900000000"
            )}
          </button>
          <button className="sticky-btn" onClick={onOpenChat}>
            <SiMinutemailer /> Chat
          </button>
        </div>
        </div>
      )}

      {/* Tab bar */}
      {showSticky && (
        <div className="sticky-tab-bar">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => scrollTo("overview")}
          >
            Tổng quan
          </button>
          <button
            className={`tab-btn ${activeTab === "description" ? "active" : ""}`}
            onClick={() => scrollTo("description")}
          >
            Mô tả chi tiết
          </button>
        </div>
      )}

      {/* ref đến mô tả chi tiết */}
      <div ref={descriptionRef} style={{ position: "absolute", top: 0 }} />
    </>
  );
};

export default StickyInfoBar;
