import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SearchProvider } from "./context/SearchContext";
import { CategoryProvider } from "./context/CategoryContext";
import { LocationProvider } from "./context/LocationContext";
import { VideoProvider } from "./context/VideoContext"; // ✅ thêm dòng này
import AppRoutes from "./routes/AppRoutes";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";

const clientId = "357043917182-o28soqql0fsdqf1gi8c6glff2knnjktc.apps.googleusercontent.com";

function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AuthProvider>
          <SearchProvider>
            <CategoryProvider>
              <LocationProvider>
                <VideoProvider> {/* ✅ Bọc thêm ở đây */}
                  <AppRoutes />

                  {/* ✅ Hot Toast */}
                  <HotToaster position="top-center" reverseOrder={false} toastOptions={{ duration: 2500 }} />

                  {/* ✅ Sonner Toast */}
                  <SonnerToaster position="top-center" richColors reverseOrder={false} /> 

                  {/* ✅ React Toastify */}
                  <ToastContainer />
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
