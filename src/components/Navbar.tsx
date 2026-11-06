import React from 'react';

export const Navbar: React.FC<{ activeTab: string; onSelectTab: (t: any) => void }> = ({ activeTab, onSelectTab }) => (
  <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#050807]/85 border-b border-emerald-500/20">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={() => onSelectTab('home')} className="flex items-center gap-2 group text-left">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#00FF88] group-hover:scale-105 transition-transform font-mono font-bold text-sm">
            &gt;_
          </div>
          <div>
            <span className="font-mono font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#00FF88] text-base">
              STEGOSHARE
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              v1.0 Zero-Knowledge
            </span>
          </div>
        </button>
      </div>

      <nav className="hidden md:flex items-center gap-1 bg-[#0E1714] p-1 rounded-xl border border-emerald-500/20 font-mono text-xs">
        {[
          { id: 'home', label: 'Home' },
          { id: 'hide', label: 'Hide' },
          { id: 'reveal', label: 'Reveal' },
          { id: 'how', label: 'How It Works' },
          { id: 'about', label: 'Security & Tests' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-[#00FF88] border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <a
          href="https://buymeacoffee.com/stegoshare"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FFDD00]/10 hover:bg-[#FFDD00]/20 text-[#FFDD00] border border-[#FFDD00]/30 transition-all hover:scale-105 shadow-sm"
          title="Support STEGOSHARE development"
        >
          <span>☕</span>
          <span className="hidden sm:inline">Buy Me a Coffee</span>
        </a>
      </div>
    </div>
  </header>
);
