import React, { useState, useEffect, useRef } from 'react';
import { SendHorizonal } from 'lucide-react'; // ✨ Icon gửi chuyên nghiệp
import { sendMessage } from '../../services/chatSocialService';
import ReplyPreview from './ReplyPreview';

const ChatInput = ({ chatId, replyingTo, onClearReply }) => {
    const [text, setText] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (replyingTo) inputRef.current?.focus();
    }, [replyingTo]);

    // Listen for quick-reply events to send immediately
    useEffect(() => {
        const onQuickReply = async (e) => {
            const detail = e?.detail;
            const replyText = detail?.text;
            if (!replyText || !chatId) return;
            try {
                await sendMessage(chatId, replyText.trim(), null, null);
            } catch (err) {
                console.error('Lỗi gửi quick-reply:', err);
            }
        };
        window.addEventListener('quick-reply', onQuickReply);
        return () => window.removeEventListener('quick-reply', onQuickReply);
    }, [chatId]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (text.trim() === '' || !chatId) return;

        try {
            const parentId = replyingTo ? replyingTo.maTinNhan : null;
            await sendMessage(chatId, text.trim(), null, parentId);
            setText('');
            onClearReply && onClearReply();
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
        }
    };

    return (
        <div className="chat-input-wrapper">
            {replyingTo && (
                <ReplyPreview
                    message={replyingTo}
                    onClearReply={onClearReply}
                />
            )}

            <form className="chat-input-container" onSubmit={handleSend}>
                <input
                    ref={inputRef}
                    type="text"
                    className="chat-input-field"
                    placeholder="Nhắn tin..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                <button
                    type="submit"
                    className={`chat-send-btn ${text.trim() ? 'active' : ''}`}
                    disabled={!text.trim()}
                    aria-label="Gửi tin nhắn"
                >
                    <SendHorizonal size={22} />
                </button>
            </form>
        </div>
    );
};

export default ChatInput;
