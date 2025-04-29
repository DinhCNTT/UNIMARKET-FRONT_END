import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "./BannerSlider.css";
import banner1 from "../assets/baner1.jpg";
import banner2 from "../assets/baner2.jpg";

const BannerSlider = () => {
  return (
    <div className="banner-container">
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={50}
        slidesPerView={1}
        navigation
        autoplay={{ delay: 3000 }}
        loop={true}
      >
        <SwiperSlide>
          <img src={banner1} alt="Banner 1" className="banner-image" />
        </SwiperSlide>
        <SwiperSlide>
          <img src={banner2} alt="Banner 2" className="banner-image" />
        </SwiperSlide>
        <SwiperSlide>
          <img src={banner1} alt="Banner 3" className="banner-image" />
        </SwiperSlide>
      </Swiper>
    </div>
  );
};

export default BannerSlider;
