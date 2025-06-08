import { createContext, useState, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => JSON.parse(localStorage.getItem("user")) || null);
  const [role, setRoleState] = useState(() => localStorage.getItem("userRole") || null);
  const [fullName, setFullNameState] = useState(() => localStorage.getItem("userFullName") || "");
  const [email, setEmailState] = useState(() => localStorage.getItem("userEmail") || "");
  const [phoneNumber, setPhoneNumberState] = useState(() => localStorage.getItem("userPhoneNumber") || "");
  const [avatarUrl, setAvatarUrlState] = useState(() => localStorage.getItem("userAvatar") || "");
  const [token, setTokenState] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Cập nhật toàn bộ user (cập nhật state + localStorage + các biến phụ)
  const setUser = (newUser) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("userRole", newUser.role || "");
      localStorage.setItem("userFullName", newUser.fullName || "");
      localStorage.setItem("userEmail", newUser.email || "");
      localStorage.setItem("userPhoneNumber", newUser.phoneNumber || "");
      localStorage.setItem("userAvatar", newUser.avatarUrl || "");
      setRoleState(newUser.role || null);
      setFullNameState(newUser.fullName || "");
      setEmailState(newUser.email || "");
      setPhoneNumberState(newUser.phoneNumber || "");
      setAvatarUrlState(newUser.avatarUrl || "");
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userFullName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userPhoneNumber");
      localStorage.removeItem("userAvatar");
      setRoleState(null);
      setFullNameState("");
      setEmailState("");
      setPhoneNumberState("");
      setAvatarUrlState("");
    }
  };

  // Cập nhật một số thuộc tính user mà không mất toàn bộ (ví dụ cập nhật emailConfirmed)
  const updateUser = (updates) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const updatedUser = { ...prevUser, ...updates };
      setUser(updatedUser); // gọi setUser để lưu state + localStorage
      return updatedUser;
    });
  };

  // Cập nhật token (state + localStorage)
  const setToken = (newToken) => {
    setTokenState(newToken);
    if (newToken) localStorage.setItem("token", newToken);
    else localStorage.removeItem("token");
  };

  // Load user khi mount
  useEffect(() => {
    const storedUser = authService.getUser();
    if (storedUser) {
      setUser(storedUser);
      setToken(localStorage.getItem("token"));
    }
    setLoading(false);
  }, []);

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        fullName,
        email,
        phoneNumber,
        avatarUrl,
        token,
        setUser,
        updateUser,
        setRole: setRoleState,
        setFullName: setFullNameState,
        setEmail: setEmailState,
        setPhoneNumber: setPhoneNumberState,
        setAvatarUrl: setAvatarUrlState,
        setToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
