import React, { useContext, useEffect, useState } from "react";
import { NotificationContext } from "./context/NotificationContext";
import { useNavigate } from "react-router-dom";
import NotificationDetailModal from "./NotificationDetailModal";
import "../../styles/Notifications.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5133";

export default function NotificationsDropdown() {
  const { notifications, unreadCount, loading, markAsRead } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [titles, setTitles] = useState({}); // map postId -> title
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Pre-fetch titles for post notifications (so we can show post title instead of 'Mã')
  useEffect(() => {
    const toFetch = [];
    for (const n of notifications) {
      if (n.url && typeof n.url === 'string' && n.url.startsWith('/posts/')) {
        const id = n.url.split('/posts/')[1];
        if (id && !titles[id]) toFetch.push(id);
      }
    }
    if (toFetch.length === 0) return;
    let mounted = true;
    (async () => {
      const newTitles = {};
      for (const id of Array.from(new Set(toFetch))) {
        try {
          const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/TinDang/get-post/${id}`);
          if (!res.ok) continue;
          const data = await res.json();
          // controller returns full post object or wrapper depending on endpoint
          const post = data && (data.post || data.Post) ? (data.post || data.Post) : data;
          newTitles[id] = post?.TieuDe || post?.tieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || 'Tin đăng';
        } catch (e) {
          // ignore
        }
      }
      if (mounted && Object.keys(newTitles).length) setTitles((s) => ({ ...s, ...newTitles }));
    })();
    return () => { mounted = false; };
  }, [notifications]);

  const openDetail = (n) => {
    if (!n.isRead) markAsRead(n.id);
    setSelected(n);
    setModalOpen(true);
  };

  const handleClick = (n) => {
    // If this is a post notification, show the detail modal first
    if (n.url && typeof n.url === 'string' && n.url.startsWith('/posts/')) {
      openDetail(n);
      return;
    }

    // otherwise, mark read and navigate as before
    if (!n.isRead) markAsRead(n.id);
    if (n.url) {
      let target = n.url;
      try {
        if (typeof target === 'string') {
          if (target.startsWith('/posts/')) {
            const id = target.split('/posts/')[1];
            target = `/tin-dang/${id}`;
          } else if (target.startsWith('/videos/')) {
            const id = target.split('/videos/')[1];
            target = `/video/${id}`;
          }
        }
      } catch (e) { /* fallback */ }
      navigate(target);
    }
  };

  const handleGoToPostFromModal = (n) => {
    if (!n || !n.url) return;
    const id = n.url.split('/posts/')[1];
    setModalOpen(false);
    navigate(`/tin-dang/${id}`);
  };

  return (
    <div className="um-notif-dropdown">
      <div className="um-notif-header">
        <strong>Thông báo</strong>
        <span className="um-notif-count">{unreadCount || 0}</span>
      </div>

      {loading && <div className="um-notif-loading">Đang tải...</div>}

      {!loading && notifications.length === 0 && (
        <div className="um-notif-empty">Chưa có thông báo</div>
      )}

      <ul className="um-notif-list">
        {notifications.map((n) => {
          let displayTitle = n.title;
          if (n.url && typeof n.url === 'string' && n.url.startsWith('/posts/')) {
            const id = n.url.split('/posts/')[1];
            if (titles[id]) displayTitle = `Tin đăng: ${titles[id]}`;
            else displayTitle = `Tin đăng`;
          }
          // For the dropdown list we only show a short summary: strip any 'Chi tiết:' portion
          const rawMessage = (n.message || '').toString();
          const summary = rawMessage.split(/Chi tiết:/i)[0].trim();
          return (
              <li key={n.id} className={`um-notif-item ${n.isRead ? "read" : "unread"}`} onClick={() => handleClick(n)}>
                <div className="um-notif-title">{displayTitle}</div>
                <div className="um-notif-message">{summary}</div>
                <div className="um-notif-time">{new Date(n.createdAt).toLocaleString()}</div>
              </li>
            );
        })}
      </ul>

      <NotificationDetailModal
        open={modalOpen}
        notification={selected}
        postTitle={selected && selected.url && selected.url.startsWith('/posts/') ? titles[selected.url.split('/posts/')[1]] : null}
        onClose={() => setModalOpen(false)}
        onGoToPost={() => handleGoToPostFromModal(selected)}
      />
    </div>
  );
}
