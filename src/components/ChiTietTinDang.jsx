import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ChiTietTinDang.module.css";
import { AuthContext } from "../context/AuthContext";
import { usePostDetails } from "../hooks/usePostDetails";
import { formatPrice, getMediaUrl } from "../utils/formatters";

// --- IMPORTS TỪ CẢ 2 CODE ---
import TopNavbar from "../components/TopNavbar";
import FloatingProductBox from "../components/FloatingProductBox";
import PostImageCarousel from "../components/PostImageCarousel";
import PostDetailsInfo from "../components/PostDetailsInfo"; // Check lại đường dẫn import đúng file của bạn
import PostDescription from "../components/PostDescription";
import SimilarPostsSection from "../components/SimilarPostsSection";
import Lightbox from "../components/Lightbox";
import ReportButton from "../components/ReportModals/ReportButton"; // Từ Code 2

// ✅ FEATURE MỚI TỪ CODE 1
import PostComments from "../components/PostComments";

/**
 * Trang Chi Tiết Tin Đăng (Final Merged Version)
 * 1. Layout: Header -> Mô tả + Bình luận (Side-by-side) -> Tin liên quan.
 * 2. Logic: Chat, Lưu tin, Report, Ẩn/Hiện SĐT, Lightbox.
 */
const ChiTietTinDang = ({ onOpenChat }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // ✅ LOGIC GỘP (Data & Actions):
  const {
    post,
    similarPostsByCategory,
    similarPostsBySeller,
    loading,
    handleChatWithSeller,
    isSaved,           // Feature Lưu tin
    handleToggleSave   // Feature Lưu tin
  } = usePostDetails(id, onOpenChat);

  // --- STATE QUẢN LÝ GIAO DIỆN ---
  const [showFloatingBox, setShowFloatingBox] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // ✅ State từ Code 2 (Để quản lý việc ẩn/hiện SĐT)
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);

  // Effect quản lý box nổi khi cuộn trang
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingBox(window.scrollY > 250);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handlers cho Lightbox
  const handleOpenLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };
  const handleCloseLightbox = () => setShowLightbox(false);

  // Xử lý khi bấm chat
  const handleChatClick = () => {
    handleChatWithSeller();
  };

  // --- RENDER ---

  if (loading) return <div className={styles.loading}>Đang tải thông tin...</div>;
  if (!post) return <div className={styles.notFound}>Không tìm thấy tin đăng.</div>;

  const formattedPrice = formatPrice(post.gia);

  return (
    <div className={styles.chiTietTinDang}>
      <TopNavbar />

      {/* --- FLOATING BOX (Ưu tiên logic Code 2 vì có xử lý SĐT tốt hơn) --- */}
      {showFloatingBox && (
        <FloatingProductBox
          image={getMediaUrl(post.images?.[0])}
          title={post.tieuDe}
          price={formattedPrice}
          details={<>
            <span>{post.loaiSanPham || post.tieuDe}</span>
            {post.dungLuong && <span> | {post.dungLuong}</span>}
            {post.thoiGianBaoHanh && <span> | {post.thoiGianBaoHanh}</span>}
          </>}
          // Xử lý mô tả: cắt ngắn, bỏ HTML tags
          description={post.moTa ? post.moTa.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').slice(0, 120) + (post.moTa.length > 120 ? '...' : '') : ''}
          
          // Logic SĐT (Từ Code 2)
          onShowPhone={() => setShowPhoneNumber((s) => !s)}
          showPhone={showPhoneNumber}
          phoneMasked={`${post.phoneNumber?.substring(0, 6)}****`}
          phone={post.phoneNumber}
          
          // Logic Chat & ID
          onChat={handleChatClick}
          currentUserId={user?.id}
          sellerId={post.maNguoiBan}
          targetId={post.maTinDang || id}
        />
      )}

      {/* --- HEADER TIN ĐĂNG (Ảnh + Info) --- */}
      <div className={styles.tinDangHeader} id="tong-quan">
        {/* Carousel Ảnh */}
        <div className={styles.imageContainer}>
          <PostImageCarousel 
            images={post.images} 
            onImageClick={handleOpenLightbox} 
          />
        </div>

        {/* Thông tin chi tiết (Giá, Nút bấm) */}
        <div className={styles.chiTietTinDangInfoWrapper}>
          <PostDetailsInfo
            post={post}
            formattedPrice={formattedPrice}
            currentUserId={user?.id}
            
            // Logic Chat
            onChat={handleChatClick} 
            
            // Logic Lưu tin (Từ Code 1 & 2)
            isSaved={isSaved} 
            onToggleSave={handleToggleSave}

            // Logic SĐT (Từ Code 2)
            showPhoneNumber={showPhoneNumber}
            onTogglePhone={() => setShowPhoneNumber((s) => !s)}
          />
          {/* Note: ReportButton thường nằm trong PostDetailsInfo, nếu không thì đặt ở đây */}
        </div>
      </div>

      {/* --- ✅ MAIN CONTENT: MÔ TẢ & BÌNH LUẬN (CẤU TRÚC CODE 1) --- */}
      {/* Giữ cấu trúc này để hiển thị Bình luận bên phải */}
      <div className={styles.descriptionAndCommentsWrapper}>
        
        {/* Cột trái: Mô Tả */}
        <div className={styles.descriptionContainer} id="mo-ta-chi-tiet">
          <PostDescription description={post.moTa} />
        </div>

        {/* Cột phải: Bình Luận (Feature Code 1) */}
        <div className={styles.commentsContainer} id="binh-luan">
          <PostComments maTinDang={post.maTinDang} />
        </div>

      </div>
      {/* ----------------------------------------------------------- */}

      {/* --- CÁC TIN ĐĂNG LIÊN QUAN (Giữ ID neo trang của Code 2) --- */}
      
      {/* Tin Đăng Cùng Người Bán */}
      <div id="cac-tin-dang-khac">
        <SimilarPostsSection
          title={`Các tin đăng khác của ${post.nguoiBan}`}
          posts={similarPostsBySeller}
        />
      </div>

      {/* Tin Đăng Tương Tự */}
      <div id="tin-dang-tuong-tu">
        <SimilarPostsSection
          title="Tin đăng tương tự"
          posts={similarPostsByCategory}
        />
      </div>

      {/* Lightbox (Xem ảnh phóng to) */}
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