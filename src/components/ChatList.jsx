import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import "./ChatList.css";

const ChatList = ({ selectedChatId, onSelectChat, userId }) => {
  const [chatList, setChatList] = useState([]);
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
        const exists = prev.some(c => c.maCuocTroChuyen === newChat.maCuocTroChuyen);
        if (exists) {
          return prev.map(c =>
            c.maCuocTroChuyen === newChat.maCuocTroChuyen ? newChat : c
          );
        } else {
          return [...prev, newChat];
        }
      });
    });

    connection.on("CapNhatTrangThaiTinNhan", (data) => {
      setChatList((prev) => prev.map(c =>
        c.maCuocTroChuyen === data.maCuocTroChuyen ? { ...c, hasUnreadMessages: data.hasUnreadMessages } : c
      ));
    });

    connection.start().then(async () => {
      console.log("✅ SignalR connected for ChatList");
      await connection.invoke("ThamGiaCuocTroChuyen", `user-${userId}`);
    }).catch(err => {
      console.error("❌ SignalR connection error:", err);
    });

    const fetchChats = async () => {
      try {
        const res = await fetch(`http://localhost:5133/api/chat/user/${userId}`);
        const data = await res.json();
        setChatList(data.map(chat => ({
          ...chat,
          hasUnreadMessages: chat.hasUnreadMessages ?? chat.HasUnreadMessages ?? false,
        })));
      } catch (error) {
        console.error("Lỗi lấy danh sách chat:", error);
      }
    };

    fetchChats();

    return () => {
      connection.stop();
    };
  }, [userId]);

  return (
    <div className="chatlist-container">
      {chatList.length === 0 ? (
        <p className="chatlist-empty">Không có cuộc trò chuyện nào</p>
      ) : (
        chatList.map((chat, idx) => (
          <div
            key={chat.maCuocTroChuyen || chat.MaCuocTroChuyen || idx}
            onClick={() => onSelectChat(chat.maCuocTroChuyen || chat.MaCuocTroChuyen)}
            className={`chatlist-item ${
              chat.maCuocTroChuyen === selectedChatId ? "chatlist-item-selected" : ""
            }`}
          >
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
              <div className="chatlist-item-info" style={{ fontWeight: chat.hasUnreadMessages ? 'bold' : 'normal' }}>
                {chat.tenNguoiConLai} - {chat.tinNhanCuoi || (chat.isEmpty ? "Chưa có tin nhắn" : "")}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatList;