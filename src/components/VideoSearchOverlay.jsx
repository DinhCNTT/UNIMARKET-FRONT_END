import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

// IMPORT CSS MODULE
import styles from "./VideoSearchOverlay.module.css";
import { viewHistoryService } from '../services/viewHistoryService';

// Icons
import { FiSearch, FiClock, FiX } from "react-icons/fi";
import { FaArrowTrendUp } from "react-icons/fa6"; 
import { GoDotFill } from "react-icons/go";

import { AuthContext } from '../context/AuthContext';

export default function VideoSearchOverlay({ isOpen, onClose = () => {} }) {
  const [keyword, setKeyword] = useState("");
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  
  const inputRef = useRef(null);
  const navigate = useNavigate();
  
  const { user, token } = useContext(AuthContext);
  // Debug: Log context values khi component mount
  useEffect(() => {
    console.log("🎯 VideoSearchOverlay mounted");
    console.log("👤 AuthContext user:", user);
    console.log("🔑 AuthContext token:", token ? "exists" : "missing");
  }, [user, token]);

  // ==========================================
  // 1. LOGIC LỊCH SỬ TÌM KIẾM
  // ==========================================
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
        await loadSearchHistory();
      }
    } catch (error) {
      console.error('Lỗi khi lưu lịch sử tìm kiếm:', error);
    }
  };

  const removeHistory = async (kw, e) => {
    // Chặn sự kiện nổi bọt để không kích hoạt tìm kiếm khi bấm nút xóa
    if (e) e.stopPropagation();

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
        setHistory(prev => prev.filter(h => h !== kw));
      }
    } catch (error) {
      console.error('Lỗi khi xóa lịch sử tìm kiếm:', error);
    }
  };

  useEffect(() => {
    const handleClearSearchHistoryUI = () => {
      setHistory([]);
    };
    window.addEventListener('clearSearchHistoryUI', handleClearSearchHistoryUI);
    return () => {
      window.removeEventListener('clearSearchHistoryUI', handleClearSearchHistoryUI);
    };
  }, []);

  // ==========================================
  // 2. LOGIC TRENDING
  // ==========================================
  const loadTrending = async () => {
    try {
      const res = await fetch('http://localhost:5133/api/Video/trending');
      if (res.ok) {
        const data = await res.json();
        setTrending(data);
      }
    } catch (error) { 
      console.error("Lỗi load trending:", error); 
    }
  };

  // ==========================================
  // 3. EFFECT TỔNG HỢP
  // ==========================================
  useEffect(() => {
    loadSearchHistory();
    loadTrending(); 
  }, [user, token]);

  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // ==========================================
  // 4. LOGIC GỢI Ý (SUGGEST)
  // ==========================================
  useEffect(() => {
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }

    let canceled = false;
    const fetchSuggestions = async () => {
      try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(
          `http://localhost:5133/api/Video/suggest-smart?keyword=${encodeURIComponent(keyword)}`,
          { headers }
        );
        
        if (res.ok) {
            const data = await res.json();
            if (!canceled) setSuggestions(data);
        }
      } catch (err) {
        console.error("Lỗi gợi ý từ khóa:", err);
        if (!canceled) setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(() => {
        fetchSuggestions();
    }, 300);

    return () => {
      canceled = true;
      clearTimeout(timeoutId);
    };
  }, [keyword, token]);

  // ==========================================
  // 5. EVENT HANDLERS
  // ==========================================
  const doSearchAndRedirect = async (kw) => {
    if (!kw || !kw.trim()) return;
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
    doSearchAndRedirect(keyword);
  };

  const onSelectKeyword = (kw) => {
    doSearchAndRedirect(kw);
  };

  const renderTrendIcon = (index) => {
    if (index < 3) {
        return <FaArrowTrendUp className={styles.iconTrendHot} />;
    }
    return <GoDotFill className={styles.iconTrendNormal} />;
  };

  // ==========================================
  // 6. RENDER GIAO DIỆN
  // ==========================================
  return (
    <div
      className={`${styles.panel} ${isOpen ? styles.open : ""}`}
      onWheel={(e) => e.stopPropagation()}
      onScroll={(e) => e.stopPropagation()}
      // Giữ lại các event chặn cuộn trang nền nếu cần
      onTouchMove={(e) => e.stopPropagation()}
    >
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        
        {/* HEADER */}
        <div className={styles.headerRow}>
          <label className={styles.searchLabel}>Search</label>
          <button 
            type="button" 
            className={styles.closePanelBtn} 
            onClick={onClose}
          >
            <FiX size={28} />
          </button>
        </div>

        {/* Ô NHẬP LIỆU */}
        <div className={styles.searchWrapper}>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Bạn cần tìm gì?"
            maxLength={80}
            autoComplete="off"
          />
        </div>
      </form>

      <div className={styles.searchBody}>
        {/* TRƯỜNG HỢP 1: HISTORY + TRENDING (Khi chưa nhập gì) */}
        {keyword.trim() === "" ? (
          <div className={styles.defaultContent}>
            
            {/* LỊCH SỬ TÌM KIẾM */}
            {user && history.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Lịch sử tìm kiếm</div>
                    <ul className={styles.historyList}>
                        {history.map((kw, idx) => (
                            <li className={styles.historyItem} key={idx}>
                                {/* Nút Text Lịch sử: Đã gắn hàm onSelectKeyword */}
                                <button 
                                    type="button" 
                                    className={styles.historyKey} 
                                    onClick={() => onSelectKeyword(kw)}
                                >
                                    <FiClock size={16} /> {kw}
                                </button>
                                
                                {/* Nút Xóa Lịch sử: Đã gắn hàm removeHistory */}
                                <button 
                                    type="button" 
                                    className={styles.historyRemove} 
                                    onClick={(e) => removeHistory(kw, e)}
                                >
                                    <FiX size={14} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* TRENDING */}
             {trending.length > 0 && (
                <div className={styles.section} style={{ marginTop: history.length > 0 ? '20px' : '0' }}>
                    <div className={styles.sectionTitle}>Bạn có thể thích</div>
                    <ul className={styles.trendingList}>
                        {trending.map((trend, idx) => (
                            // Item Trending: Đã gắn hàm onSelectKeyword
                            <li 
                                key={idx} 
                                className={styles.trendingItem} 
                                onClick={() => onSelectKeyword(trend)}
                            >
                                {renderTrendIcon(idx)}
                                <span className={styles.trendingText}>{trend}</span>
                                {idx === 0 && <span className={styles.badgeTrend}>Trend</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Thông báo rỗng */}
            {!user && trending.length === 0 && (
                 <div className={styles.noHistory}>Đăng nhập để xem lịch sử tìm kiếm</div>
            )}
            {user && history.length === 0 && trending.length === 0 && (
                 <div className={styles.noHistory}>Hãy thử tìm kiếm gì đó...</div>
            )}
          </div>
        ) : (
          /* TRƯỜNG HỢP 2: SUGGESTIONS (Khi đang nhập) */
          <div className={styles.suggestionsContainer}>
              {suggestions.length > 0 && (
               <ul className={styles.suggestionsList}>
                {suggestions.map((s, i) => (
                  // Item Gợi ý: Đã gắn hàm onSelectKeyword
                  <li 
                    key={i} 
                    className={styles.suggestionItem} 
                    onClick={() => onSelectKeyword(s)}
                  >
                    <div className={styles.suggestionIconWrapper}>
                      <FiSearch size={18} />
                    </div>
                    <div className={styles.suggestionContent}>
                      {s}
                    </div>
                  </li>
                ))}
              </ul>
              )}
          </div>
        )}
      </div>
    </div>
  );
}