// App.jsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { SearchProvider } from "./context/SearchContext";
import { CategoryProvider } from "./context/CategoryContext";
import { LocationProvider } from "./context/LocationContext";
import { VideoProvider } from "./context/VideoContext";
import AppRoutes from "./routes/AppRoutes";
// --- Toast imports ---
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/CustomToast.css"; // ✅ CSS custom của bạn
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";

const clientId =
  "357043917182-o28soqql0fsdqf1gi8c6glff2knnjktc.apps.googleusercontent.com";

function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AuthProvider>
          <SearchProvider>
            <CategoryProvider>
              <LocationProvider>
                <VideoProvider>
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
                    transition={Slide} // hiệu ứng mượt
                    className="um-toast-container" // ✅ custom container
                  />
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
