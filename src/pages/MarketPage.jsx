import React, { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import MarketHeroHeader from "../components/MarketHeroHeader";
// BannerSlider kept for content below hero if needed
import BannerSlider from "../components/BannerSlider";
import CategoryList from "../components/CategoryList";
import TinDangDanhChoBan from "../components/TinDangDanhChoBan";
import UniMarketIntro from "../components/UniMarketIntro";
import "./MarketPage.css";
import Footer from "../components/Footer";

const MarketplacePage = () => {
  const { user } = useContext(AuthContext);

  // ✅ FIX 1: Luôn cuộn lên đầu trang khi trang này được tải (Mount)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="marketplace-page">
      {/* Keep TopNavbar mounted (logic like SignalR/unread counts runs) */}
      <TopNavbar />

      {/* Market hero visual (two-line) shown on homepage */}
      <MarketHeroHeader />

      {/* Banner (slideshow) rendered after hero header */}
      <BannerSlider />

      {/* ✅ FIX 2: Thêm style minHeight="200vh" 
          Tác dụng: Ép khung nội dung luôn cao gấp đôi màn hình ngay cả khi chưa có dữ liệu.
          Điều này đẩy Footer xuống dưới cùng, tránh việc trình duyệt cuộn nhầm xuống Footer khi bấm nút Back.
      */}
      <div className="main-content" style={{ minHeight: "200vh" }}>
        
        {/* Danh sách danh mục */}
        <CategoryList />

        {/* Tin đăng dành cho bạn */}
        <div className="section-wrapper">
          <TinDangDanhChoBan />
        </div>

        {/* Thông báo nếu chưa đăng nhập */}
        {!user && (
          <div className="section-wrapper">
            <p className="login-prompt">
              Hãy <a href="/login">đăng nhập</a> hoặc <a href="/register">đăng ký</a> để đăng tin hoặc quản lý tin của bạn!
            </p>
          </div>
        )}

        {/* Giới thiệu UniMarket */}
        <div className="section-wrapper">
          <UniMarketIntro />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MarketplacePage;