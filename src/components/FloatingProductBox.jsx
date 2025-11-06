import React, { useState, useEffect } from "react";
import "./FloatingProductBox.css";


const FloatingProductBox = ({ image, title, price, details, description, onShowPhone, onChat, showPhone, phoneMasked, currentUserId, sellerId }) => {
  const [tab, setTab] = useState('overview');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      const overviewEl = document.getElementById('tong-quan');
      const descEl = document.getElementById('mo-ta-chi-tiet');
      const similarEl = document.getElementById('tin-dang-tuong-tu');
      const scrollY = window.scrollY + 200; // offset để trigger sớm hơn
      let currentTab = 'overview';
      if (overviewEl && scrollY >= overviewEl.offsetTop) {
        currentTab = 'overview';
      }
      if (descEl && scrollY >= descEl.offsetTop) {
        currentTab = 'desc';
      }
      if (similarEl && scrollY >= similarEl.offsetTop) {
        currentTab = 'similar';
      }
      setActiveTab(currentTab);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTab = (type) => {
    setTab(type);
    if(type === 'overview') {
      // Nếu muốn về đầu trang luôn:
      // window.scrollTo({top: 0, behavior: 'smooth'});
      // Nếu muốn về đúng đầu vùng Tổng quan:
      const el = document.getElementById('tong-quan');
      if(el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 155;
        window.scrollTo({top: y, behavior: 'smooth'});
      } else {
        window.scrollTo({top: 0, behavior: 'smooth'});
      }
    }
    if(type === 'desc') {
      const el = document.getElementById('mo-ta-chi-tiet');
      if(el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 155;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
    }
    if(type === 'similar') {
      const el = document.getElementById('tin-dang-tuong-tu');
      if(el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 155;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
    }
  };

  return (
    <div className="floating-product-box">
      <div className="fpb-content">
        <img src={image} alt={title} className="fpb-image" width={48} height={48} />
        <div className="fpb-info">
          <span className="fpb-title">{title}</span>
          <div className="fpb-price-details">
            <span className="fpb-price">
              {typeof price === 'string' 
                ? price.replace(/,/g, '.').replace('VND', 'đ') 
                : price}
            </span>
          </div>
        </div>
        <div className="fpb-actions">
          <button className="fpb-btn fpb-btn-phone" onClick={onShowPhone}>
            {showPhone ? phoneMasked : `Hiện số ${phoneMasked}`}
          </button>
          {currentUserId !== sellerId && (
          <button className="fpb-btn fpb-btn-chat" onClick={onChat}>
            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.0994 11.9996C21.0992 7.25016 17.2483 3.40002 12.4988 3.40002C7.74944 3.40024 3.89938 7.2503 3.89917 11.9996C3.89917 16.7492 7.74931 20.6 12.4988 20.6002C14.0297 20.6002 15.4646 20.2007 16.7078 19.5016L16.7927 19.4586C16.9954 19.3688 17.2234 19.3489 17.4402 19.403L20.9001 20.2672L20.2937 16.0192C20.2673 15.8339 20.2932 15.6445 20.3689 15.4733C20.8379 14.4123 21.0994 13.2377 21.0994 11.9996ZM13.0994 12.1998L13.2009 12.2047C13.7054 12.2557 14.0993 12.682 14.0994 13.1998C14.0994 13.7178 13.7054 14.144 13.2009 14.1949L13.0994 14.1998H8.89917C8.34689 14.1998 7.89917 13.7521 7.89917 13.1998C7.89927 12.6476 8.34695 12.1998 8.89917 12.1998H13.0994ZM16.0994 7.40002L16.2009 7.40491C16.7054 7.45588 17.0994 7.88208 17.0994 8.40002C17.0994 8.91796 16.7054 9.34417 16.2009 9.39514L16.0994 9.40002H8.89917C8.34689 9.40002 7.89917 8.95231 7.89917 8.40002C7.89917 7.84774 8.34689 7.40002 8.89917 7.40002H16.0994ZM23.0994 11.9996C23.0994 13.4158 22.8169 14.7681 22.3113 16.0055L23.0906 21.4576C23.1377 21.7872 23.0175 22.1184 22.7703 22.3414C22.523 22.5643 22.1811 22.6497 21.8582 22.569L17.3289 21.4362C15.8794 22.1794 14.2369 22.6002 12.4988 22.6002C6.64474 22.6 1.89917 17.8537 1.89917 11.9996C1.89938 6.14573 6.64487 1.40024 12.4988 1.40002C18.3529 1.40002 23.0992 6.1456 23.0994 11.9996Z" fill="#222222"></path></svg>
            Chat
          </button>
          )}
        </div>
      </div>
  {/* ...existing code... */}
      <div className="fpb-tabs">
        <div className="fpb-tabs-inner">
          <button className={activeTab==='overview'?"fpb-tab active":"fpb-tab"} onClick={()=>handleTab('overview')}>Tổng quan</button>
          <button className={activeTab==='desc'?"fpb-tab active":"fpb-tab"} onClick={()=>handleTab('desc')}>Mô tả</button>
          <button className={activeTab==='similar'?"fpb-tab active":"fpb-tab"} onClick={()=>handleTab('similar')}>Tin đăng tương tự</button>
        </div>
      </div>
    </div>
  );
};

export default FloatingProductBox;
