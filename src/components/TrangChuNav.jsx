import { NavLink, useLocation } from "react-router-dom";
import "./TrangChuNav.css";

const TrangChuNav = ({ onTabChange, activeTab }) => {
  const location = useLocation();
  
  const handleDanhChoBanClick = (e) => {
    e.preventDefault();
    if (onTabChange) {
      onTabChange('danhchoban');
    }
  };

  const handleMoiNhatClick = (e) => {
    e.preventDefault();
    if (onTabChange) {
      onTabChange('moinhat');
    }
  };

  // Xác định tab nào đang active
  const isDanhChoBanActive = () => {
    if (activeTab !== undefined) {
      return activeTab === 'danhchoban';
    }
    return location.pathname === "/market" || 
           location.pathname.includes("tin-dang-danh-cho-ban");
  };

  const isMoiNhatActive = () => {
    if (activeTab !== undefined) {
      return activeTab === 'moinhat';
    }
    return false;
  };

  const tabs = [
    { 
      key: "danhchoban",
      label: "Dành cho bạn", 
      onClick: handleDanhChoBanClick,
      isActive: isDanhChoBanActive()
    },
    { 
      key: "moinhat",
      label: "Mới nhất", 
      onClick: handleMoiNhatClick,
      isActive: isMoiNhatActive()
    },
    { 
      path: "/market/video", 
      label: "Video" 
    },
  ];

  return (
    <div className="TrangChuNav">
      {tabs.map((tab) => {
        if (tab.onClick) {
          // Các tab không chuyển URL - chỉ thay đổi state
          return (
            <button
              key={tab.key}
              onClick={tab.onClick}
              className={`TrangChuNav__tab ${
                tab.isActive ? "TrangChuNav__tab--active" : ""
              }`}
            >
              {tab.label}
            </button>
          );
        } else {
          // Tab Video - chuyển URL bình thường
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `TrangChuNav__tab ${isActive ? "TrangChuNav__tab--active" : ""}`
              }
            >
              {tab.label}
            </NavLink>
          );
        }
      })}
    </div>
  );
};

export default TrangChuNav;