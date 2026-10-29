import React, { useState } from 'react';
import {
  Zap,
  X,
  Loader2,
  TrendingDown,
  Clock,
  DollarSign,
  Lightbulb,
} from 'lucide-react';
import { QuickAuditResult } from '../types/energy';

interface QuickAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAuditModal: React.FC<QuickAuditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deviceType, setDeviceType] = useState('Standard Electric Resistance Water Heater (50 Gal)');
  const [currentPowerWatts, setCurrentPowerWatts] = useState(4500);
  const [hoursPerDay, setHoursPerDay] = useState(3.5);
  const [utilityRate, setUtilityRate] = useState(0.18);
  const [replacementTier, setReplacementTier] = useState('Hybrid Heat Pump Water Heater (Uniform Energy Factor UEF 3.85)');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      name: 'Electric Water Heater -> Heat Pump Water Heater',
      device: 'Standard Electric Resistance Water Heater (50 Gal)',
      watts: 4500,
      hours: 3.5,
      replacement: 'Hybrid Heat Pump Water Heater (UEF 3.85)',
    },
    {
      name: 'Old Central AC (SEER 10) -> Inverter Variable Heat Pump (SEER2 22)',
      device: '3-Ton Split AC Unit (SEER 10)',
      watts: 3600,
      hours: 6.0,
      replacement: 'Variable-Speed Inverter Heat Pump (SEER2 22, COP 4.2)',
    },
    {
      name: 'Commercial Warehouse High-Bay Halide -> High-Efficacy LED',
      device: '400W Metal Halide Industrial Fixtures (Qty 20)',
      watts: 8000,
      hours: 12.0,
      replacement: 'DLC Premium Dimmable High-Bay LED (165 lm/W, 110W per fixture)',
    },
    {
      name: 'Single-Speed Pool Pump -> Variable-Speed ECM Pump',
      device: 'Single-Speed 1.5 HP Pool Circulation Pump',
      watts: 1800,
      hours: 8.0,
      replacement: 'Energy Star Variable-Speed Permanent Magnet ECM Pump (consumes 220W at low speed)',
    },
  ];

  const handleRunAudit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/quick-energy-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceType,
          currentPowerWatts,
          hoursPerDay,
          utilityRatePerKWh: utilityRate,
          replacementTier,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to calculate quick audit.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Instant Appliance & Device Audit</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/80">
                  gemini-3.1-flash-lite • Fast Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rapid quantitative ROI, annual kWh & operational tips
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Quick Upgrade Benchmarks
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDeviceType(p.device);
                    setCurrentPowerWatts(p.watts);
                    setHoursPerDay(p.hours);
                    setReplacementTier(p.replacement);
                  }}
                  className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 transition-colors text-xs"
                >
                  <p className="font-semibold text-slate-200">{p.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.watts}W • {p.hours} hrs/day</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Device or Appliance</label>
              <input
                type="text"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rated Power Consumption ({currentPowerWatts} W)
              </label>
              <input
                type="number"
                value={currentPowerWatts}
                onChange={(e) => setCurrentPowerWatts(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Average Daily Duty Cycle ({hoursPerDay} hrs/day)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Utility Rate (${utilityRate.toFixed(2)}/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                value={utilityRate}
                onChange={(e) => setUtilityRate(parseFloat(e.target.value) || 0.16)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Proposed High-Efficiency Upgrade</label>
              <input
                type="text"
                value={replacementTier}
                onChange={(e) => setReplacementTier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            onClick={handleRunAudit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-amber-950/40 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                <span>Running Instant Energy Audit...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-200" />
                <span>Run Fast Energy Audit</span>
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-semibold text-amber-400">Audit Results ({result.modelUsed})</span>
                <span className="text-[11px] text-emerald-400 font-mono">Immediate Payback Analysis</span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {result.text}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
              <p className="font-semibold mb-1">Audit Failed</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
