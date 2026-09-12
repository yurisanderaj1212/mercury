import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export interface PriceDataPoint {
  date: string;
  avgPrice: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface MarketChartProps {
  data: PriceDataPoint[];
  currency: string;
  height?: number;
  showMinMax?: boolean;
  className?: string;
}

export function MarketChart({
  data,
  currency,
  height = 200,
  showMinMax = true,
  className,
}: MarketChartProps): React.JSX.Element {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toLocaleString()} ${currency}`, '']}
            contentStyle={{
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
            }}
          />
          {showMinMax && <Legend wrapperStyle={{ fontSize: '12px' }} />}

          <Line
            type="monotone"
            dataKey="avgPrice"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Promedio"
          />

          {showMinMax && (
            <>
              <Line
                type="monotone"
                dataKey="minPrice"
                stroke="#16a34a"
                strokeWidth={1}
                strokeDasharray="4 2"
                dot={false}
                name="Mínimo"
              />
              <Line
                type="monotone"
                dataKey="maxPrice"
                stroke="#dc2626"
                strokeWidth={1}
                strokeDasharray="4 2"
                dot={false}
                name="Máximo"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
