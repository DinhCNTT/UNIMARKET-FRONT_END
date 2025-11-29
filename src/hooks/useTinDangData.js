// src/hooks/useTinDangData.js
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export const useTinDangData = (activeTab) => {
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
        if (activeTab === "danhchoban") {
          url = "http://localhost:5133/api/tindang/get-recommended-posts?limit=20";
        }

        const authToken = getAuthToken();
        const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};

        const response = await axios.get(url, config);
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      }
    };

    fetchPosts();
  }, [activeTab, user]);

  // 2. Fetch Saved IDs
  useEffect(() => {
    const fetchSaved = async () => {
      const authToken = getAuthToken();
      if (isLoggedIn && authToken) {
        try {
          const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          setSavedIds(res.data.map((post) => post.maTinDang));
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
      // Xử lý lỗi chi tiết (giữ nguyên logic của bạn)
      let msg = "Có lỗi xảy ra, vui lòng thử lại.";
      if (err.response?.data?.message) {
         msg = err.response.data.message;
      }
      alert(msg);
    }
  };

  return { posts, savedIds, isLoggedIn, handleToggleSave };
};