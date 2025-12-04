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
// Import icons từ lucide-react
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../utils/formatters'; 
import styles from './MarketWaveChart.module.css';

const MarketWaveChart = ({ data }) => {
  if (!data) return null;

  const { minPrice, maxPrice, averagePrice, currentPrice, status, differencePercent, sampleSize } = data;

  // 1. Cấu hình màu sắc & ICON tương ứng
  const theme = useMemo(() => {
    if (status === "Rẻ hơn thị trường") {
      return { 
        color: "#3b82f6", 
        id: "colorBlue", 
        rgb: "59, 130, 246",
        Icon: TrendingDown // Icon giảm
      }; 
    }
    if (status === "Cao hơn thị trường") {
      return { 
        color: "#ef4444", 
        id: "colorRed", 
        rgb: "239, 68, 68",
        Icon: TrendingUp // Icon tăng
      }; 
    }
    return { 
      color: "#10b981", 
      id: "colorGreen", 
      rgb: "16, 185, 129",
      Icon: CheckCircle2 // Icon tích xanh
    }; 
  }, [status]);

  // 2. Tạo dữ liệu Bell Curve
  const chartData = useMemo(() => [
    { price: minPrice, density: 0.15, label: 'thấp nhất' },
    { price: averagePrice, density: 1, label: 'hợp lý' },
    { price: maxPrice, density: 0.15, label: 'cao nhất' },
  ], [minPrice, averagePrice, maxPrice]);

  // 3. Mở rộng trục X
  const xDomain = [
    Math.min(minPrice, currentPrice) * 0.95,
    Math.max(maxPrice, currentPrice) * 1.05
  ];

  // Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <span className={styles.tooltipLabel}>Mức giá {payload[0].payload.label}: </span>
          <span className={styles.tooltipValue} style={{ color: theme.color }}>
            {formatPrice(payload[0].payload.price)}
          </span>
        </div>
      );
    }
    return null;
  };

  // Lấy ra Icon Component để render
  const StatusIcon = theme.Icon;

  return (
    <div className={styles.chartContainer} style={{ '--theme-color': theme.color }}>
      {/* --- HEADER --- */}
      <div className={styles.header}>
        <span className={styles.title}>Khoảng giá AI</span>
        
        {/* Badge trạng thái với Icon mới */}
        <div className={styles.badge}>
          <StatusIcon size={14} strokeWidth={2.5} /> {/* Render Icon ở đây */}
          <span style={{ marginLeft: 4 }}>{Math.abs(differencePercent)}%</span>
        </div>
      </div>

      {/* --- CHART AREA --- */}
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={theme.id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.color} stopOpacity={0.5} />
                <stop offset="95%" stopColor={theme.color} stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis 
              dataKey="price" 
              type="number" 
              domain={xDomain} 
              tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(1)}tr` : value}
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              tickMargin={4}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            
            <YAxis hide type="number" domain={[0, 1.2]} />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: theme.color, strokeWidth: 1, strokeDasharray: '2 2' }} />

            <Area
              type="monotone"
              dataKey="density"
              stroke={theme.color}
              strokeWidth={2}
              fill={`url(#${theme.id})`}
              animationDuration={1000}
            />

            <ReferenceLine x={currentPrice} stroke={theme.color} strokeDasharray="2 2">
              <Label 
                value="Bạn ở đây" 
                position="top" 
                fill={theme.color} 
                fontSize={10} 
                fontWeight="700"
                offset={2}
              />
            </ReferenceLine>

            <ReferenceLine x={currentPrice} stroke="none">
               <Label 
                 content={({ viewBox }) => {
                   const { x, height } = viewBox; 
                   return (
                     <circle cx={x} cy={height - 15} r={3.5} fill="#fff" stroke={theme.color} strokeWidth={2} />
                   )
                 }}
               />
            </ReferenceLine>

          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.footer}>
        Dựa trên {sampleSize} tin đăng 3 tháng qua
      </div>
    </div>
  );
};

export default MarketWaveChart;