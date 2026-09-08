import React from 'react';
import { X, Play, ArrowRight, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { step: 1, title: "Normal Order Creation", page: "demo", desc: "Submit a standard order and observe normal database transaction flow." },
  { step: 2, title: "Baseline Duplicate Reproduction", page: "demo", desc: "Send repeated requests via /baseline/orders to observe multiple duplicate records created." },
  { step: 3, title: "Safe Idempotent Prevention", page: "demo", desc: "Send repeated requests via /safe/orders with Idempotency-Key. Observe exactly 1 record." },
  { step: 4, title: "50 Concurrent Race Condition", page: "demo", desc: "Fire 50 parallel requests with the same key. See DB unique constraint prevent 49 duplicates!" },
  { step: 5, title: "Timeout + Retry Handling", page: "demo", desc: "Simulate server timeout after commit. Retry succeeds without creating a second record." },
  { step: 6, title: "Transaction Failure & Rollback", page: "demo", desc: "Simulate database rollback before commit. Subsequent safe retry creates clean record." },
  { step: 7, title: "Controlled Benchmark Execution", page: "harness", desc: "Run benchmark comparing Baseline vs Safe under 100 concurrent workers." },
  { step: 8, title: "Request Trace Explorer", page: "traces", desc: "Inspect microsecond-level trace logs, latency, and status per request." },
  { step: 9, title: "Transaction State Lifecycle", page: "timeline", desc: "Visualize BEGIN -> INSERT -> COMMIT step-by-step transaction state transition." },
  { step: 10, title: "Stakeholder Validation & Limitations", page: "limitations", desc: "Review production limitations report and stakeholder questionnaire results." }
];

export default function DemoGuideModal({ isOpen, onClose, currentStep, onSelectStep }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-indigo-400 fill-indigo-400" />
            <h3 className="text-lg font-bold text-white">Interactive Guided Demo Mode</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-300 mt-3">
          Follow these 10 structured steps to demonstrate proof of duplicate prevention, concurrency safety, and baseline vs safe comparative evidence.
        </p>

        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
          {STEPS.map((s) => {
            const isActive = currentStep === s.step;
            return (
              <div
                key={s.step}
                onClick={() => onSelectStep(s.step, s.page)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {s.step}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold">{s.title}</h4>
                    <p className="text-xs text-slate-400">{s.desc}</p>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
