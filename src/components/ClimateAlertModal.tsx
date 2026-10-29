import React, { useState, useEffect } from 'react';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  Snowflake,
  Sun,
  Flame,
  Wind,
  CloudSnow,
  Battery,
  Zap,
  Activity,
  CheckCircle2,
  Brain,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ThermometerSnowflake,
  RefreshCw,
  Gauge,
  Layers,
  HelpCircle,
  Wrench,
} from 'lucide-react';
import {
  SimulationParams,
  SystemId,
  WeatherEventType,
  ClimateAlertAssessment,
  ClimateAlertSeverity,
} from '../types/energy';
import {
  EXTREME_WEATHER_SCENARIOS,
  evaluateClimateResilience,
  getDefaultScenarioForRegion,
} from '../data/climateAlertData';
import { ENERGY_SYSTEMS } from '../data/systemsData';

interface ClimateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  simParams: SimulationParams;
  currentSystemId: SystemId;
  initialScenarioId?: WeatherEventType;
  onUpdateParams: (params: Partial<SimulationParams>) => void;
}

export const ClimateAlertModal: React.FC<ClimateAlertModalProps> = ({
  isOpen,
  onClose,
  simParams,
  currentSystemId,
  initialScenarioId,
  onUpdateParams,
}) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'diagnostics' | 'ai_engineering'>('scenarios');
  const [selectedScenarioId, setSelectedScenarioId] = useState<WeatherEventType>(
    initialScenarioId || getDefaultScenarioForRegion(simParams.climateRegion)
  );

  // AI analysis state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [appliedMitigationSuccess, setAppliedMitigationSuccess] = useState(false);

  // Auto-Fix / Auto-Mitigate mode state (persisted across sessions)
  const [autoMitigateEnabled, setAutoMitigateEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ecotwin_auto_mitigate') === 'true' || Boolean(simParams.autoMitigateClimateShocks);
    } catch {
      return false;
    }
  });

  // Update selected scenario if initialScenarioId changes when opened
  useEffect(() => {
    if (initialScenarioId) {
      setSelectedScenarioId(initialScenarioId);
    } else {
      setSelectedScenarioId(getDefaultScenarioForRegion(simParams.climateRegion));
    }
  }, [initialScenarioId, simParams.climateRegion, isOpen]);

  // Recalculate live assessment for the currently selected scenario
  const assessment: ClimateAlertAssessment = evaluateClimateResilience(
    simParams,
    currentSystemId,
    selectedScenarioId
  );

  const selectedScenario = EXTREME_WEATHER_SCENARIOS[selectedScenarioId];
  const currentSystem = ENERGY_SYSTEMS[currentSystemId];

  // Auto-Fix from Next Time effect: whenever a scenario is selected or loaded, if autoMitigateEnabled is active, auto-resolve!
  useEffect(() => {
    if (isOpen && autoMitigateEnabled && assessment.isInsufficient) {
      const sizing = Object.keys(assessment.recommendedSizing).length > 0
        ? assessment.recommendedSizing
        : {
            thermalCapacityMultiplier: 1.45,
            heatPumpCop: 4.8,
            batteryCapacityKWh: 40,
          };
      onUpdateParams({
        ...sizing,
        autoMitigateClimateShocks: true,
      });
      setAppliedMitigationSuccess(true);
      const timer = setTimeout(() => setAppliedMitigationSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedScenarioId, currentSystemId, autoMitigateEnabled, assessment.isInsufficient, isOpen]);

  if (!isOpen) return null;

  const handleToggleAutoMitigate = (enabled: boolean) => {
    setAutoMitigateEnabled(enabled);
    try {
      localStorage.setItem('ecotwin_auto_mitigate', enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
    onUpdateParams({ autoMitigateClimateShocks: enabled });
    if (enabled && (assessment.isInsufficient || assessment.severity !== 'OPTIMAL')) {
      const sizing = Object.keys(assessment.recommendedSizing).length > 0
        ? assessment.recommendedSizing
        : {
            thermalCapacityMultiplier: 1.45,
            heatPumpCop: 4.8,
            batteryCapacityKWh: 40,
          };
      handleApplySizing({
        ...sizing,
        autoMitigateClimateShocks: true,
      });
    }
  };

  const handleAutoFixNow = () => {
    const sizing = Object.keys(assessment.recommendedSizing).length > 0
      ? assessment.recommendedSizing
      : {
          thermalCapacityMultiplier: 1.45,
          heatPumpCop: 4.8,
          batteryCapacityKWh: 40,
        };
    handleApplySizing({
      ...sizing,
      autoMitigateClimateShocks: autoMitigateEnabled,
    });
  };

  // Run AI Resiliency Engineering assessment via server endpoint
  const handleRunAiAnalysis = async () => {
    setAiLoading(true);
    setAiReport(null);
    try {
      const response = await fetch('/api/climate-alert-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simParams,
          systemId: currentSystemId,
          systemName: currentSystem?.name || 'Inverter Clean Energy System',
          scenarioId: selectedScenarioId,
          scenarioName: selectedScenario.name,
          designTempC: selectedScenario.designTempC,
          calculatedMetrics: assessment.metrics,
          currentAlerts: assessment.alerts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setAiReport(data);
    } catch (err: any) {
      console.error('Failed to run AI climate analysis:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplySizing = (recommended: Partial<SimulationParams>) => {
    onUpdateParams(recommended);
    setAppliedMitigationSuccess(true);
    setTimeout(() => {
      setAppliedMitigationSuccess(false);
    }, 3500);
  };

  // One-click apply scenario conditions directly into the live 3D simulation
  const handleApplyScenarioToSim = () => {
    const yieldMultiplier = Math.max(0.1, Number((1 - selectedScenario.solarCutPct / 100).toFixed(2)));
    onUpdateParams({
      ambientTempC: selectedScenario.designTempC,
      solarYieldMultiplier: yieldMultiplier,
    });
  };

  const getSeverityStyle = (sev: ClimateAlertSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          badge: 'bg-red-500/20 text-red-400 border-red-500/40',
          indicator: 'bg-red-500',
          text: 'text-red-400',
        };
      case 'SEVERE':
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          indicator: 'bg-amber-500',
          text: 'text-amber-400',
        };
      case 'WARNING':
        return {
          badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          indicator: 'bg-yellow-400',
          text: 'text-yellow-300',
        };
      case 'OPTIMAL':
      default:
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          indicator: 'bg-emerald-400',
          text: 'text-emerald-300',
        };
    }
  };

  const sevStyle = getSeverityStyle(assessment.severity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col text-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/80 text-red-400 border border-red-800/60 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Climate Alert & Extreme Weather Stress Studio
                </h2>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${sevStyle.badge}`}
                >
                  {assessment.severity}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thermodynamic vulnerability assessment & survivability modeling for{' '}
                <span className="text-cyan-300 font-semibold">{currentSystem?.name}</span>
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

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/40 shrink-0 overflow-x-auto">
          <div className="flex gap-2 py-2">
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'scenarios'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Stress Scenarios</span>
            </button>

            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'diagnostics'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Physics & Deficits</span>
              {assessment.alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'SEVERE').length > 0 ? (
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {assessment.alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'SEVERE').length}
                </span>
              ) : assessment.severity === 'OPTIMAL' ? (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">
                  ✓
                </span>
              ) : assessment.alerts.length > 0 ? (
                <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-[9px] flex items-center justify-center font-bold">
                  {assessment.alerts.length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => {
                setActiveTab('ai_engineering');
                if (!aiReport && !aiLoading) {
                  handleRunAiAnalysis();
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'ai_engineering'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Resiliency Engineering</span>
              <span className="text-[9px] uppercase px-1 rounded bg-purple-950 text-purple-300 border border-purple-700">
                Gemini
              </span>
            </button>
          </div>

          {/* Quick 1-Click Mitigate Button in tab bar */}
          {assessment.isInsufficient && (
            <button
              onClick={() => handleApplySizing(assessment.recommendedSizing)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              <span>Auto-Upgrade System</span>
            </button>
          )}
        </div>

        {/* Success alert message when mitigation applied */}
        {appliedMitigationSuccess && (
          <div className="bg-emerald-950/90 border-b border-emerald-600 px-5 py-2.5 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">
                Resiliency sizing applied to simulation! System parameters upgraded.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-300">
              Battery: {simParams.batteryCapacityKWh} kWh | Solar: {simParams.solarCapacityKW} kW | COP: {simParams.heatPumpCop}
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SCENARIOS SELECTOR */}
          {activeTab === 'scenarios' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Select Extreme Weather Stress Test</span>
                    <span className="text-xs text-slate-400 font-normal">
                      (Simulates ASHRAE 99.6% design day extremes)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Test your system against historical weather shocks, grid collapse, and thermodynamic limits.
                  </p>
                </div>

                <button
                  onClick={handleApplyScenarioToSim}
                  className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                  title="Applies scenario ambient temperature & solar factor to live 3D simulation"
                >
                  <ThermometerSnowflake className="w-3.5 h-3.5" />
                  <span>Push {selectedScenario.designTempC}°C to 3D Twin</span>
                </button>
              </div>

              {/* Scenario cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(EXTREME_WEATHER_SCENARIOS).map((scen) => {
                  const isSelected = selectedScenarioId === scen.id;
                  const scenAssessment = evaluateClimateResilience(simParams, currentSystemId, scen.id);
                  const isPass = scenAssessment.severity === 'OPTIMAL';

                  return (
                    <button
                      key={scen.id}
                      type="button"
                      onClick={() => setSelectedScenarioId(scen.id)}
                      className={`text-left p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                          : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {scen.id === 'polar_vortex' && <Snowflake className="w-4 h-4 text-cyan-300" />}
                            {scen.id === 'extreme_heatwave' && <Sun className="w-4 h-4 text-amber-400" />}
                            {scen.id === 'dunkelflaute_blizzard' && <CloudSnow className="w-4 h-4 text-sky-300" />}
                            {scen.id === 'desert_superheat' && <Flame className="w-4 h-4 text-orange-400" />}
                            {scen.id === 'tropical_cyclone' && <Wind className="w-4 h-4 text-teal-300" />}
                            <span className="text-xs font-bold text-white">{scen.name}</span>
                          </div>

                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isPass ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                            }`}
                          >
                            {isPass ? 'PASS' : scenAssessment.severity}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-2 mb-3">
                          {scen.tagline}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400">
                        <div>
                          Temp: <span className="text-white font-bold">{scen.designTempC}°C</span>
                        </div>
                        <div>
                          Wind: <span className="text-cyan-300 font-bold">{scen.windSpeedMph}mph</span>
                        </div>
                        <div className="text-right">
                          Solar: <span className="text-amber-300 font-bold">-{scen.solarCutPct}%</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Scenario Detailed Deep Dive */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                      Active Stress Simulation
                    </span>
                    <h4 className="text-base font-bold text-white">{selectedScenario.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedScenario.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase px-2.5 py-1 rounded-xl border ${sevStyle.badge}`}
                    >
                      {assessment.headline}
                    </span>
                  </div>
                </div>

                {/* Auto-Mitigate Applied Success Toast */}
                {appliedMitigationSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold">
                        System automatically upgraded! Thermal shortfall eliminated and battery autonomy reinforced to 24h+.
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase px-2 py-0.5 rounded bg-emerald-900 border border-emerald-700">
                      100% Resilient
                    </span>
                  </div>
                )}

                {/* Auto-Fix Callout Banner (Shown when insufficient) OR Resilient Shield Status */}
                {assessment.isInsufficient ? (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/70 border border-red-500/60 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-900/60 border border-red-500/50 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>System Insufficiency Detected</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-red-900/80 text-red-300 border border-red-700">
                            Auto-Fix Available
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {assessment.metrics.deficitKW > 0
                            ? `Thermal gap of ${assessment.metrics.deficitKW.toFixed(1)} kW unmet load & ${assessment.metrics.batteryAutonomyHours}h battery reserve during ${selectedScenario.gridOutageHours}h event.`
                            : `Limited battery autonomy (${assessment.metrics.batteryAutonomyHours}h) during ${selectedScenario.gridOutageHours}h blackout event.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleAutoFixNow}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                        title="Instantly re-size battery, compressor stages, and buffer tanks to survive this event"
                      >
                        <Wrench className="w-3.5 h-3.5 text-white" />
                        <span>Auto-Fix Insufficiency Now</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/60 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-900/60 border border-emerald-400/60 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>System Fully Resilient & Climate Shielded</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                            100% Protected
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Thermal delivery ({assessment.metrics.systemCapacityKW.toFixed(1)} kW) fully covers peak load ({assessment.metrics.peakLoadKW.toFixed(1)} kW) with {assessment.metrics.batteryAutonomyHours}h off-grid autonomy.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onUpdateParams({
                          thermalCapacityMultiplier: 1.0,
                          heatPumpCop: 3.8,
                          batteryCapacityKWh: 13.5,
                          autoMitigateClimateShocks: false,
                        });
                        setAutoMitigateEnabled(false);
                        try {
                          localStorage.setItem('ecotwin_auto_mitigate', 'false');
                        } catch {}
                      }}
                      className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors whitespace-nowrap self-end sm:self-auto cursor-pointer"
                      title="Reset to default baseline sizing to re-test stress conditions"
                    >
                      Reset to Baseline
                    </button>
                  </div>
                )}

                {/* Persistent Auto-Fix from Next Time Toggle Bar */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-cyan-800/60 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${autoMitigateEnabled ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/60' : 'bg-slate-800 text-slate-400'}`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Auto-Fix from Next Time</span>
                        {autoMitigateEnabled && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse">
                            Active Shield
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Automatically adapts equipment sizing and battery reserves whenever extreme weather is tested.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={autoMitigateEnabled}
                      onChange={(e) => handleToggleAutoMitigate(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

                {/* Instant Assessment Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      Peak Thermal Demand
                    </span>
                    <p className="text-lg font-bold font-mono text-white mt-0.5">
                      {assessment.metrics.peakLoadKW.toFixed(1)}{' '}
                      <span className="text-xs text-slate-400 font-normal">kW</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Delivery: {assessment.metrics.systemCapacityKW.toFixed(1)} kW
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      Unmet Thermal Gap
                    </span>
                    <p
                      className={`text-lg font-bold font-mono mt-0.5 ${
                        assessment.metrics.deficitKW > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {assessment.metrics.deficitKW > 0
                        ? `-${assessment.metrics.deficitKW.toFixed(1)} kW`
                        : '0.0 kW (Fully Met)'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {assessment.metrics.auxiliaryHeatEngaged ? 'Aux resistance coils tripped' : '100% heat pump'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      Off-Grid Battery Life
                    </span>
                    <p
                      className={`text-lg font-bold font-mono mt-0.5 ${
                        assessment.metrics.batteryAutonomyHours < 6
                          ? 'text-red-400'
                          : assessment.metrics.batteryAutonomyHours < 12
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {assessment.metrics.batteryAutonomyHours}{' '}
                      <span className="text-xs text-slate-400 font-normal">Hours</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Outage: {selectedScenario.gridOutageHours}h event
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      Effective Inverter COP
                    </span>
                    <p
                      className={`text-lg font-bold font-mono mt-0.5 ${
                        assessment.metrics.copDeratePct > 30 ? 'text-amber-400' : 'text-cyan-300'
                      }`}
                    >
                      {assessment.metrics.effectiveCop.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Derated -{assessment.metrics.copDeratePct}% from base {simParams.heatPumpCop}
                    </p>
                  </div>
                </div>

                {/* Primary Risk statement */}
                {assessment.isInsufficient ? (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 flex items-start gap-2.5 text-xs text-red-200">
                    <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-red-300">Failure Vulnerability (Unmitigated): </span>
                      {selectedScenario.primaryRisk}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-300">Vulnerability Mitigated & Shielded: </span>
                      Thermal delivery ({assessment.metrics.systemCapacityKW.toFixed(1)} kW) eliminates risk of {selectedScenario.primaryRisk.toLowerCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED PHYSICS & DEFICITS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white">
                  Thermodynamic Breakdown: {selectedScenario.name} ({selectedScenario.designTempC}°C)
                </h3>
                <p className="text-xs text-slate-400">
                  Engineering physics modeling based on building envelope heat loss coefficient (UA), vapor compression ratio, and battery discharge rates.
                </p>
              </div>

              {/* Physics Resilience Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      assessment.isInsufficient || assessment.alerts.length > 0
                        ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                        : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                    }`}
                  >
                    {assessment.isInsufficient || assessment.alerts.length > 0 ? (
                      <Wrench className="w-4 h-4 animate-pulse" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {assessment.isInsufficient || assessment.alerts.length > 0
                        ? 'Physics Optimization Available'
                        : 'Physics Verification Passed: 100% Protected'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {assessment.isInsufficient || assessment.alerts.length > 0
                        ? 'Auto-Fix scales cold-climate multi-stage compressor, BESS storage, and solar array.'
                        : `Envelope, compressor delivery (${assessment.metrics.systemCapacityKW.toFixed(1)} kW vs ${assessment.metrics.peakLoadKW.toFixed(1)} kW load), and storage exceed all standards.`}
                    </p>
                  </div>
                </div>

                {(assessment.isInsufficient || assessment.alerts.length > 0) && (
                  <button
                    onClick={handleAutoFixNow}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-950/50 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                    <span>Auto-Fix All Physics Shortfalls</span>
                  </button>
                )}
              </div>

              {/* Visual Demand vs Capacity Bar */}
              {(() => {
                const maxBarKW = Math.max(16, assessment.metrics.peakLoadKW * 1.12, assessment.metrics.systemCapacityKW * 1.12);
                return (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-300">
                        Thermal Load vs Compressor Delivery (kW)
                      </span>
                      <span className="font-mono text-slate-400">
                        Capacity: {assessment.metrics.systemCapacityKW.toFixed(1)} kW | Peak Demand:{' '}
                        {assessment.metrics.peakLoadKW.toFixed(1)} kW
                      </span>
                    </div>

                    {/* Dual bar chart */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400 w-24 shrink-0">Peak Demand:</span>
                        <div className="flex-1 h-5 rounded-lg bg-slate-800 overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-lg flex items-center justify-end px-2 text-[10px] font-bold text-white font-mono transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(8, (assessment.metrics.peakLoadKW / maxBarKW) * 100))}%`,
                            }}
                          >
                            {assessment.metrics.peakLoadKW.toFixed(1)} kW
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400 w-24 shrink-0">Compressor:</span>
                        <div className="flex-1 h-5 rounded-lg bg-slate-800 overflow-hidden relative">
                          <div
                            className={`h-full rounded-lg flex items-center justify-end px-2 text-[10px] font-bold text-white font-mono transition-all duration-500 ${
                              assessment.metrics.deficitKW > 0 ? 'bg-cyan-600' : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(8, (assessment.metrics.systemCapacityKW / maxBarKW) * 100))}%`,
                            }}
                          >
                            {assessment.metrics.systemCapacityKW.toFixed(1)} kW
                          </div>
                        </div>
                      </div>
                    </div>

                    {assessment.metrics.deficitKW > 0 && (
                      <p className="text-[11px] text-red-400 bg-red-950/50 p-2 rounded-xl border border-red-900/60 font-mono">
                        ⚠️ Deficit: {assessment.metrics.deficitKW.toFixed(1)} kW shortfall. Auxiliary electric resistance staging must supply this gap at COP 1.0, consuming {assessment.metrics.auxiliaryPowerKW.toFixed(1)} kW of emergency power.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Diagnosed Vulnerability Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {assessment.isInsufficient ? 'Active Vulnerabilities & Failure Modes' : 'Monitored Operating Conditions & Buffers'} ({assessment.alerts.length})
                </h4>

                {assessment.alerts.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 text-center space-y-2">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-bold text-emerald-300">
                      Zero Critical Vulnerabilities Detected
                    </p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Your current clean energy sizing maintains safe thermal and electrical reserves under {selectedScenario.name}.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {assessment.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-red-950/60 border-red-800/80 text-red-200'
                            : alert.severity === 'SEVERE'
                            ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
                            : 'bg-yellow-950/50 border-yellow-800/70 text-yellow-200'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            alert.severity === 'CRITICAL'
                              ? 'text-red-400'
                              : alert.severity === 'SEVERE'
                              ? 'text-amber-400'
                              : 'text-yellow-400'
                          }`}
                        />
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{alert.title}</span>
                              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                                {alert.category}
                              </span>
                            </div>
                            {alert.id.includes('battery') && (
                              <button
                                onClick={() => handleApplySizing({ batteryCapacityKWh: 48 })}
                                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Expand to 48 kWh</span>
                              </button>
                            )}
                            {alert.id === 'cop_collapse' && (
                              <button
                                onClick={() => handleApplySizing({ heatPumpCop: 4.8 })}
                                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Upgrade to COP 4.8</span>
                              </button>
                            )}
                            {alert.id === 'solar_occlusion' && (
                              <button
                                onClick={() => handleApplySizing({ solarCapacityKW: 14.5 })}
                                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Scale to 14.5 kW</span>
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-300">{alert.description}</p>
                          <p className="text-[11px] font-mono text-slate-400 bg-black/30 p-1.5 rounded-lg border border-white/5">
                            {alert.engineeringDetail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommended Engineering Action Cards */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Physics-Backed Mitigation Actions
                  </h4>

                  {Object.keys(assessment.recommendedSizing).length > 0 && (
                    <button
                      onClick={() => handleApplySizing(assessment.recommendedSizing)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Apply All Mitigations</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assessment.mitigations.map((mit, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-white">{mit.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                            {mit.impactLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {mit.description}
                        </p>
                      </div>

                      {mit.actionableParamUpdate && (
                        <button
                          onClick={() => handleApplySizing(mit.actionableParamUpdate!)}
                          className="self-start text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Apply this fix</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI RESILIENCY ENGINEERING (GEMINI 3.8 FLASH) */}
          {activeTab === 'ai_engineering' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-700/60">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      AI Climate Resilience Engineer (Gemini 3.8 Flash)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Grounded building decarbonization & ASHRAE extreme weather survival protocols
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunAiAnalysis}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-xs font-semibold text-purple-200 border border-purple-700/60 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span>{aiLoading ? 'Analyzing...' : 'Re-run Analysis'}</span>
                </button>
              </div>

              {aiLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-200">
                    Consulting Gemini 3.8 Flash Thermodynamics Engine...
                  </p>
                  <p className="text-xs text-slate-400">
                    Evaluating refrigerant compression ratios, defrost cycle power penalties, and battery BMS cold thresholds.
                  </p>
                </div>
              ) : aiReport ? (
                <div className="space-y-4">
                  {/* Executive Diagnosis */}
                  <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                        Executive Engineering Assessment
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-700">
                        {aiReport.resiliencyRating || 'VULNERABLE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {aiReport.executiveDiagnosis}
                    </p>
                  </div>

                  {/* Retrofit Recommendations Table */}
                  {aiReport.retrofitRecommendations && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Recommended Retrofit Engineering Actions
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {aiReport.retrofitRecommendations.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-white">{item.title}</span>
                                <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">
                                  {item.costTier}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mb-2">{item.specification}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono">
                              <span className="text-emerald-400 block font-semibold">
                                ✓ {item.solves}
                              </span>
                              <span className="text-slate-500">{item.paybackOrValue}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emergency Operating Protocols */}
                  {aiReport.emergencyOperatingProtocols && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Emergency Extreme Weather Operating Protocols</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {aiReport.emergencyOperatingProtocols.map((protocol: string, pIdx: number) => (
                          <li key={pIdx} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{protocol}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ASHRAE Design Notes */}
                  {aiReport.ashraeDesignStandardNotes && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>ASHRAE & Safety Standards Compliance Notes</span>
                      </h4>
                      <ul className="space-y-1.5 text-[11px] font-mono text-slate-400">
                        {aiReport.ashraeDesignStandardNotes.map((note: string, nIdx: number) => (
                          <li key={nIdx} className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold">›</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 1-Click Apply AI Resiliency Sizing */}
                  {aiReport.minimumResilientSizing && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Apply Verified Resilient Sizing Package</span>
                        </h4>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Battery: {aiReport.minimumResilientSizing.batteryKWh} kWh | Solar:{' '}
                          {aiReport.minimumResilientSizing.solarKW} kW | COP:{' '}
                          {aiReport.minimumResilientSizing.heatPumpCop} | Buffer:{' '}
                          {aiReport.minimumResilientSizing.thermalBufferGallons} gal
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handleApplySizing({
                            batteryCapacityKWh: aiReport.minimumResilientSizing.batteryKWh,
                            solarCapacityKW: aiReport.minimumResilientSizing.solarKW,
                            heatPumpCop: aiReport.minimumResilientSizing.heatPumpCop,
                            smartShadingActive: aiReport.minimumResilientSizing.smartShading ?? true,
                          })
                        }
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all cursor-pointer shrink-0"
                      >
                        Apply AI Hardening
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <Brain className="w-8 h-8 text-purple-400 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Click "Re-run Analysis" to generate customized AI extreme weather guidance.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>Region: {simParams.climateRegion.toUpperCase()}</span>
            <span>•</span>
            <span>Test: {selectedScenario.designTempC}°C</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
