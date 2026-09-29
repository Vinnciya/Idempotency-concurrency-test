import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, User, Building, PlayCircle, HelpCircle } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ activeTenant, setActiveTenant, activeRole, setActiveRole, onOpenDemoModal, onOpenStakeholderModal }) {
  const [tenants, setTenants] = useState([]);
  const [health, setHealth] = useState('HEALTHY');

  useEffect(() => {
    api.getTenants().then(setTenants).catch(() => {});
    api.getHealth().then(res => setHealth(res.status)).catch(() => setHealth('OFFLINE'));
  }, []);

  const roles = [
    { key: 'ADMIN', label: 'ADMIN (Full Access)' },
    { key: 'OPERATOR', label: 'OPERATOR (Create/View)' },
    { key: 'EXTERNAL_PARTNER', label: 'EXTERNAL_PARTNER (Webhooks)' },
    { key: 'VIEWER', label: 'VIEWER (Read-Only)' }
  ];

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">
            Idempotency & Concurrency Harness
          </h1>
          <p className="text-xs text-slate-400 font-mono">Multi-Tenant SaaS Duplicate Prevention</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* System Health */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs">
          <span className={`w-2 h-2 rounded-full ${health === 'HEALTHY' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-300 font-mono">{health}</span>
        </div>

        {/* Tenant Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <Building className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Tenant:</span>
          <select
            value={activeTenant}
            onChange={(e) => {
              setActiveTenant(e.target.value);
              localStorage.setItem('activeTenant', e.target.value);
            }}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            {tenants.map(t => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                {t.name} ({t.id})
              </option>
            ))}
          </select>
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <User className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Role:</span>
          <select
            value={activeRole}
            onChange={(e) => {
              setActiveRole(e.target.value);
              localStorage.setItem('activeRole', e.target.value);
            }}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            {roles.map(r => (
              <option key={r.key} value={r.key} className="bg-slate-900 text-white">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Demo Mode Button */}
        <button
          onClick={onOpenDemoModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Demo Mode</span>
        </button>

        {/* Stakeholder Questionnaire Button */}
        <button
          onClick={onOpenStakeholderModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all"
        >
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>Validation</span>
        </button>
      </div>
    </header>
  );
}
