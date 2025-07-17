import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaHeart, FaCommentDots } from "react-icons/fa";
import axios from "axios";
import TopNavbar from "./TopNavbar";
import defaultAvatar from "../assets/default-avatar.png";
import "./VideoSearchDetailViewer.css";

export default function VideoSearchDetailViewer() {
  const navigate = useNavigate();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [soTym, setSoTym] = useState(0);
  const [visibleMenuId, setVisibleMenuId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState({});
  const currentUserId = localStorage.getItem("userId");
  const location = useLocation();
  const { videoList: passedVideoList, initialIndex } = location.state || {};
  const [videoList, setVideoList] = useState(passedVideoList || []);
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const params = useParams();
  const [maTinDang, setMaTinDang] = useState(params.maTinDang);

  useEffect(() => {
    fetchVideoDetail();
    fetchComments();
  }, [maTinDang]);

  useEffect(() => {
    if (videoList.length > 0) {
      const current = videoList[currentIndex];
      if (current && current.maTinDang !== maTinDang) {
        setMaTinDang(current.maTinDang);
      }
    }
  }, [currentIndex, videoList]);

  const fetchVideoDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5133/api/Video/${maTinDang}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Lỗi khi lấy dữ liệu video.");
      const data = await res.json();
      setVideoData(data);
      setIsLiked(data.isLiked || false);
      setSoTym(data.soTym || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://localhost:5133/api/video/${maTinDang}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error("Lỗi khi lấy bình luận:", err);
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Bạn cần đăng nhập để tym video.");
    try {
      const res = await fetch(`http://localhost:5133/api/Video/${maTinDang}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Lỗi khi tym video.");
      const data = await res.json();
      setIsLiked(data.isLiked);
      setSoTym(data.soTym);
    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu tym:", err);
    }
  };

  const handleSubmitComment = async () => {
    const token = localStorage.getItem("token");
    if (!token || !newComment.trim()) return;
    try {
      await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/comment`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment("");
      fetchComments();
    } catch (err) {
      console.error("Lỗi khi gửi bình luận:", err);
    }
  };

  const handleReplySubmit = async (parentId) => {
    const token = localStorage.getItem("token");
    if (!token || !replyContent.trim()) return;
    try {
      await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/comment`,
        {
          content: replyContent,
          parentCommentId: parentId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyContent("");
      setActiveReplyId(null);
      fetchComments();
    } catch (err) {
      console.error("Lỗi khi gửi phản hồi:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này không?")) return;
    try {
      await axios.delete(`http://localhost:5133/api/video/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchComments();
    } catch (err) {
      console.error("Lỗi khi xóa bình luận:", err);
    }
  };

  const toggleReplies = (parentId) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  const handleAutoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const handleWheel = (e) => {
    const sensitivity = 90;
    if (e.deltaY > sensitivity && currentIndex < videoList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (e.deltaY < -sensitivity && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (loading) return <p>Đang tải video...</p>;
  if (!videoData) return <p>Không tìm thấy video.</p>;

  return (
    <div className="vsdv-container">
      <TopNavbar />
      <div className="vsdv-main-wrapper">
        <div className="vsdv-main-content">
          <button onClick={() => navigate(-1)} className="vsdv-close-btn">❌</button>

          <div className="vsdv-video-section" onWheel={handleWheel}>
            {videoList.length > 0 && (
              <div className="vsdv-video-item">
                <video
                  src={videoList[currentIndex]?.videoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  className="vsdv-video"
                />
              </div>
            )}
          </div>

          {/* THÔNG TIN VIDEO */}
          <div className="vsdv-info-section">
            <div className="vsdv-user-info">
              <img
                src={videoData.nguoiDang?.avatarUrl || defaultAvatar}
                alt="avatar"
                className="vsdv-user-avatar"
                onClick={() => navigate(`/nguoi-dung/${videoData.nguoiDang?.userId}`)}
                style={{ cursor: "pointer" }}
              />
              <div>
                <div className="vsdv-username">@{videoData.nguoiDang?.fullName}</div>
                <div className="vsdv-caption">{videoData.tieuDe}</div>
                <div className="vsdv-meta">
                  <span onClick={handleLike} style={{ cursor: "pointer", fontSize: "1.2rem" }}>
                    <FaHeart color={isLiked ? "red" : "gray"} /> {soTym}
                  </span>
                  <span style={{ fontSize: "1.2rem" }}>
                    <FaCommentDots /> {comments.length}
                  </span>
                </div>
              </div>
            </div>

            <hr />

            {/* BÌNH LUẬN */}
            <div className="vsdv-comment-section">
              <h4 className="vsdv-comment-section__title">💬 BÌNH LUẬN ({comments.length})</h4>

              <div className="vsdv-comment-section__scroll-wrapper">
                <div className="vsdv-comment-section__list">
                  {comments.map((parent) => (
                    <div className="vsdv-comment-thread" key={`parent-${parent.id}`}>
                      <div className="vsdv-comment-item">
                        <img
                          src={parent.avatarUrl || defaultAvatar}
                          className="vsdv-comment-item__avatar"
                          onClick={() => navigate(`/nguoi-dung/${parent.userId}`)}
                          style={{ cursor: "pointer" }}
                        />
                        <div className="vsdv-comment-item__body">
                          <div className="vsdv-comment-item__header">
                            <div className="vsdv-comment-item__name">@{parent.userName}</div>
                            {parent.userId === currentUserId && (
                              <div className="vsdv-comment-item__menu-wrapper">
                                <button
                                  className="vsdv-comment-item__menu-btn"
                                  onClick={() =>
                                    setVisibleMenuId(visibleMenuId === parent.id ? null : parent.id)
                                  }
                                >
                                  ⋯
                                </button>
                                {visibleMenuId === parent.id && (
                                  <div className="vsdv-comment-item__menu-dropdown">
                                    <button
                                      className="vsdv-comment-item__menu-option"
                                      onClick={() => {
                                        handleDeleteComment(parent.id);
                                        setVisibleMenuId(null);
                                      }}
                                    >
                                      🗑 Xoá bình luận
                                    </button>
                                    <button
                                      className="vsdv-comment-item__menu-option"
                                      onClick={() => setVisibleMenuId(null)}
                                    >
                                      ❌ Đóng
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="vsdv-comment-item__text">{parent.content}</div>
                          <button
                            onClick={() => setActiveReplyId(parent.id)}
                            className="vsdv-comment-item__reply-btn"
                          >
                            Trả lời
                          </button>
                        </div>
                      </div>

                      {activeReplyId === parent.id && (
                        <div className="vsdv-reply-box">
                          <textarea
                            className="vsdv-auto-resize-textarea"
                            maxLength={150}
                            wrap="soft"
                            value={replyContent}
                            onChange={(e) => {
                              setReplyContent(e.target.value);
                              handleAutoResize(e);
                            }}
                            placeholder="Phản hồi (tối đa 150 ký tự)..."
                          />
                          <button
                            onClick={() => handleReplySubmit(parent.id)}
                            className="vsdv-reply-box__send"
                          >
                            Gửi
                          </button>
                          <button
                            onClick={() => setActiveReplyId(null)}
                            className="vsdv-reply-box__cancel"
                          >
                            Hủy
                          </button>
                        </div>
                      )}

                      {parent.replies?.length > 0 && (
                        <div className="vsdv-replies">
                          <button
                            onClick={() => toggleReplies(parent.id)}
                            className="vsdv-comment-thread__toggle"
                          >
                            {expandedThreads[parent.id]
                              ? "Ẩn phản hồi"
                              : `Xem ${parent.replies.length} phản hồi`}
                          </button>

                          {expandedThreads[parent.id] &&
                            parent.replies.map((reply) => (
                              <div key={reply.id} className="vsdv-comment-item vsdv-comment-item--reply">
                                <img
                                  src={reply.avatarUrl || defaultAvatar}
                                  className="vsdv-comment-item__avatar"
                                  onClick={() => navigate(`/nguoi-dung/${reply.userId}`)}
                                  style={{ cursor: "pointer" }}
                                />
                                <div className="vsdv-comment-item__body">
                                  <div className="vsdv-comment-item__name">@{reply.userName}</div>
                                  <div className="vsdv-comment-item__replying">↳ @{parent.userName}</div>
                                  <div className="vsdv-comment-item__text">{reply.content}</div>
                                  {reply.userId === currentUserId && (
                                    <div className="vsdv-comment-item__menu-wrapper">
                                      <button
                                        className="vsdv-comment-item__menu-btn"
                                        onClick={() =>
                                          setVisibleMenuId(visibleMenuId === reply.id ? null : reply.id)
                                        }
                                      >
                                        ⋯
                                      </button>
                                      {visibleMenuId === reply.id && (
                                        <div className="vsdv-comment-item__menu-dropdown">
                                          <button
                                            className="vsdv-comment-item__menu-option"
                                            onClick={() => {
                                              handleDeleteComment(reply.id);
                                              setVisibleMenuId(null);
                                            }}
                                          >
                                            🗑 Xoá bình luận
                                          </button>
                                          <button
                                            className="vsdv-comment-item__menu-option"
                                            onClick={() => setVisibleMenuId(null)}
                                          >
                                            ❌ Đóng
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="vsdv-comment-input">
                <textarea
                  className="vsdv-auto-resize-textarea"
                  maxLength={150}
                  wrap="soft"
                  value={newComment}
                  onChange={(e) => {
                    setNewComment(e.target.value);
                    handleAutoResize(e);
                  }}
                  placeholder="Nhập bình luận (tối đa 150 ký tự)..."
                />
                <button onClick={handleSubmitComment} className="vsdv-comment-input__submit">
                  GỬI
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
