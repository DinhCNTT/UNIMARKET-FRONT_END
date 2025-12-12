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
 * Trang Chi Tiết Tin Đăng (Final Version - Đã Fix)
 */
const ChiTietTinDang = ({ onOpenChat }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const {
    post,
    similarPostsByCategory,
    similarPostsBySeller,
    loading,
    handleChatWithSeller,
    isSaved,           
    handleToggleSave   
  } = usePostDetails(id, onOpenChat);

  const [showFloatingBox, setShowFloatingBox] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingBox(window.scrollY > 400); 
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  if (loading) return <div className={styles.loading}>Đang tải thông tin...</div>;
  if (!post) return <div className={styles.notFound}>Không tìm thấy tin đăng.</div>;

  const formattedPrice = formatPrice(post.gia);
console.log("🔥 DATA GỐC CỦA POST:", post);
  return (
    <div className={styles.chiTietTinDang}>
      <TopNavbar />

      {/* --- FLOATING BOX --- */}
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
            isSaved={isSaved} 
            onToggleSave={handleToggleSave}
            showPhoneNumber={showPhoneNumber}
            onTogglePhone={() => setShowPhoneNumber((s) => !s)}
          />
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className={styles.descriptionAndCommentsWrapper}>
        
        <div className={styles.descriptionContainer} id="mo-ta-chi-tiet">
          <PostDescription description={post.moTa} />

          {/* 👇 KHU VỰC SỬA LỖI QUAN TRỌNG 👇 */}
          <PostTechnicalSpecs 
            detailsJson={post.ChiTietObj || post.chiTietObj} // Dữ liệu MongoDB
            TinhTrang={post.TinhTrang || post.tinhTrang}       
  
  // Thử lấy CoTheThoaThuan (viết hoa) HOẶC coTheThoaThuan (viết thường)
  CoTheThoaThuan={post.CoTheThoaThuan || post.coTheThoaThuan}
          />
          {/* 👆 Đã thêm 2 dòng trên để truyền dữ liệu SQL vào con */}

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
        />
      </div>

      <div id="tin-dang-tuong-tu">
        <SimilarPostsSection
          title="Tin đăng tương tự"
          posts={similarPostsByCategory}
          mode="grid"    
        />
      </div>

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