import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// --- AUTH & CORE PAGES ---
import Login from "../pages/Login";
import Register from "../pages/Register";
import MarketPage from "../pages/MarketPage";
import ErrorBoundary from "../components/ErrorBoundary";

// --- ADMIN PAGES & COMPONENTS ---
import AdminDashboard from "../pages/AdminDashboard";
import Sidebar from "../components/Sidebar";
import AddEmployee from "../components/AddEmployee";
import EmployeeList from "../components/EmployeeList";
import CategoryForm from "../components/CategoryForm";
import AddParentCategory from "../components/AddParentCategory";
import ManageParentCategories from "../components/ManageParentCategories";
import ManageCategories from "../components/ManageCategories";
import ManagePosts from "../components/ManagePosts";
import QuanLyBaoCao from "../pages/Admin/QuanLyBaoCao";

// --- POST & MARKET COMPONENTS ---
import PostForm from "../components/PostForm";
import PostTinDang from "../components/PostTinDang";
import TinDangDanhChoBan from "../components/TinDangDanhChoBan";
import LocTinDang from "../components/LocTinDang/LocTinDang";
import QuanLyTin from "../components/QuanLyTin";
import TinDangDaLuu from "../components/TinDangDaLuu";
import CapNhatTin from "../components/CapNhatTin/CapNhatTin";
import ChiTietTinDang from "../components/ChiTietTinDang";

// --- USER & SETTINGS ---
import AccountSettings from "../components/AccountSettings/AccountSettings";
import UserProfilePage from "../pages/UserProfilePage";
import TrangChat from "../pages/TrangChat";
import ViewHistoryPage from "../pages/ViewHistory/ViewHistoryPage";

// --- VIDEO COMPONENTS ---
import VideoPage from "../pages/VideoPage"; 
import VideoSearchPage from "../components/VideoSearch/VideoSearchPage"; 
import VideoDetailViewer from "../components/VideoDetailViewer"; // Viewer cũ (Giữ nguyên)

import LikedVideoDetailViewer from "../pages/LikedVideoDetailViewer/LikedVideoDetailViewer";

// 🔥 [MỚI] IMPORT TRANG VIDEO STANDALONE
import VideoStandalonePage from "../pages/VideoStandalone/VideoStandalonePage";

// --- ROUTE GUARDS ---
const AdminRoute = ({ children }) => {
  const { user, role } = useContext(AuthContext);

  if (user === null) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role !== "Admin") return <Navigate to="/" />;

  return (
    <div className="admin-container">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  return children;
};

// --- MAIN APP ROUTES ---
function AppRoutes() {
  return (
    <Routes>
      {/* ==============================
          1. PUBLIC & AUTH ROUTES
      ============================== */}
      <Route path="/" element={<MarketPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/market" element={<MarketPage />} />

      {/* ==============================
          2. MARKETPLACE & POSTS
      ============================== */}
      <Route path="/tin-dang-danh-cho-ban" element={<TinDangDanhChoBan />} />
      <Route path="/loc-tin-dang" element={<LocTinDang />} />
      
      <Route
        path="/tin-dang/:id"
        element={
          <ChiTietTinDang 
            onOpenChat={(maCuocTroChuyen) => {
              window.location.href = `/chat/${maCuocTroChuyen}`;
            }} 
          />
        }
      />

      {/* ==============================
          3. USER & PROTECTED ROUTES
      ============================== */}
      <Route path="/post-tin" element={<ProtectedRoute><PostTinDang /></ProtectedRoute>} />
      <Route path="/dang-tin" element={<ProtectedRoute><PostForm /></ProtectedRoute>} />
      <Route path="/quan-ly-tin" element={<ProtectedRoute><QuanLyTin /></ProtectedRoute>} />
      <Route path="/tin-dang-da-luu" element={<ProtectedRoute><TinDangDaLuu /></ProtectedRoute>} />
      <Route path="/cap-nhat-tin/:id" element={<ProtectedRoute><CapNhatTin /></ProtectedRoute>} />
      
      <Route path="/chat" element={<ProtectedRoute><TrangChat /></ProtectedRoute>} />
      <Route path="/chat/:maCuocTroChuyen" element={<ProtectedRoute><TrangChat /></ProtectedRoute>} />

      <Route path="/cai-dat-tai-khoan" element={<AccountSettings />} />
      <Route path="/nguoi-dung/:userId" element={<UserProfilePage />} />
      <Route path="/view-history" element={<ProtectedRoute><ViewHistoryPage /></ProtectedRoute>} />

      {/* ==============================
          4. VIDEO ROUTES
      ============================== */}
      
      <Route
        path="/market/video"
        element={
          <ErrorBoundary>
            <VideoPage />
          </ErrorBoundary>
        }
      />

      <Route path="/search/:keyword" element={<VideoSearchPage />} />

      <Route 
        path="/video-viewer/:maTinDang" 
        element={
          <ErrorBoundary>
            <LikedVideoDetailViewer />
          </ErrorBoundary>
        } 
      />

      <Route path="/liked-videos/:maTinDang" element={<LikedVideoDetailViewer />} />
      <Route path="/video-search-detail/:maTinDang" element={<LikedVideoDetailViewer />} />
      
      {/* ✅ GIỮ NGUYÊN ROUTE CŨ CỦA BẠN (Viewer đơn lẻ mặc định) */}
      <Route path="/video/:id" element={<VideoDetailViewer />} />

      {/* 🔥 [THÊM MỚI] Route này dành riêng cho click từ thông báo */}
      {/* Tên đường dẫn khác đi để không đụng chạm cái cũ */}
      <Route path="/video-standalone/:id" element={<VideoStandalonePage />} />


      {/* ==============================
          5. ADMIN ROUTES
      ============================== */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/add-employee" element={<AdminRoute><AddEmployee /></AdminRoute>} />
      <Route path="/admin/employees" element={<AdminRoute><EmployeeList /></AdminRoute>} />
      <Route path="/admin/categories" element={<AdminRoute><CategoryForm /></AdminRoute>} />
      <Route path="/admin/add-parent-category" element={<AdminRoute><AddParentCategory /></AdminRoute>} />
      <Route path="/admin/manage-categories" element={<AdminRoute><ManageParentCategories /></AdminRoute>} />
      <Route path="/admin/manage-subcategories" element={<AdminRoute><ManageCategories /></AdminRoute>} />
      <Route path="/admin/manage-posts" element={<AdminRoute><ManagePosts /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><QuanLyBaoCao /></AdminRoute>} />

    </Routes>
  );
}

export default AppRoutes;