import React from 'react';

interface MetricCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  children?: React.ReactNode;
}

export default function MetricCard({ icon, iconBg, iconColor, label, value, trend, trendUp, children }: MetricCardProps) {
  return (
    <div className="bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[140px] shadow-lg">
      <div className="flex justify-between items-start">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined text-[18px] ${iconColor}`}>{icon}</span>
        </div>
        {trend && (
          <span className={`flex items-center text-xs font-medium font-geist ${trendUp ? 'text-[#89ceff]' : 'text-[#ffb4ab]'}`}>
            <span className="material-symbols-outlined text-[14px]">{trendUp ? 'arrow_upward' : 'arrow_downward'}</span>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-medium font-geist text-[#c2c6d6] uppercase tracking-wider">{label}</p>
        <div className="mt-1">{children || <h3 className="text-4xl font-bold font-geist text-[#dae2fd]">{value}</h3>}</div>
      </div>
    </div>
  );
}
