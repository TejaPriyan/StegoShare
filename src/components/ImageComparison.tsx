import React, { useState } from 'react';
import { EncodedResultState } from '../hooks/useStegoSession';

export const ImageComparison: React.FC<{
  originalUrl: string;
  result: EncodedResultState;
}> = ({ originalUrl, result }) => {
  const [mode, setMode] = useState<'side' | 'slider' | 'diff'>('side');
  const [sliderPos, setSliderPos] = useState(50);
  const [zoom, setZoom] = useState(1);

  return (
    <div className="space-y-4 p-5 rounded-xl bg-[#0E1714] border border-emerald-500/30">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-sm font-bold text-white">Visual & Statistical Quality Verification</h3>
        <div className="flex rounded-lg bg-[#070D0B] p-0.5 border border-slate-700 text-xs font-mono">
          {(['side', 'slider', 'diff'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md font-semibold capitalize ${
                mode === m ? 'bg-emerald-500/20 text-[#00FF88]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono p-3 bg-[#070D0B] rounded-lg border border-slate-800">
        <div>PSNR: <span className="text-[#00FF88] font-bold">{result.metrics.psnr} dB</span></div>
        <div>SSIM: <span className="text-[#00FF88] font-bold">{result.metrics.ssim}</span></div>
        <div>Mod Pixels: <span className="text-slate-200">{result.metrics.modifiedPixels.toLocaleString()}</span></div>
        <div>Capacity Used: <span className="text-slate-200">{result.capacityPercentage.toFixed(2)}%</span></div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black/50 min-h-[280px] flex items-center justify-center p-2">
        {mode === 'side' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="space-y-1 text-center">
              <div className="text-[11px] font-mono text-slate-400">Original Carrier</div>
              <img src={originalUrl} alt="Original" style={{ transform: `scale(${zoom})` }} className="max-h-64 mx-auto object-contain rounded" />
            </div>
            <div className="space-y-1 text-center">
              <div className="text-[11px] font-mono text-[#00FF88]">Encoded Stego PNG</div>
              <img src={result.pngDataUrl} alt="Encoded" style={{ transform: `scale(${zoom})` }} className="max-h-64 mx-auto object-contain rounded" />
            </div>
          </div>
        )}

        {mode === 'slider' && (
          <div className="relative w-full max-w-lg mx-auto overflow-hidden select-none">
            <img src={result.pngDataUrl} alt="Base Encoded" className="w-full max-h-72 object-contain mx-auto" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img src={originalUrl} alt="Overlay Original" className="w-full max-h-72 object-contain mx-auto" />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute bottom-2 left-4 right-4 z-20"
            />
          </div>
        )}

        {mode === 'diff' && (
          <div className="text-center space-y-2">
            <div className="text-[11px] font-mono text-emerald-400">50x Amplified Pixel Diff Map (Green = Altered LSBs)</div>
            <img src={result.diffDataUrl} alt="Diff Map" className="max-h-64 mx-auto object-contain rounded border border-emerald-500/40" />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-xs font-mono text-slate-400">
        <span>Zoom:</span>
        <div className="flex gap-1.5">
          {[1, 1.5, 2].map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-2 py-0.5 rounded ${zoom === z ? 'bg-emerald-500/20 text-[#00FF88] font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              {z * 100}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
