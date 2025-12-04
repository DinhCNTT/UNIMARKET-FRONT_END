import React, { useState, useEffect, useRef, useCallback } from "react";
import "./SocialChatViewer.css";
import VideoMessage from "./VideoMessage";
import TextMessage from "./TextMessage";
import ChatInput from "./ChatInput";
import DeleteMessageModal from "./DeleteMessageModal";
import LikedVideoDetailViewer from "../../pages/LikedVideoDetailViewer/LikedVideoDetailViewer";
import {
    joinGroup,
    registerChatEventHandler,
    unregisterChatEventHandler,
    recallMessage,
    deleteMessageForMe,
} from "../../services/chatSocialService";

// ==========================================
// HELPER: useRelativeTime (Giữ nguyên)
// ==========================================
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

// ==========================================
// MAIN COMPONENT: SocialChatViewer
// ==========================================
const SocialChatViewer = ({ chat, userId }) => {
    // --- State Chat Cơ Bản ---
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

    // --- State quản lý trạng thái chặn ---
    const [blockStatus, setBlockStatus] = useState(null);

    // ✨ [MỚI TỪ CODE 2] State quản lý video đang xem (Overlay)
    const [viewingVideo, setViewingVideo] = useState(null);

    // --- Ref để lưu các DOM node của tin nhắn ---
    const messageRefs = useRef(new Map());

    // ===================================
    // ✨ [MỚI TỪ CODE 2] HANDLERS VIDEO
    // ===================================
    
    // Hàm mở video (sẽ được truyền xuống VideoMessage)
    const handleOpenVideo = useCallback((videoData) => {
        setViewingVideo(videoData);
    }, []);

    // Hàm đóng video (truyền vào LikedVideoDetailViewer)
    const handleCloseVideo = useCallback(() => {
        setViewingVideo(null);
    }, []);

    // ===================================
    // LOGIC SCROLL & FETCH DATA
    // ===================================

    // Scroll xuống dưới cùng khi có tin nhắn mới (nếu không đang load cũ)
    useEffect(() => {
        if (!loadingMore) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loadingMore]);

    // Lấy trạng thái hoạt động partner
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
    // REALTIME HANDLERS
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
                            parentMessage: m.parentMessage
                        }
                        : m
                )
            );
        },
        [chat?.maCuocTroChuyen]
    );

    const handleMessageRemovedForMe = useCallback(
        ({ maTinNhan, maCuocTroChuyen: convoId }) => {
            if (convoId !== chat?.maCuocTroChuyen) return;
            setMessages((prev) => prev.filter((m) => m.maTinNhan !== maTinNhan));
        },
        [chat?.maCuocTroChuyen]
    );

    const handleBlockStatusChanged = useCallback(
        (data) => {
            if (data.maCuocTroChuyen === chat?.maCuocTroChuyen) {
                setBlockStatus({
                    isBlocked: data.isBlocked,
                    maNguoiChan: data.maNguoiChan,
                });
            }
        },
        [chat?.maCuocTroChuyen]
    );

    const handleReceiveError = useCallback((errorMessage) => {
        alert(errorMessage);
    }, []);

    // ===================================
    // API FETCH MESSAGES
    // ===================================
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
    // USE EFFECT (REGISTER EVENTS)
    // ===================================
    useEffect(() => {
        if (!chat?.maCuocTroChuyen) return;

        setBlockStatus({
            isBlocked: chat.isBlocked,
            maNguoiChan: chat.maNguoiChan,
        });

        registerChatEventHandler("ReceiveMessage", handleReceiveMessage);
        registerChatEventHandler("PresenceUpdated", handlePresenceUpdate);
        registerChatEventHandler("MessageRecalled", handleMessageRecalled);
        registerChatEventHandler("MessageRemovedForMe", handleMessageRemovedForMe);
        registerChatEventHandler("BlockStatusChanged", handleBlockStatusChanged);
        registerChatEventHandler("ReceiveError", handleReceiveError);

        setMessages([]);
        setHasMore(true);
        fetchMessages(1, true);
        if (chat?.maCuocTroChuyen) joinGroup(chat.maCuocTroChuyen);

        return () => {
            unregisterChatEventHandler("ReceiveMessage", handleReceiveMessage);
            unregisterChatEventHandler("PresenceUpdated", handlePresenceUpdate);
            unregisterChatEventHandler("MessageRecalled", handleMessageRecalled);
            unregisterChatEventHandler("MessageRemovedForMe", handleMessageRemovedForMe);
            unregisterChatEventHandler("BlockStatusChanged", handleBlockStatusChanged);
            unregisterChatEventHandler("ReceiveError", handleReceiveError);
        };
    }, [
        chat?.maCuocTroChuyen,
        chat?.partner?.id,
        chat?.isBlocked,
        chat?.maNguoiChan,
        handleReceiveMessage,
        handlePresenceUpdate,
        fetchMessages,
        handleMessageRecalled,
        handleMessageRemovedForMe,
        handleBlockStatusChanged,
        handleReceiveError
    ]);

    // Infinite Scroll Observer
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
    // ACTION HANDLERS
    // ===================================
    const handleStartReply = (message) => setReplyingTo(message);
    const handleOpenDeleteModal = (message) => setMessageToDelete(message);
    const handleCloseDeleteModal = () => setMessageToDelete(null);

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

    const handleJumpToMessage = (messageId) => {
        const node = messageRefs.current.get(messageId);
        if (node) {
            node.scrollIntoView({ behavior: 'smooth', block: 'center' });
            node.classList.add('highlighted');
            setTimeout(() => {
                node.classList.remove('highlighted');
            }, 2500);
        } else {
            console.warn(`Không tìm thấy tin nhắn ${messageId} trong DOM.`);
            alert("Không thể tìm thấy tin nhắn gốc (có thể đã bị trôi quá xa).");
        }
    };

    const renderChatInput = () => {
        if (!blockStatus) return null;

        if (blockStatus.isBlocked) {
            const isBlocker = blockStatus.maNguoiChan === userId;
            const message = isBlocker
                ? "Bỏ chặn người dùng này để gửi tin nhắn."
                : "Bạn đã bị người dùng này chặn.";

            return (
                <div className="chat-input-blocked-wrapper">
                    <p className="chat-input-blocked-text">{message}</p>
                </div>
            );
        }

        return (
            <ChatInput
                chatId={chat.maCuocTroChuyen}
                replyingTo={replyingTo}
                onClearReply={() => setReplyingTo(null)}
            />
        );
    };

    if (!chat) return null;

    // ===================================
    // RENDER
    // ===================================
    return (
        <div className="social-chat-panel" style={{ position: 'relative' }}>
            {/* --- Header --- */}
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

            {/* --- Message List --- */}
            <main className="chat-messages-list">
                <div ref={messageListTopRef} style={{ height: "1px" }} />
                {loadingMore && <p style={{ textAlign: "center" }}>Đang tải tin cũ...</p>}
                {loading ? (
                    <p style={{ textAlign: "center" }}>Đang tải...</p>
                ) : (
                    messages.map((msg) => {
                        const messageRefCallback = (node) => {
                            if (node) {
                                messageRefs.current.set(msg.maTinNhan, node);
                            } else {
                                messageRefs.current.delete(msg.maTinNhan);
                            }
                        };

                        return (msg.share && msg.share.previewVideo) && !msg.isRecalled ? (
                            <VideoMessage
                                ref={messageRefCallback}
                                key={msg.maTinNhan}
                                message={msg}
                                currentUserId={userId}
                                onStartReply={handleStartReply}
                                onOpenDeleteModal={handleOpenDeleteModal}
                                onJumpToMessage={handleJumpToMessage}
                                // ✅ [MỚI TỪ CODE 2] Truyền hàm mở video
                                onPreviewVideo={handleOpenVideo}
                            />
                        ) : (
                            <TextMessage
                                ref={messageRefCallback}
                                key={msg.maTinNhan}
                                message={msg}
                                currentUserId={userId}
                                onStartReply={handleStartReply}
                                onOpenDeleteModal={handleOpenDeleteModal}
                                onJumpToMessage={handleJumpToMessage}
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* --- Input / Block Message --- */}
            {renderChatInput()}

            {/* --- Delete Modal --- */}
            {messageToDelete && (
                <DeleteMessageModal
                    message={messageToDelete}
                    currentUserId={userId}
                    onConfirm={handleConfirmDelete}
                    onClose={handleCloseDeleteModal}
                />
            )}

            {/* ✅ [MỚI TỪ CODE 2] HIỂN THỊ VIDEO OVERLAY NẾU CÓ */}
            {viewingVideo && (
                <LikedVideoDetailViewer
                    isOverlay={true}
                    passedVideoData={viewingVideo}
                    onClose={handleCloseVideo}
                />
            )}
        </div>
    );
};

export default SocialChatViewer;