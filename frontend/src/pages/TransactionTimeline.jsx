import React, { useState } from 'react';
import { ArrowDown, CheckCircle2, Clock, ShieldCheck, Database, Layers } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function TransactionTimeline() {
  const [activeTab, setActiveTab] = useState('FIRST_REQUEST');

  const firstRequestSteps = [
    { step: 1, title: 'Request Received', desc: 'HTTP POST /safe/orders with headers & body payload', state: 'SUCCESS' },
    { step: 2, title: 'Tenant Resolved', desc: 'Dynamic tenant resolver validates schema (e.g. tenant_org_001)', state: 'SUCCESS' },
    { step: 3, title: 'Permission Validated', desc: 'RBAC validates user role (ADMIN/OPERATOR) permissions', state: 'SUCCESS' },
    { step: 4, title: 'Idempotency Key Received', desc: 'Header Idempotency-Key extracted & payload SHA256 hashed', state: 'SUCCESS' },
    { step: 5, title: 'Transaction BEGIN', desc: 'Database transaction boundary initialized', state: 'COMMITTED' },
    { step: 6, title: 'Idempotency Record INSERT', desc: 'Status set to IN_PROGRESS under UNIQUE(tenant_id, operation, key)', state: 'COMMITTED' },
    { step: 7, title: 'Business Record INSERT', desc: 'Order record inserted into orders table in tenant schema', state: 'COMMITTED' },
    { step: 8, title: 'Transaction COMMIT', desc: 'Atomic commit updates idempotency_records status to COMPLETED', state: 'COMMITTED' },
    { step: 9, title: 'Response Returned', desc: 'HTTP 200 OK returned with cached payload & record ID', state: 'SUCCESS' }
  ];

  const retrySteps = [
    { step: 1, title: 'Retry Request Received', desc: 'Client retries request after timeout or network dropped response', state: 'SUCCESS' },
    { step: 2, title: 'Same Idempotency Key', desc: 'System extracts identical (tenant_id, operation, key) tuple', state: 'SUCCESS' },
    { step: 3, title: 'Payload Hash Checked', desc: 'SHA256 payload hash verified against existing record (No 409 mismatch)', state: 'SUCCESS' },
    { step: 4, title: 'Existing Record Detected', desc: 'Database query hits COMPLETED idempotency record', state: 'DUPLICATE_PREVENTED' },
    { step: 5, title: 'Original Response Retrieved', desc: 'Deserializes cached response_body and response_code', state: 'DUPLICATE_PREVENTED' },
    { step: 6, title: 'No Second Business Record Created', desc: 'Zero database table writes executed. Record integrity preserved 100%', state: 'DUPLICATE_PREVENTED' }
  ];

  const currentSteps = activeTab === 'FIRST_REQUEST' ? firstRequestSteps : retrySteps;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Transaction Lifecycle Timeline</h2>
        <p className="text-xs text-slate-400">Atomic database transaction boundary visualization (Requirement 20)</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('FIRST_REQUEST')}
          className={`pb-2 text-xs font-bold transition-all ${
            activeTab === 'FIRST_REQUEST'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          1. Initial Request Transaction Lifecycle
        </button>
        <button
          onClick={() => setActiveTab('RETRY_REQUEST')}
          className={`pb-2 text-xs font-bold transition-all ${
            activeTab === 'RETRY_REQUEST'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          2. Idempotent Retry Handling Lifecycle
        </button>
      </div>

      {/* Timeline Step Progression */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-6">
        {currentSteps.map((s, idx) => (
          <div key={s.step} className="relative flex items-start gap-4 group">
            {/* Step Line Connector */}
            {idx < currentSteps.length - 1 && (
              <div className="absolute left-4 top-8 w-0.5 h-12 bg-slate-800 group-hover:bg-indigo-500/50 transition-colors" />
            )}

            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0 z-10">
              {s.step}
            </div>

            <div className="flex-1 p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/30 transition-all flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{s.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{s.desc}</p>
              </div>
              <StatusBadge status={s.state} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
