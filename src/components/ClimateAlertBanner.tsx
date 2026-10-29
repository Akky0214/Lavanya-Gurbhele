import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  AlertOctagon,
  Flame,
  Snowflake,
  Sun,
  Wind,
  CloudSnow,
  ChevronRight,
  Zap,
  ArrowUpRight,
  RotateCcw,
  Sliders,
  Wrench,
} from 'lucide-react';
import { SimulationParams, SystemId, ClimateAlertAssessment, WeatherEventType } from '../types/energy';
import { evaluateClimateResilience, EXTREME_WEATHER_SCENARIOS } from '../data/climateAlertData';

interface ClimateAlertBannerProps {
  simParams: SimulationParams;
  currentSystemId: SystemId;
  onOpenAlertModal: (scenarioId?: WeatherEventType) => void;
  onApplyMitigation: (updated: Partial<SimulationParams>) => void;
}

export const ClimateAlertBanner: React.FC<ClimateAlertBannerProps> = ({
  simParams,
  currentSystemId,
  onOpenAlertModal,
  onApplyMitigation,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Evaluate live physics resilience against default or current regional stress scenario
  const assessment: ClimateAlertAssessment = evaluateClimateResilience(simParams, currentSystemId);

  const { severity, headline, metrics, isInsufficient, recommendedSizing } = assessment;

  // Icon mapping
  const getWeatherIcon = () => {
    switch (assessment.scenarioId) {
      case 'polar_vortex':
        return <Snowflake className="w-4 h-4 text-cyan-300 animate-pulse" />;
      case 'extreme_heatwave':
        return <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />;
      case 'dunkelflaute_blizzard':
        return <CloudSnow className="w-4 h-4 text-sky-300" />;
      case 'desert_superheat':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'tropical_cyclone':
        return <Wind className="w-4 h-4 text-teal-300" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  // Severity styles
  const getSeverityBadge = () => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-950/90 border-red-700/80 text-red-200 shadow-red-950/60 ring-1 ring-red-500/40',
          badge: 'bg-red-600 text-white animate-pulse',
          label: 'CRITICAL INSUFFICIENCY',
          icon: <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />,
        };
      case 'SEVERE':
        return {
          bg: 'bg-amber-950/90 border-amber-700/80 text-amber-200 shadow-amber-950/50',
          badge: 'bg-amber-600 text-white',
          label: 'SEVERE DEFICIT',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
        };
      case 'WARNING':
        return {
          bg: 'bg-yellow-950/80 border-yellow-800/80 text-yellow-200',
          badge: 'bg-yellow-600 text-black font-bold',
          label: 'WEATHER ADVISORY',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />,
        };
      case 'OPTIMAL':
      default:
        return {
          bg: 'bg-slate-900/90 border-emerald-700/60 text-emerald-200',
          badge: 'bg-emerald-600 text-white',
          label: 'CLIMATE RESILIENT',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />,
        };
    }
  };

  const style = getSeverityBadge();

  // If minimized, display compact floating pill
  if (isMinimized) {
    return (
      <div id="tour-climate-alerts" className="fixed top-17 left-4 z-20 pointer-events-auto transition-all duration-200 animate-in fade-in">
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-xl backdrop-blur-md cursor-pointer transition-transform hover:scale-105 ${style.bg}`}
          title="Click to expand real-time Climate Resilience Monitor"
        >
          {getWeatherIcon()}
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${style.badge}`}>
            {style.label}
          </span>
          <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
            {assessment.scenarioName}
          </span>
          {metrics.deficitKW > 0 && (
            <span className="text-xs font-mono text-red-300 font-bold">
              -{metrics.deficitKW} kW Deficit
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <aside
      id="tour-climate-alerts"
      aria-label="Real-time Climate Alert Monitor"
      className="fixed top-16 left-3 right-3 sm:left-auto sm:right-4 z-20 pointer-events-auto max-w-xl transition-all duration-200 animate-in fade-in slide-in-from-top-2"
    >
      <div className={`p-3 rounded-2xl border shadow-2xl backdrop-blur-md ${style.bg}`}>
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {getWeatherIcon()}
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${style.badge}`}>
              {style.label}
            </span>
            <span className="text-xs font-bold text-white truncate">
              {assessment.scenarioName}
            </span>
            <span className="text-[11px] text-slate-300 font-mono hidden md:inline">
              ({EXTREME_WEATHER_SCENARIOS[assessment.scenarioId || 'polar_vortex']?.designTempC}°C)
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsMinimized(true)}
              className="text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-800/60 transition-colors"
              title="Minimize to floating pill"
            >
              Minimize
            </button>
          </div>
        </div>

        {/* Headline & Metrics row */}
        <p className="text-xs text-slate-200 mb-2.5 font-medium leading-relaxed">
          {headline}
        </p>

        {/* Live metric indicators */}
        <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono mb-2.5">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-sans">
              Thermal Deficit
            </span>
            <span className={metrics.deficitKW > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
              {metrics.deficitKW > 0 ? `-${metrics.deficitKW.toFixed(1)} kW` : '0.0 kW (Met)'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-sans">
              Battery Autonomy
            </span>
            <span className={metrics.batteryAutonomyHours < 6 ? 'text-red-400 font-bold' : metrics.batteryAutonomyHours < 12 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              {metrics.batteryAutonomyHours}h
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-sans">
              COP Derating
            </span>
            <span className={metrics.copDeratePct > 35 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
              {metrics.effectiveCop.toFixed(2)} (-{metrics.copDeratePct}%)
            </span>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAlertModal(assessment.scenarioId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-white border border-slate-700/80 hover:border-cyan-500/60 transition-all cursor-pointer shadow-sm"
            >
              <span>Climate Stress Center</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {isInsufficient && Object.keys(recommendedSizing).length > 0 && (
              <button
                onClick={() => onApplyMitigation(recommendedSizing)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                title="Instantly re-size battery, compressor stages, and equipment to survive this weather extreme"
              >
                <Wrench className="w-3.5 h-3.5 text-white" />
                <span>Auto-Fix Insufficiency</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {simParams.autoMitigateClimateShocks && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                Auto-Shield On
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-mono">
              {simParams.climateRegion.toUpperCase()} REGION
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
