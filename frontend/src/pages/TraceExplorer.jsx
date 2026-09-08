import React, { useState, useEffect } from 'react';
import { ListFilter, Search, RefreshCw, Layers } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import CodeBlock from '../components/CodeBlock';
import { api } from '../services/api';

export default function TraceExplorer() {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tenant_id: '',
    idempotency_key: '',
    status: '',
    endpoint: ''
  });

  const [selectedTrace, setSelectedTrace] = useState(null);

  useEffect(() => {
    loadTraces();
  }, [filters]);

  const loadTraces = async () => {
    setLoading(true);
    try {
      const activeFilters = {};
      if (filters.tenant_id) activeFilters.tenant_id = filters.tenant_id;
      if (filters.idempotency_key) activeFilters.idempotency_key = filters.idempotency_key;
      if (filters.status) activeFilters.status = filters.status;
      if (filters.endpoint) activeFilters.endpoint = filters.endpoint;

      const data = await api.getTraces(activeFilters);
      setTraces(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Request Trace Explorer</h2>
          <p className="text-xs text-slate-400">Microsecond-level transaction trace log inspection (Requirement 13)</p>
        </div>
        <button
          onClick={loadTraces}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-medium rounded-lg text-slate-300 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Traces</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Filter Tenant</label>
          <input
            type="text"
            placeholder="e.g. org_001"
            value={filters.tenant_id}
            onChange={e => setFilters({ ...filters, tenant_id: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Filter Idempotency Key</label>
          <input
            type="text"
            placeholder="e.g. IDEMP-ABC-123"
            value={filters.idempotency_key}
            onChange={e => setFilters({ ...filters, idempotency_key: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Filter Status</label>
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="DUPLICATE_PREVENTED">DUPLICATE_PREVENTED</option>
            <option value="DUPLICATE_CREATED">DUPLICATE_CREATED</option>
            <option value="TIMEOUT">TIMEOUT</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Filter Endpoint</label>
          <select
            value={filters.endpoint}
            onChange={e => setFilters({ ...filters, endpoint: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
          >
            <option value="">All Endpoints</option>
            <option value="/safe/orders">/safe/orders</option>
            <option value="/baseline/orders">/baseline/orders</option>
            <option value="/api/webhooks">/api/webhooks</option>
          </select>
        </div>
      </div>

      {/* Traces Table */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3 font-semibold">Timestamp</th>
                <th className="p-3 font-semibold">Trace ID</th>
                <th className="p-3 font-semibold">Tenant</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold">Endpoint</th>
                <th className="p-3 font-semibold">Idempotency Key</th>
                <th className="p-3 font-semibold">TXN State</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Latency</th>
                <th className="p-3 font-semibold">Record ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {traces.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-6 text-center text-slate-500 font-sans">
                    No traces match the active filters. Execute a request in Demo or Test Harness!
                  </td>
                </tr>
              ) : (
                traces.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTrace(t)}
                    className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                  >
                    <td className="p-3 text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 font-bold text-indigo-400">{t.trace_id}</td>
                    <td className="p-3 text-slate-300">{t.tenant_id}</td>
                    <td className="p-3 text-emerald-400">{t.role}</td>
                    <td className="p-3 text-slate-300 font-sans">{t.endpoint}</td>
                    <td className="p-3 text-indigo-300 max-w-[120px] truncate">{t.idempotency_key || '-'}</td>
                    <td className="p-3 text-purple-400">{t.transaction_state || 'COMMITTED'}</td>
                    <td className="p-3"><StatusBadge status={t.status} /></td>
                    <td className="p-3 text-slate-300">{t.latency_ms} ms</td>
                    <td className="p-3 text-slate-400">{t.record_id || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Trace Details Drawer */}
      {selectedTrace && (
        <div className="p-6 rounded-2xl glass-panel border border-indigo-500/40 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Trace Details: {selectedTrace.trace_id}</h3>
              <p className="text-xs text-slate-400">Request ID: {selectedTrace.request_id}</p>
            </div>
            <button onClick={() => setSelectedTrace(null)} className="text-xs text-slate-400 hover:text-white">
              Close Detail
            </button>
          </div>
          <CodeBlock code={selectedTrace} title="Full Request Trace Object" />
        </div>
      )}
    </div>
  );
}
