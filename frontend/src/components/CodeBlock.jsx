import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeBlock({ code, title = "Payload JSON" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(typeof code === 'string' ? code : JSON.stringify(code, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedCode = typeof code === 'string' ? code : JSON.stringify(code, null, 2);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/90 overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-slate-400">
        <span className="font-sans font-medium text-xs">{title}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-indigo-300 overflow-x-auto max-h-60 leading-relaxed">
        {formattedCode}
      </pre>
    </div>
  );
}
