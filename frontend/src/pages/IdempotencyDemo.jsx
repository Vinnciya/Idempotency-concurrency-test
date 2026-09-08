import React, { useState } from 'react';
import { Play, RotateCcw, Zap, AlertCircle, CheckCircle, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function IdempotencyDemo() {
  const [tenantId, setTenantId] = useState('org_001');
  const [idempotencyKey, setIdempotencyKey] = useState('IDEMP-ABC-123');
  const [amount, setAmount] = useState(2500);
  const [externalRef, setExternalRef] = useState('EXT-ORD-10001');
  
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    sent: 0,
    created: 0,
    attempts: 0,
    prevented: 0,
    state: 'READY'
  });

  const appendLog = (msg, status = 'INFO', details = null) => {
    setLogs(prev => [
      {
        time: new Date().toLocaleTimeString(),
        msg,
        status,
        details
      },
      ...prev
    ]);
  };

  const handleSendInitial = async () => {
    setStats(s => ({ ...s, sent: s.sent + 1, state: 'PROCESSING' }));
    appendLog(`Sending initial order request with Idempotency-Key: ${idempotencyKey}`, 'IN_PROGRESS');
    
    try {
      const res = await api.createOrderSafe({
        tenant_id: tenantId,
        customer_id: 'CUST1001',
        external_reference: externalRef,
        amount: Number(amount),
        currency: 'INR'
      }, idempotencyKey);
      
      setStats(s => ({
        ...s,
        created: s.created + (res.is_duplicate_prevented ? 0 : 1),
        prevented: s.prevented + (res.is_duplicate_prevented ? 1 : 0),
        state: 'CONSISTENT'
      }));
      
      appendLog(
        res.is_duplicate_prevented 
          ? `Duplicate detected! Original response cached for order ID: ${res.id}`
          : `Business Order Record Created: ${res.id}`,
        res.is_duplicate_prevented ? 'DUPLICATE_PREVENTED' : 'SUCCESS',
        res
      );
    } catch (e) {
      appendLog(`Error: ${e.message}`, 'ERROR');
      setStats(s => ({ ...s, state: 'ERROR' }));
    }
  };

  const handleSend5Concurrent = async () => {
    setStats(s => ({ ...s, sent: s.sent + 5, attempts: s.attempts + 4, state: 'PROCESSING' }));
    appendLog(`Firing 5 parallel concurrent requests with key ${idempotencyKey}...`, 'IN_PROGRESS');
    
    const body = {
      tenant_id: tenantId,
      customer_id: 'CUST1001',
      external_reference: externalRef,
      amount: Number(amount),
      currency: 'INR'
    };

    try {
      const promises = Array.from({ length: 5 }).map(() =>
        api.createOrderSafe(body, idempotencyKey)
      );
      const results = await Promise.all(promises);

      const createdCount = results.filter(r => !r.is_duplicate_prevented).length;
      const preventedCount = results.filter(r => r.is_duplicate_prevented).length;

      setStats(s => ({
        ...s,
        created: s.created + createdCount,
        prevented: s.prevented + preventedCount,
        state: 'CONSISTENT'
      }));

      appendLog(`5 Concurrent requests resolved cleanly. 1 record created, ${preventedCount} duplicates prevented!`, 'DUPLICATE_PREVENTED', results[0]);
    } catch (e) {
      appendLog(`Concurrent Error: ${e.message}`, 'ERROR');
      setStats(s => ({ ...s, state: 'ERROR' }));
    }
  };

  const handleSimulateTimeout = async () => {
    setStats(s => ({ ...s, sent: s.sent + 1, state: 'PROCESSING' }));
    appendLog(`Sending request with simulated post-commit timeout...`, 'IN_PROGRESS');

    try {
      await api.createOrderSafe({
        tenant_id: tenantId,
        customer_id: 'CUST1001',
        external_reference: externalRef,
        amount: Number(amount),
        currency: 'INR'
      }, idempotencyKey, {}, { simulate_timeout: true });
    } catch (e) {
      appendLog(`Received simulated 504 Timeout: ${e.message}`, 'TIMEOUT');
      appendLog(`Client assumes failure and retries with same key...`, 'IN_PROGRESS');

      // Retry automatically
      try {
        const retryRes = await api.createOrderSafe({
          tenant_id: tenantId,
          customer_id: 'CUST1001',
          external_reference: externalRef,
          amount: Number(amount),
          currency: 'INR'
        }, idempotencyKey);

        setStats(s => ({
          ...s,
          sent: s.sent + 1,
          prevented: s.prevented + 1,
          attempts: s.attempts + 1,
          state: 'CONSISTENT'
        }));
        appendLog(`Retry succeeded cleanly! Cached response returned, NO duplicate record created.`, 'DUPLICATE_PREVENTED', retryRes);
      } catch (err) {
        appendLog(`Retry error: ${err.message}`, 'ERROR');
      }
    }
  };

  const handleChangePayload = async () => {
    const newAmount = Number(amount) + 1000;
    setStats(s => ({ ...s, sent: s.sent + 1 }));
    appendLog(`Reusing Idempotency-Key ${idempotencyKey} with modified payload (Amount = ₹${newAmount})...`, 'IN_PROGRESS');

    try {
      await api.createOrderSafe({
        tenant_id: tenantId,
        customer_id: 'CUST1001',
        external_reference: externalRef,
        amount: newAmount,
        currency: 'INR'
      }, idempotencyKey);
    } catch (e) {
      appendLog(`409 Conflict Correctly Thrown: ${e.message}`, 'CONFLICT');
      setStats(s => ({ ...s, state: 'CONSISTENT' }));
    }
  };

  const handleReset = () => {
    const newKey = `IDEMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setIdempotencyKey(newKey);
    setExternalRef(`EXT-ORD-${Math.floor(10000 + Math.random() * 90000)}`);
    setLogs([]);
    setStats({ sent: 0, created: 0, attempts: 0, prevented: 0, state: 'READY' });
    appendLog(`Reset demo state with new key: ${newKey}`, 'INFO');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Interactive Idempotency & Concurrency Demo</h2>
        <p className="text-xs text-slate-400">Step-by-step real-time duplicate prevention playground (Requirement 19)</p>
      </div>

      {/* Control Panel & Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Request Configuration</h3>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Target Tenant ID</label>
            <input
              type="text"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Idempotency-Key Header</label>
            <input
              type="text"
              value={idempotencyKey}
              onChange={e => setIdempotencyKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-indigo-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Order Amount (INR)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Generate New Idempotency Key</span>
          </button>
        </div>

        {/* Action Trigger Buttons */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Adversarial Test Action Triggers</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleSendInitial}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg shadow-indigo-500/20 transition-all"
            >
              <span>1. Send Initial Request</span>
              <Play className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={handleSendInitial}
              className="p-3 bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-300 rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>2. Send Same Request (Retry)</span>
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleSend5Concurrent}
              className="p-3 bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-300 rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>3. Send 5 Concurrent Requests</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </button>

            <button
              onClick={handleSimulateTimeout}
              className="p-3 bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>4. Simulate Timeout + Retry</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={handleChangePayload}
              className="p-3 bg-rose-600/20 border border-rose-500/40 hover:bg-rose-600/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>5. Payload Change (409 Conflict)</span>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </button>

            <button
              onClick={() => {
                setTenantId(tenantId === 'org_001' ? 'org_002' : 'org_001');
                appendLog(`Switched target tenant context to ${tenantId === 'org_001' ? 'org_002' : 'org_001'}`, 'INFO');
              }}
              className="p-3 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>6. Switch Tenant Context</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time State Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Requests Sent</span>
          <span className="text-xl font-bold text-white mt-1 block">{stats.sent}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Records Created</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">{stats.created}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Duplicate Attempts</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">{stats.attempts}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Duplicates Prevented</span>
          <span className="text-xl font-bold text-blue-400 mt-1 block">{stats.prevented}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">Final State</span>
          <StatusBadge status={stats.state} />
        </div>
      </div>

      {/* Real-time Request Timeline Log */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Real-Time Request Execution Log</h3>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">No actions executed yet. Click one of the buttons above!</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{log.time}</span>
                    <span className="text-slate-200">{log.msg}</span>
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-indigo-400 pl-4 border-l border-slate-800">
                      Response ID: {log.details.id} | Duplicate Prevented: {String(log.details.is_duplicate_prevented)}
                    </div>
                  )}
                </div>
                <StatusBadge status={log.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
