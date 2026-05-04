'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface RevenuePoint {
  month: string;
  amount: number;
}

export function RevenueChart({ data, className }: { data: RevenuePoint[], className?: string }) {
  return (
    <div className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-6">Revenue Performance</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                const [year, month] = value.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return date.toLocaleString('default', { month: 'short' });
              }}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #1e293b',
                borderRadius: '12px',
                color: '#fff'
              }}
              itemStyle={{ color: '#10b981' }}
              formatter={(value: unknown) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
              labelFormatter={(label) => {
                const [year, month] = label.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return date.toLocaleString('default', { month: 'long', year: 'numeric' });
              }}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
