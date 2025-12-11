import { useCallback } from 'react';
import { callAiApi, injectChatMessage } from '../components/AI/AiHelpers';

export function useAiChat() {
  const sendToAi = useCallback(async ({ chatId, userId, text, inject = true }) => {
    const payload = { userMessage: text };
    try {
      const result = await callAiApi(payload);
      if (inject) {
        const aiMsg = {
          maTinNhan: `ai-${Date.now()}`,
          maCuocTroChuyen: chatId,
          noiDung: result.replyText || JSON.stringify(result),
          maNguoiGui: 'ai-bot',
          loaiTinNhan: 'text',
          thoiGianGui: new Date().toISOString(),
          daXem: false,
        };
        injectChatMessage(aiMsg);
      }
      return result;
    } catch (err) {
      console.error('useAiChat.sendToAi error', err);
      throw err;
    }
  }, []);

  return { sendToAi };
}

export default useAiChat;
import { useCallback } from 'react';
import { injectChatMessage, injectChatPreview, callAiApi } from '../components/AI/AiHelpers';

export function useAiChat() {
  // send a message to AI backend and optionally inject the AI reply into a conversation
  const sendToAi = useCallback(async (message, { chatId = null, userId = null, injectToChat = false } = {}) => {
    const data = await callAiApi(message, userId);

    if (injectToChat && chatId) {
      // Insert AI reply as a message into the chat
      const now = new Date().toISOString();
      const aiText = data?.replyText || data?.ReplyText || '';

      injectChatMessage({
        maTinNhan: `ai-${Date.now()}`,
        maCuocTroChuyen: chatId,
        noiDung: aiText,
        maNguoiGui: 'ai-bot',
        loaiTinNhan: 'text',
        thoiGianGui: now,
        daXem: false,
      });

      // Update chat preview
      injectChatPreview({
        maCuocTroChuyen: chatId,
        tinNhanCuoi: aiText,
        thoiGian: now,
      });
    }

    return data;
  }, []);

  return { sendToAi };
}
