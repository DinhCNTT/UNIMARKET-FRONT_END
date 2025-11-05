import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import "./ChatList.css";
import { MoreVertical, Trash2 } from "lucide-react"; // ← Cái này từ lucide-react (khác lib)
import FriendChatList from "./FriendChatList";

// ✅ Thêm FiTrash2 vô đây:
import { 
  FiUsers as Users, 
  FiArrowLeft as ArrowLeft, 
  FiCamera as Camera, 
  FiVideo as Video, 
  FiMoreVertical, 
  FiTrash2               // 👈 thêm dòng này
} from "react-icons/fi";



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
  const [showFriendList, setShowFriendList] = useState(false);

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

 // ✅ Sắp xếp đơn giản: chỉ dựa vào thời gian tin nhắn mới nhất
const sortChatsLikeMessenger = (chats) => {
  return [...chats].sort((a, b) => {
    const timeA = new Date(
      a.ThoiGianCapNhat || a.thoiGianCapNhat || a.thoiGianTao || new Date()
    ).getTime();
    const timeB = new Date(
      b.ThoiGianCapNhat || b.thoiGianCapNhat || b.thoiGianTao || new Date()
    ).getTime();

    return timeB - timeA; // mới nhất lên đầu
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
    await fetch(
      `http://localhost:5133/api/chat/delete-conversation-for-me/${showDeleteConfirm}?userId=${userId}`,
      { method: "DELETE" }
    );
    await setChatState(showDeleteConfirm, false, true);
  } catch (err) {
    console.error("Lỗi xóa toàn bộ tin nhắn phía tôi:", err);
  }

  // Cập nhật local state
  setChatList((prev) =>
    prev.filter((chat) => chat.maCuocTroChuyen !== showDeleteConfirm)
  );
  setHiddenChatList((prev) =>
    prev.filter((chat) => chat.maCuocTroChuyen !== showDeleteConfirm)
  );

  // ✅ reset selectedChatId ở TrangChat
  onSelectChat(null);

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

  // ✅ FIX: Kết nối SignalR với thời gian chính xác
  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5133/hub/chat", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // Trong ChatList.jsx, tìm đoạn SignalR handler "CapNhatCuocTroChuyen"
// Thay thế toàn bộ đoạn xử lý chat ẩn này:

connection.on("CapNhatCuocTroChuyen", async (chat) => {
  let newChat = {
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
    thoiGianCapNhat: chat.thoiGianCapNhat || chat.ThoiGianCapNhat || new Date().toISOString(),
    ThoiGianCapNhat: chat.ThoiGianCapNhat || chat.thoiGianCapNhat || new Date().toISOString(),
    hasUnreadMessages: chat.hasUnreadMessages ?? chat.HasUnreadMessages ?? false,
    isBlocked: chat.isBlocked ?? false,
    isRecalled: chat.isRecalled ?? chat.IsRecalled ?? false,
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
    
    // Cập nhật local state để phản ánh thay đổi ngay lập tức
    newChat.isDeleted = false;
    newChat.isHidden = false;
    
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
      return sortChatsLikeMessenger(updatedList);
    });
    
    // Xóa khỏi danh sách ẩn nếu có
    setHiddenChatList((prev) => prev.filter((c) => c.maCuocTroChuyen !== newChat.maCuocTroChuyen));
    return;
  }

  // Nếu cuộc trò chuyện bị xóa hoàn toàn, bỏ qua cập nhật
  if (isDeleted) {
    return;
  }

  // ✅ FIX: Nếu cuộc trò chuyện bị ẩn - GIỮ NGUYÊN TRONG TAB ẨN
  if (isHidden) {
    setHiddenChatList((prev) => {
      const exists = prev.some((c) => c.maCuocTroChuyen === newChat.maCuocTroChuyen);
      let updatedList;
      if (exists) {
        updatedList = prev.map((c) =>
          c.maCuocTroChuyen === newChat.maCuocTroChuyen 
            ? { 
                ...newChat, 
                // ✅ GIỮ UNREAD STATUS CHO TIN NHẮN MỚI TỪ NGƯỜI KHÁC
                hasUnreadMessages: newChat.maNguoiGuiCuoi !== userId ? newChat.hasUnreadMessages : false 
              }
            : c
        );
      } else {
        updatedList = [...prev, { 
          ...newChat, 
          hasUnreadMessages: newChat.maNguoiGuiCuoi !== userId ? newChat.hasUnreadMessages : false 
        }];
      }
      return sortChatsLikeMessenger(updatedList);
    });
    
    // ✅ QUAN TRỌNG: Không xóa khỏi danh sách ẩn và không thêm vào danh sách chính
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
    return sortChatsLikeMessenger(updatedList);
  });
  
  // Đảm bảo xóa khỏi danh sách ẩn nếu chat này xuất hiện trong danh sách chính
  setHiddenChatList((prev) => prev.filter((c) => c.maCuocTroChuyen !== newChat.maCuocTroChuyen));
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
                  // ✅ FIX: Giữ nguyên thời gian cập nhật từ backend
                  thoiGianCapNhat: data.thoiGianCapNhat || c.thoiGianCapNhat || c.ThoiGianCapNhat,
                  ThoiGianCapNhat: data.ThoiGianCapNhat || c.ThoiGianCapNhat || c.thoiGianCapNhat
                }
              : c
          );
          return sortChatsLikeMessenger(updatedList);
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

    // 1️⃣ Handler cho sự kiện block/unblock user
connection.on("UserBlocked", async (data) => {
  const { blockedUserId, isBlocked, actionType } = data;

  console.log(`[ChatList] Received UserBlocked event: ${actionType}, blockedUserId: ${blockedUserId}`);

  // Refresh lại chat list để cập nhật trạng thái block/unblock
  try {
    const res = await fetch(`http://localhost:5133/api/chat/user/${userId}`);
    const chatData = await res.json();

    const visibleChats = [];
    const hiddenChats = [];

    chatData.forEach((chat) => {
      const processedChat = {
        ...chat,
        maCuocTroChuyen: chat.MaCuocTroChuyen || chat.maCuocTroChuyen,
        thoiGianTao: chat.ThoiGianTao || chat.thoiGianTao,
        thoiGianCapNhat: chat.ThoiGianCapNhat || chat.thoiGianCapNhat,
        ThoiGianCapNhat: chat.ThoiGianCapNhat,
        tinNhanCuoi: chat.TinNhanCuoi?.NoiDung || chat.tinNhanCuoi?.noiDung || "",
        maNguoiGuiCuoi: chat.TinNhanCuoi?.MaNguoiGui || chat.tinNhanCuoi?.maNguoiGui || null,
        loaiTinNhanCuoi: chat.TinNhanCuoi?.LoaiTinNhan || chat.tinNhanCuoi?.loaiTinNhan || null,
        isRecalled: chat.TinNhanCuoi?.IsRecalled ?? chat.tinNhanCuoi?.isRecalled ?? false,
        hasUnreadMessages: chat.HasUnreadMessages ?? chat.hasUnreadMessages ?? false,
        isBlocked: chat.IsBlocked ?? chat.isBlocked ?? false,
        isHidden: chat.IsHidden ?? chat.isHidden ?? false,
        isDeleted: chat.IsDeleted ?? chat.isDeleted ?? false,
      };

      if (processedChat.isDeleted) return;

      if (processedChat.isHidden) {
        hiddenChats.push({ ...processedChat, hasUnreadMessages: false });
      } else {
        visibleChats.push(processedChat);
      }
    });

    setChatList(sortChatsLikeMessenger(visibleChats));
    setHiddenChatList(sortChatsLikeMessenger(hiddenChats));

  } catch (error) {
    console.error("Error refreshing chat list after block event:", error);
  }
});

// 2️⃣ Handler cho sự kiện thay đổi trạng thái chat
connection.on("ChatStatusChanged", (data) => {
  const { chatId, isBlocked } = data;

  console.log(`[ChatList] Chat ${chatId} status changed: isBlocked=${isBlocked}`);

  // Cập nhật trạng thái isBlocked cho chat cụ thể
  setChatList((prev) => 
    prev.map((chat) => 
      chat.maCuocTroChuyen === chatId 
        ? { ...chat, isBlocked: isBlocked }
        : chat
    )
  );

  setHiddenChatList((prev) => 
    prev.map((chat) => 
      chat.maCuocTroChuyen === chatId 
        ? { ...chat, isBlocked: isBlocked }
        : chat
    )
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

    // ✅ FIX: Lấy danh sách cuộc trò chuyện với mapping chính xác
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
            // ✅ FIX: Map chính xác các field từ backend
            maCuocTroChuyen: chat.MaCuocTroChuyen || chat.maCuocTroChuyen,
            thoiGianTao: chat.ThoiGianTao || chat.thoiGianTao,
            thoiGianCapNhat: chat.ThoiGianCapNhat || chat.thoiGianCapNhat,
            ThoiGianCapNhat: chat.ThoiGianCapNhat, // Giữ nguyên từ backend
            tinNhanCuoi: chat.TinNhanCuoi?.NoiDung || chat.tinNhanCuoi?.noiDung || "",
            maNguoiGuiCuoi: chat.TinNhanCuoi?.MaNguoiGui || chat.tinNhanCuoi?.maNguoiGui || null,
            loaiTinNhanCuoi: chat.TinNhanCuoi?.LoaiTinNhan || chat.tinNhanCuoi?.loaiTinNhan || null,
            hasUnreadMessages: chat.HasUnreadMessages ?? chat.hasUnreadMessages ?? false,
            isBlocked: chat.IsBlocked ?? chat.isBlocked ?? false,
            isRecalled: chat.TinNhanCuoi?.IsRecalled ?? chat.tinNhanCuoi?.isRecalled ?? false,
            isHidden: chat.IsHidden ?? chat.isHidden ?? false,
            isDeleted: chat.IsDeleted ?? chat.isDeleted ?? false,
          };
          
          // Bỏ qua chat đã bị xóa hoàn toàn
          if (processedChat.isDeleted) {
            return;
          }
          
          if (processedChat.isHidden) {
            hiddenChats.push({ ...processedChat, hasUnreadMessages: false });
          } else {
            visibleChats.push(processedChat);
          }
        });
        
        // Sắp xếp cả 2 danh sách
        setChatList(sortChatsLikeMessenger(visibleChats));
        setHiddenChatList(sortChatsLikeMessenger(hiddenChats));

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
    // ✅ FIX: Refresh với mapping chính xác
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
            // ✅ FIX: Map chính xác các field từ backend
            maCuocTroChuyen: chat.MaCuocTroChuyen || chat.maCuocTroChuyen,
            thoiGianTao: chat.ThoiGianTao || chat.thoiGianTao,
            thoiGianCapNhat: chat.ThoiGianCapNhat || chat.thoiGianCapNhat,
            ThoiGianCapNhat: chat.ThoiGianCapNhat, // Giữ nguyên từ backend
            tinNhanCuoi: chat.TinNhanCuoi?.NoiDung || chat.tinNhanCuoi?.noiDung || "",
            maNguoiGuiCuoi: chat.TinNhanCuoi?.MaNguoiGui || chat.tinNhanCuoi?.maNguoiGui || null,
            loaiTinNhanCuoi: chat.TinNhanCuoi?.LoaiTinNhan || chat.tinNhanCuoi?.loaiTinNhan || null,
            hasUnreadMessages: chat.HasUnreadMessages ?? chat.hasUnreadMessages ?? false,
            isBlocked: chat.IsBlocked ?? chat.isBlocked ?? false,
            isHidden: chat.IsHidden ?? chat.isHidden ?? false,
            isDeleted: chat.IsDeleted ?? chat.isDeleted ?? false,
          };
          
          // Bỏ qua chat đã bị xóa hoàn toàn
          if (processedChat.isDeleted) {
            return;
          }
          
          if (processedChat.isHidden) {
            hiddenChats.push({ ...processedChat, hasUnreadMessages: false });
          } else {
            visibleChats.push(processedChat);
          }
        });
        
        // Sắp xếp và cập nhật state
        setChatList(sortChatsLikeMessenger(visibleChats));
        setHiddenChatList(sortChatsLikeMessenger(hiddenChats));
        
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
  }, [userId]);

  // Lọc danh sách chat theo tiêu chí
  const filteredChats = (() => {
    let chatsToFilter = [];
    
    if (filterMode === "all") {
      chatsToFilter = chatList;
    } else if (filterMode === "hidden") {
      chatsToFilter = hiddenChatList;
    }
    
    return chatsToFilter.filter((chat) =>
      chat.tieuDeTinDang?.toLowerCase().includes(searchTerm.toLowerCase())
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
    await bulkSetChatState(selectedToHide, true, false);

    const chatsToHide = chatList.filter(chat =>
      selectedToHide.includes(chat.maCuocTroChuyen)
    );

    setChatList((prev) =>
      prev.filter(chat => !selectedToHide.includes(chat.maCuocTroChuyen))
    );
    setHiddenChatList((prev) => {
      const updatedList = [
        ...prev,
        ...chatsToHide.map(chat => ({ ...chat, hasUnreadMessages: false }))
      ];
      return sortChatsLikeMessenger(updatedList);
    });

    setSelectedToHide([]);
    setIsHideMode(false);
    setFilterMode("all");

    // ✅ Reset chat đang mở về banner nếu nó nằm trong selectedToHide
    if (selectedToHide.includes(selectedChatId)) {
      onSelectChat(null);
    }
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
        return sortChatsLikeMessenger(updatedList);
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
    {/* ==================================================================== */}
    {/* PHẦN HEADER THAY ĐỔI THEO ĐIỀU KIỆN */}
    {/* ==================================================================== */}
    {showFriendList ? (
      // A. Header khi đang ở màn hình Bạn bè: CHỈ CÓ NÚT QUAY LẠI
      <div className="chatlist-back-header" onClick={() => setShowFriendList(false)}>
        <ArrowLeft  size={20} className="icon" />
        <h3>Bạn bè</h3>
      </div>
    ) : (
      // B. Header gốc cho màn hình Mua bán (hiển thị mặc định)
      <>
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
      </>
    )}

    {/* ==================================================================== */}
    {/* PHẦN DANH SÁCH THAY ĐỔI THEO ĐIỀU KIỆN */}
    {/* ==================================================================== */}
    <div className="chatlist-scrollable">
      {showFriendList ? (
        // A. Nếu đang xem bạn bè => CHỈ HIỂN THỊ DANH SÁCH BẠN BÈ
        <FriendChatList
          userId={userId}
          onSelectChat={onSelectChat}
          selectedChatId={selectedChatId}
        />
      ) : (
        // B. Nếu ở màn hình mua bán => HIỂN THỊ CẢ NÚT "BẠN BÈ" VÀ DANH SÁCH MUA BÁN
        <>
          {/* Item đặc biệt UniMarket Bạn bè */}
          <div
            className={`chatlist-item special-item`}
            onClick={() => {
              setShowFriendList(true); // Bật chế độ FriendList
              onSelectChat(null);      // Ẩn ChatBox đang mở
            }}
          >
            <div className="chatlist-item-content">
              <div className="chatlist-item-title">
                <Users size={20} className="icon" />
                UniMarket Bạn bè
              </div>
              <div className="chatlist-item-last">Xem danh sách bạn bè của bạn</div>
            </div>
          </div>
          
          {/* Danh sách chat mua bán */}
          {filteredChats.length === 0 ? (
            <p className="chatlist-empty">Không có cuộc trò chuyện nào</p>
          ) : (
            filteredChats.map((chat, idx) => (
              <div key={chat.maCuocTroChuyen || idx}>
                <div
                  className={`chatlist-item ${chat.isBlocked ? "blocked" : ""} ${
                    chat.maCuocTroChuyen === selectedChatId ? "chatlist-item-selected" : ""
                  }`}
                  onClick={() => {
                    if (!isHideMode) {
                      setShowFriendList(false);
                      onSelectChat(chat.maCuocTroChuyen);
                    }
                  }}
                >
                  {/* Checkbox khi chế độ ẩn hiện */}
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

                  {/* Avatar tin đăng */}
                  <img src={getFullImageUrl(chat.anhDaiDienTinDang)} alt="Ảnh tin đăng" className="chatlist-item-image" />

                  {/* Nội dung hội thoại */}
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
  style={{ fontWeight: chat.hasUnreadMessages ? "bold" : "normal" }}
>
  {chat.maNguoiGuiCuoi === userId ? "Bạn" : chat.tenNguoiConLai}{" "} - {" "}
  {chat.isEmpty
    ? "Chưa có tin nhắn"
    : chat.isRecalled ? (
        <span className="recalled-preview">Đã thu hồi tin nhắn</span>
      )
    : chat.loaiTinNhanCuoi === "image" ? (
        <span className="icon-indicator">
          <Camera size={14} /> Ảnh
        </span>
      )
    : chat.loaiTinNhanCuoi === "video" ? (
        <span className="icon-indicator">
          <Video size={14} /> Video
        </span>
      )
    : chat.tinNhanCuoi}
</div>
                  </div>

                  {/* Menu tuỳ chọn */}
                  {!chat.isBlocked && !isHideMode && (
                    <button className="chatlist-menu-btn" onClick={(e) => handleMenuClick(e, chat.maCuocTroChuyen)} title="Tùy chọn">
                      <FiMoreVertical size={20} />
                    </button>
                  )}
                </div>

                {/* Menu mở rộng (xóa hội thoại) */}
                {expandedChatId === chat.maCuocTroChuyen && (
                  <div className="chatlist-delete-expanded">
                    <button className="chatlist-delete-btn-expanded" onClick={(e) => { e.stopPropagation(); handleShowDeleteConfirm(chat.maCuocTroChuyen); }}>
                      <FiTrash2 size={18} />
                      Xóa cuộc trò chuyện
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>

    {/* Modal xác nhận xoá (giữ nguyên) */}
    {showDeleteConfirm && (
      <div className="chatlist-delete-confirm-overlay">
        <div className="chatlist-delete-confirm-modal">
          <div className="chatlist-delete-confirm-content">
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa cuộc trò chuyện này không?</p>
            <p className="chatlist-delete-note">
              Lưu ý: Cuộc trò chuyện chỉ bị xóa ở phía bạn.
            </p>
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

    {/* ==================================================================== */}
    {/* ✨ NÚT ẨN HỘI THOẠI CHỈ HIỂN THỊ KHI KHÔNG Ở TRONG DANH SÁCH BẠN BÈ ✨ */}
    {/* ==================================================================== */}
    {!showFriendList && (
      <div className="chatlist-hide-button-container">
        {filterMode === "all" ? (
          !isHideMode ? (
            <button
              onClick={toggleHideMode}
              className="chatlist-btn-hide-chat"
            >
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
              <button
                onClick={cancelHideChats}
                className="chatlist-btn-hide-chat chatlist-btn-cancel"
              >
                Hủy
              </button>
            </>
          )
        ) : !isHideMode ? (
          <button
            onClick={toggleHideMode}
            className="chatlist-btn-hide-chat"
          >
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
            <button
              onClick={cancelHideChats}
              className="chatlist-btn-hide-chat chatlist-btn-cancel"
            >
              Hủy
            </button>
          </>
        )}
      </div>
    )}
  </div>
);
};

export default ChatList;
