import React, { useState, useMemo } from 'react';
import {
  X,
  Zap,
  Car,
  Thermometer,
  Droplet,
  Flame,
  Waves,
  BatteryCharging,
  Sun,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Leaf,
  Layers,
} from 'lucide-react';
import {
  SimulationParams,
  SmartDeviceId,
  SmartDeviceUserState,
  SmartDeviceMode,
} from '../types/energy';
import {
  SMART_DEVICES_CATALOG,
  DEFAULT_SMART_DEVICES_STATE,
  SMART_DEVICE_PRESETS,
  simulateSmartDevicesDemand,
} from '../data/smartDevicesData';

interface SmartDeviceSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  simParams: SimulationParams;
  onUpdateParams: (params: Partial<SimulationParams>) => void;
  onOpenFlowDiagram?: () => void;
}

export const SmartDeviceSimulatorModal: React.FC<SmartDeviceSimulatorModalProps> = ({
  isOpen,
  onClose,
  simParams,
  onUpdateParams,
  onOpenFlowDiagram,
}) => {
  const [deviceStates, setDeviceStates] = useState<Record<SmartDeviceId, SmartDeviceUserState>>(() => {
    return (simParams.smartDevicesState as Record<SmartDeviceId, SmartDeviceUserState>) || DEFAULT_SMART_DEVICES_STATE;
  });

  const [activeTab, setActiveTab] = useState<'all' | 'mobility' | 'climate' | 'utility'>('all');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Sync state if simParams changes externally
  React.useEffect(() => {
    if (simParams.smartDevicesState) {
      setDeviceStates(simParams.smartDevicesState as Record<SmartDeviceId, SmartDeviceUserState>);
    }
  }, [simParams.smartDevicesState]);

  // Compute live physics demand results based on current sun hour & settings
  const demandResult = useMemo(() => {
    return simulateSmartDevicesDemand(deviceStates, simParams);
  }, [deviceStates, simParams]);

  const hour = simParams.sunAngleHour;
  const isPeakTariff = hour >= 16 && hour <= 21;
  const isDay = hour >= 5.5 && hour <= 18.5;

  const handleToggleDevice = (id: SmartDeviceId) => {
    setSelectedPresetId(null);
    setDeviceStates((prev) => {
      const current = prev[id] || DEFAULT_SMART_DEVICES_STATE[id];
      const updated = {
        ...prev,
        [id]: {
          ...current,
          enabled: !current.enabled,
        },
      };
      // Continuous real-time synchronization with system simulation
      onUpdateParams({ smartDevicesState: updated });
      return updated;
    });
  };

  const handleChangeMode = (id: SmartDeviceId, mode: SmartDeviceMode) => {
    setSelectedPresetId(null);
    setDeviceStates((prev) => {
      const current = prev[id] || DEFAULT_SMART_DEVICES_STATE[id];
      const updated = {
        ...prev,
        [id]: {
          ...current,
          mode,
          enabled: true,
        },
      };
      onUpdateParams({ smartDevicesState: updated });
      return updated;
    });
  };

  const handleChangePower = (id: SmartDeviceId, powerKW: number) => {
    setSelectedPresetId(null);
    setDeviceStates((prev) => {
      const current = prev[id] || DEFAULT_SMART_DEVICES_STATE[id];
      const updated = {
        ...prev,
        [id]: {
          ...current,
          userPowerKW: powerKW,
        },
      };
      onUpdateParams({ smartDevicesState: updated });
      return updated;
    });
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = SMART_DEVICE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setDeviceStates(preset.state);
    onUpdateParams({ smartDevicesState: preset.state });
  };

  const handleResetDefaults = () => {
    setSelectedPresetId(null);
    setDeviceStates(DEFAULT_SMART_DEVICES_STATE);
    onUpdateParams({ smartDevicesState: DEFAULT_SMART_DEVICES_STATE });
  };

  const renderIcon = (type: string, className: string) => {
    switch (type) {
      case 'car':
        return <Car className={className} />;
      case 'thermometer':
        return <Thermometer className={className} />;
      case 'droplet':
        return <Droplet className={className} />;
      case 'battery-charging':
        return <BatteryCharging className={className} />;
      case 'waves':
        return <Waves className={className} />;
      case 'flame':
        return <Flame className={className} />;
      case 'sun':
        return <Sun className={className} />;
      default:
        return <Zap className={className} />;
    }
  };

  const formatHour = (h: number) => {
    const hours = Math.floor(h);
    const mins = Math.floor((h - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayH = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayH}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const filteredCatalog = useMemo(() => {
    if (activeTab === 'mobility') {
      return SMART_DEVICES_CATALOG.filter((d) => d.category === 'Mobility' || d.category === 'Energy Storage');
    }
    if (activeTab === 'climate') {
      return SMART_DEVICES_CATALOG.filter((d) => d.category === 'Climate Control' || d.category === 'Water Heating');
    }
    if (activeTab === 'utility') {
      return SMART_DEVICES_CATALOG.filter((d) => d.category === 'Utility' || d.category === 'Kitchen');
    }
    return SMART_DEVICES_CATALOG;
  }, [activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Smart Device & Appliance Simulator</h2>
                <span className="text-xs text-cyan-400 font-mono font-medium px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/60">
                  Real-Time Demand
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle connected loads, test TOU peak-shaving automation, and observe live grid demand impact
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset all smart appliances to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time System Demand Impact HUD */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-b border-slate-800/80 shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            {/* Total Smart Load Delta */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Smart Load Delta</span>
                {demandResult.totalSmartLoadKW < 0 ? (
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-bold font-mono ${
                    demandResult.totalSmartLoadKW < 0
                      ? 'text-emerald-400'
                      : demandResult.totalSmartLoadKW > 0
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}
                >
                  {demandResult.totalSmartLoadKW > 0 ? `+${demandResult.totalSmartLoadKW}` : demandResult.totalSmartLoadKW}
                </span>
                <span className="text-xs text-slate-500 font-mono">kW</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {demandResult.activeCount} appliances active · {demandResult.totalSmartLoadKW < 0 ? 'Net Peak Shaving' : 'Net Facility Draw'}
              </p>
            </div>

            {/* Current Simulation Clock & TOU Window */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Diurnal Clock</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-cyan-300">
                  {formatHour(hour)}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                    isPeakTariff
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : isDay
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  }`}
                >
                  {isPeakTariff ? 'Peak Tariff (4-9PM)' : isDay ? 'Solar Harvest' : 'Off-Peak Night'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isPeakTariff ? 'High grid rate (1.85x)' : 'Standard rate window'}
              </p>
            </div>

            {/* Solar Self-Consumption Rate */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Solar Self-Consumption</span>
                <Sun className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-amber-300">
                  {demandResult.solarSelfConsumptionPct}%
                </span>
                <span className="text-xs text-slate-500">utilized</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Midday solar absorbed directly on-site
              </p>
            </div>

            {/* Peak Hour Load Reduction / Avoided Tariff */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Peak Load Shaved</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {demandResult.peakHourShedKW}
                </span>
                <span className="text-xs text-slate-500 font-mono">kW</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Avoids expensive utility demand ratchets
              </p>
            </div>

          </div>
        </div>

        {/* Quick Scenario Presets */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Quick Automation Scenarios
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {SMART_DEVICE_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? `${preset.accentClass} ring-2 ring-cyan-500/50`
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold truncate text-white">{preset.title}</span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700 shrink-0">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{preset.tagline}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-6 pt-3 pb-1 flex items-center justify-between border-b border-slate-800/60 bg-slate-900 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All Appliances ({SMART_DEVICES_CATALOG.length})
            </button>
            <button
              onClick={() => setActiveTab('mobility')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'mobility'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Mobility & V2G
            </button>
            <button
              onClick={() => setActiveTab('climate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'climate'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Thermostats & Water
            </button>
            <button
              onClick={() => setActiveTab('utility')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'utility'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Pool & Kitchen
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Operating Modes:</span>
            <span className="text-amber-400 font-medium">Solar-Match</span>
            <span>·</span>
            <span className="text-indigo-400 font-medium">Off-Peak TOU</span>
            <span>·</span>
            <span className="text-emerald-400 font-medium">Eco-Shed</span>
          </div>
        </div>

        {/* Scrollable Device Cards List */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[48vh] custom-scrollbar">
          {filteredCatalog.map((spec) => {
            const state = deviceStates[spec.id] || DEFAULT_SMART_DEVICES_STATE[spec.id];
            const liveDraw = demandResult.deviceDrawsKW[spec.id] ?? 0;
            const currentPower = state.userPowerKW ?? spec.nominalKW;

            return (
              <div
                key={spec.id}
                className={`p-4 rounded-2xl border transition-all ${
                  state.enabled
                    ? 'bg-slate-900/90 border-slate-700/80 shadow-md'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  
                  {/* Left: Icon, Category & Title */}
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleDevice(spec.id)}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                        state.enabled
                          ? spec.badgeColor
                          : 'bg-slate-800/80 text-slate-500 border-slate-700'
                      }`}
                      title={state.enabled ? 'Click to disable appliance' : 'Click to enable appliance'}
                    >
                      {renderIcon(spec.iconType, 'w-5 h-5')}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white tracking-tight">{spec.name}</h3>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-400 font-medium">{spec.category}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {spec.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Live Draw & Enable Toggle */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span
                          className={`text-base font-bold font-mono ${
                            liveDraw < 0
                              ? 'text-emerald-400'
                              : liveDraw > 0
                              ? 'text-amber-300'
                              : 'text-slate-500'
                          }`}
                        >
                          {liveDraw > 0 ? `+${liveDraw}` : liveDraw} kW
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        {liveDraw < 0 ? 'Export / Shed' : liveDraw > 0 ? 'Live Active Draw' : 'Standby / Throttled'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleDevice(spec.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        state.enabled ? 'bg-cyan-600' : 'bg-slate-800'
                      }`}
                      aria-label={`Toggle ${spec.name}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          state.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Controls Area (when enabled) */}
                {state.enabled && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
                    
                    {/* Operating Mode Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 mr-1">Smart Automation:</span>
                      {spec.supportedModes.map((mode) => {
                        const isModeActive = state.mode === mode;
                        let label = mode as string;
                        if (mode === 'solar_match') label = 'Solar-Match Dynamic';
                        else if (mode === 'off_peak_tou') label = 'Off-Peak TOU Schedule';
                        else if (mode === 'eco_shed') label = 'AI Pre-Cool & Shed';
                        else if (mode === 'always_on') label = 'Continuous / Manual';
                        else if (mode === 'off') label = 'Idle Off';

                        return (
                          <button
                            key={mode}
                            onClick={() => handleChangeMode(spec.id, mode)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isModeActive
                                ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-500/80 shadow-sm'
                                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Adjustable Power Slider if supported */}
                    {spec.maxKW > spec.minKW && (
                      <div className="flex items-center gap-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        <span className="text-xs text-slate-400 font-medium shrink-0">
                          Configured Power:
                        </span>
                        <input
                          type="range"
                          min={spec.minKW}
                          max={spec.maxKW}
                          step={spec.stepKW}
                          value={currentPower}
                          onChange={(e) => handleChangePower(spec.id, parseFloat(e.target.value))}
                          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                        <span className="text-xs font-mono font-bold text-white shrink-0 w-16 text-right">
                          {currentPower.toFixed(1)} kW
                        </span>
                      </div>
                    )}

                    {/* Smart Benefit & Schedule Description */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{spec.smartBenefit}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="text-[11px]">{spec.diurnalScheduleDescription}</span>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>
              Net Load Delta:{' '}
              <strong className={demandResult.totalSmartLoadKW < 0 ? 'text-emerald-400' : 'text-cyan-300'}>
                {demandResult.totalSmartLoadKW > 0 ? `+${demandResult.totalSmartLoadKW}` : demandResult.totalSmartLoadKW} kW
              </strong>
            </span>
            <span>·</span>
            <span>
              Est. Annual Carbon Impact:{' '}
              <strong className="text-emerald-400">
                {demandResult.annualCo2DeltaKg > 0 ? `-${demandResult.annualCo2DeltaKg} kg CO₂/yr` : '0 kg'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenFlowDiagram && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFlowDiagram();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>View in D3 Flow Diagram</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply to 3D Digital Twin</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
