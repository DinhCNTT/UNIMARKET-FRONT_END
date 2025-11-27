import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ChiTietTinDang.module.css";
import { AuthContext } from "../context/AuthContext";
import { usePostDetails } from "../hooks/usePostDetails"; 
import { formatPrice, getMediaUrl } from "../utils/formatters"; 

// Import các component con
import TopNavbar from "../components/TopNavbar";
import FloatingProductBox from "../components/FloatingProductBox";
import ReportButton from "../components/ReportModals/ReportButton";
import PostImageCarousel from "../components/PostImageCarousel";
import PostDetailsInfo from "./PostDetailsInfo";
import PostDescription from "../components/PostDescription";
import SimilarPostsSection from "../components/SimilarPostsSection";
import Lightbox from "../components/Lightbox";

/**
 * Trang Chi Tiết Tin Đăng (Merged Version)
 * - Kết hợp logic Chat, hiển thị chi tiết (Code bạn bè).
 * - Kết hợp logic Lưu tin/Yêu thích (Code của bạn).
 * - Cấu trúc ID đầy đủ để hỗ trợ scroll/neo trang.
 */
const ChiTietTinDang = ({ onOpenChat }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // ✅ LOGIC GỘP:
  // 1. Lấy data tin đăng, logic chat (từ Code 2)
  // 2. Lấy logic Lưu tin: isSaved, handleToggleSave (từ Code 1)
  const { 
    post, 
    similarPostsByCategory, 
    similarPostsBySeller, 
    loading, 
    handleChatWithSeller,
    isSaved,          // <-- Feature Lưu tin (Code tui)
    handleToggleSave  // <-- Feature Lưu tin (Code tui)
  } = usePostDetails(id, onOpenChat);

  // State giao diện (Floating box, Lightbox)
  const [showFloatingBox, setShowFloatingBox] = useState(false);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Effect quản lý box nổi khi cuộn trang
  useEffect(() => {
    const handleScroll = () => {
      // Hiện box khi cuộn qua 250px
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

  // Xử lý khi bấm chat (từ bất kỳ component con nào)
  const handleChatClick = () => {
    handleChatWithSeller();
  };

  // --- Render ---

  // 1. Trạng thái Đang Tải
  if (loading) return <div className={styles.loading}>Đang tải thông tin...</div>;
  
  // 2. Trạng thái Lỗi / Không tìm thấy
  if (!post) return <div className={styles.notFound}>Không tìm thấy tin đăng.</div>;

  // 3. Trạng thái Thành Công
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
          // Xử lý mô tả ngắn gọn, loại bỏ HTML tags
          description={post.moTa ? post.moTa.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').slice(0, 120) + (post.moTa.length > 120 ? '...' : '') : ''}
          onShowPhone={() => setShowPhoneNumber((s) => !s)}
          onChat={handleChatClick} // Truyền hàm chat
          showPhone={showPhoneNumber} 
          phoneMasked={`${post.phoneNumber?.substring(0, 6)}****`}
          phone={post.phoneNumber}
          currentUserId={user?.id}
          sellerId={post.maNguoiBan}
          targetId={post.maTinDang || id}
        />
      )}

      {/* Layout chính của tin đăng (Header) */}
      {/* ID 'tong-quan' hỗ trợ neo trang */}
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
            showPhoneNumber={showPhoneNumber}
            onTogglePhone={() => setShowPhoneNumber((s) => !s)}
            
            // ✅ QUAN TRỌNG: Truyền props Lưu tin xuống (Logic Code 1)
            isSaved={isSaved} 
            onToggleSave={handleToggleSave}
          />
          {/* NOTE: Report button is rendered inside PostDetailsInfo as a pill near the Save button */}
        </div>
      </div>

      {/* Phần Mô Tả */}
      <div id="mo-ta-chi-tiet">
        <PostDescription description={post.moTa} />
      </div>

      {/* Tin Đăng Cùng Người Bán */}
      {/* ID 'cac-tin-dang-khac' lấy từ Code 2 (Code 1 bị thiếu thẻ div bao ngoài này) */}
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