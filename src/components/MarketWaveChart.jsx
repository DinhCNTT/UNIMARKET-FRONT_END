import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from 'recharts';
import { formatPrice } from '../utils/formatters'; // Import hàm format tiền của bạn
import styles from './MarketWaveChart.module.css';

const MarketWaveChart = ({ data }) => {
  if (!data) return null;

  const { minPrice, maxPrice, averagePrice, currentPrice, status, differencePercent, sampleSize } = data;

  // 1. Cấu hình màu sắc & Gradient (Xanh lá, Xanh dương, Đỏ)
  const theme = useMemo(() => {
    if (status === "Rẻ hơn thị trường") return { color: "#3b82f6", id: "colorBlue", rgb: "59, 130, 246" }; // Blue
    if (status === "Cao hơn thị trường") return { color: "#ef4444", id: "colorRed", rgb: "239, 68, 68" };   // Red
    return { color: "#10b981", id: "colorGreen", rgb: "16, 185, 129" };                                     // Green
  }, [status]);

  // 2. Tạo dữ liệu giả lập đường cong phân phối chuẩn (Bell Curve)
  // Ta tạo 3 điểm: Đầu (Min), Đỉnh (Avg), Cuối (Max)
  const chartData = useMemo(() => [
    { price: minPrice, density: 0.1, label: 'thấp nhất' },       // Điểm thấp
    { price: averagePrice, density: 1, label: 'hợp lý' },      // Đỉnh sóng 
    { price: maxPrice, density: 0.1, label: 'cao nhất' },        // Điểm cao
  ], [minPrice, averagePrice, maxPrice]);

  // 3. Mở rộng trục X để chứa cả giá hiện tại nếu nó nằm ngoài khoảng Min-Max
  const xDomain = [
    Math.min(minPrice, currentPrice) * 0.95, // Giảm 5% để tạo lề trái
    Math.max(maxPrice, currentPrice) * 1.05  // Tăng 5% để tạo lề phải
  ];

  // Component Tooltip tùy chỉnh
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>Mức giá {payload[0].payload.label || 'này'}</p>
          <p className={styles.tooltipValue} style={{ color: theme.color }}>
            {formatPrice(payload[0].payload.price)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartContainer} style={{ '--color-rgb': theme.rgb }}>
      {/* --- HEADER --- */}
      <div className={styles.header}>
        <span className={styles.title}>Định giá AI</span>
        <div className={styles.badge} style={{ backgroundColor: theme.color }}>
          {status === "Rẻ hơn thị trường" && <span>📉</span>}
          {status === "Cao hơn thị trường" && <span>📈</span>}
          {status === "Giá hợp lý" && <span>✅</span>}
          {Math.abs(differencePercent)}%
        </div>
      </div>

      {/* --- CHART AREA --- */}
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
          >
            {/* Định nghĩa Gradient màu */}
            <defs>
              <linearGradient id={theme.id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.color} stopOpacity={0.6} />
                <stop offset="95%" stopColor={theme.color} stopOpacity={0.05} />
              </linearGradient>
            </defs>

            {/* Trục X: Hiển thị giá */}
            <XAxis 
              dataKey="price" 
              type="number" 
              domain={xDomain} 
              tickFormatter={(value) => {
                 // Rút gọn số hiển thị trục X: 15.000.000 -> 15tr
                 return value >= 1000000 ? `${(value/1000000).toFixed(1)}tr` : value;
              }}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            
            {/* Trục Y: Ẩn đi vì chỉ cần hình dáng sóng */}
            <YAxis hide type="number" domain={[0, 'dataMax + 0.2']} />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: theme.color, strokeWidth: 1, strokeDasharray: '3 3' }} />

            {/* VẼ SÓNG (AREA) */}
            <Area
              type="monotone" // Tạo đường cong mềm mại
              dataKey="density"
              stroke={theme.color}
              strokeWidth={3}
              fill={`url(#${theme.id})`}
              animationDuration={1500}
            />

            {/* ĐƯỜNG KẺ CHỈ VỊ TRÍ GIÁ CỦA BẠN */}
            <ReferenceLine x={currentPrice} stroke={theme.color} strokeDasharray="3 3">
              <Label 
                value="Bạn ở đây" 
                position="top" 
                fill={theme.color} 
                fontSize={11} 
                fontWeight="bold"
                offset={10}
              />
            </ReferenceLine>

            {/* Điểm tròn đánh dấu giá hiện tại */}
            <ReferenceLine x={currentPrice} stroke="none">
               <Label 
                 content={({ viewBox }) => {
                   const { x, y } = viewBox; 
                   // Tính toán vị trí Y dựa trên đường cong (ước lượng)
                   // Hoặc đặt cố định ở giữa sóng
                   return (
                     <circle cx={x} cy={100} r={6} fill="#fff" stroke={theme.color} strokeWidth={3} />
                   )
                 }}
               />
            </ReferenceLine>

          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.footer}>
        Dựa trên phân tích {sampleSize} tin đăng tương tự 3 tháng qua
      </div>
    </div>
  );
};

export default MarketWaveChart;