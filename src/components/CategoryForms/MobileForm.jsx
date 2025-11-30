import React from "react";
// Import CSS module từ file cha
import styles from "../PostTinDang.module.css"; 

const MobileForm = ({ data, onChange }) => {
  // Dữ liệu mẫu dropdown
  const brands = ["Apple", "Samsung", "Xiaomi", "Oppo", "Vivo", "Huawei", "Nokia", "Sony", "Khác"];
  const colors = ["Đen", "Trắng", "Đỏ", "Xanh dương", "Xanh lá", "Vàng", "Bạc", "Xám", "Hồng", "Tím"];
  const storages = ["< 16GB", "16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "> 1TB"];
  const warranties = ["Hết bảo hành", "Còn bảo hành", "Bảo hành chính hãng", "Bảo hành cửa hàng"];

  const handleChange = (key, value) => {
    onChange(key, value);
  };

  return (
    // Đã xóa style width/margin cứng, dùng width 100% theo layout cha
    <div style={{ width: "100%", marginBottom: "20px" }}>
      <h3 style={{ marginBottom: "15px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        Thông tin chi tiết điện thoại
      </h3>

      {/* Hãng sản xuất */}
      <div className={styles.formGroup}>
        <label>Hãng sản xuất <span style={{ color: "red" }}>*</span></label>
        <select
          value={data.Hang || ""}
          onChange={(e) => handleChange("Hang", e.target.value)}
          required
        >
          <option value="">Chọn hãng</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Màu sắc & Dung lượng */}
      <div style={{ display: "flex", gap: "20px" }}>
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Màu sắc <span style={{ color: "red" }}>*</span></label>
          <select
            value={data.MauSac || ""}
            onChange={(e) => handleChange("MauSac", e.target.value)}
            required
          >
            <option value="">Chọn màu</option>
            {colors.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Dung lượng <span style={{ color: "red" }}>*</span></label>
          <select
            value={data.DungLuong || ""}
            onChange={(e) => handleChange("DungLuong", e.target.value)}
            required
          >
            <option value="">Chọn dung lượng</option>
            {storages.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Bảo hành & Xuất xứ */}
      <div style={{ display: "flex", gap: "20px" }}>
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Chính sách bảo hành</label>
          <select
            value={data.BaoHanh || ""}
            onChange={(e) => handleChange("BaoHanh", e.target.value)}
          >
            <option value="">Chọn bảo hành</option>
            {warranties.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Xuất xứ</label>
          <input
            type="text"
            placeholder="VD: Việt Nam, Hàn Quốc..."
            value={data.XuatXu || ""}
            onChange={(e) => handleChange("XuatXu", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileForm;