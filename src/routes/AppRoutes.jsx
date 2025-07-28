import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminDashboard from "../pages/AdminDashboard";
import AddEmployee from "../components/AddEmployee";
import Sidebar from "../components/Sidebar";
import EmployeeList from "../components/EmployeeList";
import CategoryForm from "../components/CategoryForm";
import MarketPage from "../pages/MarketPage";
import AddParentCategory from "../components/AddParentCategory";
import ManageParentCategories from "../components/ManageParentCategories";
import ManageCategories from "../components/ManageCategories";
import PostForm from "../components/PostForm";
import PostTinDang from "../components/PostTinDang";
import TinDangDanhChoBan from "../components/TinDangDanhChoBan";
import LocTinDang from "../components/LocTinDang";
import QuanLyTin from "../components/QuanLyTin";
import ManagePosts from "../components/ManagePosts";
import CapNhatTin from "../components/CapNhatTin";
import ChiTietTinDang from "../components/ChiTietTinDang";
import TrangChat from "../pages/TrangChat";
import AccountSettings from "../components/AccountSettings/AccountSettings";
import VideoDetailViewer from "../components/VideoDetailViewer";
import VideoSearchPage from "../components/VideoSearchPage";
import VideoSearchDetailViewer from "../components/VideoSearchDetailViewer";
import UserProfilePage from "../pages/UserProfilePage";
import TinDangDaLuu from "../components/TinDangDaLuu";
import VideoLikedPage from "../components/VideoLikedPage";
// Route bảo vệ admin
const AdminRoute = ({ children }) => {
  const { user, role } = useContext(AuthContext);

  if (user === null) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role !== "Admin") {
    return <Navigate to="/" />;
  }

  return (
    <div className="admin-container">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
};

// Route bảo vệ người dùng đã đăng nhập
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Routes công khai */}
      <Route path="/" element={<MarketPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/market" element={<MarketPage />} />
      <Route path="/tin-dang-danh-cho-ban" element={<TinDangDanhChoBan />} />
      <Route path="/loc-tin-dang" element={<LocTinDang />} />

      {/* Bảo vệ trang Admin */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/add-employee" element={<AdminRoute><AddEmployee /></AdminRoute>} />
      <Route path="/admin/employees" element={<AdminRoute><EmployeeList /></AdminRoute>} />
      <Route path="/admin/categories" element={<AdminRoute><CategoryForm /></AdminRoute>} />
      <Route path="/admin/add-parent-category" element={<AdminRoute><AddParentCategory /></AdminRoute>} />
      <Route path="/admin/manage-categories" element={<AdminRoute><ManageParentCategories /></AdminRoute>} />
      <Route path="/admin/manage-subcategories" element={<AdminRoute><ManageCategories /></AdminRoute>} />
      <Route path="/admin/manage-posts" element={<AdminRoute><ManagePosts /></AdminRoute>} />

      {/* Các route khác */}
      <Route path="/post-tin" element={<ProtectedRoute><PostTinDang /></ProtectedRoute>} />
      <Route path="/dang-tin" element={<ProtectedRoute><PostForm /></ProtectedRoute>} />
      <Route path="/quan-ly-tin" element={<ProtectedRoute><QuanLyTin /></ProtectedRoute>} />
      <Route path="/tin-dang-da-luu" element={<ProtectedRoute><TinDangDaLuu /></ProtectedRoute>} />

       {/* Chi tiết tin đăng, có thêm onOpenChat callback để chuyển sang chat */}
      <Route
        path="/tin-dang/:id"
        element={<ChiTietTinDang onOpenChat={(maCuocTroChuyen) => {
          // Chuyển hướng sang trang chat và truyền thêm state để tự động mở chatbox
          window.location.href = `/chat/${maCuocTroChuyen}`;
        }} />}
      />
      <Route path="/cap-nhat-tin/:id" element={<ProtectedRoute><CapNhatTin /></ProtectedRoute>} />
      {/* Route chat realtime */}
      <Route path="/chat" element={<ProtectedRoute><TrangChat /></ProtectedRoute>} />
      <Route path="/chat/:maCuocTroChuyen" element={<ProtectedRoute><TrangChat /></ProtectedRoute>} />

      {/* ✅ Route mới: Cài đặt tài khoản */}
      <Route path="/cai-dat-tai-khoan" element={<AccountSettings />} />

       {/* Route video */}
       <Route path="/video/:maTinDang" element={<VideoDetailViewer />} />
       <Route path="/search/:keyword" element={<VideoSearchPage />} />
       <Route path="/video/:maTinDang" element={<VideoSearchDetailViewer />} />
       <Route path="/video-search-detail/:maTinDang" element={<VideoSearchDetailViewer />} />
       
        {/* Route trang hồ sơ người dùng */}
      <Route path="/nguoi-dung/:userId" element={<UserProfilePage />} />
      <Route path="/video-da-tym" element={<VideoLikedPage />} />

    </Routes>
  );
}

export default AppRoutes;