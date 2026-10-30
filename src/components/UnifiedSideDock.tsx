import React, { useState } from 'react';
import {
  Activity,
  Sparkles,
  Bot,
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
  Send,
  User,
  Zap,
  RotateCcw,
  Sliders,
  Check,
  ChevronLeft,
  Sun,
  Flame,
  Battery,
  Layers,
  ArrowRight,
  Cpu,
  Search,
  ExternalLink,
} from 'lucide-react';
import { SimulationParams, SystemId } from '../types/energy';

import { CIRCUITS_AND_COMPONENTS } from '../data/circuitsAndComponentsData';

interface UnifiedSideDockProps {
  currentSystemId: SystemId;
  simParams: SimulationParams;
  onUpdateParams: (updates: Partial<SimulationParams>) => void;
  onOpenFullBomModal?: () => void;
  isChatOpenExternal?: boolean;
  onToggleChatExternal?: () => void;
}

export type DockTab = 'telemetry' | 'components' | 'quick_wins' | 'copilot';
export type ChatModelChoice = 'fast' | 'general' | 'complex';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  actionPayload?: {
    applyFix: Partial<SimulationParams>;
    label: string;
  };
}

export const UnifiedSideDock: React.FC<UnifiedSideDockProps> = ({
  currentSystemId,
  simParams,
  onUpdateParams,
  onOpenFullBomModal,
}) => {
  // Active panel state (null = collapsed into sleek floating icon pill)
  const [activeTab, setActiveTab] = useState<DockTab | null>(null);

  // Quick Wins Carousel State
  const [currentWinIndex, setCurrentWinIndex] = useState(0);
  const [appliedWinId, setAppliedWinId] = useState<string | null>(null);

  // Components & Circuits search query state
  const [componentSearchQuery, setComponentSearchQuery] = useState('');

  // Gemini Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'model',
      text: `Hello! I'm your **EcoTwin AI Copilot**.\n\nI am continuously monitoring your active **${currentSystemId.replace('_', ' ')}** digital twin under **${simParams.climateRegion.toUpperCase()}** climate conditions (${simParams.ambientTempC}°C).\n\nAsk me about thermodynamic COP optimization, solar-plus-storage dispatch, carbon abatement, or component failure predictions!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelChoice, setModelChoice] = useState<ChatModelChoice>('general');
  const [appliedChatActionId, setAppliedChatActionId] = useState<string | null>(null);

  // Physics Telemetry Calculations
  const hour = simParams.sunAngleHour;
  const isDaylight = hour >= 6 && hour <= 18;
  const solarFactor = isDaylight
    ? Math.sin(((hour - 6) / 12) * Math.PI) * (simParams.solarYieldMultiplier || 1.0)
    : 0;
  const currentSolarKW = Number((simParams.solarCapacityKW * solarFactor).toFixed(1));
  const ambientDelta = Math.abs(simParams.ambientTempC - 21);
  const baseThermalKW = Number(((simParams.buildingSizeSqFt / 180) * (1 + ambientDelta * 0.04)).toFixed(1));
  const effectiveCop = simParams.heatPumpCop || 3.8;
  const compressorElectricKW = Number((baseThermalKW / effectiveCop).toFixed(1));
  const netElectricKW = Number((currentSolarKW - compressorElectricKW).toFixed(1));
  const isExporting = netElectricKW > 0;
  const batterySoc = Math.min(100, Math.max(15, Math.round(50 + solarFactor * 45)));
  const autonomyPct = Math.min(100, Math.max(20, Math.round((currentSolarKW / Math.max(1, compressorElectricKW)) * 100)));

  // Generate dynamic context-aware quick wins
  const quickWins = React.useMemo(() => {
    const wins = [];

    if (simParams.heatPumpCop < 4.5 && simParams.ambientTempC >= 5) {
      wins.push({
        id: 'lower_water_temp',
        title: 'Lower Supply Water Setpoint by 2°C',
        description: 'Lowering hydronic heating distribution supply temperature increases heat pump Carnot efficiency and extends compressor life.',
        efficiencyGain: '+0.35 COP Boost',
        actionLabel: 'Apply: +0.35 COP',
        applyUpdates: {
          heatPumpCop: Number(Math.min(5.2, simParams.heatPumpCop + 0.35).toFixed(2)),
        },
      });
    }

    if (simParams.ambientTempC > 28 && !simParams.smartShadingActive) {
      wins.push({
        id: 'deploy_facade_shading',
        title: 'Deploy Dynamic Facade Shading',
        description: 'High ambient temperature detected. Activating electrochromic smart glass cuts peak solar cooling thermal load by 32%.',
        efficiencyGain: '-32% Solar Heat Gain',
        actionLabel: 'Apply: Shading On',
        applyUpdates: {
          smartShadingActive: true,
        },
      });
    }

    if (hour >= 11 && hour <= 15 && simParams.ambientTempC > 25) {
      wins.push({
        id: 'solar_thermal_pre_cooling',
        title: 'Diurnal Solar Thermal Pre-Cooling',
        description: 'Solar generation is at peak zenith. Pre-chill hydronic storage buffer now to reduce expensive evening peak tariff imports.',
        efficiencyGain: 'Peak Tariff Avoidance',
        actionLabel: 'Apply: Pre-Cooling',
        applyUpdates: {
          heatPumpCop: Number(Math.min(5.2, simParams.heatPumpCop + 0.2).toFixed(2)),
        },
      });
    }

    if (wins.length === 0) {
      wins.push({
        id: 'default_tune',
        title: 'Fine-Tune Variable-Speed Inverter Hydraulics',
        description: 'System is operating efficiently. Enabling variable inverter delta-T modulation extracts an additional 8% seasonal efficiency.',
        efficiencyGain: '+8% Seasonal Efficiency',
        actionLabel: 'Apply: Inverter Tune',
        applyUpdates: {
          heatPumpCop: Number(Math.min(5.2, simParams.heatPumpCop + 0.15).toFixed(2)),
        },
      });
    }

    return wins;
  }, [simParams, hour]);

  const activeWin = quickWins[currentWinIndex % quickWins.length];

  const handleApplyWin = (win: any) => {
    onUpdateParams(win.applyUpdates);
    setAppliedWinId(win.id);
    setTimeout(() => {
      setAppliedWinId(null);
      if (quickWins.length > 1) {
        setCurrentWinIndex((prev) => (prev + 1) % quickWins.length);
      }
    }, 1200);
  };

  // Chat message submission
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputVal('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          modelChoice,
          simContext: {
            systemId: currentSystemId,
            climateRegion: simParams.climateRegion,
            ambientTempC: simParams.ambientTempC,
            sunAngleHour: simParams.sunAngleHour,
            solarCapacityKW: simParams.solarCapacityKW,
            batteryCapacityKWh: simParams.batteryCapacityKWh,
            heatPumpCop: simParams.heatPumpCop,
            smartShadingActive: simParams.smartShadingActive,
            utilityRatePerKWh: simParams.utilityRatePerKWh,
            gridCarbonIntensityKgPerKWh: simParams.gridCarbonIntensityKgPerKWh,
          },
        }),
      });

      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();

      let cleanText = data.reply || '';
      let actionPayload: { applyFix: Partial<SimulationParams>; label: string } | undefined = undefined;
      const actionMatch = cleanText.match(/```action\s*([\s\S]*?)\s*```/);
      if (actionMatch) {
        try {
          actionPayload = JSON.parse(actionMatch[1]);
          cleanText = cleanText.replace(/```action[\s\S]*?```/, '').trim();
        } catch (e) {
          console.warn('Action parse error', e);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `model_${Date.now()}`,
          role: 'model',
          text: cleanText,
          actionPayload,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'model',
          text: 'Unable to reach AI copilot service. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay (only on < sm when drawer is active) */}
      {activeTab && (
        <div
          className="fixed inset-0 z-35 sm:hidden bg-slate-950/50 backdrop-blur-xs pointer-events-auto animate-in fade-in duration-200"
          onClick={() => setActiveTab(null)}
        />
      )}

      {/* Floating Trigger Dock Bar (Never Collides, Always Accessible) */}
      <div className="fixed top-14 sm:top-18 right-2 sm:right-4 z-25 pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-1 sm:p-1.5 shadow-2xl backdrop-blur-xl">
        {/* Telemetry Button */}
        <button
          onClick={() => setActiveTab(activeTab === 'telemetry' ? null : 'telemetry')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'telemetry'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Real-Time Telemetry Gauges"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Telemetry</span>
        </button>

        {/* Components & Circuits Button */}
        <button
          onClick={() => setActiveTab(activeTab === 'components' ? null : 'components')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'components'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Inspect Components, Circuits, and Bill of Materials"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Components</span>
        </button>

        {/* Quick Wins Button */}
        <button
          onClick={() => setActiveTab(activeTab === 'quick_wins' ? null : 'quick_wins')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'quick_wins'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Context-Aware Quick Wins"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Quick Wins</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        </button>

        {/* Gemini AI Copilot Button */}
        <button
          onClick={() => setActiveTab(activeTab === 'copilot' ? null : 'copilot')}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'copilot'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Toggle Gemini Multi-Turn AI Copilot"
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-bold">AI Copilot</span>
        </button>
      </div>

      {/* Slide-in Non-Overlapping Drawer Panel */}
      {activeTab && (
        <div className="fixed top-28 sm:top-20 right-2 sm:right-4 left-2 sm:left-auto sm:w-96 bottom-28 sm:bottom-auto sm:max-h-[min(540px,calc(100vh-210px))] z-40 pointer-events-auto bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-2xl text-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
          {/* Header Bar */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              {activeTab === 'telemetry' && (
                <>
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">Live Physics Telemetry</span>
                </>
              )}
              {activeTab === 'components' && (
                <>
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-white">Components & Circuits</span>
                </>
              )}
              {activeTab === 'quick_wins' && (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Engineering Quick Wins</span>
                </>
              )}
              {activeTab === 'copilot' && (
                <>
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-white">EcoTwin AI Copilot</span>
                </>
              )}
            </div>

            <button
              onClick={() => setActiveTab(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TAB 1: TELEMETRY VIEW */}
          {activeTab === 'telemetry' && (
            <div className="p-4 space-y-3.5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Solar Generation
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-mono font-bold text-amber-300 tabular-nums">
                      {currentSolarKW}
                    </span>
                    <span className="text-xs font-mono text-slate-500">kW</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {isDaylight ? `${Math.round(solarFactor * 100)}% solar harvest` : 'Night standby'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Compressor Load
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-mono font-bold text-cyan-300 tabular-nums">
                      {compressorElectricKW}
                    </span>
                    <span className="text-xs font-mono text-slate-500">kW</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    COP {effectiveCop.toFixed(1)} · {baseThermalKW} kW thermal
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Net Grid Power
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-xl font-mono font-bold tabular-nums ${
                        isExporting ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {Math.abs(netElectricKW)}
                    </span>
                    <span className="text-xs font-mono text-slate-500">kW</span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold block mt-0.5 ${
                      isExporting ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isExporting ? '↑ Net Exporting' : '↓ Grid Import'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    LiFePO4 Storage
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-mono font-bold text-indigo-300 tabular-nums">
                      {batterySoc}%
                    </span>
                    <span className="text-xs font-mono text-slate-500">SoC</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {simParams.batteryCapacityKWh} kWh capacity
                  </span>
                </div>
              </div>

              {/* Autonomy Progress Bar */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Clean Energy Autonomy</span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">{autonomyPct}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${autonomyPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPONENTS & CIRCUITS INVENTORY */}
          {activeTab === 'components' && (() => {
            const arch = CIRCUITS_AND_COMPONENTS[currentSystemId] || CIRCUITS_AND_COMPONENTS.heat_pump;
            const filteredComps = arch.components.filter((c) => {
              if (!componentSearchQuery.trim()) return true;
              const q = componentSearchQuery.toLowerCase();
              return (
                c.name.toLowerCase().includes(q) ||
                c.refDes.toLowerCase().includes(q) ||
                c.circuitRole.toLowerCase().includes(q) ||
                c.spec.toLowerCase().includes(q) ||
                c.categoryLabel.toLowerCase().includes(q)
              );
            });
            const totalCost = arch.components.reduce((acc, c) => acc + c.estimatedCostUsd, 0);

            return (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* System Specs Pill / Header summary */}
                <div className="p-3 bg-slate-950/70 border-b border-slate-800/80 space-y-2 shrink-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate max-w-[210px]">{arch.systemTitle}</span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-full shrink-0">
                      {arch.components.length} Items · ${totalCost.toLocaleString()}
                    </span>
                  </div>

                  {/* Quick specs pill */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 truncate">
                      <span className="text-slate-500 font-semibold">Bus: </span>
                      {arch.busVoltage.split('/')[0]}
                    </div>
                    <div className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 truncate">
                      <span className="text-slate-500 font-semibold">MCU: </span>
                      {arch.mcuArchitecture.split(' ')[0]}
                    </div>
                  </div>

                  {/* Search inside side dock */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={componentSearchQuery}
                      onChange={(e) => setComponentSearchQuery(e.target.value)}
                      placeholder="Search ref, IC, sensor, wiring..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {componentSearchQuery && (
                      <button
                        onClick={() => setComponentSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable list of components */}
                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto custom-scrollbar">
                  {filteredComps.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No components matched "{componentSearchQuery}"
                    </div>
                  ) : (
                    filteredComps.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-indigo-500/50 transition-all space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-800/70 px-1.5 py-0.5 rounded-md">
                              {c.refDes}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {c.categoryLabel}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-semibold text-emerald-400">
                            ${c.estimatedCostUsd.toLocaleString()}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-100 group-hover:text-indigo-200 transition-colors">
                          {c.name}
                        </div>

                        <div className="text-[11px] text-slate-300 leading-relaxed">
                          {c.spec}
                        </div>

                        <div className="text-[10px] text-slate-400 bg-slate-900/90 p-1.5 rounded-lg border border-slate-800/60 space-y-0.5">
                          <div>
                            <span className="text-indigo-400 font-semibold">Role: </span>
                            {c.circuitRole}
                          </div>
                          <div className="truncate">
                            <span className="text-amber-400 font-semibold">Wiring: </span>
                            {c.wiringOrPinout}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Modal Trigger Button */}
                {onOpenFullBomModal && (
                  <div className="p-2.5 border-t border-slate-800 bg-slate-950/90 shrink-0">
                    <button
                      onClick={onOpenFullBomModal}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-indigo-500/20"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Open Full Schematic & BOM Explorer</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 3: QUICK WINS VIEW */}
          {activeTab === 'quick_wins' && (
            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Recommendation {currentWinIndex + 1} of {quickWins.length}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentWinIndex((prev) => (prev - 1 + quickWins.length) % quickWins.length)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentWinIndex((prev) => (prev + 1) % quickWins.length)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{activeWin.title}</span>
                  <span className="text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-800">
                    {activeWin.efficiencyGain}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeWin.description}
                </p>
                <button
                  onClick={() => handleApplyWin(activeWin)}
                  disabled={appliedWinId === activeWin.id}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md mt-2 ${
                    appliedWinId === activeWin.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold'
                  }`}
                >
                  {appliedWinId === activeWin.id ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Applied to 3D Model!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>{activeWin.actionLabel}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GEMINI AI COPILOT VIEW */}
          {activeTab === 'copilot' && (
            <div className="flex-1 flex flex-col min-h-[320px] max-h-[460px]">
              {/* Model Selector Bar */}
              <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-1 text-[11px]">
                <span className="text-slate-400 font-medium">Model:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setModelChoice('fast')}
                    className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      modelChoice === 'fast'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="gemini-3.1-flash-lite (Instant responses)"
                  >
                    Lite
                  </button>
                  <button
                    onClick={() => setModelChoice('general')}
                    className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      modelChoice === 'general'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="gemini-3.8-flash (General energy tasks)"
                  >
                    Flash 3.8
                  </button>
                  <button
                    onClick={() => setModelChoice('complex')}
                    className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      modelChoice === 'complex'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="gemini-4-argon (Complex physics & high-thinking)"
                  >
                    Thinking
                  </button>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-lg bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-cyan-600 text-white rounded-tr-none'
                            : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{m.text}</div>

                        {/* Interactive Action Button embedded in AI response */}
                        {m.actionPayload && (
                          <div className="mt-2 pt-2 border-t border-slate-800">
                            <button
                              onClick={() => {
                                onUpdateParams(m.actionPayload!.applyFix);
                                setAppliedChatActionId(m.id);
                                setTimeout(() => setAppliedChatActionId(null), 1500);
                              }}
                              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                appliedChatActionId === m.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-sm'
                              }`}
                            >
                              {appliedChatActionId === m.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Applied to Model!</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>{m.actionPayload.label}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-500 block text-right mt-1">
                          {m.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-purple-300 animate-pulse pl-1">
                    <Bot className="w-4 h-4 animate-spin" />
                    <span>Gemini is analyzing digital twin thermodynamics...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-2.5 border-t border-slate-800 bg-slate-950/80">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Ask AI Copilot about heat pump COP, storage..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputVal.trim() || loading}
                    className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
