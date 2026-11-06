import React from 'react';

export const Hero: React.FC<{
  onSelectTab: (t: 'hide' | 'reveal' | 'how' | 'about') => void;
  onInstantDemo: () => void;
}> = ({ onSelectTab, onInstantDemo }) => {
  return (
    <section className="text-center space-y-8 py-12 md:py-20 relative max-w-4xl mx-auto px-4">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#00FF88] text-xs font-mono font-medium">
        <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
        ZERO-KNOWLEDGE BROWSER-ONLY CRYPTOGRAPHIC STEGANOGRAPHY
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
        Hide Your Message.<br />
        <span className="bg-gradient-to-r from-emerald-400 via-[#00FF88] to-teal-200 bg-clip-text text-transparent">
          Reveal the Invisible.
        </span>
      </h1>

      <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
        Encode confidential UTF-8 messages and binary files inside ordinary images using
        1-LSB steganography, protected by authenticated <code className="text-[#00FF88] font-mono">AES-256-GCM</code> encryption and 100,000 PBKDF2 iterations.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <button
          onClick={() => onSelectTab('hide')}
          className="px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-[#00FF88] text-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Hide Secret Message →
        </button>
        <button
          onClick={() => onSelectTab('reveal')}
          className="px-6 py-3.5 rounded-xl font-semibold bg-[#0E1714] border border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-500/60 transition-all"
        >
          Reveal Hidden Message
        </button>
        <button
          onClick={onInstantDemo}
          className="px-5 py-3.5 rounded-xl font-mono text-xs bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:border-emerald-500/40 transition-all"
        >
          ⚡ Try Instant Demo
        </button>
      </div>
    </section>
  );
};
