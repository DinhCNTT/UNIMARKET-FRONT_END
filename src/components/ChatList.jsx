import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import "./ChatList.css";

const ChatList = ({ selectedChatId, onSelectChat, userId }) => {
  const [chatList, setChatList] = useState([]);
  const [hiddenChatList, setHiddenChatList] = useState([]); // Danh sách chat ẩn riêng biệt
  const [searchTerm, setSearchTerm] = useState("");
  const [hiddenChats, setHiddenChats] = useState(() => {
    const saved = localStorage.getItem("hiddenChats");
    return saved ? JSON.parse(saved) : [];
  });
  const [isHideMode, setIsHideMode] = useState(false);
  const [selectedToHide, setSelectedToHide] = useState([]);
  const [filterMode, setFilterMode] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedChatId, setExpandedChatId] = useState(null);
  const connectionRef = useRef(null);

  // Hàm lấy URL hình ảnh đầy đủ
  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png";
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  // Hiển thị xác nhận xóa cuộc trò chuyện
  const handleShowDeleteConfirm = (chatId) => {
    setShowDeleteConfirm(chatId);
  };

  // Hiển thị menu các tùy chọn cho cuộc trò chuyện
  const handleMenuClick = (e, chatId) => {
    e.stopPropagation();
    if (expandedChatId === chatId) {
      setExpandedChatId(null);
    } else {
      setExpandedChatId(chatId);
    }
  };

  // Xác nhận xóa cuộc trò chuyện
  const handleConfirmDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      // Gọi API xóa toàn bộ tin nhắn phía tôi cho cuộc trò chuyện này
      await fetch(
        `http://localhost:5133/api/chat/delete-conversation-for-me/${showDeleteConfirm}?userId=${userId}`,
        { method: "DELETE" }
      );
    } catch (err) {
      console.error("Lỗi xóa toàn bộ tin nhắn phía tôi:", err);
    }
    
    // Xóa khỏi danh sách hiện tại
    setChatList((prev) => prev.filter((chat) => chat.maCuocTroChuyen !== showDeleteConfirm));
    setHiddenChatList((prev) => prev.filter((chat) => chat.maCuocTroChuyen !== showDeleteConfirm));
    
    // Thêm vào danh sách ẩn
    setHiddenChats((prev) => {
      const updatedHiddenChats = [...prev, showDeleteConfirm];
      localStorage.setItem("hiddenChats", JSON.stringify(updatedHiddenChats));
      return updatedHiddenChats;
    });
    
    setShowDeleteConfirm(null);
    setExpandedChatId(null);
  };

  // Hủy bỏ xác nhận xóa
  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  // Lắng nghe click ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDeleteConfirm && !e.target.closest('.chatlist-delete-confirm-modal')) {
        setShowDeleteConfirm(null);
      }
      if (expandedChatId && !e.target.closest('.chatlist-item')) {
        setExpandedChatId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDeleteConfirm, expandedChatId]);

  // Kết nối SignalR và nhận dữ liệu chat
  useEffect(() => {
    if (!userId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5133/hub/chat")
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on("CapNhatCuocTroChuyen", (chat) => {
      const newChat = {
        maCuocTroChuyen: chat.maCuocTroChuyen || chat.MaCuocTroChuyen,
        isEmpty: chat.isEmpty ?? chat.IsEmpty,
        maTinDang: chat.maTinDang ?? chat.MaTinDang,
        tieuDeTinDang: chat.tieuDeTinDang ?? chat.TieuDeTinDang ?? "Tin đăng",
        giaTinDang: chat.giaTinDang ?? chat.GiaTinDang ?? 0,
        tenNguoiConLai: chat.tenNguoiConLai ?? chat.TenNguoiConLai ?? "Người dùng",
        tinNhanCuoi: chat.tinNhanCuoi ?? chat.TinNhanCuoi ?? "",
        maNguoiGuiCuoi: chat.maNguoiGui || null,
        loaiTinNhanCuoi: chat.loaiTinNhan || null,
        anhDaiDienTinDang: chat.anhDaiDienTinDang ?? chat.AnhDaiDienTinDang ?? "",
        thoiGianTao: new Date().toISOString(),
        hasUnreadMessages: chat.hasUnreadMessages ?? chat.HasUnreadMessages ?? false,
        isBlocked: chat.isBlocked ?? false,
      };

      const currentHiddenChats = JSON.parse(localStorage.getItem("hiddenChats")) || [];
      const isHidden = currentHiddenChats.includes(newChat.maCuocTroChuyen);

      // Nếu cuộc trò chuyện bị ẩn
      if (isHidden) {
        // Cập nhật danh sách chat ẩn
        setHiddenChatList((prev) => {
          const exists = prev.some((c) => c.maCuocTroChuyen === newChat.maCuocTroChuyen);
          if (exists) {
            return prev.map((c) =>
              c.maCuocTroChuyen === newChat.maCuocTroChuyen 
                ? { ...newChat, hasUnreadMessages: false } // Không hiển thị thông báo
                : c
            );
          } else {
            return [...prev, { ...newChat, hasUnreadMessages: false }];
          }
        });
        
        // Không cập nhật danh sách chat chính
        return;
      }

      // Cập nhật danh sách chat chính (không bị ẩn)
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

    connection.on("CapNhatTrangThaiTinNhan", (data) => {
      const currentHiddenChats = JSON.parse(localStorage.getItem("hiddenChats")) || [];
      const isHidden = currentHiddenChats.includes(data.maCuocTroChuyen);

      if (isHidden) {
        // Không cập nhật trạng thái tin nhắn cho chat ẩn
        return;
      }

      setChatList((prev) =>
        prev.map((c) =>
          c.maCuocTroChuyen === data.maCuocTroChuyen
            ? { ...c, hasUnreadMessages: data.hasUnreadMessages }
            : c
        )
      );
    });

    connection.on("CapNhatTinDang", (updatedPost) => {
      // Cập nhật cho cả chat chính và chat ẩn
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

      setHiddenChatList((prev) =>
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

    // Lấy danh sách cuộc trò chuyện khi load
    const fetchChats = async () => {
      try {
        const res = await fetch(`http://localhost:5133/api/chat/user/${userId}`);
        const data = await res.json();
        
        const currentHiddenChats = JSON.parse(localStorage.getItem("hiddenChats")) || [];
        
        // Tách chat thành 2 danh sách: hiện và ẩn
        const visibleChats = [];
        const hiddenChats = [];
        
        data.forEach((chat) => {
          const processedChat = {
            ...chat,
            tinNhanCuoi: chat.tinNhanCuoi?.noiDung || "",
            maNguoiGuiCuoi: chat.tinNhanCuoi?.maNguoiGui || null,
            loaiTinNhanCuoi: chat.tinNhanCuoi?.loaiTinNhan || null,
            hasUnreadMessages: chat.hasUnreadMessages ?? chat.HasUnreadMessages ?? false,
            isBlocked: chat.isBlocked ?? false,
          };
          
          if (currentHiddenChats.includes(chat.maCuocTroChuyen)) {
            hiddenChats.push({ ...processedChat, hasUnreadMessages: false });
          } else {
            visibleChats.push(processedChat);
          }
        });
        
        setChatList(visibleChats);
        setHiddenChatList(hiddenChats);
      } catch (error) {
        console.error("Lỗi lấy danh sách chat:", error);
      }
    };

    fetchChats();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [userId]);

  // Lọc danh sách chat theo tiêu chí
  const filteredChats = (() => {
    let chatsToFilter = [];
    
    if (filterMode === "all") {
      chatsToFilter = chatList.filter((chat) => !chat.isBlocked);
    } else if (filterMode === "hidden") {
      chatsToFilter = hiddenChatList;
    }
    
    return chatsToFilter.filter((chat) =>
      chat.tieuDeTinDang.toLowerCase().includes(searchTerm.toLowerCase())
    );
  })();

  // Hiển thị chế độ ẩn/hiện cuộc trò chuyện
  const toggleHideMode = () => {
    if (isHideMode) {
      setSelectedToHide([]);
    }
    setIsHideMode(!isHideMode);
    setShowDeleteConfirm(null);
    setExpandedChatId(null);
  };

  const confirmHideChats = () => {
    if (selectedToHide.length === 0) return;
    
    // Lấy các chat cần ẩn
    const chatsToHide = chatList.filter(chat => selectedToHide.includes(chat.maCuocTroChuyen));
    
    // Cập nhật danh sách ẩn
    setHiddenChats((prev) => {
      const newHidden = [...prev, ...selectedToHide];
      localStorage.setItem("hiddenChats", JSON.stringify(newHidden));
      return newHidden;
    });
    
    // Di chuyển từ danh sách chính sang danh sách ẩn
    setChatList((prev) => prev.filter(chat => !selectedToHide.includes(chat.maCuocTroChuyen)));
    setHiddenChatList((prev) => [
      ...prev,
      ...chatsToHide.map(chat => ({ ...chat, hasUnreadMessages: false }))
    ]);
    
    setSelectedToHide([]);
    setIsHideMode(false);
    setFilterMode("all");
  };

  const confirmUnhideChats = () => {
    if (selectedToHide.length === 0) return;
    
    // Lấy các chat cần gỡ ẩn
    const chatsToUnhide = hiddenChatList.filter(chat => selectedToHide.includes(chat.maCuocTroChuyen));
    
    // Cập nhật danh sách ẩn
    setHiddenChats((prev) => {
      const newHidden = prev.filter((id) => !selectedToHide.includes(id));
      localStorage.setItem("hiddenChats", JSON.stringify(newHidden));
      return newHidden;
    });
    
    // Di chuyển từ danh sách ẩn sang danh sách chính
    setHiddenChatList((prev) => prev.filter(chat => !selectedToHide.includes(chat.maCuocTroChuyen)));
    setChatList((prev) => [...prev, ...chatsToUnhide]);
    
    setSelectedToHide([]);
    setIsHideMode(false);
    setFilterMode("all");
  };

  const cancelHideChats = () => {
    setSelectedToHide([]);
    setIsHideMode(false);
  };

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
            <div key={chat.maCuocTroChuyen || idx}>
              <div
                className={`chatlist-item ${chat.isBlocked ? "blocked" : ""} ${chat.maCuocTroChuyen === selectedChatId ? "chatlist-item-selected" : ""}`}
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
                  <div className="chatlist-item-info" style={{ fontWeight: chat.hasUnreadMessages ? "bold" : "normal" }}>
                    {chat.maNguoiGuiCuoi === userId ? "Bạn" : chat.tenNguoiConLai} - {
                      chat.isEmpty ? "Chưa có tin nhắn" :
                      chat.loaiTinNhanCuoi === "image" ? "Gửi 1 ảnh" :
                      chat.loaiTinNhanCuoi === "video" ? "Gửi 1 video" :
                      chat.tinNhanCuoi
                    }
                  </div>
                </div>

                {!chat.isBlocked && !isHideMode && (
                  <button
                    className="chatlist-menu-btn"
                    onClick={(e) => handleMenuClick(e, chat.maCuocTroChuyen)}
                    title="Tùy chọn"
                  >
                    ⋮
                  </button>
                )}
              </div>

              {expandedChatId === chat.maCuocTroChuyen && (
                <div className="chatlist-delete-expanded">
                  <button
                    className="chatlist-delete-btn-expanded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowDeleteConfirm(chat.maCuocTroChuyen);
                    }}
                  >
                    🗑️ Xóa cuộc trò chuyện
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showDeleteConfirm && (
        <div className="chatlist-delete-confirm-overlay">
          <div className="chatlist-delete-confirm-modal">
            <div className="chatlist-delete-confirm-content">
              <h3>Xác nhận xóa</h3>
              <p>Bạn có chắc chắn muốn xóa cuộc trò chuyện này không?</p>
              <p className="chatlist-delete-note">Lưu ý: Cuộc trò chuyện chỉ bị xóa ở phía bạn.</p>
            </div>
            <div className="chatlist-delete-confirm-buttons">
              <button
                className="chatlist-btn-delete-confirm"
                onClick={handleConfirmDelete}
              >
                Xóa
              </button>
              <button
                className="chatlist-btn-delete-cancel"
                onClick={handleCancelDelete}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="chatlist-hide-button-container">
        {filterMode === "all" ? (
          !isHideMode ? (
            <button onClick={toggleHideMode} className="chatlist-btn-hide-chat">
              Ẩn hội thoại
            </button>
          ) : (
            <>
              <button
                onClick={confirmHideChats}
                disabled={selectedToHide.length === 0}
                className="chatlist-btn-hide-chat chatlist-btn-confirm"
              >
                Xác nhận ẩn ({selectedToHide.length})
              </button>
              <button onClick={cancelHideChats} className="chatlist-btn-hide-chat chatlist-btn-cancel">
                Hủy
              </button>
            </>
          )
        ) : !isHideMode ? (
          <button onClick={toggleHideMode} className="chatlist-btn-hide-chat">
            Gỡ ẩn hội thoại
          </button>
        ) : (
          <>
            <button
              onClick={confirmUnhideChats}
              disabled={selectedToHide.length === 0}
              className="chatlist-btn-hide-chat chatlist-btn-confirm"
            >
              Xác nhận gỡ ẩn ({selectedToHide.length})
            </button>
            <button onClick={cancelHideChats} className="chatlist-btn-hide-chat chatlist-btn-cancel">
              Hủy
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatList;