'use client';

import type { SalesData } from '@/lib/types';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface SalesChartProps {
  data: SalesData[];
}

export function SalesChart({ data }: SalesChartProps) {
    const chartConfig = {
      sales: {
        label: 'Sales',
        color: 'hsl(var(--primary))',
      },
    };
  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
                if(value.includes('-W')) {
                    const [year, week] = value.split('-W');
                    return `W${week} '${year.slice(2)}`;
                }
                const date = new Date(value);
                if (!isNaN(date.valueOf())) {
                  return formatXAxis(date);
                }
                return value;
              }}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
          <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

const formatXAxis = (tickItem: Date) => {
    return tickItem.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
