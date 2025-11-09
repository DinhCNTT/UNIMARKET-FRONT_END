import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ChiTietTinDang.module.css";
import { AuthContext } from "../context/AuthContext";
import { usePostDetails } from "../hooks/usePostDetails"; // ✅ Import custom hook
import { formatPrice, getMediaUrl } from "../utils/formatters"; // ✅ Import helpers

// Import các component con
import TopNavbar from "../components/TopNavbar";
import FloatingProductBox from "../components/FloatingProductBox";
import PostImageCarousel from "../components/PostImageCarousel";
import PostDetailsInfo from "../components/PostDetailsInfo";
import PostDescription from "../components/PostDescription";
import SimilarPostsSection from "../components/SimilarPostsSection";
import Lightbox from "../components/Lightbox";

/**
 * Trang Chi Tiết Tin Đăng
 * - Chịu trách nhiệm lấy ID từ URL.
 * - Gọi custom hook `usePostDetails` để lấy data và logic.
 * - Quản lý các UI state của riêng trang này (lightbox, floating box).
 * - Sắp xếp layout các component con.
 */
const ChiTietTinDang = ({ onOpenChat }) => {
  const { id } = useParams();
  const navigate = useNavigate(); // Vẫn giữ navigate ở đây phòng trường hợp cần chuyển trang
  const { user } = useContext(AuthContext);

  // ✅ Lấy toàn bộ logic và data từ custom hook
  const { 
    post, 
    similarPostsByCategory, 
    similarPostsBySeller, 
    loading, 
    handleChatWithSeller // Lấy hàm xử lý chat từ hook
  } = usePostDetails(id, onOpenChat);

  // State giao diện (UI state) vẫn giữ ở component này
  const [showFloatingBox, setShowFloatingBox] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Effect quản lý box nổi
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
          description={post.moTa ? post.moTa.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').slice(0, 120) + (post.moTa.length > 120 ? '...' : '') : ''}
          // Các props liên quan đến SĐT có thể để FloatingBox tự quản lý
          onShowPhone={() => {}} 
          onChat={handleChatClick} // Truyền hàm xử lý chat
          showPhone={false} 
          phoneMasked={`${post.phoneNumber?.substring(0, 6)}****`}
          currentUserId={user?.id}
          sellerId={post.maNguoiBan}
        />
      )}

      {/* Layout chính của tin đăng (Header) */}
      <div className={styles.tinDangHeader}>
        {/* Phần Carousel Ảnh */}
        <div className={styles.imageContainer}>
          <PostImageCarousel 
            images={post.images} 
            onImageClick={handleOpenLightbox} // Truyền hàm mở lightbox
          />
        </div>

        {/* Phần Thông Tin Tin Đăng */}
        <div className={styles.chiTietTinDangInfoWrapper}>
          <PostDetailsInfo
            post={post}
            formattedPrice={formattedPrice}
            onChat={handleChatClick} // Truyền hàm xử lý chat
            currentUserId={user?.id}
          />
        </div>
      </div>

      {/* Phần Mô Tả */}
      <PostDescription description={post.moTa} />

      {/* Tin Đăng Cùng Người Bán */}
      <SimilarPostsSection
        title={`Các tin đăng khác của ${post.nguoiBan}`}
        posts={similarPostsBySeller}
      />

      {/* Tin Đăng Tương Tự */}
      <SimilarPostsSection
        title="Tin đăng tương tự"
        posts={similarPostsByCategory}
      />

      {/* Lightbox (chỉ render khi cần) */}
      {showLightbox && (
        <Lightbox
          images={post.images}
          startIndex={lightboxIndex}
          onClose={handleCloseLightbox} // Truyền hàm đóng lightbox
        />
      )}
    </div>
  );
};

export default ChiTietTinDang;