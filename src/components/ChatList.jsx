import React, { useEffect, useState } from "react";

const ChatList = ({ selectedChatId, onSelectChat, userId }) => {
  const [chatList, setChatList] = useState([]);

  // Hàm chuẩn hóa URL ảnh, thêm host nếu cần
  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png"; // ảnh mặc định nếu không có ảnh
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      try {
        const res = await fetch(`http://localhost:5133/api/chat/user/${userId}`);
        const data = await res.json();
        setChatList(data);
      } catch (error) {
        console.error("Lỗi lấy danh sách chat:", error);
      }
    };

    fetchChats();
  }, [userId]);

  return (
    <div style={{ overflowY: "auto", height: "100%" }}>
      {chatList.length === 0 ? (
        <p style={{ padding: 10 }}>Không có cuộc trò chuyện nào</p>
      ) : (
        chatList.map((chat) => (
          <div
            key={chat.maCuocTroChuyen}
            onClick={() => onSelectChat(chat.maCuocTroChuyen)}
            style={{
              padding: 10,
              cursor: "pointer",
              backgroundColor: chat.maCuocTroChuyen === selectedChatId ? "#e0e0e0" : "transparent",
              borderBottom: "1px solid #ccc",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={getFullImageUrl(chat.anhDaiDienTinDang)}
              alt="Ảnh tin đăng"
              style={{ width: 50, height: 50, borderRadius: 5, marginRight: 10, objectFit: "cover" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold" }}>{chat.tieuDeTinDang || "Tin đăng"}</div>
              <div style={{ fontSize: 14, color: "#555" }}>
                Giá: {chat.giaTinDang?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) || ""}
              </div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                {chat.tenNguoiConLai || "Người dùng"} - {chat.tinNhanCuoi || (chat.isEmpty ? "Chưa có tin nhắn" : "")}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatList;
