import React, { useState, useEffect, useRef } from "react";
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
import axios from "axios";
import { useProductSearch } from "../hooks/useProductSearch"; // Import Hook

const SearchBar = () => {
  // ==========================================
  // 1. LOGIC TÌM KIẾM (TỪ CUSTOM HOOK)
  // ==========================================
  const {
    inputValue, setInputValue,
    suggestions, searchHistory,
    showSuggestions, setShowSuggestions,
    loadingSuggestions, loadingHistory,
    user,
    handleSearch,
    deleteSearchHistoryItem,
    highlightText,
    formatDate,
    selectedLocation, // Lấy location hiện tại từ context (qua hook)
    setSelectedLocation // Lấy hàm set từ context (qua hook)
  } = useProductSearch();

  // ==========================================
  // 2. LOGIC ĐỊA ĐIỂM (UI RIÊNG CỦA COMPONENT NÀY)
  // ==========================================
  const suggestionsRef = useRef(null);
  const locationWrapperRef = useRef(null);

  // Modal States
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationStep, setLocationStep] = useState("MAIN"); // 'MAIN', 'PROVINCE', 'DISTRICT'
  
  // Data lists
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  // Temporary selection (Cho việc chọn trong modal trước khi Apply)
  const [tempProvince, setTempProvince] = useState(null); 
  const [tempDistrict, setTempDistrict] = useState(null); 
  
  // Search filter inside location lists
  const [locationSearchKeyword, setLocationSearchKeyword] = useState("");

  // --- Click Outside Handler (Cho cả Search & Location) ---
  useEffect(() => {
    function handleClickOutside(event) {
      // Đóng gợi ý tìm kiếm
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      // Đóng modal địa điểm
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target)) {
        setShowLocationModal(false);
        // Reset về step MAIN khi đóng animation xong (hoặc đóng ngay)
        if (!showLocationModal) {
             setLocationStep("MAIN");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLocationModal, setShowSuggestions]);

  // --- API: Load Provinces/Districts ---
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/tindang/tinhthanh");
        if (response.data) setProvinces(response.data);
      } catch (error) {
        console.error("Lỗi lấy danh sách tỉnh thành:", error);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchDistricts = async (maTinhThanh) => {
      try {
        const response = await axios.get(`http://localhost:5133/api/tindang/tinhthanh/${maTinhThanh}/quanhuynh`);
        if (response.data) setDistricts(response.data);
      } catch (error) {
        setDistricts([]);
      }
    };

    if (tempProvince?.maTinhThanh) {
      fetchDistricts(tempProvince.maTinhThanh);
    } else {
      setDistricts([]);
    }
  }, [tempProvince]);

  // --- Handlers: Location Logic ---
  const toggleLocationModal = () => {
    if (!showLocationModal) {
        setLocationStep("MAIN");
    }
    setShowLocationModal(!showLocationModal);
    setShowSuggestions(false); // Đóng search suggestion nếu mở location
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

  // Filter lists
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
  // 3. RENDER SUB-COMPONENTS (LOCATION MODAL)
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
                    {/* Logic check icon hơi rối, giữ nguyên từ code cũ */}
                    {((isProvince && !tempProvince) || (!isProvince && tempDistrict?.maQuanHuyen === 'all')) && <FaCheck className="LocCheckIcon" />}
                    {(!isProvince && !tempDistrict) && <FaCheck className="LocCheckIcon" />}
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
  // 4. MAIN RENDER
  // ==========================================

  return (
    <div className="SearchBarContainer">
      {/* --- PHẦN 1: LOCATION PICKER --- */}
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

      {/* --- PHẦN 2: SEARCH INPUT --- */}
      <div className="SearchBarInputContainer">
        <input
          type="text"
          placeholder="Tìm sản phẩm trên Unimarket..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
            else if (e.key === "Escape") setShowSuggestions(false);
          }}
          onFocus={() => {
            if (inputValue.trim() || (user && searchHistory.length > 0)) {
                setShowSuggestions(true);
            }
          }}
        />
        
        {/* DROPDOWN GỢI Ý (Đã rút gọn nhờ Hook) */}
        {showSuggestions && (
          <div className="SearchBarSuggestionsDropdown" ref={suggestionsRef}>
            
            {/* Trường hợp 1: Hiển thị Lịch sử tìm kiếm */}
            {!inputValue.trim() && user && searchHistory.length > 0 && (
              <>
                <div className="SearchBarSuggestionsHeader">
                  <span className="SearchBarSuggestionsTitle">Lịch sử tìm kiếm</span>
                </div>
                {searchHistory.map((item) => (
                  <div key={item.id} className="SearchBarSuggestionItem SearchBarHistoryItem" onClick={() => {
                      setInputValue(item.keyword);
                      handleSearch(item.keyword);
                  }}>
                    <FaClock className="SearchBarSuggestionIcon SearchBarHistoryIcon" />
                    <div className="SearchBarSuggestionContent">
                      <div className="SearchBarSuggestionTitle">{item.keyword}</div>
                      <div className="SearchBarSuggestionCategory">{formatDate(item.createdAt)}</div>
                    </div>
                    <button className="SearchBarHistoryDelete" onClick={(e) => deleteSearchHistoryItem(item.id, e)}>
                        <FaTimes />
                    </button>
                  </div>
                ))}
              </>
            )}
            
            {/* Trường hợp 2: Hiển thị Gợi ý từ API */}
            {inputValue.trim() && (
              <>
                <div className="SearchBarSuggestionsHeader">
                  <span className="SearchBarSuggestionsTitle">Tìm kiếm "{inputValue}"</span>
                </div>
                {loadingSuggestions ? (
                  <div className="SearchBarSuggestionLoading">Đang tìm kiếm...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((s, idx) => (
                    <div key={`${s.maTinDang}-${idx}`} className="SearchBarSuggestionItem" onClick={() => {
                        setInputValue(s.tieuDe);
                        handleSearch(s.tieuDe);
                    }}>
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

            {/* Các trường hợp Empty */}
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