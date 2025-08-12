import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./VideoSearchOverlay.css";
import { FiSearch, FiClock, FiX } from "react-icons/fi";

export default function VideoSearchOverlay({ isOpen, onClose = () => {} }) {
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("videoSearchHistory");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }
    let canceled = false;
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `http://localhost:5133/api/Video/suggest-keywords?keyword=${encodeURIComponent(
            keyword
          )}&limit=10`
        );
        const data = await res.json();
        if (!canceled) setSuggestions(data);
      } catch (err) {
        console.error("Lỗi gợi ý từ khóa:", err);
        if (!canceled) setSuggestions([]);
      }
    };
    fetchSuggestions();
    return () => {
      canceled = true;
    };
  }, [keyword]);

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

  const doSearchAndRedirect = (kw) => {
    if (!kw.trim()) return;
    saveHistory(kw);
    setKeyword("");
    onClose();
    navigate(`/search/${encodeURIComponent(kw)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearchAndRedirect(keyword);
  };

  const onSelectKeyword = (kw) => {
    doSearchAndRedirect(kw);
  };

  // Chặn propagation sự kiện để không ảnh hưởng đến VideoDetailViewer
  const stopEventPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`video-search-panel ${isOpen ? "open" : ""}`}
      onWheel={stopEventPropagation}
      onTouchMove={stopEventPropagation}
      onScroll={stopEventPropagation}
      onTouchStart={stopEventPropagation}
      onTouchEnd={stopEventPropagation}
    >
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-wrapper">
          <label className="search-label">Search</label>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Bạn cần tìm gì?"
            maxLength={80}
            autoComplete="off"
          />
          {keyword.length > 0 && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setKeyword("")}
              aria-label="Xóa"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
      </form>
    <div className="search-body">
  {keyword.trim() === "" ? (
    <ul className="history-list">
      {history.length === 0 ? (
        <li className="no-history">Chưa có lịch sử tìm kiếm</li>
      ) : (
        history.map((kw, idx) => (
          <li className="history-item" key={idx}>
            <button
              type="button"
              className="history-key"
              onClick={() => onSelectKeyword(kw)}
            >
              <FiClock size={16} /> {kw}
            </button>
            <button
              type="button"
              className="history-remove"
              onClick={() => removeHistory(kw)}
              aria-label={`Xóa ${kw}`}
            >
              <FiX size={14} />
            </button>
          </li>
        ))
      )}
    </ul>
  ) : (
    suggestions.length > 0 && (
      <ul className="suggestions-list">
        {suggestions.map((s, i) => (
          <li
            key={i}
            className="suggestion-item"
            onClick={() => onSelectKeyword(s)}
          >
            <FiSearch size={16} style={{ marginRight: "6px" }} /> {s}
          </li>
        ))}
      </ul>
    )
  )}
</div>
    
    </div>
  );
}
