import React from 'react';
import {
  X,
  Cpu,
  Zap,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Search,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ComponentSpec } from '../types/energy';

interface PartInspectorModalProps {
  spec: ComponentSpec | null;
  onClose: () => void;
  onSearchRebates: (componentName: string) => void;
}

export const PartInspectorModal: React.FC<PartInspectorModalProps> = ({
  spec,
  onClose,
  onSearchRebates,
}) => {
  if (!spec) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                {spec.category}
              </span>
              <h2 className="text-base font-bold text-white">{spec.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed">{spec.description}</p>

          {/* Core Spec Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Efficiency Metric</span>
              </div>
              <p className="text-xs font-semibold text-white font-mono">{spec.efficiencyMetric}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>CO2 Abatement</span>
              </div>
              <p className="text-xs font-semibold text-emerald-300 font-mono">{spec.co2Reduction}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                <span>Installed Cost Estimate</span>
              </div>
              <p className="text-xs font-semibold text-white font-mono">{spec.estimatedCost}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Design Lifecycle</span>
              </div>
              <p className="text-xs font-semibold text-white font-mono">{spec.lifecycle}</p>
            </div>
          </div>

          {/* Key Engineering Technologies */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Patented & Engineering Innovations
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {spec.keyTech.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-200 border border-slate-700/80"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={() => onSearchRebates(spec.name)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 rounded-xl transition-all shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search Rebates & Standards (Live Web)</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
