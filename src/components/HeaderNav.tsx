import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Brain,
  Zap,
  Sliders,
  Sparkles,
  Leaf,
  Info,
  Award,
  CalendarClock,
  Compass,
  ShieldAlert,
  HelpCircle,
  BarChart3,
  Camera,
  ChevronDown,
  Layers,
  MapPin,
  Flame,
  Building2,
  Check,
  Search,
  ExternalLink,
} from 'lucide-react';
import { EnergySystemMeta, SimulationParams } from '../types/energy';

interface HeaderNavProps {
  currentSystem: EnergySystemMeta;
  simParams: SimulationParams;
  onOpenSearch: () => void;
  onOpenDeepDesign: () => void;
  onOpenQuickAudit: () => void;
  onOpenConfigurator: () => void;
  onOpenScorecard: () => void;
  onOpenLifecycleTracker?: () => void;
  onOpenBlueprintStudio?: () => void;
  onOpenClimateAlert?: () => void;
  onOpenCarbonCalc?: () => void;
  onOpenSmartDevices?: () => void;
  onOpenDailyReport?: () => void;
  onOpenCaptureScene?: () => void;
  onOpenGlobalHeatmap?: () => void;
  onOpenGridCarbon?: () => void;
  onStartTour?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentSystem,
  simParams,
  onOpenSearch,
  onOpenDeepDesign,
  onOpenQuickAudit,
  onOpenConfigurator,
  onOpenScorecard,
  onOpenLifecycleTracker,
  onOpenBlueprintStudio,
  onOpenClimateAlert,
  onOpenCarbonCalc,
  onOpenSmartDevices,
  onOpenDailyReport,
  onOpenCaptureScene,
  onOpenGlobalHeatmap,
  onOpenGridCarbon,
  onStartTour,
}) => {
  const [openMenu, setOpenMenu] = useState<'ai' | 'engineering' | 'climate' | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menu: 'ai' | 'engineering' | 'climate') => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleAction = (callback?: () => void) => {
    if (callback) {
      callback();
      setOpenMenu(null);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-4">
      <div
        ref={navRef}
        className="max-w-7xl mx-auto flex items-center justify-between gap-3"
      >
        {/* Left: Brand Identity & Active Archetype Spec */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-xl transition-all">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
            <Leaf className="w-4 h-4 text-slate-950" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">EcoTwin 3D</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                · {currentSystem.sector}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="text-emerald-400 font-medium">{currentSystem.standardRating}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-mono text-[11px] tabular-nums">
                {currentSystem.co2ReductionAnnual}
              </span>
            </div>
          </div>

          {/* Quick Climate Context Button */}
          <button
            onClick={onOpenConfigurator}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors ml-1 cursor-pointer"
            title="Click to modify active climate region & ambient temperature"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="capitalize">{simParams.climateRegion || 'Temperate'}</span>
            <span className="text-cyan-300 font-mono text-[11px] tabular-nums">
              {simParams.ambientTempC > 0 ? `+${simParams.ambientTempC}` : simParams.ambientTempC}°C
            </span>
          </button>
        </div>

        {/* Center: Command Center Navigation Dropdowns */}
        <div
          id="tour-intelligence-dock"
          className="pointer-events-auto hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl"
        >
          {/* Menu 1: AI & Simulation Intelligence */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                openMenu === 'ai'
                  ? 'bg-purple-950/90 text-purple-200 border border-purple-700/60 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Intelligence</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${openMenu === 'ai' ? 'rotate-180' : ''}`} />
            </button>

            {openMenu === 'ai' && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900/95 border border-slate-800 rounded-2xl p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => handleAction(onOpenDeepDesign)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-800/60 text-purple-300 mt-0.5">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center gap-1.5">
                      <span>Deep Thermodynamic Design</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Gemini 3.8 Flash high-thinking sizing, physical COP curves & CapEx audit
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenQuickAudit)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-300 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300">
                      Fast Appliance Audit
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Instant equipment efficiency recommendations & retrofit payback
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenSearch)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                      Search Grounding Hub
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Live web-grounded utility rebates, IRA 25C tax credits & regional tariffs
                    </p>
                  </div>
                </button>

                {onOpenSmartDevices && (
                  <button
                    onClick={() => handleAction(onOpenSmartDevices)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                        Smart Connected Devices
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        Simulate real-time EV charging, thermal buffer & appliance loads
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Menu 2: Facility & Sizing */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('engineering')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                openMenu === 'engineering'
                  ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-700/60 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Facility & Sizing</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${openMenu === 'engineering' ? 'rotate-180' : ''}`} />
            </button>

            {openMenu === 'engineering' && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900/95 border border-slate-800 rounded-2xl p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => handleAction(onOpenConfigurator)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 mt-0.5">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                      System Sizing Configurator
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Adjust solar kW, battery capacity, square footage & baseline utility bill
                    </p>
                  </div>
                </button>

                {onOpenBlueprintStudio && (
                  <button
                    onClick={() => handleAction(onOpenBlueprintStudio)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                        Floorplan Blueprint Studio
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        Interactive 2D architectural site plan with real-time clearance rules
                      </p>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => handleAction(onOpenScorecard)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-teal-950/80 border border-teal-800/60 text-teal-300 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-teal-300">
                      Sustainability Scorecard
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Grade ESG performance, 20-year net savings & export vector scorecard
                    </p>
                  </div>
                </button>

                {onOpenLifecycleTracker && (
                  <button
                    onClick={() => handleAction(onOpenLifecycleTracker)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 mt-0.5">
                      <CalendarClock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-indigo-300">
                        Lifecycle & Maintenance AI
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        D3 degradation curve, break-even payback & failure horizon predictions
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Menu 3: Climate & Decarbonization */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('climate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                openMenu === 'climate'
                  ? 'bg-cyan-950/90 text-cyan-200 border border-cyan-700/60 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Climate & Decarbonization</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${openMenu === 'climate' ? 'rotate-180' : ''}`} />
            </button>

            {openMenu === 'climate' && (
              <div className="absolute top-full right-0 mt-2 w-76 bg-slate-900/95 border border-slate-800 rounded-2xl p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2">
                {onOpenGlobalHeatmap && (
                  <button
                    onClick={() => handleAction(onOpenGlobalHeatmap)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 mt-0.5">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                        Global Renewable Heatmap (D3)
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        Interactive world map of solar GHI, HDD/CDD and system suitability
                      </p>
                    </div>
                  </button>
                )}

                {onOpenGridCarbon && (
                  <button
                    onClick={() => handleAction(onOpenGridCarbon)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                        Local Grid Carbon Intensity
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        GPS real-world emissions, generation fuel mix & clean charging windows
                      </p>
                    </div>
                  </button>
                )}

                {onOpenCarbonCalc && (
                  <button
                    onClick={() => handleAction(onOpenCarbonCalc)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-teal-950/80 border border-teal-800/60 text-teal-300 mt-0.5">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-teal-300">
                        Carbon Footprint Calculator
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        Physics-grounded emissions avoided vs natural gas & oil baselines
                      </p>
                    </div>
                  </button>
                )}

                {onOpenClimateAlert && (
                  <button
                    onClick={() => handleAction(onOpenClimateAlert)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-300 mt-0.5">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-rose-300">
                        Climate Resilience & Alerts
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        Simulate heat waves, polar vortex freezes & grid brownout shocks
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Telemetry & Utility Actions */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl">
          {/* Live Grid Carbon Indicator Pill */}
          {onOpenGridCarbon && (
            <button
              id="tour-grid-carbon"
              onClick={onOpenGridCarbon}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-emerald-600/50 text-xs transition-colors cursor-pointer"
              title="Real-Time Local Electric Grid Carbon Intensity"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                {simParams.gridCarbonData
                  ? `${simParams.gridCarbonData.carbonIntensityGPerKWh} g/kWh`
                  : '295 g/kWh'}
              </span>
            </button>
          )}

          {/* Daily Report PDF */}
          {onOpenDailyReport && (
            <button
              id="tour-daily-report"
              onClick={onOpenDailyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 hover:text-white border border-cyan-800/70 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              title="Daily Energy Performance Summary & Downloadable PDF Report"
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Daily Report</span>
            </button>
          )}

          {/* 2K Scene Snapshot */}
          {onOpenCaptureScene && (
            <button
              id="tour-capture-scene"
              onClick={onOpenCaptureScene}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
              title="Capture 2K Scene Snapshot with Thermodynamic Overlays"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          {/* Guided Tour */}
          {onStartTour && (
            <button
              onClick={onStartTour}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
              title="Start Interactive Guided Tour"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
