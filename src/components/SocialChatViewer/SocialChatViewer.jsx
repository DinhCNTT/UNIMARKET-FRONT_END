import React, { useState, useEffect, useRef, useCallback } from "react";
import "./SocialChatViewer.css";
import VideoMessage from "./VideoMessage";
import TextMessage from "./TextMessage";
import ChatInput from "./ChatInput";
import DeleteMessageModal from "./DeleteMessageModal";
import {
    joinGroup,
    registerChatEventHandler,
    unregisterChatEventHandler,
    recallMessage,
    deleteMessageForMe,
    // (Không cần import 'sendMessage' ở đây, ChatInput.jsx tự xử lý)
} from "../../services/chatSocialService";

// (Toàn bộ code 'useRelativeTime' của bạn được giữ nguyên)
const useRelativeTime = (isoDateString, isOnline) => {
    const [relativeTime, setRelativeTime] = useState("");

    const format = (date) => {
        if (!date) return "Ngoại tuyến";
        const now = new Date();
        const past = new Date(date);
        const seconds = Math.floor((now - past) / 1000);
        if (seconds < 0) return "Hoạt động vừa xong";
        if (seconds < 60) return "Hoạt động vừa xong";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `Hoạt động ${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Hoạt động ${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        return `Hoạt động ${days} ngày trước`;
    };

    useEffect(() => {
        if (isOnline) {
            setRelativeTime("Đang hoạt động");
            return;
        }
        if (!isoDateString) {
            setRelativeTime("Ngoại tuyến");
            return;
        }
        setRelativeTime(format(isoDateString));
        const interval = setInterval(() => setRelativeTime(format(isoDateString)), 30000);
        return () => clearInterval(interval);
    }, [isoDateString, isOnline]);

    return relativeTime;
};


const SocialChatViewer = ({ chat, userId }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const messageListTopRef = useRef(null);
    const [partnerActivity, setPartnerActivity] = useState(null);
    const activityString = useRelativeTime(partnerActivity?.lastActive, partnerActivity?.isOnline);

    // --- ✨ State cho Trả lời & Xóa ---
    const [replyingTo, setReplyingTo] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null); 

    // ✨ 1. THÊM REF ĐỂ LƯU CÁC DOM NODE CỦA TIN NHẮN (TỪ CODE 2)
    const messageRefs = useRef(new Map());

    // --- Logic scroll (giữ nguyên) ---
    useEffect(() => {
        if (!loadingMore) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loadingMore]);

    // --- Logic lấy trạng thái (giữ nguyên) ---
    useEffect(() => {
        const fetchPartnerActivity = async () => {
            if (!chat?.partner?.id) {
                setPartnerActivity(null);
                return;
            }
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `http://localhost:5133/api/SocialShare/activity/${chat.partner.id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.ok) {
                    const data = await response.json();
                    setPartnerActivity(data);
                } else {
                    setPartnerActivity({ isOnline: false, lastActive: null });
                }
            } catch (error) {
                console.error("Lỗi khi lấy activity:", error);
                setPartnerActivity({ isOnline: false, lastActive: null });
            }
        };
        fetchPartnerActivity();
    }, [chat?.partner?.id]);

    // --- Handlers Real-time (ĐÃ SỬA VÀ BỔ SUNG) ---
    const handleReceiveMessage = useCallback(
        (newMessage) => {
            if (newMessage.maCuocTroChuyen === chat?.maCuocTroChuyen) {
                setMessages((prev) => [...prev, newMessage]);
            }
        },
        [chat?.maCuocTroChuyen]
    );

    const handlePresenceUpdate = useCallback(
        (presence) => {
            if (presence.userId === chat?.partner?.id) {
                setPartnerActivity({
                    isOnline: presence.isOnline,
                    lastActive: presence.lastActive,
                });
            }
        },
        [chat?.partner?.id]
    );
    
    // ✨ Handler cho tin nhắn BỊ THU HỒI
    const handleMessageRecalled = useCallback(
        ({ maTinNhan, maCuocTroChuyen: convoId }) => {
            if (convoId !== chat?.maCuocTroChuyen) return;
            setMessages((prev) =>
                prev.map((m) =>
                    m.maTinNhan === maTinNhan
                        ? {
                            ...m,
                            isRecalled: true, // Sửa 'daThuHoi' thành 'isRecalled'
                            noiDung: "[Tin nhắn đã thu hồi]", 
                            mediaUrl: null,
                            share: null,
                            parentMessage: m.parentMessage // Giữ lại parent nếu có
                        }
                        : m
                )
            );
        },
        [chat?.maCuocTroChuyen]
    );

    // ✨ Handler cho tin nhắn BỊ GỠ BỎ (CHỈ MÌNH TÔI)
    const handleMessageRemovedForMe = useCallback(
        ({ maTinNhan, maCuocTroChuyen: convoId }) => {
            if (convoId !== chat?.maCuocTroChuyen) return;
            setMessages((prev) => prev.filter((m) => m.maTinNhan !== maTinNhan));
        },
        [chat?.maCuocTroChuyen]
    );

    // --- Logic fetch tin nhắn (giữ nguyên) ---
    const fetchMessages = useCallback(async (page, isInitialLoad = false) => {
        if (!chat?.maCuocTroChuyen) return;

        if (isInitialLoad) setLoading(true);
        else setLoadingMore(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:5133/api/SocialShare/social/history/${chat.maCuocTroChuyen}?pageNumber=${page}&pageSize=30`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error("Failed to fetch history");
            const data = await response.json();

            console.log("Dữ liệu tin nhắn nhận được:", data.messages);

            setMessages((prev) =>
                isInitialLoad ? data.messages : [...data.messages, ...prev]
            );
            setHasMore(data.pageNumber < data.totalPages);
            setPageNumber(data.pageNumber);

        } catch (err) {
            console.error("Lỗi fetch history:", err);
            setHasMore(false);
        } finally {
            if (isInitialLoad) setLoading(false);
            else setLoadingMore(false);
        }
    }, [chat?.maCuocTroChuyen]);

    // --- useEffect Đăng ký sự kiện (ĐÃ SỬA) ---
    useEffect(() => {
        if (!chat?.maCuocTroChuyen) return;

        registerChatEventHandler("ReceiveMessage", handleReceiveMessage);
        registerChatEventHandler("PresenceUpdated", handlePresenceUpdate);
        registerChatEventHandler("MessageRecalled", handleMessageRecalled); // ✨ Đã thêm
        registerChatEventHandler("MessageRemovedForMe", handleMessageRemovedForMe); // ✨ Đã thêm

        setMessages([]);
        setHasMore(true);
        fetchMessages(1, true);
        if (chat?.maCuocTroChuyen) joinGroup(chat.maCuocTroChuyen);
        
        return () => {
            unregisterChatEventHandler("ReceiveMessage", handleReceiveMessage);
            unregisterChatEventHandler("PresenceUpdated", handlePresenceUpdate);
            unregisterChatEventHandler("MessageRecalled", handleMessageRecalled); // ✨ Đã thêm
            unregisterChatEventHandler("MessageRemovedForMe", handleMessageRemovedForMe); // ✨ Đã thêm
        };
    }, [
        chat?.maCuocTroChuyen, 
        chat?.partner?.id, 
        handleReceiveMessage, 
        handlePresenceUpdate, 
        fetchMessages,
        handleMessageRecalled, // ✨ Đã thêm
        handleMessageRemovedForMe // ✨ Đã thêm
    ]);

    // --- useEffect scroll (giữ nguyên) ---
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    fetchMessages(pageNumber + 1);
                }
            },
            { threshold: 1.0 }
        );

        const currentTopRef = messageListTopRef.current;
        if (currentTopRef) {
            observer.observe(currentTopRef);
        }
        return () => {
            if (currentTopRef) {
                observer.unobserve(currentTopRef);
            }
        };
    }, [hasMore, loadingMore, loading, pageNumber, fetchMessages]);

    
    // --- ✨ HÀM HÀNH ĐỘNG (ĐÃ SỬA) ---

    // Bắt đầu trả lời (DÙNG TÊN onStartReply)
    const handleStartReply = (message) => {
        setReplyingTo(message);
    };

    // Mở modal xóa (DÙNG TÊN onOpenDeleteModal)
    const handleOpenDeleteModal = (message) => {
        setMessageToDelete(message);
    };

    // Đóng modal xóa
    const handleCloseDeleteModal = () => {
        setMessageToDelete(null);
    };

    // Xác nhận xóa/thu hồi (ĐÃ SỬA LẠI LOGIC)
    const handleConfirmDelete = async () => {
        if (!messageToDelete) return;

        const { maTinNhan, maNguoiGui } = messageToDelete;
        const conversationId = chat.maCuocTroChuyen; 

        if (!conversationId) {
            console.error("Không tìm thấy conversationId!");
            alert("Đã xảy ra lỗi: Không tìm thấy ID cuộc trò chuyện.");
            return;
        }

        const isMyMessage = maNguoiGui === userId;

        try {
            if (isMyMessage) {
                await recallMessage(conversationId, maTinNhan);
            } else {
                await deleteMessageForMe(conversationId, maTinNhan);
            }
            handleCloseDeleteModal();
        } catch (error) {
            console.error("Lỗi khi xóa tin nhắn:", error);
            alert(error.message || "Đã xảy ra lỗi khi xóa tin nhắn.");
        }
    };
    
    // ✨ 2. THÊM HÀM JUMP-TO-MESSAGE (TỪ CODE 2)
    const handleJumpToMessage = (messageId) => {
        const node = messageRefs.current.get(messageId);
        
        if (node) {
            // Nếu tìm thấy tin nhắn trong DOM
            node.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Thêm class 'highlighted' (CSS sẽ xử lý animation)
            node.classList.add('highlighted');
            
            // Xóa class sau 2.5 giây để animation không chạy lại
            setTimeout(() => {
                node.classList.remove('highlighted');
            }, 2500); // Khớp với 2.5s trong CSS
        } else {
            // Không tìm thấy tin nhắn (có thể do chưa tải)
            console.warn(`Không tìm thấy tin nhắn ${messageId} trong DOM. Có thể nó chưa được tải.`);
            alert("Không thể tìm thấy tin nhắn gốc (có thể đã bị trôi quá xa).");
        }
    };


    if (!chat) return null;

    return (
        <div className="social-chat-panel">
            {/* --- Header (giữ nguyên) --- */}
            <header className="chat-viewer-header">
                <img
                    src={chat.partner?.avatarUrl || "/default-avatar.png"}
                    alt="Avatar"
                    className="chat-viewer-avatar"
                />
                <div className="chat-viewer-info">
                    <h3>{chat.partner?.fullName || "Cuộc trò chuyện"}</h3>
                    {partnerActivity && (
                        <span
                            className={`chat-viewer-status ${
                                partnerActivity.isOnline ? "online" : "offline"
                            }`}
                        >
                            {activityString}
                        </span>
                    )}
                </div>
            </header>
            
            {/* --- Main (ĐÃ SỬA LỖI PROPS VÀ THÊM LOGIC REF) --- */}
            <main className="chat-messages-list">
                <div ref={messageListTopRef} style={{ height: "1px" }} />
                {loadingMore && <p style={{ textAlign: "center" }}>Đang tải tin cũ...</p>}
                {loading ? (
                    <p style={{ textAlign: "center" }}>Đang tải...</p>
                ) : (
                    messages.map((msg) => {
                        // ✨ 3. THÊM CALLBACK REF (TỪ CODE 2)
                        const messageRefCallback = (node) => {
                            if (node) {
                                messageRefs.current.set(msg.maTinNhan, node);
                            } else {
                                messageRefs.current.delete(msg.maTinNhan);
                            }
                        };
                        
                        // (Logic render của bạn)
                        return (msg.share && msg.share.previewVideo) && !msg.isRecalled ? (
                            <VideoMessage
                                ref={messageRefCallback} // ✨ 4. GẮN REF
                                key={msg.maTinNhan}
                                message={msg}
                                currentUserId={userId}
                                onStartReply={handleStartReply}
                                onOpenDeleteModal={handleOpenDeleteModal}
                                onJumpToMessage={handleJumpToMessage} // ✨ 5. TRUYỀN HÀM JUMP
                            />
                        ) : (
                            <TextMessage
                                ref={messageRefCallback} // ✨ 4. GẮN REF
                                key={msg.maTinNhan}
                                message={msg}
                                currentUserId={userId}
                                onStartReply={handleStartReply}
                                onOpenDeleteModal={handleOpenDeleteModal}
                                onJumpToMessage={handleJumpToMessage} // ✨ 5. TRUYỀN HÀM JUMP
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* --- ChatInput (ĐÃ SỬA PROPS) --- */}
            <ChatInput 
                chatId={chat.maCuocTroChuyen} 
                replyingTo={replyingTo}
                onClearReply={() => setReplyingTo(null)}
            />

            {/* --- Modal (ĐÃ SỬA PROPS) --- */}
            {messageToDelete && (
                <DeleteMessageModal
                    message={messageToDelete}
                    currentUserId={userId} // ✨ Bổ sung prop còn thiếu
                    onConfirm={handleConfirmDelete}
                    onClose={handleCloseDeleteModal}
                />
            )}
        </div>
    );
};

export default SocialChatViewer;