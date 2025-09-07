"use client"

import React, { useEffect, useState, useRef, useContext } from "react"
import signalRService from "../services/signalRService"
import { AuthContext } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import "animate.css"
import "./ChatBox.css"
import axios from "axios"
import { FaImage, FaVideo, FaTimes, FaEllipsisV, FaTrash, FaClock, FaBan, FaUnlock } from "react-icons/fa"

const CLOUDINARY_UPLOAD_PRESET = "unimarket_upload"
const CLOUDINARY_CLOUD_NAME = "dipnk7ort"
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`

const ChatBox = ({ maCuocTroChuyen }) => {
  // Updated state structures to include formatted status
  const [infoTinDang, setInfoTinDang] = useState({
    tieuDe: "",
    gia: 0,
    anh: "",
    maTinDang: null,
    avatarChuSanPham: "",
    tenChuSanPham: "",
    isOnline: false,
    lastOnlineTime: null,
    formattedLastSeen: null, // Add this
    maChuSanPham: null,
  })

  const [infoNguoiConLai, setInfoNguoiConLai] = useState({
    id: "",
    avatar: "",
    ten: "",
    isOnline: false,
    lastOnlineTime: null,
    formattedLastSeen: null, // Add this
  })

  // Logic xác định hiển thị header: nếu là chủ sản phẩm thì show info khách, ngược lại show chủ sản phẩm
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const isChuSanPham = infoTinDang && user && user.id === infoTinDang.maChuSanPham

  // Luôn hiển thị trạng thái của đối phương (khách thấy chủ, chủ thấy khách)
  const displayAvatar = isChuSanPham ? infoNguoiConLai.avatar : infoTinDang.avatarChuSanPham
  const displayTen = isChuSanPham ? infoNguoiConLai.ten : infoTinDang.tenChuSanPham
  const displayIsOnline = isChuSanPham ? infoNguoiConLai.isOnline : infoTinDang.isOnline
  const displayLastOnline = isChuSanPham ? infoNguoiConLai.lastOnlineTime : infoTinDang.lastOnlineTime

  // Chỉ hiển thị trạng thái nếu có thông tin đối phương (id và tên)
  const shouldShowStatus = !!(isChuSanPham
    ? infoNguoiConLai.id && infoNguoiConLai.ten
    : infoTinDang.maChuSanPham && infoTinDang.tenChuSanPham)

  // Enhanced status fetching function
  const fetchUserStatus = async (userId) => {
    if (!userId) return null
    try {
      const response = await fetch(`http://localhost:5133/api/User/status/${userId}`)
      if (!response.ok) return null
      const data = await response.json()
      return {
        isOnline: data.isOnline,
        lastActive: data.lastActive,
        formattedLastSeen: data.formattedLastSeen,
      }
    } catch (error) {
      console.error("Error fetching user status:", error)
      return null
    }
  }

  // Simplified and more robust getLastOnlineText function
  const getLastOnlineText = () => {
    if (!shouldShowStatus) return ""
    if (displayIsOnline) return "Đang hoạt động"
    if (!displayLastOnline) return ""

    // Get formatted status from backend
    const displayFormattedStatus = isChuSanPham ? infoNguoiConLai.formattedLastSeen : infoTinDang.formattedLastSeen

    // If backend provides formatted status, use it
    if (displayFormattedStatus) {
      // Nếu backend trả về "vừa mới" thì đổi thành "Mới hoạt động gần đây"
      if (displayFormattedStatus.toLowerCase().includes("vừa mới")) {
        return "Mới hoạt động gần đây"
      }
      // Nếu backend trả về "1 phút/giờ/ngày trước" thì thêm chữ "Hoạt động từ ... trước"
      const regex = /^(\d+)\s*(phút|giờ|ngày) trước$/
      const match = displayFormattedStatus.match(regex)
      if (match) {
        return `Hoạt động từ ${match[1]} ${match[2]} trước`
      }
      return displayFormattedStatus
    }

    // Fallback to manual calculation
    let last
    try {
      if (typeof displayLastOnline === "string") {
        let normalized = displayLastOnline.trim()
        if (!normalized.includes("T")) normalized = normalized.replace(" ", "T")
        if (!normalized.endsWith("Z")) normalized += "Z"
        last = new Date(normalized)
      } else {
        last = new Date(displayLastOnline)
      }
      if (isNaN(last.getTime())) throw new Error()
    } catch {
      return ""
    }

    const now = new Date()
    const diffMs = now - last
    if (diffMs < 0) return ""

    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return "Mới hoạt động gần đây"
    if (diffMin < 60) return `Hoạt động từ ${diffMin} phút trước`

    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `Hoạt động từ ${diffH} giờ trước`

    const diffD = Math.floor(diffH / 24)
    return `Hoạt động từ ${diffD} ngày trước`
  }

  // Other state variables
  const [tinNhan, setTinNhan] = useState("")
  const [danhSachTin, setDanhSachTin] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [imagePreviewList, setImagePreviewList] = useState([])
  const [videoPreviewList, setVideoPreviewList] = useState([])
  const [modalImage, setModalImage] = useState(null)
  const [messageMenus, setMessageMenus] = useState({})
  const [isBlockedByMe, setIsBlockedByMe] = useState(false)
  const [isBlockedByOther, setIsBlockedByOther] = useState(false)
  const [maNguoiConLai, setMaNguoiConLai] = useState(null)
  const [, forceUpdate] = useState(0)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const connectionRef = useRef(null)

  const normalizeDate = (timeStr) => {
    if (!timeStr) return null
    if (typeof timeStr === "string") {
      let normalized = timeStr.trim()
      if (!normalized.includes("T")) normalized = normalized.replace(" ", "T")
      if (!normalized.endsWith("Z")) normalized += "Z"
      return normalized
    }
    return timeStr
  }

  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png"
    return url.startsWith("http") ? url : `http://localhost:5133${url}`
  }

  // Gửi trạng thái offline khi logout hoặc đóng tab
  useEffect(() => {
    if (!isConnected || !user?.id) return
    const handleOffline = async () => {
      try {
        await signalRService.invoke("CapNhatTrangThaiNguoiDung", user.id, false)
      } catch (err) {}
    }
    window.addEventListener("beforeunload", handleOffline)
    window.addEventListener("unload", handleOffline)
    return () => {
      window.removeEventListener("beforeunload", handleOffline)
      window.removeEventListener("unload", handleOffline)
    }
  }, [isConnected, user?.id])

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: instant ? "auto" : "smooth" })
    }
  }

  const formatTime = (time) => {
    return time || new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  }

  const canRecallMessage = (messageTime) => {
    if (!messageTime) return false
    const now = new Date()
    const msgTime = new Date(messageTime)
    const diffInMinutes = (now - msgTime) / (1000 * 60)
    return diffInMinutes <= 5
  }

  const getRecallTimeRemaining = (messageTime) => {
    if (!messageTime) return 0
    const now = new Date()
    const msgTime = new Date(messageTime)
    const diffInMinutes = (now - msgTime) / (1000 * 60)
    return Math.max(0, 5 - diffInMinutes)
  }

  const toggleMessageMenu = (messageId) => {
    setMessageMenus((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }))
  }

  const closeAllMessageMenus = () => {
    setMessageMenus({})
  }

  const handleBlockUser = async () => {
    const result = await Swal.fire({
      title: "Chặn người dùng?",
      text: "Người này sẽ không thể gửi tin nhắn cho bạn nữa.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Chặn",
      cancelButtonText: "Hủy",
    })

    if (result.isConfirmed) {
      try {
        const response = await axios.post("http://localhost:5133/api/chat/block-user", {
          BlockerId: user.id,
          BlockedId: maNguoiConLai,
        })
        if (response.status === 200) {
          setIsBlockedByMe(true)
          Swal.fire({
            icon: "success",
            title: "Đã chặn",
            text: "Bạn đã chặn người dùng này.",
            timer: 2000,
            showConfirmButton: false,
          })
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Không thể chặn người dùng. Vui lòng thử lại.",
          confirmButtonColor: "#d33",
        })
      }
    }
  }

  const handleUnblockUser = async () => {
    const result = await Swal.fire({
      title: "Gỡ chặn người dùng?",
      text: "Bạn sẽ có thể nhận tin nhắn từ người này.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Gỡ chặn",
      cancelButtonText: "Hủy",
    })

    if (result.isConfirmed) {
      try {
        const response = await axios.post("http://localhost:5133/api/chat/unblock-user", {
          BlockerId: user.id,
          BlockedId: maNguoiConLai,
        })
        if (response.status === 200) {
          setIsBlockedByMe(false)
          Swal.fire({
            icon: "success",
            title: "Đã gỡ chặn",
            text: "Bạn đã gỡ chặn người dùng này.",
            timer: 2000,
            showConfirmButton: false,
          })
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Không thể gỡ chặn người dùng. Vui lòng thử lại.",
          confirmButtonColor: "#d33",
        })
      }
    }
  }

  const handleRecallTextMessage = async (maTinNhan, thoiGianGui) => {
    if (!canRecallMessage(thoiGianGui)) {
      Swal.fire({
        icon: "error",
        title: "Không thể thu hồi",
        text: "Chỉ có thể thu hồi tin nhắn trong vòng 5 phút sau khi gửi.",
        confirmButtonColor: "#d33",
      })
      return
    }

    const remainingTime = getRecallTimeRemaining(thoiGianGui)
    const remainingMinutes = Math.floor(remainingTime)
    const remainingSeconds = Math.floor((remainingTime - remainingMinutes) * 60)

    const result = await Swal.fire({
      title: "Thu hồi tin nhắn?",
      html: `
        <p>Bạn có chắc chắn muốn thu hồi tin nhắn này?</p>
        <p style="color: #ff6b6b; font-size: 14px;">
          <i class="fa fa-clock"></i> 
          Thời gian còn lại: ${remainingMinutes}:${remainingSeconds.toString().padStart(2, "0")}
        </p>
        <p style="color: #666; font-size: 12px;">Tin nhắn sẽ bị xóa vĩnh viễn khỏi cuộc trò chuyện.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Thu hồi",
      cancelButtonText: "Hủy",
    })

    if (result.isConfirmed) {
      try {
        if (connectionRef.current && connectionRef.current.state === "Connected") {
          await connectionRef.current.invoke("ThuHoiTinNhan", maTinNhan, user.id)
          Swal.fire({
            icon: "success",
            title: "Đã thu hồi",
            text: "Tin nhắn đã được thu hồi thành công.",
            timer: 2000,
            showConfirmButton: false,
          })
        } else {
          throw new Error("Kết nối SignalR không sẵn sàng")
        }
      } catch (error) {
        console.error("Recall error:", error)
        Swal.fire({
          icon: "error",
          title: "Lỗi thu hồi",
          text: error.message || "Không thể thu hồi tin nhắn. Vui lòng thử lại.",
          confirmButtonColor: "#d33",
        })
      }
    }

    closeAllMessageMenus()
  }

  const handleRecallMediaMessage = async (maTinNhan, thoiGianGui, loaiTinNhan) => {
    if (!canRecallMessage(thoiGianGui)) {
      Swal.fire({
        icon: "error",
        title: "Không thể thu hồi",
        text: "Chỉ có thể thu hồi tin nhắn trong vòng 5 phút sau khi gửi.",
        confirmButtonColor: "#d33",
      })
      return
    }

    const remainingTime = getRecallTimeRemaining(thoiGianGui)
    const remainingMinutes = Math.floor(remainingTime)
    const remainingSeconds = Math.floor((remainingTime - remainingMinutes) * 60)
    const mediaType = loaiTinNhan === "image" ? "ảnh" : "video"

    const result = await Swal.fire({
      title: `Thu hồi ${mediaType}?`,
      html: `
        <p>Bạn có chắc chắn muốn thu hồi ${mediaType} này?</p>
        <p style="color: #ff6b6b; font-size: 14px;">
          <i class="fa fa-clock"></i> 
          Thời gian còn lại: ${remainingMinutes}:${remainingSeconds.toString().padStart(2, "0")}
        </p>
        <p style="color: #666; font-size: 12px;">${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} sẽ bị xóa vĩnh viễn khỏi cuộc trò chuyện và Cloudinary.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Thu hồi",
      cancelButtonText: "Hủy",
    })

    if (result.isConfirmed) {
      try {
        if (connectionRef.current && connectionRef.current.state === "Connected") {
          await connectionRef.current.invoke("ThuHoiAnhVideo", maTinNhan, user.id)
          Swal.fire({
            icon: "success",
            title: "Đã thu hồi",
            text: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} đã được thu hồi thành công.`,
            timer: 2000,
            showConfirmButton: false,
          })
        } else {
          throw new Error("Kết nối SignalR không sẵn sàng")
        }
      } catch (error) {
        console.error("Media recall error:", error)
        Swal.fire({
          icon: "error",
          title: "Lỗi thu hồi",
          text: error.message || `Không thể thu hồi ${mediaType}. Vui lòng thử lại.`,
          confirmButtonColor: "#d33",
        })
      }
    }

    closeAllMessageMenus()
  }

  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl)
    closeAllMessageMenus()
  }

  const closeImageModal = () => {
    setModalImage(null)
  }

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (modalImage) {
          closeImageModal()
        } else {
          closeAllMessageMenus()
        }
      }
    }

    const handleClickOutside = (event) => {
      if (!event.target.closest(".message-menu-container") && !event.target.closest(".chatbox-header-menu")) {
        closeAllMessageMenus()
      }
    }

    document.addEventListener("keydown", handleEscKey)
    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("keydown", handleEscKey)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [modalImage])

  // Updated fetchChatInfo function
  useEffect(() => {
    if (!maCuocTroChuyen) return

    const fetchChatInfo = async () => {
      try {
        // Lấy info tin đăng và chủ sản phẩm từ enhanced endpoint
        const res = await fetch(`http://localhost:5133/api/chat/info/${maCuocTroChuyen}`)
        if (!res.ok) throw new Error("Lỗi lấy thông tin cuộc trò chuyện")
        const data = await res.json()

        // Set info tin đăng với enhanced status data
        setInfoTinDang({
          tieuDe: data.tieuDeTinDang,
          gia: data.giaTinDang,
          anh: data.anhDaiDienTinDang,
          maTinDang: data.maTinDang,
          avatarChuSanPham: data.avatarChuSanPham || "",
          tenChuSanPham: data.tenChuSanPham || "",
          // Use enhanced status from backend
          isOnline: data.trangThaiChuSanPham?.isOnline || false,
          lastOnlineTime: data.trangThaiChuSanPham?.lastActive || null,
          formattedLastSeen: data.trangThaiChuSanPham?.formattedLastSeen || null,
          maChuSanPham: data.maChuSanPham || null,
        })

        // Set info người còn lại với enhanced status
        if (data.maNguoiConLai) {
          setMaNguoiConLai(data.maNguoiConLai)
          setInfoNguoiConLai({
            id: data.maNguoiConLai,
            avatar: data.avatarNguoiConLai || "",
            ten: data.tenNguoiConLai || "",
            // Use enhanced status from backend
            isOnline: data.trangThaiNguoiConLai?.isOnline || false,
            lastOnlineTime: data.trangThaiNguoiConLai?.lastActive || null,
            formattedLastSeen: data.trangThaiNguoiConLai?.formattedLastSeen || null,
          })
        }

        // Kiểm tra block status (keep existing logic)
        if (data.maNguoiConLai) {
          const resBlockMe = await fetch(`http://localhost:5133/api/chat/check-block/${user.id}/${data.maNguoiConLai}`)
          const dataBlockMe = await resBlockMe.json()
          setIsBlockedByMe(dataBlockMe.IsBlocked)

          const resBlockOther = await fetch(
            `http://localhost:5133/api/chat/check-block/${data.maNguoiConLai}/${user.id}`,
          )
          const dataBlockOther = await resBlockOther.json()
          setIsBlockedByOther(dataBlockOther.IsBlocked)
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin cuộc trò chuyện:", error)
      }
    }

    fetchChatInfo()
  }, [maCuocTroChuyen, user.id])

  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return

    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5133/api/chat/history/${maCuocTroChuyen}?userId=${user.id}`)
        if (!response.ok) throw new Error("Lỗi lấy lịch sử chat: " + response.status)
        const data = await response.json()
        setDanhSachTin(
          data.map((msg) => {
            let timeStr = msg.thoiGianGui
            if (!timeStr.endsWith("Z")) timeStr += "Z"
            return {
              ...msg,
              thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
              thoiGianGui: timeStr,
              daXem: msg.daXem || false,
            }
          }),
        )
      } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error)
        Swal.fire("Lỗi", error.message || "Không thể lấy lịch sử chat", "error")
      }
    }

    fetchHistory()
  }, [maCuocTroChuyen, user?.id])

  useEffect(() => {
    console.log("Danh sách tin hiện tại:", danhSachTin)
  }, [danhSachTin])

  // Enhanced SignalR setup with unified status handling
  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return
    let isMounted = true

    const setupSignalR = async () => {
      await signalRService.start()
      await signalRService.invoke("ThamGiaCuocTroChuyen", maCuocTroChuyen)

      // Unified user status change handler - handles both online/offline updates
      const handleUserStatusChanged = (data) => {
        if (!isMounted || !data) return

        console.log("UserStatusChanged received:", data)

        // Handle different field name variations from backend
        const userId = data.userId || data.userid || data.UserId
        const isOnline = data.isOnline ?? data.IsOnline ?? false
        const lastActive = data.lastSeen || data.lastActive || data.LastActive || null
        const formattedLastSeen = data.formattedLastSeen || null

        // Update info for người còn lại (customer/other participant)
        if (userId === infoNguoiConLai.id) {
          setInfoNguoiConLai((prev) => ({
            ...prev,
            isOnline,
            lastOnlineTime: isOnline ? null : lastActive,
            formattedLastSeen: isOnline ? null : formattedLastSeen,
          }))
        }

        // Update info for chủ sản phẩm (product owner)
        if (userId === infoTinDang.maChuSanPham) {
          setInfoTinDang((prev) => ({
            ...prev,
            isOnline,
            lastOnlineTime: isOnline ? null : lastActive,
            formattedLastSeen: isOnline ? null : formattedLastSeen,
          }))
        }
      }

      // Register the unified handler for all status-related events
      signalRService.on("UserStatusChanged", handleUserStatusChanged)

      // Keep existing message handlers
      signalRService.on("NhanTinNhan", (msg) => {
        if (!isMounted) return
        let timeStr = msg.thoiGianGui
        if (!timeStr.endsWith("Z")) timeStr += "Z"
        const newMsg = {
          ...msg,
          thoiGian: new Date(timeStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          thoiGianGui: timeStr,
          daXem: msg.daXem || false,
        }
        const hiddenChats = JSON.parse(localStorage.getItem("hiddenChats")) || []
        const isHidden = hiddenChats.includes(maCuocTroChuyen)
        const isOwnMessage = msg.maNguoiGui === user?.id
        if (!isHidden || isOwnMessage) {
          setDanhSachTin((prev) => [...prev, newMsg])
        }
      })

      signalRService.on("TinNhanDaThuHoi", (data) => {
        if (!isMounted) return
        const { maTinNhan } = data
        setDanhSachTin((prev) => prev.filter((msg) => msg.maTinNhan !== maTinNhan))
        closeAllMessageMenus()
      })

      signalRService.on("CapNhatTinDang", (updatedPost) => {
        if (!isMounted) return
        const maTinDangHT = maCuocTroChuyen.split("-").pop()
        if (updatedPost.MaTinDang?.toString() === maTinDangHT?.toString()) {
          setInfoTinDang((prev) => ({
            ...prev,
            tieuDe: updatedPost.TieuDe || updatedPost.tieuDe || prev.tieuDe,
            gia: updatedPost.Gia || updatedPost.gia || prev.gia,
            anh: updatedPost.AnhDaiDien || updatedPost.anhDaiDien || prev.anh,
            maTinDang: updatedPost.MaTinDang || prev.maTinDang,
          }))
        }
      })

      signalRService.on("DaXemTinNhan", (data) => {
        if (!isMounted) return
        const MaTinNhanCuoi = data?.MaTinNhanCuoi || data?.maTinNhanCuoi
        if (MaTinNhanCuoi) {
          setDanhSachTin((prev) => {
            return prev.map((msg) => {
              const isMatch =
                msg.maTinNhan == MaTinNhanCuoi ||
                msg.maTinNhan === MaTinNhanCuoi ||
                msg.maTinNhan.toString() === MaTinNhanCuoi.toString()
              return isMatch ? { ...msg, daXem: true } : msg
            })
          })
        }
      })

      connectionRef.current = signalRService
      setIsConnected(true)
    }

    setupSignalR()

    return () => {
      isMounted = false
      signalRService.off("UserStatusChanged")
      signalRService.off("NhanTinNhan")
      signalRService.off("TinNhanDaThuHoi")
      signalRService.off("CapNhatTinDang")
      signalRService.off("DaXemTinNhan")
      setIsConnected(false)
    }
  }, [maCuocTroChuyen, user?.id, infoNguoiConLai.id, infoTinDang.maChuSanPham])

  // Enhanced periodic status refresh - refreshes every 30 seconds
  useEffect(() => {
    if (!isConnected || !user?.id) return

    const refreshStatus = async () => {
      try {
        // Refresh status for người còn lại if available
        if (infoNguoiConLai.id) {
          const status = await fetchUserStatus(infoNguoiConLai.id)
          if (status) {
            setInfoNguoiConLai((prev) => ({
              ...prev,
              isOnline: status.isOnline,
              lastOnlineTime: status.lastActive,
              formattedLastSeen: status.formattedLastSeen,
            }))
          }
        }

        // Refresh status for chủ sản phẩm if available
        if (infoTinDang.maChuSanPham) {
          const status = await fetchUserStatus(infoTinDang.maChuSanPham)
          if (status) {
            setInfoTinDang((prev) => ({
              ...prev,
              isOnline: status.isOnline,
              lastOnlineTime: status.lastActive,
              formattedLastSeen: status.formattedLastSeen,
            }))
          }
        }
      } catch (error) {
        console.error("Error refreshing user status:", error)
      }
    }

    // Refresh immediately on mount
    refreshStatus()

    // Then refresh every 30 seconds
    const statusInterval = setInterval(refreshStatus, 30000)

    return () => clearInterval(statusInterval)
  }, [isConnected, user?.id, infoNguoiConLai.id, infoTinDang.maChuSanPham])

  // Enhanced Ping with error handling and retry logic
  useEffect(() => {
    if (!isConnected || !user?.id) return

    let retryCount = 0
    const maxRetries = 3

    const sendPing = async () => {
      try {
        await signalRService.invoke("Ping")
        retryCount = 0 // Reset on success
      } catch (error) {
        console.error("Ping failed:", error)
        retryCount++

        if (retryCount >= maxRetries) {
          console.error("Max ping retries reached, connection may be lost")
          setIsConnected(false)
          // Optionally trigger reconnection logic here
        }
      }
    }

    // Send ping every 15 seconds (faster than backend timeout of 30s)
    const pingInterval = setInterval(sendPing, 15000)

    return () => clearInterval(pingInterval)
  }, [isConnected, user?.id])

  // Force update for status text every minute when offline
  useEffect(() => {
    if (!shouldShowStatus || displayIsOnline || !displayLastOnline) return

    // Update immediately
    forceUpdate((v) => v + 1)

    const updateInterval = setInterval(() => {
      forceUpdate((v) => v + 1)
    }, 60000) // Update every minute

    return () => clearInterval(updateInterval)
  }, [shouldShowStatus, displayIsOnline, displayLastOnline])

  useEffect(() => {
    setIsFirstLoad(true)
  }, [maCuocTroChuyen])

  useEffect(() => {
    if (danhSachTin.length > 0) {
      if (isFirstLoad) {
        scrollToBottom(true)
        setIsFirstLoad(false)
      } else {
        scrollToBottom(false)
      }
    }

    const timer = setTimeout(() => {
      if (connectionRef.current && isConnected && user && maCuocTroChuyen) {
        connectionRef.current.invoke("DanhDauDaXem", maCuocTroChuyen, user.id).catch(console.error)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [danhSachTin, isConnected, maCuocTroChuyen, user])

  const lastSeenMsgId = React.useMemo(() => {
    if (!user) return null
    const myMessages = danhSachTin.filter((m) => m.maNguoiGui === user.id)
    if (myMessages.length === 0) return null
    const lastMessage = myMessages.sort((a, b) => new Date(b.thoiGianGui) - new Date(a.thoiGianGui))[0]
    return lastMessage.daXem ? lastMessage.maTinNhan : null
  }, [danhSachTin, user])

  const handleFileInputChange = (e, type) => {
    const files = Array.from(e.target.files)
    if (type === "image") {
      setImagePreviewList((prev) => [...prev, ...files.filter((f) => f.type.startsWith("image"))])
    } else {
      setVideoPreviewList((prev) => [...prev, ...files.filter((f) => f.type.startsWith("video"))])
    }
    e.target.value = null
  }

  const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
    formData.append("folder", "doan-chat")
    try {
      const { data } = await axios.post(CLOUDINARY_URL, formData)
      console.log(`Uploaded media to Cloudinary: ${data.secure_url}, public_id: ${data.public_id}`)
      return data.secure_url
    } catch (err) {
      console.error("Upload error:", err)
      Swal.fire("Lỗi", "Không thể upload file lên Cloudinary!", "error")
      return null
    }
  }

  const handleSend = async () => {
    if (!tinNhan.trim() && imagePreviewList.length === 0 && videoPreviewList.length === 0) {
      Swal.fire("Lỗi", "Vui lòng nhập tin nhắn hoặc gửi ảnh/video", "error")
      return
    }
    if (isBlockedByOther || isBlockedByMe) {
      Swal.fire("Lỗi", "Không thể gửi tin nhắn vì một trong hai người đã chặn người kia.", "error")
      return
    }
    if (!isConnected) {
      Swal.fire("Lỗi", "Kết nối SignalR không sẵn sàng!", "error")
      return
    }
    try {
      if (tinNhan.trim()) {
        await signalRService.invoke("GuiTinNhan", maCuocTroChuyen, user.id, tinNhan.trim(), "text")
      }
      for (const file of imagePreviewList) {
        const url = await uploadToCloudinary(file)
        if (url) {
          await signalRService.invoke("GuiTinNhan", maCuocTroChuyen, user.id, url, "image")
        }
      }
      for (const file of videoPreviewList) {
        const url = await uploadToCloudinary(file)
        if (url) {
          await signalRService.invoke("GuiTinNhan", maCuocTroChuyen, user.id, url, "video")
        }
      }
      setTinNhan("")
      setImagePreviewList([])
      setVideoPreviewList([])
      inputRef.current?.focus()
    } catch (err) {
      Swal.fire("Lỗi", err.message || "Không thể gửi tin nhắn!", "error")
      console.error("Send error:", err)
    }
  }

  const handleImageClick = () => {
    console.log('handleImageClick:', infoTinDang.maTinDang);
    if (infoTinDang.maTinDang) {
      try {
        navigate(`/tin-dang/${infoTinDang.maTinDang}`);
        setTimeout(() => {
          // Nếu sau 300ms vẫn chưa chuyển trang, dùng window.location.href
          if (window.location.pathname !== `/tin-dang/${infoTinDang.maTinDang}`) {
            window.location.href = `/tin-dang/${infoTinDang.maTinDang}`;
          }
        }, 300);
      } catch (e) {
        window.location.href = `/tin-dang/${infoTinDang.maTinDang}`;
      }
    } else {
      Swal.fire("Lỗi", "Không tìm thấy mã tin đăng để chuyển trang.", "error")
    }
  }

  return (
    <div className="chatbox-container">
      <div className="chatbox-header">
        {/* Khung 1: Avatar chủ sản phẩm, trạng thái online, thời gian lần cuối online */}

        <div className="chatbox-seller-frame">
          <div className="chatbox-avatar-status-group">
            <div className="chatbox-avatar-wrapper">
              <img
                src={displayAvatar || "/src/assets/default-avatar.png"}
                alt="avatar"
                className="chatbox-seller-avatar"
              />
              {/* Chỉ hiển thị chấm trạng thái nếu có info đối phương */}
              {shouldShowStatus && (
                <span className={displayIsOnline ? "chatbox-status-dot online" : "chatbox-status-dot offline"}></span>
              )}
            </div>
            <div className="chatbox-seller-meta">
              <span className="chatbox-seller-name">{displayTen || "Chủ sản phẩm"}</span>
              {/* Chỉ hiển thị dòng trạng thái nếu có trạng thái hợp lệ */}
              {shouldShowStatus && getLastOnlineText() && (
                <span className="chatbox-last-online">{getLastOnlineText()}</span>
              )}
            </div>
          </div>
          <div className="chatbox-header-menu">
            {!isBlockedByMe && !isBlockedByOther ? (
              <button className="chatbox-header-menu-button" onClick={handleBlockUser} data-tooltip="Chặn người dùng này">
                <FaBan size={20} />
                <span>Chặn</span>
              </button>
            ) : isBlockedByMe ? (
              <button
                className="chatbox-header-menu-button unblock"
                onClick={handleUnblockUser}
                data-tooltip="Gỡ chặn người dùng"
              >
                <FaUnlock size={20} />
                <span>Gỡ chặn</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Khung 2: Ảnh tin đăng, giá, tên sản phẩm (giữ nguyên như cũ) */}
        <div className="chatbox-product-frame" onClick={handleImageClick}>
          <div className="chatbox-product-info">
            <img src={getFullImageUrl(infoTinDang.anh)} alt="Ảnh tin đăng" className="chatbox-product-img" />
            <div className="chatbox-product-meta">
              <span className="chatbox-product-name">{infoTinDang.tieuDe}</span>
              <span className="chatbox-product-price">
                {infoTinDang.gia.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
              </span>
            </div>
          </div>
        </div>

      </div>

      <div className="chatbox-messages">
        {danhSachTin.length === 0 ? (
          <div className="chatbox-empty-chat">
            <div className="chatbox-empty-icon">💬</div>
            <p>Chưa có tin nhắn nào</p>
            <p>Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          danhSachTin.map((msg, idx) => (
            <div key={idx} className="message-wrapper">
              <div className={`message ${msg.maNguoiGui === user?.id ? "sent" : "received"}`}>
                <div className="message-content">
                  {msg.loaiTinNhan === "image" ? (
                    <img
                      src={msg.noiDung}
                      alt="img-chat"
                      className="message-image clickable-media"
                      onClick={() => openImageModal(msg.noiDung)}
                    />
                  ) : msg.loaiTinNhan === "video" ? (
                    <video src={msg.noiDung} controls className="message-video" />
                  ) : (
                    <p>{msg.noiDung}</p>
                  )}
                </div>
                <div className="message-info">
                  <div className="message-time">{formatTime(msg.thoiGian)}</div>
                  {msg.maNguoiGui === user?.id && msg.maTinNhan === lastSeenMsgId && (
                    <div className="message-status">Đã xem</div>
                  )}
                </div>

                {msg.maNguoiGui === user?.id && (
                  <div className="message-menu-container">
                    <button
                      className="message-menu-trigger"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleMessageMenu(msg.maTinNhan)
                      }}
                    >
                      <FaEllipsisV size={12} />
                    </button>

                    {messageMenus[msg.maTinNhan] && (
                      <div className="message-menu">
                        {canRecallMessage(msg.thoiGianGui) ? (
                          <button
                            className="message-menu-item recall-available"
                            onClick={() => {
                              if (msg.loaiTinNhan === "image" || msg.loaiTinNhan === "video") {
                                handleRecallMediaMessage(msg.maTinNhan, msg.thoiGianGui, msg.loaiTinNhan)
                              } else {
                                handleRecallTextMessage(msg.maTinNhan, msg.thoiGianGui)
                              }
                            }}
                          >
                            <FaTrash size={12} />
                            <span>Thu hồi</span>
                            <div className="recall-timer">
                              <FaClock size={10} />
                              {Math.floor(getRecallTimeRemaining(msg.thoiGianGui))}:
                              {Math.floor((getRecallTimeRemaining(msg.thoiGianGui) % 1) * 60)
                                .toString()
                                .padStart(2, "0")}
                            </div>
                          </button>
                        ) : (
                          <button className="message-menu-item recall-disabled" disabled>
                            <FaTrash size={12} />
                            <span>Hết hạn thu hồi</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {(isBlockedByMe || isBlockedByOther) && (
          <div className="chatbox-blocked-notice">
            <FaBan size={24} />
            <p>{isBlockedByMe ? "Bạn đã chặn người dùng này." : "Bạn đã bị chặn bởi người dùng này."}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbox-input-container">
        {!isConnected && <div className="connection-warning">⚠️ Mất kết nối. Đang thử kết nối lại...</div>}
        <div
          className="chatbox-input"
          style={{
            opacity: isBlockedByMe || isBlockedByOther ? 0.5 : 1,
            pointerEvents: isBlockedByMe || isBlockedByOther ? "none" : "auto",
          }}
        >
          <div className="chatbox-media-upload-group">
            <label className="chatbox-media-upload-label">
              <FaImage size={28} />
              <input
                type="file"
                style={{ display: "none" }}
                onChange={(e) => handleFileInputChange(e, "image")}
                accept="image/*"
                multiple
              />
            </label>
            <label className="chatbox-media-upload-label">
              <FaVideo size={28} />
              <input
                type="file"
                style={{ display: "none" }}
                onChange={(e) => handleFileInputChange(e, "video")}
                accept="video/*"
                multiple
              />
            </label>
          </div>
          <div className="input-field">
            <textarea
              ref={inputRef}
              value={tinNhan}
              onChange={(e) => setTinNhan(e.target.value)}
              placeholder={isBlockedByMe || isBlockedByOther ? "Không thể gửi tin nhắn" : "Nhập tin nhắn..."}
              disabled={isBlockedByMe || isBlockedByOther}
            />
          </div>
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={
              isBlockedByMe ||
              isBlockedByOther ||
              !(tinNhan.trim() || imagePreviewList.length || videoPreviewList.length)
            }
          >
            ➔
          </button>
        </div>
        <div className="chatbox-media-preview-list">
          {imagePreviewList.map((file, idx) => (
            <div key={idx} className="chatbox-media-thumb">
              <button
                className="chatbox-media-thumb-remove"
                onClick={() => setImagePreviewList(imagePreviewList.filter((_, i) => i !== idx))}
              >
                ×
              </button>
              <img src={URL.createObjectURL(file)} alt={`preview-img-${idx}`} />
            </div>
          ))}
          {videoPreviewList.map((file, idx) => (
            <div key={idx} className="chatbox-media-thumb">
              <button
                className="chatbox-media-thumb-remove"
                onClick={() => setVideoPreviewList(videoPreviewList.filter((_, i) => i !== idx))}
              >
                ×
              </button>
              <video src={URL.createObjectURL(file)} controls />
            </div>
          ))}
        </div>
      </div>

      {modalImage && (
        <div className="media-modal-overlay" onClick={closeImageModal}>
          <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="media-modal-close" onClick={closeImageModal}>
              <FaTimes size={24} />
            </button>
            <img src={modalImage} alt="Phóng to ảnh" className="media-modal-image" />
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatBox
