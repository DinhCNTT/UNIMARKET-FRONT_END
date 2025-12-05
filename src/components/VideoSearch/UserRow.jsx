import React from "react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../assets/default-avatar.png";
import styles from "./UserRow.module.css";

const UserRow = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div 
      className={styles.userRow} 
      onClick={() => navigate(`/nguoi-dung/${user.id}`)}
    >
      <img
        src={user.avatarUrl?.trim() ? user.avatarUrl : defaultAvatar}
        alt={user.fullName}
        className={styles.avatar}
      />
      <p className={styles.name} title={user.fullName}>
        {user.fullName}
      </p>
    </div>
  );
};

export default UserRow;