import React, { useState, useEffect } from 'react';
import { FileText, ShieldAlert } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs().then(setLogs).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System Audit Logs</h2>
        <p className="text-xs text-slate-400">Security & RBAC operation audit trail</p>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3 font-semibold">Timestamp</th>
                <th className="p-3 font-semibold">Tenant</th>
                <th className="p-3 font-semibold">User</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold">Action</th>
                <th className="p-3 font-semibold">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-500 font-sans">No audit logs recorded yet.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-indigo-300">{log.tenant_id}</td>
                    <td className="p-3 text-slate-200">{log.user_id || 'usr_admin'}</td>
                    <td className="p-3 text-emerald-400">{log.role || 'ADMIN'}</td>
                    <td className="p-3 font-bold text-white">{log.action}</td>
                    <td className="p-3 text-slate-300">{log.resource}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
