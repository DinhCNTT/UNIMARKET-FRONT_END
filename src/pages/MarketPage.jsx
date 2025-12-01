import React, { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar/TopNavbar";
import MarketHeroHeader from "../components/MarketHeroHeader";
import CategoryList from "../components/CategoryList";
import TinDangDanhChoBan from "../components/TinDangDanhChoBan";
import UniMarketIntro from "../components/UniMarketIntro";
import "./MarketPage.css";
import Footer from "../components/Footer";
import FooterBanner from "../components/FooterBanner/FooterBanner"; 

const MarketplacePage = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="marketplace-page">
      <TopNavbar />
      <MarketHeroHeader />

      <div className="main-content" style={{ minHeight: "200vh" }}>
        <CategoryList />

        <div className="section-wrapper">
          <TinDangDanhChoBan />
        </div>

        {!user && (
          <div className="section-wrapper">
            <p className="login-prompt">
              Hãy <a href="/login">đăng nhập</a> hoặc <a href="/register">đăng ký</a> để đăng tin hoặc quản lý tin của bạn!
            </p>
          </div>
        )}

        <div className="section-wrapper">
          <UniMarketIntro />
        </div>
      </div>
      <FooterBanner />
      <Footer />
    </div>
  );
};

export default MarketplacePage;