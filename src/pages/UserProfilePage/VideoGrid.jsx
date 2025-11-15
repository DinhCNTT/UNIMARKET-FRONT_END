import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./VideoGrid.module.css";
import EmptyState from "../../components/Common/EmptyState/EmptyState";
import { CiVideoOff } from "react-icons/ci";

const VideoGrid = ({ videos }) => {
  const [showMoreVideos, setShowMoreVideos] = useState(false);
  const navigate = useNavigate();
  const videoRefs = useRef([]);

  // ✅ Logic hover đã được chuyển vào đây
  const handleVideoHover = (video, shouldPlay) => {
    if (!video) return;

    if (shouldPlay) {
      video.currentTime = 0;
      video.play().catch(() => {});
      setTimeout(() => {
        if (video) video.pause();
      }, 5000);
    } else {
      video.pause();
    }
  };

  // ✅ Logic click đã được chuyển vào đây
  const handleVideoClick = (clickedVideo, videoIndex) => {
    navigate(`/video-search-detail/${clickedVideo.maTinDang}`, {
      state: {
        videoList: videos,
        initialIndex: videoIndex,
        from: "userProfile",
      },
    });
  };

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={<CiVideoOff />}
        title="Chưa có video"
        subtitle="Người dùng này chưa đăng video nào"
      />
    );
  }

  const displayedVideos = showMoreVideos ? videos : videos.slice(0, 10);

  return (
    <div className={styles.tabContent}>
      <div className={styles.gridSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Danh sách video</h3>
          <div className={styles.sectionCount}>{videos.length} video</div>
        </div>

        <div
          className={`${styles.gridContainer} ${
            showMoreVideos ? styles.showAll : ""
          }`}
        >
          <div className={styles.videosGrid}>
            {displayedVideos.map((video, index) => (
              <div
                key={video.maTinDang}
                className={styles.videoCard}
                onClick={() => handleVideoClick(video, index)}
                onMouseEnter={(e) => {
                  const videoElement = e.currentTarget.querySelector("video");
                  handleVideoHover(videoElement, true);
                }}
                onMouseLeave={(e) => {
                  const videoElement = e.currentTarget.querySelector("video");
                  handleVideoHover(videoElement, false);
                }}
              >
                <div className={styles.videoWrapper}>
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={video.videoUrl}
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className={styles.videoPlayer}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoClick(video, index);
                    }}
                  />
                  <div className={styles.videoOverlay}>
                    <div className={styles.videoInfo}>
                      <h4 className={styles.videoTitle} title={video.tieuDe}>
                        {video.tieuDe}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {videos.length > 10 && (
          <div className={styles.showMoreContainer}>
            <button
              className={styles.showMoreBtn}
              onClick={() => setShowMoreVideos(!showMoreVideos)}
            >
              {showMoreVideos ? (
                <>Thu gọn ↑</>
              ) : (
                <>Xem thêm ({videos.length - 10} video) ↓</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGrid;