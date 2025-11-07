import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import * as signalR from "@microsoft/signalr";
import { AuthContext } from "./AuthContext";

export const VideoHubContext = createContext(null);

export const VideoHubProvider = ({ children }) => {
  const [videoConnection, setVideoConnection] = useState(null);
  const { token } = useContext(AuthContext);
  const connectionRef = useRef(null); // <-- Thay đổi nhỏ: không gán state ban đầu

  useEffect(() => {
    if (token) {
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5133/videoHub", {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .build();

      // ✅ 1. Dùng ref để lưu kết nối ngay lập tức (cho việc cleanup)
      connectionRef.current = newConnection;

      // ✅ 2. GỌI .start() TRƯỚC
      newConnection
        .start()
        .then(() => {
          console.log("✅ SignalR Connected to VideoHub.");
          // ✅ 3. CHỈ SET STATE SAU KHI KẾT NỐI THÀNH CÔNG
          setVideoConnection(newConnection);
        })
        .catch((err) => {
          console.error("SignalR (VideoHub) Connection Error: ", err);
          setVideoConnection(null); // Set null nếu kết nối lỗi
        });

      // 5. Cleanup:
      return () => {
        // ✅ 4. Luôn dùng ref để ngắt kết nối
        // vì state `videoConnection` có thể chưa được set
        if (connectionRef.current) {
          connectionRef.current
            .stop()
            .then(() =>
              console.log("❌ SignalR (VideoHub) Disconnected (Cleanup).")
            );
        }
        setVideoConnection(null); // Đảm bảo dọn dẹp state
      };
    } else {
      // Nếu không có token (logout)
      if (connectionRef.current) {
        connectionRef.current
          .stop()
          .then(() =>
            console.log("❌ SignalR (VideoHub) Disconnected (Logout).")
          );
      }
      connectionRef.current = null; // Xóa ref
      setVideoConnection(null); // Xóa state
    }
  }, [token]); // Chạy lại khi token thay đổi

  return (
    <VideoHubContext.Provider value={{ videoConnection }}>
      {children}
    </VideoHubContext.Provider>
  );
};