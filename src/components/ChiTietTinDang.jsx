import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./ChiTietTinDang.module.css";
import { AuthContext } from "../context/AuthContext";
import { usePostDetails } from "../hooks/usePostDetails";
import { formatPrice, getMediaUrl } from "../utils/formatters";

// --- TÍCH HỢP TỪ CODE 2: Service Tracking ---
import { viewHistoryService } from "../services/viewHistoryService";

// --- IMPORTS COMPONENTS ---
import TopNavbar from "./TopNavbar/TopNavbar";
import FloatingProductBox from "../components/FloatingProductBox";
import PostImageCarousel from "../components/PostImageCarousel";
import PostDetailsInfo from "../components/PostDetailsInfo";
import PostDescription from "../components/PostDescription";
import PostTechnicalSpecs from "../components/PostTechnicalSpecs";
import SimilarPostsSection from "../components/SimilarPostsSection";
import Lightbox from "../components/Lightbox";
import PostComments from "../components/PostComments";

/**
 * Trang Chi Tiết Tin Đăng (Final Merged Version)
 * Kết hợp: Logic hiển thị/lưu tin (Code 1) + Tracking lịch sử xem (Code 2)
 */
const ChiTietTinDang = ({ onOpenChat }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  // Hook lấy dữ liệu chi tiết bài đăng
  const {
    post,
    similarPostsByCategory,
    similarPostsBySeller,
    loading,
    handleChatWithSeller,
  } = usePostDetails(id, onOpenChat);

  // --- LOCAL STATES ---
  const [showFloatingBox, setShowFloatingBox] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  
  // State quản lý danh sách yêu thích
  const [savedIds, setSavedIds] = useState([]);
  const isLoggedIn = !!(user && token);

  // =========================================================
  // 1. LOGIC LẤY DANH SÁCH YÊU THÍCH (TỪ CODE 1 & 2)
  // =========================================================
  useEffect(() => {
    const fetchSavedIds = async () => {
      if (isLoggedIn) {
        try {
          const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSavedIds(res.data.map((p) => p.maTinDang));
        } catch (err) {
          console.error("Lỗi lấy danh sách yêu thích:", err);
        }
      }
    };
    fetchSavedIds();
  }, [isLoggedIn, token]);

  // =========================================================
  // 2. LOGIC TRACKING VIEW (TÍCH HỢP TỪ CODE 2)
  // =========================================================
  useEffect(() => {
    // Chỉ track khi đã có thông tin bài đăng và user đã đăng nhập
    if (post?.maTinDang && isLoggedIn) {
      console.log(`📍 Tracking view for post: ${post.maTinDang}`);
      
      viewHistoryService.trackView(post.maTinDang)
        .then(() => {
          console.log(`✅ Successfully tracked view for post: ${post.maTinDang}`);
        })
        .catch((err) => {
          console.error(`❌ Failed to track view for ${post.maTinDang}:`, err);
        });
    }
  }, [post?.maTinDang, isLoggedIn]);

  // =========================================================
  // 3. LOGIC XỬ LÝ SỰ KIỆN (SCROLL, SAVE, LIGHTBOX, CHAT)
  // =========================================================

  // Xử lý scroll để hiện Floating Box
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingBox(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hàm xử lý Lưu/Bỏ lưu tin (Global)
  const handleGlobalToggleSave = async (postId, isCurrentlySaved) => {
    if (!isLoggedIn) {
      return toast.error("Vui lòng đăng nhập để lưu tin!", { icon: '🔒' });
    }

    try {
      if (isCurrentlySaved) {
        await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedIds((prev) => prev.filter((item) => item !== postId));
        toast.success("Đã gỡ lưu tin");
      } else {
        await axios.post(`http://localhost:5133/api/yeuthich/luu/${postId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedIds((prev) => [...prev, postId]);
        toast.success("Đã lưu tin thành công!", { icon: '❤️' });
      }
    } catch (err) {
      toast.error("Thao tác thất bại, vui lòng thử lại!");
    }
  };

  const handleOpenLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const handleCloseLightbox = () => setShowLightbox(false);

  const handleChatClick = () => {
    handleChatWithSeller();
  };

  const handleViewShop = () => {
    if (post && post.maNguoiBan) {
      navigate(`/nguoi-dung/${post.maNguoiBan}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // =========================================================
  // 4. RENDER GIAO DIỆN
  // =========================================================
  if (loading) return <div className={styles.loading}>Đang tải thông tin...</div>;
  if (!post) return <div className={styles.notFound}>Không tìm thấy tin đăng.</div>;

  const formattedPrice = formatPrice(post.gia);

  return (
    <div className={styles.chiTietTinDang}>
      <TopNavbar />

      {/* --- FLOATING BOX --- */}
      {showFloatingBox && (
        <FloatingProductBox
          image={getMediaUrl(post.images?.[0])}
          title={post.tieuDe}
          price={formattedPrice}
          details={
            <>
              <span>{post.loaiSanPham || post.tieuDe}</span>
              {post.dungLuong && <span> | {post.dungLuong}</span>}
              {post.thoiGianBaoHanh && <span> | {post.thoiGianBaoHanh}</span>}
            </>
          }
          description={
            post.moTa 
              ? post.moTa.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').slice(0, 120) + (post.moTa.length > 120 ? '...' : '') 
              : ''
          }
          onShowPhone={() => setShowPhoneNumber((s) => !s)}
          showPhone={showPhoneNumber}
          phoneMasked={`${post.phoneNumber?.substring(0, 6)}****`}
          phone={post.phoneNumber}
          onChat={handleChatClick}
          currentUserId={user?.id}
          sellerId={post.maNguoiBan}
          targetId={post.maTinDang || id}
        />
      )}

      {/* --- HEADER TIN ĐĂNG --- */}
      <div className={styles.tinDangHeader} id="tong-quan">
        <div className={styles.imageContainer}>
          <PostImageCarousel
            images={post.images}
            onImageClick={handleOpenLightbox}
          />
        </div>

        <div className={styles.chiTietTinDangInfoWrapper}>
          <PostDetailsInfo
            post={post}
            formattedPrice={formattedPrice}
            currentUserId={user?.id}
            onChat={handleChatClick}
            // Logic lưu tin
            isSaved={savedIds.includes(post.maTinDang)}
            onToggleSave={() => handleGlobalToggleSave(post.maTinDang, savedIds.includes(post.maTinDang))}
            showPhoneNumber={showPhoneNumber}
            onTogglePhone={() => setShowPhoneNumber((s) => !s)}
          />
        </div>
      </div>

      {/* --- MAIN CONTENT (Mô tả, Thông số, Bình luận) --- */}
      <div className={styles.descriptionAndCommentsWrapper}>
        <div className={styles.descriptionContainer} id="mo-ta-chi-tiet">
          <PostDescription description={post.moTa} />

          <PostTechnicalSpecs
            detailsJson={post.ChiTietObj || post.chiTietObj}
            TinhTrang={post.TinhTrang || post.tinhTrang}
            CoTheThoaThuan={post.CoTheThoaThuan || post.coTheThoaThuan}
          />
        </div>

        <div className={styles.commentsContainer} id="binh-luan">
          <PostComments maTinDang={post.maTinDang} />
        </div>
      </div>

      {/* --- CÁC TIN ĐĂNG LIÊN QUAN --- */}
      <div id="cac-tin-dang-khac">
        <SimilarPostsSection
          title={`Các tin đăng khác của ${post.nguoiBan}`}
          posts={similarPostsBySeller}
          mode="carousel"
          onViewShop={handleViewShop}
          // Logic lưu tin
          isLoggedIn={isLoggedIn}
          savedIds={savedIds}
          onToggleSave={handleGlobalToggleSave}
        />
      </div>

      <div id="tin-dang-tuong-tu">
        <SimilarPostsSection
          title="Tin đăng tương tự"
          posts={similarPostsByCategory}
          mode="grid"
          // Logic lưu tin
          isLoggedIn={isLoggedIn}
          savedIds={savedIds}
          onToggleSave={handleGlobalToggleSave}
        />
      </div>

      {/* --- LIGHTBOX --- */}
      {showLightbox && (
        <Lightbox
          images={post.images}
          startIndex={lightboxIndex}
          onClose={handleCloseLightbox}
        />
      )}
    </div>
  );
};

export default ChiTietTinDang;