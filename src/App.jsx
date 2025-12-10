// File: src/App.jsx
import React, { useEffect, useContext } from "react";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

// --- Providers Imports ---
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { SearchProvider } from "./context/SearchContext";
import { CategoryProvider } from "./context/CategoryContext";
import { LocationProvider } from "./context/LocationContext";
import { VideoProvider } from "./context/VideoContext";
import { VideoHubProvider } from "./context/VideoHubContext";
import { GlobalNotificationProvider } from './context/GlobalNotificationContext';
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./components/NotificationsModals/context/NotificationContext";

import AppRoutes from "./routes/AppRoutes";

// --- Toast Imports ---
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/CustomToast.css";
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";

// --- Chat Service ---
import {
  connectToSocialChatHub,
  disconnectFromSocialChatHub,
} from "./services/chatSocialService";

const clientId = "357043917182-o28soqql0fsdqf1gi8c6glff2knnjktc.apps.googleusercontent.com";

/**
 * Component kết nối SignalR Social Chat
 * Chỉ kết nối khi có token (đã đăng nhập)
 */
function SocialChatConnector() {
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (token) {
      // console.log("🔌 Connecting SignalR...");
      connectToSocialChatHub();
    }
    return () => {
      // console.log("❌ Disconnecting SignalR...");
      disconnectFromSocialChatHub();
    };
  }, [token]);

  return null;
}

/**
 * Component chứa các Toasts để App đỡ rối
 */
function AppToasts() {
  return (
    <>
      <HotToaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{ duration: 2500 }}
      />
      <SonnerToaster
        position="top-center"
        richColors
        reverseOrder={false}
      />
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Slide}
        className="um-toast-container"
      />
    </>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        {/* AuthProvider phải bọc ngoài cùng các Context cần user info */}
        <AuthProvider>
          
          {/* GlobalNotification cần lấy user từ Auth, nên nằm trong Auth */}
          <GlobalNotificationProvider>
            
            {/* NotificationProvider (UI) */}
            <NotificationProvider>
              <ThemeProvider>
                
                {/* Các Provider dữ liệu */}
                <SearchProvider>
                  <CategoryProvider>
                    <LocationProvider>
                      <VideoProvider>
                        <VideoHubProvider>
                          
                          {/* Logic kết nối SignalR */}
                          <SocialChatConnector />
                          
                          {/* Routes chính của App */}
                          <AppRoutes />
                          
                          {/* Hệ thống thông báo Toast */}
                          <AppToasts />

                        </VideoHubProvider>
                      </VideoProvider>
                    </LocationProvider>
                  </CategoryProvider>
                </SearchProvider>

              </ThemeProvider>
            </NotificationProvider>
          </GlobalNotificationProvider>
          
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;