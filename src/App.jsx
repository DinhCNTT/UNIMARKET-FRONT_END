import { AuthProvider } from "./context/AuthContext"; 
import AppRoutes from "./routes/AppRoutes";
import { BrowserRouter } from "react-router-dom";
import { SearchProvider } from "./context/SearchContext"; 
import { CategoryProvider } from "./context/CategoryContext"; 
import { LocationProvider } from "./context/LocationContext"; // Import LocationProvider mới
import TopNavbar from "./components/TopNavbar"; // Import TopNavbar
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <CategoryProvider>
            <LocationProvider> {/* Thêm LocationProvider bọc AppRoutes */}
               <TopNavbar /> {/* Đây là nơi giữ TopNavbar */}
              <AppRoutes />
            </LocationProvider>
          </CategoryProvider>
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;