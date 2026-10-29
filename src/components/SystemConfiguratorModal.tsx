import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  Sun,
  Battery,
  Flame,
  DollarSign,
  TrendingUp,
  Leaf,
  Check,
  RotateCcw,
  Award,
  Globe,
  Snowflake,
  CloudRain,
  Wind,
  Mountain,
  Compass,
  CalendarClock,
  ShieldAlert,
  Wrench,
  Zap,
} from 'lucide-react';
import { SimulationParams, ClimateRegionId } from '../types/energy';
import { CLIMATE_REGIONS } from '../data/climateData';
import { evaluateClimateResilience } from '../data/climateAlertData';

interface SystemConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  simParams: SimulationParams;
  onUpdateParams: (params: Partial<SimulationParams>) => void;
  onOpenScorecard?: () => void;
  onOpenLifecycleTracker?: () => void;
  onOpenClimateAlert?: () => void;
  onOpenSmartDevices?: () => void;
}

export const SystemConfiguratorModal: React.FC<SystemConfiguratorModalProps> = ({
  isOpen,
  onClose,
  simParams,
  onUpdateParams,
  onOpenScorecard,
  onOpenLifecycleTracker,
  onOpenClimateAlert,
  onOpenSmartDevices,
}) => {
  const [localParams, setLocalParams] = useState<SimulationParams>(simParams);
  const [autoHarden, setAutoHarden] = useState<boolean>(() => {
    return localStorage.getItem('ecoflow_auto_harden_climate') === 'true';
  });

  // Sync state and automatically apply resilience mitigations if auto-harden is active
  useEffect(() => {
    if (isOpen) {
      if (autoHarden) {
        const res = evaluateClimateResilience(simParams, 'heat_pump');
        if (res.isInsufficient && res.recommendedSizing) {
          setLocalParams({ ...simParams, ...res.recommendedSizing });
          return;
        }
      }
      setLocalParams(simParams);
    }
  }, [isOpen, simParams, autoHarden]);

  if (!isOpen) return null;

  // Real-time thermodynamic and financial math calculations
  const annualBaselineCost = localParams.monthlyBaselineBill * 12;
  const annualBaselineKWh = annualBaselineCost / localParams.utilityRatePerKWh;

  // Solar PV estimated annual production scaled by geographic solar yield factor
  const yieldFactor = localParams.solarYieldMultiplier ?? 1.0;
  const annualSolarGenKWh = localParams.solarCapacityKW * 1380 * yieldFactor;

  // Heat pump COP efficiency factor vs baseline resistance (COP 1.0) or gas boiler (80% AFUE)
  // Assumes HVAC is ~50% of total building energy load, scaled by climate degree days / temp deviation
  const hvacLoadRatio = 0.52;
  const tempDeviation = Math.abs(localParams.ambientTempC - 20);
  const climateLoadMultiplier = 1 + tempDeviation * 0.015;
  const hvacBaselineKWh = annualBaselineKWh * hvacLoadRatio * climateLoadMultiplier;
  const hvacSavingsKWh = hvacBaselineKWh * (1 - 1.2 / localParams.heatPumpCop);

  // Smart shading savings (reduces cooling peak by 22% during peak months)
  const shadingSavingsKWh = localParams.smartShadingActive ? annualBaselineKWh * 0.08 : 0;

  // Total annual kWh reduced or generated
  const totalAnnualKWhSaved = Math.min(
    annualSolarGenKWh + hvacSavingsKWh + shadingSavingsKWh,
    annualBaselineKWh * 0.96
  );

  const annualDollarSavings = totalAnnualKWhSaved * localParams.utilityRatePerKWh;
  const newAnnualBill = Math.max(annualBaselineCost - annualDollarSavings, 180); // nominal grid connection charge

  // System Gross & Net Capital Cost (Estimated industry benchmark: $2.80/W solar, $750/kWh battery, $9,500 heat pump)
  const grossCost =
    localParams.solarCapacityKW * 2800 +
    localParams.batteryCapacityKWh * 750 +
    (localParams.heatPumpCop > 3.0 ? 9800 : 6500) +
    (localParams.smartShadingActive ? 3200 : 0);

  // 30% Federal Clean Energy Tax Credit (IRA 25C / 48)
  const taxCredit = grossCost * 0.3;
  const netCost = grossCost - taxCredit;

  // Simple Payback in years
  const paybackYears = annualDollarSavings > 0 ? (netCost / annualDollarSavings).toFixed(1) : 'N/A';

  // Environmental offset (Average US grid emission factor: 0.85 lbs CO2 / kWh = 0.0003855 MT CO2 / kWh)
  const co2OffsetTons = (totalAnnualKWhSaved * 0.0003855).toFixed(1);
  const treesEquivalent = Math.round(parseFloat(co2OffsetTons) * 45);

  const handleApply = () => {
    onUpdateParams(localParams);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col text-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 shrink-0">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate sm:whitespace-normal">
                System Configurator & ROI Simulator
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-none">
                Design custom solar, BESS, heat pump, and building parameters with real-time financial ROI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 ml-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 pb-8 sm:pb-12 overflow-y-auto flex-1 space-y-6">
          {/* Key ROI Scorecards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Annual Savings</span>
              </div>
              <p className="text-lg font-bold text-emerald-400 font-mono">
                ${Math.round(annualDollarSavings).toLocaleString()}
                <span className="text-xs text-slate-400 font-normal"> / yr</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {( (annualDollarSavings / annualBaselineCost) * 100 ).toFixed(0)}% bill cut
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simple Payback</span>
              </div>
              <p className="text-lg font-bold text-white font-mono">
                {paybackYears} <span className="text-xs text-slate-400 font-normal">Years</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Net Cost: ${Math.round(netCost).toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>Carbon Offset</span>
              </div>
              <p className="text-lg font-bold text-emerald-300 font-mono">
                {co2OffsetTons} <span className="text-xs text-slate-400 font-normal">MT CO2 / yr</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                ~{treesEquivalent} trees planted/yr
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                <span>20-Yr Net Savings</span>
              </div>
              <p className="text-lg font-bold text-purple-300 font-mono">
                ${Math.round(annualDollarSavings * 20 - netCost).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">After full equipment payback</p>
            </div>
          </div>

          {/* Climate Context & Geographic Region Section */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight uppercase">
                    Climate Context & Geographic Region
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Auto-calibrates baseline ambient temperature, solar yield factor & HVAC degree days
                  </p>
                </div>
              </div>

              {/* Active Region Pill */}
              <div className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono">
                <span className="text-slate-400">Active:</span>
                <span className="text-cyan-300 font-bold">
                  {CLIMATE_REGIONS[localParams.climateRegion || 'temperate']?.name || 'Temperate'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300 font-bold">
                  {(localParams.solarYieldMultiplier || 1.0).toFixed(2)}x Yield
                </span>
              </div>
            </div>

            {/* Region Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {Object.values(CLIMATE_REGIONS).map((reg) => {
                const isSelected = (localParams.climateRegion || 'temperate') === reg.id;
                return (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => {
                      setLocalParams({
                        ...localParams,
                        climateRegion: reg.id,
                        ambientTempC: reg.baselineTempC,
                        solarYieldMultiplier: reg.solarYieldMultiplier,
                      });
                    }}
                    className={`text-left p-3 rounded-xl border transition-all relative ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/80 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/40'
                        : 'bg-slate-950/60 border-slate-800/90 hover:bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {reg.id === 'desert' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                        {reg.id === 'arctic' && <Snowflake className="w-3.5 h-3.5 text-cyan-300" />}
                        {reg.id === 'temperate' && <Compass className="w-3.5 h-3.5 text-emerald-400" />}
                        {reg.id === 'tropical' && <CloudRain className="w-3.5 h-3.5 text-teal-400" />}
                        {reg.id === 'maritime' && <Wind className="w-3.5 h-3.5 text-sky-400" />}
                        {reg.id === 'alpine' && <Mountain className="w-3.5 h-3.5 text-purple-400" />}
                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {reg.name}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">{reg.tagline}</p>

                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono border-t border-slate-800/60 pt-1.5">
                      <div className="text-slate-400">
                        Base Temp: <span className="text-white font-semibold">{reg.baselineTempC}°C</span>
                      </div>
                      <div className="text-slate-400 text-right">
                        Solar: <span className="text-amber-300 font-semibold">{reg.solarYieldMultiplier}x</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fine Tuning Sliders for Climate Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              {/* Ambient Temperature Fine Tune */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-medium">Fine-Tune Baseline Ambient Temperature</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {localParams.ambientTempC > 0 ? `+${localParams.ambientTempC}` : localParams.ambientTempC}°C ({Math.round(localParams.ambientTempC * 1.8 + 32)}°F)
                  </span>
                </div>
                <input
                  type="range"
                  min="-25"
                  max="45"
                  step="1"
                  value={localParams.ambientTempC}
                  onChange={(e) =>
                    setLocalParams({ ...localParams, ambientTempC: parseInt(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>-25°C (Extreme Cold)</span>
                  <span>20°C (Comfort)</span>
                  <span>+45°C (Desert Peak)</span>
                </div>
              </div>

              {/* Solar Yield Multiplier Fine Tune */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-medium">Regional Solar Yield Multiplier</span>
                  <span className="font-mono font-bold text-amber-300">
                    {(localParams.solarYieldMultiplier || 1.0).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.6"
                  step="0.02"
                  value={localParams.solarYieldMultiplier || 1.0}
                  onChange={(e) =>
                    setLocalParams({ ...localParams, solarYieldMultiplier: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>0.50x (Subarctic)</span>
                  <span>1.0x (Standard)</span>
                  <span>1.60x (Equatorial/Desert)</span>
                </div>
              </div>
            </div>

            {/* Real-time Climate Resilience Indicator & 1-Click Auto-Fix */}
            {(() => {
              const resCheck = evaluateClimateResilience(localParams, 'heat_pump');
              const isCrit = resCheck.severity === 'CRITICAL';
              const isSev = resCheck.severity === 'SEVERE';
              const isWarn = resCheck.severity === 'WARNING';
              const isOptimal = resCheck.severity === 'OPTIMAL';

              // Strip redundant alert prefixes from headline to prevent duplicate 'CRITICAL' / 'WARNING'
              const cleanHeadline = resCheck.headline.replace(
                /^(CRITICAL ALERT:|SEVERE WARNING:|WARNING:|RESILIENT:)\s*/i,
                ''
              );

              const handleAutoFix = () => {
                if (resCheck.recommendedSizing && Object.keys(resCheck.recommendedSizing).length > 0) {
                  setLocalParams((prev) => ({
                    ...prev,
                    ...resCheck.recommendedSizing,
                  }));
                }
              };

              return (
                <div
                  className={`p-3 sm:p-3.5 rounded-xl border flex flex-col gap-2.5 text-xs transition-all shadow-sm ${
                    isCrit
                      ? 'bg-red-950/70 border-red-800/80 text-red-200'
                      : isSev
                      ? 'bg-amber-950/70 border-amber-800/80 text-amber-200'
                      : isWarn
                      ? 'bg-yellow-950/60 border-yellow-800/80 text-yellow-200'
                      : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                        <ShieldAlert
                          className={`w-4 h-4 ${
                            isCrit
                              ? 'text-red-400 animate-pulse'
                              : isSev
                              ? 'text-amber-400'
                              : isWarn
                              ? 'text-yellow-400'
                              : 'text-emerald-400'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                          <span className="font-bold uppercase tracking-tight text-white">
                            {isOptimal ? 'Weather Stress Resilient:' : `${resCheck.severity} Weather Stress:`}
                          </span>
                          <span className={isOptimal ? 'text-emerald-200' : 'text-slate-300'}>
                            {cleanHeadline}
                          </span>
                          {resCheck.metrics.deficitKW > 0 && (
                            <span className="font-mono text-red-300 font-bold whitespace-nowrap">
                              (-{resCheck.metrics.deficitKW} kW Deficit)
                            </span>
                          )}
                        </div>

                        {/* Benchmark Context & Active Conditions */}
                        <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>
                            Baseline: <strong className="text-slate-200">{localParams.ambientTempC > 0 ? `+${localParams.ambientTempC}` : localParams.ambientTempC}°C</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Stress Benchmark: <strong className="text-slate-200">{resCheck.scenarioName}</strong>
                          </span>
                          {autoHarden && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-medium inline-flex items-center gap-0.5">
                                <Zap className="w-3 h-3" /> Auto-Harden Active
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                      {!isOptimal && (
                        <button
                          type="button"
                          onClick={handleAutoFix}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                          title="Instantly auto-size system capacity to resolve deficit"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Auto-Fix Deficit</span>
                        </button>
                      )}

                      {onOpenClimateAlert && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenClimateAlert();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 text-[11px] font-semibold text-white transition-colors cursor-pointer shrink-0"
                        >
                          Stress Studio ›
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Auto-Fix toggle for next time */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] gap-2">
                    <span className="text-slate-300">
                      Auto-fix and maintain weather resilience automatically
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                      <span className="text-slate-400 text-[10px]">
                        {autoHarden ? 'Auto-Fix On' : 'Manual'}
                      </span>
                      <input
                        type="checkbox"
                        checked={autoHarden}
                        onChange={(e) => {
                          const active = e.target.checked;
                          setAutoHarden(active);
                          localStorage.setItem('ecoflow_auto_harden_climate', active ? 'true' : 'false');
                          if (active && resCheck.recommendedSizing) {
                            setLocalParams((prev) => ({
                              ...prev,
                              ...resCheck.recommendedSizing,
                            }));
                          }
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                          autoHarden ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                            autoHarden ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Interactive Parameter Sliders */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Engineering Sizing & Grid Tariffs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Solar PV Capacity */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Solar Photovoltaic Array</span>
                  </div>
                  <span className="font-mono font-semibold text-amber-300">
                    {localParams.solarCapacityKW} kW DC
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={localParams.solarCapacityKW}
                  onChange={(e) =>
                    setLocalParams({ ...localParams, solarCapacityKW: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0 kW (None)</span>
                  <span>Est: {Math.round(localParams.solarCapacityKW * 1380).toLocaleString()} kWh/yr</span>
                  <span>30 kW</span>
                </div>
              </div>

              {/* BESS Battery Storage */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <span>LiFePO4 Battery Storage (BESS)</span>
                  </div>
                  <span className="font-mono font-semibold text-emerald-300">
                    {localParams.batteryCapacityKWh} kWh
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="2.5"
                  value={localParams.batteryCapacityKWh}
                  onChange={(e) =>
                    setLocalParams({ ...localParams, batteryCapacityKWh: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0 kWh (Grid Tie)</span>
                  <span>Peak Shaving Buffer</span>
                  <span>60 kWh (Multi-Pack)</span>
                </div>
              </div>

              {/* Heat Pump COP */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Flame className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Heat Pump System COP</span>
                  </div>
                  <span className="font-mono font-semibold text-cyan-300">
                    COP {localParams.heatPumpCop.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="5.2"
                  step="0.1"
                  value={localParams.heatPumpCop}
                  onChange={(e) =>
                    setLocalParams({ ...localParams, heatPumpCop: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>2.0 (Standard)</span>
                  <span>Cold-Climate Inverter (4.0+)</span>
                  <span>5.2 (Ground Source)</span>
                </div>
              </div>

              {/* Utility Rate ($/kWh) */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                    <span>Utility Electricity Rate</span>
                  </div>
                  <span className="font-mono font-semibold text-purple-300">
                    ${localParams.utilityRatePerKWh.toFixed(2)} / kWh
                  </span>
                </div>
                <input
                  type="range"
                  min="0.08"
                  max="0.45"
                  step="0.01"
                  value={localParams.utilityRatePerKWh}
                  onChange={(e) =>
                    setLocalParams({ ...localParams, utilityRatePerKWh: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>$0.08 (Hydro/Low)</span>
                  <span>$0.18 (US Avg)</span>
                  <span>$0.45 (California/Peak TOU)</span>
                </div>
              </div>

              {/* Current Monthly Baseline Bill */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-300">Current Monthly Bill</span>
                  <span className="font-mono font-semibold text-white">
                    ${localParams.monthlyBaselineBill} / month
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2500"
                  step="25"
                  value={localParams.monthlyBaselineBill}
                  onChange={(e) =>
                    setLocalParams({ ...localParams, monthlyBaselineBill: parseInt(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-300"
                />
              </div>

              {/* Smart Shading & Automation Toggle */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Motorized Kinetic Solar Louvers</p>
                  <p className="text-[11px] text-slate-400">Sun-tracking solar heat gain suppression</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLocalParams({
                      ...localParams,
                      smartShadingActive: !localParams.smartShadingActive,
                    })
                  }
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    localParams.smartShadingActive ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      localParams.smartShadingActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-800 bg-slate-950/90 shrink-0">
          {/* Mobile Layout (< sm): Prominent Full-Width Primary CTA + Compact Horizontal Utility Row */}
          <div className="flex flex-col gap-2 sm:hidden">
            <button
              onClick={handleApply}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply to 3D Digital Twin</span>
            </button>
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                onClick={() => setLocalParams(simParams)}
                className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={onClose}
                  className="px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                {onOpenLifecycleTracker && (
                  <button
                    onClick={() => {
                      onUpdateParams(localParams);
                      onClose();
                      onOpenLifecycleTracker();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg transition-all cursor-pointer"
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>20-Yr Life</span>
                  </button>
                )}
                {onOpenScorecard && (
                  <button
                    onClick={() => {
                      onUpdateParams(localParams);
                      onClose();
                      onOpenScorecard();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg transition-all cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Scorecard</span>
                  </button>
                )}
                {onOpenSmartDevices && (
                  <button
                    onClick={() => {
                      onUpdateParams(localParams);
                      onClose();
                      onOpenSmartDevices();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Smart Dev</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout (>= sm): Traditional full horizontal bar */}
          <div className="hidden sm:flex items-center justify-between">
            <button
              onClick={() => setLocalParams(simParams)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {onOpenSmartDevices && (
                <button
                  onClick={() => {
                    onUpdateParams(localParams);
                    onClose();
                    onOpenSmartDevices();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                  title="Configure Virtual Smart Home Appliances & Connected EV Charging"
                >
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Smart Devices</span>
                </button>
              )}
              {onOpenLifecycleTracker && (
                <button
                  onClick={() => {
                    onUpdateParams(localParams);
                    onClose();
                    onOpenLifecycleTracker();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                  title="View 20-Year Asset Degradation & ROI Break-Even"
                >
                  <CalendarClock className="w-4 h-4 text-cyan-400" />
                  <span>20-Yr Lifecycle</span>
                </button>
              )}

              {onOpenScorecard && (
                <button
                  onClick={() => {
                    onUpdateParams(localParams);
                    onClose();
                    onOpenScorecard();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
                  title="Apply and Generate PDF Sustainability Scorecard"
                >
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Scorecard PDF</span>
                </button>
              )}

              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer shrink-0"
              >
                <Check className="w-4 h-4" />
                <span>Apply to 3D Digital Twin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
