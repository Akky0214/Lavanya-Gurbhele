import React, { useState, useMemo } from 'react';
import {
  X,
  Cpu,
  Layers,
  Wrench,
  Radio,
  ShieldCheck,
  Search,
  Download,
  Zap,
  Activity,
  CheckCircle2,
  Sliders,
  DollarSign,
  Tag,
  Info,
  ExternalLink,
} from 'lucide-react';
import { SystemId } from '../types/energy';
import { CIRCUITS_AND_COMPONENTS, SystemComponentItem } from '../data/circuitsAndComponentsData';

interface ComponentsAndCircuitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSystemId: SystemId;
  onSelectComponentIn3D?: (partId: string) => void;
}

export const ComponentsAndCircuitsModal: React.FC<ComponentsAndCircuitsModalProps> = ({
  isOpen,
  onClose,
  currentSystemId,
  onSelectComponentIn3D,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<SystemComponentItem | null>(null);

  const architecture = CIRCUITS_AND_COMPONENTS[currentSystemId] || CIRCUITS_AND_COMPONENTS.heat_pump;

  // Filter components
  const filteredComponents = useMemo(() => {
    return architecture.components.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.refDes.toLowerCase().includes(q) ||
        item.spec.toLowerCase().includes(q) ||
        item.circuitRole.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [architecture, selectedCategory, searchQuery]);

  // Set default selected item
  React.useEffect(() => {
    if (filteredComponents.length > 0 && !selectedItem) {
      setSelectedItem(filteredComponents[0]);
    } else if (filteredComponents.length > 0 && selectedItem) {
      const stillExists = filteredComponents.some((c) => c.id === selectedItem.id);
      if (!stillExists) setSelectedItem(filteredComponents[0]);
    }
  }, [filteredComponents, selectedItem]);

  // Total BOM Cost Calculation
  const totalBomCost = useMemo(() => {
    return architecture.components.reduce((acc, c) => acc + c.estimatedCostUsd, 0);
  }, [architecture]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['RefDes', 'Component Name', 'Category', 'Specification', 'Operating Range', 'Circuit Role', 'Material', 'Estimated Cost (USD)'];
    const rows = architecture.components.map((c) => [
      c.refDes,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.categoryLabel}"`,
      `"${c.spec.replace(/"/g, '""')}"`,
      `"${c.operatingRange.replace(/"/g, '""')}"`,
      `"${c.circuitRole.replace(/"/g, '""')}"`,
      `"${c.material.replace(/"/g, '""')}"`,
      c.estimatedCostUsd,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EcoTwin3D_BOM_${currentSystemId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  System Architecture & Circuit Bill of Materials (BOM)
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  {architecture.components.length} Items
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {architecture.systemTitle} · Total Est. Hardware BOM: <span className="text-emerald-400 font-mono font-bold">${totalBomCost.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Download CSV Bill of Materials"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* System Technical Specifications Banner */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Electrical Bus Voltage</span>
            <span className="font-mono text-cyan-300 font-semibold">{architecture.busVoltage}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Controller / MCU Arch</span>
            <span className="font-mono text-indigo-300 font-semibold truncate block" title={architecture.mcuArchitecture}>
              {architecture.mcuArchitecture}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Fieldbus Protocol</span>
            <span className="font-mono text-amber-300 font-semibold truncate block" title={architecture.communicationProtocol}>
              {architecture.communicationProtocol}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Medium / Fluid</span>
            <span className="font-mono text-emerald-300 font-semibold truncate block" title={architecture.refrigerantOrMedium}>
              {architecture.refrigerantOrMedium}
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All Components' },
              { id: 'mechanical', label: 'Mechanical & Thermal' },
              { id: 'circuit', label: 'Circuit & PCB' },
              { id: 'sensor', label: 'Sensors & Transducers' },
              { id: 'electrical_safety', label: 'Wiring & Safety' },
              { id: 'connectivity', label: 'Connectivity & Bus' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search component, refDes, spec..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Main Content Area: Left List + Right Detail Inspector */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left: Component List */}
          <div className="md:col-span-5 lg:col-span-5 border-r border-slate-800/80 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {filteredComponents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No components match your search query.
              </div>
            ) : (
              filteredComponents.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                        : 'bg-slate-950/50 hover:bg-slate-800/40 border-slate-800/70 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300">
                          {item.refDes}
                        </span>
                        <span className="text-xs font-bold text-white leading-tight">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-emerald-400 shrink-0">
                        ${item.estimatedCostUsd}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {item.spec}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                      <span className="capitalize">{item.categoryLabel}</span>
                      <span className="text-slate-400 truncate max-w-[140px]">{item.material}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Detailed Specification & Schematic Pinout */}
          <div className="md:col-span-7 lg:col-span-7 overflow-y-auto custom-scrollbar p-5 bg-slate-950/40 space-y-4">
            {selectedItem ? (
              <>
                {/* Header of selected item */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold px-2.5 py-1 rounded-xl bg-cyan-950 border border-cyan-700 text-cyan-300">
                        {selectedItem.refDes}
                      </span>
                      <h3 className="text-base font-bold text-white">{selectedItem.name}</h3>
                    </div>
                    <span className="text-xs text-slate-400 block mt-1">
                      Category: <span className="text-slate-200 font-medium">{selectedItem.categoryLabel}</span>
                    </span>
                  </div>

                  {selectedItem.highlightPartId && onSelectComponentIn3D && (
                    <button
                      onClick={() => {
                        onSelectComponentIn3D(selectedItem.highlightPartId!);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      title="Locate and inspect in 3D CAD model"
                    >
                      <span>Highlight in 3D</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Circuit & Thermodynamic Role */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                    <Activity className="w-4 h-4" />
                    <span>Role in Electrical & Thermodynamic Loop</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedItem.circuitRole}
                  </p>
                </div>

                {/* Detailed Engineering Specs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Technical Specification
                    </span>
                    <p className="text-xs text-slate-200 font-mono">
                      {selectedItem.spec}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Operating Conditions & Limits
                    </span>
                    <p className="text-xs text-slate-200 font-mono">
                      {selectedItem.operatingRange}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 sm:col-span-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Wiring / Pinout / Electrical Connections
                    </span>
                    <p className="text-xs text-cyan-200 font-mono leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      {selectedItem.wiringOrPinout}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Material & Metallurgy
                    </span>
                    <p className="text-xs text-slate-200">
                      {selectedItem.material}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Estimated Production Cost (USD)
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-mono font-bold text-emerald-400">
                        ${selectedItem.estimatedCostUsd.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500">per unit</span>
                    </div>
                  </div>
                </div>

                {/* System Schematic Architecture Diagram Box */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Schematic Flow Architecture
                  </span>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed">
                    {architecture.schematicOverview}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Select a component on the left to inspect its electrical pinouts and engineering specs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
