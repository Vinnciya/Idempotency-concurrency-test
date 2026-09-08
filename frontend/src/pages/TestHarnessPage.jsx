import React, { useState } from 'react';
import { Cpu, Play, BarChart3, Settings2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import CodeBlock from '../components/CodeBlock';
import { api } from '../services/api';

export default function TestHarnessPage({ onTestComplete }) {
  const [config, setConfig] = useState({
    test_type: 'concurrent',
    implementation: 'COMPARISON',
    num_tenants: 3,
    num_operations: 100,
    concurrency: 20,
    retry_probability: 0.3,
    timeout_probability: 0.05,
    failure_probability: 0.05,
    duplicate_probability: 0.4,
    max_retries: 3
  });

  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async (implOverride = null) => {
    setRunning(true);
    setLastResult(null);
    setError(null);

    const payload = {
      ...config,
      implementation: implOverride || config.implementation
    };

    try {
      const res = await api.runTestHarness(payload);
      setLastResult(res);
      if (onTestComplete) onTestComplete(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Synthetic Workload Test Harness</h2>
        <p className="text-xs text-slate-400">Configurable concurrent HTTP workload generator & benchmark runner</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workload Parameters Configuration */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Workload Parameters</h3>
            </div>
            <StatusBadge status={config.implementation} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Test Type Scenario</label>
              <select
                value={config.test_type}
                onChange={e => setConfig({ ...config, test_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="concurrent">Concurrent Race Condition</option>
                <option value="retry">Synthetic Retry Storm</option>
                <option value="timeout">Timeout + Retry Simulation</option>
                <option value="failure">Transaction Failure & Rollback</option>
                <option value="webhook">Duplicate Webhook Events</option>
                <option value="mixed_adversarial">Mixed Adversarial Chaos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Implementation</label>
              <select
                value={config.implementation}
                onChange={e => setConfig({ ...config, implementation: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-semibold"
              >
                <option value="COMPARISON">COMPARISON (Baseline vs Safe Side-by-Side)</option>
                <option value="SAFE">PROPOSED SAFE SOLUTION (/safe/orders)</option>
                <option value="BASELINE">NAIVE BASELINE (/baseline/orders)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Logical Operations ({config.num_operations})
              </label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={config.num_operations}
                onChange={e => setConfig({ ...config, num_operations: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Concurrent Workers ({config.concurrency})
              </label>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={config.concurrency}
                onChange={e => setConfig({ ...config, concurrency: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Retry Probability ({(config.retry_probability * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.retry_probability}
                onChange={e => setConfig({ ...config, retry_probability: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Timeout Probability ({(config.timeout_probability * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={config.timeout_probability}
                onChange={e => setConfig({ ...config, timeout_probability: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Failure Probability ({(config.failure_probability * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={config.failure_probability}
                onChange={e => setConfig({ ...config, failure_probability: Number(e.target.value) })}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tenants Count ({config.num_tenants})
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={config.num_tenants}
                onChange={e => setConfig({ ...config, num_tenants: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Execution Triggers & Preset Buttons */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 mb-3">Benchmark Execution</h3>
            <p className="text-xs text-slate-400">
              Executes real concurrent HTTP calls against backend API endpoints using httpx and asyncio.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleRun('COMPARISON')}
              disabled={running}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{running ? 'Executing Workload...' : 'RUN COMPARISON BENCHMARK'}</span>
            </button>

            <button
              onClick={() => handleRun('SAFE')}
              disabled={running}
              className="w-full py-2.5 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Cpu className="w-4 h-4" />
              <span>RUN SAFE SOLUTION TEST</span>
            </button>

            <button
              onClick={() => handleRun('BASELINE')}
              disabled={running}
              className="w-full py-2.5 bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 text-amber-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>RUN BASELINE TEST</span>
            </button>
          </div>
        </div>
      </div>

      {/* Execution Results Display */}
      {lastResult && (
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Test Execution Benchmark Complete</h3>
              <p className="text-xs text-slate-400">Run ID: {lastResult.run_id}</p>
            </div>
            <StatusBadge status={lastResult.status} />
          </div>

          {lastResult.comparison ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2">
                <h4 className="text-sm font-bold text-amber-400">Baseline Implementation</h4>
                <div className="text-xs space-y-1 text-slate-300">
                  <div>Total Requests: {lastResult.comparison.baseline.total_requests}</div>
                  <div>Duplicates Created: <span className="text-amber-400 font-bold">{lastResult.comparison.baseline.duplicate_records_created}</span></div>
                  <div>Success Rate: {lastResult.comparison.baseline.success_rate}%</div>
                  <div>Avg Latency: {lastResult.comparison.baseline.avg_latency_ms} ms</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                <h4 className="text-sm font-bold text-emerald-400">Safe Solution Implementation</h4>
                <div className="text-xs space-y-1 text-slate-300">
                  <div>Total Requests: {lastResult.comparison.safe.total_requests}</div>
                  <div>Duplicates Prevented: <span className="text-blue-400 font-bold">{lastResult.comparison.safe.duplicate_records_prevented}</span></div>
                  <div>Prevention Rate: <span className="text-emerald-400 font-bold">{lastResult.comparison.safe.prevention_rate}%</span></div>
                  <div>Avg Latency: {lastResult.comparison.safe.avg_latency_ms} ms</div>
                </div>
              </div>
            </div>
          ) : (
            <CodeBlock code={lastResult.metrics} title="Metrics Summary JSON" />
          )}
        </div>
      )}

      {error && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs">
          Test Runner Error: {error}
        </div>
      )}
    </div>
  );
}
