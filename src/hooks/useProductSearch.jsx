import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { SearchContext } from "../context/SearchContext";
import { LocationContext } from "../context/LocationContext"; // QUAN TRỌNG: Import Context

export const useProductSearch = () => {
  // --- Contexts ---
  const { user, token } = useContext(AuthContext);
  const { setSearchTerm } = useContext(SearchContext);
  
  // FIX: Lấy trực tiếp State từ LocationContext (Thay vì tạo state mới)
  const { selectedLocation, setSelectedLocation } = useContext(LocationContext);

  // --- Router ---
  const navigate = useNavigate();
  const location = useLocation();

  // --- Local States ---
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- 1. Sync URL to Input & Context ---
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get("search");
    const locationQuery = queryParams.get("location");

    // Sync Search
    if (searchQuery) {
      setInputValue(searchQuery);
      setSearchTerm(searchQuery);
    }
    
    // Sync Location (Nếu URL có location, cập nhật ngay vào Context)
    if (locationQuery) {
      setSelectedLocation(locationQuery);
    } 
  }, [location.search, setSearchTerm, setSelectedLocation]);

  // --- 2. Load History ---
  useEffect(() => {
    if (user && token) fetchSearchHistory();
  }, [user, token]);

  // --- 3. Debounce Suggestions ---
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // --- API Functions ---
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
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchSearchHistory = async () => {
    if (!user || !token) return;
    setLoadingHistory(true);
    try {
      const response = await axios.get(
        "http://localhost:5133/api/tindang/search-history?limit=5",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchHistory(response.data || []);
    } catch (error) {
      console.error(error);
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSearchHistory();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteSearchHistoryItem = async (historyId, event) => {
    event?.stopPropagation();
    if (!user || !token) return;
    try {
      await axios.delete(`http://localhost:5133/api/tindang/search-history/${historyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchHistory((prev) => prev.filter((item) => item.id !== historyId));
      toast.success("Đã xóa lịch sử tìm kiếm");
    } catch (error) {
      toast.error("Lỗi khi xóa lịch sử");
    }
  };

  // --- Handlers ---
  const handleSearch = async (overrideQuery = null) => {
    const queryToSearch = overrideQuery || inputValue;
    if (!queryToSearch.trim()) {
      toast.error("Vui lòng nhập từ khóa tìm kiếm!");
      return;
    }

    setSearchTerm(queryToSearch);
    setShowSuggestions(false);
    await saveSearchHistory(queryToSearch);

    const params = new URLSearchParams();
    params.set("search", queryToSearch);
    
    // FIX: Luôn gửi location hiện tại lên URL để LocMoRong đọc được
    if (selectedLocation) {
      params.set("location", selectedLocation.trim());
    }

    const path = location.pathname === "/loc-tin-dang" ? "" : "/loc-tin-dang";
    navigate(`${path}?${params.toString()}`);
  };

  // Utilities
  const highlightText = (text, query) => {
    // Trả về JSX ở đây (Lý do phải đổi tên file thành .jsx)
    if (!text || !query.trim()) return text;
    const regex = new RegExp(`(${query.trim()})`, "gi");
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
    return date.toLocaleDateString("vi-VN");
  };

  return {
    inputValue, setInputValue,
    suggestions, searchHistory,
    showSuggestions, setShowSuggestions,
    loadingSuggestions, loadingHistory,
    user,
    handleSearch,
    deleteSearchHistoryItem,
    highlightText,
    formatDate,
    selectedLocation, // Trả về giá trị thực từ Context
    setSelectedLocation // Trả về hàm set thực từ Context
  };
};