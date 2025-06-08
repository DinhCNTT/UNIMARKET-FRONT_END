import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { BrowserRouter } from "react-router-dom";
import { SearchProvider } from "./context/SearchContext"; 
import { CategoryProvider } from "./context/CategoryContext"; 
import { LocationProvider } from "./context/LocationContext"; // Import LocationProvider mới
import TopNavbar from "./components/TopNavbar"; // Import TopNavbar

const clientId = "357043917182-o28soqql0fsdqf1gi8c6glff2knnjktc.apps.googleusercontent.com"; // Thay bằng Client ID Google thật

function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AuthProvider>
          <SearchProvider>
            <CategoryProvider>
              <LocationProvider>
                <AppRoutes />
              </LocationProvider>
            </CategoryProvider>
          </SearchProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
