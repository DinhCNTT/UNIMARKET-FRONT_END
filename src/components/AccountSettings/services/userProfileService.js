import axios from "axios";

const API_BASE = "http://localhost:5133/api";

// Lấy thông tin user
export const getUserProfile = (token) => {
  return axios.get(`${API_BASE}/userprofile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Cập nhật thông tin (Họ tên, SĐT)
export const updateUserProfile = (token, data) => {
  return axios.put(`${API_BASE}/userprofile/update`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Cập nhật email mới
export const updateEmail = (token, newEmail) => {
  return axios.put(
    `${API_BASE}/userprofile/email`,
    { newEmail },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Gửi mã xác minh
export const sendVerificationCode = (token) => {
  return axios.post(`${API_BASE}/emailverification/send-code`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Xác minh mã
export const verifyCode = (token, email, code) => {
  return axios.post(
    `${API_BASE}/emailverification/verify-code`,
    { email, code },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Upload avatar
export const uploadAvatar = (token, formData) => {
  return axios.post(`${API_BASE}/userprofile/upload-avatar`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};