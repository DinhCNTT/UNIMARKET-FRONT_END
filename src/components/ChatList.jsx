import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import "./ChatList.css";
import { MoreVertical, Trash2 } from "lucide-react";

const ChatList = ({ selectedChatId, onSelectChat, userId }) => {
  const [chatList, setChatList] = useState([]);
  const [hiddenChatList, setHiddenChatList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHideMode, setIsHideMode] = useState(false);
  const [selectedToHide, setSelectedToHide] = useState([]);
  const [filterMode, setFilterMode] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedChatId, setExpandedChatId] = useState(null);
  const connectionRef = useRef(null);

  // API functions để tương tác với database
  const setChatState = async (chatId, isHidden, isDeleted) => {
    try {
      await fetch('http://localhost:5133/api/chat/set-chat-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          chatId: chatId,
          isHidden: isHidden,
          isDeleted: isDeleted
        })
      });
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái chat:", error);
    }
  };

  const bulkSetChatState = async (chatIds, isHidden, isDeleted) => {
    try {
      await fetch('http://localhost:5133/api/chat/bulk-set-chat-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          chatIds: chatIds,
          isHidden: isHidden,
          isDeleted: isDeleted
        })
      });
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái chat hàng loạt:", error);
    }
  };

  const getUserChatStates = async () => {
    try {
      const response = await fetch(`http://localhost:5133/api/chat/user-chat-states/${userId}`);
      return await response.json();
    } catch (error) {
      console.error("Lỗi lấy trạng thái chat:", error);
      return [];
    }
  };

  // Hàm lấy URL hình ảnh đầy đủ
  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png";
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  // Hàm sắp xếp chat theo thời gian tin nhắn mới nhất
  const sortChatsByLatestMessage = (chats) => {
    return [...chats].sort((a, b) => {
      if (a.hasUnreadMessages && !b.hasUnreadMessages) return -1;
      if (!a.hasUnreadMessages && b.hasUnreadMessages) return 1;
      
      const timeA = new Date(a.thoiGianCapNhat || a.thoiGianTao).getTime();
      const timeB = new Date(b.thoiGianCapNhat || b.thoiGianTao).getTime();
      return timeB - timeA;
    });
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

  // Xác nhận xóa cuộc trò chuyện - cập nhật với database
  const handleConfirmDelete = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      // Gọi API xóa toàn bộ tin nhắn phía tôi cho cuộc trò chuyện này
      await fetch(
        `http://localhost:5133/api/chat/delete-conversation-for-me/${showDeleteConfirm}?userId=${userId}`,
        { method: "DELETE" }
      );
      
      // Cập nhật trạng thái trong database
      await setChatState(showDeleteConfirm, false, true);
      
    } catch (err) {
      console.error("Lỗi xóa toàn bộ tin nhắn phía tôi:", err);
    }
    
    // Xóa khỏi TẤT CẢ danh sách local
    setChatList((prev) => prev.filter((chat) => chat.maCuocTroChuyen !== showDeleteConfirm));
    setHiddenChatList((prev) => prev.filter((chat) => chat.maCuocTroChuyen !== showDeleteConfirm));
    
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

  // Kết nối SignalR và nhận dữ liệu chat - cập nhật với database
  useEffect(() => {
    if (!userId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5133/hub/chat")
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on("CapNhatCuocTroChuyen", async (chat) => {
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
        thoiGianTao: chat.thoiGianTao ?? new Date().toISOString(),
        thoiGianCapNhat: new Date().toISOString(),
        hasUnreadMessages: chat.hasUnreadMessages ?? chat.HasUnreadMessages ?? false,
        isBlocked: chat.isBlocked ?? false,
        isHidden: chat.isHidden ?? false,
        isDeleted: chat.isDeleted ?? false,
      };

      // Lấy trạng thái chat từ database
      const chatStates = await getUserChatStates();
      const chatState = chatStates.find(cs => cs.chatId === newChat.maCuocTroChuyen);
      const isHidden = chatState?.isHidden ?? false;
      const isDeleted = chatState?.isDeleted ?? false;

      // Nếu cuộc trò chuyện bị xóa hoàn toàn và có tin nhắn mới từ đối phương
      if (isDeleted && newChat.maNguoiGuiCuoi !== userId) {
        // Gỡ trạng thái xóa từ server
        await setChatState(newChat.maCuocTroChuyen, false, false);
        
        // Hiển thị lại trong danh sách chat chính
        setChatList((prev) => {
          const exists = prev.some((c) => c.maCuocTroChuyen === newChat.maCuocTroChuyen);
          let updatedList;
          if (exists) {
            updatedList = prev.map((c) =>
              c.maCuocTroChuyen === newChat.maCuocTroChuyen ? newChat : c
            );
          } else {
            updatedList = [...prev, newChat];
          }
          return sortChatsByLatestMessage(updatedList);
        });
        return;
      }

      // Nếu cuộc trò chuyện bị xóa hoàn toàn, bỏ qua cập nhật
      if (isDeleted) {
        return;
      }

      // Nếu cuộc trò chuyện bị ẩn
      if (isHidden) {
        setHiddenChatList((prev) => {
          const exists = prev.some((c) => c.maCuocTroChuyen === newChat.maCuocTroChuyen);
          let updatedList;
          if (exists) {
            updatedList = prev.map((c) =>
              c.maCuocTroChuyen === newChat.maCuocTroChuyen 
                ? { ...newChat, hasUnreadMessages: false }
                : c
            );
          } else {
            updatedList = [...prev, { ...newChat, hasUnreadMessages: false }];
          }
          return sortChatsByLatestMessage(updatedList);
        });
        return;
      }

      // Cập nhật danh sách chat chính (không bị ẩn)
      setChatList((prev) => {
        const exists = prev.some((c) => c.maCuocTroChuyen === newChat.maCuocTroChuyen);
        let updatedList;
        if (exists) {
          updatedList = prev.map((c) =>
            c.maCuocTroChuyen === newChat.maCuocTroChuyen ? newChat : c
          );
        } else {
          updatedList = [...prev, newChat];
        }
        return sortChatsByLatestMessage(updatedList);
      });
    });

    connection.on("CapNhatTrangThaiTinNhan", async (data) => {
      // Lấy trạng thái chat từ server
      try {
        const chatStates = await getUserChatStates();
        const chatState = chatStates.find(cs => cs.chatId === data.maCuocTroChuyen);
        const isHidden = chatState?.isHidden ?? false;
        const isDeleted = chatState?.isDeleted ?? false;

        // Nếu cuộc trò chuyện bị xóa hoàn toàn, bỏ qua cập nhật
        if (isDeleted) {
          return;
        }

        if (isHidden) {
          // Không cập nhật trạng thái tin nhắn cho chat ẩn
          return;
        }

        setChatList((prev) => {
          const updatedList = prev.map((c) =>
            c.maCuocTroChuyen === data.maCuocTroChuyen
              ? { 
                  ...c, 
                  hasUnreadMessages: data.hasUnreadMessages,
                  thoiGianCapNhat: new Date().toISOString()
                }
              : c
          );
          return sortChatsByLatestMessage(updatedList);
        });
      } catch (error) {
        console.error("Lỗi lấy trạng thái chat:", error);
      }
    });

    connection.on("CapNhatTinDang", async (updatedPost) => {
      // Lấy trạng thái chat từ server để kiểm tra
      try {
        const chatStates = await getUserChatStates();

        setChatList((prev) =>
          prev.map((chat) => {
            const chatState = chatStates.find(cs => cs.chatId === chat.maCuocTroChuyen);
            const isDeleted = chatState?.isDeleted ?? false;
            
            if (Number(chat.maTinDang) === Number(updatedPost.MaTinDang) && !isDeleted) {
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
            const chatState = chatStates.find(cs => cs.chatId === chat.maCuocTroChuyen);
            const isDeleted = chatState?.isDeleted ?? false;
            
            if (Number(chat.maTinDang) === Number(updatedPost.MaTinDang) && !isDeleted) {
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
      } catch (error) {
        console.error("Lỗi lấy trạng thái chat khi cập nhật tin đăng:", error);
      }
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

    // Lấy danh sách cuộc trò chuyện khi load - cập nhật với database
    const fetchChats = async () => {
      try {
        const res = await fetch(`http://localhost:5133/api/chat/user/${userId}`);
        const data = await res.json();
        
        // Tách chat thành 2 danh sách: hiện và ẩn dựa trên database
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
            thoiGianCapNhat: chat.thoiGianCapNhat || chat.thoiGianTao || new Date().toISOString(),
          };
          
          // Bỏ qua chat đã bị xóa hoàn toàn
          if (chat.isDeleted) {
            return;
          }
          
          if (chat.isHidden) {
            hiddenChats.push({ ...processedChat, hasUnreadMessages: false });
          } else {
            visibleChats.push(processedChat);
          }
        });
        
        // Sắp xếp cả 2 danh sách
        setChatList(sortChatsByLatestMessage(visibleChats));
        setHiddenChatList(sortChatsByLatestMessage(hiddenChats));
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

  useEffect(() => {
  // Lắng nghe event refresh từ VideoDetailsPanel hoặc các component khác
  const handleRefreshChatList = async () => {
    console.log("🔄 Refreshing ChatList...");
    
    try {
      const res = await fetch(`http://localhost:5133/api/chat/user/${userId}`);
      const data = await res.json();
      
      // Tách chat thành 2 danh sách: hiện và ẩn dựa trên database
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
          thoiGianCapNhat: chat.thoiGianCapNhat || chat.thoiGianTao || new Date().toISOString(),
        };
        
        // Bỏ qua chat đã bị xóa hoàn toàn
        if (chat.isDeleted) {
          return;
        }
        
        if (chat.isHidden) {
          hiddenChats.push({ ...processedChat, hasUnreadMessages: false });
        } else {
          visibleChats.push(processedChat);
        }
      });
      
      // Sắp xếp và cập nhật state
      setChatList(sortChatsByLatestMessage(visibleChats));
      setHiddenChatList(sortChatsByLatestMessage(hiddenChats));
      
      console.log("✅ ChatList refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing ChatList:", error);
    }
  };

  // Đăng ký event listener
  window.addEventListener('refreshChatList', handleRefreshChatList);

  // Cleanup
  return () => {
    window.removeEventListener('refreshChatList', handleRefreshChatList);
  };
}, [userId]); // Dependency array chỉ có userId

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

  // Hiển thị chế độ ẩn/hiện cuộc trò chuyện - cập nhật với database
  const toggleHideMode = () => {
    if (isHideMode) {
      setSelectedToHide([]);
    }
    setIsHideMode(!isHideMode);
    setShowDeleteConfirm(null);
    setExpandedChatId(null);
  };

  const confirmHideChats = async () => {
    if (selectedToHide.length === 0) return;
    
    try {
      // Cập nhật trạng thái trong database
      await bulkSetChatState(selectedToHide, true, false);
      
      // Lấy các chat cần ẩn
      const chatsToHide = chatList.filter(chat => selectedToHide.includes(chat.maCuocTroChuyen));
      
      // Di chuyển từ danh sách chính sang danh sách ẩn
      setChatList((prev) => prev.filter(chat => !selectedToHide.includes(chat.maCuocTroChuyen)));
      setHiddenChatList((prev) => {
        const updatedList = [
          ...prev,
          ...chatsToHide.map(chat => ({ ...chat, hasUnreadMessages: false }))
        ];
        return sortChatsByLatestMessage(updatedList);
      });
      
      setSelectedToHide([]);
      setIsHideMode(false);
      setFilterMode("all");
    } catch (error) {
      console.error("Lỗi ẩn cuộc trò chuyện:", error);
    }
  };

  const confirmUnhideChats = async () => {
    if (selectedToHide.length === 0) return;
    
    try {
      // Cập nhật trạng thái trong database
      await bulkSetChatState(selectedToHide, false, false);
      
      // Lấy các chat cần gỡ ẩn
      const chatsToUnhide = hiddenChatList.filter(chat => selectedToHide.includes(chat.maCuocTroChuyen));
      
      // Di chuyển từ danh sách ẩn sang danh sách chính
      setHiddenChatList((prev) => prev.filter(chat => !selectedToHide.includes(chat.maCuocTroChuyen)));
      setChatList((prev) => {
        const updatedList = [...prev, ...chatsToUnhide];
        return sortChatsByLatestMessage(updatedList);
      });
      
      setSelectedToHide([]);
      setIsHideMode(false);
      setFilterMode("all");
    } catch (error) {
      console.error("Lỗi gỡ ẩn cuộc trò chuyện:", error);
    }
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
                className={`chatlist-item ${chat.isBlocked ? "blocked" : ""} ${
                  chat.maCuocTroChuyen === selectedChatId
                    ? "chatlist-item-selected"
                    : ""
                }`}
                onClick={() => {
                  if (!isHideMode) onSelectChat(chat.maCuocTroChuyen);
                }}
              >
                {(isHideMode &&
                  (filterMode === "all" || filterMode === "hidden")) && (
                  <input
                    type="checkbox"
                    checked={selectedToHide.includes(chat.maCuocTroChuyen)}
                    onChange={(e) =>
                      onCheckboxChange(chat.maCuocTroChuyen, e.target.checked)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="chatlist-hide-checkbox"
                    title={
                      filterMode === "all" ? "Chọn để ẩn" : "Chọn để gỡ ẩn"
                    }
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
                    Giá:{" "}
                    {chat.giaTinDang?.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </div>
                  <div
                    className="chatlist-item-info"
                    style={{
                      fontWeight: chat.hasUnreadMessages ? "bold" : "normal",
                    }}
                  >
                    {chat.maNguoiGuiCuoi === userId ? "Bạn" : chat.tenNguoiConLai}{" "}
                    -{" "}
                    {chat.isEmpty
                      ? "Chưa có tin nhắn"
                      : chat.loaiTinNhanCuoi === "image"
                      ? "📷 Ảnh"
                      : chat.loaiTinNhanCuoi === "video"
                      ? "🎥 Video"
                      : chat.tinNhanCuoi}
                  </div>
                </div>

                {!chat.isBlocked && !isHideMode && (
                  <button
                    className="chatlist-menu-btn"
                    onClick={(e) => handleMenuClick(e, chat.maCuocTroChuyen)}
                    title="Tùy chọn"
                  >
                    <MoreVertical size={20} />
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
                    <Trash2 size={18} className="mr-1" />
                    Xóa cuộc trò chuyện
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