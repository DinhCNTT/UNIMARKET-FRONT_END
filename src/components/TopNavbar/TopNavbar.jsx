//src/components/TopNavbar/TopNavbar.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import * as signalR from "@microsoft/signalr";


import SearchBar from "../SearchBar";
import NavCategories from "./NavCategories";
import NavUserActions from "./NavUserActions";


import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../NotificationsModals/context/NotificationContext";
import { CategoryContext } from "../../context/CategoryContext";


import styles from "./TopNavbar.module.css";
import bannerBg from "../../assets/baner1.png";
import phongTroBanner from "../../assets/phong_tro_banner.jpg";


const TopNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
 
  // Xác định xem trang hiện tại có phải là trang chủ (có banner) hay không
  // Bạn có thể thêm các đường dẫn khác vào đây nếu muốn hiện banner ở đó
  const isHomePage = location.pathname === "/market" || location.pathname === "/" || location.pathname === "/market/do-dien-tu" || location.pathname === "/market/nha-tro";


  // Nếu không phải Home Page thì mặc định là scrolled (để hiện thanh trắng luôn)
  const [scrolled, setScrolled] = useState(!isHomePage);
 
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const connectionRef = useRef(null);


  const { user, getStoredToken } = useContext(AuthContext);
  const { unreadCount: notifUnread } = useContext(NotificationContext);
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);


  // Ngưỡng scroll
  const HERO_SCROLL_EXIT = 180;
  const HERO_SCROLL_ENTER = 150;


  // --- LOGIC SCROLL CHỈ CHẠY KHI Ở TRANG HOME ---
  useEffect(() => {
    // Nếu không phải trang chủ, luôn set scrolled = true và không lắng nghe sự kiện cuộn
    if (!isHomePage) {
      setScrolled(true);
      return;
    }


    // Nếu là trang chủ, reset lại trạng thái ban đầu và lắng nghe cuộn
    setScrolled(window.scrollY >= HERO_SCROLL_EXIT);


    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => {
        if (y >= HERO_SCROLL_EXIT && !prev) return true;
        if (y <= HERO_SCROLL_ENTER && prev) return false;
        return prev;
      });
    };


    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage, location.pathname]); // Chạy lại khi đổi trang


  // Reset category khi đổi trang (Giữ nguyên logic cũ của bạn)
  useEffect(() => {
    if (location.pathname !== "/market" && location.pathname !== "/loc-tin-dang") {
      setSelectedCategory("");
      setSelectedSubCategory("");
    }
  }, [location.pathname, setSelectedCategory, setSelectedSubCategory]);


  // -------------------------
  //   LOGIC CHAT + SIGNALR (Giữ nguyên)
  // -------------------------
  const getHiddenAndDeletedChatIds = async () => {
    try {
      if (!user?.id) return [];
      const response = await fetch(`http://localhost:5133/api/chat/user-chat-states/${user.id}`);
      const chatStates = await response.json();
      return chatStates.filter(cs => cs.isHidden || cs.isDeleted).map(cs => cs.chatId);
    } catch (error) {
      console.error("Lỗi lấy danh sách chat ẩn:", error);
      return [];
    }
  };


  const fetchChatUnreadCount = async () => {
    if (!user) return;
    try {
      console.log("📞 fetchChatUnreadCount called");
      const hiddenChatIds = await getHiddenAndDeletedChatIds();
      const params = new URLSearchParams();
      hiddenChatIds.forEach(id => params.append("hiddenChatIds", id));


      const res = await axios.get(
        `http://localhost:5133/api/chat/unread-count/${user.id}?${params.toString()}`
      );
      console.log(`📊 Unread count result: ${res.data.unreadCount}`);
      setChatUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Lỗi lấy số tin nhắn chưa đọc:", error);
    }
  };


  useEffect(() => {
    if (!user) {
      setChatUnreadCount(0);
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }


    fetchChatUnreadCount();
    window.addEventListener("refreshChatList", fetchChatUnreadCount);


    const token = getStoredToken ? getStoredToken() : localStorage.getItem("token");
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5133/hub/chat", { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();


    connectionRef.current = connection;


    connection
      .start()
      .then(() => {
        connection.invoke("ThamGiaCuocTroChuyen", `user-${user.id}`);
        connection.on("CapNhatTrangThaiTinNhan", fetchChatUnreadCount);
        connection.on("CapNhatCuocTroChuyen", async (chat) => {
          try {
            const hiddenChatIds = await getHiddenAndDeletedChatIds();
            const chatId = chat.maCuocTroChuyen || chat.MaCuocTroChuyen;
            if (!hiddenChatIds.includes(chatId)) {
              fetchChatUnreadCount();
            }
          } catch (err) {
            fetchChatUnreadCount();
          }
        });
      })
      .catch((err) => console.error("SignalR connect error:", err));


    return () => {
      window.removeEventListener("refreshChatList", fetchChatUnreadCount);
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [user]);


  // -------------------------
  //       GIAO DIỆN
  // -------------------------
 
  // Xác định ảnh banner tùy theo trang
  const getBannerImage = () => {
    if (location.pathname === "/market/nha-tro") {
      return phongTroBanner;
    }
    return bannerBg; // Default banner cho trang chủ & đồ điện tử
  };

  // ✅ Xác định trang hiện tại để highlight link active
  const isActiveLink = (pathname) => {
    if (pathname === "unimarket") {
      return location.pathname === "/market" || location.pathname === "/";
    }
    return location.pathname === pathname;
  };

  // Xác định background: Nếu là HomePage và chưa cuộn thì hiện ảnh, còn lại là none (để CSS xử lý màu trắng)
  const bgStyle = (isHomePage && !scrolled)
    ? { backgroundImage: `url(${getBannerImage()})` }
    : { backgroundImage: "none" };


  return (
    <header
      className={`${styles.topNavbar} ${scrolled ? styles.scrolled : ""} ${location.pathname === "/market/nha-tro" ? styles.nhaTroVariant : ""}`}
      style={bgStyle}
    >
      {/* Bên trái */}
      <NavCategories isScrolled={scrolled} />


      {/* Ở giữa */}
      <div className={styles.centerSection}>
        {/* Nếu là HomePage VÀ chưa cuộn thì hiện Slogan. Các trường hợp còn lại hiện SearchBar */}
        {(isHomePage && !scrolled) ? (
          <div className={styles.bannerTextContainer}>
            <div className={styles.topLinks}>
              <span 
                className={`${styles.topLink} ${isActiveLink("unimarket") ? styles.active : ""}`}
                onClick={() => navigate("/market")}
              >
                Unimarket
              </span>
              <span 
                className={`${styles.topLink} ${isActiveLink("/market/do-dien-tu") ? styles.active : ""}`}
                onClick={() => navigate("/market/do-dien-tu")}
              >
                Đồ điện tử
              </span>
              <span 
                className={`${styles.topLink} ${isActiveLink("/market/nha-tro") ? styles.active : ""}`}
                onClick={() => navigate("/market/nha-tro")}
              >
                Nhà trọ
              </span>
              <span className={styles.topLink}>Xe cộ</span>
              <span className={styles.topLink}>Việc làm</span>
            </div>
            <h1 className={styles.mainSlogan}>Giá tốt, gần bạn, chốt nhanh!</h1>
          </div>
        ) : (
          <div className={styles.navSearchContainer}>
            <SearchBar />
          </div>
        )}
      </div>


      {/* Bên phải */}
      <NavUserActions
        isScrolled={scrolled}
        unreadCount={notifUnread}
        chatUnreadCount={chatUnreadCount}
      />
    </header>
  );
};


export default TopNavbar;