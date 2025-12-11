//ChatBanHang/hooks/useSignalR.js
import { useState, useEffect, useRef, useCallback } from "react";
import { connectToChatHub, sendMessage } from "../../../services/chatService";
import { callAiApi, injectChatMessage } from "../../AI/AiHelpers";
import api from "../../../services/api";
import Swal from "sweetalert2";

// 🔥 Tăng lên 30 để load nhiều hơn, ít phải load lại
const PAGE_SIZE = 30;

const mapMessage = (msg, maCuocTroChuyen) => {
  let timeStr = msg.thoiGianGui || msg.thoiGian || msg.thoiGianGui;
  if (timeStr && typeof timeStr === "string" && !timeStr.endsWith("Z")) {
    timeStr += "Z";
  }
  // Base mapped shape
  const base = {
    ...msg,
    thoiGian: timeStr
      ? new Date(timeStr).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    thoiGianGui: timeStr || new Date().toISOString(),
    daXem: msg.daXem || false,
  };

  // If this message is from the AI system, the server may have stored a JSON payload
  // in `noiDung`. Detect and parse that, then attach normalized ai fields so UI can render suggestions.
  try {
    if ((msg.maNguoiGui === "uni.ai" || msg.maNguoiGui === "ai-assistant") && typeof msg.noiDung === "string") {
      const trimmed = msg.noiDung.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        const parsed = JSON.parse(trimmed);
        // parsed may be the AiChatResponseDto or similar
        const replyText = parsed.replyText || parsed.ReplyText || parsed.text || parsed.reply || null;
        const suggested = parsed.suggestedProducts || parsed.SuggestedProducts || parsed.suggestions || parsed.suggested || parsed.products || null;
        const clarQ = parsed.clarifyingQuestion || parsed.ClarifyingQuestion || parsed.clarifying || null;

        return {
          ...base,
          // prefer parsed fields for display
          noiDung: replyText || base.noiDung,
          isAi: true,
          aiSuggestions: Array.isArray(suggested) ? suggested : null,
          clarifyingQuestion: clarQ || null,
        };
      }
    }
  } catch (e) {
    // If parsing fails, fall back to original base object
    // but don't throw; keep original text
    // console.debug('Failed to parse AI JSON message:', e);
  }

  // ✅ FIX: If message from AI, mark as isAi and use parsed data (no caching needed)
  // Backend now stores full JSON payload, so Frontend just parses and displays
  if (msg.maNguoiGui === "uni.ai" || msg.maNguoiGui === "ai-assistant") { 
    return {
      ...base,
      isAi: true,
      aiSuggestions: base.aiSuggestions || null,
      clarifyingQuestion: base.clarifyingQuestion || null,
    };
  }

  return base;
};
// Normalization helper for deduplication: collapse whitespace and lowercase
  const normalize = (txt) => (String(txt || '').replace(/\s+/g, ' ').trim().toLowerCase());

  // Create a stable key for a message to detect duplicates.
  // Use sender + normalized content as primary key for deduplication
  // (even if server ID exists, we want to match against local optimistic messages by content)
  const messageKey = (m) => {
    try {
      const sender = String(m?.maNguoiGui || '').toLowerCase();
      const content = normalize(m?.noiDung || m?.NoiDung || '');
      return `s:${sender}|c:${content}`;
    } catch (e) {
      return `s:${String(m?.maNguoiGui || '')}|c:${String(m?.noiDung || '')}`;
    }
  };
export const useSignalR = (maCuocTroChuyen, user) => {
  const [danhSachTin, setDanhSachTin] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef(null);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Listen for injected sample messages (from AiHelpers) and append when it's for the current chat
  useEffect(() => {
    const handleInjectMessage = (event) => {
      const msg = event.detail;
      try {
        if (!msg || msg.maCuocTroChuyen !== maCuocTroChuyen) return;

        const mapped = mapMessage({
          ...msg,
          thoiGianGui: msg.thoiGianGui || msg.thoiGian || new Date().toISOString(),
        }, maCuocTroChuyen);

        setDanhSachTin((prev) => {
          const prevArr = Array.isArray(prev) ? prev : [];
          // If a message with the same key already exists, skip adding
          const k = messageKey(mapped);
          if (prevArr.some((p) => messageKey(p) === k)) return prevArr;
          return [...prevArr, mapped];
        });
      } catch (err) {
        console.error('Lỗi khi xử lý InjectSampleMessage trong useSignalR:', err);
      }
    };

    window.addEventListener('InjectSampleMessage', handleInjectMessage);
    return () => window.removeEventListener('InjectSampleMessage', handleInjectMessage);
  }, [maCuocTroChuyen]);
  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return;

    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500; // ms
    // 1. Fetch History ban đầu
    const fetchHistory = async (attempt = 0) => {
      try {
        const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
          params: {
            userId: user.id,
            page: 1,
            pageSize: PAGE_SIZE,
          },
        });

        if (isMounted && response.data) {
          const serverMessages = Array.isArray(response.data) ? response.data : [];
          const messages = serverMessages.map(m => mapMessage(m, maCuocTroChuyen)).reverse();

          // Merge server messages with any local injected messages (welcome/local optimistic msgs)
          setDanhSachTin((prev) => {
            const localPrev = Array.isArray(prev) ? prev : [];

            // Identify local-only messages by prefix conventions (welcome-, sample-, local-, ai-)
            const localMessages = localPrev.filter((m) => {
              const id = String(m?.maTinNhan || "");
              return (
                id.startsWith("welcome-") ||
                id.startsWith("sample-") ||
                id.startsWith("local-") ||
                id.startsWith("ai-")
              );
            });

            // If server returned nothing, prefer local injected messages (if any)
            if (messages.length === 0) {
              return localMessages.length > 0 ? localMessages : [];
            }

            // Merge: server messages first, then any local-only messages that are not duplicated
            const uniqueLocal = localMessages.filter((l) => {
              const lkey = messageKey(l);
              return !messages.some((s) => messageKey(s) === lkey);
            });

            // Additionally ensure the final array has unique keys (protect against server duplicates)
            const combined = [...messages, ...uniqueLocal];
            const seen = new Set();
            const deduped = [];
            for (const m of combined) {
              const k = messageKey(m);
              if (!seen.has(k)) {
                seen.add(k);
                deduped.push(m);
              }
            }

            return deduped;
          });
          setPage(1);
          setHasMore(messages.length >= PAGE_SIZE);
        }
      } catch (error) {
       console.error(`[useSignalR] Lỗi lấy lịch sử chat (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
      // ✅ RETRY LOGIC: Nếu lỗi và còn attempts, retry sau delay
        if (isMounted && attempt < MAX_RETRIES - 1) {
          console.log(`[useSignalR] Sẽ retry lấy lịch sử chat sau ${RETRY_DELAY}ms...`);
          setTimeout(() => {
            if (isMounted) {
              fetchHistory(attempt + 1);
            }
          }, RETRY_DELAY);
        } else {
          // Đã retry hết, show error
          if (isMounted) {
            Swal.fire(
              "Lỗi",
              error.message || "Không thể lấy lịch sử chat",
              "error"
            );
          }
        }
      }
    };

    // 🚀 Gọi fetch lần đầu
    fetchHistory(0);

    // 2. Connect SignalR
    const connect = async () => {
      try {
        const onReceiveMessage = (msg) => {
          if (!isMounted) return;
          const newMsg = mapMessage(msg);

          setDanhSachTin((prev) => {
            // Logic xử lý khi chat đã bị xóa (giữ nguyên logic cũ của bạn)
            let deletedMap = {};
            try {
               const raw = localStorage.getItem("deletedConversations");
               deletedMap = raw ? JSON.parse(raw) : {};
            } catch(e){}
            const hadDeleted = !!deletedMap[maCuocTroChuyen];

            if (hadDeleted && prev.length === 0) {
               // Reset nếu là tin nhắn đầu tiên sau khi xóa
               try { delete deletedMap[maCuocTroChuyen]; localStorage.setItem("deletedConversations", JSON.stringify(deletedMap)); } catch(e){}
               setPage(1);
               setHasMore(false);
               return [newMsg];
            } else if (hadDeleted) {
                try { delete deletedMap[maCuocTroChuyen]; localStorage.setItem("deletedConversations", JSON.stringify(deletedMap)); } catch(e){}
            }

            // Kiểm tra trùng lặp cho chắc chắn (dù tin mới ít khi trùng)
            if (prev.some(m => m.maTinNhan === newMsg.maTinNhan)) return prev;
            try {
                const prevArr = Array.isArray(prev) ? prev : [];
                const newKey = messageKey(newMsg);
                // If an existing message matches by key, replace it (avoid dupes)
                const dupIndex = prevArr.findIndex((m) => messageKey(m) === newKey);
                if (dupIndex !== -1) {
                  const copy = prevArr.slice();
                  copy[dupIndex] = newMsg;
                  return copy;
                }
                // otherwise append
                return [...prevArr, newMsg];
              } catch (e) {
                return [...prev, newMsg];
              }
          });
        };

        const connection = await connectToChatHub(maCuocTroChuyen, onReceiveMessage);

        connection.on("TinNhanDaThuHoi", (data) => {
          if (!isMounted) return;
          setDanhSachTin((prev) =>
            prev.map((msg) =>
              msg.maTinNhan === data.maTinNhan
                ? { ...msg, isRecalled: true, noiDung: "Tin nhắn đã được thu hồi" }
                : msg
            )
          );
        });

        connection.on("DaXemTinNhan", (data) => {
          if (!isMounted) return;
          const MaTinNhanCuoi = data?.MaTinNhanCuoi;
          if (MaTinNhanCuoi) {
            setDanhSachTin((prev) =>
              prev.map((msg) =>
                msg.maTinNhan.toString() === MaTinNhanCuoi.toString()
                  ? { ...msg, daXem: true }
                  : msg
              )
            );
          }
        });

        if (isMounted) {
          connectionRef.current = connection;
          setIsConnected(connection && connection.state === "Connected");
        }
        
        connection.onclose(() => { if(isMounted) setIsConnected(false); });
        connection.onreconnected(() => { if(isMounted) setIsConnected(true); });

      } catch (err) {
        console.error("Lỗi kết nối SignalR:", err);
      }
    };

    connect();

    return () => {
      isMounted = false;
      // 🔥 FIX: Chỉ cleanup listener, KHÔNG stop connection (vì dùng chung)
      if (connectionRef.current) {
         try {
             connectionRef.current.off("TinNhanDaThuHoi");
             connectionRef.current.off("DaXemTinNhan");
         } catch(e){}
         connectionRef.current = null;
      }
      setDanhSachTin([]);
      setPage(1);
      setHasMore(true);
      setIsLoadingMore(false);
    };
  }, [maCuocTroChuyen, user?.id]);

  // --- Các hàm tiện ích ---
  const recallMessage = useCallback(async (maTinNhan) => {
    if (connectionRef.current?.state === "Connected") {
      await connectionRef.current.invoke("ThuHoiTinNhan", maTinNhan, user.id);
    }
  }, [user?.id]);

  const recallMedia = useCallback(async (maTinNhan) => {
    if (connectionRef.current?.state === "Connected") {
      await connectionRef.current.invoke("ThuHoiAnhVideo", maTinNhan, user.id);
    }
  }, [user?.id]);

  const markAsRead = useCallback(() => {
    if (connectionRef.current?.state === "Connected" && user && maCuocTroChuyen) {
      connectionRef.current.invoke("DanhDauDaXem", maCuocTroChuyen, user.id).catch(()=>{});
    }
  }, [user?.id, maCuocTroChuyen, isConnected]);

  const sendMessageService = useCallback(async (text, type = "text") => {
    if (!maCuocTroChuyen || !user?.id) throw new Error("Thiếu thông tin");
    // If this is an AI conversation, call AI REST API instead of SignalR
      if (maCuocTroChuyen.startsWith("ai-assistant-")) {
        try {
          // Create user message object for context tracking
          const userMessage = {
            maTinNhan: `local-${Date.now()}`,
            maCuocTroChuyen,
            noiDung: text,
            maNguoiGui: user.id,
            loaiTinNhan: type,
            thoiGianGui: new Date().toISOString(),
            daXem: false,
          };

          // Optimistic UI: show user's message immediately
          injectChatMessage(userMessage);

          // Build a lightweight history (last 8 messages PLUS current message) to send to backend so AI can analyze context
          // This ensures the AI sees the current message in context, even if optimistic addition hasn't processed yet
          const baseHistory = danhSachTin || [];
          const userMsgForHistory = { role: "user", content: text };
          const history = [
            ...baseHistory
              .slice(-7) // Keep last 7 previous messages to leave room for current message
              .map((m) => ({ role: m.maNguoiGui === user.id ? "user" : "assistant", content: m.noiDung })),
            userMsgForHistory, // Add current message to history
          ];

          const res = await callAiApi(text, user.id, history);

          // 🔍 DEBUG: Log AI response
          console.log("[AI DEBUG] Full API response:", res);
          console.log("[AI DEBUG] suggestedProducts:", res?.suggestedProducts || res?.SuggestedProducts);
          console.log("[AI DEBUG] replyText:", res?.replyText || res?.ReplyText);

          // Show AI reply locally (optimistic) and include suggestions / clarifying question if present
          // ✅ NOTE: Backend now persists full JSON with suggestions to Database,
          // so we don't need localStorage caching anymore
          injectChatMessage({
            maTinNhan: `ai-${Date.now()}`,
            maCuocTroChuyen,
            noiDung: res?.replyText || (res?.ReplyText ?? "Uni.AI: ..."),
            maNguoiGui: "uni.ai",
            loaiTinNhan: "text",
            thoiGianGui: new Date().toISOString(),
            daXem: false,
            isAi: true,
            aiSuggestions: res?.suggestedProducts || res?.SuggestedProducts || null,
            clarifyingQuestion: res?.clarifyingQuestion || res?.ClarifyingQuestion || null,
          });

          // Refresh server history to pick up persisted messages (AiService persists user+ai messages)
          try {
            const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
              params: { userId: user.id, page: 1, pageSize: 30 },
            });
            const serverMessages = Array.isArray(response.data) ? response.data : [];
            const messages = serverMessages.map(m => mapMessage(m, maCuocTroChuyen)).reverse();

            // Simply replace with server messages (no local optimization needed since backend persisted everything)
            setDanhSachTin(messages);
          } catch (err) {
            console.warn('Could not refresh history after AI call:', err?.message || err);
          }
        } catch (err) {
          console.error("AI chat send error:", err);
          throw err;
        }
        return;
      }
    await sendMessage(maCuocTroChuyen, user.id, text, type);
  }, [maCuocTroChuyen, user?.id]);

  const deleteLocalMessage = useCallback((maTinNhan) => {
    setDanhSachTin((prev) => prev.filter((msg) => msg.maTinNhan !== maTinNhan));
  }, []);

  // 🔥🔥🔥 HÀM LOAD MORE ĐÃ FIX TRÙNG LẶP BACKEND 🔥🔥🔥
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
        params: {
          userId: user.id,
          page: nextPage,
          pageSize: PAGE_SIZE,
        },
      });

      const newMessages = response.data.map(m => mapMessage(m, maCuocTroChuyen)).reverse();

      if (newMessages.length === 0) {
        setHasMore(false);
      } else {
        setDanhSachTin((prev) => {
          // --- BẮT BUỘC: Lọc trùng lặp do Backend Skip/Take ---
          const existingIds = new Set(prev.map((m) => m.maTinNhan));
          
          // Chỉ lấy những tin chưa tồn tại
          const uniqueNewMessages = newMessages.filter(
            (msg) => !existingIds.has(msg.maTinNhan)
          );
          // ----------------------------------------------------

          return [...uniqueNewMessages, ...prev];
        });

        setPage(nextPage);
        // Nếu số tin lấy về < PAGE_SIZE nghĩa là đã hết sạch tin
        setHasMore(newMessages.length >= PAGE_SIZE);
      }
    } catch (error) {
      console.error("Lỗi tải tin nhắn cũ:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, maCuocTroChuyen, user?.id]);

  return {
    danhSachTin,
    isConnected,
    connection: connectionRef.current,
    recallMessage,
    recallMedia,
    markAsRead,
    sendMessageService,
    deleteLocalMessage,
    loadMoreMessages,
    isLoadingMore,
    hasMore,
  };
};