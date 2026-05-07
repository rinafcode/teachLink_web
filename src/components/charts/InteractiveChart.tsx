import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export type ChartType = 'line' | 'area' | 'bar';

interface InteractiveChartProps {
  data: any[];
  xKey: string;
  yKeys: { key: string; color: string; name?: string }[];
  type?: ChartType;
  height?: number | string;
  title?: string;
  syncId?: string;
  className?: string;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  xKey,
  yKeys,
  type = 'line',
  height = 300,
  title,
  syncId,
  className = '',
}) => {
  // Optimization for large datasets (10k+ points):
  // If data is very large, we can sample it or simplify it before rendering
  // But Recharts handles a few thousand points well. Let's add a simple sampling if data > 1000
  const optimizedData = useMemo(() => {
    if (!data || data.length <= 1000) return data;
    const factor = Math.ceil(data.length / 1000);
    return data.filter((_, index) => index % factor === 0);
  }, [data]);

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={optimizedData} syncId={syncId}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            {yKeys.map((yConfig) => (
              <Area
                key={yConfig.key}
                type="monotone"
                dataKey={yConfig.key}
                name={yConfig.name || yConfig.key}
                stroke={yConfig.color}
                fill={yConfig.color}
                fillOpacity={0.3}
                isAnimationActive={false} // Disable animation for large datasets
              />
            ))}
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={optimizedData} syncId={syncId}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            {yKeys.map((yConfig) => (
              <Bar
                key={yConfig.key}
                dataKey={yConfig.key}
                name={yConfig.name || yConfig.key}
                fill={yConfig.color}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        );
      case 'line':
      default:
        return (
          <LineChart data={optimizedData} syncId={syncId}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            {yKeys.map((yConfig) => (
              <Line
                key={yConfig.key}
                type="monotone"
                dataKey={yConfig.key}
                name={yConfig.name || yConfig.key}
                stroke={yConfig.color}
                strokeWidth={2}
                dot={false} // Remove dots to handle large datasets more smoothly
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">{title}</h3>}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
