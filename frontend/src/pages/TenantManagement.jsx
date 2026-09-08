import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Database, Users } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function TenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTenants().then(setTenants).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Multi-Tenant Registry & Schema Isolation</h2>
        <p className="text-xs text-slate-400">Logical & database schema level isolation management (Requirement 10)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tenants.map(t => (
          <div key={t.id} className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4 hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t.name}</h3>
                  <p className="text-xs font-mono text-indigo-300">{t.id}</p>
                </div>
              </div>
              <StatusBadge status={t.status} />
            </div>

            <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>PostgreSQL Schema:</span>
                <span className="font-mono text-emerald-400">{t.schema_name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Isolation Level:</span>
                <span className="font-semibold text-slate-200">Schema / Logical DB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Created At:</span>
                <span className="text-slate-300">{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
