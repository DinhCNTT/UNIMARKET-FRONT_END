import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import axios from 'axios';
import './VideoCarouselMini.css';
import defaultAvatar from '../assets/default-avatar.png'; // ✅ Avatar mặc định

const getCloudinaryThumbnail = (videoUrl) => {
  if (!videoUrl.includes('/upload/')) return '';
  return videoUrl
    .replace('/upload/', '/upload/so_2,q_auto/')
    .replace('.mp4', '.jpg');
};

const VideoListCarouselMini = () => {
  const [videos, setVideos] = useState([]);
  const videoRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get('http://localhost:5133/api/video');
        const data = res.data;
        if (Array.isArray(data)) {
          setVideos(data);
        } else {
          console.warn('API không trả về mảng:', data);
        }
      } catch (err) {
        console.error('Lỗi khi lấy video:', err);
      }
    };
    fetchVideos();
  }, []);

  const handleMouseEnter = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      video.style.opacity = 1;
      video.currentTime = 0;
      video.play();
      setTimeout(() => {
        video.pause();
        video.style.opacity = 0;
      }, 3000);
    }
  };

  const handleMouseLeave = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      video.pause();
      video.style.opacity = 0;
    }
  };

  return (
    <div className="video-carousel-mini-wrapper">
      <div className="video-carousel-mini-container">
        <h2 className="video-carousel-mini-title">
          UNIMARKET <span>Video</span>
        </h2>
        <p className="video-carousel-mini-subtitle">
          Mua bán dễ dàng hơn khi xem Video thực tế
        </p>

        <div className="video-carousel-mini-swiper-wrapper">
          <Swiper
            spaceBetween={15}
            slidesPerView={5}
            modules={[Navigation]}
            navigation={{
              nextEl: '.video-carousel-mini-next',
              prevEl: '.video-carousel-mini-prev',
            }}
          >
            {videos.map((video, index) => (
              <SwiperSlide key={video.maTinDang}>
                <div
                  className="video-carousel-mini-card"
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  onClick={() =>
                    navigate(`/video/${video.maTinDang}?index=${index}`)
                  }
                >
                  <div className="video-carousel-mini-thumbnail">
                    <img
                      src={getCloudinaryThumbnail(video.videoUrl)}
                      alt="thumbnail"
                    />
                    <video
                      ref={(el) => (videoRefs.current[index] = el)}
                      src={video.videoUrl}
                      muted
                      className="video-carousel-mini-hover"
                    />
                  </div>
                  <div className="video-carousel-mini-content">
                    <div className="video-carousel-mini-title-text">
                      {video.tieuDe}
                    </div>
                    <div className="video-carousel-mini-price">
                      {video.gia?.toLocaleString()} đ
                    </div>
                    <div className="video-carousel-mini-location">
                      {video.tinhThanh}
                    </div>
                    <div className="video-carousel-mini-footer">
                      <img
                        src={
                          video.nguoiDang?.avatarUrl
                            ? video.nguoiDang.avatarUrl.startsWith('http')
                              ? video.nguoiDang.avatarUrl
                              : `http://localhost:5133${video.nguoiDang.avatarUrl}`
                            : defaultAvatar
                        }
                        alt="avatar"
                        className="video-carousel-mini-avatar"
                      />
                      <span className="video-carousel-mini-name">
                        {video.nguoiDang?.fullName || 'Người dùng'}
                      </span>
                    </div>
                    <div className="video-carousel-mini-stats">
                      ❤️ {video.soTym} 💬 {video.soBinhLuan}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="video-carousel-mini-prev">‹</div>
          <div className="video-carousel-mini-next">›</div>
        </div>
      </div>
    </div>
  );
};

export default VideoListCarouselMini;
