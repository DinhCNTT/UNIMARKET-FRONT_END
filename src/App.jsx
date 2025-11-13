// File: src/App.jsx 
import React, { useEffect, useContext } from "react";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

// --- Providers ---
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { SearchProvider } from "./context/SearchContext";
import { CategoryProvider } from "./context/CategoryContext";
import { LocationProvider } from "./context/LocationContext";
import { VideoProvider } from "./context/VideoContext";
import { VideoHubProvider } from "./context/VideoHubContext";

// ✅ Thêm ThemeProvider (đúng yêu cầu)
import { ThemeProvider } from "./context/ThemeContext";

import AppRoutes from "./routes/AppRoutes";

// --- Toast imports ---
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/CustomToast.css";
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";

// --- Chat SignalR ---
import {
  connectToSocialChatHub,
  disconnectFromSocialChatHub,
} from "./services/chatSocialService";

const clientId =
  "357043917182-o28soqql0fsdqf1gi8c6glff2knnjktc.apps.googleusercontent.com";

/**
 * Component tự kết nối SignalR Social Chat khi user login
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

  return null;
}

/**
 * App chính — đã tích hợp đầy đủ ThemeProvider + VideoHubProvider + ChatHub
 */
function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AuthProvider>

          {/* ✅ Bọc ThemeProvider (yêu cầu của bạn) */}
          <ThemeProvider>

            <SearchProvider>
              <CategoryProvider>
                <LocationProvider>
                  <VideoProvider>

                    {/* Kết nối VideoHub */}
                    <VideoHubProvider>

                      {/* Kết nối ChatHub */}
                      <SocialChatConnector />

                      {/* Render Route */}
                      <AppRoutes />

                      {/* Hot Toast */}
                      <HotToaster
                        position="top-center"
                        reverseOrder={false}
                        toastOptions={{ duration: 2500 }}
                      />

                      {/* Sonner Toast */}
                      <SonnerToaster
                        position="top-center"
                        richColors
                        reverseOrder={false}
                      />

                      {/* React Toastify */}
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

          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
