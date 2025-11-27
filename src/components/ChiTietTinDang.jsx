import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ChiTietTinDang.module.css";
import { AuthContext } from "../context/AuthContext";
import { usePostDetails } from "../hooks/usePostDetails"; 
import { formatPrice, getMediaUrl } from "../utils/formatters"; 

// Import các component con
import TopNavbar from "../components/TopNavbar";
import FloatingProductBox from "../components/FloatingProductBox";
import PostImageCarousel from "../components/PostImageCarousel";
import PostDetailsInfo from "../components/PostDetailsInfo";
import PostDescription from "../components/PostDescription";
import SimilarPostsSection from "../components/SimilarPostsSection";
import Lightbox from "../components/Lightbox";
// ✅ IMPORT MỚI
import PostComments from "../components/PostComments";

/**
 * Trang Chi Tiết Tin Đăng (Merged Version)
 * - Kết hợp logic Chat, hiển thị chi tiết.
 * - Kết hợp logic Lưu tin/Yêu thích.
 * - Kết hợp logic Bình luận (Bên phải mô tả).
 */
const ChiTietTinDang = ({ onOpenChat }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // ✅ LOGIC GỘP:
  const { 
    post, 
    similarPostsByCategory, 
    similarPostsBySeller, 
    loading, 
    handleChatWithSeller,
    isSaved,          
    handleToggleSave  
  } = usePostDetails(id, onOpenChat);

  // State giao diện
  const [showFloatingBox, setShowFloatingBox] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  // --- Render ---

  if (loading) return <div className={styles.loading}>Đang tải thông tin...</div>;
  if (!post) return <div className={styles.notFound}>Không tìm thấy tin đăng.</div>;

  const formattedPrice = formatPrice(post.gia);

  return (
    <div className={styles.chiTietTinDang}>
      <TopNavbar />

      {/* Floating Product Box */}
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
          description={post.moTa ? post.moTa.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').slice(0, 120) + (post.moTa.length > 120 ? '...' : '') : ''}
          onShowPhone={() => {}} 
          onChat={handleChatClick}
          showPhone={false} 
          phoneMasked={`${post.phoneNumber?.substring(0, 6)}****`}
          currentUserId={user?.id}
          sellerId={post.maNguoiBan}
        />
      )}

      {/* Layout chính của tin đăng (Header) */}
      <div className={styles.tinDangHeader} id="tong-quan">
        {/* Phần Carousel Ảnh */}
        <div className={styles.imageContainer}>
          <PostImageCarousel 
            images={post.images} 
            onImageClick={handleOpenLightbox} 
          />
        </div>

        {/* Phần Thông Tin Tin Đăng */}
        <div className={styles.chiTietTinDangInfoWrapper}>
          <PostDetailsInfo
            post={post}
            formattedPrice={formattedPrice}
            onChat={handleChatClick} 
            currentUserId={user?.id}
            isSaved={isSaved} 
            onToggleSave={handleToggleSave}
          />
        </div>
      </div>

      {/* --- ✅ PHẦN MỚI: LAYOUT MÔ TẢ & BÌNH LUẬN NGANG HÀNG --- */}
      <div className={styles.descriptionAndCommentsWrapper}>
        
        {/* Cột trái: Mô Tả */}
        <div className={styles.descriptionContainer} id="mo-ta-chi-tiet">
          <PostDescription description={post.moTa} />
        </div>

        {/* Cột phải: Bình Luận */}
        <div className={styles.commentsContainer} id="binh-luan">
          {/* Truyền maTinDang vào để gọi API lấy comment */}
          <PostComments maTinDang={post.maTinDang} />
        </div>

      </div>
      {/* ----------------------------------------------------- */}

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

      {/* Lightbox */}
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