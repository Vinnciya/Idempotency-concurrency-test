import React from 'react';

export default function KPICard({ title, value, subtext, icon: Icon, color = "indigo" }) {
  const colorMap = {
    indigo: "from-indigo-500/10 to-indigo-600/5 text-indigo-400 border-indigo-500/20",
    emerald: "from-emerald-500/10 to-emerald-600/5 text-emerald-400 border-emerald-500/20",
    amber: "from-amber-500/10 to-amber-600/5 text-amber-400 border-amber-500/20",
    rose: "from-rose-500/10 to-rose-600/5 text-rose-400 border-rose-500/20",
    blue: "from-blue-500/10 to-blue-600/5 text-blue-400 border-blue-500/20",
    purple: "from-purple-500/10 to-purple-600/5 text-purple-400 border-purple-500/20"
  };

  const styleClass = colorMap[color] || colorMap.indigo;

  return (
    <div className={`p-5 rounded-xl border bg-gradient-to-br ${styleClass} glass-panel relative overflow-hidden transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && <Icon className="w-5 h-5 opacity-80" />}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-white">{value}</div>
      {subtext && <div className="mt-1 text-xs text-slate-400">{subtext}</div>}
    </div>
  );
}
