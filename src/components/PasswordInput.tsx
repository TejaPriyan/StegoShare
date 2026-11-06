import React, { useState } from 'react';
import { evaluatePasswordStrength } from '../engine/cryptoEngine';

export const PasswordInput: React.FC<{
  password: string;
  confirmPassword?: string;
  onPasswordChange: (p: string) => void;
  onConfirmChange?: (c: string) => void;
  showConfirm?: boolean;
}> = ({ password, confirmPassword = '', onPasswordChange, onConfirmChange, showConfirm = true }) => {
  const [showText, setShowText] = useState(false);
  const strength = evaluatePasswordStrength(password);
  const passwordsMatch = !showConfirm || !password || (password === confirmPassword);

  return (
    <div className="space-y-3 p-4 rounded-xl bg-[#0E1714] border border-emerald-500/20">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <span>🔐 AES-256-GCM Encryption Password</span>
          <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
        </label>
        <button
          type="button"
          onClick={() => setShowText(!showText)}
          className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 font-bold"
        >
          {showText ? 'HIDE' : 'SHOW'}
        </button>
      </div>

      <input
        type={showText ? 'text' : 'password'}
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        placeholder="Enter password to encrypt with AES-256-GCM..."
        className="w-full px-3.5 py-2.5 rounded-lg bg-[#070D0B] border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500"
      />

      {showConfirm && password.length > 0 && onConfirmChange && (
        <input
          type={showText ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => onConfirmChange(e.target.value)}
          placeholder="Confirm password..."
          className={`w-full px-3.5 py-2.5 rounded-lg bg-[#070D0B] border text-white placeholder-slate-500 text-xs font-mono focus:outline-none ${
            confirmPassword.length > 0 && !passwordsMatch ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
          }`}
        />
      )}

      {password.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400">Strength: <span style={{ color: strength.color }}>{strength.label}</span></span>
            <span className="text-slate-400">Entropy: ~{strength.entropyBits} bits</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(strength.score / 4) * 100}%`,
                backgroundColor: strength.color
              }}
            />
          </div>
          {showConfirm && confirmPassword.length > 0 && (
            <div className={`text-[11px] font-mono ${passwordsMatch ? 'text-[#00FF88]' : 'text-rose-400'}`}>
              {passwordsMatch ? 'Passwords match ✓' : 'Passwords do not match ✗'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
