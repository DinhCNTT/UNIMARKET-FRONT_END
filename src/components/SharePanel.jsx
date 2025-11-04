import React, { useState, useEffect, useRef } from "react";
import { FaFacebookF, FaTwitter, FaLinkedin, FaWhatsapp, FaLink, FaSearch } from "react-icons/fa";
import { SiZalo, SiTelegram } from "react-icons/si";
import { FaCheckCircle } from "react-icons/fa";
import axios from "axios";
import "./SharePanel.css";

const SharePanel = ({ 
  isOpen, 
  onClose, 
  tinDangId, 
  displayMode = "Image", 
  index = 0,
  previewTitle, 
  previewImage, 
  previewVideo 
}) => {
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const savedScrollY = useRef(0);
  const [showSearch, setShowSearch] = useState(false);
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  // Ref cho 2 thanh cuộn
  const scrollRef = useRef(null); // Ref cho social icons
  const friendScrollRef = useRef(null); // Ref MỚI cho danh sách bạn bè

  // State cho thanh cuộn bạn bè
  const [canScrollFriends, setCanScrollFriends] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setShareData(null);
      setSelectedFriend(null); // reset khi mở lại panel
    }
  }, [isOpen, tinDangId, index]);

  // Lock scroll khi mở modal
  useEffect(() => {
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    if (isOpen) {
      savedScrollY.current = window.scrollY || 0;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      document.addEventListener("touchmove", preventScroll, { passive: false });
      document.addEventListener("wheel", preventScroll, { passive: false });
    } else {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, savedScrollY.current);

      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("wheel", preventScroll);
    }

    return () => {
      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("wheel", preventScroll);
    };
  }, [isOpen]);

  // Fetch friends khi đăng nhập
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchFriends();
    }
  }, [isOpen, isLoggedIn]);

  // --- fetchFriends: map server fields (Id/FullName) -> camelCase (id/fullName) ---
  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const res = await axios.get("http://localhost:5133/api/SocialShare/friends/list", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const raw = res.data || [];
      const mapped = raw.map(u => ({
        id: u.Id ?? u.id,
        fullName: u.FullName ?? u.fullName,
        avatarUrl: u.AvatarUrl ?? u.avatarUrl,
        isFollowing: (u.IsFollowing ?? u.isFollowing) ?? false,
        isFollower: (u.IsFollower ?? u.isFollower) ?? false
      }));
      setFriends(mapped);
    } catch (err) {
      console.error("Lỗi lấy danh sách bạn bè:", err);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  // --- handleShareToFriend: dùng selectedFriend.id ---
  const handleShareToFriend = async () => {
      if (!selectedFriend) return alert("Chọn 1 người bạn trước đã.");

      try {
          const payload = {
              TargetUserIds: [selectedFriend.id],
              TinDangId: tinDangId || null,
              PreviewTitle: previewTitle || "Một tin đăng thú vị",
              PreviewImage: previewImage || null,
              PreviewVideo: previewVideo || null,
              ExtraText: "đã gửi 1 video", 
              ChatType: 2, 
              DisplayMode: displayMode === "Video" ? 2 : 1 
          };

          const res = await axios.post(
              "http://localhost:5133/api/SocialShare/share-to-friends",
              payload,
              { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );

          console.log("share-to-friends response:", res.data);
          if (res.data?.success) {
              alert(`✅ Đã gửi cho ${selectedFriend.fullName || selectedFriend.id}!`);
              setSelectedFriend(null);
          } else {
              alert("Không gửi được: " + (res.data?.message ?? JSON.stringify(res.data)));
          }
      } catch (err) {
          console.error("Lỗi share qua chat:", err.response?.data ?? err.message);
          alert("❌ Lỗi gửi: " + (err.response?.data ?? err.message));
      }
  };

  const BASE_URL = "http://localhost:5133/api/Share";

  const fetchShareLink = async (platform = "Copy") => {
    setLoading(true);
    try {
      const payload = { TinDangId: tinDangId, Platform: platform, DisplayMode: displayMode, Index: index };
      const res = await axios.post(`${BASE_URL}/social`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setShareData(res.data);
      return res.data.shareLink;
    } catch (err) {
      console.error("Lỗi API:", err.response?.data || err.message);
      alert("❌ Lấy link share thất bại!");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleShareClick = async (platform) => {
    const link = await fetchShareLink(platform);
    if (!link) return;

    let shareUrl = "";
    switch (platform) {
      case "Facebook": shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`; break;
      case "Twitter": shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}`; break;
      case "Zalo": shareUrl = `https://zalo.me/share/?url=${encodeURIComponent(link)}`; break;
      case "LinkedIn": shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`; break;
      case "WhatsApp": shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(link)}`; break;
      case "Telegram": shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}`; break;
    }
    window.open(shareUrl, "_blank");
  };

  const handleCopyLink = async () => {
    if (!shareData) await fetchShareLink();
    const link = shareData?.shareLink || `${window.location.origin}/video/${tinDangId}?index=${index}`;
    navigator.clipboard.writeText(link);
    alert("✅ Link đã copy!");
  };

  // Hàm cuộn cho social icons (giữ nguyên)
  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = 120;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  // ✅ HÀM MỚI: Cuộn cho danh sách bạn bè
  const scrollFriends = (dir) => {
    if (!friendScrollRef.current) return;
    const amount = 200; // Cuộn 200px
    friendScrollRef.current.scrollBy({ 
      left: dir === "left" ? -amount : amount, 
      behavior: "smooth" 
    });
  };

  // ✅ EFFECT MỚI: Kiểm tra overflow của friend scroll
  useEffect(() => {
    const checkScroll = () => {
      const el = friendScrollRef.current;
      if (el) {
        // Kiểm tra xem có cần cuộn hay không
        const hasOverflow = el.scrollWidth > el.clientWidth;
        setCanScrollFriends(hasOverflow); 
        
        // Kiểm tra xem có ở cạnh trái/phải không
        const atLeft = el.scrollLeft <= 0;
        // Thêm 1px sai số
        const atRight = el.scrollLeft >= (el.scrollWidth - el.clientWidth - 1); 
        
        setCanScrollLeft(!atLeft);
        setCanScrollRight(!atRight);
      } else {
        setCanScrollFriends(false);
        setCanScrollLeft(false);
        setCanScrollRight(false);
      }
    };

    // Cần một chút trễ để DOM render sau khi friends được load
    const timer = setTimeout(checkScroll, 100); 

    const el = friendScrollRef.current;
    if (el) {
      // Lắng nghe sự kiện scroll trên chính element đó
      el.addEventListener('scroll', checkScroll, { passive: true });
    }
    // Lắng nghe resize cửa sổ
    window.addEventListener('resize', checkScroll);

    return () => {
      clearTimeout(timer);
      if (el) {
        el.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
    // Chạy lại mỗi khi friends thay đổi hoặc panel được mở
  }, [friends, loadingFriends, isOpen]); 


  if (!isOpen) return null;

  return (
    <div className="share-panel-overlay" onClick={onClose}>
      <div className="share-panel" onClick={(e) => e.stopPropagation()}>
        <h3 className="share-title">Chia sẻ</h3>

        {/* Danh sách bạn bè */}
        {isLoggedIn && (
          <div className="friend-list"> {/* Container này đã có position: relative */}
            
            {/* Icon kính lúp */}
            <div className="search-toggle">
              {!showSearch ? (
                <FaSearch
                  className="search-icon"
                  onClick={() => setShowSearch(true)} // click để bật input
                  style={{ cursor: "pointer", fontSize: "25px" }}
                />
              ) : (
                <input
                  type="text"
                  autoFocus
                  placeholder="Tìm bạn bè..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => {
                    if (search.trim() === "") setShowSearch(false); // nếu rỗng thì quay về icon
                  }}
                  className="search-input"
                />
              )}
            </div>

            {/* ✅ WRAPPER MỚI VÀ CÁC NÚT MŨI TÊN */}
            <div className="friend-scroll-wrapper">
              
              {/* Chỉ render mũi tên NẾU danh sách đủ dài (canScrollFriends === true) */}
              {canScrollFriends && (
                <>
                  <button 
                    className={`friend-arrow-btn left ${!canScrollLeft ? 'disabled' : ''}`}
                    onClick={() => scrollFriends("left")}
                    disabled={!canScrollLeft}
                    aria-label="Cuộn sang trái"
                  >
                    &#8249;
                  </button>
                  <button 
                    className={`friend-arrow-btn right ${!canScrollRight ? 'disabled' : ''}`}
                    onClick={() => scrollFriends("right")}
                    disabled={!canScrollRight}
                    aria-label="Cuộn sang phải"
                  >
                    &#8250;
                  </button>
                </>
              )}

              {/* Nội dung cuộn gốc */}
              {loadingFriends ? (
                 <p style={{ textAlign: 'center', margin: '20px 0' }}>⏳ Đang tải bạn bè...</p>
              ) : (
                // ✅ Gán ref MỚI vào đây
                <div className="friend-scroll" ref={friendScrollRef}>
                  {(search.trim() === "" ? friends : friends.filter((f) =>
                    (f?.fullName || f?.name || "")
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )).map((friend) => (
                    <div
                      key={friend.id}
                      className={`friend-item ${selectedFriend?.id === friend.id ? "selected" : ""}`}
                      onClick={() => {
                        if (selectedFriend?.id === friend.id) {
                          setSelectedFriend(null);
                        } else {
                          setSelectedFriend(friend);
                        }
                      }}
                    >
                      <img
                        src={friend.avatarUrl || "/default-avatar.png"}
                        alt={friend.fullName || friend.name}
                        className="friend-avatar"
                      />
                      <div className="friend-name">{friend.fullName || friend.name}</div>
                      {selectedFriend?.id === friend.id && (
                        <span className="checkmark">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div> {/* Kết thúc .friend-scroll-wrapper */}
          </div>
        )}

        {/* Nếu đã chọn bạn bè → hiện nút Gửi */}
        {selectedFriend ? (
          <div className="send-section">
            <button className="send-btn" onClick={handleShareToFriend}>Gửi cho {selectedFriend.fullName}</button>
          </div>
        ) : (
          // Nếu chưa chọn bạn bè → hiện danh sách MXH (Giữ nguyên)
          <div className="share-options-wrapper">
            <button className="arrow-btn left" onClick={() => scroll("left")}>&#8249;</button>
            <div className="share-options" ref={scrollRef}>
              <button className="share-circle facebook" onClick={() => handleShareClick("Facebook")} disabled={loading}>
                <FaFacebookF size={20} /><span>Facebook</span>
              </button>
              <button className="share-circle twitter" onClick={() => handleShareClick("Twitter")} disabled={loading}>
                <FaTwitter size={20} /><span>Twitter</span>
              </button>
              <button className="share-circle zalo" onClick={() => handleShareClick("Zalo")} disabled={loading}>
                <SiZalo size={20} /><span>Zalo</span>
              </button>
              <button className="share-circle linkedin" onClick={() => handleShareClick("LinkedIn")} disabled={loading}>
                <FaLinkedin size={20} /><span>LinkedIn</span>
              </button>
              <button className="share-circle whatsapp" onClick={() => handleShareClick("WhatsApp")} disabled={loading}>
                <FaWhatsapp size={20} /><span>WhatsApp</span>
              </button>
              <button className="share-circle telegram" onClick={() => handleShareClick("Telegram")} disabled={loading}>
                <SiTelegram size={20} /><span>Telegram</span>
              </button>
              <button className="share-circle copy" onClick={handleCopyLink} disabled={loading}>
                <FaLink size={20} /><span>Copy</span>
              </button>
            </div>
            <button className="arrow-btn right" onClick={() => scroll("right")}>&#8250;</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharePanel;