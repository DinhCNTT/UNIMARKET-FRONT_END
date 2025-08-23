import React, { createContext, useState, useMemo } from "react";

export const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState("forYou"); 
  const [reloadFlag, setReloadFlag] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ loading

  const triggerReload = () => {
    setLoading(true); // bật loading
    setTimeout(() => {
      setReloadFlag((p) => !p);
      setLoading(false); // tắt loading sau 600ms
    }, 600);
  };

  const value = useMemo(
    () => ({ activeTab, setActiveTab, reloadFlag, triggerReload, loading }),
    [activeTab, reloadFlag, loading]
  );

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>;
};
