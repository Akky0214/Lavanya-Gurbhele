import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sun,
  Layers,
  Thermometer,
  Zap,
  Eye,
  Sliders,
  Flame,
  Building2,
  Home,
  Factory,
  Activity,
  Play,
  Pause,
  Moon,
  Sunrise,
  Sunset,
  Camera,
} from 'lucide-react';
import { SystemId, VisualMode } from '../types/energy';

interface BottomControlDockProps {
  currentSystemId: SystemId;
  onSelectSystem: (id: SystemId) => void;
  visualMode: VisualMode;
  onChangeVisualMode: (mode: VisualMode) => void;
  explodedOffset: number;
  onChangeExplodedOffset: (offset: number) => void;
  sunHour: number;
  onChangeSunHour: (hour: number) => void;
  onResetCamera: () => void;
  onOpenConfigurator?: () => void;
  onOpenScorecard?: () => void;
  onOpenLifecycleTracker?: () => void;
  onOpenBlueprintStudio?: () => void;
  onOpenClimateAlert?: () => void;
  onOpenCarbonCalc?: () => void;
  onOpenSmartDevices?: () => void;
  onOpenDailyReport?: () => void;
  onOpenCaptureScene?: () => void;
  onOpenGlobalHeatmap?: () => void;
  onOpenGridCarbon?: () => void;
  isD3FlowOpen?: boolean;
  onToggleD3Flow?: () => void;
  onStartTour?: () => void;
  isTimeLapsePlaying?: boolean;
  onToggleTimeLapse?: () => void;
  timeLapseSpeed?: number;
  onChangeTimeLapseSpeed?: (speed: number) => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  currentSystemId,
  onSelectSystem,
  visualMode,
  onChangeVisualMode,
  explodedOffset,
  onChangeExplodedOffset,
  sunHour,
  onChangeSunHour,
  onResetCamera,
  onOpenCaptureScene,
  isD3FlowOpen,
  onToggleD3Flow,
  isTimeLapsePlaying = false,
  onToggleTimeLapse,
  timeLapseSpeed = 2,
  onChangeTimeLapseSpeed,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const systemsList: Array<{ id: SystemId; label: string; icon: React.ReactNode }> = [
    { id: 'heat_pump', label: 'Heat Pump & TES', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'smart_building', label: 'Smart Building', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'residential_microgrid', label: 'Home Microgrid', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'industrial_whrs', label: 'Waste Heat ORC', icon: <Factory className="w-3.5 h-3.5" /> },
  ];

  const formatHour = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const getDiurnalPhase = (hour: number) => {
    if (hour >= 23 || hour < 5) {
      return {
        label: 'Off-Peak Midnight',
        icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />,
        textColor: 'text-indigo-300',
        accentClass: 'accent-indigo-400',
      };
    } else if (hour >= 5 && hour < 7) {
      return {
        label: 'Dawn / Sunrise',
        icon: <Sunrise className="w-3.5 h-3.5 text-rose-400" />,
        textColor: 'text-rose-300',
        accentClass: 'accent-rose-400',
      };
    } else if (hour >= 7 && hour < 11) {
      return {
        label: 'Morning Solar Ramp',
        icon: <Sun className="w-3.5 h-3.5 text-amber-400" />,
        textColor: 'text-amber-300',
        accentClass: 'accent-amber-400',
      };
    } else if (hour >= 11 && hour < 15) {
      return {
        label: 'Peak Solar Harvest',
        icon: <Sun className="w-3.5 h-3.5 text-amber-300" />,
        textColor: 'text-amber-300 font-bold',
        accentClass: 'accent-amber-400',
      };
    } else if (hour >= 15 && hour < 17.5) {
      return {
        label: 'Afternoon Solar',
        icon: <Sun className="w-3.5 h-3.5 text-amber-400" />,
        textColor: 'text-amber-300',
        accentClass: 'accent-amber-400',
      };
    } else if (hour >= 17.5 && hour < 20.5) {
      return {
        label: 'Dusk & Peak Tariff',
        icon: <Sunset className="w-3.5 h-3.5 text-orange-400" />,
        textColor: 'text-orange-300',
        accentClass: 'accent-orange-400',
      };
    } else {
      return {
        label: 'Evening Discharging',
        icon: <Moon className="w-3.5 h-3.5 text-sky-400" />,
        textColor: 'text-sky-300',
        accentClass: 'accent-sky-400',
      };
    }
  };

  const currentPhase = getDiurnalPhase(sunHour);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-3 pointer-events-none">
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center mb-1.5 pointer-events-auto">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-300 bg-slate-900/90 border border-slate-700/80 rounded-full shadow-2xl backdrop-blur-xl hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          title="Toggle 3D Viewport Controls"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Show Studio Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Zen Mode (Hide Controls)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Bottom Dock Container */}
      {!isCollapsed && (
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl text-slate-200 space-y-2.5">
          {/* Top Row: System Selector Tabs + Essential 3D Tools */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            {/* Archetype Selector */}
            <div id="tour-system-selector" className="flex items-center gap-1 overflow-x-auto py-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                Archetype:
              </span>
              {systemsList.map((sys) => {
                const isActive = currentSystemId === sys.id;
                return (
                  <button
                    key={sys.id}
                    onClick={() => onSelectSystem(sys.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {sys.icon}
                    <span>{sys.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Viewport Essential Utilities */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onResetCamera}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800 cursor-pointer"
                title="Reset Camera View to Default Perspective"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Reset Camera</span>
              </button>

              {onToggleD3Flow && (
                <button
                  onClick={onToggleD3Flow}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                    isD3FlowOpen
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-950/60 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-800'
                  }`}
                  title="Toggle D3.js Real-Time Energy Flow Sankey Bus"
                >
                  <Activity className={`w-3 h-3 ${isD3FlowOpen ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                  <span>D3 Energy Bus</span>
                </button>
              )}

              {onOpenCaptureScene && (
                <button
                  onClick={onOpenCaptureScene}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-950/60 text-cyan-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800 cursor-pointer"
                  title="Capture 2K Scene Snapshot with Thermodynamic Overlays"
                >
                  <Camera className="w-3 h-3 text-cyan-400" />
                  <span className="hidden sm:inline">Snapshot</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: View Modes, Exploded Slider, Solar Time Slider */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Visual View Mode */}
            <div id="tour-visual-modes" className="md:col-span-4 flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
              <button
                onClick={() => onChangeVisualMode('realistic')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  visualMode === 'realistic'
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3 text-sky-400" />
                <span>PBR Realistic</span>
              </button>
              <button
                onClick={() => onChangeVisualMode('thermal')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  visualMode === 'thermal'
                    ? 'bg-slate-800 text-amber-300 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Thermometer className="w-3 h-3 text-amber-400" />
                <span>Thermal FLIR</span>
              </button>
              <button
                onClick={() => onChangeVisualMode('energy_flow')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  visualMode === 'energy_flow'
                    ? 'bg-slate-800 text-emerald-300 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Energy Flow</span>
              </button>
            </div>

            {/* Simulation Controls: Exploded & Solar Sliders */}
            <div id="tour-sim-controls" className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Exploded View Slider */}
              <div className="flex items-center gap-2 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800/80">
                <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                    <span>CAD Assembly Offset</span>
                    <span className="text-cyan-300 font-mono font-bold tabular-nums">{Math.round(explodedOffset * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={explodedOffset}
                    onChange={(e) => onChangeExplodedOffset(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>

              {/* 24h Diurnal Sun Dial Slider */}
              <div className="flex items-center gap-2 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800/80">
                {/* Play / Pause Time Lapse Toggle */}
                {onToggleTimeLapse && (
                  <button
                    onClick={onToggleTimeLapse}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                      isTimeLapsePlaying
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title={isTimeLapsePlaying ? 'Pause 24-Hour Timelapse' : 'Play 24-Hour Timelapse'}
                  >
                    {isTimeLapsePlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>
                )}

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1 font-mono font-bold text-slate-200 tabular-nums">
                      {currentPhase.icon}
                      <span>{formatHour(sunHour)}</span>
                    </span>
                    <span className={`text-[10px] ${currentPhase.textColor}`}>
                      {currentPhase.label}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="0.1"
                    value={sunHour}
                    onChange={(e) => onChangeSunHour(parseFloat(e.target.value))}
                    className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${currentPhase.accentClass}`}
                  />
                </div>

                {/* Timelapse Speed Cycle Button */}
                {onChangeTimeLapseSpeed && (
                  <button
                    onClick={() => {
                      const nextSpeed = timeLapseSpeed === 1 ? 2 : timeLapseSpeed === 2 ? 4 : 1;
                      onChangeTimeLapseSpeed(nextSpeed);
                    }}
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 shrink-0 cursor-pointer"
                    title="Change Diurnal Simulation Speed"
                  >
                    {timeLapseSpeed}×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
