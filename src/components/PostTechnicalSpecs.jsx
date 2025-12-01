import React from "react";
import styles from "./PostTechnicalSpecs.module.css";

const PostTechnicalSpecs = ({ detailsJson }) => {
  // 1. Kiểm tra nếu không có dữ liệu thì không hiển thị gì cả
  if (!detailsJson) return null;

  // 2. Parse JSON
  let specs = null;
  try {
    specs = typeof detailsJson === "string" ? JSON.parse(detailsJson) : detailsJson;

    // Nếu object rỗng cũng không hiển thị
    if (Object.keys(specs).length === 0) return null;
  } catch (error) {
    console.error("Lỗi parse thông số kỹ thuật:", error);
    return null;
  }

  // 3. Bảng dịch từ khóa sang tiếng Việt có dấu
  const labelMapping = {
    "Hang": "Hãng",
    "MauSac": "Màu sắc",
    "DungLuong": "Dung lượng",
    "BaoHanh": "Bảo hành",
    "XuatXu": "Xuất xứ",
    // Thêm các trường khác nếu sau này mở rộng (VD: Laptop)
    "Ram": "RAM",
    "Cpu": "Vi xử lý",
    "OCung": "Ổ cứng"
  };

  return (
    <div className={styles.specsContainer}>
      <h3 className={styles.specsTitle}>Thông tin chi tiết</h3>

      <div className={styles.specsTable}>
        {Object.entries(specs).map(([key, value]) => {
          if (!value) return null; // Bỏ qua nếu giá trị rỗng
          return (
            <div key={key} className={styles.specRow}>
              <span className={styles.specLabel}>
                {labelMapping[key] || key} {/* Dùng tên tiếng Việt, nếu không có thì dùng key gốc */}
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