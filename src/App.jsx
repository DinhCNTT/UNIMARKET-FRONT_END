import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { BrowserRouter } from "react-router-dom";
import { SearchProvider } from "./context/SearchContext"; 
import { CategoryProvider } from "./context/CategoryContext"; 
import { LocationProvider } from "./context/LocationContext"; 
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster as HotToaster } from "react-hot-toast";   // ✅ đổi tên
import { Toaster as SonnerToaster } from "sonner";         // ✅ đổi tên

const clientId = "357043917182-o28soqql0fsdqf1gi8c6glff2knnjktc.apps.googleusercontent.com"; 

function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AuthProvider>
          <SearchProvider>
            <CategoryProvider>
              <LocationProvider>
                <AppRoutes />
                <HotToaster position="top-center" reverseOrder={false} />
                <SonnerToaster position="top-center" richColors reverseOrder={false} /> 
                <ToastContainer/>
              </LocationProvider>
            </CategoryProvider>
          </SearchProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
