import React from 'react';
import { SecretFileState } from '../hooks/useStegoSession';

export const MessageEditor: React.FC<{
  mode: 'text' | 'file';
  onModeChange: (m: 'text' | 'file') => void;
  text: string;
  onTextChange: (t: string) => void;
  file: SecretFileState | null;
  onFileChange: (f: SecretFileState | null) => void;
}> = ({ mode, onModeChange, text, onTextChange, file, onFileChange }) => {
  const enc = new TextEncoder();
  const byteCount = enc.encode(text).length;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-[#0E1714] border border-emerald-500/20">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-200">Secret Payload</span>
        <div className="flex rounded-lg bg-[#070D0B] p-0.5 border border-slate-700 text-xs font-mono">
          <button
            type="button"
            onClick={() => onModeChange('text')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              mode === 'text' ? 'bg-emerald-500/20 text-[#00FF88]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => onModeChange('file')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              mode === 'file' ? 'bg-emerald-500/20 text-[#00FF88]' : 'text-slate-400 hover:text-white'
            }`}
          >
            File
          </button>
        </div>
      </div>

      {mode === 'text' ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            rows={4}
            placeholder="Type your secret message to hide inside the image..."
            className="w-full p-3 rounded-lg bg-[#070D0B] border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500 resize-y"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Characters: {text.length}</span>
            <span>UTF-8 Bytes: {byteCount} B</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = (ev) => {
                onFileChange({
                  name: f.name,
                  size: f.size,
                  mimeType: f.type || 'application/octet-stream',
                  bytes: new Uint8Array(ev.target?.result as ArrayBuffer)
                });
              };
              r.readAsArrayBuffer(f);
            }}
            className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:text-[#00FF88] file:font-semibold hover:file:bg-emerald-500/30 cursor-pointer"
          />
          {file && (
            <div className="text-[11px] font-mono text-emerald-300 flex justify-between items-center bg-[#070D0B] p-2 rounded border border-emerald-500/20">
              <span>{file.name} ({file.size.toLocaleString()} B)</span>
              <button
                type="button"
                onClick={() => onFileChange(null)}
                className="text-rose-400 hover:text-rose-300 font-bold"
              >
                × Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
