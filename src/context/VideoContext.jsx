import React, { createContext, useState, useMemo } from "react";

export const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState("forYou");
  const [reloadFlag, setReloadFlag] = useState(false);
  const [loading, setLoading] = useState(false);

  // 👇 thêm state cho âm lượng chung
  const [volume, setVolume] = useState(1); // mặc định max
  const [isMuted, setIsMuted] = useState(false);

  const triggerReload = () => {
    setLoading(true);
    setTimeout(() => {
      setReloadFlag((p) => !p);
      setLoading(false);
    }, 600);
  };

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      reloadFlag,
      triggerReload,
      loading,

      // 👇 thêm vào context
      volume,
      setVolume,
      isMuted,
      setIsMuted,
    }),
    [activeTab, reloadFlag, loading, volume, isMuted]
  );

  return (
    <VideoContext.Provider value={value}>{children}</VideoContext.Provider>
  );
};
