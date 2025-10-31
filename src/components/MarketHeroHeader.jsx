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
  const HOVER_OPEN_DELAY_MS = 3000; // 3 seconds delay before opening on hover
  // Hysteresis thresholds to avoid jitter when hero toggles
  const HERO_SCROLL_ENTER = 400; // scrollY <= ENTER => hero active
  const HERO_SCROLL_EXIT = 440;  // scrollY >= EXIT => hero inactive

  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { setSearchTerm } = useContext(SearchContext);
  const { selectedLocation } = useContext(LocationContext);

  useEffect(() => {
    // Activate hero-mode on body while near top of homepage
    const setHeroMode = () => {
      const y = window.scrollY;
      // Only switch when crossing the enter/exit thresholds to prevent rapid toggles
      if (y <= HERO_SCROLL_ENTER && !document.body.classList.contains('mp-hero-active')) {
        document.body.classList.add('mp-hero-active');
      } else if (y >= HERO_SCROLL_EXIT && document.body.classList.contains('mp-hero-active')) {
        document.body.classList.remove('mp-hero-active');
      }
      // otherwise keep current state
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

  // Fetch categories for the category dropdown (same endpoint as TopNavbar)
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

  // clear hover timer on unmount to avoid setting state after unmount
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

  // NOTE: do NOT auto-navigate when location changes on the homepage.
  // Navigation will be handled by SearchBar's search action (Enter or search button)
  // to avoid locking the user into the listing page when they simply pick a city.

  return (
    <div className="mp-hero-wrapper">
      {/* Render a simplified top header for the homepage hero.
          This matches the structure you provided but intentionally
          omits the "Danh mục" dropdown and the central search bar.
      */}
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
            <img src="/logoWeb.png" alt="Unimarket" className="logo-img" />
          </a>
          <nav className="main-menu">
          </nav>
        </div>

        {/* right side is intentionally omitted here so the real TopNavbar (mounted separately)
            provides the interactive icons, unread count, account dropdown and post button.
            That preserves all logic (SignalR, auth, handlers) in the original component. */}
  </header>
      {/* Search row placed below the fixed top header. Kept simple: no category dropdown, uses existing SearchBar. */}
      <div className="mp-search-row">
        <div className="mp-search-inner">
          {/* Chotot-like visual wrapper: keep existing SearchBar logic but present it with prefixed styles */}
          <div className="aw__i12y333q focusMode aw__ioytr5x">
            <div
              className="aw__c2ebkom dropdown"
              onMouseEnter={() => {
                // start timer to open after delay
                if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                hoverTimerRef.current = setTimeout(() => {
                  setShowCategoryDropdown(true);
                  hoverTimerRef.current = null;
                }, HOVER_OPEN_DELAY_MS);
              }}
              onMouseLeave={() => {
                // cancel pending open and close immediately
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
                      // clicking toggles immediately; cancel any hover timer
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
                                onClick={() => handleSubCategoryClick(parent.tenDanhMucCha, child.tenDanhMucCon)}
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

            <div className="aw__cf5h6c0">
              <svg className="aw__s5t3nwm aw__s10hnu9l" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M18.2798 11.4399C18.2797 7.66239 15.2175 4.6001 11.4399 4.6001C7.66244 4.60018 4.60018 7.66244 4.6001 11.4399C4.6001 15.2175 7.66239 18.2797 11.4399 18.2798C15.2176 18.2798 18.2798 15.2176 18.2798 11.4399ZM20.2798 11.4399C20.2798 13.5439 19.5432 15.4748 18.3159 16.9927L21.0952 19.6812L21.1655 19.7563C21.4922 20.1438 21.4786 20.7232 21.1187 21.0952C20.7586 21.4674 20.1798 21.5 19.7817 21.186L19.7046 21.1187L16.8901 18.396C15.3881 19.5745 13.4972 20.2798 11.4399 20.2798C6.55782 20.2797 2.6001 16.3221 2.6001 11.4399C2.60018 6.55787 6.55787 2.60018 11.4399 2.6001C16.3221 2.6001 20.2797 6.55782 20.2798 11.4399Z" fill="currentColor"></path></svg>
            </div>

            {/* Keep full SearchBar component for logic (input, suggestions, history, location dropdown, search button) */}
            <div className="aw__tknn46t aw__t1pitf51">
              <SearchBar />
            </div>

            <div className="aw__a6j9p2u" aria-hidden>
              <button className="aw__bbl0vm6 outline o-neutral r-normal large w-bold i-left aw__h11lklry" id="ct-aw-location-button">
                <svg className="aw__l1y2ajet" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20px" height="20px" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M20.0005 10.0439C20.0004 11.4492 19.4826 12.8887 18.7915 14.2021C18.0937 15.5284 17.1749 16.8075 16.2759 17.9131C15.3742 19.0219 14.4755 19.9768 13.8032 20.6533C13.4666 20.992 13.1851 21.2623 12.9868 21.4492C12.8876 21.5427 12.8088 21.6161 12.7544 21.666L12.7198 21.6979L12.6919 21.7236L12.6743 21.7393L12.0005 22.3418L11.3267 21.7393L11.3091 21.7236L11.2811 21.6979L11.2466 21.666C11.1921 21.6161 11.1134 21.5427 11.0142 21.4492C10.8158 21.2623 10.5344 20.992 10.1978 20.6533C9.52545 19.9768 8.62674 19.0219 7.7251 17.9131C6.82612 16.8075 5.90731 15.5284 5.20947 14.2021C4.51839 12.8887 4.0006 11.4492 4.00049 10.0439C4.00049 5.6075 7.57638 2 12.0005 2C16.4246 2 20.0005 5.6075 20.0005 10.0439ZM12.0005 13C13.7936 13 15.2368 11.5391 15.2368 9.75C15.2367 7.96099 13.7935 6.5 12.0005 6.5C10.2076 6.50015 8.76521 7.96108 8.76514 9.75C8.76514 11.539 10.2075 12.9998 12.0005 13Z" fill="currentColor"></path></svg>
                <span className="aw__ss0v7ub aw__l5hempe">Tp Hồ Chí Minh</span>
                <svg className="aw__c16nhcfe" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="24px" fill="none"><g fill="currentColor"><path d="M12.4495 14.8316C12.2013 15.0561 11.7987 15.0561 11.5505 14.8316L6.18623 9.98133C6.0044 9.81692 5.95001 9.56967 6.04841 9.35486C6.14682 9.14006 6.37864 9 6.63578 9L17.3642 9C17.6214 9 17.8532 9.14006 17.9516 9.35487C18.05 9.56967 17.9956 9.81693 17.8138 9.98133L12.4495 14.8316Z"></path></g></svg>
              </button>

              <div className="aw__s1vpqu7q">
                <button className="aw__bbl0vm6 primary r-normal medium w-bold stretch aw__s1pvgief" aria-label="Search Button Desktop">
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
