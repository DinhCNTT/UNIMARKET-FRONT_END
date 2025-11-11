import * as signalR from "@microsoft/signalr";

const apiBaseUrl = "http://localhost:5133/api";
let connection = null;

// Helper function to get auth token
const getAuthToken = () => {
  // Thử các cách lấy token phổ biến
  return localStorage.getItem('token') || 
         localStorage.getItem('authToken') || 
         localStorage.getItem('jwt') ||
         sessionStorage.getItem('token') ||
         sessionStorage.getItem('authToken');
};

export const startChat = async (maNguoiGui, maNguoiBan) => {
  try {
    const token = getAuthToken();
    const headers = { "Content-Type": "application/json" };
    
    // Thêm Authorization header nếu có token
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBaseUrl}/chat/start`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        MaNguoiDung1: maNguoiGui,
        MaNguoiDung2: maNguoiBan,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi khi tạo cuộc trò chuyện - response:", response.status, response.statusText, errorText);
      throw new Error(`Lỗi khi tạo cuộc trò chuyện: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.maCuocTroChuyen || data.MaCuocTroChuyen || null;
  } catch (error) {
    console.error("startChat error:", error);
    return null;
  }
};

export const connectToChatHub = async (maCuocTroChuyen, onReceiveMessage) => {
  const token = getAuthToken();
  
  if (!token) {
    console.error("❌ Không tìm thấy authentication token. Vui lòng đăng nhập lại.");
    throw new Error("Authentication token not found");
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5133/hub/chat", {
      // 🔧 THÊM TOKEN AUTHENTICATION
      accessTokenFactory: () => token,
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: retryContext => {
        // Retry sau 0, 2, 10, 30 giây
        if (retryContext.previousRetryCount === 0) return 0;
        if (retryContext.previousRetryCount === 1) return 2000;
        if (retryContext.previousRetryCount === 2) return 10000;
        if (retryContext.previousRetryCount === 3) return 30000;
        return null; // Dừng retry sau 4 lần
      }
    })
    .build();

  // Thêm error handling cho connection
  connection.onclose((error) => {
    console.log("SignalR connection closed:", error);
  });

  connection.onreconnecting((error) => {
    console.log("SignalR attempting to reconnect:", error);
  });

  connection.onreconnected((connectionId) => {
    console.log("SignalR reconnected. Connection ID:", connectionId);
    // Tự động rejoin room sau khi reconnect
    if (maCuocTroChuyen) {
      connection.invoke("ThamGiaCuocTroChuyen", maCuocTroChuyen)
        .catch(err => console.error("Error rejoining room after reconnect:", err));
    }
  });

  connection.on("NhanTinNhan", onReceiveMessage);

  try {
    console.log("Đang bắt đầu kết nối SignalR với authentication...");
    await connection.start();
    console.log("✅ SignalR kết nối thành công với authentication");
    
    await waitUntilConnected();
    console.log(`Tham gia cuộc trò chuyện: ${maCuocTroChuyen}`);
    
    await connection.invoke("ThamGiaCuocTroChuyen", maCuocTroChuyen);
    console.log("Tham gia cuộc trò chuyện thành công");
    
    return connection;
  } catch (err) {
    console.error("❌ Kết nối SignalR thất bại:", err);
    
    // Kiểm tra nếu lỗi là do authentication
    if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      console.error("🔐 Lỗi authentication. Token có thể đã hết hạn.");
      throw new Error("Authentication failed. Please login again.");
    }
    
    return null;
  }
};

const waitUntilConnected = () => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 100; // 5 giây (50ms * 100)
    
    const check = () => {
      attempts++;
      
      if (connection.state === signalR.HubConnectionState.Connected) {
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error("Connection timeout"));
      } else {
        setTimeout(check, 50);
      }
    };
    
    check();
  });
};

export const sendMessage = async (maCuocTroChuyen, maNguoiGui, noiDung, loaiTinNhan = "text") => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    console.warn("⚠️ Không thể gửi tin nhắn vì chưa kết nối SignalR.");
    throw new Error("SignalR connection not available");
  }

  try {
    console.log(`Đang gửi tin nhắn: [${maCuocTroChuyen}] từ ${maNguoiGui}:`, noiDung, loaiTinNhan);
    await connection.invoke("GuiTinNhan", maCuocTroChuyen, maNguoiGui, noiDung, loaiTinNhan);
    console.log("Gửi tin nhắn thành công");
  } catch (err) {
    console.error("❌ Gửi tin nhắn lỗi:", err);
    throw err;
  }
};

// Thêm function để disconnect
export const disconnectFromChatHub = async () => {
  if (connection) {
    try {
      await connection.stop();
      console.log("SignalR connection stopped");
    } catch (err) {
      console.error("Error stopping SignalR connection:", err);
    } finally {
      connection = null;
    }
  }
};

// Thêm function để kiểm tra connection status
export const getConnectionState = () => {
  return connection ? connection.state : "Disconnected";
};
// -----------------------------
// API helpers for chat actions
// -----------------------------
export const deleteConversationForMe = async (maCuocTroChuyen, userId) => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/chat/delete-conversation-for-me/${maCuocTroChuyen}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Delete conversation failed: ${res.status} ${res.statusText} - ${text}`);
    }

    // Try to parse JSON response if available (we return the hidden record)
    try {
      const body = await res.json().catch(() => null);
      return body || true;
    } catch (err) {
      return true;
    }
  } catch (err) {
    console.error("deleteConversationForMe error:", err);
    throw err;
  }
};

export const setChatState = async (chatId, isHidden, isDeleted, userId) => {
  try {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/chat/set-chat-state`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, chatId, isHidden, isDeleted })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`setChatState failed: ${res.status} ${res.statusText} - ${text}`);
    }

    return await res.json().catch(() => null);
  } catch (err) {
    console.error("setChatState error:", err);
    throw err;
  }
};

export const bulkSetChatState = async (chatIds, isHidden, isDeleted, userId) => {
  try {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/chat/bulk-set-chat-state`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, chatIds, isHidden, isDeleted })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`bulkSetChatState failed: ${res.status} ${res.statusText} - ${text}`);
    }

    return await res.json().catch(() => null);
  } catch (err) {
    console.error("bulkSetChatState error:", err);
    throw err;
  }
};

export const getUserChatStates = async (userId) => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/chat/user-chat-states/${encodeURIComponent(userId)}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getUserChatStates failed: ${res.status} ${res.statusText} - ${text}`);
    }
    return await res.json();
  } catch (err) {
    console.error("getUserChatStates error:", err);
    return [];
  }
};

export const getUserChats = async (userId) => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBaseUrl}/chat/user/${encodeURIComponent(userId)}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getUserChats failed: ${res.status} ${res.statusText} - ${text}`);
    }
    return await res.json();
  } catch (err) {
    console.error("getUserChats error:", err);
    return [];
  }
};