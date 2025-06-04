import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import "./ChatList.css";

const ChatList = ({ selectedChatId, onSelectChat, userId }) => {
  const [chatList, setChatList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [hiddenChats, setHiddenChats] = useState(() => {
    const saved = localStorage.getItem("hiddenChats");
    return saved ? JSON.parse(saved) : [];
  });
  const [isHideMode, setIsHideMode] = useState(false);
  const [selectedToHide, setSelectedToHide] = useState([]);
  const [filterMode, setFilterMode] = useState("all"); // "all" hoặc "hidden"
  const connectionRef = useRef(null);

  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png";
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  useEffect(() => {
    if (!userId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5133/hub/chat")
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // Cập nhật cuộc trò chuyện mới / sửa cuộc trò chuyện
    connection.on("CapNhatCuocTroChuyen", (chat) => {
      const newChat = {
        maCuocTroChuyen: chat.maCuocTroChuyen || chat.MaCuocTroChuyen,
        isEmpty: chat.isEmpty ?? chat.IsEmpty,
        maTinDang: chat.maTinDang ?? chat.MaTinDang,
        tieuDeTinDang: chat.tieuDeTinDang ?? chat.TieuDeTinDang ?? "Tin đăng",
        giaTinDang: chat.giaTinDang ?? chat.GiaTinDang ?? 0,
        tenNguoiConLai: chat.tenNguoiConLai ?? chat.TenNguoiConLai ?? "Người dùng",
        tinNhanCuoi: chat.tinNhanCuoi ?? chat.TinNhanCuoi ?? "",
        anhDaiDienTinDang: chat.anhDaiDienTinDang ?? chat.AnhDaiDienTinDang ?? "",
        thoiGianTao: new Date().toISOString(),
        hasUnreadMessages: chat.hasUnreadMessages ?? chat.HasUnreadMessages ?? false,
      };

      setChatList((prev) => {
        const exists = prev.some((c) => c.maCuocTroChuyen === newChat.maCuocTroChuyen);
        if (exists) {
          return prev.map((c) =>
            c.maCuocTroChuyen === newChat.maCuocTroChuyen ? newChat : c
          );
        } else {
          return [...prev, newChat];
        }
      });
    });

    // Cập nhật trạng thái tin nhắn đã xem
    connection.on("CapNhatTrangThaiTinNhan", (data) => {
      setChatList((prev) =>
        prev.map((c) =>
          c.maCuocTroChuyen === data.maCuocTroChuyen
            ? { ...c, hasUnreadMessages: data.hasUnreadMessages }
            : c
        )
      );
    });

    // Bổ sung: Lắng nghe sự kiện cập nhật tin đăng để cập nhật ảnh - tiêu đề - giá realtime
    connection.on("CapNhatTinDang", (updatedPost) => {
      console.log("Nhận CapNhatTinDang:", updatedPost); // Debug confirm event nhận được
      setChatList((prev) =>
        prev.map((chat) => {
          if (Number(chat.maTinDang) === Number(updatedPost.MaTinDang)) {
            return {
              ...chat,
              tieuDeTinDang: updatedPost.TieuDe,
              giaTinDang: updatedPost.Gia,
              anhDaiDienTinDang: updatedPost.AnhDaiDien || "",
            };
          }
          return chat;
        })
      );
    });

    connection
      .start()
      .then(async () => {
        console.log("✅ SignalR connected for ChatList");
        await connection.invoke("ThamGiaCuocTroChuyen", `user-${userId}`);
      })
      .catch((err) => {
        console.error("❌ SignalR connection error:", err);
      });

    const fetchChats = async () => {
      try {
        const res = await fetch(`http://localhost:5133/api/chat/user/${userId}`);
        const data = await res.json();
        setChatList(
          data.map((chat) => ({
            ...chat,
            hasUnreadMessages: chat.hasUnreadMessages ?? chat.HasUnreadMessages ?? false,
          }))
        );
      } catch (error) {
        console.error("Lỗi lấy danh sách chat:", error);
      }
    };

    fetchChats();

    return () => {
      connection.stop();
    };
  }, [userId]);

  // Lọc chat theo filterMode và searchTerm
  const filteredChats = chatList
    .filter((chat) => {
      if (filterMode === "all") {
        return !hiddenChats.includes(chat.maCuocTroChuyen);
      } else if (filterMode === "hidden") {
        return hiddenChats.includes(chat.maCuocTroChuyen);
      }
      return true;
    })
    .filter((chat) =>
      chat.tieuDeTinDang.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Bật tắt chế độ ẩn/gỡ ẩn nhiều chat
  const toggleHideMode = () => {
    if (isHideMode) {
      setSelectedToHide([]);
    }
    setIsHideMode(!isHideMode);
  };

  // Xác nhận ẩn các chat đã chọn
  const confirmHideChats = () => {
    if (selectedToHide.length === 0) return;
    setHiddenChats((prev) => {
      const newHidden = [...prev, ...selectedToHide];
      localStorage.setItem("hiddenChats", JSON.stringify(newHidden));
      return newHidden;
    });
    setSelectedToHide([]);
    setIsHideMode(false);
    setFilterMode("all");
  };

  // Xác nhận gỡ ẩn các chat đã chọn
  const confirmUnhideChats = () => {
    if (selectedToHide.length === 0) return;
    setHiddenChats((prev) => {
      const newHidden = prev.filter((id) => !selectedToHide.includes(id));
      localStorage.setItem("hiddenChats", JSON.stringify(newHidden));
      return newHidden;
    });
    setSelectedToHide([]);
    setIsHideMode(false);
    setFilterMode("all");
  };

  // Hủy bỏ ẩn, thoát chế độ chọn
  const cancelHideChats = () => {
    setSelectedToHide([]);
    setIsHideMode(false);
  };

  // Xử lý chọn/bỏ chọn checkbox chat để ẩn hoặc gỡ ẩn
  const onCheckboxChange = (maCuocTroChuyen, checked) => {
    setSelectedToHide((prev) => {
      if (checked) {
        return [...prev, maCuocTroChuyen];
      } else {
        return prev.filter((id) => id !== maCuocTroChuyen);
      }
    });
  };

  return (
    <div className="chatlist-container">
      <div className="chatlist-search">
        <input
          type="text"
          placeholder="Tìm kiếm theo tiêu đề sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="chatlist-filter-dropdown">
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="chatlist-filter-select"
          disabled={isHideMode}
          title="Lọc cuộc trò chuyện"
        >
          <option value="all">Tất cả</option>
          <option value="hidden">Tin đã ẩn</option>
        </select>
      </div>

      <div className="chatlist-scrollable">
        {filteredChats.length === 0 ? (
          <p className="chatlist-empty">Không có cuộc trò chuyện nào</p>
        ) : (
          filteredChats.map((chat, idx) => (
            <div
              key={chat.maCuocTroChuyen || idx}
              className={`chatlist-item ${
                chat.maCuocTroChuyen === selectedChatId ? "chatlist-item-selected" : ""
              }`}
              onClick={() => {
                if (!isHideMode) onSelectChat(chat.maCuocTroChuyen);
              }}
            >
              {(isHideMode && (filterMode === "all" || filterMode === "hidden")) && (
                <input
                  type="checkbox"
                  checked={selectedToHide.includes(chat.maCuocTroChuyen)}
                  onChange={(e) => onCheckboxChange(chat.maCuocTroChuyen, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="chatlist-hide-checkbox"
                  title={filterMode === "all" ? "Chọn để ẩn" : "Chọn để gỡ ẩn"}
                  style={{ pointerEvents: "auto" }}
                />
              )}
              <img
                src={getFullImageUrl(chat.anhDaiDienTinDang)}
                alt="Ảnh tin đăng"
                className="chatlist-item-image"
              />
              <div className="chatlist-item-content">
                <div className="chatlist-item-title">{chat.tieuDeTinDang}</div>
                <div className="chatlist-item-price">
                  Giá: {chat.giaTinDang?.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                </div>
                <div
                  className="chatlist-item-info"
                  style={{ fontWeight: chat.hasUnreadMessages ? "bold" : "normal" }}
                >
                  {chat.tenNguoiConLai} - {chat.tinNhanCuoi || (chat.isEmpty ? "Chưa có tin nhắn" : "")}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="chatlist-hide-button-container">
        {filterMode === "all" ? (
          !isHideMode ? (
            <button onClick={toggleHideMode} className="btn-hide-chat">
              Ẩn hội thoại
            </button>
          ) : (
            <>
              <button
                onClick={confirmHideChats}
                disabled={selectedToHide.length === 0}
                className="btn-hide-chat btn-confirm"
              >
                Xác nhận ẩn ({selectedToHide.length})
              </button>
              <button onClick={cancelHideChats} className="btn-hide-chat btn-cancel">
                Hủy
              </button>
            </>
          )
        ) : !isHideMode ? (
          <button onClick={toggleHideMode} className="btn-hide-chat">
            Gỡ ẩn hội thoại
          </button>
        ) : (
          <>
            <button
              onClick={confirmUnhideChats}
              disabled={selectedToHide.length === 0}
              className="btn-hide-chat btn-confirm"
            >
              Xác nhận gỡ ẩn ({selectedToHide.length})
            </button>
            <button onClick={cancelHideChats} className="btn-hide-chat btn-cancel">
              Hủy
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatList;
