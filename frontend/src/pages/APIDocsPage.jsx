import React, { useState, useEffect } from 'react';
import { Code2, ExternalLink } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import CodeBlock from '../components/CodeBlock';
import { api } from '../services/api';

export default function APIDocsPage() {
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    api.getPermissions().then(setPermissions).catch(console.error);
  }, []);

  const endpoints = [
    { method: 'GET', path: '/health', desc: 'System & Database Health Check', auth: 'None' },
    { method: 'GET', path: '/api/tenants', desc: 'List active multi-tenant schemas', auth: 'All Roles' },
    { method: 'POST', path: '/safe/orders', desc: 'Create Order (Proposed Idempotent Solution)', auth: 'ADMIN / OPERATOR' },
    { method: 'POST', path: '/baseline/orders', desc: 'Create Order (Naive Baseline Unsafe)', auth: 'ADMIN / OPERATOR' },
    { method: 'POST', path: '/api/webhooks', desc: 'Idempotent Partner Webhook Ingestion', auth: 'EXTERNAL_PARTNER' },
    { method: 'POST', path: '/api/test/run', desc: 'Execute Synthetic Workload Test Harness', auth: 'ADMIN' },
    { method: 'GET', path: '/api/test/runs', desc: 'List historical test harness executions', auth: 'All Roles' },
    { method: 'GET', path: '/api/metrics', desc: 'Fetch aggregate real-time benchmark metrics', auth: 'All Roles' },
    { method: 'GET', path: '/api/traces', desc: 'Filterable microsecond request trace explorer', auth: 'All Roles' },
    { method: 'GET', path: '/api/orders', desc: 'List customer order records for active tenant', auth: 'All Roles' },
    { method: 'GET', path: '/api/audit', desc: 'Fetch security & RBAC operation audit logs', auth: 'ADMIN' },
    { method: 'GET', path: '/api/architecture', desc: 'Fetch system architecture & concurrency specs', auth: 'None' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">API Endpoints Reference & RBAC Matrix</h2>
          <p className="text-xs text-slate-400">Complete OpenAPI specifications & role permissions (Requirement 11)</p>
        </div>
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Interactive Swagger / FastAPI Docs</span>
        </a>
      </div>

      {/* Endpoints Table */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Implemented REST API Endpoints</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3 font-semibold">HTTP Method</th>
                <th className="p-3 font-semibold">Endpoint Path</th>
                <th className="p-3 font-semibold font-sans">Description</th>
                <th className="p-3 font-semibold">Permission Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {endpoints.map((ep, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ep.method === 'POST' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-white">{ep.path}</td>
                  <td className="p-3 font-sans text-slate-300">{ep.desc}</td>
                  <td className="p-3 text-purple-300 font-sans">{ep.auth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Matrix */}
      {permissions && (
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Role-Based Access Control (RBAC) Permissions Matrix</h3>
          <CodeBlock code={permissions} title="RBAC Role Definitions" />
        </div>
      )}
    </div>
  );
}
