import React from 'react';
import { formatPrice } from "../utils/formatters"; // Đảm bảo đường dẫn đúng

const MarketPriceChart = ({ data }) => {
  if (!data) return null;

  const { minPrice, maxPrice, currentPrice, status, differencePercent, sampleSize } = data;

  // Tính toán % vị trí hiển thị
  let percent = 0;
  if (maxPrice > minPrice) {
      percent = ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100;
  }
  // Giới hạn 0-100%
  percent = Math.min(Math.max(percent, 0), 100);

  // Chọn màu sắc theo logic
  let color = "#22c55e"; // Xanh lá (Hợp lý)
  if (status === "Rẻ hơn thị trường") color = "#3b82f6"; // Xanh dương
  if (status === "Cao hơn thị trường") color = "#ef4444"; // Đỏ

  return (
    <div style={{ 
        marginTop: '20px', padding: '15px', 
        backgroundColor: '#f8f9fa', borderRadius: '10px', border: '1px solid #eee' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#333' }}>Khoảng giá thị trường</span>
        <span style={{ 
            color: '#fff', backgroundColor: color, 
            padding: '3px 8px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold'
        }}>
          {status} {differencePercent !== 0 && `(${differencePercent > 0 ? '+' : ''}${differencePercent}%)`}
        </span>
      </div>

      {/* Vùng vẽ biểu đồ */}
      <div style={{ position: 'relative', height: '40px', marginTop: '15px', marginBottom: '20px' }}>
        
        {/* Thanh nền (Range Min-Max) */}
        <div style={{ 
            position: 'absolute', top: '18px', left: 0, right: 0, height: '6px', 
            backgroundColor: '#e0e0e0', borderRadius: '3px' 
        }}></div>
        
        {/* Thanh màu (Range phổ biến) */}
        <div style={{ 
            position: 'absolute', top: '18px', left: '0%', right: '0%', height: '6px', 
            background: 'linear-gradient(90deg, #3b82f6, #22c55e)', borderRadius: '3px'
        }}></div>

        {/* Marker (Giá hiện tại) */}
        <div style={{
            position: 'absolute', left: `${percent}%`, top: '10px',
            width: '20px', height: '20px', backgroundColor: '#fff',
            border: `4px solid ${color}`, borderRadius: '50%',
            transform: 'translateX(-50%)', zIndex: 2, 
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
             {/* Tooltip giá */}
             <div style={{
                 position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                 background: '#333', color: '#fff', padding: '2px 6px', borderRadius: '4px',
                 fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 'bold'
             }}>
                 {formatPrice(currentPrice)}
             </div>
        </div>

        {/* Text Min/Max */}
        <span style={{ position: 'absolute', top: '28px', left: 0, fontSize: '11px', color: '#888' }}>
            {formatPrice(minPrice)}
        </span>
        <span style={{ position: 'absolute', top: '28px', right: 0, fontSize: '11px', color: '#888' }}>
            {formatPrice(maxPrice)}
        </span>
      </div>
      
      <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
        * Phân tích từ {sampleSize} tin đăng tương tự trong 3 tháng qua.
      </div>
    </div>
  );
};

export default MarketPriceChart;