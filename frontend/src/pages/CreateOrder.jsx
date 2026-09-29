import React, { useState } from 'react';
import { PlusCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function CreateOrder() {
  const [useSafe, setUseSafe] = useState(true);
  const [formData, setFormData] = useState({
    tenant_id: 'org_001',
    customer_id: 'CUST1001',
    external_reference: 'EXT-ORD-10001',
    amount: 2500,
    currency: 'INR'
  });
  const [idempotencyKey, setIdempotencyKey] = useState('IDEMP-MANUAL-001');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      let res;
      if (useSafe) {
        res = await api.createOrderSafe(formData, idempotencyKey);
      } else {
        res = await api.createOrderBaseline(formData);
      }
      setResponse(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Create Customer Order / Payment Record</h2>
        <p className="text-xs text-slate-400">Primary SaaS business operation endpoint tester</p>
      </div>

      {/* API Endpoint Mode Selector */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setUseSafe(true)}
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            useSafe
              ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <div className="text-sm font-bold">Proposed Solution (/safe/orders)</div>
              <div className="text-xs text-slate-400">Database-backed idempotency & race control</div>
            </div>
          </div>
          <StatusBadge status="SAFE" />
        </button>

        <button
          type="button"
          onClick={() => setUseSafe(false)}
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            !useSafe
              ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div className="text-left">
              <div className="text-sm font-bold">Naive Baseline (/baseline/orders)</div>
              <div className="text-xs text-slate-400">Deliberately unsafe without locks</div>
            </div>
          </div>
          <StatusBadge status="UNSAFE" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tenant ID</label>
            <input
              type="text"
              required
              value={formData.tenant_id}
              onChange={e => setFormData({ ...formData, tenant_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Customer ID</label>
            <input
              type="text"
              required
              value={formData.customer_id}
              onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">External Reference ID</label>
            <input
              type="text"
              required
              value={formData.external_reference}
              onChange={e => setFormData({ ...formData, external_reference: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (INR)</label>
            <input
              type="number"
              required
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        {useSafe && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Idempotency-Key Header <span className="text-indigo-400">(Required for /safe/orders)</span>
            </label>
            <input
              type="text"
              required
              value={idempotencyKey}
              onChange={e => setIdempotencyKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-indigo-300 font-mono"
            />
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center gap-2 shadow-lg transition-all ${
              useSafe
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{loading ? 'Processing...' : useSafe ? 'Submit Safe Order' : 'Submit Baseline Order'}</span>
          </button>
        </div>
      </form>

      {response && (
        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-400">Order Creation Response</h3>
            <StatusBadge status={response.is_duplicate_prevented ? "DUPLICATE_PREVENTED" : "SUCCESS"} />
          </div>
          <CodeBlock code={response} title="HTTP 200 OK Response" />
        </div>
      )}

      {error && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 space-y-2">
          <h3 className="text-sm font-bold">API Error Response</h3>
          <p className="text-xs font-mono">{error}</p>
        </div>
      )}
    </div>
  );
}
