import React from 'react';
import styles from './FooterBanner.module.css'; 
import bannerImg from '../../assets/footer_promo_banner.png';

// Bạn hãy tải 2 ảnh nút bấm này về bỏ vào assets hoặc thay tạm bằng link ảnh online
// Giả sử bạn đã có ảnh trong assets:
// import appStoreImg from '../../assets/app_store_btn.png';
// import googlePlayImg from '../../assets/google_play_btn.png';

// Hoặc dùng link ảnh trực tiếp từ mạng (CDN) để test ngay:
const appStoreUrl = "https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg";
const googlePlayUrl = "https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg";

const FooterBanner = () => {
  return (
    <div className={styles.container}>
      <div className={styles.innerContent}>
        
        {/* --- PHẦN BÊN TRÁI: TEXT + BUTTONS --- */}
        <div className={styles.leftSection}>
            <h2 className={styles.heading}>Mua thì hời, bán thì lời</h2>
            <p className={styles.subText}>Tải app ngay!</p>
            
            <div className={styles.btnGroup}>
                <a href="#" className={styles.storeLink}>
                    <img src={appStoreUrl} alt="Download on App Store" />
                </a>
                <a href="#" className={styles.storeLink}>
                    <img src={googlePlayUrl} alt="Get it on Google Play" />
                </a>
            </div>
        </div>

        {/* --- PHẦN BÊN PHẢI: ẢNH BANNER CŨ --- */}
        <div className={styles.rightSection}>
            <a href="#"> {/* Link bao quanh ảnh nếu muốn bấm vào ảnh cũng tải app */}
                <img 
                    src={bannerImg} 
                    alt="Tải ứng dụng UniMarket ngay" 
                    className={styles.bannerImage} 
                />
            </a>
        </div>

      </div>
    </div>
  );
};

export default FooterBanner;