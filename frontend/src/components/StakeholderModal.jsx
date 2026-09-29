import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Star } from 'lucide-react';
import { api } from '../services/api';

export default function StakeholderModal({ isOpen, onClose }) {
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    stakeholder_name: '',
    role: 'SaaS Evaluator / Architect',
    q1_visible: 5,
    q2_clear_diff: 5,
    q3_understandable_dash: 5,
    q4_realistic_retry: 5,
    q5_convincing_concurrency: 5,
    q6_suitable_saas: 5,
    comments: ''
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    }
  }, [isOpen]);

  const loadSummary = async () => {
    try {
      const data = await api.getStakeholderSummary();
      setSummary(data);
    } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.submitStakeholderFeedback(formData);
      setSubmitted(true);
      loadSummary();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Stakeholder Validation & Questionnaire</h3>
            <p className="text-xs text-slate-400">Quantitative Evaluation (Requirement 25)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Score Summary */}
        {summary && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-400">Total Evaluators</div>
              <div className="text-xl font-bold text-white mt-1">{summary.total_responses}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Overall Avg Score</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">{summary.overall_average_score} / 5.0</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Positive Responses</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{summary.positive_response_percentage}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Concurrency Rating</div>
              <div className="text-xl font-bold text-amber-400 mt-1">{summary.score_breakdown?.q5_convincing_concurrency} / 5.0</div>
            </div>
          </div>
        )}

        {submitted ? (
          <div className="mt-6 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2" />
            <h4 className="text-lg font-bold">Feedback Submitted Successfully!</h4>
            <p className="text-xs mt-1 text-slate-300">Your validation response has been recorded in the benchmark dataset.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Evaluator Name</label>
                <input
                  type="text"
                  required
                  value={formData.stakeholder_name}
                  onChange={(e) => setFormData({ ...formData, stakeholder_name: e.target.value })}
                  placeholder="e.g. Dr. Aris Thorne"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role / Designation</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Principal SaaS Architect"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluation Questions (1 = Poor, 5 = Excellent)</h4>

              {[
                { key: 'q1_visible', text: '1. Is the duplicate-record problem clearly visible?' },
                { key: 'q2_clear_diff', text: '2. Is the difference between baseline and safe implementation clear?' },
                { key: 'q3_understandable_dash', text: '3. Is the dashboard understandable and actionable?' },
                { key: 'q4_realistic_retry', text: '4. Is the synthetic retry behavior realistic?' },
                { key: 'q5_convincing_concurrency', text: '5. Is the concurrency race-condition demonstration convincing?' },
                { key: 'q6_suitable_saas', text: '6. Is the solution suitable for a multi-tenant SaaS platform?' }
              ].map(q => (
                <div key={q.key} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-300 font-medium">{q.text}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, [q.key]: star })}
                        className={`p-1 text-xs rounded transition-colors ${
                          formData[q.key] >= star ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Qualitative Feedback / Comments</label>
              <textarea
                rows="2"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Enter evaluation notes..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm shadow-lg shadow-indigo-500/20"
              >
                Submit Evaluation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
