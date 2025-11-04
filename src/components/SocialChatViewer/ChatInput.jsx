import React, { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../../services/chatSocialService';
import ReplyPreview from './ReplyPreview'; // ✨ MỚI - Hiển thị tin nhắn đang được reply

const ChatInput = ({ chatId, replyingTo, onClearReply }) => {
    const [text, setText] = useState('');
    const inputRef = useRef(null);

    // ✨ Khi người dùng chọn reply 1 tin nhắn -> tự động focus vào ô input
    useEffect(() => {
        if (replyingTo) {
            inputRef.current?.focus();
        }
    }, [replyingTo]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (text.trim() === '' || !chatId) return;

        try {
            // ✨ Nếu đang reply, lấy parentId là mã tin nhắn đang được reply
            const parentId = replyingTo ? replyingTo.maTinNhan : null;

            // ✨ Gửi kèm parentId để backend biết đây là reply của tin nào
            await sendMessage(chatId, text.trim(), null, parentId);

            setText(''); // Clear input sau khi gửi
            onClearReply && onClearReply(); // ✨ Reset trạng thái reply (nếu có)
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            // TODO: Có thể thêm alert UI hoặc toast error ở đây
        }
    };

    return (
        <div className="chat-input-wrapper">
            {/* ✨ Nếu đang reply tin nhắn nào đó thì hiển thị preview ở trên */}
            {replyingTo && (
                <ReplyPreview
                    message={replyingTo}
                    onClearReply={onClearReply}
                />
            )}

            <form className="chat-input-container" onSubmit={handleSend}>
                <input
                    ref={inputRef} // ✨ Cho phép focus khi chọn reply
                    type="text"
                    className="chat-input-field"
                    placeholder="Nhắn tin..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <button type="submit" className="chat-send-btn">
                    Gửi
                </button>
            </form>
        </div>
    );
};

export default ChatInput;
