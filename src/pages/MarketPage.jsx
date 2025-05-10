import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar";
import BannerSlider from "../components/BannerSlider";
import CategoryList from "../components/CategoryList"; // Import component hiển thị danh mục
import TinDangDanhChoBan from "../components/TinDangDanhChoBan"; // Import component TinDangDanhChoBan
import UniMarketIntro from "../components/UniMarketIntro"; // Import component giới thiệu UniMarket
import "./MarketPage.css"; // Import CSS cho trang MarketPage

const MarketplacePage = () => {
  const { user } = useContext(AuthContext); // Lấy thông tin user từ context

  return (
    <div className="marketplace-page">
      {/* Thanh menu đầu trang */}
      <TopNavbar />

      {/* Banner chạy tự động */}
      <BannerSlider />

      {/* Nội dung chính */}
      <div className="main-content">

        {/* Danh sách danh mục */}
        <CategoryList />

        {/* Tin đăng dành cho bạn */}
        <TinDangDanhChoBan /> {/* Thêm tin đăng dưới danh mục */}

        {!user && ( // Hiển thị thông báo nếu chưa đăng nhập
          <div>
            <p className="login-prompt">Hãy <a href="/login">đăng nhập</a> hoặc <a href="/register">đăng ký</a> để đăng tin hoặc quản lý tin của bạn!</p>
          </div>
        )}

        {/* Các phần khác */}
        <UniMarketIntro /> {/* Giới thiệu về UniMarket */}
      </div>
    </div>
  );
};

export default MarketplacePage;