import * as signalR from "@microsoft/signalr";

const hubUrl = "http://localhost:5133/hub/chat";

class SignalRService {
  constructor() {
    this.connection = null;
    this.connected = false;
    this.startPromise = null; // Đảm bảo start không chạy song song
  }

  async start() {
    // Nếu đã có kết nối và đang connected thì không start lại
    if (this.connection && this.connected) {
      return;
    }

    // Nếu đang trong quá trình start, chờ kết thúc
    if (this.startPromise) {
      return this.startPromise;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    this.connection.onclose(() => {
      this.connected = false;
      console.log("SignalR connection closed");
    });

    this.startPromise = this.connection.start()
      .then(() => {
        this.connected = true;
        console.log("✅ SignalR connected");
      })
      .catch(error => {
        this.connected = false;
        this.connection = null;
        console.error("❌ SignalR connection failed", error);
      })
      .finally(() => {
        this.startPromise = null;
      });

    return this.startPromise;
  }

  async stop() {
    if (this.connection && this.connected) {
      try {
        await this.connection.stop();
        console.log("SignalR connection stopped");
      } catch (error) {
        console.error("Error stopping SignalR connection:", error);
      }
    }
    this.connected = false;
    this.connection = null;
    this.startPromise = null;
  }

  on(eventName, callback) {
    if (!this.connection) return;
    this.connection.on(eventName, callback);
  }

  off(eventName, callback) {
    if (!this.connection) return;
    this.connection.off(eventName, callback);
  }
  async invoke(methodName, ...args) {
  if (!this.connection) {
    console.warn("SignalR connection does not exist");
    return;
  }

  if (this.startPromise) {
    await this.startPromise;
  }

  // Chờ thực sự connected (khoảng 5s timeout nếu không thành công)
  const waitConnected = () => new Promise((resolve, reject) => {
    const maxWait = 5000; // 5 giây
    const interval = 50;
    let waited = 0;

    const check = () => {
      if (this.connected) {
        resolve();
      } else {
        waited += interval;
        if (waited >= maxWait) reject(new Error("Timeout waiting for SignalR connected state"));
        else setTimeout(check, interval);
      }
    };
    check();
  });

  try {
    await waitConnected();
  } catch (err) {
    console.error("SignalR not connected, cannot invoke:", err);
    return;
  }

  try {
    await this.connection.invoke(methodName, ...args);
  } catch (error) {
    console.error(`Error invoking ${methodName}:`, error);
  }
}
  
}

const signalRService = new SignalRService();

export default signalRService;
