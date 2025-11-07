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

    // --- State cho Trả lời & Xóa ---
    const [replyingTo, setReplyingTo] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);

    // ✨ [MỚI TỪ CODE 2] State quản lý trạng thái chặn
    const [blockStatus, setBlockStatus] = useState(null);

    // --- Ref để lưu các DOM node của tin nhắn ---
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

    // ===================================
    // HÀM REALTIME HANDLERS
    // ===================================
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

    // Handler cho tin nhắn BỊ THU HỒI
    const handleMessageRecalled = useCallback(
        ({ maTinNhan, maCuocTroChuyen: convoId }) => {
            if (convoId !== chat?.maCuocTroChuyen) return;
            setMessages((prev) =>
                prev.map((m) =>
                    m.maTinNhan === maTinNhan
                        ? {
                            ...m,
                            isRecalled: true,
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

    // Handler cho tin nhắn BỊ GỠ BỎ (CHỈ MÌNH TÔI)
    const handleMessageRemovedForMe = useCallback(
        ({ maTinNhan, maCuocTroChuyen: convoId }) => {
            if (convoId !== chat?.maCuocTroChuyen) return;
            setMessages((prev) => prev.filter((m) => m.maTinNhan !== maTinNhan));
        },
        [chat?.maCuocTroChuyen]
    );

    // ✨ [MỚI TỪ CODE 2] Handler cập nhật trạng thái Chặn/Gỡ Chặn
    const handleBlockStatusChanged = useCallback(
        (data) => {
            // Chỉ cập nhật nếu đúng là cuộc trò chuyện đang mở
            if (data.maCuocTroChuyen === chat?.maCuocTroChuyen) {
                setBlockStatus({
                    isBlocked: data.isBlocked,
                    maNguoiChan: data.maNguoiChan,
                });
            }
        },
        [chat?.maCuocTroChuyen] // Phụ thuộc vào chat đang chọn
    );

    // ✨ [MỚI TỪ CODE 2] Handler nhận lỗi (ví dụ: gửi tin khi bị chặn)
    const handleReceiveError = useCallback((errorMessage) => {
        // Hiển thị lỗi cho người dùng
        alert(errorMessage);
        // Bạn có thể dùng một thư viện toast đẹp hơn (ví dụ: react-toastify)
    }, []);


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

    // ===================================
    // USE EFFECT (ĐĂNG KÝ SỰ KIỆN)
    // ===================================
    useEffect(() => {
        if (!chat?.maCuocTroChuyen) return;

        // ✨ [MỚI TỪ CODE 2] Cập nhật state chặn khi 'chat' prop thay đổi
        setBlockStatus({
            isBlocked: chat.isBlocked,
            maNguoiChan: chat.maNguoiChan,
        });

        // Đăng ký các handler
        registerChatEventHandler("ReceiveMessage", handleReceiveMessage);
        registerChatEventHandler("PresenceUpdated", handlePresenceUpdate);
        registerChatEventHandler("MessageRecalled", handleMessageRecalled);
        registerChatEventHandler("MessageRemovedForMe", handleMessageRemovedForMe);
        // ✨ [MỚI TỪ CODE 2] Đăng ký sự kiện
        registerChatEventHandler("BlockStatusChanged", handleBlockStatusChanged);
        registerChatEventHandler("ReceiveError", handleReceiveError);

        // Reset và fetch tin nhắn
        setMessages([]);
        setHasMore(true);
        fetchMessages(1, true);
        if (chat?.maCuocTroChuyen) joinGroup(chat.maCuocTroChuyen);

        // Cleanup
        return () => {
            unregisterChatEventHandler("ReceiveMessage", handleReceiveMessage);
            unregisterChatEventHandler("PresenceUpdated", handlePresenceUpdate);
            unregisterChatEventHandler("MessageRecalled", handleMessageRecalled);
            unregisterChatEventHandler("MessageRemovedForMe", handleMessageRemovedForMe);
            // ✨ [MỚI TỪ CODE 2] Hủy đăng ký
            unregisterChatEventHandler("BlockStatusChanged", handleBlockStatusChanged);
            unregisterChatEventHandler("ReceiveError", handleReceiveError);
        };
    }, [
        chat?.maCuocTroChuyen,
        chat?.partner?.id,
        // ✏️ [SỬA TỪ CODE 2] Thêm chat.isBlocked và chat.maNguoiChan làm dependency
        chat?.isBlocked,
        chat?.maNguoiChan,
        handleReceiveMessage,
        handlePresenceUpdate,
        fetchMessages,
        handleMessageRecalled,
        handleMessageRemovedForMe,
        // ✨ [MỚI TỪ CODE 2] Thêm dependencies
        handleBlockStatusChanged,
        handleReceiveError
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


    // ===================================
    // HÀM HÀNH ĐỘNG (REPLY, DELETE, JUMP)
    // ===================================

    // Bắt đầu trả lời
    const handleStartReply = (message) => {
        setReplyingTo(message);
    };

    // Mở modal xóa
    const handleOpenDeleteModal = (message) => {
        setMessageToDelete(message);
    };

    // Đóng modal xóa
    const handleCloseDeleteModal = () => {
        setMessageToDelete(null);
    };

    // Xác nhận xóa/thu hồi
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

    // Hàm JUMP-TO-MESSAGE
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

    // ✨ [MỚI TỪ CODE 2] Hàm render ô nhập tin nhắn hoặc thông báo chặn
    const renderChatInput = () => {
        if (!blockStatus) return null; // Đang tải

        if (blockStatus.isBlocked) {
            const isBlocker = blockStatus.maNguoiChan === userId;
            const message = isBlocker
                ? "To send messages, unblock this account."
                : "Bạn đã bị người dùng này chặn.";

            return (
                <div className="chat-input-blocked-wrapper">
                    <p className="chat-input-blocked-text">{message}</p>
                </div>
            );
        }

        // Nếu không bị chặn
        return (
            <ChatInput
                chatId={chat.maCuocTroChuyen}
                replyingTo={replyingTo}
                onClearReply={() => setReplyingTo(null)}
            />
        );
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
                            className={`chat-viewer-status ${partnerActivity.isOnline ? "online" : "offline"
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
                        // THÊM CALLBACK REF
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
                                ref={messageRefCallback} // GẮN REF
                                key={msg.maTinNhan}
                                message={msg}
                                currentUserId={userId}
                                onStartReply={handleStartReply}
                                onOpenDeleteModal={handleOpenDeleteModal}
                                onJumpToMessage={handleJumpToMessage} // TRUYỀN HÀM JUMP
                            />
                        ) : (
                            <TextMessage
                                ref={messageRefCallback} // GẮN REF
                                key={msg.maTinNhan}
                                message={msg}
                                currentUserId={userId}
                                onStartReply={handleStartReply}
                                onOpenDeleteModal={handleOpenDeleteModal}
                                onJumpToMessage={handleJumpToMessage} // TRUYỀN HÀM JUMP
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* ✏️ [SỬA TỪ CODE 2] Dùng hàm renderChatInput để hiển thị có điều kiện */}
            {renderChatInput()}

            {/* --- Modal (ĐÃ SỬA PROPS) --- */}
            {messageToDelete && (
                <DeleteMessageModal
                    message={messageToDelete}
                    currentUserId={userId} // Bổ sung prop còn thiếu
                    onConfirm={handleConfirmDelete}
                    onClose={handleCloseDeleteModal}
                />
            )}
        </div>
    );
};

export default SocialChatViewer;