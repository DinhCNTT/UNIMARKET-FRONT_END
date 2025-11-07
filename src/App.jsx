// File: src/App.jsx
import React, { useEffect, useContext } from "react";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { SearchProvider } from "./context/SearchContext";
import { CategoryProvider } from "./context/CategoryContext";
import { LocationProvider } from "./context/LocationContext";
import { VideoProvider } from "./context/VideoContext";
import { VideoHubProvider } from "./context/VideoHubContext"; // ✅ Thêm dòng này
import AppRoutes from "./routes/AppRoutes";

// --- Toast imports ---
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

// --- Google Client ID ---
const clientId =
  "357043917182-o28soqql0fsdqf1gi8c6glff2knnjktc.apps.googleusercontent.com";

/**
 * ✅ Component con chứa logic SignalR cho Social Chat
 * Dùng useContext(AuthContext) để theo dõi token đăng nhập
 */
function SocialChatConnector() {
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (token) {
      console.log("🔌 Kết nối SignalR (Social Chat Hub)...");
      connectToSocialChatHub();
    }

    return () => {
      console.log("❌ Ngắt kết nối SignalR (Social Chat Hub)...");
      disconnectFromSocialChatHub();
    };
  }, [token]);

  return null; // Component này chỉ thực thi logic, không render gì
}

/**
 * ✅ App chính — đã kết hợp cả Social Chat Hub và Video Hub
 */
function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AuthProvider>
          <SearchProvider>
            <CategoryProvider>
              <LocationProvider>
                <VideoProvider>
                  {/* ✅ Thêm VideoHubProvider để kết nối VideoHub */}
                  <VideoHubProvider>
                    {/* ✅ Tự động kết nối SignalR khi user đăng nhập (Chat) */}
                    <SocialChatConnector />

                    {/* ✅ Định tuyến chính */}
                    <AppRoutes />

                    {/* ✅ Hot Toast (react-hot-toast) */}
                    <HotToaster
                      position="top-center"
                      reverseOrder={false}
                      toastOptions={{ duration: 2500 }}
                    />

                    {/* ✅ Sonner Toast */}
                    <SonnerToaster
                      position="top-center"
                      richColors
                      reverseOrder={false}
                    />

                    {/* ✅ React Toastify với custom class */}
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
                  </VideoHubProvider>
                </VideoProvider>
              </LocationProvider>
            </CategoryProvider>
          </SearchProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
