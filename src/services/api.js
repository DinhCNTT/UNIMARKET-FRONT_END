import axios from 'axios';

// Định nghĩa base URL cho backend của bạn
const API_BASE_URL = 'http://localhost:5133/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ----------------------------------------------------------------
// 1. Interceptor cho REQUEST (Tự động đính kèm token)
// ----------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    // ✅ Đã cập nhật: Lấy token theo logic của AuthContext
    // Ưu tiên sessionStorage (cho tab hiện tại) trước
    const sessionToken = sessionStorage.getItem("token");
    const localToken = localStorage.getItem("token");
    
    // Sử dụng token nào tìm thấy (ưu tiên session)
    const token = sessionToken || localToken; 

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------
// 2. Interceptor cho RESPONSE (Tự động xử lý lỗi 401)
// ----------------------------------------------------------------
api.interceptors.response.use(
  (response) => {
    // Request thành công, cứ trả về
    return response;
  },
  (error) => {
    // Chỉ xử lý nếu có response lỗi từ server
    if (error.response && error.response.status === 401) {
      console.error('Lỗi 401: Unauthorized. Token hết hạn hoặc không hợp lệ.');

      // ✅ Đã cập nhật: Chạy lại logic clearStorage() của bạn
      // Bằng cách này, chúng ta xóa token HẾT HẠN ở CẢ hai nơi
      // 1. Xóa từ sessionStorage
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("userFullName");
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("userPhoneNumber");
      sessionStorage.removeItem("userAvatar");
      sessionStorage.removeItem("token");
      
      // 2. Xóa từ localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userFullName");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userPhoneNumber");
      localStorage.removeItem("userAvatar");
      localStorage.removeItem("token");
      
      // ✅ Đã cập nhật: Kích hoạt 'logout_signal'
      // Để các tab khác cũng tự động đăng xuất
      localStorage.setItem("logout_signal", Date.now().toString());
      setTimeout(() => {
        localStorage.removeItem("logout_signal");
      }, 100);

      // Thông báo và chuyển hướng (như cũ)
      alert("Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.");
      
      // (Thay '/login' bằng đường dẫn trang đăng nhập của bạn)
      window.location.href = '/login'; 
    }
    
    // Trả về lỗi để các hàm .catch() khác có thể xử lý (nếu không phải lỗi 401)
    return Promise.reject(error);
  }
);

export default api;