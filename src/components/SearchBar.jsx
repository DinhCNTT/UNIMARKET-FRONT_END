import React, { useContext, useState, useEffect, useRef } from "react";
import "./SearchBar.css";
import { 
  FaSearch, 
  FaMapMarkerAlt, 
  FaClock, 
  FaTimes, 
  FaChevronDown, 
  FaArrowLeft,
  FaCheck
} from "react-icons/fa";
import { SearchContext } from "../context/SearchContext";
import { LocationContext } from "../context/LocationContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

const SearchBar = () => {
  // Contexts
  const { setSearchTerm } = useContext(SearchContext);
  const { selectedLocation, setSelectedLocation } = useContext(LocationContext);
  const { user, token } = useContext(AuthContext);

  // Router
  const navigate = useNavigate();
  const location = useLocation();

  // Refs
  const suggestionsRef = useRef(null);
  const locationWrapperRef = useRef(null);

  // --- SEARCH STATES ---
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- LOCATION & MODAL STATES ---
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationStep, setLocationStep] = useState("MAIN"); // 'MAIN', 'PROVINCE', 'DISTRICT'
  
  // Data lists
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  // Temporary selection (camelCase standard)
  const [tempProvince, setTempProvince] = useState(null); // { maTinhThanh, tenTinhThanh }
  const [tempDistrict, setTempDistrict] = useState(null); // { maQuanHuyen, tenQuanHuyen }
  
  // Search filter inside location lists
  const [locationSearchKeyword, setLocationSearchKeyword] = useState("");

  // ==========================================
  // 1. INITIALIZATION & EFFECTS
  // ==========================================

  // FIX: Đồng bộ cả Search Term VÀ Location từ URL khi load trang
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    
    // 1. Sync Search keyword
    const searchQuery = queryParams.get("search");
    if (searchQuery) {
      setInputValue(searchQuery);
      setSearchTerm(searchQuery);
    }

    // 2. Sync Location (Quan trọng: Để khi F5 không bị mất vị trí)
    const locationQuery = queryParams.get("location");
    if (locationQuery) {
      setSelectedLocation(locationQuery);
    } else {
        // Nếu không có param location, mặc định set về Toàn quốc
        setSelectedLocation("Toàn quốc"); 
    }
  }, [location.search, setSearchTerm, setSelectedLocation]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target)) {
        setShowLocationModal(false);
        if (!showLocationModal) {
             setLocationStep("MAIN");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLocationModal]);

  // Load provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Load districts when tempProvince changes
  useEffect(() => {
    if (tempProvince?.maTinhThanh) {
      fetchDistricts(tempProvince.maTinhThanh);
    } else {
      setDistricts([]);
    }
  }, [tempProvince]);

  // Load search history when logged in
  useEffect(() => {
    if (user && token) {
      fetchSearchHistory();
    }
  }, [user, token]);

  // Debounce search suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);


  // ==========================================
  // 2. API FUNCTIONS (LOCATION)
  // ==========================================

  const fetchProvinces = async () => {
    try {
      const response = await axios.get("http://localhost:5133/api/tindang/tinhthanh");
      if (response.data) {
        setProvinces(response.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách tỉnh thành:", error);
    }
  };

  const fetchDistricts = async (maTinhThanh) => {
    try {
      const response = await axios.get(`http://localhost:5133/api/tindang/tinhthanh/${maTinhThanh}/quanhuynh`);
      if (response.data) {
        setDistricts(response.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách quận huyện:", error);
      setDistricts([]);
    }
  };

  // ==========================================
  // 3. API FUNCTIONS (SEARCH & HISTORY)
  // ==========================================

  const fetchSearchHistory = async () => {
    if (!user || !token) return;
    setLoadingHistory(true);
    try {
      const response = await axios.get(
        "http://localhost:5133/api/tindang/search-history?limit=5",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchHistory(response.data && response.data.length > 0 ? response.data : []);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
      setSearchHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

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
      console.error("Lỗi lưu lịch sử:", error);
    }
  };

  const deleteSearchHistoryItem = async (historyId, event) => {
    event.stopPropagation();
    if (!user || !token) return;
    try {
      await axios.delete(`http://localhost:5133/api/tindang/search-history/${historyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchHistory((prev) => prev.filter((item) => item.id !== historyId));
      toast.success("Đã xóa lịch sử tìm kiếm", { duration: 2000, position: "top-center", style: { background: "#1e1e1e", color: "#fff", fontSize: "14px" } });
    } catch (error) {
      toast.error("Lỗi khi xóa lịch sử", { duration: 2000, position: "top-center" });
    }
  };

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
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // ==========================================
  // 4. HANDLERS (LOCATION UI)
  // ==========================================

  const toggleLocationModal = () => {
    if (!showLocationModal) {
        setLocationStep("MAIN");
    }
    setShowLocationModal(!showLocationModal);
    setShowSuggestions(false);
  };

  const handleApplyLocation = () => {
    let finalLocationString = "";
    
    if (tempProvince) {
        if (tempDistrict && tempDistrict.maQuanHuyen !== "all") {
            finalLocationString = `${tempDistrict.tenQuanHuyen}, ${tempProvince.tenTinhThanh}`;
        } else {
            finalLocationString = tempProvince.tenTinhThanh;
        }
    } else {
        finalLocationString = "Toàn quốc";
    }

    setSelectedLocation(finalLocationString);
    setShowLocationModal(false);
  };

  const handleSelectProvince = (prov) => {
    setTempProvince(prov);
    setTempDistrict(null); 
    setDistricts([]); 
    setLocationSearchKeyword(""); 
    setLocationStep("MAIN"); 
  };

  const handleSelectDistrict = (dist) => {
    setTempDistrict(dist);
    setLocationSearchKeyword("");
    setLocationStep("MAIN");
  };

  const getFilteredProvinces = () => {
    if (!locationSearchKeyword) return provinces;
    return provinces.filter(p => p.tenTinhThanh?.toLowerCase().includes(locationSearchKeyword.toLowerCase()));
  };

  const getFilteredDistricts = () => {
    let list = districts;
    if (locationSearchKeyword) {
      list = districts.filter(d => d.tenQuanHuyen?.toLowerCase().includes(locationSearchKeyword.toLowerCase()));
    }
    return list;
  };

  // ==========================================
  // 5. HANDLERS (SEARCH ACTIONS)
  // ==========================================

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

    const params = new URLSearchParams();
    params.set('search', queryToSearch);
    
    // FIX: Bỏ điều kiện !== "Toàn quốc". 
    // Luôn gửi location lên URL, kể cả khi là "Toàn quốc" để backend biết là user muốn xem tất cả.
    if (selectedLocation) {
      params.set('location', selectedLocation.trim());
    }

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
    if (e.key === "Enter") handleSearch();
    else if (e.key === "Escape") setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (inputValue.trim() && suggestions.length > 0) setShowSuggestions(true);
    else if (!inputValue.trim() && user && searchHistory.length > 0) setShowSuggestions(true);
  };

  const highlightText = (text, query) => {
    if (!text || !query.trim()) return text;
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? <span key={index} className="SearchBarSuggestionHighlight">{part}</span> : part
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // ==========================================
  // 6. RENDER SUB-COMPONENTS (LOCATION MODAL)
  // ==========================================

  const renderLocationMain = () => (
    <div className="LocModalMain">
        <div className="LocModalHeader">Khu vực</div>
        
        <div className="LocModalInputGroup">
            <label>Chọn tỉnh thành <span className="LocRequired">*</span></label>
            <div className="LocModalSelectBox" onClick={() => {
                setLocationSearchKeyword("");
                setLocationStep("PROVINCE");
            }}>
                <span>{tempProvince ? tempProvince.tenTinhThanh : "Toàn quốc"}</span>
                <FaChevronDown />
            </div>
        </div>

        <div className="LocModalInputGroup">
            <label>Chọn quận huyện <span className="LocRequired">*</span></label>
            <div 
                className={`LocModalSelectBox ${!tempProvince ? "LocDisabled" : ""}`}
                onClick={() => {
                    if (tempProvince) {
                        setLocationSearchKeyword("");
                        setLocationStep("DISTRICT");
                    }
                }}
            >
                <span>{tempDistrict ? (tempDistrict.maQuanHuyen === 'all' ? "Tất cả" : tempDistrict.tenQuanHuyen) : "Tất cả"}</span>
                <FaChevronDown />
            </div>
        </div>

        <button className="LocModalApplyBtn" onClick={handleApplyLocation}>
            Áp dụng
        </button>
    </div>
  );

  const renderLocationList = (type) => { 
    const isProvince = type === 'PROVINCE';
    const title = isProvince ? "Tỉnh thành" : "Quận huyện";
    const items = isProvince ? getFilteredProvinces() : getFilteredDistricts();
    
    return (
        <div className="LocModalListContainer">
            <div className="LocModalListHeader">
                <button className="LocBackBtn" onClick={() => setLocationStep("MAIN")}>
                    <FaArrowLeft />
                </button>
                <span className="LocListTitle">{title}</span>
            </div>

            <div className="LocSearchInputWrapper">
                <FaSearch className="LocSearchIcon"/>
                <input 
                    type="text" 
                    placeholder={`Tìm ${title.toLowerCase()}`}
                    value={locationSearchKeyword}
                    onChange={(e) => setLocationSearchKeyword(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="LocListScroll">
                <div 
                    className="LocListItem"
                    onClick={() => isProvince ? handleSelectProvince(null) : handleSelectDistrict({ maQuanHuyen: 'all', tenQuanHuyen: 'Tất cả' })}
                >
                    <span>{isProvince ? "Toàn quốc" : "Tất cả"}</span>
                    {((isProvince && !tempProvince) || (!isProvince && tempDistrict?.maQuanHuyen === 'all')) && (
                        <FaCheck className="LocCheckIcon" />
                    )}
                    {(!isProvince && !tempDistrict) && (
                         <FaCheck className="LocCheckIcon" />
                    )}
                </div>

                {items && items.length > 0 ? items.map((item) => {
                    const isSelected = isProvince 
                        ? tempProvince?.maTinhThanh === item.maTinhThanh 
                        : tempDistrict?.maQuanHuyen === item.maQuanHuyen;
                    
                    return (
                        <div 
                            key={isProvince ? item.maTinhThanh : item.maQuanHuyen}
                            className="LocListItem"
                            onClick={() => isProvince ? handleSelectProvince(item) : handleSelectDistrict(item)}
                        >
                            <span>{isProvince ? item.tenTinhThanh : item.tenQuanHuyen}</span>
                            <div className={`LocRadioCircle ${isSelected ? "LocSelected" : ""}`}>
                                {isSelected && <FaCheck />}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="LocEmptyResult">Không tìm thấy kết quả</div>
                )}
            </div>
        </div>
    );
  };

  // ==========================================
  // 7. MAIN RENDER
  // ==========================================

  return (
    <div className="SearchBarContainer">
      <div className="SearchBarLocationWrapper" ref={locationWrapperRef}>
        <div className="SearchBarLocationBtn" onClick={toggleLocationModal}>
          <FaMapMarkerAlt className="SearchBarLocationIcon" />
          <span className="SearchBarLocationText">
             {selectedLocation && selectedLocation !== "Toàn quốc" ? selectedLocation : "Toàn quốc"}
          </span>
          <FaChevronDown className="SearchBarChevron" size={10} />
        </div>

        {showLocationModal && (
            <div className="LocationModalDropdown">
                {locationStep === "MAIN" && renderLocationMain()}
                {locationStep === "PROVINCE" && renderLocationList("PROVINCE")}
                {locationStep === "DISTRICT" && renderLocationList("DISTRICT")}
            </div>
        )}
      </div>

      <div className="SearchBarDivider"></div>

      <div className="SearchBarInputContainer">
        <input
          type="text"
          placeholder="Tìm sản phẩm trên Unimarket..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
        />
        
        {showSuggestions && (
          <div className="SearchBarSuggestionsDropdown" ref={suggestionsRef}>
            {!inputValue.trim() && user && searchHistory.length > 0 && (
              <>
                <div className="SearchBarSuggestionsHeader">
                  <span className="SearchBarSuggestionsTitle">Lịch sử tìm kiếm</span>
                </div>
                {searchHistory.map((item) => (
                  <div key={item.id} className="SearchBarSuggestionItem SearchBarHistoryItem" onClick={() => handleHistoryClick(item)}>
                    <FaClock className="SearchBarSuggestionIcon SearchBarHistoryIcon" />
                    <div className="SearchBarSuggestionContent">
                      <div className="SearchBarSuggestionTitle">{item.keyword}</div>
                      <div className="SearchBarSuggestionCategory">{formatDate(item.createdAt)}</div>
                    </div>
                    <button className="SearchBarHistoryDelete" onClick={(e) => deleteSearchHistoryItem(item.id, e)}><FaTimes /></button>
                  </div>
                ))}
              </>
            )}
            
            {inputValue.trim() && (
              <>
                <div className="SearchBarSuggestionsHeader">
                  <span className="SearchBarSuggestionsTitle">Tìm kiếm "{inputValue}"</span>
                </div>
                {loadingSuggestions ? (
                  <div className="SearchBarSuggestionLoading">Đang tìm kiếm...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((s, idx) => (
                    <div key={`${s.maTinDang}-${idx}`} className="SearchBarSuggestionItem" onClick={() => handleSuggestionClick(s)}>
                      <FaSearch className="SearchBarSuggestionIcon" />
                      <div className="SearchBarSuggestionContent">
                        <div className="SearchBarSuggestionTitle">{highlightText(s.tieuDe, inputValue)}</div>
                        <div className="SearchBarSuggestionCategory">trong {s.danhMucCha}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="SearchBarSuggestionEmpty">Không tìm thấy gợi ý nào</div>
                )}
              </>
            )}

            {!inputValue.trim() && user && searchHistory.length === 0 && !loadingHistory && (
                 <div className="SearchBarSuggestionEmpty">Chưa có lịch sử tìm kiếm</div>
            )}
            {!inputValue.trim() && !user && (
                 <div className="SearchBarSuggestionEmpty">Đăng nhập để xem lịch sử</div>
            )}
          </div>
        )}
      </div>

      <button className="SearchBarBtn" onClick={() => handleSearch()}>
        <FaSearch />
      </button>
    </div>
  );
};

export default SearchBar;