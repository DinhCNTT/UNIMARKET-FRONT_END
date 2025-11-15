import React from "react";
import styles from "./UserProfileCard.module.css";
import ShareButton from "../../components/ShareButton";
import defaultAvatar from "../../assets/default-avatar.png";

const UserProfileCard = ({ userInfo, postCount, videoCount }) => {
  return (
    <div className={styles.profileCard}>
      <div className={styles.avatarWrapper}>
        <img
          src={userInfo.avatarUrl || defaultAvatar}
          alt="Avatar"
          className={styles.avatar}
        />
        <div className={styles.avatarRing}></div>

        {userInfo.daXacMinhEmail ? (
          <div className={`${styles.verification} ${styles.verified}`}>
            <span className={styles.verifyIcon}>✓</span>
            <span>Đã xác minh</span>
          </div>
        ) : (
          <div className={`${styles.verification} ${styles.notVerified}`}>
            <span className={styles.verifyIcon}>!</span>
            <span>Chưa xác minh</span>
          </div>
        )}
      </div>

      <div className={styles.info}>
        <h2 className={styles.username}>{userInfo.fullName}</h2>
        <ShareButton profileUser={userInfo} />

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{postCount}</span>
            <span className={styles.statLabel}>Tin đăng</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{videoCount}</span>
            <span className={styles.statLabel}>Video</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;