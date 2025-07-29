import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import BannerSlider from "../components/BannerSlider";
import CategoryList from "../components/CategoryList";
import TinDangDanhChoBan from "../components/TinDangDanhChoBan";
import UniMarketIntro from "../components/UniMarketIntro";
import "./MarketPage.css";
import VideoListCarousel from "../components/VideoCarousel";
import Footer from "../components/Footer";

const MarketplacePage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="marketplace-page">
      {/* Thanh menu đầu trang */}
      <TopNavbar />

      {/* Banner chạy tự động */}
      <BannerSlider />

      <div className="main-content">
        {/* Danh sách danh mục */}
        <CategoryList />

        {/* Danh sách video */}
        <VideoListCarousel />

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