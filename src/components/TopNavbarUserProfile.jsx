import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryContext } from "../context/CategoryContext";
import { SearchContext } from "../context/SearchContext";
import { FaArrowLeft, FaHome } from "react-icons/fa";
import "./TopNavbarUserProfile.css";

const TopNavbarUserProfile = ({ profileUser }) => {
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { setSearchTerm } = useContext(SearchContext);
  const navigate = useNavigate();

  const resetFiltersAndNavigate = (path) => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSearchTerm("");
    navigate(path);
  };

  const handleBackClick = () => navigate(-1);
  const handleHomeClick = () => resetFiltersAndNavigate("/market");
  const handleLogoClick = () => resetFiltersAndNavigate("/market");

  return (
    <header className="topnavbar-userprofile">
      <div className="topnavbar-userprofile-container">
        
        {/* Left: Back + Logo */}
        <div className="topnavbar-userprofile-left">
          <button
            className="topnavbar-userprofile-btn-back"
            onClick={handleBackClick}
            title="Quay lại"
          >
            <FaArrowLeft />
          </button>

          <div
            className="topnavbar-userprofile-logo"
            onClick={handleLogoClick}
            title="Về trang chủ"
          >
            <img
              src="/logoWeb.png"
              alt="Logo"
              className="topnavbar-userprofile-logo-img"
            />
            <span className="topnavbar-userprofile-logo-text">UniMarket</span>
          </div>
        </div>

        {/* Center: Profile Name */}
        <div className="topnavbar-userprofile-center">
          {profileUser && (profileUser.fullName || profileUser.tenNguoiDung) ? (
            <div className="topnavbar-userprofile-title">
              <span className="prefix">Trang cá nhân của</span>{" "}
              <span className="name">{profileUser.fullName || profileUser.tenNguoiDung}</span>
            </div>
          ) : (
            <div className="topnavbar-userprofile-loading">
              <span className="dots" /> Đang tải thông tin...
            </div>
          )}
        </div>

        {/* Right: Home */}
        <div className="topnavbar-userprofile-right">
          <button
            className="topnavbar-userprofile-btn-home"
            onClick={handleHomeClick}
            title="Trang chủ"
          >
            <FaHome />
          </button>
        </div>

      </div>
    </header>
  );
};

export default TopNavbarUserProfile;
