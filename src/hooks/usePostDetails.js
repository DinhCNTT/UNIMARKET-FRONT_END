// src/hooks/usePostDetails.js
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getPostAndSimilar, startChat } from "../services/postService";
import Swal from "sweetalert2";

export const usePostDetails = (postId, onOpenChat) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [similarPostsByCategory, setSimilarPostsByCategory] = useState([]);
  const [similarPostsBySeller, setSimilarPostsBySeller] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu tin đăng
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

  // Xử lý logic chat
  const handleChatWithSeller = async () => {
    if (!post || !user) return;

    try {
      const chatData = {
        MaNguoiDung1: user.id,
        MaNguoiDung2: post.maNguoiBan,
        MaTinDang: post.maTinDang,
      };
      const data = await startChat(chatData);

      const maCuocTroChuyen = data?.maCuocTroChuyen || data?.MaCuocTroChuyen;
      if (maCuocTroChuyen) {
        if (typeof onOpenChat === "function") {
          onOpenChat(maCuocTroChuyen);
        } else {
          navigate(`/chat/${maCuocTroChuyen}`);
        }
      } else {
        Swal.fire({ icon: "error", title: "Thông báo", text: "Không thể tạo cuộc trò chuyện. Vui lòng thử lại." });
      }
    } catch (err) {
      console.error("StartChat error:", err);
      // Xử lý lỗi chi tiết
      if (err.response) {
        const { status, data } = err.response;
        let serverMessage = data.message || data.Message || data.detail || data.title || data.error || (typeof data === 'string' ? data : null);

        if (serverMessage) {
          Swal.fire({ icon: "error", title: "Thông báo", text: serverMessage });
        } else if (status === 403) {
          Swal.fire({ icon: "error", title: "Bị chặn", text: "Bạn không thể nhắn tin với người này (bị chặn)." });
        } else {
          Swal.fire({ icon: "error", title: "Lỗi", text: "Lỗi khi tạo cuộc trò chuyện. Vui lòng thử lại." });
        }
      } else if (err.request) {
        Swal.fire({ icon: "error", title: "Lỗi kết nối", text: "Không nhận được phản hồi từ máy chủ." });
      } else {
        Swal.fire({ icon: "error", title: "Lỗi", text: err.message || "Có lỗi xảy ra." });
      }
    }
  };

  return {
    post,
    similarPostsByCategory,
    similarPostsBySeller,
    loading,
    handleChatWithSeller,
  };
};