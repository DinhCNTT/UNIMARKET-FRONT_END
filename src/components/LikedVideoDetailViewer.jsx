import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./LikedVideoDetailViewer.css";
import {
  FaHeart,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";
import { FiArrowLeftCircle } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import throttle from "lodash.throttle";
import toast from 'react-hot-toast';


export default function LikedVideoDetailViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { videos: initialVideos, initialIndex } = location.state || {
    videos: [],
    initialIndex: 0,
  };

  const [videoList, setVideoList] = useState(initialVideos);
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
  const [showCharCount, setShowCharCount] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showReplyCharCount, setShowReplyCharCount] = useState(false);
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);
  const [replyContentMap, setReplyContentMap] = useState({});
  const [activeReplyMap, setActiveReplyMap] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [volume, setVolume] = useState(1); // 1 = 100%
  const [isSaved, setIsSaved] = useState(false);
  const [soNguoiLuu, setSoNguoiLuu] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const playerRef = useRef(null);
    const videoData = videoList[currentIndex];

  // 📌 Lấy thông tin lưu video khi đổi video hoặc user
  useEffect(() => {
    if (!videoData) return;

    const fetchSaveInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        let headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await axios.get(
          `http://localhost:5133/api/video/${videoData.maTinDang}/savedinfo`,
          { headers }
        );

        const { isSaved, soNguoiLuu } = res.data;

        // Cập nhật danh sách video
        setVideoList((prevList) =>
          prevList.map((v, i) =>
            i === currentIndex ? { ...v, isSaved, soNguoiLuu } : v
          )
        );

        setIsSaved(isSaved);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin lưu video:", err);
      }
    };

    fetchSaveInfo();
  }, [user, currentIndex, videoData]);

  // 📌 Toggle lưu/xóa lưu video
  const handleToggleSave = async () => {
    const token = localStorage.getItem("token");

    if (!user || !token) {
      toast.error("Bạn cần đăng nhập để lưu video!");
      return;
    }

    try {
      const { data } = await axios.post(
        `http://localhost:5133/api/video/ToggleSave`,
        { maTinDang: videoData.maTinDang },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { saved, totalSaves } = data;

      // Cập nhật list video
      setVideoList((prevList) =>
        prevList.map((v, i) =>
          i === currentIndex
            ? { ...v, isSaved: saved, soNguoiLuu: totalSaves }
            : v
        )
      );

      setIsSaved(saved);
      toast.success(saved ? "Đã lưu video!" : "Đã xóa khỏi danh sách lưu.");
    } catch (err) {
      console.error("Lỗi khi lưu video:", err);

      if (err.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
      } else {
        toast.error("Lỗi khi lưu video. Vui lòng thử lại.");
      }
    }
  };
  const bgPlayerRef = useRef(null);
  const audioRef = useRef(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const currentIndexRef = useRef(initialIndex);
  const iconCircleRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastFetchTimeRef = useRef(Date.now());
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);
  const scrollStopTimer = useRef(null);
  const lastHideStateRef = useRef(hideUserInfo);
  useEffect(() => {
  const handleScroll = () => {
    const scrollTop = scrollRef.current?.scrollTop || 0;

    if (scrollTop > 100) {
      clearTimeout(scrollStopTimer.current);
      if (!lastHideStateRef.current) {
        setHideUserInfo(true);
        lastHideStateRef.current = true;
      }
    } else {
      clearTimeout(scrollStopTimer.current);
      scrollStopTimer.current = setTimeout(() => {
        if (lastHideStateRef.current) {
          setHideUserInfo(false);
          lastHideStateRef.current = false;
        }
      }, 300); // ⏱ Delay sau khi dừng cuộn
    }
  };

  const throttledScroll = throttle(handleScroll, 80); // 🧪 Giảm thời gian throttle giúp nhạy hơn

  const el = scrollRef.current;
  if (el) {
    el.addEventListener("scroll", throttledScroll);
  }

  return () => {
    if (el) el.removeEventListener("scroll", throttledScroll);
    clearTimeout(scrollStopTimer.current);
  };
}, []);

  const replyTextareaRef = useRef(null);
  const mainCommentRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const hideVolumeTimeoutRef = useRef(null);
 useEffect(() => {
  return () => {
    if (hideVolumeTimeoutRef.current) {
      clearTimeout(hideVolumeTimeoutRef.current);
    }
  };
}, []);

  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");
  const video = videoList[currentIndex];
  const videoUrl = video?.videoUrl;
   let clickTimeout = null;
  let clickCount = 0;

  const handleClick = useCallback(() => {
    clickCount++;

    if (!isLiked) {
      handleLike();
    }

    if (clickCount >= 2) {
      showHeart();
      clickCount = 0;
      clearTimeout(clickTimeout);
      return;
    }

    clickTimeout = setTimeout(() => {
      togglePlayPause();
      clickCount = 0;
    }, 300);
  }, [isLiked, video?.maTinDang]);

  const togglePlayPause = () => {
    const videoMain = playerRef.current;
    const videoBlur = bgPlayerRef.current;
    const audio = audioRef.current;

    if (!videoMain || !videoBlur) return;

    if (videoMain.paused) {
      videoMain.play();
      videoBlur.play();
      audio?.play();
      setIsPlaying(true);
    } else {
      videoMain.pause();
      videoBlur.pause();
      audio?.pause();
      setIsPlaying(false);
    }

    setIsInteracted(true);
  };

  const showHeart = () => {
    setShowHeartEffect(true);
    setTimeout(() => setShowHeartEffect(false), 600);
  };

  const toggleReplyInput = (commentId) => {
    setActiveReplyId((prev) => (prev === commentId ? null : commentId));
    setReplyContent("");
  };

  const toggleChildReplyInput = (replyId) => {
    setActiveReplyMap((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
  };

  const toggleExpandReplies = (commentId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

 const renderCommentsRecursive = (commentList, level = 0, parentUserName = null) => {
  return commentList.map((comment) => {
    const isMenuOpen = activeMenuCommentId === comment.id;
    const hasReplies = comment.replies?.length > 0;
    const isExpanded = expandedComments[comment.id];
    const isTopLevel = level === 0;

    // Hiển thị replies: nếu là comment cha -> hiển thị 1 hoặc toàn bộ; nếu là comment con -> hiển thị toàn bộ luôn
    const visibleReplies = isTopLevel
      ? isExpanded
        ? comment.replies
        : comment.replies?.slice(0, 1)
      : comment.replies;

    return (
      <div
        key={comment.id}
        className="lvv-comment-item"
        style={{ marginLeft: `${level * -24}px` }}
      >
        {/* Comment chính */}
        <div className="lvv-comment-wrapper">
          <div className="lvv-comment-user-header">
            <img src={comment.avatarUrl} className="lvv-avatar" alt="user" />
            <div className="lvv-comment-main">
              <div className="lvv-comment-header">
                <strong className="lvv-username">{comment.userName}</strong>
                {level > 0 && parentUserName && (
                  <span className="lvv-reply-to">
                    trả lời <strong>{parentUserName}</strong>
                  </span>
                )}
              </div>

              <div className="lvv-comment-content">{comment.content}</div>
              <div className="lvv-comment-meta">
                <span className="lvv-time">
                  {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                </span>
                <button
                  className="lvv-reply-toggle-btn"
                  onClick={() => toggleChildReplyInput(comment.id)}
                >
                  Trả lời
                </button>
              </div>

              {/* Ô nhập trả lời */}
              {activeReplyMap[comment.id] && (
                <div className="lvv-reply-input-inline">
                  <div className="lvv-reply-input-wrapper">
                    <textarea
                      value={replyContentMap[comment.id] || ""}
                      onChange={(e) => {
                        const text = e.target.value;
                        if (text.length <= 150) {
                          setReplyContentMap((prev) => ({
                            ...prev,
                            [comment.id]: text,
                          }));
                        }
                      }}
                      placeholder="Trả lời..."
                      className="lvv-reply-input textarea"
                      rows={1}
                      ref={(el) => {
                        if (el) {
                          el.style.height = "auto";
                          el.style.height = el.scrollHeight + "px";
                        }
                      }}
                    />
                    <div className="lvv-reply-footer">
                      <div className="lvv-reply-actions">
                        <button
                          onClick={() =>
                            handleReplySubmit(comment.id, replyContentMap[comment.id])
                          }
                          className="lvv-reply-submit-btn"
                          disabled={!replyContentMap[comment.id]?.trim()}
                        >
                          Gửi
                        </button>
                        <button
                          className="lvv-reply-cancel-btn"
                          onClick={() => {
                            setReplyContentMap((prev) => ({
                              ...prev,
                              [comment.id]: "",
                            }));
                            setActiveReplyMap((prev) => ({
                              ...prev,
                              [comment.id]: false,
                            }));
                          }}
                        >
                          X
                        </button>
                      </div>
                    </div>
                  </div>
                  {replyContentMap[comment.id]?.length >= 30 && (
                    <div className="lvv-char-count">
                      {replyContentMap[comment.id].length}/150
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Nút menu (nếu là chủ comment) */}
          {comment.userId === currentUserId && (
            <div className={level === 0 ? "lvv-menu-wrapper-parent" : "lvv-menu-wrapper-child"}>
              <button
                className="lvv-menu-btn"
                onClick={() =>
                  setActiveMenuCommentId((prevId) =>
                    prevId === comment.id ? null : comment.id
                  )
                }
              >
                ⋯
              </button>

              {isMenuOpen && (
                <div className="lvv-popup-menu">
                  <button
                    className="lvv-delete-btn"
                    onClick={() => {
                      handleDeleteComment(comment.id);
                      setActiveMenuCommentId(null);
                    }}
                  >
                    Xoá
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Replies (nằm ngoài wrapper) */}
        {hasReplies && (
          <div className="lvv-replies">
            {visibleReplies.map((reply) =>
              renderCommentsRecursive([reply], level + 1, comment.userName)
            )}

            {/* Nút "Xem thêm" chỉ hiện với comment cha */}
            {isTopLevel && comment.replies.length > 1 && (
              <button
                onClick={() => toggleExpandReplies(comment.id)}
                className="lvv-expand-replies-btn"
              >
                {isExpanded
                  ? "Thu gọn"
                  : `Xem thêm (${comment.replies.length - 1})`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  });
};


  useEffect(() => {
    // ✅ Ẩn thanh cuộn khi vào trang
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // 🌀 Scroll giống TikTok
  const SCROLL_THRESHOLD = 90;
  const handleScroll = (e) => {
    if (isTransitioning) return;

    const delta = e.deltaY;
    if (Math.abs(delta) < SCROLL_THRESHOLD) return;

    let nextIndex = currentIndexRef.current;
    if (delta > 0 && nextIndex < videoList.length - 1) {
      nextIndex++;
    } else if (delta < 0 && nextIndex > 0) {
      nextIndex--;
    } else {
      return;
    }

    setIsTransitioning(true);
    setCurrentIndex(nextIndex);

    // ✅ Reset sau 600ms để cho phép vuốt tiếp
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    window.addEventListener("wheel", handleScroll, { passive: true });
    return () => window.removeEventListener("wheel", handleScroll);
  }, []);

  useEffect(() => {
    const unmuteOnFirstClick = () => {
      const video = playerRef.current;
      if (video) {
        video.muted = false;
        video.volume = 1.0;
        video.play().catch((err) => console.warn("Không thể play lại:", err));
      }
    };
    window.addEventListener("click", unmuteOnFirstClick, { once: true });
    return () => window.removeEventListener("click", unmuteOnFirstClick);
  }, []);

  useEffect(() => {
    const playMedia = async () => {
      try {
        await playerRef.current?.play();
        await audioRef.current?.play();
      } catch (err) {
        console.warn("Autoplay bị chặn", err);
      }
    };
    playMedia();
  }, [videoUrl]);

  // 🟨 1. useEffect để đồng bộ trạng thái isLiked và soTym
  useEffect(() => {
    const currentVideo = videoList[currentIndex];
    if (!currentVideo) return;

    const token = localStorage.getItem("token");
    axios
      .get(`http://localhost:5133/api/video/${currentVideo.maTinDang}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        const updatedVideo = res.data;
        setIsLiked(updatedVideo.isLiked); // ✅
        setSoTym(updatedVideo.soTym);

        setVideoList((prevList) =>
          prevList.map((v, i) =>
            i === currentIndex ? { ...v, ...updatedVideo } : v
          )
        );
      })
      .catch((err) => {
        console.error("Lỗi lấy chi tiết video:", err);
      });
  }, [currentIndex]);



  const handleTogglePlay = () => {
    const videoMain = playerRef.current;
    const videoBlur = bgPlayerRef.current;
    const audio = audioRef.current;

    if (!videoMain || !videoBlur) return;

    if (videoMain.paused) {
      videoMain.play();
      videoBlur.play();
      audio?.play();
      setIsPlaying(true);
    } else {
      videoMain.pause();
      videoBlur.pause();
      audio?.pause();
      setIsPlaying(false);
    }

    setIsInteracted(true);
  };
  


  const handleLike = async () => {
  const video = videoList[currentIndex];
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Bạn cần đăng nhập để tym video!");
    return;
  }

  const wasLiked = isLiked; // 🔴 Lưu trạng thái cũ trước khi gọi API

  try {
    await axios.post(
      `http://localhost:5133/api/video/${video.maTinDang}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const detailRes = await axios.get(
      `http://localhost:5133/api/video/${video.maTinDang}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("🔥 Kết quả API chi tiết sau tym:", detailRes.data);
    const updatedVideo = detailRes.data;

    setIsLiked(updatedVideo.isLiked);
    setSoTym(updatedVideo.soTym);

    setVideoList((prevList) =>
      prevList.map((v, i) =>
        i === currentIndex ? { ...v, ...updatedVideo } : v
      )
    );

    // 🩷 Sửa chỗ này:
    if (!wasLiked && updatedVideo.isLiked) {
      setShowHeartEffect(true);
      setTimeout(() => setShowHeartEffect(false), 600);

      if (iconCircleRef.current) {
        const circle = document.createElement("div");
        circle.className = "heart-pulse-circle";
        iconCircleRef.current.appendChild(circle);
        setTimeout(() => {
          circle.remove();
        }, 600);
      }
    }
  } catch (err) {
    console.error("Lỗi khi tym video:", err);
    if (err.response?.status === 401) {
      alert("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.");
    }
  }
};

 // hàm cmt 
  
 // FETCH COMMENTS (polling + update)
 const fetchComments = useCallback(async () => {
  if (!video?.maTinDang) return;
  try {
    const res = await axios.get(`http://localhost:5133/api/video/${video.maTinDang}/comments`);
    const data = res.data || [];
    setComments(data);
    setTotalCommentCount(countAllComments(data));
    lastFetchTimeRef.current = Date.now();
  } catch (err) {
    console.error("Fetch comments error", err);
  }
}, [video?.maTinDang]);

const countAllComments = (list) => {
  let total = 0;
  for (const comment of list) {
    total += 1;
    if (comment.replies && comment.replies.length > 0) {
      total += countAllComments(comment.replies);
    }
  }
  return total;
};

// AUTO REFRESH mỗi 3 giây
useEffect(() => {
  if (video?.maTinDang) {
    fetchComments();
    pollIntervalRef.current = setInterval(fetchComments, 3000);
  }

  return () => {
    clearInterval(pollIntervalRef.current);
  };
}, [fetchComments, video?.maTinDang]);

// Chỉ polling khi tab active
useEffect(() => {
  const handleFocus = () => {
    fetchComments();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      clearInterval(pollIntervalRef.current);
    } else {
      fetchComments();
      pollIntervalRef.current = setInterval(fetchComments, 3000);
    }
  };

  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, [fetchComments]);

// ADD COMMENT TẠM THỜI
const addOptimisticComment = useCallback((commentData) => {
  const optimisticComment = {
    id: `temp-${Date.now()}`,
    content: commentData.content,
    userName: user?.fullName || user?.userName || "Bạn",
    userId: currentUserId,
    avatarUrl: user?.avatarUrl,
    createdAt: new Date().toISOString(),
    isAuthor: false,
    parentCommentId: commentData.parentCommentId || null,
    replies: [],
    isOptimistic: true
  };

  if (commentData.parentCommentId) {
    const insertReply = (list) =>
      list.map((comment) => {
        if (comment.id === commentData.parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), optimisticComment],
          };
        } else if (comment.replies?.length > 0) {
          return {
            ...comment,
            replies: insertReply(comment.replies),
          };
        } else {
          return comment;
        }
      });

    setComments((prev) => insertReply(prev));
  } else {
    setComments((prev) => [optimisticComment, ...prev]);
  }

  return optimisticComment.id;
}, [user, currentUserId]);


// REPLACE COMMENT TỪ SERVER
const replaceOptimisticComment = useCallback((tempId, realComment) => {
  const updateList = (list) =>
    list.map((c) => {
      if (c.id === tempId) {
        return { ...realComment, isOptimistic: false };
      } else if (c.replies?.length > 0) {
        return {
          ...c,
          replies: updateList(c.replies),
        };
      }
      return c;
    });

  setComments((prev) => updateList(prev));
}, []);

// GỬI COMMENT
const submitComment = async () => {
  if (!token || !newComment.trim()) return;

  const commentData = { content: newComment.trim() };
  const tempId = addOptimisticComment(commentData);

  try {
    const res = await axios.post(`http://localhost:5133/api/video/${video.maTinDang}/comment`, commentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data) {
      replaceOptimisticComment(tempId, res.data);
    }
    setNewComment('');
  } catch (err) {
    console.error("Comment error", err);
    setComments(prev => prev.filter(c => c.id !== tempId));
  }
};

// GỬI REPLY
const handleReplySubmit = async (parentId, contentInput) => {
  console.log("GỌI handleReplySubmit", { parentId, contentInput, replyContent: replyContentMap[parentId] });
  const content = contentInput ?? replyContentMap[parentId]; // fallback nếu content không được truyền

  if (!token || !content?.trim()) return; // tránh lỗi nếu content là undefined/null
    console.warn("Không gửi được vì thiếu token hoặc nội dung rỗng", { token, content });
  const replyData = {
    content: content.trim(),
    parentCommentId: parentId,
  };

  const tempId = addOptimisticComment(replyData);

  try {
    const res = await axios.post(`http://localhost:5133/api/video/${video.maTinDang}/comment`, replyData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data) {
      replaceOptimisticComment(tempId, res.data);
    }

    // Reset input & UI state
    setReplyContentMap((prev) => ({
      ...prev,
      [parentId]: "",
    }));
    setActiveReplyMap((prev) => ({
      ...prev,
      [parentId]: false,
    }));
    setExpandedThreads((prev) => ({ ...prev, [parentId]: true }));
  } catch (err) {
    console.error("Reply error", err);

    // Gỡ optimistic comment nếu lỗi
    setComments((prev) => {
      const removeFromList = (list) =>
        list.map((c) => ({
          ...c,
          replies: c.replies
            ? removeFromList(c.replies).filter((r) => r.id !== tempId)
            : [],
        }));
      return removeFromList(prev);
    });
  }
};


// XÓA COMMENT
const handleDeleteComment = async (commentId) => {
  if (!token) return;

  const confirmed = await new Promise((resolve) => {
    toast(
      (t) => (
        <div style={{ fontSize: "14px", color: "white" }}>
          <div style={{ marginBottom: "12px" }}>
            Bạn có chắc muốn xoá bình luận này?
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            {/* Nút Huỷ */}
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                border: "1px solid #888",
                borderRadius: "6px",
                backgroundColor: "transparent",
                color: "#ddd",
                cursor: "pointer",
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#444";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
            >
              Huỷ
            </button>

            {/* Nút Xoá */}
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                border: "1px solid #f44",
                borderRadius: "6px",
                backgroundColor: "transparent",
                color: "#f77",
                cursor: "pointer",
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#f44";
                e.target.style.color = "#fff";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#f77";
              }}
            >
              Xoá
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          background: "#1c1c1e",
          color: "#fff",
          borderRadius: "12px",
          padding: "12px 16px",
          width: "fit-content",
          minWidth: "unset",
          maxWidth: "90vw",
        },
      }
    );
  });

  if (!confirmed) return;

  const deletePromise = axios.delete(
    `http://localhost:5133/api/video/comment/${commentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  toast.promise(deletePromise, {
    loading: "Đang xoá bình luận...",
    success: "Đã xoá bình luận!",
    error: "Xoá thất bại. Vui lòng thử lại.",
  });

  try {
    await deletePromise;

    const removeFromList = (list) =>
      list
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies ? removeFromList(c.replies) : [],
        }));

    setComments((prev) => removeFromList(prev));
  } catch (err) {
    console.error("Delete error", err);
    fetchComments();
  }
};


// hàm cuộn 
useEffect(() => {
  const scrollable = document.querySelector(".lvv-comment-scrollable");

  if (!scrollable) return;

  let prevY = null;
  let lastScrollTop = 0;

  // ✨ Theo dõi cuộn để ẩn/hiện user info
  const handleScroll = () => {
    const scrollTop = scrollable.scrollTop;
    if (scrollTop > lastScrollTop + 10) {
      setHideUserInfo(true); // cuộn xuống → ẩn
    } else if (scrollTop < lastScrollTop - 10) {
      setHideUserInfo(false); // cuộn lên → hiện lại
    }
    lastScrollTop = scrollTop;
  };

  // Chặn cuộn "lọt" ra ngoài vùng comment
  const handleWheel = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = scrollable;
    const isScrollingUp = e.deltaY < 0;
    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight;

    if ((isScrollingUp && isAtTop) || (!isScrollingUp && isAtBottom)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const currentY = e.touches[0].clientY;

    const { scrollTop, scrollHeight, clientHeight } = scrollable;
    const isScrollingUp = prevY !== null ? currentY > prevY : false;
    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight;

    if ((isScrollingUp && isAtTop) || (!isScrollingUp && isAtBottom)) {
      e.preventDefault();
      e.stopPropagation();
    }

    prevY = currentY;
  };

  const resetTouch = () => {
    prevY = null;
  };

  scrollable.addEventListener("scroll", handleScroll);
  scrollable.addEventListener("wheel", handleWheel, { passive: false });
  scrollable.addEventListener("touchmove", handleTouchMove, { passive: false });
  scrollable.addEventListener("touchend", resetTouch);
  scrollable.addEventListener("touchcancel", resetTouch);

  return () => {
    scrollable.removeEventListener("scroll", handleScroll);
    scrollable.removeEventListener("wheel", handleWheel);
    scrollable.removeEventListener("touchmove", handleTouchMove);
    scrollable.removeEventListener("touchend", resetTouch);
    scrollable.removeEventListener("touchcancel", resetTouch);
  };
}, []);

useEffect(() => {
  const scrollable = document.querySelector('.lvv-comment-scrollable');
  const section = document.querySelector('.lvv-comment-section');

  const handleScroll = () => {
    if (!scrollable || !section) return;
    const scrollTop = scrollable.scrollTop;
    if (scrollTop > 80) {
      section.classList.add('pull-up');
    } else {
      section.classList.remove('pull-up');
    }
  };

  scrollable?.addEventListener('scroll', handleScroll);
  return () => scrollable?.removeEventListener('scroll', handleScroll);
}, []);
<div className="lvv-popup-menu"></div>
const toggleMenu = (commentId) => {
  setOpenMenuId((prevId) => (prevId === commentId ? null : commentId));
};

  if (!video) return <div>Không tìm thấy video</div>;
 
  return (
  <div className="lvv-container" onClick={handleClick}>
    {/* Nút quay lại */}
    <button
      className="lvv-back-btn"
      onClick={(e) => {
        e.stopPropagation();
        navigate(-1);
      }}
    >
      <FiArrowLeftCircle size={24} />
    </button>

    {videoUrl ? (
      <>
        {/* Video nền blur */}
        <video
          ref={bgPlayerRef}
          className="lvv-bg-blur"
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Nút âm lượng + thanh trượt */}
        <div
          style={{ position: "fixed", bottom: 100, right: 16, zIndex: 100 }}
          onMouseEnter={() => {
  if (hideVolumeTimeoutRef.current) {
    clearTimeout(hideVolumeTimeoutRef.current);
    hideVolumeTimeoutRef.current = null;
  }
  setShowVolumeSlider(true);
}}
         onMouseLeave={() => {
  hideVolumeTimeoutRef.current = setTimeout(() => {
    setShowVolumeSlider(false);
  }, 2000); // Giữ hiệu ứng 2s
}}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Nút âm lượng */}
          <button
            className="lvv-volume-btn"
            onClick={(e) => {
              e.stopPropagation();
              const newMuted = volume > 0;
              const newVolume = newMuted ? 0 : 1;
              setVolume(newVolume);
              setIsMuted(newMuted);
              if (playerRef.current) {
                playerRef.current.volume = newVolume;
                playerRef.current.muted = newMuted;
              }
              if (audioRef.current) {
                audioRef.current.volume = newVolume;
                audioRef.current.muted = newMuted;
              }
            }}
          >
            {volume === 0 ? (
              <FaVolumeMute size={22} color="#fff" />
            ) : (
              <FaVolumeUp size={22} color="#fff" />
            )}
          </button>

          {/* Thanh trượt dọc hiện khi hover */}
          {showVolumeSlider && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value);
                setVolume(newVolume);
                setIsMuted(newVolume === 0);
                if (playerRef.current) {
                  playerRef.current.volume = newVolume;
                  playerRef.current.muted = newVolume === 0;
                }
                if (audioRef.current) {
                  audioRef.current.volume = newVolume;
                  audioRef.current.muted = newVolume === 0;
                }
              }}
              className="lvv-volume-slider"
            />
          )}
        </div>

        {/* Video chính */}
        <div className="lvv-video-wrapper" style={{ position: "relative" }}>
          <video
            ref={playerRef}
            src={videoUrl}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{ width: "100%", height: "100%" }}
          />

          {showHeartEffect && <FaHeart className="lvv-heart-effect" />}

          {!isPlaying && (
            <div className="lvv-play-icon">
              <FaPlay size={48} color="#fff" />
            </div>
          )}

          <audio
            ref={audioRef}
            src="/audio/background-music.mp3"
            autoPlay
            loop
            muted={isMuted}
            style={{ display: "none" }}
          />
        </div>
      </>
    ) : (
      <p style={{ color: "#fff" }}>Không tìm thấy video</p>
    )}
    {/* OVERLAY */}
    <div
      className="lvv-overlay"
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => {
        const scrollable = e.target.closest(".lvv-comment-scrollable");
        if (scrollable) {
          const { scrollTop, scrollHeight, clientHeight } = scrollable;
          const isScrollingUp = e.deltaY < 0;
          const isAtTop = scrollTop === 0;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight;
          if ((isScrollingUp && isAtTop) || (!isScrollingUp && isAtBottom)) {
            e.preventDefault();
            e.stopPropagation();
          }
        } else {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {/* USER INFO */}
      {!hideUserInfo && (
        <div className="lvv-user-info-wrapper">
          <div className="lvv-user-info">
            <img src={video.nguoiDang.avatarUrl} alt="avatar" className="lvv-avatar" />
            <div className="lvv-user-details">
              <strong className="lvv-user-name">{video.nguoiDang.fullName}</strong>
              <div className="lvv-location">
                {video.diaChi}, {video.quanHuyen}, {video.tinhThanh}
              </div>
            </div>
          </div>

          <div className="lvv-video-info">
            <h2 className="lvv-title">{video.tieuDe}</h2>
            <p className={`lvv-description ${expanded ? "expanded" : ""}`}>
              {video.moTa}
            </p>
          {video.moTa?.length > 120 && (
  <button
    onClick={() => setExpanded((prev) => !prev)}
    className="lvv-read-more"
  >
    {expanded ? "Thu gọn" : "Xem thêm"}
  </button>
)}
          </div>
        </div>
      )}

      {/* Nút tym & comment */}
      {!hideUserInfo && (
        <div className="lvv-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`lvv-like-btn ${isLiked ? "liked" : ""}`}
          >
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
           {/* Nút lưu video */}
       <button
        onClick={(e) => {
        e.stopPropagation();
        handleToggleSave();
      }}
      className="lvv-save-btn"
       >
        <span className="icon-circle">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill={isSaved ? "#FFD700" : "#ccc"}
        >
          <path d="M6 2a2 2 0 0 0-2 2v18l8-5.333L20 22V4a2 2 0 0 0-2-2H6z" />
           </svg>
         </span>
         <span className="count">{video?.soNguoiLuu || 0}</span>
       </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="lvv-comment-toggle-btn"
          >
            <svg width="24" height="24" fill="#FF7A00" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            <span className="lvv-comment-count">{totalCommentCount}</span>
          </button>
        </div>
      )}

      {/* COMMENT SECTION */}
      <div
        className={`lvv-comment-section ${hideUserInfo ? "pull-up" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="lvv-comments-title-header">
          <strong>Comments ({totalCommentCount})</strong>
        </div>

        <div
  ref={scrollRef}
  className="lvv-comment-scrollable"
  style={{ paddingTop: hideUserInfo ? "80px" : "12px" }}
>
          {renderCommentsRecursive(comments)}

          {/* Ô nhập bình luận mới */}
          <div className="lvv-comment-input-fixed">
            <div className="lvv-comment-input-wrapper">
              <div className="lvv-textarea-group">
                <textarea
                  ref={mainCommentRef}
                  value={newComment}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (text.length <= 150) {
                      setNewComment(text);
                    }

                    const el = mainCommentRef.current;
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = `${el.scrollHeight}px`;
                    }
                  }}
                  placeholder="Nhập bình luận..."
                  className="lvv-comment-input"
                  rows={1}
                />
                {newComment.length > 50 && (
                  <div className="lvv-char-counter">{newComment.length}/150</div>
                )}
              </div>
              <button onClick={submitComment} className="lvv-comment-submit-btn">
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}