import React, { useState } from 'react';
import {
  Sun,
  Zap,
  Battery,
  Flame,
  Globe,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  TrendingUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { SimulationParams, SystemId } from '../types/energy';

interface ViewportTelemetryHUDProps {
  currentSystemId: SystemId;
  simParams: SimulationParams;
}

export const ViewportTelemetryHUD: React.FC<ViewportTelemetryHUDProps> = ({
  currentSystemId,
  simParams,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute live physics telemetry based on current simulation state
  const hour = simParams.sunAngleHour;
  const isDaylight = hour >= 6 && hour <= 18;
  const solarFactor = isDaylight
    ? Math.sin(((hour - 6) / 12) * Math.PI) * (simParams.solarYieldMultiplier || 1.0)
    : 0;

  const currentSolarKW = Number((simParams.solarCapacityKW * solarFactor).toFixed(1));

  // HVAC / Building base demand
  const ambientDelta = Math.abs(simParams.ambientTempC - 21); // 21C comfort baseline
  const baseThermalKW = Number(((simParams.buildingSizeSqFt / 180) * (1 + ambientDelta * 0.04)).toFixed(1));
  const effectiveCop = simParams.heatPumpCop || 3.8;
  const compressorElectricKW = Number((baseThermalKW / effectiveCop).toFixed(1));

  // Net electrical bus balance
  const netElectricKW = Number((currentSolarKW - compressorElectricKW).toFixed(1));
  const isExporting = netElectricKW > 0;

  // Battery buffer status
  const batterySoc = Math.min(100, Math.max(15, Math.round(50 + solarFactor * 45)));

  // Autonomy %
  const autonomyPct = Math.min(100, Math.max(20, Math.round((currentSolarKW / Math.max(1, compressorElectricKW)) * 100)));

  if (isCollapsed) {
    return (
      <div className="fixed top-20 left-4 z-20 pointer-events-auto">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white shadow-2xl backdrop-blur-xl transition-all cursor-pointer group"
          title="Expand Live Telemetry HUD"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Activity className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold tracking-tight">Telemetry HUD</span>
          <Maximize2 className="w-3 h-3 text-slate-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-20 left-4 z-20 pointer-events-auto w-72 bg-slate-900/85 hover:bg-slate-900/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 overflow-hidden transition-all duration-200">
      {/* Top Header */}
      <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-tight">Live Physics Telemetry</span>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Minimize Telemetry HUD"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Key Physics Gauges */}
      <div className="p-3.5 space-y-3">
        {/* Row 1: Solar & HVAC Electric */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              Solar Generation
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-mono font-bold text-amber-300 tabular-nums">
                {currentSolarKW}
              </span>
              <span className="text-[10px] font-mono text-slate-500">kW</span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              {isDaylight ? `${Math.round(solarFactor * 100)}% peak insolation` : 'Night array standby'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              Compressor Draw
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-mono font-bold text-cyan-300 tabular-nums">
                {compressorElectricKW}
              </span>
              <span className="text-[10px] font-mono text-slate-500">kW</span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              COP {effectiveCop.toFixed(1)} · {baseThermalKW} kW thermal
            </span>
          </div>
        </div>

        {/* Row 2: Net Grid Bus & Storage */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              Net Grid Power
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-lg font-mono font-bold tabular-nums ${
                  isExporting ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {Math.abs(netElectricKW)}
              </span>
              <span className="text-[10px] font-mono text-slate-500">kW</span>
            </div>
            <span
              className={`text-[10px] font-semibold block ${
                isExporting ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isExporting ? '↑ Net Exporting' : '↓ Grid Import'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              LiFePO4 Storage
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-mono font-bold text-indigo-300 tabular-nums">
                {batterySoc}%
              </span>
              <span className="text-[10px] font-mono text-slate-500">SoC</span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              {simParams.batteryCapacityKWh} kWh capacity
            </span>
          </div>
        </div>

        {/* Real-time Autonomy Progress Bar */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400">Clean Energy Autonomy</span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums">{autonomyPct}%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${autonomyPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
