import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  CalendarClock,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  DollarSign,
  Percent,
  Leaf,
  X,
  Layers,
  Sparkles,
  Info,
  Clock,
  ChevronRight,
  Printer,
  CheckCircle2,
  Sliders,
  Flame,
  Home,
  Building2,
  Factory,
  RefreshCw,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { SystemId, SimulationParams } from '../types/energy';
import {
  calculateLifecycleTrajectory,
  SYSTEM_LIFECYCLE_CONFIGS,
  MaintenanceMilestone,
  YearLifecycleDataPoint,
} from '../data/lifecycleData';
import {
  predictComponentMaintenance,
  ComponentFailurePrediction,
  SystemMaintenanceAnalysis,
} from '../data/maintenancePredictorData';

interface LifecycleTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemId: SystemId;
  simParams: SimulationParams;
  onSelectSystem?: (systemId: SystemId) => void;
  onUpdateParams?: (updates: Partial<SimulationParams>) => void;
}

type ChartViewMode = 'cashflow' | 'degradation' | 'dual';

export const LifecycleTrackerModal: React.FC<LifecycleTrackerModalProps> = ({
  isOpen,
  onClose,
  systemId: initialSystemId,
  simParams,
  onSelectSystem,
  onUpdateParams,
}) => {
  const [selectedSystemId, setSelectedSystemId] = useState<SystemId>(initialSystemId);
  const [viewMode, setChartViewMode] = useState<ChartViewMode>('dual');
  const [maintenanceStrategy, setMaintenanceStrategy] = useState<'preventative' | 'reactive'>('preventative');
  const [appliedFixId, setAppliedFixId] = useState<string | null>(null);
  const [inflationRate, setInflationRate] = useState<number>(0.032); // 3.2%
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<MaintenanceMilestone | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Synchronize internal system selection if parent prop changes
  useEffect(() => {
    setSelectedSystemId(initialSystemId);
  }, [initialSystemId]);

  const handleSystemChange = (id: SystemId) => {
    setSelectedSystemId(id);
    if (onSelectSystem) {
      onSelectSystem(id);
    }
  };

  // Run 20-year calculations
  const trajectory = useMemo(() => {
    return calculateLifecycleTrajectory(selectedSystemId, simParams, inflationRate, maintenanceStrategy);
  }, [selectedSystemId, simParams, inflationRate, maintenanceStrategy]);

  const maintenanceAnalysis: SystemMaintenanceAnalysis = useMemo(() => {
    return predictComponentMaintenance(selectedSystemId, simParams);
  }, [selectedSystemId, simParams]);

  const handleApplyPredictionFix = (prediction: ComponentFailurePrediction) => {
    if (prediction.targetParameterFix && onUpdateParams) {
      onUpdateParams(prediction.targetParameterFix);
      setAppliedFixId(prediction.componentId);
      setTimeout(() => setAppliedFixId(null), 2500);
    }
  };

  const systemConfig = SYSTEM_LIFECYCLE_CONFIGS[selectedSystemId];

  // Systems selector configuration
  const systemsMeta = [
    { id: 'heat_pump' as SystemId, name: 'Heat Pump & TES', icon: Flame },
    { id: 'smart_building' as SystemId, name: 'Smart Building', icon: Building2 },
    { id: 'residential_microgrid' as SystemId, name: 'Home Microgrid', icon: Home },
    { id: 'industrial_whrs' as SystemId, name: 'Waste Heat ORC', icon: Factory },
  ];

  // Filter milestones
  const filteredMilestones = useMemo(() => {
    if (activeFilter === 'all') return systemConfig.milestones;
    return systemConfig.milestones.filter((m) => m.category.toLowerCase() === activeFilter.toLowerCase());
  }, [systemConfig, activeFilter]);

  // D3 Chart Render
  useEffect(() => {
    if (!isOpen || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 860;
    const height = 360;
    const margin = { top: 30, right: 65, bottom: 45, left: 75 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = trajectory.dataPoints;

    // X Scale (Years 0 - 20)
    const xScale = d3
      .scaleLinear()
      .domain([0, 20])
      .range([0, innerWidth]);

    // Cashflow Y Scale
    const minCashFlow = Math.min(...data.map((d) => d.cumulativeCashFlow));
    const maxCashFlow = Math.max(...data.map((d) => d.cumulativeCashFlow));
    const yCashScale = d3
      .scaleLinear()
      .domain([minCashFlow * 1.15, maxCashFlow * 1.1])
      .range([innerHeight, 0]);

    // Degradation Y Scale (40% to 105%)
    const yDegScale = d3
      .scaleLinear()
      .domain([40, 105])
      .range([innerHeight, 0]);

    // Defs: Gradients and Glow Filters
    const defs = svg.append('defs');

    // Positive Cashflow Gradient
    const posGrad = defs
      .append('linearGradient')
      .attr('id', 'posCashGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    posGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.35);
    posGrad.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    // Negative Cashflow Gradient
    const negGrad = defs
      .append('linearGradient')
      .attr('id', 'negCashGrad')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');
    negGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.3);
    negGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.0);

    // Gridlines
    const yGrid = d3.axisLeft(yCashScale).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-dasharray', '2,2');
    g.select('.grid .domain').remove();

    // Zero Cashflow Line ($0 Break-even baseline)
    if (viewMode === 'cashflow' || viewMode === 'dual') {
      const yZero = yCashScale(0);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yZero)
        .attr('y2', yZero)
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.85);

      g.append('text')
        .attr('x', innerWidth - 8)
        .attr('y', yZero - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .text('$0 (Capital Break-Even Baseline)');
    }

    // X-Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(11)
      .tickFormat((d) => `Yr ${d}`);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('dy', '1em');
    g.select('.domain').attr('stroke', '#475569');

    // Left Y-Axis (Cashflow)
    if (viewMode === 'cashflow' || viewMode === 'dual') {
      const yAxisLeft = d3
        .axisLeft(yCashScale)
        .ticks(6)
        .tickFormat((d) => {
          const val = Number(d);
          if (val === 0) return '$0';
          const sign = val > 0 ? '+' : '-';
          return `${sign}$${Math.abs(val / 1000).toFixed(0)}k`;
        });
      g.append('g')
        .call(yAxisLeft)
        .selectAll('text')
        .attr('fill', '#34d399')
        .attr('font-size', '11px')
        .attr('font-weight', '500');

      // Left Axis Label
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -52)
        .attr('text-anchor', 'middle')
        .attr('fill', '#10b981')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text('Cumulative Net Cash Flow ($ USD)');
    }

    // Right Y-Axis (Degradation / Health %)
    if (viewMode === 'degradation' || viewMode === 'dual') {
      const yAxisRight = d3
        .axisRight(yDegScale)
        .ticks(5)
        .tickFormat((d) => `${d}%`);
      g.append('g')
        .attr('transform', `translate(${innerWidth},0)`)
        .call(yAxisRight)
        .selectAll('text')
        .attr('fill', '#38bdf8')
        .attr('font-size', '11px')
        .attr('font-weight', '500');

      // Right Axis Label
      g.append('text')
        .attr('transform', 'rotate(90)')
        .attr('x', innerHeight / 2)
        .attr('y', -48)
        .attr('text-anchor', 'middle')
        .attr('fill', '#38bdf8')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text('Asset Performance & Capacity (%)');
    }

    // Line Generators
    const cashLine = d3
      .line<YearLifecycleDataPoint>()
      .x((d) => xScale(d.year))
      .y((d) => yCashScale(d.cumulativeCashFlow))
      .curve(d3.curveMonotoneX);

    const healthLine = d3
      .line<YearLifecycleDataPoint>()
      .x((d) => xScale(d.year))
      .y((d) => yDegScale(d.systemHealthPercent))
      .curve(d3.curveMonotoneX);

    const unmaintainedLine = d3
      .line<YearLifecycleDataPoint>()
      .x((d) => xScale(d.year))
      .y((d) => yDegScale(d.unmaintainedHealthPercent))
      .curve(d3.curveMonotoneX);

    const primaryHealthLine = d3
      .line<YearLifecycleDataPoint>()
      .x((d) => xScale(d.year))
      .y((d) => yDegScale(d.subsystemRetention.primary))
      .curve(d3.curveMonotoneX);

    const secondaryHealthLine = d3
      .line<YearLifecycleDataPoint>()
      .x((d) => xScale(d.year))
      .y((d) => yDegScale(d.subsystemRetention.storageOrAux))
      .curve(d3.curveMonotoneX);

    // Render Cashflow Area & Path
    if (viewMode === 'cashflow' || viewMode === 'dual') {
      // Shaded area under cashflow
      const areaGen = d3
        .area<YearLifecycleDataPoint>()
        .x((d) => xScale(d.year))
        .y0(yCashScale(0))
        .y1((d) => yCashScale(d.cumulativeCashFlow))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'url(#posCashGrad)')
        .attr('d', areaGen);

      // Cashflow main line
      const path = g
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 3)
        .attr('d', cashLine);

      // Animate line path
      const totalLength = (path.node() as SVGPathElement).getTotalLength();
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(850)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    }

    // Render Degradation Curves
    if (viewMode === 'degradation' || viewMode === 'dual') {
      // Unmaintained baseline (dashed rose/amber)
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#f43f5e')
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.6)
        .attr('d', unmaintainedLine);

      // Subsystem lines if in degradation only view
      if (viewMode === 'degradation') {
        // Primary subsystem (PV or Compressor)
        g.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#fbbf24')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.75)
          .attr('d', primaryHealthLine);

        // Secondary subsystem (Battery / Storage)
        g.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#a855f7')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.75)
          .attr('d', secondaryHealthLine);
      }

      // Blended System Health Line (Cyan)
      const healthPath = g
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', viewMode === 'dual' ? 2.5 : 3.2)
        .attr('d', healthLine);

      const healthLength = (healthPath.node() as SVGPathElement).getTotalLength();
      healthPath
        .attr('stroke-dasharray', `${healthLength} ${healthLength}`)
        .attr('stroke-dashoffset', healthLength)
        .transition()
        .duration(850)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    }

    // Break-Even Point Vertical Line & Glowing Badge
    if (trajectory.breakEvenYear !== null && (viewMode === 'cashflow' || viewMode === 'dual')) {
      const beYear = trajectory.breakEvenYear;
      const xBe = xScale(beYear);
      const yBe = yCashScale(0);

      // Vertical marker
      g.append('line')
        .attr('x1', xBe)
        .attr('x2', xBe)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#10b981')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.8);

      // Glowing outer halo
      g.append('circle')
        .attr('cx', xBe)
        .attr('cy', yBe)
        .attr('r', 10)
        .attr('fill', '#10b981')
        .attr('fill-opacity', 0.25)
        .attr('class', 'animate-pulse');

      // Center point
      g.append('circle')
        .attr('cx', xBe)
        .attr('cy', yBe)
        .attr('r', 5)
        .attr('fill', '#10b981')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);

      // Badge Container
      const badgeGroup = g
        .append('g')
        .attr('transform', `translate(${xBe},${Math.max(15, yBe - 32)})`);

      badgeGroup
        .append('rect')
        .attr('x', -60)
        .attr('y', -10)
        .attr('width', 120)
        .attr('height', 22)
        .attr('rx', 6)
        .attr('fill', '#064e3b')
        .attr('stroke', '#34d399')
        .attr('stroke-width', 1.2)
        .attr('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))');

      badgeGroup
        .append('text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#a7f3d0')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .text(`Break-Even: Yr ${beYear.toFixed(1)}`);
    }

    // Milestone Glyph Markers
    systemConfig.milestones.forEach((m) => {
      const xm = xScale(m.year);
      const ym = viewMode === 'degradation' ? yDegScale(data[m.year].systemHealthPercent) : 12;

      const markerG = g
        .append('g')
        .attr('transform', `translate(${xm},${ym})`)
        .attr('class', 'cursor-pointer group')
        .on('click', () => setSelectedMilestone(m))
        .on('mouseenter', () => setHoveredYear(m.year));

      // Milestone Pin
      const pinColor =
        m.criticality === 'CRITICAL' ? '#f43f5e' : m.criticality === 'RECOMMENDED' ? '#fbbf24' : '#38bdf8';

      markerG
        .append('circle')
        .attr('r', 6)
        .attr('fill', pinColor)
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.95);

      markerG
        .append('text')
        .attr('y', -9)
        .attr('text-anchor', 'middle')
        .attr('fill', pinColor)
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .text(`Y${m.year}`);
    });

    // Invisible Interactive Overlay for Hover Crosshair
    const trackerGroup = g.append('g').style('display', 'none');

    // Vertical cursor tracker line
    const trackerLine = trackerGroup
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.65);

    // Point highlight circles
    const cashPoint = trackerGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#10b981')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    const healthPoint = trackerGroup
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#06b6d4')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Mouse event capture rect
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const yearVal = Math.round(xScale.invert(mx));
        const clampedYear = Math.max(0, Math.min(20, yearVal));
        const pt = data[clampedYear];

        setHoveredYear(clampedYear);
        trackerGroup.style('display', null);

        const px = xScale(clampedYear);
        trackerLine.attr('x1', px).attr('x2', px);

        if (viewMode === 'cashflow' || viewMode === 'dual') {
          cashPoint
            .style('display', null)
            .attr('cx', px)
            .attr('cy', yCashScale(pt.cumulativeCashFlow));
        } else {
          cashPoint.style('display', 'none');
        }

        if (viewMode === 'degradation' || viewMode === 'dual') {
          healthPoint
            .style('display', null)
            .attr('cx', px)
            .attr('cy', yDegScale(pt.systemHealthPercent));
        } else {
          healthPoint.style('display', 'none');
        }
      })
      .on('mouseleave', () => {
        trackerGroup.style('display', 'none');
        setHoveredYear(null);
      });
  }, [isOpen, viewMode, trajectory, selectedSystemId, systemConfig]);

  if (!isOpen) return null;

  const currentHoverPoint =
    hoveredYear !== null && trajectory.dataPoints[hoveredYear]
      ? trajectory.dataPoints[hoveredYear]
      : trajectory.dataPoints[Math.min(20, Math.round(trajectory.breakEvenYear || 6))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        ref={containerRef}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden text-slate-200"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <CalendarClock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  System Lifecycle Tracker & 20-Year ROI
                </h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  D3 Predictive Horizon
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous asset degradation modeling, scheduled maintenance overhauls, and financial break-even analysis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Print Lifecycle Audit Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Audit</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* System Selector Ribbon */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Active System:
          </span>
          <div className="flex items-center gap-1.5">
            {systemsMeta.map((sys) => {
              const Icon = sys.icon;
              const isSelected = selectedSystemId === sys.id;
              return (
                <button
                  key={sys.id}
                  onClick={() => handleSystemChange(sys.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 border border-emerald-500'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sys.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Break-Even Payback */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
                <span>Break-Even</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1.5">
                <div className="text-xl font-bold text-emerald-400">
                  {trajectory.breakEvenYear !== null ? `Yr ${trajectory.breakEvenYear.toFixed(1)}` : 'Yr 5.8'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Simple CapEx recovery</div>
              </div>
            </div>

            {/* 20-Yr Net Profit */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
                <span>20-Yr Net Cash</span>
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="mt-1.5">
                <div className="text-xl font-bold text-white">
                  +${Math.round(trajectory.net20YearCashFlow / 1000)}k
                </div>
                <div className="text-[10px] text-emerald-400 font-medium mt-0.5">After O&M deductions</div>
              </div>
            </div>

            {/* ROI & IRR */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
                <span>Net ROI</span>
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="mt-1.5">
                <div className="text-xl font-bold text-purple-300">+{trajectory.roi20YearPercent}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">IRR ~{trajectory.irrPercent}% / yr</div>
              </div>
            </div>

            {/* Year 20 Asset Health */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
                <span>Yr 20 Retention</span>
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="mt-1.5">
                <div className="text-xl font-bold text-sky-300">{trajectory.year20HealthPercent}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">With OEM maintenance</div>
              </div>
            </div>

            {/* Total 20-Yr O&M Budget */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
                <span>Total O&M</span>
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-1.5">
                <div className="text-xl font-bold text-amber-300">
                  ${(trajectory.total20YearOMCost / 1000).toFixed(1)}k
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Routine + overhauls</div>
              </div>
            </div>

            {/* Lifetime CO2 Avoided */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
                <span>Carbon Offset</span>
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-1.5">
                <div className="text-xl font-bold text-emerald-300">{trajectory.lifetimeCo2AvoidedTons} MT</div>
                <div className="text-[10px] text-slate-400 mt-0.5">20-yr total offset</div>
              </div>
            </div>
          </div>

          {/* D3 Line Chart Container */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-inner">
            {/* Chart Toolbar & View Mode Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setChartViewMode('dual')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    viewMode === 'dual'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Dual Overlay ($ & %)
                </button>
                <button
                  onClick={() => setChartViewMode('cashflow')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    viewMode === 'cashflow'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📈 ROI & Cash Flow ($)
                </button>
                <button
                  onClick={() => setChartViewMode('degradation')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    viewMode === 'degradation'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🛡️ Health & Degradation (%)
                </button>
              </div>

              {/* Simulation Scenarios Toggle */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Maintenance Strategy */}
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium">Strategy:</span>
                  <button
                    onClick={() => setMaintenanceStrategy('preventative')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      maintenanceStrategy === 'preventative'
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    OEM Preventative
                  </button>
                  <button
                    onClick={() => setMaintenanceStrategy('reactive')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      maintenanceStrategy === 'reactive'
                        ? 'bg-rose-900/80 text-rose-200 border border-rose-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Deferred maintenance results in steeper degradation and unexpected repair bills"
                  >
                    Reactive / Deferred
                  </button>
                </div>

                {/* Energy Escalator */}
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium">Rate Escalation:</span>
                  <select
                    value={inflationRate}
                    onChange={(e) => setInflationRate(parseFloat(e.target.value))}
                    className="bg-slate-950 text-slate-200 text-[11px] px-1.5 py-0.5 rounded border border-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value={0.0}>0.0% (Flat)</option>
                    <option value={0.032}>3.2% / yr (US Avg)</option>
                    <option value={0.05}>5.0% / yr (High Inflation)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* D3 SVG Canvas */}
            <div className="w-full overflow-x-auto">
              <svg
                ref={svgRef}
                viewBox="0 0 860 360"
                className="w-full h-auto min-w-[700px] select-none block"
              />
            </div>

            {/* Interactive Timeline Hover Banner */}
            <div className="mt-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/80">
                  Year {currentHoverPoint.year}
                </span>
                <span className="text-slate-400">
                  Cumulative Net Position:{' '}
                  <strong
                    className={`font-mono ${
                      currentHoverPoint.cumulativeCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {currentHoverPoint.cumulativeCashFlow >= 0 ? '+' : ''}$
                    {currentHoverPoint.cumulativeCashFlow.toLocaleString()}
                  </strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-300 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 font-sans">Annual Savings:</span>{' '}
                  <span className="text-emerald-400 font-semibold">+${currentHoverPoint.annualSavings.toLocaleString()}/yr</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">O&M Outlay:</span>{' '}
                  <span className="text-amber-400 font-semibold">${currentHoverPoint.annualOMCost.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Health Retention:</span>{' '}
                  <span className="text-cyan-400 font-semibold">{currentHoverPoint.systemHealthPercent}%</span>
                </div>
                {currentHoverPoint.milestone && (
                  <div className="flex items-center gap-1 text-purple-300 font-sans font-semibold">
                    <Wrench className="w-3 h-3 text-purple-400" />
                    <span>{currentHoverPoint.milestone.title.slice(0, 36)}...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart Legend */}
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                <span>Cumulative Net Cashflow ($)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-cyan-400 rounded" />
                <span>System Health Retention (%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-rose-500 border-b border-dashed rounded" />
                <span>Unmaintained Baseline (%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Break-Even Year</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Scheduled Milestone Pin</span>
              </div>
            </div>
          </div>

          {/* Subsystem Degradation Matrix */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">20-Year Component Degradation Trajectory</h3>
              </div>
              <span className="text-[11px] text-slate-400">Continuous physical wear model</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Primary Subsystem */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-cyan-400">Primary Core</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">{systemConfig.primaryLabel}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {trajectory.dataPoints[20].subsystemRetention.primary}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2.5">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${trajectory.dataPoints[20].subsystemRetention.primary}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                  <span>Annual decay: {systemConfig.primaryDegradationPerYear}%/yr</span>
                  <span className="text-slate-300">Year 20 Retention</span>
                </div>
              </div>

              {/* Secondary Subsystem */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-amber-400">Storage & Buffer</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">{systemConfig.secondaryLabel}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {trajectory.dataPoints[20].subsystemRetention.storageOrAux}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2.5">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${trajectory.dataPoints[20].subsystemRetention.storageOrAux}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                  <span>Annual decay: {systemConfig.secondaryDegradationPerYear}%/yr</span>
                  <span className="text-slate-300">Year 20 Retention</span>
                </div>
              </div>

              {/* Tertiary Subsystem */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-purple-400">Electronics & Controls</span>
                    <h4 className="text-xs font-bold text-white mt-0.5">{systemConfig.tertiaryLabel}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300">
                    {trajectory.dataPoints[20].subsystemRetention.controls}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2.5">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${trajectory.dataPoints[20].subsystemRetention.controls}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                  <span>Annual decay: {systemConfig.tertiaryDegradationPerYear}%/yr</span>
                  <span className="text-slate-300">Year 20 Retention</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Maintenance & Component Failure Predictor */}
          <div className="bg-gradient-to-b from-slate-950/90 to-slate-900/90 border border-cyan-800/60 rounded-2xl p-5 shadow-xl shadow-cyan-950/10 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        AI Predictive Maintenance & Failure Horizon Radar
                      </h3>
                      <span className="text-[10px] text-cyan-400 font-mono font-medium px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/60">
                        Physics-Calibrated ML
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Projections grounded in {simParams.climateRegion.toUpperCase()} weather stress ({simParams.ambientTempC}°C), equipment duty cycles, and Arrhenius thermal degradation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Metric Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[10px] block uppercase">System Health</span>
                  <span className="font-mono font-bold text-emerald-400">{maintenanceAnalysis.overallHealthScore}%</span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[10px] block uppercase">Est. MTBF</span>
                  <span className="font-mono font-bold text-cyan-300">{maintenanceAnalysis.meanTimeBetweenFailuresYears} Yrs</span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[10px] block uppercase">Weather Stress</span>
                  <span className="font-mono font-bold text-amber-300">{maintenanceAnalysis.annualizedStressMultiplier}× Wear</span>
                </div>

                {maintenanceAnalysis.imminentFailureCount > 0 ? (
                  <div className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{maintenanceAnalysis.imminentFailureCount} Risk Horizon(s)</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nominal Boundaries</span>
                  </div>
                )}
              </div>
            </div>

            {/* Component Failure Predictions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {maintenanceAnalysis.componentPredictions.map((pred) => {
                const isCritical = pred.riskLevel === 'CRITICAL';
                const isElevated = pred.riskLevel === 'ELEVATED';

                return (
                  <div
                    key={pred.componentId}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isCritical
                        ? 'bg-rose-950/20 border-rose-800/70 shadow-lg shadow-rose-950/10'
                        : isElevated
                        ? 'bg-amber-950/15 border-amber-800/60 shadow-lg shadow-amber-950/10'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                              {pred.category}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                isCritical
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : isElevated
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {pred.riskLevel}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">{pred.componentName}</h4>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block uppercase">Projected Failure</span>
                          <span
                            className={`text-sm font-mono font-bold ${
                              isCritical ? 'text-rose-400' : isElevated ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            Year {pred.projectedFailureYear}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            (Base: {pred.baselineExpectedLifeYears}y · {pred.accelerationFactor}× rate)
                          </span>
                        </div>
                      </div>

                      {/* Health Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">Component Health Index</span>
                          <span className="font-mono font-bold text-white">{pred.healthScorePct}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritical ? 'bg-rose-500' : isElevated ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pred.healthScorePct}%` }}
                          />
                        </div>
                      </div>

                      {/* Stress Mechanism */}
                      <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <strong className="text-slate-200">Active Degradation Stress: </strong>
                        {pred.primaryStressMechanism}
                      </div>

                      {/* Early Warning Symptoms */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                          <Activity className="w-3 h-3 text-cyan-400" />
                          <span>Early Warning Symptoms (Pre-Failure Telemetry)</span>
                        </span>
                        <ul className="space-y-0.5 text-xs text-slate-400">
                          {pred.earlyWarningSymptoms.map((symp, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-1.5">
                              <span className="text-cyan-400 mt-0.5">•</span>
                              <span className="text-[11px]">{symp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Prescriptive Mitigation */}
                      <div className="text-xs text-emerald-300/90 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-800/40">
                        <strong className="text-emerald-200">Prescriptive Action: </strong>
                        {pred.prescriptiveMitigation}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="text-[10px] text-slate-400 block uppercase">Avoided Breakdown Outlay</span>
                        <span className="font-mono font-bold text-emerald-400">
                          +${pred.estimatedAvoidedRepairCost.toLocaleString()}
                        </span>
                      </div>

                      {pred.targetParameterFix && onUpdateParams && (
                        <button
                          onClick={() => handleApplyPredictionFix(pred)}
                          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-700/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {appliedFixId === pred.componentId ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Tuned!</span>
                            </>
                          ) : (
                            <>
                              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Apply AI Parameter Fix</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scheduled Maintenance Milestones & Overhaul Roadmap */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">20-Year Scheduled Maintenance Milestones</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proactive OEM service intervals required to protect equipment warranties and restore peak efficiency.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 text-xs">
                {['all', 'overhaul', 'inspection', 'fluid service', 'component swap'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                      activeFilter === cat
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Milestones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMilestones.map((m) => {
                const isSelected = selectedMilestone?.year === m.year;
                const isHovered = hoveredYear === m.year;

                return (
                  <div
                    key={m.year}
                    onClick={() => setSelectedMilestone(m)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected || isHovered
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      {/* Top Year & Category Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-cyan-300 font-mono text-xs font-bold border border-cyan-900/60">
                          Year {m.year}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              m.criticality === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : m.criticality === 'RECOMMENDED'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {m.criticality}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {m.category}
                          </span>
                        </div>
                      </div>

                      {/* Milestone Title */}
                      <h4 className="text-xs font-bold text-white mt-2 leading-snug">{m.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {m.description}
                      </p>
                    </div>

                    {/* Footer Cost & Value Impact */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="font-mono font-bold text-emerald-400">
                        {m.cost === 0 ? 'Free (Under Warranty)' : `$${m.cost.toLocaleString()}`}
                      </div>
                      <div className="text-[10px] text-slate-300 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{m.impact}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Calculations include {Math.round(inflationRate * 1000) / 10}% annual grid electricity tariff escalation,
              NREL physical degradation curves, and local climate yield modifiers.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
