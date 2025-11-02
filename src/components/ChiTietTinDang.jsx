import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ChiTietTinDang.module.css";
import TopNavbar from "../components/TopNavbar";
import FloatingProductBox from "./FloatingProductBox";
import { AuthContext } from "../context/AuthContext";
import Swal from "sweetalert2";
import { MdOutlineSell, MdOutlineLocationOn, MdOutlineCalendarToday,MdOutlineChat } from "react-icons/md";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Nhận prop onOpenChat để callback mở chatbox nếu có
const ChiTietTinDang = ({ onOpenChat }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [post, setPost] = useState(null);
  const [similarPostsByCategory, setSimilarPostsByCategory] = useState([]);
  const [similarPostsBySeller, setSimilarPostsBySeller] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const scrollRefSeller = useRef(null);
  const scrollRefCategory = useRef(null);
  const [showFloatingBox, setShowFloatingBox] = useState(false);
  const imageContainerRef = useRef(null);
  
  // Hiện box nổi khi scroll xuống nửa ảnh đầu tiên
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowFloatingBox(true);
      } else {
        setShowFloatingBox(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShowPhoneNumber = () => setShowPhoneNumber(!showPhoneNumber);
  const handleScroll = (direction, ref) =>
    ref.current.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  const handleSimilarPostClick = (postId) => {
    navigate(`/tin-dang/${postId}`);
    window.scrollTo(0, 0);
  };

  // Lấy tin đăng, tin tương tự theo danh mục, và tin từ cùng người bán
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5133/api/tindang/get-post-and-similar/${id}`
        );
        setPost(response.data.post);
        setSimilarPostsByCategory(response.data.similarPostsByCategory);
        setSimilarPostsBySeller(response.data.similarPostsBySeller);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi lấy tin đăng:", error);
        setLoading(false);
        setPost(null);
      }
    };
    fetchPost();
  }, [id]);

  // Bấm nút chat với người bán
  const handleChatWithSeller = async () => {
    try {
      const res = await axios.post("http://localhost:5133/api/chat/start", {
        MaNguoiDung1: user.id,
        MaNguoiDung2: post.maNguoiBan,
        MaTinDang: post.maTinDang,
      });

      const maCuocTroChuyen = res.data?.maCuocTroChuyen || res.data?.MaCuocTroChuyen;
      if (maCuocTroChuyen) {
        if (typeof onOpenChat === "function") onOpenChat(maCuocTroChuyen);
        else navigate(`/chat/${maCuocTroChuyen}`);
      } else {
        Swal.fire({ icon: "error", title: "Thông báo", text: "Không thể tạo cuộc trò chuyện. Vui lòng thử lại." });
      }
    } catch (err) {
      console.error("StartChat error:", err);

      // Nếu có response từ server
      if (err.response) {
        const { status, data } = err.response;
        // data có thể là object, ProblemDetails, hoặc string
        let serverMessage = null;

        if (typeof data === "string") {
          // Có thể server trả plain text
          serverMessage = data;
        } else if (data) {
          // Thử nhiều property phổ biến
          serverMessage = data.message || data.Message || data.detail || data.title || data.error;
        }

        // Nếu vẫn chưa có message, hiển thị theo status
        if (serverMessage) {
          Swal.fire({ icon: "error", title: "Thông báo", text: serverMessage });
        } else if (status === 403) {
          Swal.fire({ icon: "error", title: "Bị chặn", text: "Bạn không thể nhắn tin với người này (bị chặn)." });
        } else if (status === 400) {
          Swal.fire({ icon: "error", title: "Lỗi", text: "Yêu cầu không hợp lệ." });
        } else {
          Swal.fire({ icon: "error", title: "Lỗi", text: "Lỗi khi tạo cuộc trò chuyện. Vui lòng thử lại." });
        }

        // optional: log response body cho debug
        console.log("Server response body:", data);
      } else if (err.request) {
        // request đã gửi nhưng không có response
        Swal.fire({ icon: "error", title: "Lỗi kết nối", text: "Không nhận được phản hồi từ máy chủ." });
        console.log("No response:", err.request);
      } else {
        // lỗi khác
        Swal.fire({ icon: "error", title: "Lỗi", text: err.message || "Có lỗi xảy ra." });
      }
    }
  };

  if (loading) return <div>Đang tải thông tin...</div>;
  if (!post) return <div>Không tìm thấy tin đăng.</div>;

  const formattedPrice =
    post.gia.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VND";

  const PostImageCarousel = ({ images }) => {
    const [current, setCurrent] = useState(0);
    const validMedia = images?.filter((img) => img)?.slice(0, 8) || [];
    if (!validMedia.length) return <div>Không có media.</div>;

    const prevMedia = () =>
      setCurrent((prev) => (prev === 0 ? validMedia.length - 1 : prev - 1));
    const nextMedia = () =>
      setCurrent((prev) => (prev === validMedia.length - 1 ? 0 : prev + 1));
    const getMediaUrl = (media) =>
      media.startsWith("http") ? media : `http://localhost:5133${media}`;
    const isVideo = (url) => url.match(/\.(mp4|mov|avi|webm|ogg)$/i);

    return (
      <div className={styles.carouselWrapper}>
        <div className={styles.carouselImgbox}>
          {isVideo(validMedia[current]) ? (
            <video
              src={getMediaUrl(validMedia[current])}
              controls
              className={styles.carouselImg}
              style={{ cursor: "zoom-in" }}
              onClick={() => {
                setShowLightbox(true);
                setLightboxIndex(current);
              }}
            />
          ) : (
            <img
              src={getMediaUrl(validMedia[current])}
              alt={`Media ${current + 1}`}
              className={styles.carouselImg}
              style={{ cursor: "zoom-in" }}
              onClick={() => {
                setShowLightbox(true);
                setLightboxIndex(current);
              }}
            />
          )}
          <div className={styles.carouselIndex}>
            {current + 1} / {validMedia.length}
          </div>
          {validMedia.length > 1 && (
            <>
              <button
                onClick={prevMedia}
                className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`}
              >
                 {'<'}
              </button>
              <button
                onClick={nextMedia}
                className={`${styles.carouselBtn} ${styles.carouselBtnRight}`}
              >
                {'>'}
              </button>
            </>
          )}
        </div>
        {validMedia.length > 1 && (
          <div className={styles.multiImageGallery}>
            {validMedia.map((media, idx) =>
              isVideo(media) ? (
                <video
                  key={idx}
                  src={getMediaUrl(media)}
                  className={styles.carouselThumb}
                  onClick={() => setCurrent(idx)}
                  style={{
                    border: current === idx ? "2px solid #f80" : "1px solid #ddd",
                    cursor: "pointer",
                  }}
                />
              ) : (
                <img
                  key={idx}
                  src={getMediaUrl(media)}
                  alt={`Thumb ${idx + 1}`}
                  className={styles.carouselThumb}
                  onClick={() => setCurrent(idx)}
                  style={{
                    border: current === idx ? "2px solid #f80" : "1px solid #ddd",
                    cursor: "pointer",
                  }}
                />
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.chiTietTinDang}>
      <TopNavbar />
      <div className={styles.tinDangHeader}>
        <div className={styles.imageContainer} ref={imageContainerRef}>
          {/* Floating Product Box */}
          {showFloatingBox && post && (
            <FloatingProductBox
              image={post.images?.[0]?.startsWith("http") ? post.images[0] : post.images?.[0] ? `http://localhost:5133${post.images[0]}` : ""}
              title={post.tieuDe}
              price={formattedPrice}
              details={<>
                <span>{post.loaiSanPham || post.tieuDe}</span>
                {post.dungLuong && <span> | {post.dungLuong}</span>}
                {post.thoiGianBaoHanh && <span> | {post.thoiGianBaoHanh}</span>}
              </>}
              description={post.moTa ? post.moTa.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').slice(0, 120) + (post.moTa.length > 120 ? '...' : '') : ''}
              onShowPhone={() => setShowPhoneNumber(!showPhoneNumber)}
              onChat={handleChatWithSeller}
              showPhone={showPhoneNumber}
              phoneMasked={showPhoneNumber ? post.phoneNumber : `${post.phoneNumber?.substring(0, 6)}****`}
            />
          )}

          {post.images && post.images.length > 0 ? (
            <PostImageCarousel images={post.images} />
          ) : (
            <div>Không có ảnh</div>
          )}
        </div>

        <div className={styles.chiTietTinDangInfo}>
          <h1>{post.tieuDe}</h1>
          <p className={styles.infoLine}>
            <MdOutlineSell className={styles.icon} />
            <strong>Giá:</strong>{" "}
            <span className={styles.price}>{formattedPrice}</span>
          </p>
          <p className={styles.infoLine}>
            <MdOutlineLocationOn className={styles.icon} />
            <strong>Địa chỉ:</strong> {post.diaChi}
          </p>
          <p className={styles.infoLine}>
            <MdOutlineCalendarToday className={styles.icon} />
            <strong>Ngày đăng:</strong> {formatDate(post.ngayDang)}
          </p>
          <div className={styles.sdtChat}>
            <button className={styles.sdt} onClick={handleShowPhoneNumber}>
              {showPhoneNumber
                ? post.phoneNumber
                : `Hiện số ${post.phoneNumber.substring(0, 6)}****`}
            </button>

            {user?.id !== post.maNguoiBan && (
            <button
              className={`${styles.sdt} ${styles.sdtChatBtn}`}
              onClick={handleChatWithSeller}
            >
              <MdOutlineChat /> Chat với người bán
            </button>
          )}
          </div>

          <div className={styles.sellerInfo}>
            <div className={styles.sellerName}>Người bán: {post.nguoiBan}</div>
          </div>
        </div>
      </div>

      <div className={styles.moTaChiTiet} id="mo-ta-chi-tiet">
        <div style={{fontWeight:600, fontSize:18, marginBottom:8}}>Mô tả chi tiết</div>
        
        <div
          className={`${styles.moTaNdWrapper} ${
            showFullDescription ? styles.moTaNdFull : styles.moTaNdClamp
          }`}
          dangerouslySetInnerHTML={{ __html: (post.moTa || "").replace(/\n/g, "<br/>") }}
        />
        {post.moTa?.split("\n").length > 8 && (
          <button
            className={styles.moTaNdToggle}
            onClick={() => setShowFullDescription(!showFullDescription)}
          >
            {showFullDescription ? "Thu gọn" : "Xem thêm"}
          </button>
        )}
      </div>

      {similarPostsBySeller.length > 0 && (
        <div className={`${styles.tinDangTuongTu} ${styles.tinDangNguoiBan}`} id="tin-dang-tuong-tu">
          <h2>Các tin đăng khác của {post.nguoiBan}</h2>
          <div className={styles.similarPostsWrapper}>
            <button className={`${styles.scrollBtn} ${styles.left}`} onClick={() => handleScroll("left", scrollRefSeller)}>
              &lt;
            </button>
            <div className={styles.similarPostsContainer} ref={scrollRefSeller}>
              {similarPostsBySeller.map((post) => (
                <div
                  key={post.maTinDang}
                  className={styles.similarPostCard}
                  onClick={() => handleSimilarPostClick(post.maTinDang)}
                >
                  <div className={styles.imageWrapper}>
                    <img
                      src={
                        post.images?.[0]?.startsWith("http")
                          ? post.images[0]
                          : `http://localhost:5133${post.images[0]}`
                      }
                      alt={post.tieuDe}
                    />
                  </div>
                  <h3>{post.tieuDe}</h3>
                  <p className={styles.gia}>
                    {post.gia.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VND"}
                  </p>
                  <p>{post.diaChi}</p>
                  <p className={styles.nho}>{formatDate(post.ngayDang)}</p>
                </div>
              ))}
            </div>
            <button className={`${styles.scrollBtn} ${styles.right}`} onClick={() => handleScroll("right", scrollRefSeller)}>
              &gt;
            </button>
          </div>
        </div>
      )}

      <div className={styles.tinDangTuongTu}>
        <h2>Tin đăng tương tự</h2>
        <div className={styles.similarPostsWrapper}>
          <button className={`${styles.scrollBtn} ${styles.left}`} onClick={() => handleScroll("left", scrollRefCategory)}>
            &lt;
          </button>
          <div className={styles.similarPostsContainer} ref={scrollRefCategory}>
            {similarPostsByCategory.map((post) => (
              <div
                key={post.maTinDang}
                className={styles.similarPostCard}
                onClick={() => handleSimilarPostClick(post.maTinDang)}
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={
                      post.images?.[0]?.startsWith("http")
                        ? post.images[0]
                        : `http://localhost:5133${post.images[0]}`
                    }
                    alt={post.tieuDe}
                  />
                </div>
                <h3>{post.tieuDe}</h3>
                <p className={styles.gia}>
                  {post.gia.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VND"}
                </p>
                <p>{post.diaChi}</p>
                <p className={styles.nho}>{formatDate(post.ngayDang)}</p>
              </div>
            ))}
          </div>
          <button className={`${styles.scrollBtn} ${styles.right}`} onClick={() => handleScroll("right", scrollRefCategory)}>
            &gt;
          </button>
        </div>
      </div>

      {showLightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setShowLightbox(false)}>
          {post.images[lightboxIndex].match(/\.(mp4|mov|avi|webm|ogg)$/i) ? (
            <video
              src={
                post.images[lightboxIndex].startsWith("http")
                  ? post.images[lightboxIndex]
                  : `http://localhost:5133${post.images[lightboxIndex]}`
              }
              className={styles.lightboxImg}
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={
                post.images[lightboxIndex].startsWith("http")
                  ? post.images[lightboxIndex]
                  : `http://localhost:5133${post.images[lightboxIndex]}`
              }
              alt={`Full ${lightboxIndex + 1}`}
              className={styles.lightboxImg}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <button
            className={`${styles.lightboxNav} ${styles.left}`}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) =>
                prev === 0 ? post.images.length - 1 : prev - 1
              );
            }}
          >
            ←
          </button>
          <button
            className={`${styles.lightboxNav} ${styles.right}`}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) =>
                prev === post.images.length - 1 ? 0 : prev + 1
              );
            }}
          >
            →
          </button>
          <span className={styles.lightboxClose} onClick={() => setShowLightbox(false)}>
            ×
          </span>
          <div className={styles.lightboxCounter}>
            {lightboxIndex + 1} / {post.images.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChiTietTinDang;