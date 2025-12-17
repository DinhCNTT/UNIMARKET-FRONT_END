import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './SuggestedAccounts.module.css';
import defaultAvatar from "../../assets/default-avatar.png"; 
import FollowListModal from './FollowListModal'; 
import { IoChevronBack, IoChevronForward, IoChevronForwardOutline } from "react-icons/io5"; 

const SuggestedAccounts = ({ targetUserId }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5133/api/Follow/suggested`, {
          params: { targetUserId: targetUserId },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data) {
          const dataWithStatus = res.data.map(user => ({
            ...user,
            // 🔥 SỬA Ở ĐÂY: Lấy đúng trạng thái từ Backend
            isFollowed: user.isFollowed || false 
          }));
          setSuggestions(dataWithStatus);
        }
      } catch (error) {
        console.error("Lỗi tải đề xuất:", error);
      } finally {
        setLoading(false);
      }
    };

    if (targetUserId) {
      fetchSuggestions();
    }
  }, [targetUserId]);

  const handleFollow = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Cập nhật giao diện ngay lập tức (Optimistic Update)
      setSuggestions(prevList => 
        prevList.map(user => 
          user.id === userId ? { ...user, isFollowed: !user.isFollowed } : user
        )
      );

      // Gọi API Toggle
      await axios.post(
        `http://localhost:5133/api/Follow/toggle`,
        null, 
        {
           params: { targetUserId: userId }, 
           headers: { Authorization: `Bearer ${token}` }
        }
      );

    } catch (error) {
      console.error("Lỗi khi follow:", error);
      // Nếu lỗi thì hoàn tác lại giao diện
      setSuggestions(prevList => 
        prevList.map(user => 
          user.id === userId ? { ...user, isFollowed: !user.isFollowed } : user
        )
      );
    }
  };

  const scroll = (direction) => {
    if (listRef.current) {
      const scrollAmount = 300;
      listRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleNavigateToProfile = (id) => {
      navigate(`/nguoi-dung/${id}`);
  };

  if (loading) return null;
  if (suggestions.length === 0) return null;

  const showArrows = suggestions.length >= 5; 

  return (
    <>
      <div className={styles.suggestContainer}>
        <div className={styles.headerRow}>
          <div className={styles.title}>Gợi ý cho bạn</div>
          
          <button 
            className={styles.seeAllBtn} 
            onClick={() => setShowModal(true)}
          >
            Xem tất cả <IoChevronForwardOutline style={{fontSize: '14px', marginTop:'1px'}} />
          </button>
        </div>

        <div className={styles.listWrapper}>
          {showArrows && (
            <button 
              className={`${styles.navBtn} ${styles.prevBtn}`} 
              onClick={() => scroll('left')}
            >
              <IoChevronBack />
            </button>
          )}

          <div className={styles.list} ref={listRef}>
            {suggestions.map((user) => (
              <div key={user.id} className={styles.card}>
                <img 
                  src={user.avatarUrl || defaultAvatar} 
                  alt={user.fullName} 
                  className={styles.avatar} 
                  onError={(e) => {e.target.src = defaultAvatar}}
                  onClick={() => handleNavigateToProfile(user.id)}
                  style={{ cursor: 'pointer' }}
                />
                
                <h3 
                    className={styles.name}
                    onClick={() => handleNavigateToProfile(user.id)}
                    style={{ cursor: 'pointer' }}
                >
                    {user.fullName}
                </h3>
                
                <p 
                    className={styles.nickname}
                    onClick={() => handleNavigateToProfile(user.id)}
                    style={{ cursor: 'pointer' }}
                >
                    @{user.userName}
                </p>
                
                <button 
                  className={styles.followBtn}
                  onClick={(e) => {
                      e.stopPropagation(); 
                      handleFollow(user.id);
                  }}
                  // Style thay đổi dựa trên isFollowed
                  style={user.isFollowed ? { background: '#E5E5E5', color: '#161823', boxShadow: 'none' } : {}}
                >
                  {user.isFollowed ? 'Đang Follow' : 'Follow'}
                </button>
              </div>
            ))}
          </div>

          {showArrows && (
            <button 
              className={`${styles.navBtn} ${styles.nextBtn}`} 
              onClick={() => scroll('right')}
            >
              <IoChevronForward />
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <FollowListModal 
          userId={targetUserId}
          initialTab="suggested"
          onClose={() => setShowModal(false)}
          currentUserName="Gợi ý"
        />
      )}
    </>
  );
};

export default SuggestedAccounts;