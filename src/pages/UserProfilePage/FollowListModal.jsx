import React, { useState, useEffect } from 'react';
import axios from 'axios';
// 1. Import useNavigate
import { useNavigate } from 'react-router-dom'; 
import styles from './FollowListModal.module.css';
import { IoCloseOutline } from "react-icons/io5";
import defaultAvatar from "../../assets/default-avatar.png"; 

const getMyId = () => {
    return localStorage.getItem('userId'); 
};

const FollowListModal = ({ initialTab = 'following', userId, onClose, currentUserName }) => {
    const [activeTab, setActiveTab] = useState(initialTab); 
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // 2. Khởi tạo navigate
    const navigate = useNavigate(); 
    
    const myId = getMyId(); 

    // --- LOGIC KHÓA CUỘN (GIỮ NGUYÊN) ---
    useEffect(() => {
        const scrollY = window.scrollY;
        const originalStyle = {
            position: document.body.style.position,
            top: document.body.style.top,
            width: document.body.style.width,
            overflowY: document.body.style.overflowY
        };

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflowY = 'hidden'; 

        return () => {
            document.body.style.position = originalStyle.position;
            document.body.style.top = originalStyle.top;
            document.body.style.width = originalStyle.width;
            document.body.style.overflowY = originalStyle.overflowY;
            window.scrollTo(0, scrollY);
        };
    }, []); 
    // ------------------------------------

    const API_URLS = {
        following: `http://localhost:5133/api/Follow/following`,
        followers: `http://localhost:5133/api/Follow/followers`,
        suggested: `http://localhost:5133/api/Follow/suggested`
    };

    const getTargetUserId = (user) => {
        if (activeTab === 'suggested') return user.id;
        if (activeTab === 'following') return user.followingId;
        if (activeTab === 'followers') return user.followerId;  
        return user.id || user.userId;
    };

    // 3. Hàm xử lý khi click vào user
    const handleUserClick = (targetId) => {
        if (!targetId) return;
        
        // Đóng modal trước khi chuyển trang (tùy chọn)
        onClose(); 
        
        // Chuyển hướng đến trang UserProfilePage
        // LƯU Ý: Thay đổi đường dẫn '/nguoi-dung/' khớp với định nghĩa trong App.js của bạn
        navigate(`/nguoi-dung/${targetId}`); 
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;

            setLoading(true);
            try {
                let url = API_URLS[activeTab];
                
                const res = await axios.get(url, {
                    params: { targetUserId: userId }, 
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                
                const mappedUsers = res.data.map(user => ({
                    ...user,
                    isFollowed: user.isFollowed || false 
                }));

                setUsers(mappedUsers);
            } catch (error) {
                console.error("Lỗi tải danh sách:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab, userId]); 

    const handleFollowToggle = async (targetId) => {
        if (!targetId) return;

        setUsers(prevUsers => prevUsers.map(user => {
            const realId = getTargetUserId(user);
            if (realId === targetId) {
                return { ...user, isFollowed: !user.isFollowed };
            }
            return user;
        }));

        try {
            await axios.post(`http://localhost:5133/api/Follow/toggle?targetUserId=${targetId}`, {}, {
                 headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
             
            setUsers(prevUsers => prevUsers.map(user => {
                const realId = getTargetUserId(user);
                if (realId === targetId) {
                    return { ...user, isFollowed: !user.isFollowed }; 
                }
                return user;
            }));
        }
    };

    return (
        <div 
            className={styles.modalOverlay} 
            onClick={onClose}
            onWheel={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
            onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
        >
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                {/* HEADER & TABS */}
                <div className={styles.header}>
                    <span className={styles.username}>{currentUserName || "Người dùng"}</span>
                    <button className={styles.closeBtn} onClick={onClose}><IoCloseOutline /></button>
                </div>

                <div className={styles.tabs}>
                    <div className={`${styles.tabItem} ${activeTab === 'following' ? styles.active : ''}`} onClick={() => setActiveTab('following')}>
                        Đang Follow
                    </div>
                    <div className={`${styles.tabItem} ${activeTab === 'followers' ? styles.active : ''}`} onClick={() => setActiveTab('followers')}>
                        Follower
                    </div>
                    <div className={`${styles.tabItem} ${activeTab === 'suggested' ? styles.active : ''}`} onClick={() => setActiveTab('suggested')}>
                        Được đề xuất
                    </div>
                </div>

                {/* LIST CONTENT */}
                <div className={styles.listContainer}>
                    {loading ? (
                        <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>Đang tải...</div>
                    ) : (
                        users.length > 0 ? users.map((user) => {
                            const realId = getTargetUserId(user); 
                            const isFollowing = user.isFollowed;
                            const isMe = myId && String(realId) === String(myId);

                            return (
                                <div key={realId} className={styles.userItem}>
                                    {/* 4. Thêm onClick vào phần userInfo và style con trỏ chuột */}
                                    <div 
                                        className={styles.userInfo} 
                                        onClick={() => handleUserClick(realId)}
                                        style={{ cursor: 'pointer' }} 
                                    >
                                        <img 
                                            src={user.avatarUrl || defaultAvatar} 
                                            alt="ava" 
                                            className={styles.avatar} 
                                            onError={(e) => {e.target.src = defaultAvatar}} 
                                        />
                                        <div className={styles.textInfo}>
                                            <h4>{user.fullName || "Người dùng"}</h4>
                                            <p>@{user.userName || "user"}</p>
                                            {activeTab === 'suggested' && user.reason && (
                                                <p className={styles.reasonText}>{user.reason}</p>
                                            )}
                                        </div>
                                    </div>

                                    {!isMe && (
                                        <button 
                                            className={`${styles.actionBtn} ${isFollowing ? styles.btnFollowing : styles.btnFollow}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Ngăn chặn việc click nút Follow thì bị nhảy trang
                                                handleFollowToggle(realId);
                                            }}
                                        >
                                            {isFollowing ? "Đang Follow" : "Follow"}
                                        </button>
                                    )}
                                </div>
                            );
                        }) : (
                            <p style={{textAlign:'center', color:'#999', marginTop: 20}}>Trống</p>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowListModal;