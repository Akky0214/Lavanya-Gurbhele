import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Sun,
  Battery,
  Building,
  Zap,
  Flame,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Activity,
  Layers,
  HelpCircle,
  Moon,
  BarChart3,
  Globe,
} from 'lucide-react';
import { SimulationParams, SystemId } from '../types/energy';
import { simulateSmartDevicesDemand } from '../data/smartDevicesData';

interface D3EnergyFlowDiagramProps {
  simParams: SimulationParams;
  currentSystemId: SystemId;
  onUpdateSunHour?: (hour: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpenSmartDevices?: () => void;
  onOpenDailyReport?: () => void;
  onOpenGlobalHeatmap?: () => void;
}

interface EnergyNode {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  valKW: number;
  status: string;
  color: string;
  icon: string;
}

interface EnergyLink {
  source: string;
  target: string;
  flowKW: number;
  label: string;
  color: string;
}

export const D3EnergyFlowDiagram: React.FC<D3EnergyFlowDiagramProps> = ({
  simParams,
  currentSystemId,
  onUpdateSunHour,
  isOpen,
  onToggle,
  onOpenSmartDevices,
  onOpenDailyReport,
  onOpenGlobalHeatmap,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedNode, setSelectedNode] = useState<EnergyNode | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatHour = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  // 1. Calculate real-time physical power distribution across 24-hour day-night cycle
  const metrics = useMemo(() => {
    const hour = simParams.sunAngleHour;
    const isDay = hour >= 5.5 && hour <= 18.5;
    const sunRatio = isDay ? Math.sin(((hour - 5.5) / 13.0) * Math.PI) : 0;

    // Solar generation (kW) scaled by geographic climate solar yield multiplier
    const yieldFactor = simParams.solarYieldMultiplier ?? 1.0;
    const solarKW = isDay ? Number((simParams.solarCapacityKW * sunRatio * yieldFactor * 0.92).toFixed(2)) : 0;

    // Diurnal temperature variation: coolest around 5 AM, warmest around 2:30 PM (14.5h)
    const diurnalTemp = simParams.ambientTempC + 3.5 * Math.sin(((hour - 8.5) / 24) * 2 * Math.PI);

    // Facility base electrical load (kW) based on square footage & diurnal occupancy profile
    const occupancyFactor = (hour >= 8 && hour <= 18) ? 1.0 : (hour > 18 && hour <= 22) ? 1.15 : 0.65;
    const baseLoadKW = Number(((simParams.buildingSizeSqFt / 2400) * 1.4 * occupancyFactor).toFixed(2));

    // HVAC Heat Pump draw (kW) depends on COP and diurnal ambient temp
    const tempDelta = Math.abs(diurnalTemp - 21);
    const hvacLoadKW = Number(((tempDelta * 0.35 + 1.2) * (3.8 / simParams.heatPumpCop)).toFixed(2));

    // Smart Appliances & Connected Devices net demand impact
    const smartResult = simulateSmartDevicesDemand(simParams.smartDevicesState, simParams);
    const smartLoadDeltaKW = smartResult.totalSmartLoadKW;

    const totalBuildingLoadKW = Number(Math.max(0.2, baseLoadKW + hvacLoadKW + smartLoadDeltaKW).toFixed(2));

    // Battery dispatch logic with TOU (Time-Of-Use) peak tariff awareness:
    // Peak tariff window: 16:00 to 21:00 (4 PM - 9 PM)
    const isPeakTariff = hour >= 16 && hour <= 21;
    let batteryFlowKW = 0; // positive = charging, negative = discharging
    let gridFlowKW = 0; // positive = exporting, negative = importing

    if (solarKW > totalBuildingLoadKW) {
      // Solar surplus: prioritize charging battery up to max charge rate
      const surplus = solarKW - totalBuildingLoadKW;
      const chargeRate = Math.min(surplus, 6.0, simParams.batteryCapacityKWh * 0.45);
      batteryFlowKW = Number(chargeRate.toFixed(2));
      const remainingSurplus = surplus - batteryFlowKW;
      gridFlowKW = Number(remainingSurplus.toFixed(2)); // Net export
    } else {
      const deficit = totalBuildingLoadKW - solarKW;
      // During peak tariff hours, aggressively discharge battery to shelter from expensive peak grid prices
      const dischargeLimit = isPeakTariff ? 6.5 : 4.5;
      const dischargeRate = Math.min(deficit, dischargeLimit, simParams.batteryCapacityKWh * 0.4);
      batteryFlowKW = -Number(dischargeRate.toFixed(2));
      const remainingDeficit = deficit - Math.abs(batteryFlowKW);
      gridFlowKW = -Number(remainingDeficit.toFixed(2)); // Net import from grid
    }

    return {
      solarKW,
      baseLoadKW,
      hvacLoadKW,
      smartLoadDeltaKW,
      smartActiveCount: smartResult.activeCount,
      totalBuildingLoadKW,
      batteryFlowKW,
      gridFlowKW,
      isBatteryCharging: batteryFlowKW > 0,
      isGridExporting: gridFlowKW > 0,
      isDay,
      isPeakTariff,
      sunRatio,
      diurnalTemp: Number(diurnalTemp.toFixed(1)),
    };
  }, [simParams]);

  // 2. Automated Diurnal 24-hr playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (onUpdateSunHour) {
        onUpdateSunHour(
          simParams.sunAngleHour >= 23.75 ? 0 : Number((simParams.sunAngleHour + 0.25).toFixed(2))
        );
      }
    }, 320);
    return () => clearInterval(interval);
  }, [isPlaying, simParams.sunAngleHour, onUpdateSunHour]);

  // 3. Render D3 Node-Link Energy Flow Sankey Diagram
  useEffect(() => {
    if (!svgRef.current || !isOpen) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = isExpanded ? 880 : 580;
    const height = isExpanded ? 340 : 250;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Define defs for glowing gradients & arrows
    const defs = svg.append('defs');

    // Gradient definitions
    const gradients = [
      { id: 'grad-solar', start: '#fbbf24', end: '#06b6d4' },
      { id: 'grad-batt-charge', start: '#06b6d4', end: '#10b981' },
      { id: 'grad-batt-discharge', start: '#10b981', end: '#38bdf8' },
      { id: 'grad-load', start: '#06b6d4', end: '#a855f7' },
      { id: 'grad-grid-export', start: '#06b6d4', end: '#22c55e' },
      { id: 'grad-grid-import', start: '#f97316', end: '#06b6d4' },
    ];

    gradients.forEach((g) => {
      const grad = defs
        .append('linearGradient')
        .attr('id', g.id)
        .attr('gradientUnits', 'userSpaceOnUse');
      grad.append('stop').attr('offset', '0%').attr('stop-color', g.start);
      grad.append('stop').attr('offset', '100%').attr('stop-color', g.end);
    });

    // Filter for glowing node drop shadows
    const filter = defs.append('filter').attr('id', 'glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // Node Positions
    const nodes: Record<string, EnergyNode> = {
      solar: {
        id: 'solar',
        name: 'Solar PV Array',
        category: 'Generation',
        x: width * 0.12,
        y: height * 0.28,
        valKW: metrics.solarKW,
        status: metrics.solarKW > 0 ? 'Active Producing' : 'Standby (Night)',
        color: '#fbbf24',
        icon: 'sun',
      },
      inverter: {
        id: 'inverter',
        name: 'Hybrid Inverter',
        category: 'Power Conversion',
        x: width * 0.44,
        y: height * 0.48,
        valKW: Number((metrics.solarKW + Math.abs(metrics.batteryFlowKW)).toFixed(1)),
        status: '97.8% Inversion',
        color: '#06b6d4',
        icon: 'zap',
      },
      battery: {
        id: 'battery',
        name: 'LiFePO4 BESS',
        category: 'Energy Storage',
        x: width * 0.44,
        y: height * 0.82,
        valKW: Math.abs(metrics.batteryFlowKW),
        status: metrics.isBatteryCharging ? 'Charging (Solar)' : 'Discharging (Peak TOU)',
        color: '#10b981',
        icon: 'battery',
      },
      building: {
        id: 'building',
        name: 'Facility Loads',
        category: 'Consumption',
        x: width * 0.86,
        y: height * 0.32,
        valKW: metrics.totalBuildingLoadKW,
        status: `HVAC: ${metrics.hvacLoadKW} kW${metrics.smartLoadDeltaKW !== 0 ? ` · Smart: ${metrics.smartLoadDeltaKW > 0 ? `+${metrics.smartLoadDeltaKW}` : metrics.smartLoadDeltaKW} kW` : ''}`,
        color: '#a855f7',
        icon: 'building',
      },
      grid: {
        id: 'grid',
        name: 'Utility Grid',
        category: 'Interconnection',
        x: width * 0.86,
        y: height * 0.75,
        valKW: Math.abs(metrics.gridFlowKW),
        status: metrics.isGridExporting ? 'Net Clean Export' : 'Grid Import',
        color: metrics.isGridExporting ? '#22c55e' : '#f97316',
        icon: 'activity',
      },
    };

    // Link Connections with flow kW
    const links: EnergyLink[] = [];

    // Solar -> Inverter
    if (metrics.solarKW > 0) {
      links.push({
        source: 'solar',
        target: 'inverter',
        flowKW: metrics.solarKW,
        label: `${metrics.solarKW} kW`,
        color: 'url(#grad-solar)',
      });
    }

    // Inverter <-> Battery
    if (metrics.batteryFlowKW > 0) {
      links.push({
        source: 'inverter',
        target: 'battery',
        flowKW: metrics.batteryFlowKW,
        label: `+${metrics.batteryFlowKW} kW (Charge)`,
        color: 'url(#grad-batt-charge)',
      });
    } else if (metrics.batteryFlowKW < 0) {
      links.push({
        source: 'battery',
        target: 'inverter',
        flowKW: Math.abs(metrics.batteryFlowKW),
        label: `${metrics.batteryFlowKW} kW (Discharge)`,
        color: 'url(#grad-batt-discharge)',
      });
    }

    // Inverter -> Building
    if (metrics.totalBuildingLoadKW > 0) {
      links.push({
        source: 'inverter',
        target: 'building',
        flowKW: metrics.totalBuildingLoadKW,
        label: `${metrics.totalBuildingLoadKW} kW`,
        color: 'url(#grad-load)',
      });
    }

    // Inverter <-> Grid
    if (metrics.gridFlowKW > 0) {
      links.push({
        source: 'inverter',
        target: 'grid',
        flowKW: metrics.gridFlowKW,
        label: `+${metrics.gridFlowKW} kW (Export)`,
        color: 'url(#grad-grid-export)',
      });
    } else if (metrics.gridFlowKW < 0) {
      links.push({
        source: 'grid',
        target: 'inverter',
        flowKW: Math.abs(metrics.gridFlowKW),
        label: `${metrics.gridFlowKW} kW (Import)`,
        color: 'url(#grad-grid-import)',
      });
    }

    // Generator function for cubic Bezier ribbons
    const pathGenerator = (link: EnergyLink) => {
      const s = nodes[link.source];
      const t = nodes[link.target];
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const cx1 = s.x + dx * 0.5;
      const cy1 = s.y;
      const cx2 = s.x + dx * 0.5;
      const cy2 = t.y;
      return `M ${s.x} ${s.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${t.x} ${t.y}`;
    };

    const linkGroup = svg.append('g').attr('class', 'links');
    const particleGroup = svg.append('g').attr('class', 'particles');
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    // 4. Draw Flow Ribbons
    const pathElements: SVGPathElement[] = [];

    links.forEach((link, idx) => {
      const d = pathGenerator(link);
      const strokeWidth = Math.max(3, Math.min(16, link.flowKW * 1.8));

      // Background path ribbon
      const p = linkGroup
        .append('path')
        .attr('d', d)
        .attr('fill', 'none')
        .attr('stroke', link.color)
        .attr('stroke-width', strokeWidth)
        .attr('stroke-opacity', 0.55)
        .attr('stroke-linecap', 'round')
        .node();

      if (p) pathElements.push(p);

      // Link badge in center
      const s = nodes[link.source];
      const t = nodes[link.target];
      const midX = (s.x + t.x) / 2;
      const midY = (s.y + t.y) / 2 - 8;

      linkGroup
        .append('rect')
        .attr('x', midX - 28)
        .attr('y', midY - 9)
        .attr('width', 56)
        .attr('height', 16)
        .attr('rx', 4)
        .attr('fill', '#090d16')
        .attr('stroke', '#334155')
        .attr('stroke-width', 0.8);

      linkGroup
        .append('text')
        .attr('x', midX)
        .attr('y', midY + 3)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#e2e8f0')
        .text(link.label);
    });

    // 5. Animated Particle Beads moving along paths using d3.timer
    const beadsPerPath = 4;
    const beads: Array<{ path: SVGPathElement; progress: number; speed: number; circle: any; color: string }> = [];

    pathElements.forEach((pathEl, idx) => {
      const link = links[idx];
      const totalLen = pathEl.getTotalLength();
      if (totalLen <= 0) return;

      for (let b = 0; b < beadsPerPath; b++) {
        const circle = particleGroup
          .append('circle')
          .attr('r', 3.5)
          .attr('fill', '#ffffff')
          .attr('stroke', link.source === 'solar' ? '#fbbf24' : '#38bdf8')
          .attr('stroke-width', 1.5)
          .attr('filter', 'url(#glow)');

        beads.push({
          path: pathEl,
          progress: (b / beadsPerPath) + Math.random() * 0.1,
          speed: 0.12 + Math.min(0.25, link.flowKW * 0.03),
          circle,
          color: link.color,
        });
      }
    });

    const timer = d3.timer((elapsed) => {
      beads.forEach((bead) => {
        const len = bead.path.getTotalLength();
        if (len <= 0) return;
        const currentP = (bead.progress + (elapsed * 0.00035 * bead.speed)) % 1;
        const pt = bead.path.getPointAtLength(currentP * len);
        bead.circle.attr('cx', pt.x).attr('cy', pt.y);
      });
    });

    // 6. Draw Nodes
    Object.values(nodes).forEach((n) => {
      const g = nodeGroup
        .append('g')
        .attr('transform', `translate(${n.x}, ${n.y})`)
        .attr('cursor', 'pointer')
        .on('click', () => setSelectedNode(n));

      // Outer ripple pulse ring
      g.append('circle')
        .attr('r', 28)
        .attr('fill', n.color)
        .attr('fill-opacity', 0.12)
        .attr('stroke', n.color)
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1.2);

      // Node background disc
      g.append('circle')
        .attr('r', 22)
        .attr('fill', '#090d16')
        .attr('stroke', n.color)
        .attr('stroke-width', 2)
        .attr('filter', 'url(#glow)');

      // Primary power value text
      g.append('text')
        .attr('y', -3)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .attr('fill', '#ffffff')
        .text(`${n.valKW} kW`);

      // Node Name Label
      g.append('text')
        .attr('y', 9)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px')
        .attr('font-weight', 'semibold')
        .attr('fill', n.color)
        .text(n.name.split(' ')[0]);

      // Sub-label below node
      g.append('text')
        .attr('y', 38)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', 'medium')
        .attr('fill', '#94a3b8')
        .text(n.status);
    });

    return () => {
      timer.stop();
    };
  }, [isOpen, isExpanded, metrics, currentSystemId]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-30 transition-all duration-300 pointer-events-auto ${
        isExpanded
          ? 'inset-x-4 bottom-24 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[900px]'
          : 'bottom-24 right-4 w-[92vw] max-w-[590px]'
      }`}
    >
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl text-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white tracking-tight">
                  D3.js Real-Time Energy Flow Bus
                </h3>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                  Live Sankey
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Physics-coupled power routing: Solar ({metrics.solarKW} kW) • Load ({metrics.totalBuildingLoadKW} kW) •{' '}
                {metrics.isBatteryCharging ? `Charging Battery (+${metrics.batteryFlowKW} kW)` : `BESS Discharging (${metrics.batteryFlowKW} kW)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto Play 24-hr cycle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                isPlaying
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Automate 24-Hour Diurnal Solar & Demand Cycle"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-400" />}
              <span>{isPlaying ? 'Pause' : 'Auto 24h'}</span>
            </button>

            {/* Daily Report trigger */}
            {onOpenDailyReport && (
              <button
                onClick={onOpenDailyReport}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg bg-cyan-950/80 text-cyan-300 hover:text-white hover:bg-cyan-900 border border-cyan-800/80 transition-colors cursor-pointer"
                title="Open Daily Energy Performance Summary & PDF Export"
              >
                <BarChart3 className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Daily Report</span>
              </button>
            )}

            {/* Global Heatmap trigger */}
            {onOpenGlobalHeatmap && (
              <button
                onClick={onOpenGlobalHeatmap}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg bg-blue-950/80 text-cyan-300 hover:text-white hover:bg-blue-900 border border-cyan-800/80 transition-colors cursor-pointer"
                title="Open Global Renewable Energy Heatmap (D3.js Spatial Layer)"
              >
                <Globe className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Global Heatmap</span>
              </button>
            )}

            {/* Expand / Minimize */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand Flow View'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close Toggle */}
            <button
              onClick={onToggle}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* D3 SVG Canvas */}
        <div className="relative bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden">
          <svg ref={svgRef} className="w-full h-auto select-none" />

          {/* Diurnal Time Legend */}
          <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-300 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 shadow-md">
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              {metrics.isDay ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
              {formatHour(simParams.sunAngleHour)}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">
              {metrics.isDay ? `Solar Yield: ${Math.round(metrics.sunRatio * 100)}%` : 'Night Autonomy (BESS & Grid)'}
            </span>
            {metrics.isPeakTariff && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold uppercase">
                Peak TOU
              </span>
            )}
          </div>
        </div>

        {/* Selected Node Details or Quick Stat strip */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] gap-2">
          <div className="flex items-center gap-3 font-mono">
            <span className="flex items-center gap-1 text-amber-300">
              <Sun className="w-3 h-3" /> PV: {metrics.solarKW} kW
            </span>
            <span className="flex items-center gap-1 text-emerald-300">
              <Battery className="w-3 h-3" /> BESS: {metrics.batteryFlowKW > 0 ? `+${metrics.batteryFlowKW}` : metrics.batteryFlowKW} kW
            </span>
            <span className="flex items-center gap-1 text-purple-300">
              <Building className="w-3 h-3" /> Load: {metrics.totalBuildingLoadKW} kW
            </span>
            <span className="flex items-center gap-1 text-cyan-300">
              <Zap className="w-3 h-3" /> Grid: {metrics.isGridExporting ? `+${metrics.gridFlowKW} kW (Export)` : `${metrics.gridFlowKW} kW (Import)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSmartDevices && (
              <button
                onClick={onOpenSmartDevices}
                className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Configure Connected Smart Appliances & Loads"
              >
                <Zap className="w-2.5 h-2.5 text-cyan-400" />
                <span>Smart Devices ({metrics.smartActiveCount} active)</span>
              </button>
            )}
            <span className="text-[10px] text-slate-400">
              Interactive: Click nodes to inspect voltage & circuit rating
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
