import React, { useState } from 'react';
import useReport from './hooks/useReport';
import styles from './Report.module.css';

const defaultReasons = [
  { value: 'Spam', label: 'Spam / Rác' },
  { value: 'Inappropriate', label: 'Nội dung không phù hợp' },
  { value: 'Harassment', label: 'Quấy rối / Lăng mạ' },
  { value: 'Other', label: 'Khác' }
];

export default function ReportModal({ open, onClose, targetType, targetId, authToken, onReported }) {
  const { report } = useReport();
  const [reason, setReason] = useState(defaultReasons[0].value);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await report({ targetType, targetId, reason, details, token: authToken });
      setLoading(false);
      onClose && onClose();
      if (typeof onReported === 'function') onReported();
      // Optionally: show a toast in parent
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Lỗi khi gửi báo cáo');
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h3 className={styles.title}>Báo cáo nội dung</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Lý do
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={styles.select}>
              {defaultReasons.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Chi tiết (không bắt buộc)
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className={styles.textarea}
              maxLength={2000}
              placeholder="Mô tả thêm (ví dụ: đường link, thời gian, mô tả...)"
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
