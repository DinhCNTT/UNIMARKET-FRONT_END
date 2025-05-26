import * as signalR from "@microsoft/signalr";

const apiBaseUrl = "http://localhost:5133/api";

let connection = null;

// Hàm gọi API tạo hoặc lấy mã cuộc trò chuyện
export const startChat = async (maNguoiGui, maNguoiBan) => {
  try {
    const response = await fetch(`${apiBaseUrl}/chat/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    console.log("Response từ API startChat:", data);
    // Chỉnh lại tên trường cho đúng với response
    return data.maCuocTroChuyen || data.MaCuocTroChuyen || null;
  } catch (error) {
    console.error("startChat error:", error);
    return null;
  }
};


export const connectToChatHub = async (maCuocTroChuyen, onReceiveMessage) => {
  connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5133/hub/chat")
    .withAutomaticReconnect()
    .build();

  connection.on("NhanTinNhan", onReceiveMessage);

  try {
    console.log("Đang bắt đầu kết nối SignalR...");
    await connection.start();
    console.log("✅ SignalR kết nối thành công");

    await waitUntilConnected();

    console.log(`Tham gia cuộc trò chuyện: ${maCuocTroChuyen}`);
    await connection.invoke("ThamGiaCuocTroChuyen", maCuocTroChuyen);
    console.log("Tham gia cuộc trò chuyện thành công");
    return connection;
  } catch (err) {
    console.error("❌ Kết nối SignalR thất bại hoặc lỗi khi tham gia cuộc trò chuyện: ", err);
    return null;
  }
};

const waitUntilConnected = () => {
  return new Promise((resolve) => {
    const check = () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
};

export const sendMessage = async (maCuocTroChuyen, maNguoiGui, noiDung) => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    console.warn("⚠️ Không thể gửi tin nhắn vì chưa kết nối SignalR.");
    return;
  }

  try {
    console.log(`Đang gửi tin nhắn: [${maCuocTroChuyen}] từ ${maNguoiGui}:`, noiDung);
    await connection.invoke("GuiTinNhan", maCuocTroChuyen, maNguoiGui, noiDung);
    console.log("Gửi tin nhắn thành công");
  } catch (err) {
    console.error("❌ Gửi tin nhắn lỗi: ", err);
  }
};
