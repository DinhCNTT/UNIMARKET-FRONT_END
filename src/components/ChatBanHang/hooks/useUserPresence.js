// ChatBanHang/hooks/useUserPresence.js
import { useState, useEffect } from "react";
import { connectToChatHub, subscribeToUserStatus, unsubscribeFromUserStatus } from "../../../services/chatService";

export const useUserPresence = (targetUserId, initialStatus = false) => {
  const [isOnline, setIsOnline] = useState(initialStatus);
  const [lastActive, setLastActive] = useState(null);

  useEffect(() => {
    if (!targetUserId) return;
    let isMounted = true;

    const setupRealtime = async () => {
      // Kết nối Global và Lắng nghe
      await connectToChatHub(null, null);
      await subscribeToUserStatus((userId, status) => {
        if (!isMounted) return;
        if (String(userId) === String(targetUserId)) {
          setIsOnline(status);
          if (!status) setLastActive(new Date());
        }
      });
    };

    setupRealtime();
    return () => { isMounted = false; unsubscribeFromUserStatus(); };
  }, [targetUserId]);

  return { isOnline, lastActive };
};