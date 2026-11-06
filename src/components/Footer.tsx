import React from 'react';

export const Footer: React.FC<{
  onSelectTab: (t: 'home' | 'hide' | 'reveal' | 'how' | 'about') => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}> = ({ onSelectTab, onOpenPrivacy, onOpenTerms }) => {
  return (
    <footer className="border-t border-emerald-500/20 bg-[#050807]/95 mt-20 py-10 px-4 text-xs text-slate-400 space-y-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white text-sm">STEGOSHARE</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#00FF88] border border-emerald-500/20">
              MIT License
            </span>
          </div>
          <p className="text-slate-500 text-[11px] text-center md:text-left">
            100% Client-Side Steganography &amp; Zero-Knowledge AES-256-GCM Cryptography.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-5 font-mono text-xs">
          <button onClick={() => onSelectTab('home')} className="hover:text-emerald-400 transition-colors">Home</button>
          <button onClick={() => onSelectTab('hide')} className="hover:text-emerald-400 transition-colors">Hide</button>
          <button onClick={() => onSelectTab('reveal')} className="hover:text-emerald-400 transition-colors">Reveal</button>
          <button onClick={() => onSelectTab('how')} className="hover:text-emerald-400 transition-colors">How It Works</button>
          <button onClick={() => onSelectTab('about')} className="hover:text-emerald-400 transition-colors">Security</button>
          {onOpenPrivacy && (
            <button onClick={onOpenPrivacy} className="hover:text-emerald-400 underline underline-offset-4 transition-colors">
              Privacy Policy
            </button>
          )}
          {onOpenTerms && (
            <button onClick={onOpenTerms} className="hover:text-emerald-400 underline underline-offset-4 transition-colors">
              Terms of Service
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://buymeacoffee.com/stegoshare"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FFDD00]/10 hover:bg-[#FFDD00]/20 text-[#FFDD00] border border-[#FFDD00]/30 transition-all hover:scale-105"
          >
            <span>☕</span>
            <span>Support on Buy Me a Coffee</span>
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto border-t border-slate-800/80 pt-6 text-center text-[11px] text-slate-500 space-y-1">
        <p>
          Zero Server Processing: All pixel operations and cryptographic transforms execute inside your browser sandbox.
        </p>
        <p className="font-mono text-emerald-500/60">
          AES-256-GCM • PBKDF2-SHA256 (100k iter) • IEEE 802.3 CRC32 • 1-LSB RGBA Matrix
        </p>
      </div>
    </footer>
  );
};
