// src/hooks/useVideoFeed.js
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { VideoContext } from '../context/VideoContext';

const API_BASE = "http://localhost:5133";

export const useVideoFeed = () => {
  const [videoList, setVideoList] = useState([]);
  const { loading } = useContext(VideoContext); // Lấy loading từ context
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAllVideos = async () => {
      try {
        let allVideos = [];
        let page = 1;
        const pageSize = 10;
        let hasMore = true;
        
        while (hasMore) {
          const res = await axios.get(
            `${API_BASE}/api/video?page=${page}&pageSize=${pageSize}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }
          );
          const data = res.data;
          if (Array.isArray(data) && data.length > 0) {
            allVideos = [...allVideos, ...data];
            page++;
          } else {
            hasMore = false;
          }
        }
        setVideoList(allVideos);
        console.log(`📋 Loaded ${allVideos.length} videos for tracking`);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách video:", err);
      }
    };
    fetchAllVideos();
  }, [token]); // Thêm token vào dependency array

  return { videoList, setVideoList, loading };
};