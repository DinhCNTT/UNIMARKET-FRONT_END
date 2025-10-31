import React, { useContext } from "react";
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

  return (
    <div className="marketplace-page">
  {/* Keep TopNavbar mounted (logic like SignalR/unread counts runs) */}
  <TopNavbar />

  {/* Market hero visual (two-line) shown on homepage; it will add body.mp-hero-active while at top */}
  <MarketHeroHeader />

  {/* Banner (slideshow) rendered after hero header; hero top-info is fixed so banner starts visually below it */}
  <BannerSlider />

      <div className="main-content">
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