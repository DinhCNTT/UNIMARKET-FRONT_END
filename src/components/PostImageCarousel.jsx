import React, { useState } from "react";
import styles from "./PostImageCarousel.module.css"; // Tạo file CSS riêng
import { getMediaUrl } from "../utils/formatters"; // Import helper

const PostImageCarousel = ({ images = [], onImageClick }) => {
  const [current, setCurrent] = useState(0);
  const validMedia = images?.filter((img) => img)?.slice(0, 8) || [];

  if (!validMedia.length) return <div className={styles.noMedia}>Không có media.</div>;

  const prevMedia = () => setCurrent((prev) => (prev === 0 ? validMedia.length - 1 : prev - 1));
  const nextMedia = () => setCurrent((prev) => (prev === validMedia.length - 1 ? 0 : prev + 1));
  const isVideo = (url) => url.match(/\.(mp4|mov|avi|webm|ogg)$/i);

  const mediaSrc = getMediaUrl(validMedia[current]);
  const isCurrentVideo = isVideo(mediaSrc);

  return (
    <div className={styles.carouselWrapper}>
      <div className={styles.carouselImgbox}>
        {isCurrentVideo ? (
          <video
            src={mediaSrc}
            controls
            className={styles.carouselImg}
            style={{ cursor: "zoom-in" }}
            onClick={() => onImageClick(current)}
          />
        ) : (
          <img
            src={mediaSrc}
            alt={`Media ${current + 1}`}
            className={styles.carouselImg}
            style={{ cursor: "zoom-in" }}
            onClick={() => onImageClick(current)}
          />
        )}
        <div className={styles.carouselIndex}>
          {current + 1} / {validMedia.length}
        </div>
        {validMedia.length > 1 && (
          <>
            <button onClick={prevMedia} className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`}>{'<'}</button>
            <button onClick={nextMedia} className={`${styles.carouselBtn} ${styles.carouselBtnRight}`}>{'>'}</button>
          </>
        )}
      </div>
      {validMedia.length > 1 && (
        <div className={styles.multiImageGallery}>
          {validMedia.map((media, idx) => {
            const thumbSrc = getMediaUrl(media);
            const thumbIsVideo = isVideo(thumbSrc);
            return thumbIsVideo ? (
              <video
                key={idx}
                src={thumbSrc}
                className={styles.carouselThumb}
                onClick={() => setCurrent(idx)}
                style={{ border: current === idx ? "2px solid #f80" : "1px solid #ddd" }}
              />
            ) : (
              <img
                key={idx}
                src={thumbSrc}
                alt={`Thumb ${idx + 1}`}
                className={styles.carouselThumb}
                onClick={() => setCurrent(idx)}
                style={{ border: current === idx ? "2px solid #f80" : "1px solid #ddd" }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PostImageCarousel;