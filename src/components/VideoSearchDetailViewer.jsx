import React, { useEffect, useState, useContext, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaHeart, FaPlay, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import axios from "axios";
import { toast } from 'react-hot-toast';
import defaultAvatar from "../assets/default-avatar.png";
import { AuthContext } from '../context/AuthContext';
import styles from "../pages/LikedVideoDetailViewer/LikedVideoDetailViewer.module.css";
import commentStyles from "./CommentSection/CommentSection.module.css";
// inline popup — removed PortalMenu usage
export default function VideoSearchDetailViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { maTinDang } = useParams();
  
  // ✅ Kiểm tra state truyền từ UserProfilePage hoặc VideoSearchPage
  const { videoList: passedVideoList, videos: passedVideos, initialIndex = 0 } = location.state || {};
  const safeVideoList = passedVideoList || passedVideos || [];
  
  const [videoList, setVideoList] = useState(safeVideoList);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showHeartEffect, setShowHeartEffect] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [soTym, setSoTym] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInteracted, setIsInteracted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState({});
  const [totalCommentCount, setTotalCommentCount] = useState(0);
  const [hideUserInfo, setHideUserInfo] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);
  const [replyContentMap, setReplyContentMap] = useState({});
  const [activeReplyMap, setActiveReplyMap] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  // Start at 50% volume by default (avoid auto-muting on open)
  const [volume, setVolume] = useState(0.5);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [expandedRepliesMap, setExpandedRepliesMap] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Refs
  const volumeSliderTimeoutRef = useRef(null);
  const playerRef = useRef(null);
  const bgPlayerRef = useRef(null);
  const audioRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const currentIndexRef = useRef(initialIndex);
  const iconCircleRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastFetchTimeRef = useRef(Date.now());
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);
  const scrollStopTimer = useRef(null);
  const lastHideStateRef = useRef(hideUserInfo);
  const replyTextareaRef = useRef(null);
  const mainCommentRef = useRef(null);
  const hideVolumeTimeoutRef = useRef(null);
  const savedVolumeRef = useRef(0.5);

  // Keep actual media elements (video/audio) in sync with React state
  // ✅ Current video with error handling (moved up so dependencies are initialized)
  const video = videoList && videoList.length > 0 && currentIndex >= 0 && currentIndex < videoList.length 
    ? videoList[currentIndex] 
    : null;
  const videoUrl = video?.videoUrl;

  useEffect(() => {
    // Close menu when clicking outside any popup or menu button
    if (!activeMenuCommentId) return;
    const onDocDown = (e) => {
      const target = e.target;
      if (target.closest && (target.closest('.popup-menu') || target.closest('.menu-btn'))) return;
      setActiveMenuCommentId(null);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [activeMenuCommentId]);
  useEffect(() => {
    if (playerRef.current) {
      try {
        playerRef.current.volume = volume;
        playerRef.current.muted = isMuted;
      } catch (e) {
        // ignore if not ready
      }
    }
    if (bgPlayerRef.current) {
      try {
        // background blur should remain muted always
        bgPlayerRef.current.muted = true;
      } catch (e) {}
    }
    if (audioRef.current) {
      try {
        audioRef.current.volume = volume;
        audioRef.current.muted = isMuted;
      } catch (e) {}
    }
  }, [volume, isMuted, videoUrl]);
  
  // Context
  const { user } = useContext(AuthContext) || {};
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  // ✅ Nếu không có videoList từ state, fetch video đơn lẻ từ API
  useEffect(() => {
    const fetchSingleVideo = async () => {
      if (safeVideoList.length > 0) return; // Đã có video list từ state
      
      if (!maTinDang) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5133/api/video/${maTinDang}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (response.data) {
          setVideoList([response.data]);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error('Lỗi khi fetch video:', error);
        toast.error('Không thể tải video');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchSingleVideo();
  }, [maTinDang, token, navigate, safeVideoList.length]);

  // ✅ Current video với error handling (declaration moved above)

  // ✅ Ẩn mô tả video khi cuộn comment xuống, giống TikTok
  useEffect(() => {
    const handleScroll = () => {
      const el = scrollRef.current;
      if (!el) return;
      // Ignore programmatic scrolls initiated by our reply-open logic
      if (el.dataset && el.dataset.programmaticScroll === '1') return;
      const scrollY = el.scrollTop;
      setHideUserInfo(scrollY > 60);
    };
    
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // ✅ Cuộn mượt comment section khi mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // ✅ Fetch video like state and comments when video changes
  useEffect(() => {
    if (!video?.maTinDang) return;
    
    // Fetch like state
    axios.get(`http://localhost:5133/api/video/${video.maTinDang}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(res => {
      const updatedVideo = res.data;
      setIsLiked(updatedVideo.isLiked || false);
      setSoTym(updatedVideo.soTym || 0);

      // Cập nhật videoList để có moTa, tieuDe, ...
      setVideoList(prev =>
        prev.map((v, i) => i === currentIndex ? { ...v, ...updatedVideo } : v)
      );
    }).catch(err => console.error('Lỗi khi fetch video info:', err));
    
    // Fetch comments
    fetchComments();
  }, [video?.maTinDang, token, currentIndex]);

  // ✅ Count total comments (including replies)
  useEffect(() => {
    const countAll = (list) => list.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
    setTotalCommentCount(countAll(comments));
  }, [comments]);

  // ✅ Fetch comments
  const fetchComments = useCallback(() => {
    if (!video?.maTinDang) return;
    axios.get(`http://localhost:5133/api/video/${video.maTinDang}/comments`)
      .then(res => setComments(res.data || []))
      .catch(err => console.error('Lỗi khi fetch comments:', err));
  }, [video?.maTinDang]);

  // ✅ Handle like
  const handleLike = async () => {
    if (!token) {
      toast.error("Bạn cần đăng nhập để tym video.");
      return;
    }
    
    if (!video?.maTinDang) return;
    
    try {
      const res = await axios.post(`http://localhost:5133/api/Video/${video.maTinDang}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsLiked(res.data.isLiked);
      setSoTym(res.data.soTym);
      setShowHeartEffect(true);
      setTimeout(() => setShowHeartEffect(false), 600);
    } catch (err) {
      console.error('Lỗi khi tym video:', err);
      toast.error("Lỗi khi tym video");
    }
  };

  // ✅ Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }

    const confirmed = await new Promise((resolve) => {
      toast((t) => (
        <div style={{ fontSize: "14px", color: "#374151" }}>
          <div style={{ fontWeight: "600", marginBottom: "8px" }}>
            🗑️ Xác nhận xoá bình luận
          </div>
          <div style={{ marginBottom: "12px", fontSize: "13px" }}>
            Bạn có chắc chắn muốn xoá bình luận này không? Hành động này không thể hoàn tác.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              style={{
                padding: "6px 12px",
                background: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              style={{
                padding: "6px 12px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Xoá
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        position: "top-right",
        style: {
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
          maxWidth: "340px",
        },
      });
    });

    if (!confirmed) return;

    // ✅ Check token trước delete
    if (!token) {
      toast.error("Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.", {
        style: {
          background: "#ef4444",
          color: "#fff",
        },
      });
      return;
    }

    const loadingToast = toast.loading("Đang xoá bình luận...");

    try {
      await axios.delete(`http://localhost:5133/api/video/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const removeFromList = (list) =>
        list.filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies ? removeFromList(c.replies) : [],
          }));

      setComments((prev) => removeFromList(prev));
      setActiveMenuCommentId(null);

      toast.dismiss(loadingToast);
      toast.success("Đã xoá bình luận thành công! ✅", {
        style: {
          background: "#10b981",
          color: "#fff",
        },
      });
    } catch (err) {
      toast.dismiss(loadingToast);
      
      // ✅ Show chi tiết lỗi
      if (err.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.", {
          style: {
            background: "#ef4444",
            color: "#fff",
          },
        });
      } else if (err.response?.status === 403) {
        toast.error("Bạn không có quyền xoá bình luận này!", {
          style: {
            background: "#ef4444",
            color: "#fff",
          },
        });
      } else {
        toast.error("Lỗi khi xoá bình luận!", {
          style: {
            background: "#ef4444",
            color: "#fff",
          },
        });
      }
      fetchComments();
    }
  };

  // ✅ Handle submit comment
  const submitComment = async () => {
    if (!token || !newComment.trim() || !video?.maTinDang) {
      if (!token) {
        toast.error("Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.");
      }
      return;
    }
    
    try {
      await axios.post(
        `http://localhost:5133/api/video/${video.maTinDang}/comment`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment("");
      fetchComments();
      toast.success("Bình luận thành công! ✅");
    } catch (err) {
      console.error('Lỗi khi gửi bình luận:', err);
      
      if (err.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.");
      } else if (err.response?.status === 400) {
        toast.error("Bình luận không được để trống!");
      } else {
        toast.error("Lỗi khi gửi bình luận");
      }
    }
  };

  // ✅ Toggle hiển thị ô nhập reply cho từng comment
  const toggleChildReplyInput = (commentId) => {
    // Toggle state and scroll into view when opening
    setActiveReplyMap((prev) => {
      const opening = !prev[commentId];
      const next = { ...prev, [commentId]: !prev[commentId] };
      if (opening) {
        // wait a tick so DOM renders the reply node
        setTimeout(() => {
            const el = document.getElementById(`reply-${commentId}`);
            const parent = scrollRef.current;
            if (el && parent) {
              // Smooth scroll using manual animation (easeOutQuad) + immediate focus when done
              const elRect = el.getBoundingClientRect();
              const parentRect = parent.getBoundingClientRect();
              const offset = elRect.top - parentRect.top + parent.scrollTop;
              const paddingAbove = 140;
              const target = Math.max(0, offset - paddingAbove);
              const start = parent.scrollTop;
              const diff = target - start;
              const duration = 350; // ms
              const startTime = Date.now();

              try { parent.dataset.programmaticScroll = '1'; } catch (e) {}

              const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / duration);
                // easeOutQuad: 1 - (1 - t)^2
                const eased = 1 - Math.pow(1 - progress, 2);
                parent.scrollTop = start + diff * eased;

                if (progress < 1) {
                  requestAnimationFrame(animate);
                } else {
                  // Scroll finished, now focus and resize
                  try {
                    const ta = el.querySelector('textarea');
                    if (ta) {
                      try { ta.focus({ preventScroll: true }); } catch (e) {}
                      ta.style.height = 'auto';
                      ta.style.height = ta.scrollHeight + 'px';
                    }
                  } catch (e) {}
                  try { delete parent.dataset.programmaticScroll; } catch (e) {}
                }
              };
              animate();
            } else if (el) {
              // fallback if no parent
              el.scrollIntoView({ behavior: 'auto', block: 'nearest' });
              const ta = el.querySelector('textarea');
              if (ta) {
                try { ta.focus({ preventScroll: true }); } catch (e) {}
                ta.style.height = 'auto';
                ta.style.height = ta.scrollHeight + 'px';
              }
            }
          }, 80);
      }
      return next;
    });
  };

  // ✅ Gửi reply cho comment
  const handleReplySubmit = useCallback(async (parentCommentId, replyContent) => {
    if (!token || !replyContent?.trim() || !video?.maTinDang) return;
    
    // Optimistic UI
    const optimisticReply = {
      id: `temp-${Date.now()}`,
      content: replyContent,
      userName: user?.fullName || user?.userName || "Bạn",
      userId: currentUserId,
      avatarUrl: user?.avatarUrl,
      createdAt: new Date().toISOString(),
      parentCommentId,
      replies: [],
      isOptimistic: true
    };
    
    setComments((prev) => prev.map(c =>
      c.id === parentCommentId
        ? { ...c, replies: [...(c.replies || []), optimisticReply] }
        : c
    ));
    
    setReplyContentMap((prev) => ({ ...prev, [parentCommentId]: "" }));
    setActiveReplyMap((prev) => ({ ...prev, [parentCommentId]: false }));
    
    try {
      await axios.post(
        `http://localhost:5133/api/video/${video.maTinDang}/comment`,
        { content: replyContent, parentCommentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchComments();
    } catch (err) {
      console.error('Lỗi khi gửi phản hồi:', err);
      toast.error("Lỗi khi gửi phản hồi");
      fetchComments();
    }
  }, [token, video?.maTinDang, currentUserId, user?.fullName, user?.userName, user?.avatarUrl, fetchComments]);

  // ✅ Hàm làm phẳng replies
  const flattenReplies = (replies, parentUser) => {
    let flat = [];
    for (const r of replies || []) {
      flat.push({
        ...r,
        replyTo: parentUser
      });
      if (r.replies?.length) {
        flat = flat.concat(flattenReplies(r.replies, r.userName));
      }
    }
    return flat;
  };

  // ✅ Render comments cha và replies phẳng (memoized to prevent unnecessary re-renders)
  const renderCommentsFlat = useMemo(() => {
    return (commentList) => {
      // Show all comments (no pagination)
      return (
        <>
          {commentList.map((comment) => {
            const isMenuOpen = activeMenuCommentId === comment.id;
            const hasReplies = comment.replies?.length > 0;
            const flatReplies = flattenReplies(comment.replies, comment.userName);
            const isExpanded = expandedRepliesMap[comment.id];
            const showReplies = flatReplies.length > 1 && !isExpanded ? flatReplies.slice(0, 1) : flatReplies;
      
      return (
        <div key={comment.id} className="comment-item" style={{ marginLeft: 0 }}>
          <div className="comment-wrapper">
            <div className="comment-user-header">
              <img src={comment.avatarUrl || defaultAvatar} className="avatar" alt="user" />
              <div className="comment-main">
                <div className="comment-header">
                  <strong className="username">{comment.userName}</strong>
                  {comment.userId === currentUserId && (
                    <div className="menu-wrapper-parent" style={{ position: 'absolute', right: '20px', left: '388px',top: '15px' }}>
                      <button
                        id={`menu-btn-${comment.id}`}
                        className="menu-btn"
                        onClick={() => setActiveMenuCommentId((prevId) => prevId === comment.id ? null : comment.id)}
                      >⋯</button>
                      {activeMenuCommentId === comment.id && (
                        <div className="popup-menu" style={{ top: '36px', right: 0 }}>
                          <button className="delete-btn" onClick={() => { handleDeleteComment(comment.id); setActiveMenuCommentId(null); }}>Xoá</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="comment-content">{comment.content}</div>
                <div className="comment-meta">
                  <span className="time">{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString("vi-VN") : ""}</span>
                  <button className="reply-toggle-btn" onClick={() => toggleChildReplyInput(comment.id)}>Trả lời</button>
                </div>
                {/* Ô nhập trả lời */}
                {activeReplyMap[comment.id] && (
                  <div id={`reply-${comment.id}`} className="reply-input-inline">
                    <div className="reply-input-wrapper">
                      <textarea
                        value={replyContentMap[comment.id] || ""}
                        onChange={(e) => {
                          const text = e.target.value;
                          if (text.length <= 150) {
                            setReplyContentMap((prev) => ({ ...prev, [comment.id]: text }));
                          }
                        }}
                        placeholder="Trả lời..."
                        className="reply-input textarea"
                        rows={1}
                        ref={(el) => {
                          if (el) {
                            // delay resize to avoid reflow during scroll/focus
                                setTimeout(() => {
                              el.style.height = "auto";
                              el.style.height = el.scrollHeight + "px";
                            }, 700);
                          }
                        }}
                      />
                      <div className="reply-footer">
                        <div className="reply-actions">
                          <button
                            onClick={() => handleReplySubmit(comment.id, replyContentMap[comment.id])}
                            className="reply-submit-btn"
                            disabled={!replyContentMap[comment.id]?.trim()}
                          >Gửi</button>
                          <button
                            className="reply-cancel-btn"
                            onClick={() => {
                              setReplyContentMap((prev) => ({ ...prev, [comment.id]: "" }));
                              setActiveReplyMap((prev) => ({ ...prev, [comment.id]: false }));
                            }}
                          >X</button>
                        </div>
                      </div>
                    </div>
                    {replyContentMap[comment.id]?.length >= 30 && (
                      <div className="char-count">{replyContentMap[comment.id].length}/150</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Replies phẳng với xem thêm/thu gọn */}
            {hasReplies && (
            <div className="replies">
              {showReplies.map((reply) => {
                const isReplyMenuOpen = activeMenuCommentId === reply.id;
                return (
                  <div
                    key={reply.id}
                    className="comment-item"
                    style={{ marginLeft: "1px" }}
                  >
                    <div className={styles.commentWrapper} style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                      <img src={reply.avatarUrl || defaultAvatar} className="avatar" alt="user" style={{ marginRight: 8 }} />
                      <div className="comment-main" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong className="username">{reply.userName}</strong>
                          {reply.replyTo && (
                            <span className="reply-to" style={{ color: '#888', fontSize: 13, marginLeft: 4 }}>trả lời {reply.replyTo}</span>
                          )}
                          {reply.userId === currentUserId && (
                            <div className="menu-wrapper-child" style={{ position: 'absolute', right: '20px', left: '340px', top: '15px' }}>
                              <button
                                id={`menu-btn-${reply.id}`}
                                className="menu-btn"
                                onClick={() => setActiveMenuCommentId((prevId) => prevId === reply.id ? null : reply.id)}
                              >⋯</button>
                              {isReplyMenuOpen && (
                                <div className="popup-menu" style={{ top: '36px', right: 0 }}>
                                  <button className="delete-btn" onClick={() => { handleDeleteComment(reply.id); setActiveMenuCommentId(null); }}>Xoá</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="comment-content">{reply.content}</div>
                        <div className="comment-meta">
                          <span className="time">{reply.createdAt ? new Date(reply.createdAt).toLocaleDateString("vi-VN") : ""}</span>
                          <button className="reply-toggle-btn" onClick={() => toggleChildReplyInput(reply.id)}>Trả lời</button>
                        </div>
                        {/* Ô nhập trả lời cho reply */}
                        {activeReplyMap[reply.id] && (
                          <div id={`reply-${reply.id}`} className={styles.replyInputInline}>
                            <div className={styles.replyInputWrapper}>
                              <textarea
                                value={replyContentMap[reply.id] || ""}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  if (text.length <= 150) {
                                    setReplyContentMap((prev) => ({ ...prev, [reply.id]: text }));
                                  }
                                }}
                                placeholder="Trả lời..."
                                className={styles.replyInput}
                                rows={1}
                                ref={(el) => {
                                  if (el) {
                                    // delay resize to avoid reflow during scroll/focus
                                    setTimeout(() => {
                                      el.style.height = "auto";
                                      el.style.height = el.scrollHeight + "px";
                                    }, 700);
                                  }
                                }}
                              />
                              <div className={styles.replyFooter}>
                                <div className={styles.replyActions}>
                                  <button
                                    onClick={() => handleReplySubmit(reply.id, replyContentMap[reply.id])}
                                    className={styles.replySubmitBtn}
                                    disabled={!replyContentMap[reply.id]?.trim()}
                                  >Gửi</button>
                                  <button
                                    className={styles.replyCancelBtn}
                                    onClick={() => {
                                      setReplyContentMap((prev) => ({ ...prev, [reply.id]: "" }));
                                      setActiveReplyMap((prev) => ({ ...prev, [reply.id]: false }));
                                    }}
                                  >X</button>
                                </div>
                              </div>
                            </div>
                            {replyContentMap[reply.id]?.length >= 30 && (
                              <div className={styles.charCount}>{replyContentMap[reply.id].length}/150</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Nút xem thêm/thu gọn nếu có nhiều hơn 1 reply */}
              {flatReplies.length > 1 && (
                <button
                  className={styles.repliesToggleBtn}
                  style={{ marginLeft: -10, marginTop: 4, color: '#ffffffff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '2px 8px', width: 'auto'}}
                  onClick={() => setExpandedRepliesMap(prev => ({ ...prev, [comment.id]: !isExpanded }))}
                >
                  {isExpanded ? `Thu gọn (${flatReplies.length})` : `Xem thêm ${flatReplies.length - 1} phản hồi`}
                </button>
              )}
            </div>
            )}
          </div>
        </div>
      );
        })}
      </>
    );
    };
  }, [activeMenuCommentId, expandedRepliesMap, replyContentMap, activeReplyMap, currentUserId]);

  // ✅ Chuyển video khi lăn chuột trên video (chỉ trong videoList)
  useEffect(() => {
    const handleWheel = (e) => {
      if (!videoList || videoList.length <= 1) return;
      const videoArea = playerRef.current;
      if (!videoArea) return;
      const rect = videoArea.getBoundingClientRect();
      const x = e.clientX, y = e.clientY;
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        if (Math.abs(e.deltaY) > 60) {
          if (e.deltaY > 0 && currentIndex < videoList.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else if (e.deltaY < 0 && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
          }
        }
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [currentIndex, videoList]);

  // ✅ Video click handling
  let clickTimeout = null;
  let clickCount = 0;
  const handleVideoClick = () => {
    clickCount++;
    if (clickCount === 1) {
      clickTimeout = setTimeout(() => {
        // Single click: toggle play/pause
        if (playerRef.current) {
          if (playerRef.current.paused) {
            playerRef.current.play();
          } else {
            playerRef.current.pause();
          }
        }
        clickCount = 0;
      }, 250);
    } else if (clickCount === 2) {
      clearTimeout(clickTimeout);
      // Double click: only like, never unlike
      if (!isLiked) {
        handleLike();
      }
      setShowHeartEffect(true);
      setTimeout(() => setShowHeartEffect(false), 600);
      clickCount = 0;
    }
  };

  // ✅ Volume handling
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (newVolume > 0) savedVolumeRef.current = newVolume;
    if (playerRef.current) {
      playerRef.current.volume = newVolume;
      playerRef.current.muted = newVolume === 0;
    }
  };

  const handleToggleMute = (e) => {
    e.stopPropagation();
    // If currently muted or volume is 0 => unmute (restore saved volume)
    if (isMuted || volume === 0) {
      const restore = savedVolumeRef.current || 1;
      setVolume(restore);
      setIsMuted(false);
      if (playerRef.current) {
        playerRef.current.volume = restore;
        playerRef.current.muted = false;
      }
      setShowVolumeSlider(true);
      if (hideVolumeTimeoutRef.current) clearTimeout(hideVolumeTimeoutRef.current);
      hideVolumeTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 4000);
      return;
    }

    // Muting: remember current volume then set to 0
    savedVolumeRef.current = volume || savedVolumeRef.current || 1;
    setVolume(0);
    setIsMuted(true);
    if (playerRef.current) {
      playerRef.current.volume = 0;
      playerRef.current.muted = true;
    }
    setShowVolumeSlider(true);
    if (hideVolumeTimeoutRef.current) clearTimeout(hideVolumeTimeoutRef.current);
    hideVolumeTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 4000);
  };

  // === Sync background and main video timing and play state ===
  useEffect(() => {
    const main = playerRef.current;
    const bg = bgPlayerRef.current;
    if (!main || !bg) return;

    let raf = null;
    const syncIfNeeded = () => {
      try {
        const diff = Math.abs((main.currentTime || 0) - (bg.currentTime || 0));
        if (diff > 0.15) {
          bg.currentTime = main.currentTime;
        }
      } catch (e) {}
    };

    const onTime = () => {
      // Throttle with rAF to avoid heavy writes
      if (raf) return;
      raf = requestAnimationFrame(() => {
        syncIfNeeded();
        raf = null;
      });
    };

    const onPlay = () => { try { if (bg.paused) bg.play(); } catch (e) {} };
    const onPause = () => { try { if (!bg.paused) bg.pause(); } catch (e) {} };
    const onSeeked = () => { try { bg.currentTime = main.currentTime; } catch (e) {} };

    main.addEventListener('timeupdate', onTime);
    main.addEventListener('play', onPlay);
    main.addEventListener('pause', onPause);
    main.addEventListener('seeked', onSeeked);

    // initial alignment
    try { bg.currentTime = main.currentTime; } catch (e) {}
    if (!main.paused && bg.paused) { try { bg.play(); } catch (e) {} }

    return () => {
      main.removeEventListener('timeupdate', onTime);
      main.removeEventListener('play', onPlay);
      main.removeEventListener('pause', onPause);
      main.removeEventListener('seeked', onSeeked);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [playerRef, bgPlayerRef, currentIndex]);

  // ✅ Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff'
      }}>
        <div>Đang tải video...</div>
      </div>
    );
  }

  // ✅ Error states
  if (!videoList || videoList.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '20px', fontSize: '18px' }}>
          Không có video nào để hiển thị
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff7a00',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!video) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '20px', fontSize: '18px' }}>
          Không tìm thấy video phù hợp
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff7a00',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container} onClick={() => setIsInteracted(true)}>
      {/* Nút quay lại */}
      <button className={styles.backBtn} onClick={(e) => { e.stopPropagation(); navigate(-1); }}>
        ←
      </button>
      
      {videoUrl ? (
        <>
          {/* Video nền blur */}
          <video ref={bgPlayerRef} className="bg-blur" src={videoUrl} autoPlay loop muted playsInline />
          
          {/* Nút âm lượng + thanh trượt */}
          <div className={styles.volumeWrapper}>
            <button
              className="volume-btn"
              onClick={handleToggleMute}
              onMouseEnter={() => {
                setShowVolumeSlider(true);
                if (volumeSliderTimeoutRef.current) clearTimeout(volumeSliderTimeoutRef.current);
              }}
              onMouseLeave={() => {
                if (volumeSliderTimeoutRef.current) clearTimeout(volumeSliderTimeoutRef.current);
                volumeSliderTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 5000);
              }}
            >
              {isMuted || volume === 0 ? <FaVolumeMute size={22} color="#fff" /> : <FaVolumeUp size={22} color="#fff" />}
            </button>
            {showVolumeSlider && (
                <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                style={{ 
                  writingMode: 'bt-lr', 
                  WebkitAppearance: 'slider-vertical', 
                  height: '120px', 
                  width: '18px', 
                  marginLeft: 0, 
                  borderRadius: '8px', 
                  background: 'linear-gradient(180deg, #ff7a00 0%, #ff9500 100%)', 
                  accentColor: '#ff7a00' 
                }}
                onMouseEnter={() => {
                  setShowVolumeSlider(true);
                  if (volumeSliderTimeoutRef.current) clearTimeout(volumeSliderTimeoutRef.current);
                }}
                onMouseLeave={() => {
                  if (volumeSliderTimeoutRef.current) clearTimeout(volumeSliderTimeoutRef.current);
                  volumeSliderTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 5000);
                }}
              />
            )}
          </div>
          
          {/* Video chính */}
          <div className="video-wrapper" style={{ position: "relative" }}>
            <video
              ref={playerRef}
              src={videoUrl}
              autoPlay
              loop
              playsInline
              muted={isMuted}
              onPlay={() => {
                setIsPlaying(true);
                if (bgPlayerRef.current && bgPlayerRef.current.paused) {
                  bgPlayerRef.current.play();
                }
              }}
              onPause={() => {
                setIsPlaying(false);
                if (bgPlayerRef.current && !bgPlayerRef.current.paused) {
                  bgPlayerRef.current.pause();
                }
              }}
              style={{ width: "100%", height: "100%" }}
              onClick={handleVideoClick}
            />
            {showHeartEffect && <FaHeart className="heart-effect" />}
            {!isPlaying && (
              <div className="play-icon" onClick={() => { if (playerRef.current) playerRef.current.play(); }}>
                <FaPlay size={48} color="#fff" />
              </div>
            )}
            <audio ref={audioRef} src="/audio/background-music.mp3" autoPlay loop muted={isMuted} style={{ display: "none" }} />
          </div>
        </>
      ) : (
        <p style={{ color: "#fff", textAlign: "center", padding: "40px" }}>Không tìm thấy video</p>
      )}
      
      {/* OVERLAY */}
      <div className={styles.overlay}>
        {/* USER INFO */}
        {!hideUserInfo && video && (
          <div className="user-info-wrapper">
            <div className="user-info">
              <img 
                src={video.nguoiDang?.avatarUrl || defaultAvatar} 
                alt="avatar" 
                className="avatar" 
              />
              <div className="user-details">
                <strong className="user-name">
                  {video.nguoiDang?.fullName || 'Người dùng'}
                </strong>
                <div className={styles.location}>
                  {video.diaChi && video.quanHuyen && video.tinhThanh 
                    ? `${video.diaChi}, ${video.quanHuyen}, ${video.tinhThanh}`
                    : 'Vị trí không xác định'
                  }
                </div>
              </div>
            </div>
            <div className={styles.videoInfo}>
              <h2 className={styles.title}>{video.tieuDe || 'Tiêu đề video'}</h2>
              <p className={`description ${expanded ? "expanded" : ""}`}>
                {video.moTa || 'Không có mô tả'}
              </p>
              {video.moTa && video.moTa.length > 120 && (
                <button 
                  onClick={() => setExpanded((prev) => !prev)} 
                  className={styles.readMore}
                >
                  {expanded ? "Thu gọn" : "Xem thêm"}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Nút tym & comment */}
        {!hideUserInfo && (
          <div className="actions">
            <button onClick={handleLike} className={`like-btn ${isLiked ? "liked" : ""}`}> 
              <span className="icon-circle" ref={iconCircleRef}>
                {isLiked && showHeartEffect && <div className="heart-pulse-circle" />}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill={isLiked ? "#ff2e63" : "#ccc"}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                      2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                      C13.09 3.81 14.76 3 16.5 3 
                      19.58 3 22 5.42 22 8.5
                      c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
              <span className="count">{soTym}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="comment-toggle-btn">
              <svg width="24" height="24" fill="#FF7A00" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              <span className={styles.commentCount}>{totalCommentCount}</span>
            </button>
          </div>
        )}
        
        {/* COMMENT SECTION */}
        <div className={`comment-section ${hideUserInfo ? "pull-up" : ""} ${expanded ? "desc-expanded" : video?.moTa?.length > 120 ? "desc-long" : "desc-collapsed"}`}>
          <div className="comments-title-header">
            <strong>Comments ({totalCommentCount})</strong>
          </div>
          <div ref={scrollRef} className="comment-scrollable" style={{ paddingTop: hideUserInfo ? "80px" : "12px" }}>
            {renderCommentsFlat(comments)}
            <div className="comment-bottom-spacer" />
            
            {/* Ô nhập bình luận mới */}
            <div className="comment-input-fixed">
              <div className="comment-input-wrapper">
                <div className="textarea-group">
                  <textarea
                    ref={mainCommentRef}
                    value={newComment}
                    onChange={(e) => {
                      const text = e.target.value;
                      if (text.length <= 150) setNewComment(text);
                    }}
                    placeholder="Nhập bình luận..."
                    className="comment-input"
                    rows={1}
                  />
                  {newComment.length > 50 && (
                    <div className="char-counter">{newComment.length}/150</div>
                  )}
                </div>
                <button onClick={submitComment} className="comment-submit-btn">Gửi</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}