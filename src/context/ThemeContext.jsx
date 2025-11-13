// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Lấy theme đã lưu, mặc định là 'light' (giao diện sáng)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // Mỗi khi theme thay đổi, lưu vào localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 'auto' hiện tại sẽ hoạt động như 'light' vì chúng ta chưa cài đặt
  // logic phát hiện hệ thống. Bạn có thể mở rộng sau.
  const effectiveTheme = theme === 'auto' ? 'dark' : theme;

  const value = {
    theme, // 'light', 'dark', 'auto'
    setTheme, // Hàm để thay đổi
    effectiveTheme, // 'light' hoặc 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook để sử dụng context dễ dàng
export const useTheme = () => {
  return useContext(ThemeContext);
};