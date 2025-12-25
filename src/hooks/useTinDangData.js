// src/hooks/useTinDangData.js
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export const useTinDangData = (activeTab, categoryGroup) => {
  // Khởi tạo mảng rỗng để an toàn tuyệt đối
  const [posts, setPosts] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const { user, token } = useContext(AuthContext);

  const getAuthToken = () => user?.token || token;
  const isLoggedIn = !!(user && getAuthToken());

  // 1. Fetch Posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let url = "http://localhost:5133/api/tindang/get-posts";
        
        // Tạo object chứa tham số query
        const params = {};

        // Nếu có categoryGroup, thêm vào params
        if (categoryGroup) {
          params.categoryGroup = categoryGroup;
        }

        // Nếu là tab "dành cho bạn" -> đổi API và endpoint
        if (activeTab === "danhchoban") {
          url = "http://localhost:5133/api/tindang/get-recommended-posts";
        }

        // ========================================================
        // 🔥 FIX QUAN TRỌNG: LUÔN GỬI LIMIT ĐỂ KHÔNG BỊ TRẢ VỀ 0 TIN
        // ========================================================
        params.limit = 20; // Luôn lấy 20 tin
        // ========================================================

        // Chuyển object params thành chuỗi query
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = `${url}?${queryString}`;

        const authToken = getAuthToken();
        const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};

        console.log("Fetching URL:", fullUrl);

        const response = await axios.get(fullUrl, config);
        
        // ========================================================
        // 🔥 XỬ LÝ DỮ LIỆU ĐA NĂNG (Bắt mọi trường hợp)
        // ========================================================
        const dataTraVe = response.data;
        console.log("Dữ liệu Server trả về:", dataTraVe);

        // Bước 1: Thử lấy mảng từ thuộc tính .Data (hoa) hoặc .data (thường)
        let listPosts = dataTraVe.Data || dataTraVe.data;

        // Bước 2: Nếu không có .Data/.data, kiểm tra xem chính nó có phải là mảng không (API cũ)
        if (!listPosts && Array.isArray(dataTraVe)) {
            listPosts = dataTraVe;
        }

        // Bước 3: Set State an toàn
        if (Array.isArray(listPosts)) {
            setPosts(listPosts);
        } else {
            console.warn("API không trả về danh sách hợp lệ, set mảng rỗng.");
            setPosts([]); 
        }

      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]); // Lỗi thì set rỗng để không crash app
      }
    };

    fetchPosts();
  }, [activeTab, user, categoryGroup]); 

  // 2. Fetch Saved IDs
  useEffect(() => {
    const fetchSaved = async () => {
      const authToken = getAuthToken();
      if (isLoggedIn && authToken) {
        try {
          const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (Array.isArray(res.data)) {
             setSavedIds(res.data.map((post) => post.maTinDang));
          }
        } catch (error) {
          console.error("Error fetching saved posts:", error);
        }
      }
    };
    fetchSaved();
  }, [user, token]);

  // 3. Toggle Save Logic
  const handleToggleSave = async (postId, isSaved) => {
    const authToken = getAuthToken();
    if (!isLoggedIn || !authToken) {
      alert("Bạn cần đăng nhập để lưu tin.");
      return;
    }

    try {
      if (isSaved) {
        await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${postId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setSavedIds((prev) => prev.filter((id) => id !== postId));
        alert("Đã gỡ lưu tin đăng.");
      } else {
        await axios.post(`http://localhost:5133/api/yeuthich/luu/${postId}`, {}, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setSavedIds((prev) => [...prev, postId]);
        alert("Đã lưu tin đăng.");
      }
    } catch (err) {
      let msg = "Có lỗi xảy ra, vui lòng thử lại.";
      if (err.response?.data?.message) {
         msg = err.response.data.message;
      }
      alert(msg);
    }
  };

  return { posts, savedIds, isLoggedIn, handleToggleSave };
};