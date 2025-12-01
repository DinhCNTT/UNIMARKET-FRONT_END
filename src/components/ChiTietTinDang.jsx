import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ChiTietTinDang.module.css";
import { AuthContext } from "../context/AuthContext";
import { usePostDetails } from "../hooks/usePostDetails";
import { formatPrice, getMediaUrl } from "../utils/formatters";

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
 * Trang Chi Tiết Tin Đăng (Final Version)
 * - Tích hợp chuyển hướng đến trang người bán
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
  
  // ✅ State quản lý việc ẩn/hiện SĐT
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);

  // Effect quản lý box nổi khi cuộn trang
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingBox(window.scrollY > 400); // Hiện khi cuộn qua header
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

  // 👇 HÀM CHUYỂN ĐẾN TRANG USER (Dùng cho nút "Xem thêm" ở slider)
  const handleViewShop = () => {
    if (post && post.maNguoiBan) {
      navigate(`/nguoi-dung/${post.maNguoiBan}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // --- RENDER ---

  if (loading) return <div className={styles.loading}>Đang tải thông tin...</div>;
  if (!post) return <div className={styles.notFound}>Không tìm thấy tin đăng.</div>;

  const formattedPrice = formatPrice(post.gia);

  return (
    <div className={styles.chiTietTinDang}>
      <TopNavbar />

      {/* --- FLOATING BOX (Thanh điều hướng nổi khi cuộn xuống) --- */}
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
          
          // Logic SĐT
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

        {/* Thông tin chi tiết (Giá, Nút bấm, Người bán) */}
        <div className={styles.chiTietTinDangInfoWrapper}>
          <PostDetailsInfo
            post={post}
            formattedPrice={formattedPrice}
            currentUserId={user?.id}
            
            // Logic Chat
            onChat={handleChatClick} 
            
            // Logic Lưu tin
            isSaved={isSaved} 
            onToggleSave={handleToggleSave}

            // Logic SĐT
            showPhoneNumber={showPhoneNumber}
            onTogglePhone={() => setShowPhoneNumber((s) => !s)}
          />
        </div>
      </div>

      {/* --- MAIN CONTENT: MÔ TẢ & BÌNH LUẬN --- */}
      <div className={styles.descriptionAndCommentsWrapper}>
        
        {/* Cột trái: Mô Tả + Thông số kỹ thuật */}
        <div className={styles.descriptionContainer} id="mo-ta-chi-tiet">
          {/* 1. Phần Mô tả văn bản */}
          <PostDescription description={post.moTa} />

          {/* 2. Phần Thông số kỹ thuật */}
          <PostTechnicalSpecs detailsJson={post.thongTinChiTiet || post.ThongTinChiTiet} />
        </div>

        {/* Cột phải: Bình Luận */}
        <div className={styles.commentsContainer} id="binh-luan">
          <PostComments maTinDang={post.maTinDang} />
        </div>

      </div>
      
      {/* --- CÁC TIN ĐĂNG LIÊN QUAN --- */}
      
      {/* 1. Tin Đăng Cùng Người Bán -> Dùng CAROUSEL (Trượt ngang) */}
      <div id="cac-tin-dang-khac">
        <SimilarPostsSection
          title={`Các tin đăng khác của ${post.nguoiBan}`}
          posts={similarPostsBySeller}
          mode="carousel" 
          onViewShop={handleViewShop} // 👈 Đã truyền hàm chuyển trang vào đây
        />
      </div>

      {/* 2. Tin Đăng Tương Tự -> Dùng GRID (Lưới 5 cột + Xem thêm) */}
      <div id="tin-dang-tuong-tu">
        <SimilarPostsSection
          title="Tin đăng tương tự"
          posts={similarPostsByCategory}
          mode="grid"    
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