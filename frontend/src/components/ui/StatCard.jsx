import React from 'react';

function StatCard({ label, value, icon: Icon, trend, color }) {
  const borderColors = {
    blue: "border-t-blue-500",
    indigo: "border-t-indigo-500",
    rose: "border-t-rose-500",
    emerald: "border-t-emerald-500",
    teal: "border-t-teal-500"
  };
  const iconColors = {
    blue: "text-blue-600",
    indigo: "text-indigo-600",
    rose: "text-rose-600",
    emerald: "text-emerald-600",
    teal: "text-teal-600"
  };
  return (
    <div className={`bg-white p-4 border border-slate-200 rounded-xl shadow-sm border-t-4 ${borderColors[color] || 'border-t-slate-500'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <Icon className={`w-4 h-4 ${iconColors[color] || 'text-slate-600'}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        <span className={`text-[10px] font-bold ${trend && trend.includes("+") ? "text-emerald-500" : "text-slate-400"}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

export default StatCard;
