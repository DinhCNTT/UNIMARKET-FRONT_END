import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { IoPlay, IoHeart, IoChatbubbleEllipses, IoBookmark, IoShareSocial, IoMusicalNotes } from 'react-icons/io5';
import { FaPlus } from 'react-icons/fa';
import styles from './VideoPlayerSection.module.css';
import VideoOverlayControls from './VideoOverlayControls';
import { useVolume } from '../../../context/VolumeContext';
import SharePanel from "../../../components/SharePanel";

const API_BASE = "http://localhost:5133";

const VideoPlayerSection = ({ 
    videoData, 
    token, 
    currentUser, 
    onUpdateVideo, 
    onOpenComments, 
    isActive,
    onRatioChange 
}) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  // --- STATE UI & LOGIC ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false); 
  const [isHovering, setIsHovering] = useState(false);

  // --- STATE AUDIO / VIDEO CONTROLS ---
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- GLOBAL STATE VOLUME ---
  const { volume, setVolume, isMuted, setIsMuted } = useVolume();

  // --- STATE SOCIAL (Like, Save, Follow...) ---
  const [isLiked, setIsLiked] = useState(videoData?.isLiked || false);
  const [likeCount, setLikeCount] = useState(videoData?.soTym || 0);
  const [isSaved, setIsSaved] = useState(videoData?.isSaved || false);
  const [saveCount, setSaveCount] = useState(videoData?.soNguoiLuu || 0);
  const [isFollowing, setIsFollowing] = useState(false);

  // 🔥 STATE CHO SHARE PANEL
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareCount, setShareCount] = useState(videoData?.soLuotChiaSe || 0);

  // Refs Click
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef(null);
  const iconBaseColor = "#161823"; 

  // 1. SYNC DATA TỪ SERVER
  useEffect(() => {
    if (!videoData) return;
    setIsLiked(videoData.isLiked);
    setLikeCount(videoData.soTym);
    setIsSaved(videoData.isSaved);
    setSaveCount(videoData.soNguoiLuu);
    
    // 🔥 Sync số lượng chia sẻ khi videoData thay đổi
    setShareCount(videoData.soLuotChiaSe || 0);

    setIsLandscape(false);
    setCurrentTime(0);
    setDuration(0);

    if (videoData.nguoiDang?.id && token) {
        axios.get(`${API_BASE}/api/follow/is-following/${videoData.nguoiDang.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setIsFollowing(res.data.isFollowing))
        .catch(() => setIsFollowing(false));
    }
  }, [videoData, token]);

  // 2. VOLUME SYNC
  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.volume = volume;
        videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // 3. LOGIC AUTOPLAY
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.volume = volume;
    videoEl.muted = isMuted;

    if (isActive) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Autoplay prevented, trying mute:", err);
            setIsMuted(true); 
            videoEl.muted = true;
            videoEl.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.error("Still failed:", e));
          });
      }
    } else {
      videoEl.pause();
      videoEl.currentTime = 0; 
      setIsPlaying(false);
      // Khi không active thì đóng share panel luôn nếu đang mở
      setIsShareOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, videoData]);

  // 4. LISTENERS: METADATA, TIME UPDATE
  useEffect(() => {
      const videoEl = videoRef.current;
      if (!videoEl) return;

      const handleMeta = () => {
          setDuration(videoEl.duration);
          const isLand = videoEl.videoWidth >= videoEl.videoHeight;
          setIsLandscape(isLand);
          if (onRatioChange) onRatioChange(isLand);
      };

      const handleTime = () => setCurrentTime(videoEl.currentTime);
      const handleEnded = () => setIsPlaying(false);

      if (videoEl.readyState >= 1) handleMeta();
      
      videoEl.addEventListener('loadedmetadata', handleMeta);
      videoEl.addEventListener('timeupdate', handleTime);
      videoEl.addEventListener('ended', handleEnded);

      return () => {
          videoEl.removeEventListener('loadedmetadata', handleMeta);
          videoEl.removeEventListener('timeupdate', handleTime);
          videoEl.removeEventListener('ended', handleEnded);
      };
  }, [videoData, onRatioChange]);


  // --- HANDLERS CONTROLS ---
  const handleSeek = (e) => {
      e.stopPropagation(); 
      const time = Number(e.target.value);
      if(videoRef.current) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
      }
  };

  const handleVolumeChange = (e) => {
      e.stopPropagation();
      const vol = parseFloat(e.target.value);
      setVolume(vol); 
      setIsMuted(vol === 0);
      if(videoRef.current) {
          videoRef.current.volume = vol;
          videoRef.current.muted = (vol === 0);
      }
  };

  const toggleMute = (e) => {
      if(e) e.stopPropagation();
      const newMute = !isMuted;
      setIsMuted(newMute);
      if(videoRef.current) videoRef.current.muted = newMute;
      if (!newMute && volume === 0) {
          setVolume(0.5);
          if(videoRef.current) videoRef.current.volume = 0.5;
      }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoClick = (e) => {
    e.stopPropagation();
    // Nếu đang mở share panel thì đóng nó lại trước
    if (isShareOpen) {
        setIsShareOpen(false);
        return;
    }

    clickCountRef.current += 1;
    if (clickCountRef.current === 1) {
      clickTimeoutRef.current = setTimeout(() => {
        handleTogglePlay();
        clickCountRef.current = 0;
      }, 250);
    } else if (clickCountRef.current === 2) {
      clearTimeout(clickTimeoutRef.current);
      if (!isLiked) handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      clickCountRef.current = 0;
    }
  };

  // --- SOCIAL ACTIONS ---
  const handleLike = async () => {
    if (!token) return alert("Bạn cần đăng nhập để thả tim!");
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    try {
      const res = await axios.post(`${API_BASE}/api/video/${videoData.maTinDang}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLiked(res.data.isLiked);
      setLikeCount(res.data.soTym);
      if (onUpdateVideo) onUpdateVideo({ isLiked: res.data.isLiked, soTym: res.data.soTym });
    } catch (error) {
      console.error("Lỗi like:", error);
      setIsLiked(!newLikedState); 
      setLikeCount(prev => !newLikedState ? prev + 1 : prev - 1);
    }
  };

  const handleSave = async () => {
    if (!token) return alert("Bạn cần đăng nhập để lưu video!");
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    setSaveCount(prev => newSavedState ? prev + 1 : Math.max(0, prev - 1));
    try {
      const res = await axios.post(`${API_BASE}/api/video/ToggleSave`, 
        { maTinDang: videoData.maTinDang }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setIsSaved(res.data.saved);
      setSaveCount(res.data.totalSaves);
      if (onUpdateVideo) onUpdateVideo({ isSaved: res.data.saved, soNguoiLuu: res.data.totalSaves });
    } catch (error) {
      console.error("Lỗi save:", error);
    }
  };

  const handleFollow = async () => {
    if (!token) return alert("Bạn cần đăng nhập để follow!");
    try {
        const url = `${API_BASE}/api/follow/${isFollowing ? "unfollow" : "follow"}?followingId=${videoData.nguoiDang.id}`;
        await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
        setIsFollowing(!isFollowing);
    } catch (err) {
        console.error(err);
    }
  };

  // 🔥 HANDLE SHARE LOGIC
  const handleOpenShare = (e) => {
    e.stopPropagation(); // Ngăn chặn video bị pause/play khi ấn nút share
    setIsShareOpen(true);
  };

  const handleCloseShare = () => {
    setIsShareOpen(false);
  };

  const handleShareSuccess = () => {
    // Tăng số lượng share cục bộ
    setShareCount(prev => prev + 1);
    // Nếu muốn gọi API cập nhật lại thì gọi ở đây, nhưng tăng UI là đủ nhanh
  };

  if (!videoData) return null;
  const avatarUrl = videoData.nguoiDang?.avatarUrl || "https://via.placeholder.com/150";

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
          <div 
            className={`${styles.videoWrapper} ${isLandscape ? styles.landscapeWrapper : ''}`} 
            onClick={handleVideoClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <video
              ref={videoRef}
              className={styles.videoPlayer}
              src={videoData.videoUrl}
              poster={videoData.hinhAnh}
              loop
              playsInline
              controls={false} 
            />
            
            {!isPlaying && (
              <div className={styles.playIconOverlay}>
                <IoPlay size={70} color="rgba(255,255,255,0.8)" />
              </div>
            )}

            {showHeart && (
               <div className={styles.heartAnimation}>
                 <IoHeart size={100} color="#fe2c55" />
               </div>
            )}

            <VideoOverlayControls 
                videoRef={videoRef}
                duration={duration}
                currentTime={currentTime}
                volume={volume}
                isMuted={isMuted}
                isHovering={isHovering}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                onToggleMute={toggleMute}
            />

            <div className={styles.infoOverlay}>
              <div className={styles.authorRow} onClick={(e) => {e.stopPropagation(); navigate(`/nguoi-dung/${videoData.nguoiDang?.id}`)}}>
                  <span className={styles.authorName}>@{videoData.nguoiDang?.fullName}</span>
              </div>
              <div className={styles.description}>{videoData.moTa}</div>
              <div className={styles.musicRow}>
                 <IoMusicalNotes className={styles.musicIcon} />
                 <div className={styles.musicText}>Nhạc nền - {videoData.nguoiDang?.fullName}</div>
              </div>
            </div>
          </div>

          {/* SIDE ACTIONS */}
          <div className={styles.sideActions}>
              <div className={styles.actionItemAvatar} onClick={() => navigate(`/nguoi-dung/${videoData.nguoiDang?.id}`)}>
                  <div className={styles.avatarContainer}>
                      <img src={avatarUrl} className={styles.avatarImg} alt="avatar" />
                  </div>
                  {!isFollowing && currentUser?.id !== videoData.nguoiDang?.id && (
                      <div className={styles.plusIcon} onClick={(e) => { e.stopPropagation(); handleFollow(); }}>
                          <FaPlus size={10} color="#fff" />
                      </div>
                  )}
              </div>
              
              <div className={styles.actionItem} onClick={handleLike}>
                  <div className={styles.iconCircle}>
                      <IoHeart size={32} color={isLiked ? "#fe2c55" : iconBaseColor} />
                  </div>
                  <span className={styles.actionText}>{likeCount}</span>
              </div>
              
              <div className={styles.actionItem} onClick={onOpenComments}>
                  <div className={styles.iconCircle}>
                      <IoChatbubbleEllipses size={32} color={iconBaseColor} />
                  </div>
                  <span className={styles.actionText}>{videoData.soBinhLuan}</span>
              </div>

              <div className={styles.actionItem} onClick={handleSave}>
                  <div className={styles.iconCircle}>
                      <IoBookmark size={32} color={isSaved ? "#face15" : iconBaseColor} />
                  </div>
                  <span className={styles.actionText}>{saveCount}</span>
              </div>

              {/* 🔥 NÚT SHARE ĐÃ ĐƯỢC CẬP NHẬT */}
              <div className={styles.actionItem} onClick={handleOpenShare}>
                  <div className={styles.iconCircle}>
                      <IoShareSocial size={32} color={iconBaseColor} />
                  </div>
                  <span className={styles.actionText}>{shareCount}</span>
              </div>

              <div className={styles.discAnimation}>
                    <img src={avatarUrl} alt="music-disc" />
              </div>
          </div>
      </div>

      {/* 🔥 RENDER SHARE PANEL TẠI ĐÂY */}
      {/* Nó sẽ hiển thị đè lên video nhờ CSS position fixed/absolute trong SharePanel.css */}
      <SharePanel 
          isOpen={isShareOpen}
          onClose={handleCloseShare}
          tinDangId={videoData.maTinDang}
          displayMode="Video" // Chế độ hiển thị cho video
          previewTitle={videoData.moTa || "Video thú vị từ UniMarket"}
          previewImage={videoData.hinhAnh}
          previewVideo={videoData.videoUrl}
          onShareSuccess={handleShareSuccess}
      />
    </div>
  );
};

export default VideoPlayerSection;