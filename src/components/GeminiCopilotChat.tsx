import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Zap,
  Minimize2,
  Maximize2,
  RotateCcw,
  Sliders,
  Check,
  Flame,
  Sun,
  Battery,
  Building2,
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SimulationParams, SystemId } from '../types/energy';

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

interface GeminiCopilotChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentSystemId: SystemId;
  simParams: SimulationParams;
  onApplyFix: (updates: Partial<SimulationParams>) => void;
}

export type ChatModelChoice = 'fast' | 'general' | 'complex';

export const GeminiCopilotChat: React.FC<GeminiCopilotChatProps> = ({
  isOpen,
  onClose,
  currentSystemId,
  simParams,
  onApplyFix,
}) => {
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [appliedActionId, setAppliedActionId] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto scroll to bottom of thread
  useEffect(() => {
    if (isOpen && !isMinimized) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen, isMinimized]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const quickPrompts = [
    `How can I boost my COP in this ${simParams.climateRegion} climate?`,
    `Optimize my battery capacity (${simParams.batteryCapacityKWh} kWh) for peak tariffs`,
    `What component is at highest risk of failure right now?`,
    `How does my local grid carbon factor (${simParams.gridCarbonIntensityKgPerKWh ?? 0.385} kg/kWh) affect my score?`,
  ];

  const parseMessageAndAction = (text: string) => {
    let cleanText = text;
    let actionPayload: { applyFix: Partial<SimulationParams>; label: string } | undefined;

    const actionMatch = text.match(/```action\s*([\s\S]*?)\s*```/);
    if (actionMatch) {
      try {
        actionPayload = JSON.parse(actionMatch[1]);
        cleanText = text.replace(/```action[\s\S]*?```/, '').trim();
      } catch (err) {
        console.warn('Failed to parse action block:', err);
      }
    }

    return { cleanText, actionPayload };
  };

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

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const data = await response.json();
      const { cleanText, actionPayload } = parseMessageAndAction(data.reply || '');

      const modelMsg: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        text: cleanText,
        actionPayload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: `⚠️ I encountered an issue reaching the Gemini service (${err.message || 'Network error'}). Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAction = (action: { applyFix: Partial<SimulationParams>; label: string }, msgId: string) => {
    onApplyFix(action.applyFix);
    setAppliedActionId(msgId);
    setTimeout(() => setAppliedActionId(null), 3000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'model',
        text: `Conversation cleared. How can I help you optimize your clean energy digital twin today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  // Minimized Floating Pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-5 z-50 pointer-events-auto">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-all cursor-pointer group"
        >
          <Sparkles className="w-4 h-4 animate-spin-slow group-hover:rotate-45 transition-transform" />
          <span>Gemini Copilot</span>
          <Maximize2 className="w-3.5 h-3.5 text-cyan-200" />
        </button>
      </div>
    );
  }

  // Expanded Right-Side Drawer / Chat Modal
  return (
    <div className="fixed top-16 right-3 sm:right-6 bottom-4 w-full max-w-[420px] z-50 pointer-events-auto flex flex-col bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl shadow-slate-950/80 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-tight">Gemini AI Copilot</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Live Twin: {currentSystemId.replace('_', ' ')} · {simParams.ambientTempC}°C
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model Selector Bar */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
        <span className="text-[11px] text-slate-400 font-medium">Model Speed / Depth:</span>
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setModelChoice('fast')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
              modelChoice === 'fast'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Fast lightweight responses (gemini-3.1-flash-lite)"
          >
            ⚡ Fast
          </button>
          <button
            onClick={() => setModelChoice('general')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
              modelChoice === 'general'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Balanced reasoning & physics (gemini-3.8-flash)"
          >
            🧠 General
          </button>
          <button
            onClick={() => setModelChoice('complex')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
              modelChoice === 'complex'
                ? 'bg-purple-950 text-purple-300 border border-purple-800/80'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Deep thermodynamic & financial thinking (gemini-4-argon)"
          >
            🔬 Deep
          </button>
        </div>
      </div>

      {/* Messages Scrollable Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/10'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200'
                }`}
              >
                {/* Formatted Text rendering */}
                <div className="whitespace-pre-wrap space-y-1">
                  {msg.text.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx}>
                      {paragraph.split('**').map((chunk, cIdx) =>
                        cIdx % 2 === 1 ? <strong key={cIdx} className="text-white font-semibold">{chunk}</strong> : chunk
                      )}
                    </p>
                  ))}
                </div>

                {/* Interactive Action Button for AI recommendations */}
                {msg.actionPayload && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleApplyAction(msg.actionPayload!, msg.id)}
                      className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-[11px] shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {appliedActionId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                          <span>Applied to 3D Twin!</span>
                        </>
                      ) : (
                        <>
                          <Sliders className="w-3.5 h-3.5 fill-current text-slate-950" />
                          <span>{msg.actionPayload.label}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <span className={`block text-[9px] font-mono mt-1 ${isUser ? 'text-cyan-200/80 text-right' : 'text-slate-500'}`}>
                  {msg.timestamp}
                </span>
              </div>

              {isUser && (
                <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Analyzing thermodynamic twin with {modelChoice}...</span>
            </div>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/80 space-y-1.5 shrink-0">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Suggested Prompts:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.slice(0, 2).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-[11px] text-cyan-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700/60 rounded-xl px-2.5 py-1 text-left transition-colors cursor-pointer truncate max-w-full"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={`Ask Gemini about ${currentSystemId.replace('_', ' ')}...`}
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || !inputVal.trim()}
          className="p-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
