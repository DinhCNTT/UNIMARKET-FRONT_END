// src/hooks/usePostDetails.js
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getPostAndSimilar, startChat } from "../services/postService";
import axios from "axios"; 
import Swal from "sweetalert2"; // Vẫn giữ Swal để hiện popup yêu cầu đăng nhập hoặc lỗi chat

export const usePostDetails = (postId, onOpenChat) => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [similarPostsByCategory, setSimilarPostsByCategory] = useState([]);
  const [similarPostsBySeller, setSimilarPostsBySeller] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const getAuthToken = () => user?.token || token;

  // 1. Lấy dữ liệu tin đăng
  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      try {
        setLoading(true);
        const data = await getPostAndSimilar(postId);
        setPost(data.post);
        setSimilarPostsByCategory(data.similarPostsByCategory);
        setSimilarPostsBySeller(data.similarPostsBySeller);
      } catch (error) {
        console.error("Lỗi khi lấy tin đăng:", error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  // 2. Kiểm tra trạng thái đã lưu
  useEffect(() => {
    const checkSavedStatus = async () => {
      const authToken = getAuthToken();
      if (user && authToken && postId) {
        try {
          const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", { 
            headers: { Authorization: `Bearer ${authToken}` } 
          });
          const savedIds = res.data.map(p => p.maTinDang);
          setIsSaved(savedIds.includes(Number(postId)));
        } catch (error) {
          setIsSaved(false);
        }
      }
    };
    checkSavedStatus();
  }, [user, token, postId]);

  // 3. HÀM XỬ LÝ LƯU TIN (KHÔNG THÔNG BÁO)
  const handleToggleSave = async () => {
    const authToken = getAuthToken();
    
    // Vẫn hiện cảnh báo nếu chưa đăng nhập
    if (!user || !authToken) {
      Swal.fire({ icon: "warning", title: "Thông báo", text: "Bạn cần đăng nhập để lưu tin." });
      return;
    }
    
    // Lưu trạng thái cũ để revert nếu lỗi
    const previousState = isSaved;
    
    // Cập nhật UI ngay lập tức (Không chờ API -> Mượt)
    setIsSaved(!previousState); 

    try {
      if (previousState) {
        // Đang lưu -> Bỏ lưu
        await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${postId}`, { 
          headers: { Authorization: `Bearer ${authToken}` } 
        });
        // Thành công: Không làm gì cả, giữ nguyên UI
      } else {
        // Chưa lưu -> Lưu
        await axios.post(`http://localhost:5133/api/yeuthich/luu/${postId}`, {}, { 
          headers: { Authorization: `Bearer ${authToken}` } 
        });
        // Thành công: Không làm gì cả
      }
    } catch (err) {
      // Nếu API lỗi -> Hoàn tác lại trạng thái UI
      setIsSaved(previousState);
      console.error("Lỗi lưu tin:", err);
    }
  };

  // 4. Xử lý Chat
  const handleChatWithSeller = async () => {
    if (!post || !user) return;
    try {
      const chatData = { MaNguoiDung1: user.id, MaNguoiDung2: post.maNguoiBan, MaTinDang: post.maTinDang };
      const data = await startChat(chatData);
      const maCuocTroChuyen = data?.maCuocTroChuyen || data?.MaCuocTroChuyen;
      if (maCuocTroChuyen) {
        if (typeof onOpenChat === "function") onOpenChat(maCuocTroChuyen);
        else navigate(`/chat/${maCuocTroChuyen}`);
      } else {
        Swal.fire({ icon: "error", title: "Lỗi", text: "Không thể tạo cuộc trò chuyện." });
      }
    } catch (err) {
       console.error(err);
       Swal.fire({ icon: "error", title: "Lỗi", text: "Lỗi kết nối server." });
    }
  };

  return {
    post,
    similarPostsByCategory,
    similarPostsBySeller,
    loading,
    handleChatWithSeller,
    isSaved,
    handleToggleSave
  };
};