import React from 'react';
import { CapacityReport } from '../types/stego';

export const CapacityMeter: React.FC<{ capacity: CapacityReport }> = ({ capacity }) => {
  return (
    <div className="p-4 rounded-xl bg-[#0E1714] border border-emerald-500/20 space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center">
        <span className="text-slate-300 font-semibold">Carrier Capacity</span>
        <span className={`px-2 py-0.5 rounded font-bold ${
          capacity.exceedsCapacity ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-[#00FF88]'
        }`}>
          {capacity.capacityPercentage.toFixed(2)}%
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            capacity.exceedsCapacity ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-[#00FF88]'
          }`}
          style={{ width: `${Math.min(100, Math.max(capacity.totalUsedBytes > 0 ? 2 : 0, capacity.capacityPercentage))}%` }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-1">
        <div>Available: <span className="text-slate-200">{capacity.maxPayloadBytes.toLocaleString()} B</span></div>
        <div>Used: <span className="text-slate-200">{capacity.totalUsedBytes.toLocaleString()} B</span></div>
        <div>Remaining: <span className="text-slate-200">{capacity.remainingBytes.toLocaleString()} B</span></div>
        <div>Total Pixels: <span className="text-slate-200">{capacity.totalPixels.toLocaleString()}</span></div>
      </div>
    </div>
  );
};
