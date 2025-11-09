// src/hooks/useViewTracking.js
import { useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:5133";

export const useViewTracking = (videoData, currentIndex, videoElsRef, setVideoList) => {
  const viewTrackingRef = useRef({});
  const viewTrackingTimers = useRef({});
  const viewStartTimes = useRef({});
  const hasTracked3Seconds = useRef({});

  // ✅ HÀM TÍNH THỜI GIAN XEM CHÍNH XÁC
  const getCurrentWatchedSeconds = (maTinDang) => {
    const startTime = viewStartTimes.current[maTinDang];
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  };

  // CẬP NHẬT hàm trackView
  const trackView = async (maTinDang, watchedSeconds, isCompleted = false, rewatchCount = 0, skipViewCount = false) => {
    try {
      const token = localStorage.getItem("token");
      const actualWatchedSeconds = Math.max(0, watchedSeconds);
      
      console.log(`🎥 Tracking view for video ${maTinDang}:`, {
        watchedSeconds: actualWatchedSeconds, isCompleted, rewatchCount, skipViewCount, hasToken: !!token
      });

      const requestBody = { maTinDang, watchedSeconds: actualWatchedSeconds, isCompleted, rewatchCount, skipViewCount };
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post(`${API_BASE}/api/video/track-view`, requestBody, { headers });
      
      console.log(`✅ Track response for video ${maTinDang}:`, response.data);
      if (response.data.isNewView) {
        setVideoList(prevList =>
          prevList.map(v =>
            v.maTinDang === maTinDang
              ? { ...v, soLuotXem: response.data.totalViews }
              : v
          )
        );
      }
      return response.data;
    } catch (error) {
      console.error(`❌ Error tracking view for video ${maTinDang}:`, error);
      return null;
    }
  };

  // START VIEW TRACKING
  const startViewTracking = (maTinDang, videoElement) => {
    if (!videoElement || viewTrackingTimers.current[maTinDang]) return;
    console.log(`🎬 Starting view tracking for video ${maTinDang}`);

    viewStartTimes.current[maTinDang] = Date.now();
    hasTracked3Seconds.current[maTinDang] = false;

    viewTrackingTimers.current[maTinDang] = setInterval(() => {
      if (videoElement.paused) return;
      const elapsed = getCurrentWatchedSeconds(maTinDang);
      console.log(`⏱️ Video ${maTinDang} watched for ${elapsed} seconds`);

      viewTrackingRef.current = {
        ...viewTrackingRef.current,
        [maTinDang]: {
          ...(viewTrackingRef.current[maTinDang] ?? {}),
          watchedSeconds: elapsed,
          lastUpdateTime: Date.now()
        }
      };

      if (elapsed >= 3 && !hasTracked3Seconds.current[maTinDang]) {
        hasTracked3Seconds.current[maTinDang] = true;
        trackView(maTinDang, elapsed, false, 0, false);
        console.log(`🎯 First 3-second view tracked for video ${maTinDang}`);
      }
      if (elapsed > 3 && elapsed % 10 === 0) {
        trackView(maTinDang, elapsed, false, 0, true);
      }
    }, 1000);
  };

  // STOP VIEW TRACKING
  const stopViewTracking = (maTinDang) => {
    if (viewTrackingTimers.current[maTinDang]) {
      clearInterval(viewTrackingTimers.current[maTinDang]);
      delete viewTrackingTimers.current[maTinDang];
      
      const finalWatchedSeconds = getCurrentWatchedSeconds(maTinDang);
      
      if (finalWatchedSeconds >= 3) {
        const tracking = viewTrackingRef.current[maTinDang] || {};
        trackView(maTinDang, finalWatchedSeconds, false, tracking.loopCount || 0, true);
        console.log(`🏁 Final view tracking sent for video ${maTinDang}: ${finalWatchedSeconds}s`);
      }
      
      delete viewStartTimes.current[maTinDang];
      delete hasTracked3Seconds.current[maTinDang];
      console.log(`🛑 Stopped view tracking for video ${maTinDang}`);
    }
  };

  // MAIN VIEW TRACKING EFFECT - Khi chuyển video
  useEffect(() => {
    if (!videoData) return;
    const maTinDang = videoData.maTinDang;
    const videoElement = videoElsRef.current[currentIndex];
    if (!videoElement) return;

    console.log(`🔄 Switched to video ${maTinDang} (index: ${currentIndex})`);
    
    viewTrackingRef.current = {
      ...viewTrackingRef.current,
      [maTinDang]: {
        startTime: Date.now(), watchedSeconds: 0, hasTracked3Seconds: false,
        hasCompleted: false, loopCount: 0, hasCountedView: false
      }
    };

    const handlePlay = () => {
      console.log(`▶️ Video ${maTinDang} started playing`);
      startViewTracking(maTinDang, videoElement);
    };

    const handlePause = () => {
      console.log(`⏸️ Video ${maTinDang} paused`);
      const currentWatchedSeconds = getCurrentWatchedSeconds(maTinDang);
      if (currentWatchedSeconds >= 3) {
        const tracking = viewTrackingRef.current[maTinDang] || {};
        trackView(maTinDang, currentWatchedSeconds, false, tracking.loopCount || 0, true);
      }
    };

    // Đã điền logic handleEnded từ file gốc
    const handleEnded = () => {
      console.log(`🏁 Video ${maTinDang} ended (backup - rarely happens with loop)`);

      const currentWatchedSeconds = getCurrentWatchedSeconds(maTinDang);
      const currentTracking = viewTrackingRef.current[maTinDang] || {};
            
      if (!currentTracking.hasCompleted) {
        // ✅ Dùng thời gian thực thay vì state
        trackView(maTinDang, currentWatchedSeconds, true, 0, true);
        
        viewTrackingRef.current = {
          ...viewTrackingRef.current,
          [maTinDang]: {
            ...currentTracking,
            hasCompleted: true
          }
        };
      } else {
        // Nếu đã completed mà vẫn trigger ended -> rewatch
        const newLoopCount = (currentTracking.loopCount || 0) + 1;
        trackView(maTinDang, currentWatchedSeconds, false, newLoopCount, true);
        
        viewTrackingRef.current = {
          ...viewTrackingRef.current,
          [maTinDang]: {
            ...currentTracking,
            loopCount: newLoopCount
          }
        };
      }
    };

    // Đã điền logic handleTimeUpdate từ file gốc
    const handleTimeUpdate = () => {
      const currentTime = videoElement.currentTime;
      const duration = videoElement.duration;

      if (duration > 0) {
        const progress = (currentTime / duration) * 100;
        // ✅ Lấy thời gian thực để backup
        const realTimeWatched = getCurrentWatchedSeconds(maTinDang);
        
        const currentTracking = viewTrackingRef.current[maTinDang] || {};
            
        // LOGIC DETECT REWATCH: currentTime nhảy từ cuối về đầu
        const wasNearEnd = currentTracking.lastProgress && currentTracking.lastProgress > 95;
        const isRestarting = currentTime < 5 && wasNearEnd && currentTracking.hasCompleted;
        
        if (isRestarting) {
          const newLoopCount = (currentTracking.loopCount || 0) + 1;
          console.log(`🔄 LOOP DETECTED! Video ${maTinDang} restarted. Count: ${currentTracking.loopCount || 0} -> ${newLoopCount}`);
          
          // ✅ Gửi track với thời gian thực
          trackView(maTinDang, realTimeWatched, false, newLoopCount, true);
          
          viewTrackingRef.current = {
            ...viewTrackingRef.current,
            [maTinDang]: {
              ...currentTracking,
              loopCount: newLoopCount,
              lastProgress: progress,
              hasCompleted: true
            }
          };
        }
        
        // DETECT COMPLETION lần đầu
        if (progress >= 95 && !currentTracking.hasCompleted) {
          console.log(`✅ Video ${maTinDang} completed for first time at ${progress.toFixed(1)}%`);
          
          // ✅ Track completion với thời gian thực
          trackView(maTinDang, realTimeWatched, true, 0, true);
          
          viewTrackingRef.current = {
            ...viewTrackingRef.current,
            [maTinDang]: {
              ...currentTracking,
              hasCompleted: true,
              lastProgress: progress
            }
          };
        }
        
        // Cập nhật progress bình thường
        viewTrackingRef.current = {
          ...viewTrackingRef.current,
          [maTinDang]: {
            ...(viewTrackingRef.current[maTinDang] || {}), // Đảm bảo currentTracking không bị undefined
            lastProgress: progress,
            // ✅ Backup thời gian thực vào state
            watchedSeconds: realTimeWatched
          }
        };
      }
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    if (!videoElement.paused) {
      handlePlay();
    }

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      stopViewTracking(maTinDang);
    };
  }, [currentIndex, videoData]); // Dependencies được giữ nguyên

  // TRACK VIEW KHI ĐÓNG TRANG
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (videoData) {
        const finalWatchedSeconds = getCurrentWatchedSeconds(videoData.maTinDang);
        if (finalWatchedSeconds >= 3) {
          const tracking = viewTrackingRef.current[videoData.maTinDang] || {};
          const data = JSON.stringify({
            maTinDang: videoData.maTinDang,
            watchedSeconds: finalWatchedSeconds,
            isCompleted: false,
            rewatchCount: tracking.loopCount || 0,
            skipViewCount: true
          });
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon(`${API_BASE}/api/video/track-view`, blob);
          console.log(`📤 Sent final view tracking for video ${videoData.maTinDang} via beacon: ${finalWatchedSeconds}s`);
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [videoData]);

  // Hook này trả về hàm stopViewTracking để parent component (VideoDetailViewer) có thể gọi nó khi điều hướng
  return { stopViewTracking };
};