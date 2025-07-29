import React, { useState, useRef, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { CgSearchLoading } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import "./VideoSearchOverlay.css";

export default function VideoSearchOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load lịch sử
  useEffect(() => {
    const stored = localStorage.getItem("videoSearchHistory");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  // Gợi ý từ khóa từ backend
  useEffect(() => {
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `http://localhost:5133/api/Video/suggest-keywords?keyword=${encodeURIComponent(
            keyword
          )}&limit=10`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Lỗi gợi ý từ khóa:", err);
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [keyword]);

  // Lưu lịch sử
  const saveHistory = (kw) => {
    if (!kw.trim()) return;
    let newHistory = [kw, ...history.filter((h) => h !== kw)];
    if (newHistory.length > 5) newHistory = newHistory.slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("videoSearchHistory", JSON.stringify(newHistory));
  };

  const removeHistory = (kw) => {
    const newHistory = history.filter((h) => h !== kw);
    setHistory(newHistory);
    localStorage.setItem("videoSearchHistory", JSON.stringify(newHistory));
  };

  // Mở popup
  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  };

  // Đóng popup
  const handleClose = () => {
    setIsOpen(false);
    setKeyword("");
    setSuggestions([]);
  };

  // Tìm kiếm và chuyển trang
  const doSearchAndRedirect = (kw) => {
    if (!kw.trim()) return;
    saveHistory(kw);
    handleClose();
    navigate(`/search/${encodeURIComponent(kw)}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    doSearchAndRedirect(keyword);
  };

  // Khi chọn từ khóa từ lịch sử/gợi ý
  const onSelectKeyword = (kw) => {
    setKeyword(kw);
    doSearchAndRedirect(kw);
  };

  // Đóng popup nếu click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        isOpen
      ) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div
      className={`video-search-container ${isOpen ? "open" : "closed"}`}
      ref={containerRef}
    >
      {/* Nút tìm kiếm */}
      <button
        className={`video-search-btn ${isOpen ? "small" : "large"}`}
        onClick={() => {
          if (!isOpen) handleOpen();
        }}
        aria-label="Mở tìm kiếm"
        type="button"
      >
        <FiSearch size={20} />
        {!isOpen && <span className="search-btn-text">Search</span>}
      </button>

      {/* Popup tìm kiếm */}
      <div className={`video-search-popup ${isOpen ? "visible" : ""}`}>
        <div className="video-search-popup-body">
          <form onSubmit={handleSearch} className="video-search-popup-form">
            <input
              ref={inputRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Bạn cần tìm gì?"
              className="video-search-popup-input"
              autoComplete="off"
              autoFocus={isOpen}
              maxLength={80} // Giới hạn 80 ký tự
            />
            <button
              type="button"
              className="popup-close-btn"
              onClick={handleClose}
              aria-label="Đóng tìm kiếm"
            >
              <FiX size={24} />
            </button>
          </form>

          {/* Lịch sử tìm kiếm */}
          {keyword.trim() === "" && (
            <ul className="video-search-history-list">
              {history.length === 0 ? (
                <li className="video-search-no-history">
                  Chưa có lịch sử tìm kiếm
                </li>
              ) : (
                history.map((kw, idx) => (
                  <li key={idx} className="video-search-history-item">
                    <button
                      type="button"
                      className="video-search-history-keyword-btn"
                      onClick={() => onSelectKeyword(kw)}
                    >
                      <CgSearchLoading size={20} className="video-search-history-icon"/> {kw}
                    </button>
                    <button
                      type="button"
                      className="history-remove-btn"
                      onClick={() => removeHistory(kw)}
                      aria-label={`Xóa ${kw} khỏi lịch sử`}
                    >
                      <FiX size={16} />
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}

          {/* Gợi ý từ khóa */}
          {keyword.trim() !== "" && suggestions.length > 0 && (
            <ul className="video-search-suggestions-list">
              {suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  className="video-search-suggestion-item"
                  onClick={() => onSelectKeyword(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}