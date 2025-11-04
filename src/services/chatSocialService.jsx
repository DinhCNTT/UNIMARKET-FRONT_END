// =================================================== 
// File: src/services/chatSocialService.jsx
// ✅ Phiên bản hoàn chỉnh – Tối ưu hiệu năng, đa người dùng & hỗ trợ reply / xóa riêng
// ===================================================

import * as signalR from "@microsoft/signalr";

const hubUrl = "http://localhost:5133/SocialChatHub"; // ⚙️ đổi sang https nếu server có SSL
let connection = null;
let connectionPromise = null;

// ===================================================
// EVENT HANDLERS — Lưu callback các sự kiện realtime
// ===================================================
const eventHandlers = {
  ReceiveMessage: [],
  CapNhatCuocTroChuyen: [],
  PresenceUpdated: [],
  MessageSeen: [],
  MessageRecalled: [],
  Typing: [],
  // ✨ Thêm mới
  MessageRemovedForMe: [],
};

// ===================================================
// TOKEN HELPER — Lấy token ở nhiều vị trí khác nhau
// ===================================================
const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken");

// ===================================================
// Đăng ký / Hủy đăng ký Event Handler
// ===================================================
export const registerChatEventHandler = (eventName, callback) => {
  if (eventHandlers[eventName] && !eventHandlers[eventName].includes(callback)) {
    eventHandlers[eventName].push(callback);
  }
};

export const unregisterChatEventHandler = (eventName, callback) => {
  if (eventHandlers[eventName]) {
    eventHandlers[eventName] = eventHandlers[eventName].filter((h) => h !== callback);
  }
};

// ===================================================
// KẾT NỐI HUB — Smart Singleton (Race-free, auto reconnect)
// ===================================================
export const connectToSocialChatHub = () => {
  if (connectionPromise) return connectionPromise;

  connectionPromise = new Promise(async (resolve, reject) => {
    const token = getAuthToken();
    if (!token) {
      console.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      connectionPromise = null;
      return reject(new Error("Token không tồn tại"));
    }

    connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    // ===================================================
    // Đăng ký sự kiện realtime từ server
    // ===================================================
    connection.on("ReceiveMessage", (message) => {
      eventHandlers.ReceiveMessage.forEach((h) => h(message));

      // ✅ Cập nhật danh sách cuộc trò chuyện khi có tin nhắn mới
      const payload = {
        MaCuocTroChuyen: message.maCuocTroChuyen ?? message.MaCuocTroChuyen,
        TinNhanCuoi:
          message.noiDung ??
          message.NoiDung ??
          (message.mediaUrl || message.MediaUrl ? "[Đã gửi một tệp]" : ""),
        ThoiGianCapNhat:
          message.thoiGianGui ?? message.ThoiGianGui ?? new Date().toISOString(),
        NguoiGuiId:
          message.maNguoiGui ??
          message.MaNguoiGui ??
          message.sender?.id ??
          message.Sender?.Id,
        TenNguoiGui:
          message.sender?.fullName ??
          message.sender?.FullName ??
          message.TenNguoiGui ??
          message.Sender?.FullName,
        AvatarNguoiGui:
          message.sender?.avatarUrl ??
          message.sender?.AvatarUrl ??
          message.AvatarNguoiGui ??
          message.Sender?.AvatarUrl,
        HasUnreadMessages: true,
        Partner: message.Partner || null,
      };

      eventHandlers.CapNhatCuocTroChuyen.forEach((h) => h(payload));
    });

    connection.on("CapNhatCuocTroChuyen", (data) =>
      eventHandlers.CapNhatCuocTroChuyen.forEach((h) => h(data))
    );
    connection.on("PresenceUpdated", (presence) =>
      eventHandlers.PresenceUpdated.forEach((h) => h(presence))
    );
    connection.on("MessageSeen", (data) =>
      eventHandlers.MessageSeen.forEach((h) => h(data))
    );
    connection.on("MessageRecalled", (data) =>
      eventHandlers.MessageRecalled.forEach((h) => h(data))
    );
    connection.on("Typing", (data) =>
      eventHandlers.Typing.forEach((h) => h(data))
    );

    // ✨ Thêm mới — Khi người dùng xóa tin nhắn "chỉ mình tôi"
    connection.on("MessageRemovedForMe", (data) =>
      eventHandlers.MessageRemovedForMe.forEach((h) => h(data))
    );

    // ===================================================
    // Kết nối SignalR với cơ chế retry tự động
    // ===================================================
    try {
      await connection.start();
      console.log("🔗 Kết nối SocialChatHub thành công. Connection ID:", connection.connectionId);
      resolve(connection);
    } catch (err) {
      console.error("❌ Kết nối SocialChatHub thất bại:", err);
      connectionPromise = null;
      connection = null;
      reject(err);
    }
  });

  return connectionPromise;
};

// ===================================================
// Ngắt kết nối SignalR
// ===================================================
export const disconnectFromSocialChatHub = async () => {
  if (connection) {
    await connection.stop();
    console.log("🔌 Ngắt kết nối SocialChatHub");
  }
  connection = null;
  connectionPromise = null;
};

// ===================================================
// Hàm gọi Hub an toàn (tự reconnect nếu cần)
// ===================================================
const invoke = async (methodName, ...args) => {
  await connectionPromise;

  if (connection?.state !== signalR.HubConnectionState.Connected) {
    console.warn(`⚠️ Hub chưa kết nối khi gọi '${methodName}'. Đang thử kết nối lại...`);
    try {
      await connectToSocialChatHub();
    } catch (error) {
      console.error("❌ Thất bại khi cố gắng kết nối lại.", error);
      return;
    }
  }

  try {
    return await connection.invoke(methodName, ...args);
  } catch (err) {
    console.error(`Lỗi khi gọi '${methodName}':`, err);
  }
};

// ===================================================
// CÁC HÀM CHAT CHÍNH — SignalR Invoke
// ===================================================
export const joinGroup = (maCuocTroChuyen) => invoke("JoinGroup", maCuocTroChuyen);
export const leaveGroup = (maCuocTroChuyen) => invoke("LeaveGroup", maCuocTroChuyen);

// ✨ Cập nhật sendMessage — hỗ trợ reply (parentMessageId)
export const sendMessage = (maCuocTroChuyen, noiDung, mediaUrl = null, parentMessageId = null) =>
  invoke("SendMessage", maCuocTroChuyen, noiDung, mediaUrl, parentMessageId);

export const markAsSeen = (maCuocTroChuyen) => invoke("MarkAsSeen", maCuocTroChuyen);

// ✨ Cập nhật recallMessage để khớp với Hub
export const recallMessage = (maCuocTroChuyen, maTinNhan) =>
  invoke("ThuHoiTinNhan", maCuocTroChuyen, maTinNhan);

export const sendTyping = (maCuocTroChuyen, toUserId = null) =>
  invoke("Typing", maCuocTroChuyen, toUserId);
export const ping = () => invoke("Ping");
export const updateUserPresence = (userId, isOnline) =>
  invoke("CapNhatTrangThaiNguoiDung", userId, isOnline);

// ===================================================
// API CALL — Ẩn hoặc xóa cuộc trò chuyện
// ===================================================
export const deleteConversation = async (maCuocTroChuyen) => {
  const token = getAuthToken();
  if (!token) throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");

  try {
    const res = await fetch(
      `http://localhost:5133/api/SocialShare/conversation/${maCuocTroChuyen}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Lỗi khi ẩn cuộc trò chuyện");
    }

    return await res.json();
  } catch (err) {
    console.error("Lỗi khi gọi API deleteConversation:", err);
    throw err;
  }
};

// ✨ API MỚI: Xóa tin nhắn chỉ ở phía người dùng (delete-for-me)
export const deleteMessageForMe = async (conversationId, messageId) => {
  const token = getAuthToken();
  if (!token) throw new Error("Token không tồn tại.");

  try {
    const response = await fetch(
      `http://localhost:5133/api/SocialShare/message/delete-for-me`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // SỬA LỖI Ở ĐÂY:
        body: JSON.stringify({
          ConversationId: conversationId, // <-- Sửa từ conversationId
          MessageId: messageId            // <-- Sửa từ messageId
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Lỗi khi xóa tin nhắn.");
    }

    return await response.json();
  } catch (err) {
    console.error("Lỗi khi gọi deleteMessageForMe:", err);
    throw err;
  }
};

// ===================================================
// LẤY TRẠNG THÁI KẾT NỐI
// ===================================================
export const getConnectionState = () =>
  connection ? connection.state : "Disconnected";
