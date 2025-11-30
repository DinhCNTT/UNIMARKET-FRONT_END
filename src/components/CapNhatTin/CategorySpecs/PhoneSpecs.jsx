import React from "react";
import styles from "../CapNhatTin.module.css";

const PhoneSpecs = ({ data, onChange, errors }) => {
  const brands = ["Apple", "Samsung", "Xiaomi", "Oppo", "Vivo", "Huawei", "Nokia", "Sony", "Khác"];
  const colors = ["Đen", "Trắng", "Đỏ", "Xanh dương", "Xanh lá", "Vàng", "Bạc", "Xám", "Hồng", "Tím"];
  const storages = ["< 16GB", "16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "> 1TB"];
  const warranties = ["Hết bảo hành", "Còn bảo hành", "Bảo hành chính hãng", "Bảo hành cửa hàng"];

  return (
    <div className={styles.dynamicBox}>
      <label className={styles.dynamicTitle}>
        Thông tin chi tiết (Điện thoại)
      </label>
      
      <div className={styles.dynamicGrid}>
        {/* Hãng sản xuất */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Hãng sản xuất <span style={{color: 'red'}}>*</span>
          </label>
          <select 
            className={`${styles.select} ${errors?.Hang ? styles.inputError : ''}`}
            value={data.Hang || ""} 
            onChange={(e) => onChange("Hang", e.target.value)}
          >
            <option value="">Chọn hãng</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors?.Hang && <span className={styles.errorText}>Vui lòng chọn hãng</span>}
        </div>

        {/* Màu sắc */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Màu sắc <span style={{color: 'red'}}>*</span>
          </label>
          <select 
            className={`${styles.select} ${errors?.MauSac ? styles.inputError : ''}`}
            value={data.MauSac || ""} 
            onChange={(e) => onChange("MauSac", e.target.value)}
          >
            <option value="">Chọn màu</option>
            {colors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors?.MauSac && <span className={styles.errorText}>Vui lòng chọn màu</span>}
        </div>

        {/* Dung lượng */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Dung lượng <span style={{color: 'red'}}>*</span>
          </label>
          <select 
            className={`${styles.select} ${errors?.DungLuong ? styles.inputError : ''}`}
            value={data.DungLuong || ""} 
            onChange={(e) => onChange("DungLuong", e.target.value)}
          >
            <option value="">Chọn dung lượng</option>
            {storages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors?.DungLuong && <span className={styles.errorText}>Vui lòng chọn dung lượng</span>}
        </div>

        {/* Bảo hành */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Bảo hành <span style={{color: 'red'}}>*</span>
          </label>
          <select 
            className={`${styles.select} ${errors?.BaoHanh ? styles.inputError : ''}`}
            value={data.BaoHanh || ""} 
            onChange={(e) => onChange("BaoHanh", e.target.value)}
          >
            <option value="">Chọn bảo hành</option>
            {warranties.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          {errors?.BaoHanh && <span className={styles.errorText}>Vui lòng chọn bảo hành</span>}
        </div>
      </div>

      <div className={styles.formGroup} style={{ marginTop: "15px" }}>
        <label className={styles.label}>Xuất xứ</label>
        <input 
          type="text" 
          className={styles.input} 
          placeholder="VD: Việt Nam, Hàn Quốc..." 
          value={data.XuatXu || ""} 
          onChange={(e) => onChange("XuatXu", e.target.value)} 
        />
      </div>
    </div>
  );
};

export default PhoneSpecs;