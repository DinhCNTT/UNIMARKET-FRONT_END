import React, { useContext, useState, useEffect, useRef } from "react";
import "./SearchBar.css";
import { FaSearch, FaMapMarkerAlt, FaClock, FaTimes } from "react-icons/fa";
import { SearchContext } from "../context/SearchContext";
import { LocationContext } from "../context/LocationContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

const SearchBar = () => {
  const { setSearchTerm } = useContext(SearchContext);
  const { selectedLocation, setSelectedLocation } = useContext(LocationContext);
  const { user, token } = useContext(AuthContext);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const dropdownRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const cities = ["Hồ Chí Minh", "Hà Nội"];

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get("search");
    if (searchQuery) {
      setInputValue(searchQuery);
      setSearchTerm(searchQuery);
    }
  }, [location.search, setSearchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search history
  const fetchSearchHistory = async () => {
    if (!user || !token) return;
    
    setLoadingHistory(true);
    try {
      const response = await axios.get(
        "http://localhost:5133/api/tindang/search-history?limit=5",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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

  // Save search history
  const saveSearchHistory = async (keyword) => {
    if (!user || !token || !keyword.trim()) return;
    
    try {
      await axios.post(
        "http://localhost:5133/api/tindang/save-search-history",
        { keyword: keyword.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      // Refresh search history after saving
      fetchSearchHistory();
    } catch (error) {
      console.error("Lỗi khi lưu lịch sử tìm kiếm:", error);
    }
  };

  // Delete search history item
  const deleteSearchHistoryItem = async (historyId, event) => {
    event.stopPropagation(); // Prevent triggering search
    
    if (!user || !token) return;
    
    try {
      await axios.delete(
        `http://localhost:5133/api/tindang/search-history/${historyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Remove item from local state
      setSearchHistory(prev => prev.filter(item => item.id !== historyId));
      toast.success("Đã xóa lịch sử tìm kiếm", {
        duration: 2000,
        position: "top-center",
        style: {
          background: "#1e1e1e",
          color: "#fff",
          fontSize: "14px",
        },
      });
    } catch (error) {
      console.error("Lỗi khi xóa lịch sử tìm kiếm:", error);
      toast.error("Không thể xóa lịch sử tìm kiếm", {
        duration: 2000,
        position: "top-center",
        style: {
          background: "#1e1e1e",
          color: "#fff",
          fontSize: "14px",
        },
      });
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
      console.error("Lỗi khi tải gợi ý:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Load search history when user is logged in
  useEffect(() => {
    if (user && token) {
      fetchSearchHistory();
    }
  }, [user, token]);

  const handleSearch = async (searchQuery = null) => {
    const queryToSearch = searchQuery || inputValue;
    
    if (!queryToSearch.trim()) {
      toast.error("Vui lòng nhập từ khóa tìm kiếm!", {
        id: "search-error",
        duration: 2000,
        position: "top-center",
        style: {
          background: "#1e1e1e",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 500,
          padding: "12px 16px",
          borderRadius: "10px",
        },
        icon: "🔍",
      });
      return;
    }

    setSearchTerm(queryToSearch);
    setShowSuggestions(false);

    // Save search history
    await saveSearchHistory(queryToSearch);

    // Build query params and include selected location if present
    const params = new URLSearchParams();
    params.set('search', queryToSearch);
    if (selectedLocation && selectedLocation.trim()) {
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
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleLocationClick = () => {
    setShowDropdown(!showDropdown);
    setShowSuggestions(false);
  };

  const handleCitySelect = (city) => {
    setSelectedLocation(city);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    // Show suggestions if there's input, otherwise show search history
    if (inputValue.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (!inputValue.trim() && user && searchHistory.length > 0) {
      setShowSuggestions(true);
    }
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="SearchBarSuggestionHighlight">{part}</span> : 
        part
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Hôm nay";
    } else if (diffDays === 1) {
      return "Hôm qua";
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  return (
    <div className="SearchBarContainer">
      <div className="SearchBarLocation" onClick={handleLocationClick} ref={dropdownRef}>
        <FaMapMarkerAlt className="SearchBarLocationIcon" />
        <span>{selectedLocation} ▼</span>
        {showDropdown && (
          <div className="SearchBarLocationDropdown">
            {cities.map((city) => (
              <div
                key={city}
                className="SearchBarLocationOption"
                onClick={() => handleCitySelect(city)}
              >
                {city}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="SearchBarInputContainer">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm trên Unimarket"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
        />
        
        {showSuggestions && (
          <div className="SearchBarSuggestionsDropdown" ref={suggestionsRef}>
            {/* Show search history when input is empty and user is logged in */}
            {!inputValue.trim() && user && searchHistory.length > 0 && (
              <>
                <div className="SearchBarSuggestionsHeader">
                  <span className="SearchBarSuggestionsTitle">
                    Lịch sử tìm kiếm
                  </span>
                </div>
                {searchHistory.map((historyItem) => (
                  <div
                    key={historyItem.id}
                    className="SearchBarSuggestionItem SearchBarHistoryItem"
                    onClick={() => handleHistoryClick(historyItem)}
                  >
                    <FaClock className="SearchBarSuggestionIcon SearchBarHistoryIcon" />
                    <div className="SearchBarSuggestionContent">
                      <div className="SearchBarSuggestionTitle">
                        {historyItem.keyword}
                      </div>
                      <div className="SearchBarSuggestionCategory">
                        {formatDate(historyItem.createdAt)}
                      </div>
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

            {/* Show suggestions when typing */}
            {inputValue.trim() && (
              <>
                <div className="SearchBarSuggestionsHeader">
                  <span className="SearchBarSuggestionsTitle">
                    Tìm kiếm từ khóa "{inputValue}"
                  </span>
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

            {/* Show message when no history and not typing */}
            {!inputValue.trim() && user && searchHistory.length === 0 && !loadingHistory && (
              <div className="SearchBarSuggestionEmpty">
                <span>Chưa có lịch sử tìm kiếm</span>
              </div>
            )}

            {/* Show login message when not logged in */}
            {!inputValue.trim() && !user && (
              <div className="SearchBarSuggestionEmpty">
                <span>Đăng nhập để xem lịch sử tìm kiếm</span>
              </div>
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