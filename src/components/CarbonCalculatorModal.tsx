import React, { useState, useMemo } from 'react';
import {
  X,
  Leaf,
  Sliders,
  TrendingDown,
  Globe,
  Flame,
  Sun,
  Battery,
  ShieldCheck,
  CheckCircle2,
  TreeDeciduous,
  Car,
  Fuel,
  Plane,
  Home,
  Smartphone,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Copy,
  Zap,
  Navigation,
} from 'lucide-react';
import { EnergySystemMeta, SimulationParams, SystemId } from '../types/energy';
import {
  calculateCarbonFootprint,
  GRID_EMISSION_PROFILES,
  BASELINE_THERMAL_SOURCES,
  CarbonFootprintMetrics,
} from '../data/carbonCalculatorData';
import { CarbonGauge } from './CarbonGauge';

interface CarbonCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: EnergySystemMeta;
  simParams: SimulationParams;
  onUpdateParams?: (updates: Partial<SimulationParams>) => void;
  onOpenGridCarbon?: () => void;
}

export const CarbonCalculatorModal: React.FC<CarbonCalculatorModalProps> = ({
  isOpen,
  onClose,
  system,
  simParams,
  onUpdateParams,
  onOpenGridCarbon,
}) => {
  // Local scenario settings
  const [gridProfileId, setGridProfileId] = useState<string>('us_average');
  const [customGridGPerKWh, setCustomGridGPerKWh] = useState<number>(386);
  const [isCustomGrid, setIsCustomGrid] = useState<boolean>(false);
  const [baselineThermalId, setBaselineThermalId] = useState<string>('natural_gas');

  // Sliders for dynamic scenario simulation
  const [localSolarKW, setLocalSolarKW] = useState<number>(simParams.solarCapacityKW || 8.5);
  const [localBatteryKWh, setLocalBatteryKWh] = useState<number>(simParams.batteryCapacityKWh || 13.5);
  const [localCop, setLocalCop] = useState<number>(simParams.heatPumpCop || 4.2);
  const [localSqFt, setLocalSqFt] = useState<number>(simParams.buildingSizeSqFt || 2400);
  const [localBill, setLocalBill] = useState<number>(simParams.monthlyBaselineBill || 320);

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'grid_baseline' | 'levers' | 'breakdown'>('overview');
  const [copied, setCopied] = useState<boolean>(false);
  const [appliedNotice, setAppliedNotice] = useState<boolean>(false);

  // Sync with props whenever modal opens or props change
  React.useEffect(() => {
    if (isOpen) {
      setLocalSolarKW(simParams.solarCapacityKW || 8.5);
      setLocalBatteryKWh(simParams.batteryCapacityKWh || 13.5);
      setLocalCop(simParams.heatPumpCop || 4.2);
      setLocalSqFt(simParams.buildingSizeSqFt || 2400);
      setLocalBill(simParams.monthlyBaselineBill || 320);
      if (simParams.gridCarbonIntensityKgPerKWh) {
        setCustomGridGPerKWh(Math.round(simParams.gridCarbonIntensityKgPerKWh * 1000));
        setIsCustomGrid(true);
      }
    }
  }, [isOpen, simParams]);

  // Dynamic simulation parameters for calculation
  const dynamicSimParams: SimulationParams = useMemo(() => ({
    ...simParams,
    solarCapacityKW: localSolarKW,
    batteryCapacityKWh: localBatteryKWh,
    heatPumpCop: localCop,
    buildingSizeSqFt: localSqFt,
    monthlyBaselineBill: localBill,
  }), [simParams, localSolarKW, localBatteryKWh, localCop, localSqFt, localBill]);

  // Calculate carbon metrics
  const metrics: CarbonFootprintMetrics = useMemo(() => {
    return calculateCarbonFootprint({
      systemId: system.id,
      simParams: dynamicSimParams,
      gridProfileId: isCustomGrid ? 'custom' : gridProfileId,
      customGridGPerKWh: isCustomGrid ? customGridGPerKWh : undefined,
      baselineThermalId,
    });
  }, [system.id, dynamicSimParams, gridProfileId, isCustomGrid, customGridGPerKWh, baselineThermalId]);

  // Handle apply to live 3D twin
  const handleApplyToSimulation = () => {
    if (onUpdateParams) {
      onUpdateParams({
        solarCapacityKW: localSolarKW,
        batteryCapacityKWh: localBatteryKWh,
        heatPumpCop: localCop,
        buildingSizeSqFt: localSqFt,
        monthlyBaselineBill: localBill,
      });
      setAppliedNotice(true);
      setTimeout(() => setAppliedNotice(false), 2500);
    }
  };

  // Copy summary
  const handleCopySummary = () => {
    const text = `EcoTwin Studio Carbon Footprint Audit:
System: ${system.name} (${system.sector})
Grid Baseline Emissions: ${metrics.baselineTotalMT} MT CO₂/yr
EcoTwin System Footprint: ${metrics.cleanSystemTotalMT} MT CO₂/yr
Annual CO₂ Saved: ${metrics.annualCO2SavedMT} MT/yr (${metrics.reductionPercentage}% Cut)
20-Year Lifetime Avoided: ${metrics.twentyYearLifetimeSavedMT} MT CO₂
Decarbonization Grade: ${metrics.decarbonizationGrade}
Equivalencies:
- ${metrics.treesPlantedSeedlings10Yr.toLocaleString()} tree seedlings grown for 10 years
- ${metrics.gasolineGallonsSaved.toLocaleString()} gallons of gasoline avoided
- ${metrics.passengerVehicleMilesAvoided.toLocaleString()} passenger vehicle miles displaced`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Carbon Footprint Calculator"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Carbon Footprint & Decarbonization Calculator
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/80">
                  EPA Physics Model
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Estimating net CO₂e emissions saved by <span className="text-cyan-300 font-semibold">{system.name}</span> vs traditional fossil-grid baseline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
              title="Copy Carbon Audit Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950/30 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Gauge & Impact</span>
          </button>

          <button
            onClick={() => setActiveTab('grid_baseline')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'grid_baseline'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Grid & Fossil Baseline</span>
          </button>

          <button
            onClick={() => setActiveTab('levers')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'levers'
                ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Clean Levers & Sizing</span>
          </button>

          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'breakdown'
                ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Emissions Ledger</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: OVERVIEW & GAUGE */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Radial Arc Gauge */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                <CarbonGauge metrics={metrics} size={300} />
              </div>

              {/* Right Column: Key Numbers & Tangible EPA Equivalencies */}
              <div className="lg:col-span-6 space-y-4">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Annual CO₂ Avoided
                    </span>
                    <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                      -{metrics.annualCO2SavedMT} MT
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {metrics.reductionPercentage}% lower than baseline
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      20-Yr Cumulative CO₂
                    </span>
                    <span className="text-2xl font-black text-cyan-400 font-mono mt-0.5 block">
                      -{metrics.twentyYearLifetimeSavedMT} MT
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Includes 0.5%/yr PV degradation
                    </span>
                  </div>
                </div>

                {/* EPA Tangible Equivalencies Carousel / Grid */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Real-World Environmental Equivalency</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-950/70 text-emerald-400 shrink-0">
                        <TreeDeciduous className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white font-mono">
                          {metrics.treesPlantedSeedlings10Yr.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          Tree seedlings grown for 10 yrs
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-950/70 text-amber-400 shrink-0">
                        <Fuel className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white font-mono">
                          {metrics.gasolineGallonsSaved.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          Gallons of gasoline avoided
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-sky-950/70 text-sky-400 shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white font-mono">
                          {metrics.passengerVehicleMilesAvoided.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          Passenger vehicle miles cut
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-950/70 text-purple-400 shrink-0">
                        <Plane className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white font-mono">
                          {metrics.passengerFlightsAvoided}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          Transatlantic flights avoided
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-cyan-950/70 text-cyan-400 shrink-0">
                        <Home className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white font-mono">
                          {metrics.homesElectricityPoweredForYear}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          Homes' annual electricity
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-teal-950/70 text-teal-400 shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white font-mono">
                          {metrics.smartphonesChargedThousands.toLocaleString()}k
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          Smartphone charges
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Hint */}
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/50 text-xs text-cyan-200 flex items-center justify-between">
                  <span>Want to test different grid emissions or fossil furnace baselines?</span>
                  <button
                    onClick={() => setActiveTab('grid_baseline')}
                    className="font-bold underline text-cyan-300 hover:text-white"
                  >
                    Adjust Baseline →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GRID & FOSSIL BASELINE SETTINGS */}
          {activeTab === 'grid_baseline' && (
            <div className="space-y-6">
              {/* Grid Emission Profile Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span>Regional Grid Carbon Intensity Factor</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select your regional utility grid generation profile or enter a custom emission intensity.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenGridCarbon && (
                      <button
                        onClick={onOpenGridCarbon}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 hover:text-white border border-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Fetch real-world grid carbon intensity via GPS or regional balancing authority"
                      >
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>Fetch Live Local Grid</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsCustomGrid(!isCustomGrid)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                    >
                      {isCustomGrid ? 'Use Regional Presets' : 'Custom g/kWh'}
                    </button>
                  </div>
                </div>

                {!isCustomGrid ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(GRID_EMISSION_PROFILES).map((prof) => {
                      const isSelected = gridProfileId === prof.id;
                      return (
                        <div
                          key={prof.id}
                          onClick={() => setGridProfileId(prof.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">{prof.name}</span>
                            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                              {prof.gPerKWh} g/kWh
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mb-1">{prof.description}</p>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            e.g. {prof.regionExample}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">Custom Marginal Grid Intensity</span>
                      <span className="font-mono text-cyan-300 font-bold text-sm">{customGridGPerKWh} g CO₂ / kWh</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="10"
                      value={customGridGPerKWh}
                      onChange={(e) => setCustomGridGPerKWh(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>50 g (Hydro/Wind)</span>
                      <span>386 g (US Average)</span>
                      <span>720 g (Coal Peakers)</span>
                      <span>1,000 g (Lignite)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Replaced Fossil Heating Baseline */}
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Replaced Heating Fuel & Thermal Baseline</span>
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  What fuel does the clean energy system replace or displace?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {Object.values(BASELINE_THERMAL_SOURCES).map((src) => {
                    const isSelected = baselineThermalId === src.id;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => setBaselineThermalId(src.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-white">{src.shortLabel}</span>
                          <span className="text-[10px] font-mono text-amber-300 font-semibold">
                            {src.efficiencyPct}% Eff
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{src.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Building Scale & Bill Inputs */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Building Footprint</span>
                    <span className="font-mono text-cyan-300 font-bold">{localSqFt.toLocaleString()} sq ft</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="100"
                    value={localSqFt}
                    onChange={(e) => setLocalSqFt(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Monthly Baseline Energy Bill</span>
                    <span className="font-mono text-emerald-300 font-bold">${localBill}/mo</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="20"
                    value={localBill}
                    onChange={(e) => setLocalBill(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLEAN SYSTEM LEVERS & SIZING */}
          {activeTab === 'levers' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>Dynamic System Sizing Levers</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fine-tune hardware specifications to analyze emissions reduction sensitivity.
                  </p>
                </div>

                <button
                  onClick={handleApplyToSimulation}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply to 3D Twin</span>
                </button>
              </div>

              {appliedNotice && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Parameters successfully synchronized to main 3D digital twin!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Solar PV Slider */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rooftop Solar PV</span>
                    </span>
                    <span className="font-mono text-amber-300 font-bold">{localSolarKW} kW</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="25"
                    step="0.5"
                    value={localSolarKW}
                    onChange={(e) => setLocalSolarKW(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Offsets: ~{metrics.solarPVOffsetMT} MT CO₂/yr
                  </span>
                </div>

                {/* Battery BESS Slider */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Battery className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Battery Storage</span>
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">{localBatteryKWh} kWh</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="1"
                    value={localBatteryKWh}
                    onChange={(e) => setLocalBatteryKWh(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Peak shift: ~{metrics.storagePeakDisplacementMT} MT CO₂/yr
                  </span>
                </div>

                {/* Heat Pump COP Slider */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Heat Pump COP</span>
                    </span>
                    <span className="font-mono text-emerald-300 font-bold">{localCop.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="5.5"
                    step="0.1"
                    value={localCop}
                    onChange={(e) => setLocalCop(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Thermodynamic multiplier vs fossil
                  </span>
                </div>
              </div>

              {/* Dynamic Live Result Bar */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-emerald-950/40 border border-cyan-700/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-300">Updated Decarbonization Score</div>
                  <div className="text-xl font-mono font-bold text-emerald-300">
                    {metrics.reductionPercentage}% Net Reduction ({metrics.annualCO2SavedMT} MT/yr)
                  </div>
                </div>
                <button
                  onClick={handleApplyToSimulation}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-md cursor-pointer transition-colors"
                >
                  Save to 3D Simulation
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: EMISSIONS BREAKDOWN & LEDGER */}
          {activeTab === 'breakdown' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Scope 1 & Scope 2 Emissions Ledger</span>
              </h3>

              {/* Breakdown Ledger Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Emissions Category</th>
                      <th className="py-2.5 px-3">Traditional Baseline</th>
                      <th className="py-2.5 px-3">EcoTwin Clean System</th>
                      <th className="py-2.5 px-3 text-right">Net CO₂ Avoided</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                        Scope 2: Grid Electricity
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{metrics.baselineElectricityMT} MT</td>
                      <td className="py-2.5 px-3 text-cyan-300">{metrics.cleanSystemGridMT} MT</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        -{(metrics.baselineElectricityMT - metrics.cleanSystemGridMT).toFixed(2)} MT
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                        Scope 1: On-Site Fossil Heating
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{metrics.baselineHeatingMT} MT</td>
                      <td className="py-2.5 px-3 text-emerald-300">0.00 MT (Electric)</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        -{metrics.baselineHeatingMT.toFixed(2)} MT
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                        Rooftop Solar PV Offset
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">0.00 MT</td>
                      <td className="py-2.5 px-3 text-amber-300">+{metrics.solarPVOffsetMT} MT clean gen</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        -{metrics.solarPVOffsetMT} MT
                      </td>
                    </tr>

                    <tr className="bg-slate-950/60 font-bold">
                      <td className="py-3 px-3 font-sans text-white">Net Annual Footprint</td>
                      <td className="py-3 px-3 text-red-400">{metrics.baselineTotalMT} MT CO₂/yr</td>
                      <td className="py-3 px-3 text-emerald-400">{metrics.cleanSystemTotalMT} MT CO₂/yr</td>
                      <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                        -{metrics.annualCO2SavedMT} MT ({metrics.reductionPercentage}%)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Methodology Note */}
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Methodology aligns with the GHG Protocol Corporate & Project Accounting Standards, incorporating EPA eGRID marginal generation intensity and NREL PVWatts solar yield calculations.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Selected System:</span>
            <span className="font-semibold text-white">{system.name}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-emerald-400 font-bold">{metrics.annualCO2SavedMT} MT CO₂/yr Saved</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
