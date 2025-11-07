import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { VideoHubContext } from "../context/VideoHubContext"; // Hub SignalR

export const useVideoInteractions = (video, currentIndex) => {
  const { user, token } = useContext(AuthContext);
  const { videoConnection } = useContext(VideoHubContext);

  // ✅ State chính
  const [fullVideo, setFullVideo] = useState(null); // chứa dữ liệu video đầy đủ
  const [isSaved, setIsSaved] = useState(false);
  const [soNguoiLuu, setSoNguoiLuu] = useState(0);

  const iconCircleRef = useRef(null);
  const maTinDang = video?.maTinDang;

  // ==========================================================
  // 1️⃣ Lấy thông tin ban đầu (Like, Save, toàn bộ video)
  // ==========================================================
  useEffect(() => {
    if (!maTinDang) {
      setFullVideo(null); // ✅ Reset khi không có maTinDang
      return;
    }

    // Đặt video nông (shallow) làm dữ liệu tạm thời ban đầu
    setFullVideo(video);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // 🧩 Lấy thông tin chi tiết video
    axios
      .get(`http://localhost:5133/api/video/${maTinDang}`, { headers })
      .then((res) => {
        setFullVideo(res.data); // ✅ cập nhật object video đầy đủ
      })
      .catch((err) => console.error("Lỗi lấy chi tiết video:", err));

    // 🧩 Lấy thông tin lưu video
    axios
      .get(`http://localhost:5133/api/video/${maTinDang}/savedinfo`, { headers })
      .then((res) => {
        setIsSaved(res.data.isSaved);
        setSoNguoiLuu(res.data.soNguoiLuu);
      })
      .catch((err) => console.error("Lỗi khi lấy thông tin lưu video:", err));
  }, [maTinDang, token, currentIndex]);

  // ==========================================================
  // 2️⃣ Lắng nghe sự kiện realtime từ SignalR
  // ==========================================================
  useEffect(() => {
    // ✅ Chờ `videoConnection` và `fullVideo` (đã fetch xong)
    if (!videoConnection || !fullVideo) return;

    // ✅ Lấy maTinDang thực tế từ fullVideo
    const fetchedMaTinDang = fullVideo.maTinDang;
    if (!fetchedMaTinDang) return;

    // ✅ Kiểm tra trạng thái kết nối
    if (videoConnection.state !== "Connected") {
      console.warn(
        `(Interactions) VideoHub chưa kết nối (state: ${videoConnection.state}). Bỏ qua listener.`
      );
      return; // Sẽ chạy lại khi fullVideo thay đổi
    }

    console.log(
      `(Interactions) ✅ Đăng ký SignalR listeners cho video ${fetchedMaTinDang}`
    );

    // Khi có người like/unlike video
    const handleUpdateLike = (tinDangId, count, likedByCurrentUser) => {
      if (tinDangId === fetchedMaTinDang) {
        setFullVideo((prev) => ({
          ...prev,
          soTym: count,
          isLiked: likedByCurrentUser,
        }));
      }
    };

    // Khi có người save/unsave video
    const handleUpdateSave = (tinDangId, count, savedByCurrentUser) => {
      if (tinDangId === fetchedMaTinDang) {
        setSoNguoiLuu(count);
        setIsSaved(savedByCurrentUser);
      }
    };

    // Đăng ký sự kiện từ Hub
    videoConnection.on("UpdateLikeCount", handleUpdateLike);
    videoConnection.on("UpdateSaveCount", handleUpdateSave);

    // Cleanup khi rời component hoặc đổi video
    return () => {
      console.log(
        `(Interactions) 🧹 Dọn dẹp SignalR listeners cho video ${fetchedMaTinDang}`
      );
      videoConnection.off("UpdateLikeCount", handleUpdateLike);
      videoConnection.off("UpdateSaveCount", handleUpdateSave);
    };
  }, [videoConnection, fullVideo]); // ✅ Quan trọng: phụ thuộc vào `fullVideo` thay vì `maTinDang`

  // ==========================================================
  // 3️⃣ Xử lý tym video
  // ==========================================================
  const handleLike = async (showHeartCallback) => {
    if (!user || !token) {
      toast.error("Bạn cần đăng nhập để tym video!");
      return;
    }

    // Hiệu ứng tim nổi
    if (!fullVideo?.isLiked) {
      showHeartCallback?.();
      if (iconCircleRef.current) {
        const circle = document.createElement("div");
        circle.className = "heart-pulse-circle";
        iconCircleRef.current.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
      }
    }

    try {
      await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Không cần setState ở đây — backend sẽ broadcast realtime
    } catch (err) {
      console.error("Lỗi khi tym video:", err);
      toast.error("Không thể tym video.");
    }
  };

  // ==========================================================
  // 4️⃣ Xử lý lưu / gỡ lưu video
  // ==========================================================
  const handleToggleSave = async () => {
    if (!user || !token) {
      toast.error("Bạn cần đăng nhập để lưu video!");
      return;
    }

    try {
      const { data } = await axios.post(
        `http://localhost:5133/api/video/ToggleSave`,
        { maTinDang },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(
        data.saved ? "Đã lưu video!" : "Đã xóa khỏi danh sách lưu."
      );
      // Backend sẽ tự gửi realtime cập nhật
    } catch (err) {
      console.error("Lỗi khi lưu video:", err);
      toast.error("Không thể lưu video.");
    }
  };

  // ==========================================================
  // 5️⃣ Trả về dữ liệu và hành động
  // ==========================================================
  return {
    fullVideo,
    isLiked: fullVideo?.isLiked || false,
    soTym: fullVideo?.soTym || 0,
    isSaved,
    soNguoiLuu,
    iconCircleRef,
    handleLike,
    handleToggleSave,
  };
};
