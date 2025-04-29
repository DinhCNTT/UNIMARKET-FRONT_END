import { AuthProvider } from "./context/AuthContext"; 
import AppRoutes from "./routes/AppRoutes";
import { BrowserRouter } from "react-router-dom";
import { SearchProvider } from "./context/SearchContext"; // import SearchContext
import { CategoryProvider } from "./context/CategoryContext"; // import CategoryContext

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <CategoryProvider> {/* ✅ Thêm lớp này bọc AppRoutes */}
            <AppRoutes />
          </CategoryProvider>
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
