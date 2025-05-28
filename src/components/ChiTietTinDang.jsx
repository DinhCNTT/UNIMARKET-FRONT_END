import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./ChiTietTinDang.css";
import TopNavbar from "../components/TopNavbar";
import { AuthContext } from "../context/AuthContext";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const ChiTietTinDang = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [post, setPost] = useState(null);
  const [similarPosts, setSimilarPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const scrollRef = useRef(null);

  const handleShowPhoneNumber = () => setShowPhoneNumber(!showPhoneNumber);
  const handleScroll = (direction) =>
    scrollRef.current.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  const handleSimilarPostClick = (postId) => {
    navigate(`/tin-dang/${postId}`);
    window.scrollTo(0, 0);
  };

  // Lấy tin đăng và tin tương tự
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5133/api/tindang/get-post-and-similar/${id}`
        );
        setPost(response.data.post);
        setSimilarPosts(response.data.similarPosts);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi lấy tin đăng:", error);
        setLoading(false);
        setPost(null);
      }
    };
    fetchPost();
  }, [id]);

  // Bấm nút chat với người bán, tạo hoặc lấy mã cuộc trò chuyện rồi chuyển trang
  const handleChatWithSeller = async () => {
  if (!user) {
    alert("Bạn cần đăng nhập để chat với người bán.");
    return;
  }
  if (user.id === post.maNguoiBan) {
    alert("Bạn không thể chat với chính mình.");
    return;
  }

  try {
    const response = await axios.post("http://localhost:5133/api/chat/start", {
      MaNguoiDung1: user.id,
      MaNguoiDung2: post.maNguoiBan,
      MaTinDang: post.maTinDang,  // Gửi thêm mã tin đăng
    });
    const maCuocTroChuyen =
      response.data.maCuocTroChuyen || response.data.MaCuocTroChuyen || null;
    if (maCuocTroChuyen) {
      navigate(`/chat/${maCuocTroChuyen}`);
    } else {
      alert("Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.");
    }
  } catch (error) {
    console.error("Lỗi tạo cuộc trò chuyện:", error);
    if (error.response) {
      console.error("Chi tiết lỗi từ server:", error.response.data);
    }
    alert("Lỗi khi tạo cuộc trò chuyện. Vui lòng thử lại.");
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
      <div className="carousel-cttd-wrapper">
        <div className="carousel-cttd-imgbox">
          {isVideo(validMedia[current]) ? (
            <video
              src={getMediaUrl(validMedia[current])}
              controls
              className="carousel-cttd-img"
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
              className="carousel-cttd-img"
              style={{ cursor: "zoom-in" }}
              onClick={() => {
                setShowLightbox(true);
                setLightboxIndex(current);
              }}
            />
          )}
          <div className="carousel-cttd-index">
            {current + 1} / {validMedia.length}
          </div>
          {validMedia.length > 1 && (
            <>
              <button
                onClick={prevMedia}
                className="carousel-cttd-btn carousel-cttd-btn-left"
              >
                ←
              </button>
              <button
                onClick={nextMedia}
                className="carousel-cttd-btn carousel-cttd-btn-right"
              >
                →
              </button>
            </>
          )}
        </div>
        {validMedia.length > 1 && (
          <div className="multi-image-gallery">
            {validMedia.map((media, idx) =>
              isVideo(media) ? (
                <video
                  key={idx}
                  src={getMediaUrl(media)}
                  className="carousel-cttd-thumb"
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
                  className="carousel-cttd-thumb"
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
    <div className="chi-tiet-tin-dang">
      <TopNavbar />
      <div className="tin-dang-header">
        <div className="image-container">
          {post.images && post.images.length > 0 ? (
            <PostImageCarousel images={post.images} />
          ) : (
            <div>Không có ảnh</div>
          )}
        </div>

        <div className="chi-tiet-tin-dang-info">
          <h1>{post.tieuDe}</h1>
          <p>
            <strong>Giá:</strong>{" "}
            <span className="price">{formattedPrice}</span>
          </p>
          <p>
            <strong>Địa chỉ:</strong> {post.diaChi}
          </p>
          <p>
            <strong>Ngày đăng:</strong> {formatDate(post.ngayDang)}
          </p>

          <div className="sdt-chat">
            <button className="sdt" onClick={handleShowPhoneNumber}>
              {showPhoneNumber
                ? post.phoneNumber
                : `Hiện số ${post.phoneNumber.substring(0, 6)}****`}
            </button>

            {user?.id !== post.maNguoiBan && (
              <button className="sdt sdt-chat-btn" onClick={handleChatWithSeller}>
                💬 Chat với người bán
              </button>
            )}
          </div>

          <div className="seller-info">
            <div className="seller-name">Người bán tên: {post.nguoiBan}</div>
          </div>
        </div>
      </div>

      <div className="mo-ta-chi-tiet">
        <p>
          <strong>Số điện thoại:</strong>{" "}
          <span
            onClick={handleShowPhoneNumber}
            style={{ color: "blue", cursor: "pointer" }}
          >
            {showPhoneNumber
              ? post.phoneNumber
              : `${post.phoneNumber.substring(0, 6)}****`}
          </span>
        </p>
        <div
          className={`mo-ta-nd-cttd-wrapper ${
            showFullDescription ? "mo-ta-nd-cttd-full" : "mo-ta-nd-cttd-clamp"
          }`}
          dangerouslySetInnerHTML={{ __html: (post.moTa || "").replace(/\n/g, "<br/>") }}
        />
        {post.moTa?.split("\n").length > 8 && (
          <button
            className="mo-ta-nd-cttd-toggle"
            onClick={() => setShowFullDescription(!showFullDescription)}
          >
            {showFullDescription ? "Thu gọn" : "Xem thêm"}
          </button>
        )}
      </div>

      <div className="tin-dang-tuong-tu">
        <h2>Tin đăng tương tự</h2>
        <div className="similar-posts-wrapper">
          <button className="scroll-btn left" onClick={() => handleScroll("left")}>
            &lt;
          </button>
          <div className="similar-posts-container" ref={scrollRef}>
            {similarPosts.map((post) => (
              <div
                key={post.maTinDang}
                className="similar-post-card"
                onClick={() => handleSimilarPostClick(post.maTinDang)}
              >
                <div className="image-wrapper">
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
                <p className="gia">
                  {post.gia.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VND"}
                </p>
                <p>{post.diaChi}</p>
                <p className="nho">{formatDate(post.ngayDang)}</p>
              </div>
            ))}
          </div>
          <button className="scroll-btn right" onClick={() => handleScroll("right")}>
            &gt;
          </button>
        </div>
      </div>

      {showLightbox && (
        <div className="lightbox-overlay" onClick={() => setShowLightbox(false)}>
          {post.images[lightboxIndex].match(/\.(mp4|mov|avi|webm|ogg)$/i) ? (
            <video
              src={
                post.images[lightboxIndex].startsWith("http")
                  ? post.images[lightboxIndex]
                  : `http://localhost:5133${post.images[lightboxIndex]}`
              }
              className="lightbox-img"
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
              className="lightbox-img"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <button
            className="lightbox-nav left"
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
            className="lightbox-nav right"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) =>
                prev === post.images.length - 1 ? 0 : prev + 1
              );
            }}
          >
            →
          </button>
          <span className="lightbox-close" onClick={() => setShowLightbox(false)}>
            ×
          </span>
          <div className="lightbox-counter">
            {lightboxIndex + 1} / {post.images.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChiTietTinDang;
