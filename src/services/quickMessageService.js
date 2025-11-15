import axios from 'axios';

const API_URL = 'http://localhost:5133/api/quickmessage';

const getAuthToken = () => {
  const token = localStorage.getItem('token');
  console.log('[quickMessageService] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'MISSING');
  return token;
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[quickMessageService] Added Bearer token to request, first 30 chars:', `Bearer ${token.substring(0, 20)}...`);
  } else {
    console.warn('[quickMessageService] NO TOKEN FOUND - Request will likely fail with 401');
  }
  return config;
}, error => Promise.reject(error));

export const quickMessageService = {
  /**
   * Lấy danh sách tin nhắn nhanh của user
   */
  getMyQuickMessages: async () => {
    try {
      const response = await apiClient.get('/');
      return response.data.data || [];
    } catch (error) {
      console.error('Lỗi lấy tin nhắn nhanh:', error);
      throw error;
    }
  },

  /**
   * Thêm tin nhắn nhanh mới
   */
  createQuickMessage: async (content, order) => {
    try {
      const response = await apiClient.post('/', {
        content: content.trim(),
        order: order
      });
      return response.data.data;
    } catch (error) {
      console.error('Lỗi tạo tin nhắn nhanh:', error);
      throw error;
    }
  },

  /**
   * Cập nhật tin nhắn nhanh
   */
  updateQuickMessage: async (id, content, order) => {
    try {
      const response = await apiClient.put(`/${id}`, {
        id: id,
        content: content.trim(),
        order: order
      });
      return response.data.data;
    } catch (error) {
      console.error('Lỗi cập nhật tin nhắn nhanh:', error);
      throw error;
    }
  },

  /**
   * Xóa tin nhắn nhanh
   */
  deleteQuickMessage: async (id) => {
    try {
      await apiClient.delete(`/${id}`);
      return true;
    } catch (error) {
      console.error('Lỗi xóa tin nhắn nhanh:', error);
      throw error;
    }
  }
};
