import React, { useState } from 'react';
import { RevealedDataState } from '../hooks/useStegoSession';

export const DecodeResult: React.FC<{ data: RevealedDataState }> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(data.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([data.fileBytes as unknown as BlobPart], { type: data.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename || 'revealed-message.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-5 rounded-xl bg-[#0E1714] border border-emerald-500/40 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-pulse" />
          <h3 className="text-sm font-bold text-white">Decoded Payload Verified ✓</h3>
        </div>
        <div className="flex gap-2">
          {data.mode === 'text' && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-[#00FF88] font-mono text-xs font-semibold hover:bg-emerald-500/30"
            >
              {copied ? 'Copied ✓' : 'Copy Text'}
            </button>
          )}
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-mono text-xs font-bold hover:bg-[#00FF88]"
          >
            Download {data.mode === 'file' ? 'File' : 'TXT'}
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-[#070D0B] border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
        {data.text}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400">
        <div>Size: <span className="text-slate-200">{data.payloadLength.toLocaleString()} B</span></div>
        <div>Status: <span className="text-[#00FF88]">{data.encrypted ? 'AES-256-GCM' : 'Plaintext'}</span></div>
        <div>Type: <span className="text-slate-200">{data.mode.toUpperCase()}</span></div>
        <div>Timestamp: <span className="text-slate-200">{new Date(data.timestamp).toLocaleTimeString()}</span></div>
      </div>
    </div>
  );
};
