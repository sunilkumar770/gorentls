import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export function KPICard({ title, value, icon, trend, trendUp = true }: KPICardProps) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-slate-800 rounded-lg text-slate-100">
          {icon}
        </div>
        {trend && (
          <span className={twMerge(
            "text-xs font-medium px-2 py-1 rounded-full",
            trendUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      </div>
    </div>
  );
}
