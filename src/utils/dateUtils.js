// src/utils/dateUtils.js  
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now - date) / 1000;

  if (diff < 60) return "Vừa đăng";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
  return `${Math.floor(diff / 31536000)} năm trước`;
};