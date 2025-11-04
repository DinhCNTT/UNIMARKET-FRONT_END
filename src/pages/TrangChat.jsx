// File: src/pages/TrangChat.jsx (PHIÊN BẢN ĐÃ SỬA ĐỂ TÍCH HỢP)

import React, { useState, useContext, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbarUniMarket from "../components/TopNavbarUniMarket";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
import SocialChatViewer from "../components/SocialChatViewer/SocialChatViewer"; // <-- ĐÃ IMPORT
import "./TrangChat.css";
import chatBanner from "../assets/chat_banner_01.png";

const TrangChat = () => {
    const { maCuocTroChuyen } = useParams();
    const location = useLocation();
    const { user } = useContext(AuthContext);

    // State cho ChatBox (mua bán)
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [selectedChatUserId, setSelectedChatUserId] = useState(null);

    // State cho SocialChatViewer (chat bạn bè)
    const [viewingSocialChat, setViewingSocialChat] = useState(null);

    // Logic cũ: xử lý vào chat từ URL
    useEffect(() => {
        if (maCuocTroChuyen) setSelectedChatId(maCuocTroChuyen);
    }, [maCuocTroChuyen]);

    // Logic cũ: tìm partner ID cho ChatBox
    useEffect(() => {
        if (!selectedChatId || !user || !selectedChatId.includes("-")) {
            setSelectedChatUserId(null);
            return;
        }
        const parts = selectedChatId.split("-");
        const otherUserId = parts.find((id) => id !== user.id);
        setSelectedChatUserId(otherUserId);
    }, [selectedChatId, user]);


    // Hàm xử lý chọn chat (Đã cập nhật từ trước và vẫn đúng)
    const handleSelectChat = (chat, chatType) => {
        if (chatType === 'social') {
            setViewingSocialChat(chat);    // 1. Mở social chat
            setSelectedChatId(null);       // 2. Đóng chat mua bán
        } else {
            setViewingSocialChat(null);    // 1. Đóng social chat
        const chatId = (chat && typeof chat === 'object') ? chat.maCuocTroChuyen : chat;
            setSelectedChatId(chatId); // 2. Mở chat mua bán
            
            // Logic cũ tìm partner id
            if (user && chatId && chatId.includes("-")) {
                const parts = chatId.split("-");
                const otherUserId = parts.find((id) => id !== user.id);
                setSelectedChatUserId(otherUserId);
            } else {
                setSelectedChatUserId(null);
            }
        }
    };

    // --- BỎ HÀM handleCloseViewer VÌ KHÔNG CẦN NỮA ---
    // const handleCloseViewer = () => { ... };
    
    const isChatRoute = location.pathname.startsWith("/chat");

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "95vh" }}>
            <TopNavbarUniMarket />
            <div className={`trang-chat-container ${isChatRoute ? "with-mini-nav" : ""}`}>
                <div className="chat-list-container">
                    {user?.id && (
                        <ChatList
                            selectedChatId={selectedChatId || viewingSocialChat?.maCuocTroChuyen}
                            onSelectChat={handleSelectChat}
                            userId={user.id}
                        />
                    )}
                </div>

                {/* === KHU VỰC THAY ĐỔI CHÍNH === */}
                <div className="chat-box-container">
                    {/* Logic render mới:
                      1. Ưu tiên hiển thị SocialChatViewer nếu viewingSocialChat có dữ liệu.
                      2. Nếu không, hiển thị ChatBox nếu selectedChatId có dữ liệu.
                      3. Nếu không, hiển thị placeholder.
                    */}
                    {viewingSocialChat ? (
                        <SocialChatViewer
                            chat={viewingSocialChat}
                            userId={user?.id}
                            // Bỏ prop onClose vì không còn nút đóng
                        />
                    ) : selectedChatId ? (
                        <ChatBox
                            maCuocTroChuyen={selectedChatId}
                            // các props khác giữ nguyên
                            nguoiNhanId={selectedChatUserId}
                            nguoiGuiId={user.id}
                        />
                    ) : (
                        <div className="empty-chat-placeholder">
                            <img
                                src={chatBanner}
                                alt="Chat Banner"
                                className="IconChat-TrangChat"
                            />
                            <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                        </div>
                    )}
                </div>
                {/* === KẾT THÚC THAY ĐỔI === */}

            </div>

            {/* --- BỎ KHỐI RENDER MODAL Ở ĐÂY --- */}
            {/* {viewingSocialChat && ( ... )} */}
        </div>
    );
};

export default TrangChat;