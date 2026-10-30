import React, { useState, useMemo } from 'react';
import {
  Zap,
  Sparkles,
  ArrowRight,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  TrendingDown,
  DollarSign,
  Leaf,
  Sliders,
  Flame,
  Sun,
  Battery,
  ShieldCheck,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { SimulationParams, SystemId } from '../types/energy';

export interface QuickWinRecommendation {
  id: string;
  title: string;
  description: string;
  monthlySavingsUsd: number;
  annualCo2AvoidedKg: number;
  efficiencyGain: string;
  actionLabel: string;
  category: 'efficiency' | 'solar' | 'storage' | 'shading' | 'tariff';
  applyUpdates: Partial<SimulationParams>;
}

interface QuickWinsOverlayProps {
  simParams: SimulationParams;
  currentSystemId: SystemId;
  onApplyQuickWin: (updates: Partial<SimulationParams>) => void;
}

export const QuickWinsOverlay: React.FC<QuickWinsOverlayProps> = ({
  simParams,
  currentSystemId,
  onApplyQuickWin,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  // Dynamically generate context-aware quick wins based on current simulation state
  const quickWins = useMemo<QuickWinRecommendation[]>(() => {
    const wins: QuickWinRecommendation[] = [];
    const hour = simParams.sunAngleHour;
    const isPeakHour = hour >= 16 && hour <= 21;
    const isMiddaySolar = hour >= 10 && hour <= 15;

    // 1. Water Heater / Heat Pump COP optimization
    if (simParams.heatPumpCop < 4.4) {
      wins.push({
        id: 'lower_water_temp',
        title: 'Lower Water Heater Temp by 2°C',
        description: 'Lowering hydronic setpoint from 54°C to 52°C reduces compressor lift pressure, improving seasonal COP with zero comfort loss.',
        monthlySavingsUsd: 18,
        annualCo2AvoidedKg: 240,
        efficiencyGain: '+0.35 COP Boost',
        actionLabel: 'Apply: Set COP 4.3',
        category: 'efficiency',
        applyUpdates: {
          heatPumpCop: Number(Math.min(5.2, simParams.heatPumpCop + 0.35).toFixed(2)),
        },
      });
    }

    // 2. Solar Facade Shading
    if (!simParams.smartShadingActive && simParams.ambientTempC > 22) {
      wins.push({
        id: 'deploy_shading',
        title: 'Deploy Automated Smart Facade Shading',
        description: 'Blocks 82% of peak solar radiative heat gain, eliminating chiller pull-down spikes and extending compressor lifespan.',
        monthlySavingsUsd: 32,
        annualCo2AvoidedKg: 380,
        efficiencyGain: '-1.8 kW Peak Chill Load',
        actionLabel: 'Apply: Deploy Shading',
        category: 'shading',
        applyUpdates: {
          smartShadingActive: true,
        },
      });
    }

    // 3. Peak TOU Battery Shaving
    if (isPeakHour && simParams.batteryCapacityKWh >= 10) {
      wins.push({
        id: 'peak_shave_bess',
        title: 'Shift BESS to Peak Shaving Dispatch',
        description: `Currently peak tariff window (${Math.floor(hour)}:00). Discharge stored battery buffer to bypass steep $0.34/kWh utility peak demand rates.`,
        monthlySavingsUsd: 46,
        annualCo2AvoidedKg: 190,
        efficiencyGain: '100% Peak Shaved',
        actionLabel: 'Apply: Peak Shaving',
        category: 'storage',
        applyUpdates: {
          thermalCapacityMultiplier: 1.15,
        },
      });
    }

    // 4. Solar Surplus Thermal Pre-Cooling
    if (isMiddaySolar && simParams.solarCapacityKW >= 6) {
      wins.push({
        id: 'solar_precooling',
        title: 'Pre-Cool Thermal Mass During Solar Peak',
        description: 'Rooftop solar generation is currently free and abundant. Sub-cool indoor thermal envelope by 1.5°C now to drift through evening peak tariff.',
        monthlySavingsUsd: 28,
        annualCo2AvoidedKg: 310,
        efficiencyGain: '+18% Self-Consumption',
        actionLabel: 'Apply: Solar Pre-Cooling',
        category: 'solar',
        applyUpdates: {
          heatPumpCop: Number(Math.min(5.2, simParams.heatPumpCop + 0.2).toFixed(2)),
          smartShadingActive: true,
        },
      });
    }

    // 5. Extreme Sub-Zero Dual Stage Economizer
    if (simParams.ambientTempC < 4 && simParams.heatPumpCop < 3.8) {
      wins.push({
        id: 'cold_economizer',
        title: 'Engage Cold-Climate Vapor Injection',
        description: `Ambient temp is ${simParams.ambientTempC}°C. Engaging flash-injection subcooler prevents auxiliary resistive heating strip lock-in.`,
        monthlySavingsUsd: 52,
        annualCo2AvoidedKg: 520,
        efficiencyGain: '+0.5 COP in Sub-Zero',
        actionLabel: 'Apply: Vapor Injection',
        category: 'efficiency',
        applyUpdates: {
          heatPumpCop: Number(Math.min(4.8, simParams.heatPumpCop + 0.5).toFixed(2)),
          thermalCapacityMultiplier: 1.25,
        },
      });
    }

    // Fallback baseline optimization if all above are already applied
    if (wins.length === 0) {
      wins.push({
        id: 'high_efficiency_tune',
        title: 'Fine-Tune Variable-Speed Inverter Hydraulics',
        description: 'System is operating efficiently. Enabling variable inverter delta-T modulation extracts an additional 8% seasonal efficiency.',
        monthlySavingsUsd: 14,
        annualCo2AvoidedKg: 160,
        efficiencyGain: '+8% Seasonal Efficiency',
        actionLabel: 'Apply: Inverter Tune',
        category: 'efficiency',
        applyUpdates: {
          heatPumpCop: Number(Math.min(5.2, simParams.heatPumpCop + 0.15).toFixed(2)),
        },
      });
    }

    return wins;
  }, [simParams]);

  const activeWin = quickWins[currentIndex % quickWins.length];

  const handleApply = (win: QuickWinRecommendation) => {
    onApplyQuickWin(win.applyUpdates);
    setAppliedId(win.id);
    setTimeout(() => {
      setAppliedId(null);
      // Advance to next tip if available
      if (quickWins.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % quickWins.length);
      }
    }, 1200);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % quickWins.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + quickWins.length) % quickWins.length);
  };

  if (isDismissed || !activeWin) return null;

  // Minimized Pill Mode
  if (isMinimized) {
    return (
      <div className="fixed top-20 right-4 z-20 pointer-events-auto">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white shadow-xl shadow-amber-950/20 backdrop-blur-md transition-all cursor-pointer group"
          title="Expand Quick Wins Recommendation"
        >
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold">Quick Win ({quickWins.length})</span>
          <Maximize2 className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    );
  }

  // Expanded Overlay Card Mode
  return (
    <div className="fixed top-20 right-4 z-20 pointer-events-auto w-80 sm:w-88 bg-slate-900/95 border border-amber-500/40 rounded-2xl shadow-2xl shadow-slate-950/80 backdrop-blur-md overflow-hidden text-slate-100 transition-all duration-300 animate-in fade-in slide-in-from-top-3">
      {/* Accent Header Stripe */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-500" />

      {/* Card Header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-tight">Quick Win Opportunity</span>
              <span className="text-[10px] text-amber-400 font-mono font-medium px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-800/60">
                {(currentIndex % quickWins.length) + 1}/{quickWins.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss overlay"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-sm font-bold text-white leading-snug">{activeWin.title}</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{activeWin.description}</p>
        </div>

        {/* Impact Metric Badges */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] font-mono">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-bold">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span>+${activeWin.monthlySavingsUsd}/mo</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>{activeWin.efficiencyGain}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-950/80 text-teal-300 border border-teal-800/80 hidden sm:flex">
            <Leaf className="w-3 h-3 text-teal-400" />
            <span>-{activeWin.annualCo2AvoidedKg} kg CO₂</span>
          </div>
        </div>

        {/* Action Button & Carousel Controls */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={quickWins.length <= 1}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30 cursor-pointer"
              title="Previous Quick Win"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              disabled={quickWins.length <= 1}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30 cursor-pointer"
              title="Next Quick Win"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => handleApply(activeWin)}
            className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {appliedId === activeWin.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                <span>Applied!</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
                <span>{activeWin.actionLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
