import React, { useState, useEffect } from 'react';
import { Boxes, ShieldCheck, Database, Layers, Check, X, AlertTriangle } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';
import { api } from '../services/api';

export default function ArchitecturePage() {
  const [arch, setArch] = useState(null);

  useEffect(() => {
    api.getArchitecture().then(setArch).catch(console.error);
  }, []);

  const flowSteps = [
    { name: 'Client Workload Generator', sub: 'httpx / asyncio concurrent workers' },
    { name: 'API Gateway / FastAPI', sub: 'Header extraction & Pydantic validation' },
    { name: 'Authentication / RBAC', sub: 'Role permission check (ADMIN/OPERATOR)' },
    { name: 'Tenant Resolver', sub: 'Dynamic schema resolution (tenant_org_001)' },
    { name: 'Idempotency Layer', sub: 'SHA256 payload hash & unique key check' },
    { name: 'Concurrency Control', sub: 'PostgreSQL UNIQUE constraint & ACID lock' },
    { name: 'Transaction Boundary', sub: 'Atomic INSERT + Idempotency completion' },
    { name: 'PostgreSQL Storage', sub: 'Public + Tenant Isolated Schemas' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System Architecture & Concurrency Control</h2>
        <p className="text-xs text-slate-400">Multi-layer SaaS architecture & database correctness strategy (Requirements 3 & 7)</p>
      </div>

      {/* Architecture Flow Diagram */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">System Architecture Pipeline</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {flowSteps.map((step, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 relative">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Layer {idx + 1}</div>
              <div className="text-xs font-bold text-white">{step.name}</div>
              <div className="text-[11px] text-slate-400">{step.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Concurrency Strategy Comparison Table (Requirement 7) */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Concurrency Safety Rationale & Comparison</h3>
          <p className="text-xs text-slate-400">Why Database-Backed Uniqueness is Superior to Application-Only Locks</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3 font-semibold">Concurrency Strategy</th>
                <th className="p-3 font-semibold">Safety Rating</th>
                <th className="p-3 font-semibold">Multi-Node Safe?</th>
                <th className="p-3 font-semibold">Pros</th>
                <th className="p-3 font-semibold">Cons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              <tr className="bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                <td className="p-3 font-bold text-emerald-400">DB UNIQUE Constraint + Atomic Txn (Proposed)</td>
                <td className="p-3 font-semibold text-emerald-400">High (Database Authority)</td>
                <td className="p-3 text-emerald-400 font-bold">YES</td>
                <td className="p-3 text-slate-300">ACID compliance, works across horizontal cluster, zero memory race.</td>
                <td className="p-3 text-slate-400">Requires database write.</td>
              </tr>
              <tr className="hover:bg-slate-900/50 transition-colors">
                <td className="p-3 font-bold text-amber-400">In-Memory Dictionary / Redis Lock</td>
                <td className="p-3 text-amber-400">Medium</td>
                <td className="p-3 text-rose-400 font-bold">NO (Multi-Node Fail)</td>
                <td className="p-3 text-slate-300">Fast local in-memory lookup.</td>
                <td className="p-3 text-slate-400">Fails across multiple backend app instances, lost on restart.</td>
              </tr>
              <tr className="hover:bg-slate-900/50 transition-colors">
                <td className="p-3 font-bold text-purple-400">Global Application Lock (asyncio.Lock)</td>
                <td className="p-3 text-purple-400">Low</td>
                <td className="p-3 text-rose-400 font-bold">NO</td>
                <td className="p-3 text-slate-300">Simple to implement locally.</td>
                <td className="p-3 text-slate-400">Serializes all requests across all tenants, destroys throughput.</td>
              </tr>
              <tr className="hover:bg-slate-900/50 transition-colors">
                <td className="p-3 font-bold text-rose-400">Simple 'Check-Then-Insert' (Baseline)</td>
                <td className="p-3 text-rose-400">None (Guaranteed Race)</td>
                <td className="p-3 text-rose-400 font-bold">NO</td>
                <td className="p-3 text-slate-300">Naive baseline code.</td>
                <td className="p-3 text-slate-400">Two concurrent requests pass check before insert, creating duplicates!</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
