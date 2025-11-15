import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Copy, Facebook, Twitter, Send, Link, X } from 'lucide-react';
import './ShareButton.css';
import { useTheme } from '../context/ThemeContext';
const ShareButton = ({ profileUser }) => {
  const { effectiveTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const buttonRef = useRef(null);

  // Tạo URL hiện tại
  const currentUrl = window.location.href;
  const shareTitle = `Trang cá nhân của ${profileUser?.fullName || 'Người dùng'}`;

  // Effect xử lý mở/đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const portalElement = document.getElementById('UserProfile-ShareButton-dropdownPortal');
      if (buttonRef.current && !buttonRef.current.contains(event.target) &&
          portalElement && !portalElement.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback cho old browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Share functions
  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const renderDropdown = () => {
    if (!isOpen) return null;

    const dropdownContent = (
      <div>
        {/* Overlay */}
        <div className="UserProfile-ShareButton-overlay" onClick={() => setIsOpen(false)} />
        
        {/* Dropdown - LUÔN Ở GIỮA MÀN HÌNH */}
        <div 
          id="UserProfile-ShareButton-dropdownPortal" 
          className="UserProfile-ShareButton-dropdown"
          data-theme={effectiveTheme}
        >
          {/* Header */}
          <div className="UserProfile-ShareButton-header">
            <h4 className="UserProfile-ShareButton-title">Chia sẻ trang cá nhân</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="UserProfile-ShareButton-closeBtn"
            >
              <X size={16} />
            </button>
          </div>

          {/* Copy Link Section */}
          <div className="UserProfile-ShareButton-copySection">
            <div className="UserProfile-ShareButton-copyContainer">
              <div className="UserProfile-ShareButton-linkInputWrapper">
                <Link size={16} className="UserProfile-ShareButton-linkIcon" />
                <input 
                  type="text" 
                  value={currentUrl} 
                  readOnly 
                  className="UserProfile-ShareButton-linkInput"
                />
              </div>
              <button
                onClick={copyToClipboard}
                className={`UserProfile-ShareButton-copyBtn ${copySuccess ? 'success' : ''}`}
              >
                <Copy size={14} />
                {copySuccess ? 'Đã copy!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="UserProfile-ShareButton-socialSection">
            <div className="UserProfile-ShareButton-socialLabel">Hoặc chia sẻ qua:</div>
            
            <div className="UserProfile-ShareButton-socialButtons">
              <button onClick={shareToFacebook} className="UserProfile-ShareButton-socialBtn facebook">
                <Facebook size={18} />
                <span>Facebook</span>
              </button>

              <button onClick={shareToTwitter} className="UserProfile-ShareButton-socialBtn twitter">
                <Twitter size={18} />
                <span>Twitter</span>
              </button>

              <button onClick={shareToTelegram} className="UserProfile-ShareButton-socialBtn telegram">
                <Send size={18} />
                <span>Telegram</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(dropdownContent, document.body);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="UserProfile-ShareButton-container">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="UserProfile-ShareButton-mainButton"
        aria-label="Chia sẻ trang"
      >
        <Share2 size={16} />
      </button>

      {renderDropdown()}
    </div>
  );
};

export default ShareButton;