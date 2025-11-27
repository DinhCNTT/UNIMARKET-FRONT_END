// src/hooks/useVideoFeed.js
import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import { VideoContext } from '../context/VideoContext';
import { AuthContext } from '../context/AuthContext';

const API_BASE = "http://localhost:5133";
const MAIN_FEED_TABS = ["forYou", "explore"];

export const useVideoFeed = ({ manualMode = false, initialVideo = null } = {}) => {
  
  const [videoList, setVideoList] = useState(() => {
     return initialVideo ? [initialVideo] : [];
  });

  // Mặc định loading true nếu chưa có video
  const [loading, setLoading] = useState(!initialVideo);
  const [hasMore, setHasMore] = useState(true);
  
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);
  const currentFeedModeRef = useRef("forYou");
  const prevRefreshSignalRef = useRef(0);
  const hasInitializedRef = useRef(!!initialVideo);

  const { activeTab, refreshSignal } = useContext(VideoContext); 
  const { token } = useContext(AuthContext) || {}; 

  useEffect(() => {
    if (!manualMode && MAIN_FEED_TABS.includes(activeTab)) {
      currentFeedModeRef.current = activeTab;
    }
  }, [activeTab, manualMode]);

  const resetFeed = useCallback(() => {
    setVideoList([]);
    pageRef.current = 1;
    setHasMore(true);
    isFetchingRef.current = false;
    hasInitializedRef.current = false;
  }, []);

  // =========================================================
  // 1. INIT VIDEO (Sửa lỗi treo loading nếu không có ID)
  // =========================================================
  const initializeWithVideo = useCallback(async (videoOrId) => {
    // Nếu đang fetch dở thì bỏ qua để tránh race condition
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let firstVideo = null;
      let seedId = null;

      // TH1: Có Object Video (từ Router State)
      if (typeof videoOrId === 'object' && videoOrId !== null) {
        firstVideo = videoOrId;
        seedId = firstVideo.maTinDang;
        // 🔥 FIX 1: Set ngay lập tức để UI hiển thị Video 1, không chờ API đề xuất
        setVideoList([firstVideo]); 
      } 
      // TH2: Có ID (từ URL)
      else if (videoOrId) {
        seedId = videoOrId;
        try {
            const seedRes = await axios.get(`${API_BASE}/api/video/detail/${seedId}`, { headers });
            firstVideo = seedRes.data;
            if (firstVideo) setVideoList([firstVideo]); // Set ngay khi có data
        } catch (e) {
            console.error("Lỗi tải video seed:", e);
        }
      }

      // --- TẢI ĐỀ XUẤT NỐI ĐUÔI ---
      // Đảm bảo seedId luôn là số nguyên khi gửi lên server
      const excludeList = seedId ? [parseInt(seedId)] : [];
      
      const recRes = await axios.post(
        `${API_BASE}/api/recommendation/foryou`,
        { excludedIds: excludeList, pageSize: 5 },
        { headers }
      );

      setVideoList(prev => {
         // 🔥 FIX 2: Logic ghép mảng chắc chắn
         // Nếu firstVideo tồn tại (từ state hoặc mới fetch xong)
         const seed = firstVideo || (prev.length > 0 ? prev[0] : null);

         if (seed) {
             // Lọc đề xuất: So sánh String để tránh lỗi Type (10 !== "10")
             const validRecs = recRes.data.filter(v => 
                 String(v.maTinDang) !== String(seed.maTinDang)
             );
             return [seed, ...validRecs];
         }
         
         // Trường hợp xấu nhất: Không có seed, hiển thị luôn đề xuất (Video 2 sẽ thành Video 1)
         return recRes.data;
      });
      
      pageRef.current = 1; 
      setHasMore(true);
      currentFeedModeRef.current = 'forYou'; 
      hasInitializedRef.current = true;

    } catch (err) {
      console.error("❌ Lỗi init video:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [token]);

  // =========================================================
  // 2. FETCH MORE (Scroll xuống)
  // =========================================================
  const fetchVideos = useCallback(async (isLoadMore = false) => {
    if (manualMode && !hasInitializedRef.current && !isLoadMore) return;
    if (isFetchingRef.current) return;
    if (isLoadMore && !hasMore) return;

    isFetchingRef.current = true;
    if (!isLoadMore) setLoading(true);

    try {
      let newVideos = [];
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const feedMode = manualMode ? 'forYou' : currentFeedModeRef.current; 

      if (feedMode === 'forYou') {
        const currentIds = videoList.map(v => v.maTinDang);
        const res = await axios.post(
          `${API_BASE}/api/recommendation/foryou`,
          { excludedIds: currentIds, pageSize: 5 },
          { headers }
        );
        newVideos = res.data;
      } else {
        const res = await axios.get(
          `${API_BASE}/api/video?page=${pageRef.current}&pageSize=10`,
          { headers }
        );
        newVideos = res.data;
      }

      if (Array.isArray(newVideos) && newVideos.length > 0) {
        setVideoList(prev => {
            // Logic APPEND cho Manual Mode hoặc Load More
            if (isLoadMore || (manualMode && prev.length > 0)) {
               const newUnique = newVideos.filter(nv => !prev.some(pv => pv.maTinDang === nv.maTinDang));
               return [...prev, ...newUnique];
            }
            // Logic REPLACE cho trang chủ load mới
            return newVideos;
        });
        if (feedMode !== 'forYou') pageRef.current += 1; 
      } else {
        if (isLoadMore) setHasMore(false); 
      }

    } catch (err) {
      console.error("❌ Lỗi tải video:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [token, videoList, hasMore, manualMode]);

  // =========================================================
  // 3. RELOAD FOR YOU (Chức năng mới cho nút Reload)
  // =========================================================
  const reloadForYou = useCallback(async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      // Reset trang thái
      pageRef.current = 1;
      setHasMore(true);

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // Tải hoàn toàn mới, không loại trừ ID cũ (để làm mới trải nghiệm)
        const res = await axios.post(
            `${API_BASE}/api/recommendation/foryou`,
            { excludedIds: [], pageSize: 5 },
            { headers }
        );
        setVideoList(res.data); // Thay thế hoàn toàn list cũ
      } catch (err) {
          console.error("Lỗi reload for you:", err);
      } finally {
          setLoading(false);
          isFetchingRef.current = false;
      }
  }, [token]);

  // =========================================================
  // 4. AUTO LOAD (Chỉ chạy khi không phải manualMode)
  // =========================================================
  useEffect(() => {
    if (manualMode) return; 

    const isReloadSignal = refreshSignal !== prevRefreshSignalRef.current;
    const isFeedSwitch = MAIN_FEED_TABS.includes(activeTab) && activeTab !== currentFeedModeRef.current;
    
    if (isReloadSignal || isFeedSwitch || (videoList.length === 0 && !loading && hasMore)) {
        if (MAIN_FEED_TABS.includes(activeTab)) {
            currentFeedModeRef.current = activeTab;
        }
        prevRefreshSignalRef.current = refreshSignal;

        if (!isFetchingRef.current) {
            resetFeed();
            fetchVideos(false);
        }
    }
  }, [activeTab, refreshSignal, resetFeed, fetchVideos, videoList.length, loading, hasMore, manualMode]);

  return { 
    videoList, 
    setVideoList, 
    loading, 
    hasMore, 
    fetchMore: () => fetchVideos(true), 
    initializeWithVideo,
    reloadForYou // 🔥 QUAN TRỌNG: Xuất hàm này ra để VideoDetailViewer dùng
  };
};