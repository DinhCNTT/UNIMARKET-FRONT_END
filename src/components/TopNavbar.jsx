import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./TopNavbar.css";
import SearchBar from "./SearchBar";
import { CategoryContext } from "../context/CategoryContext";
import { SearchContext } from "../context/SearchContext";
import { AuthContext } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";

const TopNavbar = () => {
  const [categories, setCategories] = useState([]);
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { setSearchTerm } = useContext(SearchContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (location.pathname !== "/market" && location.pathname !== "/loc-tin-dang") {
      setSelectedCategory("");
      setSelectedSubCategory("");
    }
  }, [location.pathname]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
      setCategories(res.data);
    } catch (error) {
      console.error("Lỗi khi tải danh mục:", error);
    }
  };

  const handleLogoClick = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSearchTerm("");
    navigate("/market");
  };

  return (
    <header className="top-navbar">
      <div className="nav-left">
        <span className="logo" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
          Unimarket
        </span>

        <nav className="main-menu">
          <div className="dropdown">
            <span className="dropdown-title">Danh mục</span>
            <div className="dropdown-content">
              {categories.map((parent) => (
                <div key={parent.id} className="parent-category">
                  <span
                    className="parent-link"
                    onClick={() => {
                      setSelectedCategory(parent.tenDanhMucCha);
                      setSelectedSubCategory("");
                      setSearchTerm("");
                      navigate("/loc-tin-dang");
                    }}
                  >
                    {parent.icon && <img src={parent.icon} alt="icon" className="category-icon" />}
                    {parent.tenDanhMucCha}
                  </span>
                  {parent.danhMucCon.length > 0 && (
                    <div className="sub-menu">
                      {parent.danhMucCon.map((child) => (
                        <span
                          key={child.id}
                          className="sub-link"
                          onClick={() => {
                            setSelectedCategory(parent.tenDanhMucCha);
                            setSelectedSubCategory(child.tenDanhMucCon);
                            setSearchTerm("");
                            navigate("/loc-tin-dang");
                          }}
                        >
                          {child.tenDanhMucCon}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </nav>
      </div>

      <div className="nav-search">
        <SearchBar />
      </div>

      <div className="nav-right">
        {user ? (
          <>
        <div className="chat-icon-topnavbar" onClick={() => navigate("/chat")} title="Tin nhắn">
          <FontAwesomeIcon  icon={faComments}/>
        </div>

        <button className="manage-post-btn" onClick={() => navigate('/quan-ly-tin')}>
          Quản lý tin
        </button>
        <span className="post-btn" onClick={() => navigate("/dang-tin")}>ĐĂNG TIN</span>
        <button className="logout-btn" onClick={logout}>Đăng Xuất</button>
          </>
        ) : (
          <>
            <button className="login-btn" onClick={() => navigate("/login")}>Đăng Nhập</button>
            <button className="register-btn" onClick={() => navigate("/register")}>Đăng Ký</button>
          </>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;
