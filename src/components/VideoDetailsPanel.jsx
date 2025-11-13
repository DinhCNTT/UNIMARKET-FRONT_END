import React, { useState, useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import {
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaRegCheckCircle,
} from "react-icons/fa";
import { SiMinutemailer } from "react-icons/si";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./VideoDetailsPanel.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Lock,
  XCircle,
  AlertTriangle,
  MessageCircle,
} from "lucide-react"; // icon chuyên nghiệp
import StickyInfoBar from "./StickyInfoBar";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
// thêm icon mũi tên

// ------------ ImageCarousel (paste vào same file) ------------
const ImageCarousel = ({ images = [] }) => {
  const trackRef = useRef(null);

  // pointer/drag helpers
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollStartRef = useRef(0);
  const candidateIndexRef = useRef(-1);

  const [showArrows, setShowArrows] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => setShowArrows(images.length > 5), [images]);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  const scrollByOneItem = (dir = "right") => {
    const el = trackRef.current;
    if (!el) return;
    const firstItem = el.querySelector(".carousel-item");
    const gap = 10; // Cập nhật theo gap của CSS
    const itemWidth = firstItem
      ? firstItem.clientWidth + gap
      : Math.round(el.clientWidth * 0.5);
    el.scrollBy({
      left: dir === "right" ? itemWidth : -itemWidth,
      behavior: "smooth",
    });
  };

  // Pointer drag + click detection
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const threshold = 6; // px

    const onPointerDown = (e) => {
      isPointerDownRef.current = true;
      isDraggingRef.current = false;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      scrollStartRef.current = el.scrollLeft;

      // lấy index của item đang bắt pointer (nếu có)
      const item = e.target.closest
        ? e.target.closest(".carousel-item")
        : null;
      candidateIndexRef.current = item ? Number(item.dataset.index) : -1;

      el.classList.add("dragging");
      try {
        el.setPointerCapture?.(e.pointerId);
      } catch {}
    };

    const onPointerMove = (e) => {
      if (!isPointerDownRef.current) return;
      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;
      if (
        !isDraggingRef.current &&
        (Math.abs(dx) > threshold || Math.abs(dy) > threshold)
      ) {
        isDraggingRef.current = true;
      }
      if (isDraggingRef.current) {
        el.scrollLeft = scrollStartRef.current - dx;
      }
    };

    const onPointerUp = (e) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;
      el.classList.remove("dragging");
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {}

      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;

      // nếu không drag (movement nhỏ) và có candidateIndex => coi là click -> open lightbox
      if (
        !isDraggingRef.current &&
        candidateIndexRef.current >= 0 &&
        Math.abs(dx) < threshold &&
        Math.abs(dy) < threshold
      ) {
        setCurrentIndex(candidateIndexRef.current);
        setIsLightboxOpen(true);
      }

      // reset
      isDraggingRef.current = false;
      candidateIndexRef.current = -1;
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    setTimeout(updateArrows, 50);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [images]);

  // keyboard nav
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") scrollByOneItem("left");
      if (e.key === "ArrowRight") scrollByOneItem("right");
    };
    el.setAttribute("tabindex", "0");
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  if (!images || images.length === 0) return null;

  const closeLightbox = () => setIsLightboxOpen(false);
  const nextImage = () =>
    setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <>
      <div className="carousel-root" aria-label="Image slider">
        {showArrows && (
          <button
            className={`carousel-arrow carousel-arrow-left ${
              canScrollLeft ? "" : "hidden"
            }`}
            onClick={() => scrollByOneItem("left")}
          >
            <FaChevronLeft />
          </button>
        )}

        <div className="carousel-viewport">
          <div
            className="carousel-track"
            ref={trackRef}
            role="list"
            style={{ touchAction: "pan-y" }}
          >
            {images.map((src, i) => (
              <div key={i} data-index={i} className="carousel-item" role="listitem">
                <img
                  src={typeof src === "string" ? src : src.url ?? src.src}
                  alt={`Ảnh ${i + 1}`}
                  className="carousel-img"
                  draggable="false"
                />
              </div>
            ))}
          </div>
        </div>

        {showArrows && (
          <button
            className={`carousel-arrow carousel-arrow-right ${
              canScrollRight ? "" : "hidden"
            }`}
            onClick={() => scrollByOneItem("right")}
          >
            <FaChevronRight />
          </button>
        )}
      </div>

      {isLightboxOpen && (
        <div className="ic-lightbox-overlay" onClick={closeLightbox}>
          <div
            className="ic-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="ic-lightbox-close"
              onClick={closeLightbox}
            >
              <IoClose size={28} />
            </button>
            <button className="ic-lightbox-prev" onClick={prevImage}>
              <FaChevronLeft />
            </button>

            <img
              src={
                typeof images[currentIndex] === "string"
                  ? images[currentIndex]
                  : images[currentIndex].url ?? images[currentIndex].src
              }
              alt="Preview"
              className="ic-lightbox-img"
            />

            <button className="ic-lightbox-next" onClick={nextImage}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
// ------------ end ImageCarousel ------------

const VideoDetailsPanel = ({
  isOpen,
  onClose,
  loading,
  data,
  user,
  onOpenChat,
}) => {
  const [showPhone, setShowPhone] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // lưu touch start để xử lý touch overscroll
  const touchStartYRef = useRef(null);

  useEffect(() => {
    setShowPhone(false);
    setExpanded(false);
  }, [data]);

  // 1) Add/remove class .no-scroll lên viewer (fallback)
  useEffect(() => {
    const viewer =
      document.querySelector(".vdv-wrapper") ||
      document.querySelector(".vdv-full-screen-scroll") ||
      document.querySelector(".video-detail-viewer");
    if (!viewer) return;

    if (isOpen) {
      viewer.classList.add("no-scroll");
    } else {
      viewer.classList.remove("no-scroll");
    }
  }, [isOpen]);

  // 2) Thêm listeners cấp cao (capture) để chặn wheel/touchmove khi panel mở
  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;

    // WHEEL (touchpad / mouse wheel)
    const onWheelCapture = (e) => {
      // Nếu event xảy ra trong panel thì cho phép, nhưng phải chặn overscroll lan ra ngoài.
      if (panel.contains(e.target)) {
        const atTop = panel.scrollTop === 0 && e.deltaY < 0;
        const atBottom =
          panel.scrollHeight - panel.clientHeight === panel.scrollTop &&
          e.deltaY > 0;

        if (atTop || atBottom) {
          // ngăn overscroll lan ra viewer
          e.preventDefault();
          e.stopPropagation();
        }
        // otherwise allow normal panel scrolling
        return;
      }

      // Nếu event không ở trong panel -> chặn luôn (không cho viewer cuộn)
      e.preventDefault();
      e.stopPropagation();
    };

    // TOUCH (mobile)
    const onTouchStartCapture = (e) => {
      touchStartYRef.current = e.touches ? e.touches[0].clientY : null;
    };

    const onTouchMoveCapture = (e) => {
      const currentY = e.touches ? e.touches[0].clientY : null;
      const startY = touchStartYRef.current;
      const deltaY =
        startY != null && currentY != null ? currentY - startY : 0;

      if (panel.contains(e.target)) {
        const atTop = panel.scrollTop === 0 && deltaY > 0;
        const atBottom =
          panel.scrollHeight - panel.clientHeight === panel.scrollTop &&
          deltaY < 0;

        if (atTop || atBottom) {
          // ngăn overscroll lan ra ngoài
          e.preventDefault();
          e.stopPropagation();
        }
        // update start Y để trg next move còn tính delta chính xác
        touchStartYRef.current = currentY;
        return;
      }

      // Nếu touchmove ở ngoài panel -> chặn luôn
      e.preventDefault();
      e.stopPropagation();
    };

    // Gắn listener ở capture phase và passive:false để có thể preventDefault
    document.addEventListener("wheel", onWheelCapture, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchstart", onTouchStartCapture, {
      passive: true,
      capture: true,
    });
    document.addEventListener("touchmove", onTouchMoveCapture, {
      passive: false,
      capture: true,
    });

    // cleanup
    return () => {
      document.removeEventListener("wheel", onWheelCapture, { capture: true });
      document.removeEventListener("touchstart", onTouchStartCapture, {
        capture: true,
      });
      document.removeEventListener("touchmove", onTouchMoveCapture, {
        capture: true,
      });
      touchStartYRef.current = null;
    };
  }, [isOpen]);

  // Dùng để chặn propagation cho sự kiện nội bộ panel
  const stopScrollPropagation = (e) => {
    // Không preventDefault ở đây để vẫn cho panel scroll bình thường
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const formatPhone = (phone) =>
    showPhone ? phone : phone?.slice(0, 6) + "***";
  const getUserId = (u) =>
    u?.id ?? u?.maNguoiDung ?? u?.MaNguoiDung ?? u?.userId ?? u?._id ?? null;

  const getSellerId = (s) =>
    s?.id ?? s?.maNguoiDung ?? s?.MaNguoiDung ?? s?._id ?? null;

  // Cập nhật hàm handleChatWithSeller trong VideoDetailsPanel.jsx
  const handleChatWithSeller = async () => {
    let effectiveUser = user;
    if (!effectiveUser) {
      try {
        const raw =
          localStorage.getItem("user") ||
          localStorage.getItem("currentUser") ||
          localStorage.getItem("authUser");
        if (raw) effectiveUser = JSON.parse(raw);
      } catch {}
    }

    const myId = getUserId(effectiveUser);
    const sellerId = getSellerId(data?.nguoiDang);

    // ---- CASE: Chưa đăng nhập ----
    if (!myId) {
      toast.info("Vui lòng đăng nhập để bắt đầu cuộc trò chuyện.", {
        icon: <Lock size={20} />,
        className: "um-toast um-toast--info",
        bodyClassName: "um-toast-body",
        progressClassName: "um-toast-progress",
        toastId: "need-login",
      });
      return;
    }

    // ---- CASE: Không tìm thấy người bán ----
    if (!sellerId) {
      toast.error("Không tìm thấy thông tin người bán. Vui lòng thử lại.", {
        icon: <XCircle size={20} />,
        className: "um-toast um-toast--error",
        bodyClassName: "um-toast-body",
        progressClassName: "um-toast-progress",
        toastId: "seller-not-found",
      });
      return;
    }

    // ---- CASE: Chat với chính mình ----
    if (myId === sellerId) {
      toast.warning("Bạn không thể chat với chính mình.", {
        icon: <AlertTriangle size={20} />,
        className: "um-toast um-toast--warning",
        bodyClassName: "um-toast-body",
        progressClassName: "um-toast-progress",
        toastId: "cannot-self-chat",
      });
      return;
    }

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await axios.post(
        "http://localhost:5133/api/chat/start",
        {
          MaNguoiDung1: myId,
          MaNguoiDung2: sellerId,
          MaTinDang: data?.maTinDang,
        },
        { headers }
      );

      const maCuocTroChuyen =
        response.data?.maCuocTroChuyen ??
        response.data?.MaCuocTroChuyen ??
        null;

      if (maCuocTroChuyen) {
        // ---- CASE: Tạo chat thành công ----
        toast.success("Đang mở cuộc trò chuyện...", {
          icon: <MessageCircle size={20} />,
          className: "um-toast um-toast--success",
          bodyClassName: "um-toast-body",
          progressClassName: "um-toast-progress",
          toastId: "opening-chat",
        });

        setTimeout(async () => {
          // Refresh ChatList nếu đang ở trang chat
          if (window.location.pathname.includes("/chat")) {
            window.dispatchEvent(new CustomEvent("refreshChatList"));
          }

          if (typeof onOpenChat === "function") {
            onOpenChat(maCuocTroChuyen);
          } else {
            navigate(`/chat/${maCuocTroChuyen}`);
          }
        }, 1000);
      } else {
        toast.error("Không thể tạo cuộc trò chuyện. Vui lòng thử lại.", {
          icon: <XCircle size={20} />,
          className: "um-toast um-toast--error",
          bodyClassName: "um-toast-body",
          progressClassName: "um-toast-progress",
          toastId: "create-failed",
        });
      }
    } catch (error) {
      console.error("Lỗi tạo cuộc trò chuyện:", error);

      if (error?.response) {
        const { status, data } = error.response;

        // ---- CASE: Token hết hạn ----
        if (status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", {
            icon: <Lock size={20} />,
            className: "um-toast um-toast--error",
            bodyClassName: "um-toast-body",
            progressClassName: "um-toast-progress",
            toastId: "expired-session",
          });
          return;
        }

        // ---- CASE: Bị chặn ----
        if (status === 403) {
          let blocker = null;
          let blocked = null;

          if (typeof data === "object" && data !== null) {
            blocker = data.blockerName || data.BlockerName || null;
            blocked = data.blockedName || data.BlockedName || null;
          }

          const msg =
            blocker && blocked
              ? `${blocker} đã chặn ${blocked}.`
              : "Bạn không thể nhắn tin với người này (đã bị chặn).";

          toast.error(msg, {
            icon: <XCircle size={20} />,
            className: "um-toast um-toast--error",
            bodyClassName: "um-toast-body",
            progressClassName: "um-toast-progress",
            toastId: "blocked-chat",
          });
          return;
        }

        // ---- CASE: Bad Request ----
        if (status === 400) {
          toast.error("Yêu cầu không hợp lệ.", {
            icon: <AlertTriangle size={20} />,
            className: "um-toast um-toast--error",
            bodyClassName: "um-toast-body",
            progressClassName: "um-toast-progress",
            toastId: "bad-request",
          });
          return;
        }
      }

      // ---- CASE: Unknown Error ----
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.", {
        icon: <XCircle size={20} />,
        className: "um-toast um-toast--error",
        bodyClassName: "um-toast-body",
        progressClassName: "um-toast-progress",
        toastId: "unknown-error",
      });
    }
  };

  return (
    <div className="video-detail-overlay" onClick={onClose}>
      <div
        className="video-detail-panel"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        onWheel={stopScrollPropagation}
        onTouchStart={(e) => {
          // đảm bảo touchStartRef bên trong React cũng được cập nhật (bảo hiểm)
          if (e.touches && e.touches[0])
            touchStartYRef.current = e.touches[0].clientY;
        }}
        onTouchMove={stopScrollPropagation}
      >
        {/* Sticky Info Bar */}
        <StickyInfoBar
          data={data}
          user={user}
          onOpenChat={() => handleChatWithSeller()}
          panelRef={panelRef}
        />

        {/* Header */}
        <div className="video-detail-header">
          <h3>Chi tiết tin đăng</h3>
          <IoClose size={28} className="close-btn" onClick={onClose} />
        </div>

        {/* Nội dung scroll */}
        <div className="video-detail-scroll">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : data ? (
            <>
              <div className="video-detail-content">
                {data.danhMuc && (
                  <div className="category-info">
                    Danh mục: {data.danhMuc.tenDanhMuc}
                    {data.danhMuc.danhMucCha && (
                      <span> ({data.danhMuc.danhMucCha.tenDanhMucCha})</span>
                    )}
                  </div>
                )}

                <h4 className="title">{data.tieuDe}</h4>

                <div className="price">
                  <span>{data.gia?.toLocaleString()} đ</span>
                  {data.coTheThoaThuan && (
                    <span className="note">(Có thể thương lượng)</span>
                  )}
                </div>

                {data.danhSachAnh?.length > 0 && (
                  <ImageCarousel images={data.danhSachAnh} />
                )}

                <div className="video-detail-info">
                  <div className="video-detail-info-item">
                    <FaRegCheckCircle className="info-icon" />
                    <span className="value">{data.tinhTrang}</span>
                  </div>
                  <div className="video-detail-info-item">
                    <FaMapMarkerAlt className="info-icon" />
                    <span className="value">
                      {data.diaChi}, {data.quanHuyen}, {data.tinhThanh}
                    </span>
                  </div>
                  <div className="video-detail-info-item">
                    <FaCalendarAlt className="info-icon" />
                    <span className="value">{data.ngayDang}</span>
                  </div>
                </div>

                {data.nguoiDang && (
                  <div className="seller-section">
                    <h5 className="section-title">Thông tin người bán</h5>
                    <div className="seller-info">
                      <img
                        src={data.nguoiDang.avatarUrl}
                        alt="avatar"
                        className="seller-avatar"
                      />
                      <div className="seller-details">
                        <div className="seller-name">
                          {data.nguoiDang.fullName}
                        </div>
                      </div>
                    </div>
                    <div className="contact-actions">
                      <button
                        className="contact-btn phone" /* <-- Thay đổi class */
                        onClick={() => setShowPhone(true)}
                      >
                        <FaPhoneAlt className="btn-icon" />
                        {formatPhone(data.nguoiDang.phoneNumber)}
                      </button>

                      {getUserId(user) !== getSellerId(data.nguoiDang) && (
                        <button
                          className="contact-btn chat" /* <-- Thay đổi class */
                          onClick={handleChatWithSeller}
                          title={
                            !user
                              ? "Bạn cần đăng nhập để chat"
                              : "Chat với người bán"
                          }
                        >
                          <SiMinutemailer className="btn-icon" />
                          Chat
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {data.moTa && (
                  <div className="description-section">
                    <h5 className="section-title">Mô tả chi tiết</h5>
                    <p
                      className={`description-text ${
                        expanded ? "expanded" : "collapsed"
                      }`}
                    >
                      {data.moTa}
                    </p>
                    {data.moTa.length > 150 && ( // Tăng ngưỡng lên 1 chút
                      <button
                        className="toggle-btn"
                        onClick={() => setExpanded(!expanded)}
                      >
                        {expanded ? "Thu gọn" : "Xem thêm"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="error">Không tìm thấy thông tin chi tiết.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetailsPanel;