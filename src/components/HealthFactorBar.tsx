import React from 'react';
import { Shield, AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { getHealthFactorStatus } from '../utils/formatters';

interface HealthFactorBarProps {
  currentHF: number;
  projectedHF?: number;
  liquidationThreshold?: number; // e.g. 0.80
  className?: string;
  showDetails?: boolean;
}

export const HealthFactorBar: React.FC<HealthFactorBarProps> = ({
  currentHF,
  projectedHF,
  liquidationThreshold = 0.8,
  className = '',
  showDetails = true,
}) => {
  const currentStatus = getHealthFactorStatus(currentHF);
  const activeHF = projectedHF !== undefined ? projectedHF : currentHF;
  const activeStatus = getHealthFactorStatus(activeHF);

  // Convert HF to percentage for bar visualization (capped at 3.0 for 100% bar width)
  // 1.0 (Liquidation line) will be at ~33% mark
  // 1.5 (Safe line) will be at 50% mark
  const getBarPercentage = (hf: number) => {
    if (!isFinite(hf) || hf >= 3.0) return 100;
    if (hf <= 0) return 0;
    return Math.min(100, Math.max(5, (hf / 3.0) * 100));
  };

  const percentage = getBarPercentage(activeHF);

  return (
    <div className={`p-4 rounded-2xl bg-surface border border-surface-border ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-surface-light border border-surface-border text-slate-300">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-300 block">Health Factor</span>
            <span className="text-[11px] text-slate-500">Liquidation risk indicator</span>
          </div>
        </div>

        {/* Health Factor Value & Status Badge */}
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            {projectedHF !== undefined && projectedHF !== currentHF && (
              <span className="text-xs text-slate-500 line-through">
                {isFinite(currentHF) ? currentHF.toFixed(2) : '∞'}
              </span>
            )}
            <span className={`text-base font-bold font-mono ${activeStatus.color}`}>
              {isFinite(activeHF) ? activeHF.toFixed(2) : '∞'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${activeStatus.badgeColor}`}>
              {activeStatus.label}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative my-3">
        {/* Background track with color gradient zones */}
        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex relative border border-slate-800">
          {/* Danger zone: 0 to 1.1 (~36% of 3.0 scale) */}
          <div className="h-full w-[36%] bg-rose-950/40 border-r border-rose-500/20" title="Danger Zone (< 1.1)" />
          {/* Warning zone: 1.1 to 1.5 (~14% of 3.0 scale) */}
          <div className="h-full w-[14%] bg-amber-950/40 border-r border-amber-500/20" title="Moderate Risk (1.1 - 1.5)" />
          {/* Safe zone: > 1.5 (remaining 50%) */}
          <div className="h-full w-[50%] bg-emerald-950/40" title="Safe (> 1.5)" />

          {/* Active progress fill */}
          <div
            className={`absolute top-0 bottom-0 left-0 transition-all duration-300 rounded-full ${activeStatus.barColor}`}
            style={{ width: `${percentage}%`, opacity: 0.85 }}
          />
        </div>

        {/* Threshold Markers */}
        <div className="relative w-full text-[10px] text-slate-500 flex justify-between mt-1 px-1 font-mono">
          <span className="flex items-center gap-1 text-rose-400">
            <span>0</span>
          </span>
          <span className="text-rose-400/80" title="Liquidation threshold">1.0 Liq</span>
          <span className="text-amber-400/80">1.1 Alert</span>
          <span className="text-emerald-400/80">1.5 Safe</span>
          <span className="text-slate-400">&gt; 3.0</span>
        </div>
      </div>

      {/* Warning Alert if Health Factor is in Warning or Danger zone */}
      {activeHF < 1.1 && isFinite(activeHF) && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-rose-400 font-semibold">Immediate Liquidation Risk!</strong>
            Your health factor is under 1.1. If it drops below 1.0, third-party liquidators can liquidate your collateral at a penalty.
          </div>
        </div>
      )}

      {activeHF >= 1.1 && activeHF < 1.5 && isFinite(activeHF) && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-amber-400 font-semibold">Moderate Risk Alert</strong>
            Collateral price volatility could push your position into liquidation. Deposit more collateral to restore a safe ratio (&gt; 1.5).
          </div>
        </div>
      )}

      {/* Details explanation footer */}
      {showDetails && (
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-surface-border/50 pt-2">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Liquidation Threshold:</span>
          </span>
          <span className="font-mono text-slate-300">{(liquidationThreshold * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};
