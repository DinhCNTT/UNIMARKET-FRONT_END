import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./VideoSearchOverlay.css";
import { FiSearch, FiClock, FiX } from "react-icons/fi";
import { AuthContext } from '../context/AuthContext';
import { viewHistoryService } from '../services/viewHistoryService';

export default function VideoSearchOverlay({ isOpen, onClose = () => {} }) {
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  
  // Lấy thông tin user từ AuthContext
  const { user, token } = useContext(AuthContext);

 // Debug: Log context values khi component mount
  useEffect(() => {
    console.log("🎯 VideoSearchOverlay mounted");
    console.log("👤 AuthContext user:", user);
    console.log("🔑 AuthContext token:", token ? "exists" : "missing");
  }, [user, token]);

  // Load lịch sử tìm kiếm từ server khi có user
  const loadSearchHistory = async () => {
    if (!user || !token) {
      setHistory([]);
      return;
    }

    try {
      const response = await fetch('http://localhost:5133/api/Video/search-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.map(item => item.keyword));
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử tìm kiếm:', error);
      setHistory([]);
    }
  };

  // Load lịch sử khi component mount hoặc user thay đổi
  useEffect(() => {
    loadSearchHistory();
  }, [user, token]);

  // Listen cho clear search history UI event
  useEffect(() => {
    const handleClearSearchHistoryUI = () => {
      setHistory([]);
    };

    window.addEventListener('clearSearchHistoryUI', handleClearSearchHistoryUI);
    
    return () => {
      window.removeEventListener('clearSearchHistoryUI', handleClearSearchHistoryUI);
    };
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

  // Lưu lịch sử tìm kiếm lên server
  const saveHistory = async (kw) => {
    if (!kw.trim() || !user || !token) return;

    try {
      const response = await fetch('http://localhost:5133/api/Video/search-history', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyword: kw })
      });

      if (response.ok) {
        // Reload lịch sử từ server để đảm bảo đồng bộ
        await loadSearchHistory();
      }
    } catch (error) {
      console.error('Lỗi khi lưu lịch sử tìm kiếm:', error);
    }
  };

  // Xóa một item khỏi lịch sử
  const removeHistory = async (kw) => {
    if (!user || !token) return;

    try {
      const response = await fetch(`http://localhost:5133/api/Video/search-history?keyword=${encodeURIComponent(kw)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Cập nhật UI ngay lập tức
        setHistory(prev => prev.filter(h => h !== kw));
      }
    } catch (error) {
      console.error('Lỗi khi xóa lịch sử tìm kiếm:', error);
    }
  };

  const doSearchAndRedirect = async (kw) => {
    if (!kw.trim()) return;
    
    // Chỉ lưu lịch sử nếu user đã đăng nhập
    if (user && token) {
      console.log("✅ User authenticated, calling saveHistory & trackSearch");
      await saveHistory(kw);
      // Track search keyword
      viewHistoryService.trackSearch(kw)
        .then(() => console.log(`✅ Tracked search from overlay: ${kw}`))
        .catch((err) => console.error("❌ Failed to track search:", err));
    } else {
      console.log("❌ User not authenticated or token missing");
    }
    
    setKeyword("");
    onClose();
    navigate(`/search/${encodeURIComponent(kw)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("🔎 handleSubmit triggered with keyword:", keyword);
    doSearchAndRedirect(keyword);
  };

  const onSelectKeyword = (kw) => {
    console.log("🔎 onSelectKeyword triggered with:", kw);
    doSearchAndRedirect(kw);
  };

  // Chặn propagation sự kiện để không ảnh hưởng đến VideoDetailViewer
  const stopEventPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`VD-Overlay-video-search-panel ${isOpen ? "open" : ""}`}
      onWheel={stopEventPropagation}
      onTouchMove={stopEventPropagation}
      onScroll={stopEventPropagation}
      onTouchStart={stopEventPropagation}
      onTouchEnd={stopEventPropagation}
    >
      <form className="VD-Overlay-search-form" onSubmit={handleSubmit}>
        <div className="VD-Overlay-search-wrapper">
          <label className="VD-Overlay-search-label">Search</label>
          <input
            ref={inputRef}
            className="VD-Overlay-search-input"
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
              className="VD-Overlay-clear-btn"
              onClick={() => setKeyword("")}
              aria-label="Xóa"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
      </form>
      <div className="VD-Overlay-search-body">
        {keyword.trim() === "" ? (
          <ul className="VD-Overlay-history-list">
            {!user ? (
              <li className="VD-Overlay-no-history">Đăng nhập để xem lịch sử tìm kiếm</li>
            ) : history.length === 0 ? (
              <li className="VD-Overlay-no-history">Chưa có lịch sử tìm kiếm</li>
            ) : (
              history.map((kw, idx) => (
                <li className="VD-Overlay-history-item" key={idx}>
                  <button
                    type="button"
                    className="VD-Overlay-history-key"
                    onClick={() => onSelectKeyword(kw)}
                  >
                    <FiClock size={16} /> {kw}
                  </button>
                  <button
                    type="button"
                    className="VD-Overlay-history-remove"
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
            <ul className="VD-Overlay-suggestions-list">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="VD-Overlay-suggestion-item"
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