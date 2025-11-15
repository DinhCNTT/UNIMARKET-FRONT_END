import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchBar from './SearchBar';
import './MarketHeroHeader.css';
import { CategoryContext } from '../context/CategoryContext';
import { SearchContext } from '../context/SearchContext';
import { LocationContext } from '../context/LocationContext';

const MarketHeroHeader = () => {
  const bannerRef = useRef(null);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const hoverTimerRef = useRef(null);
  const HOVER_OPEN_DELAY_MS = 3000; // 3 seconds

  const HERO_SCROLL_ENTER = 400;
  const HERO_SCROLL_EXIT = 440;

  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { setSearchTerm } = useContext(SearchContext);
  const { selectedLocation } = useContext(LocationContext);

  // -----------------------------------------
  // Hero mode
  // -----------------------------------------
  useEffect(() => {
    const setHeroMode = () => {
      const y = window.scrollY;

      if (y <= HERO_SCROLL_ENTER && !document.body.classList.contains('mp-hero-active')) {
        document.body.classList.add('mp-hero-active');
      } else if (y >= HERO_SCROLL_EXIT && document.body.classList.contains('mp-hero-active')) {
        document.body.classList.remove('mp-hero-active');
      }
    };

    setHeroMode();
    window.addEventListener('scroll', setHeroMode);
    window.addEventListener('resize', setHeroMode);

    return () => {
      window.removeEventListener('scroll', setHeroMode);
      window.removeEventListener('resize', setHeroMode);
      document.body.classList.remove('mp-hero-active');
    };
  }, []);

  // -----------------------------------------
  // Load categories
  // -----------------------------------------
  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5133/api/category/get-categories-with-icon"
        );
        if (mounted) setCategories(res.data || []);
      } catch (error) {
        console.error("Lỗi khi tải danh mục (hero):", error);
      }
    };

    fetchCategories();
    return () => { mounted = false; };
  }, []);

  // Cleanup hover timer
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
  }, []);

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubCategory("");
    setSearchTerm("");
    navigate('/loc-tin-dang');
  };

  const handleSubCategoryClick = (parentCategory, subCategory) => {
    setSelectedCategory(parentCategory);
    setSelectedSubCategory(subCategory);
    setSearchTerm("");
    navigate('/loc-tin-dang');
  };

  return (
    <div className="mp-hero-wrapper">

      {/* TOP HEADER */}
      <header className="mp-hero-top" ref={bannerRef}>
        <div className="nav-left">
          <a
            className="logo-link"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/market');
            }}
            style={{ display: 'inline-flex', alignItems: 'center' }}
            aria-label="Unimarket home"
          >
            <img src="/logoWeb (1).png" alt="Unimarket" className="logo-img" />
          </a>

          <nav className="main-menu"></nav>
        </div>
      </header>

      {/* SEARCH ROW */}
      <div className="mp-search-row">
        <div className="mp-search-inner">

          <div className="aw__i12y333q focusMode aw__ioytr5x">

            {/* CATEGORY DROPDOWN */}
            <div
              className="aw__c2ebkom dropdown"
              onMouseEnter={() => {
                if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                hoverTimerRef.current = setTimeout(() => {
                  setShowCategoryDropdown(true);
                  hoverTimerRef.current = null;
                }, HOVER_OPEN_DELAY_MS);
              }}
              onMouseLeave={() => {
                if (hoverTimerRef.current) {
                  clearTimeout(hoverTimerRef.current);
                  hoverTimerRef.current = null;
                }
                setShowCategoryDropdown(false);
              }}
            >
              <button
                className="aw__ss0v7ub aw__c1deuj6q"
                aria-haspopup="true"
                aria-expanded={showCategoryDropdown}
                onClick={() => {
                  if (hoverTimerRef.current) {
                    clearTimeout(hoverTimerRef.current);
                    hoverTimerRef.current = null;
                  }
                  setShowCategoryDropdown((s) => !s);
                }}
                type="button"
              >
                Danh mục ▾
              </button>

              {showCategoryDropdown && (
                <div className="dropdown-content">
                  {categories.map((parent) => (
                    <div key={parent.id} className="parent-category">

                      <span
                        className="parent-link"
                        onClick={() => handleCategoryClick(parent.tenDanhMucCha)}
                      >
                        {parent.icon && (
                          <img src={parent.icon} alt="icon" className="category-icon" />
                        )}
                        {parent.tenDanhMucCha}
                      </span>

                      {parent.danhMucCon && parent.danhMucCon.length > 0 && (
                        <div className="sub-menu">
                          {parent.danhMucCon.map((child) => (
                            <span
                              key={child.id}
                              className="sub-link"
                              onClick={() =>
                                handleSubCategoryClick(parent.tenDanhMucCha, child.tenDanhMucCon)
                              }
                            >
                              {child.tenDanhMucCon}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEARCH ICON */}
            <div className="aw__cf5h6c0">
              <svg
                className="aw__s5t3nwm aw__s10hnu9l"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20" height="20"
                fill="none"
              >
                <path
                  d="M18.28 17.03l-3.66-3.66A6.5 6.5 0 1014 14.62l3.66 3.66a1 1 0 001.41-1.41zM10.5 15a4.5 4.5 0 110-9 4.5 4.5 0 010 9z"
                  fill="currentColor"
                />
              </svg>
            </div>

            {/* SEARCH INPUT */}
            <div className="aw__tknn46t aw__t1pitf51">
              <SearchBar />
            </div>

            {/* LOCATION + SEARCH BUTTON */}
            <div className="aw__a6j9p2u" aria-hidden>
              <button
                className="aw__bbl0vm6 outline o-neutral r-normal large w-bold i-left aw__h11lklry"
                id="ct-aw-location-button"
              >
                {/* Location Icon */}
                <svg
                  className="aw__l1y2ajet"
                  width="20" height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                    fill="currentColor"
                  />
                </svg>

                <span className="aw__ss0v7ub aw__l5hempe">
                  {selectedLocation || "Tp Hồ Chí Minh"}
                </span>

                {/* Arrow Icon */}
                <svg
                  className="aw__c16nhcfe"
                  width="16" height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M7 10l5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* SEARCH BUTTON */}
              <div className="aw__s1vpqu7q">
                <button
                  className="aw__bbl0vm6 primary r-normal medium w-bold stretch aw__s1pvgief"
                  aria-label="Search Button Desktop"
                >
                  <span className="aw__s1ap2tw5">Tìm kiếm</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default MarketHeroHeader;