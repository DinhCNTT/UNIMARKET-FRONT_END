import React from "react";
import styles from "./PostTechnicalSpecs.module.css";

// 1. Nhận thêm props condition và negotiable
const PostTechnicalSpecs = ({ detailsJson, condition, negotiable }) => {
  
  // 2. Parse JSON (Sửa lại logic một chút để không return null quá sớm nếu có Tình trạng)
  let specs = {};
  try {
    if (detailsJson) {
      specs = typeof detailsJson === "string" ? JSON.parse(detailsJson) : detailsJson;
    }
  } catch (error) {
    console.error("Lỗi parse thông số kỹ thuật:", error);
    specs = {}; // Nếu lỗi thì coi như object rỗng
  }

  // 3. Nếu không có specs VÀ không có thông tin tình trạng thì mới ẩn
  if (Object.keys(specs).length === 0 && !condition) return null;

  // 4. Bảng dịch từ khóa JSON sang tiếng Việt (Giữ nguyên)
  const labelMapping = {
    "Hang": "Hãng",
    "DongMay": "Dòng máy",
    "MauSac": "Màu sắc",
    "DungLuong": "Dung lượng",
    "BaoHanh": "Bảo hành",
    "XuatXu": "Xuất xứ",
    "Ram": "RAM",
    "Cpu": "Vi xử lý",
    "OCung": "Ổ cứng"
  };

  // 5. Hàm xử lý hiển thị Tình trạng
  const formatCondition = (val) => {
    if (!val) return "Không xác định";
    return val === "Moi" ? "Mới" : "Đã sử dụng";
  };

  return (
    <div className={styles.specsContainer}>
      <h3 className={styles.specsTitle}>Thông tin chi tiết</h3>

      <div className={styles.specsTable}>
        
        {/* --- PHẦN THÊM MỚI: Tình trạng & Thỏa thuận --- */}
        
        {/* Dòng Tình trạng */}
        {condition && (
          <div className={styles.specRow}>
            <span className={styles.specLabel}>Tình trạng</span>
            <span className={styles.specValue}>{formatCondition(condition)}</span>
          </div>
        )}

        {/* Dòng Thương lượng */}
        <div className={styles.specRow}>
          <span className={styles.specLabel}>Thương lượng</span>
          <span className={styles.specValue}>
            {negotiable ? "Có thể thương lượng" : "Không thương lượng"}
          </span>
        </div>

        {/* --- PHẦN CŨ: Duyệt qua JSON specs --- */}
        {Object.entries(specs).map(([key, value]) => {
          if (!value) return null;
          return (
            <div key={key} className={styles.specRow}>
              <span className={styles.specLabel}>
                {labelMapping[key] || key}
              </span>
              <span className={styles.specValue}>{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PostTechnicalSpecs;