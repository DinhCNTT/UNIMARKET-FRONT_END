import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from "react-hot-toast";
import { FaSearch, FaClock, FaTimes, FaArrowLeft, FaCheck } from "react-icons/fa";

import './MarketHeroHeader.css';
import "./SearchBar.css"; 

import { CategoryContext } from '../context/CategoryContext';
import { SearchContext } from '../context/SearchContext';
import { LocationContext } from '../context/LocationContext';
import { AuthContext } from "../context/AuthContext";

// --- Icons SVG ---
const IconChevronDown = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L5 5L9 1" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLocation = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#FFC107"/>
    <circle cx="12" cy="9" r="2.5" fill="#fff"/>
  </svg>
);

const MarketHeroHeader = () => {
  // --- Contexts ---
  const { user, token } = useContext(AuthContext);
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { setSearchTerm } = useContext(SearchContext);
  // Đảm bảo selectedLocation có giá trị mặc định nếu context chưa set
  const { selectedLocation, setSelectedLocation } = useContext(LocationContext);

  // --- Router ---
  const navigate = useNavigate();
  const location = useLocation();

  // --- Refs ---
  const bannerRef = useRef(null);
  const dropdownLocationRef = useRef(null);
  const suggestionsRef = useRef(null);
  const hoverTimerRef = useRef(null); // Dùng ref này để quản lý delay đóng/mở

  // --- State for Header UI ---
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // --- State for Search Logic ---
  const [inputValue, setInputValue] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- State for Location Advanced Logic ---
  const [provinces, setProvinces] = useState([]); 
  const [tempCity, setTempCity] = useState(null); 
  const [popupView, setPopupView] = useState('PROVINCE'); // 'PROVINCE' | 'DISTRICT'
  const [locationSearchText, setLocationSearchText] = useState(""); 

  // Constants
  // const HOVER_OPEN_DELAY_MS = 200; // (Không dùng nữa để mở nhanh hơn)
  const HOVER_CLOSE_DELAY_MS = 300; // *** QUAN TRỌNG: Thời gian chờ trước khi đóng menu ***
  const HERO_SCROLL_ENTER = 400;
  const HERO_SCROLL_EXIT = 440;

  // ----------------------------------------------------------------
  // 1. EFFECTS: SCROLL & CLICK OUTSIDE & API
  // ----------------------------------------------------------------

  // Scroll Logic
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

  // Click Outside Logic
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownLocationRef.current && !dropdownLocationRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- QUAN TRỌNG: ĐỒNG BỘ URL VỚI INPUT VÀ LOCATION ---
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get("search");
    const locationQuery = queryParams.get("location");

    // 1. Sync Search Text
    if (searchQuery) {
      setInputValue(searchQuery);
      setSearchTerm(searchQuery);
    }

    // 2. Sync Location: Nếu URL không có tham số location -> Mặc định là Toàn quốc
    if (locationQuery) {
      setSelectedLocation(locationQuery);
    } else {
      setSelectedLocation("Toàn quốc");
    }
  }, [location.search, setSearchTerm, setSelectedLocation]);

  // --- API CALLS ---

  // 1. Fetch Categories
  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
        if (mounted) setCategories(res.data || []);
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
      }
    };
    fetchCategories();
    return () => { mounted = false; };
  }, []);

  // 2. Fetch Provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/tindang/tinhthanh");
        if (response.data) {
          setProvinces(response.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải tỉnh thành:", error);
      }
    };
    fetchProvinces();
  }, []);

  // 3. Fetch Search History
  const fetchSearchHistory = async () => {
    if (!user || !token) return;
    setLoadingHistory(true);
    try {
      const response = await axios.get(
        "http://localhost:5133/api/tindang/search-history?limit=5",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.length > 0) {
        setSearchHistory(response.data);
      } else {
        setSearchHistory([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch sử tìm kiếm:", error);
      setSearchHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 4. Save Search History
  const saveSearchHistory = async (keyword) => {
    if (!user || !token || !keyword.trim()) return;
    try {
      await axios.post(
        "http://localhost:5133/api/tindang/save-search-history",
        { keyword: keyword.trim() },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      fetchSearchHistory();
    } catch (error) {
      console.error("Lỗi khi lưu lịch sử tìm kiếm:", error);
    }
  };

  // 5. Delete Search History Item
  const deleteSearchHistoryItem = async (historyId, event) => {
    event.stopPropagation();
    if (!user || !token) return;
    try {
      await axios.delete(
        `http://localhost:5133/api/tindang/search-history/${historyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchHistory(prev => prev.filter(item => item.id !== historyId));
      toast.success("Đã xóa lịch sử tìm kiếm", { duration: 2000, position: "top-center", style: { background: "#1e1e1e", color: "#fff", fontSize: "14px" } });
    } catch (error) {
      console.error("Lỗi khi xóa lịch sử tìm kiếm:", error);
      toast.error("Không thể xóa lịch sử tìm kiếm");
    }
  };

  // 6. Fetch Suggestions
  const fetchSuggestions = async (searchText) => {
    if (!searchText || searchText.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const response = await axios.get(
        `http://localhost:5133/api/tindang/suggestions?query=${encodeURIComponent(searchText.trim())}&limit=8`
      );
      if (response.data && response.data.length > 0) {
        setSuggestions(response.data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Lỗi khi tải gợi ý:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounce for input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Load history on login
  useEffect(() => {
    if (user && token) {
      fetchSearchHistory();
    }
  }, [user, token]);

  // ----------------------------------------------------------------
  // 3. SEARCH EVENT HANDLERS
  // ----------------------------------------------------------------

  const handleSearch = async (searchQuery = null) => {
    const queryToSearch = searchQuery || inputValue;
    if (!queryToSearch.trim()) {
      toast.error("Vui lòng nhập từ khóa tìm kiếm!", {
        id: "search-error",
        duration: 2000,
        position: "top-center",
        style: { background: "#1e1e1e", color: "#fff", fontSize: "14px", fontWeight: 500, padding: "12px 16px", borderRadius: "10px" },
        icon: "🔍",
      });
      return;
    }
    setSearchTerm(queryToSearch);
    setShowSuggestions(false);
    await saveSearchHistory(queryToSearch);

    // --- LOGIC TẠO URL ---
    const params = new URLSearchParams();
    params.set('search', queryToSearch);

    const currentLoc = selectedLocation ? selectedLocation.trim() : "";
    
    const isNationwide = currentLoc === "" || currentLoc.toLowerCase() === "toàn quốc";
    
    if (!isNationwide) {
      params.set('location', currentLoc);
    }

    // Điều hướng
    if (location.pathname !== "/loc-tin-dang") {
      navigate(`/loc-tin-dang?${params.toString()}`);
    } else {
      navigate(`?${params.toString()}`);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setInputValue(suggestion.tieuDe);
    setShowSuggestions(false);
    await handleSearch(suggestion.tieuDe);
  };

  const handleHistoryClick = async (historyItem) => {
    setInputValue(historyItem.keyword);
    setShowSuggestions(false);
    await handleSearch(historyItem.keyword);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (inputValue.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (!inputValue.trim() && user && searchHistory.length > 0) {
      setShowSuggestions(true);
    }
  };

  // --- Helper Functions ---
  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? <span key={index} className="SearchBarSuggestionHighlight">{part}</span> : part
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // ----------------------------------------------------------------
  // 4. LOGIC POPUP ĐỊA ĐIỂM
  // ----------------------------------------------------------------

  const handleLocationClick = () => {
    if (!showLocationDropdown) {
        setPopupView('PROVINCE');
        setLocationSearchText("");
    }
    setShowLocationDropdown(!showLocationDropdown);
    setShowSuggestions(false);
  };

  const handleSelectNationwide = () => {
    setSelectedLocation("Toàn quốc");
    setTempCity(null);
    setShowLocationDropdown(false);
  };

  const handleSelectCity = (city) => {
    setTempCity(city);
    setLocationSearchText("");
    setPopupView('DISTRICT');
  };

  const handleBackToProvinces = () => {
    setPopupView('PROVINCE');
    setLocationSearchText("");
  };

  const handleSelectDistrict = (districtName) => {
    let finalLocation = "";
    if (districtName === "Tất cả") {
        finalLocation = tempCity.tenTinhThanh;
    } else {
        finalLocation = `${districtName}, ${tempCity.tenTinhThanh}`;
    }
    
    setSelectedLocation(finalLocation);
    setShowLocationDropdown(false);
  };

  const filteredProvinces = provinces.filter(p => 
    p.tenTinhThanh.toLowerCase().includes(locationSearchText.toLowerCase())
  );

  const filteredDistricts = tempCity ? tempCity.quanHuyens.filter(d => 
    d.tenQuanHuyen.toLowerCase().includes(locationSearchText.toLowerCase())
  ) : [];

  const shouldShowNationwide = "toàn quốc".includes(locationSearchText.toLowerCase());

  // ----------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------

  return (
    <div className="mp-hero-wrapper">
      {/* HEADER LOGO */}
      <header className="mp-hero-top" ref={bannerRef}>
        <div className="nav-left">
          <a className="logo-link" href="/" onClick={(e) => { e.preventDefault(); navigate('/market'); }}>
            <img src="/logoWeb (1).png" alt="Unimarket" className="logo-img" />
          </a>
        </div>
      </header>

      {/* SEARCH ROW */}
      <div className="mp-search-row">
        <div className="mp-search-inner">
          <div className="hero-search-bar">

            {/* 1. Danh mục Dropdown (ĐÃ SỬA LỖI BIẾN MẤT) */}
            <div 
              className="search-category-wrapper"
              onMouseEnter={() => {
                // Khi chuột vào: Xóa timer đóng (nếu có) và hiện menu ngay
                if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                setShowCategoryDropdown(true);
              }}
              onMouseLeave={() => {
                // Khi chuột ra: Đợi 1 chút (300ms) rồi mới đóng
                hoverTimerRef.current = setTimeout(() => {
                  setShowCategoryDropdown(false);
                }, HOVER_CLOSE_DELAY_MS);
              }}
            >
              <button className="search-category-btn">
                Danh mục <span className="icon-chevron"><IconChevronDown /></span>
              </button>

              {showCategoryDropdown && (
                <div className="hero-dropdown-content">
                  {categories.map((parent) => (
                    <div key={parent.id} className="hero-parent-item">
                      <div className="hero-parent-link" onClick={() => {
                          setSelectedCategory(parent.tenDanhMucCha);
                          navigate('/loc-tin-dang');
                      }}>
                        {parent.icon && <img src={parent.icon} alt="" className="hero-cat-icon" />}
                        {parent.tenDanhMucCha}
                      </div>
                      
                      {parent.danhMucCon && parent.danhMucCon.length > 0 && (
                        <div className="hero-sub-menu">
                          {parent.danhMucCon.map((child) => (
                            <div key={child.id} className="hero-sub-link" onClick={() => {
                                setSelectedCategory(parent.tenDanhMucCha);
                                setSelectedSubCategory(child.tenDanhMucCon);
                                navigate('/loc-tin-dang');
                            }}>
                              {child.tenDanhMucCon}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="search-divider"></div>

            {/* 2. Ô nhập liệu */}
            <div className="search-input-area" ref={suggestionsRef} style={{ position: 'relative' }}>
              <span className="search-icon"><IconSearch /></span>
              
              <input
                type="text"
                className="hero-input-field"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', paddingLeft: '8px' }}
                placeholder="Tìm kiếm sản phẩm trên Unimarket"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
              />
              
              {showSuggestions && (
                <div className="SearchBarSuggestionsDropdown" style={{ top: '45px', left: '-40px', width: '140%' }}> 
                  {!inputValue.trim() && user && searchHistory.length > 0 && (
                    <>
                      <div className="SearchBarSuggestionsHeader">
                        <span className="SearchBarSuggestionsTitle">Lịch sử tìm kiếm</span>
                      </div>
                      {searchHistory.map((historyItem) => (
                        <div
                          key={historyItem.id}
                          className="SearchBarSuggestionItem SearchBarHistoryItem"
                          onClick={() => handleHistoryClick(historyItem)}
                        >
                          <FaClock className="SearchBarSuggestionIcon SearchBarHistoryIcon" />
                          <div className="SearchBarSuggestionContent">
                            <div className="SearchBarSuggestionTitle">{historyItem.keyword}</div>
                            <div className="SearchBarSuggestionCategory">{formatDate(historyItem.createdAt)}</div>
                          </div>
                          <button
                            className="SearchBarHistoryDelete"
                            onClick={(e) => deleteSearchHistoryItem(historyItem.id, e)}
                            title="Xóa lịch sử"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  {inputValue.trim() && (
                    <>
                      <div className="SearchBarSuggestionsHeader">
                        <span className="SearchBarSuggestionsTitle">Tìm kiếm từ khóa "{inputValue}"</span>
                      </div>
                      
                      {loadingSuggestions ? (
                        <div className="SearchBarSuggestionLoading">
                          <span>Đang tìm kiếm...</span>
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.maTinDang}-${index}`}
                            className="SearchBarSuggestionItem"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <FaSearch className="SearchBarSuggestionIcon" />
                            <div className="SearchBarSuggestionContent">
                              <div className="SearchBarSuggestionTitle">
                                {highlightText(suggestion.tieuDe, inputValue)}
                              </div>
                              <div className="SearchBarSuggestionCategory">
                                trong {suggestion.danhMucCha}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="SearchBarSuggestionEmpty">
                          <span>Không tìm thấy gợi ý nào</span>
                        </div>
                      )}
                    </>
                  )}

                  {!inputValue.trim() && user && searchHistory.length === 0 && !loadingHistory && (
                    <div className="SearchBarSuggestionEmpty"><span>Chưa có lịch sử tìm kiếm</span></div>
                  )}
                  {!inputValue.trim() && !user && (
                    <div className="SearchBarSuggestionEmpty"><span>Đăng nhập để xem lịch sử tìm kiếm</span></div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Nút Địa điểm */}
            <div className="search-location-wrapper" ref={dropdownLocationRef} style={{ position: 'relative' }}>
                <button className="location-btn" onClick={handleLocationClick}>
                  <IconLocation />
                  <span className="loc-text">
                    {(selectedLocation && selectedLocation.trim() !== "") ? selectedLocation : "Toàn quốc"}
                  </span>
                  <IconChevronDown />
                </button>

                {showLocationDropdown && (
                  <div className="LocationPopupCard">
                    <div className="LocationPopupHeader">
                        {popupView === 'DISTRICT' && (
                            <button className="LocationBackBtn" onClick={handleBackToProvinces}>
                                <FaArrowLeft />
                            </button>
                        )}
                        <span className="LocationPopupTitleText">
                            {popupView === 'PROVINCE' ? "Chọn tỉnh thành" : "Chọn quận huyện"}
                        </span>
                    </div>

                    <div className="LocationSearchWrapper">
                        <FaSearch className="LocationSearchIcon" />
                        <input 
                            type="text" 
                            className="LocationSearchInput"
                            placeholder={popupView === 'PROVINCE' ? "Tìm tỉnh thành" : "Tìm quận huyện"}
                            value={locationSearchText}
                            onChange={(e) => setLocationSearchText(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="LocationListWrapper">
                        
                        {/* DANH SÁCH TỈNH */}
                        {popupView === 'PROVINCE' && (
                            <>
                                {shouldShowNationwide && (
                                  <div 
                                      className="LocationItem"
                                      onClick={handleSelectNationwide}
                                  >
                                      <span className={`LocationItemName ${(!selectedLocation || selectedLocation === "Toàn quốc") ? 'active-text' : ''}`}>
                                          Toàn quốc
                                      </span>
                                      {(!selectedLocation || selectedLocation === "Toàn quốc") && (
                                          <div className="LocationCheckIcon"><FaCheck /></div>
                                      )}
                                  </div>
                                )}

                                {filteredProvinces.map(city => (
                                    <div 
                                        key={city.maTinhThanh} 
                                        className="LocationItem"
                                        onClick={() => handleSelectCity(city)}
                                    >
                                        <span className={`LocationItemName ${tempCity?.maTinhThanh === city.maTinhThanh ? 'active-text' : ''}`}>
                                            {city.tenTinhThanh}
                                        </span>
                                        {tempCity?.maTinhThanh === city.maTinhThanh && (
                                            <div className="LocationCheckIcon"><FaCheck /></div>
                                        )}
                                    </div>
                                ))}
                                
                                {filteredProvinces.length === 0 && !shouldShowNationwide && (
                                    <div className="LocationEmpty">Không tìm thấy tỉnh thành</div>
                                )}
                            </>
                        )}

                        {/* DANH SÁCH HUYỆN */}
                        {popupView === 'DISTRICT' && (
                            <>
                                <div 
                                    className="LocationItem"
                                    onClick={() => handleSelectDistrict("Tất cả")}
                                >
                                    <span className="LocationItemName">Tất cả</span>
                                </div>

                                {filteredDistricts.map(dist => (
                                    <div 
                                        key={dist.maQuanHuyen} 
                                        className="LocationItem"
                                        onClick={() => handleSelectDistrict(dist.tenQuanHuyen)}
                                    >
                                        <span className="LocationItemName">{dist.tenQuanHuyen}</span>
                                    </div>
                                ))}
                                {filteredDistricts.length === 0 && (
                                    <div className="LocationEmpty">Không tìm thấy quận huyện</div>
                                )}
                            </>
                        )}

                    </div>
                  </div>
                )}
            </div>

            {/* 4. Nút Tìm kiếm */}
            <button className="hero-search-btn" onClick={() => handleSearch()}>
              Tìm kiếm
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketHeroHeader;