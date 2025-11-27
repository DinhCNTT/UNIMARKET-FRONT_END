import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../components/NotificationsModals/context/NotificationContext';
import './QuanLyBaoCao.css';

// Vite exposes env vars via import.meta.env. Use VITE_API_URL in .env if needed.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5133';

export default function QuanLyBaoCao() {
  const { user, token } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const t = user?.token || localStorage.getItem('token') || token;
      const url = `${API_BASE.replace(/\/$/, '')}/api/reports?page=1&pageSize=200`;
      const res = await axios.get(url, {
        headers: t ? { Authorization: `Bearer ${t}` } : {}
      });
      setReports(res.data.items || []);
    } catch (err) {
      console.error('Lỗi khi lấy báo cáo', err);
      toast.error('Không thể tải danh sách báo cáo: ' + (err?.response?.data?.message || err.message || 'Lỗi'), { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on mount; if token isn't available the request may 401/403 but we'll surface that in debug
    fetchReports();
  }, []);

  // Listen for real-time incoming reports from NotificationContext
  const { reportReceived, clearReport } = useContext(NotificationContext);
  useEffect(() => {
    if (!reportReceived) return;
    try {
      // Normalize incoming payload to match existing `reports` items shape
      const r = {
        MaBaoCao: reportReceived.id,
        reporterId: reportReceived.reporterId,
        targetType: reportReceived.targetType,
        targetId: reportReceived.targetId,
        reason: reportReceived.reason,
        details: reportReceived.details,
        createdAt: reportReceived.createdAt,
        isResolved: false,
        reporter: { fullName: reportReceived.reporterName || reportReceived.reporterId }
      };
      setReports((prev) => [r, ...prev]);
    } catch (e) {
      console.warn('Error handling live report', e, reportReceived);
    } finally {
      clearReport();
    }
  }, [reportReceived]);

  const handleAction = async (reportId, action) => {
    if (!window.confirm(action === 'warn' ? 'Gửi cảnh báo tới người bán?':'Bạn có chắc chắn thực hiện hành động này?')) return;
    setProcessing(reportId + ':' + action);
    try {
      const t = user?.token || localStorage.getItem('token') || token;
      let url = `${API_BASE.replace(/\/$/, '')}/api/reports/${reportId}`;
      if (action === 'dismiss') url = `${url}/dismiss`;
      if (action === 'delete') url = `${url}/delete-post`;
      if (action === 'ban') url = `${url}/ban-user?days=30`;
      if (action === 'warn') url = `${url}/warn-seller`;

      console.debug('Admin action', { action, reportId, url, tokenPreview: t ? (t.slice ? t.slice(0,8) + '...' : 'present') : 'no-token' });
      // Some endpoints (like /dismiss) expect no JSON object body (they bind a raw string),
      // so send `null` for those to avoid model binding 400 errors.
      const body = action === 'dismiss' ? null : {};
      const res = await axios.post(url, body, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
      toast.success(res.data?.message || 'Thao tác thành công', { duration: 3000 });
      await fetchReports();
    } catch (err) {
      console.error('Action error', err);
      toast.error(err?.response?.data?.message || 'Lỗi khi thực hiện hành động', { duration: 4000 });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="manage-posts-container">
        <h2>Quản Lý Báo Cáo Tin</h2>
        

      {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="reports-table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mã tin đăng</th>
                  <th>Người báo</th>
                  <th>Lý do</th>
                  <th>Chi tiết</th>
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 && (
                  <tr><td colSpan={8}>Không có báo cáo</td></tr>
                )}
                {reports.map(r => {
                  const idVal = r.MaBaoCao ?? r.maBaoCao ?? r.id;
                  return (
                    <tr key={idVal}>
                      <td>{idVal}</td>
                      <td>{r.targetId}</td>
                      <td>{r.reporter?.fullName || r.reporter?.email || r.reporterId}</td>
                      <td>{r.reason}</td>
                      <td style={{ maxWidth: 260, whiteSpace: 'pre-wrap' }}>{r.details}</td>
                      <td>{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                      <td>{r.isResolved ? 'Đã xử lý' : 'Chưa xử lý'}</td>
                      <td>
                        {(() => {
                          const prefix = String(idVal) + ':';
                          const forThisRow = processing && String(processing).startsWith(prefix);
                          const disabledAll = r.isResolved || forThisRow;
                          return (
                            <>
                              <button onClick={() => handleAction(idVal, 'delete')} disabled={disabledAll}>{forThisRow && processing === (idVal + ':delete') ? 'Đang...' : 'Xóa bài'}</button>
                              <button onClick={() => handleAction(idVal, 'warn')} disabled={disabledAll}>{forThisRow && processing === (idVal + ':warn') ? 'Đang...' : 'Cảnh báo người bán'}</button>
                              <button onClick={() => handleAction(idVal, 'dismiss')} disabled={disabledAll}>{forThisRow && processing === (idVal + ':dismiss') ? 'Đang...' : 'Bỏ qua'}</button>
                            </>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      {/* Using global Sonner toaster in App.jsx - local ToastContainer removed to avoid duplicates */}
    </div>
  );
}
