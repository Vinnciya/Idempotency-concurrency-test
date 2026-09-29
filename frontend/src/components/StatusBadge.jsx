import React from 'react';

export default function StatusBadge({ status }) {
  let badgeStyle = "bg-slate-800 text-slate-300 border-slate-700";

  switch (status?.toUpperCase()) {
    case 'SUCCESS':
    case 'COMPLETED':
    case 'COMMITTED':
    case 'HEALTHY':
    case 'ACTIVE':
      badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      break;
    case 'DUPLICATE_PREVENTED':
      badgeStyle = "bg-blue-500/10 text-blue-400 border-blue-500/30";
      break;
    case 'DUPLICATE_CREATED':
    case 'CONFLICT':
      badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/30";
      break;
    case 'FAILED':
    case 'ERROR':
    case 'ROLLED_BACK':
    case 'TIMEOUT':
      badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/30";
      break;
    case 'IN_PROGRESS':
    case 'RUNNING':
      badgeStyle = "bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse";
      break;
    default:
      badgeStyle = "bg-slate-800 text-slate-300 border-slate-700";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
      {status}
    </span>
  );
}
