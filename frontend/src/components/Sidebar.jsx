import React from 'react';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Zap,
  Cpu,
  BarChart3,
  ListFilter,
  Clock,
  FileText,
  Boxes,
  Code2,
  AlertTriangle
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'demo', label: 'Idempotency Demo', icon: Zap },
    { id: 'create_order', label: 'Create Order', icon: PlusCircle },
    { id: 'harness', label: 'Test Harness', icon: Cpu },
    { id: 'results', label: 'Test Results', icon: BarChart3 },
    { id: 'traces', label: 'Trace Explorer', icon: ListFilter },
    { id: 'timeline', label: 'Transaction Timeline', icon: Clock },
    { id: 'tenants', label: 'Tenant Management', icon: Building2 },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'architecture', label: 'Architecture', icon: Boxes },
    { id: 'apidocs', label: 'API Documentation', icon: Code2 },
    { id: 'limitations', label: 'Limitations & Validation', icon: AlertTriangle },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          System Modules
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300">Proof of Concept v1.0</div>
        <div>Multi-Tenant Schema Isolation</div>
        <div className="text-emerald-400 font-mono text-[10px]">PostgreSQL / ACID Safe</div>
      </div>
    </aside>
  );
}
