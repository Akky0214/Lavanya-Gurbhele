import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  X,
  Globe,
  Sun,
  Flame,
  Building2,
  Home,
  Factory,
  Search,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  Thermometer,
  Zap,
  Leaf,
  Check,
  Compass,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { SystemId, SimulationParams, ClimateRegionId } from '../types/energy';
import {
  GLOBAL_REFERENCE_SITES,
  GlobalSiteData,
  HeatmapMetricMode,
  generateGlobalHeatmapGrid,
  WORLD_CONTINENTS_GEOJSON,
  GridHeatPoint,
} from '../data/globalHeatmapData';
import { CLIMATE_REGIONS } from '../data/climateData';

interface GlobalRenewableHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSystemId: SystemId;
  simParams: SimulationParams;
  onApplySiteClimate: (updates: {
    systemId?: SystemId;
    climateRegion: ClimateRegionId;
    ambientTempC: number;
    solarYieldMultiplier: number;
    utilityRatePerKWh?: number;
  }) => void;
}

export const GlobalRenewableHeatmapModal: React.FC<GlobalRenewableHeatmapModalProps> = ({
  isOpen,
  onClose,
  currentSystemId,
  simParams,
  onApplySiteClimate,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeSystemFilter, setActiveSystemFilter] = useState<SystemId | 'all'>('all');
  const [metricMode, setMetricMode] = useState<HeatmapMetricMode>('suitability');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<GlobalSiteData | null>(null);
  const [hoveredSite, setHoveredSite] = useState<GlobalSiteData | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [appliedNotice, setAppliedNotice] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filtered sites based on search and archetype
  const filteredSites = useMemo(() => {
    return GLOBAL_REFERENCE_SITES.filter((site) => {
      const matchSearch =
        searchQuery === '' ||
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.climateRegion.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSystem =
        activeSystemFilter === 'all' || site.recommendedArchetype === activeSystemFilter;

      return matchSearch && matchSystem;
    });
  }, [searchQuery, activeSystemFilter]);

  // Dynamic grid heat points calculation
  const gridPoints = useMemo(() => {
    const sysId = activeSystemFilter === 'all' ? currentSystemId : activeSystemFilter;
    return generateGlobalHeatmapGrid(simParams, sysId, metricMode, 10, 12);
  }, [simParams, activeSystemFilter, currentSystemId, metricMode]);

  // Color interpolators based on metric mode
  const colorScale = useMemo(() => {
    switch (metricMode) {
      case 'solarGHI':
        // 800 (low) to 2400 (extreme solar)
        return d3.scaleSequential(d3.interpolateYlOrRd).domain([800, 2400]);
      case 'hdd':
        // 0 (tropical) to 8000 (arctic freeze)
        return d3.scaleSequential(d3.interpolateBlues).domain([0, 7500]);
      case 'cdd':
        // 0 to 5000 (extreme desert heat)
        return d3.scaleSequential(d3.interpolateWarm).domain([0, 4800]);
      case 'carbonOffset':
        // 5 to 18 t CO2/yr
        return d3.scaleSequential(d3.interpolateViridis).domain([5, 18]);
      case 'suitability':
      default:
        // 40% (fair) to 100% (ideal)
        return d3.scaleSequential(d3.interpolateTurbo).domain([40, 100]);
    }
  }, [metricMode]);

  // Get active value for a grid point based on mode
  const getPointValue = (pt: GridHeatPoint) => {
    switch (metricMode) {
      case 'solarGHI':
        return pt.solarGHI;
      case 'hdd':
        return pt.hdd;
      case 'cdd':
        return pt.cdd;
      case 'carbonOffset':
        return pt.carbonOffset;
      case 'suitability':
      default:
        return pt.suitability;
    }
  };

  // Get value for a site based on mode
  const getSiteValue = (site: GlobalSiteData) => {
    switch (metricMode) {
      case 'solarGHI':
        return `${site.annualSolarGHI} kWh/m²`;
      case 'hdd':
        return `${site.heatingDegreeDays} HDD`;
      case 'cdd':
        return `${site.coolingDegreeDays} CDD`;
      case 'carbonOffset':
        return `${(site.annualSolarGHI * 0.0055).toFixed(1)} t/yr`;
      case 'suitability':
      default: {
        const targetSys = activeSystemFilter === 'all' ? site.recommendedArchetype : activeSystemFilter;
        return `${site.systemSuitability[targetSys]}% Match`;
      }
    }
  };

  // D3 Map rendering and zoom logic
  useEffect(() => {
    if (!isOpen || !svgRef.current) return;

    const width = 960;
    const height = 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Natural Earth projection
    const projection = d3
      .geoNaturalEarth1()
      .scale(165)
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Root zoom container
    const g = svg.append('g').attr('class', 'map-root');

    // Setup D3 Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [-width * 0.5, -height * 0.5],
        [width * 1.5, height * 1.5],
      ])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 1. Ocean Background Rectangle
    g.append('rect')
      .attr('width', width * 3)
      .attr('height', height * 3)
      .attr('x', -width)
      .attr('y', -height)
      .attr('fill', '#050a14');

    // 2. Graticule (Lat / Lon coordinate lines)
    const graticule = d3.geoGraticule().step([30, 30]);
    g.append('path')
      .datum(graticule)
      .attr('class', 'graticule')
      .attr('d', pathGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.6)
      .attr('stroke-opacity', 0.7);

    // 3. World Continents Landmass
    g.append('g')
      .attr('class', 'continents-layer')
      .selectAll('path')
      .data(WORLD_CONTINENTS_GEOJSON.features)
      .enter()
      .append('path')
      .attr('d', pathGenerator as any)
      .attr('fill', '#0f172a')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.2)
      .attr('stroke-linejoin', 'round');

    // 4. Dynamic Interpolated Heatmap Layer (Gridded Cells with Smooth Bleed)
    const heatGroup = g.append('g').attr('class', 'heatmap-cells-layer');

    gridPoints.forEach((pt) => {
      const coords = projection([pt.lon, pt.lat]);
      if (!coords) return;
      const val = getPointValue(pt);
      const cellColor = colorScale(val);

      heatGroup
        .append('circle')
        .attr('cx', coords[0])
        .attr('cy', coords[1])
        .attr('r', 16)
        .attr('fill', cellColor)
        .attr('fill-opacity', 0.42)
        .attr('filter', 'blur(5px)');
    });

    // 5. Reference Meteorological Site Pins
    const pinsGroup = g.append('g').attr('class', 'sites-layer');

    filteredSites.forEach((site) => {
      const coords = projection([site.lon, site.lat]);
      if (!coords) return;

      const isSelected = selectedSite?.id === site.id;
      const targetSys = activeSystemFilter === 'all' ? site.recommendedArchetype : activeSystemFilter;
      const suitScore = site.systemSuitability[targetSys];

      const pinG = pinsGroup
        .append('g')
        .attr('class', 'site-pin cursor-pointer group')
        .attr('transform', `translate(${coords[0]}, ${coords[1]})`)
        .on('click', () => {
          setSelectedSite(site);
          setAppliedNotice(false);
        })
        .on('mouseenter', (event) => {
          setHoveredSite(site);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setHoverPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
        })
        .on('mouseleave', () => {
          setHoveredSite(null);
          setHoverPos(null);
        });

      // Outer pulse ring for high suitability or selected
      pinG
        .append('circle')
        .attr('r', isSelected ? 12 : suitScore >= 90 ? 9 : 7)
        .attr('fill', isSelected ? '#06b6d4' : suitScore >= 90 ? '#10b981' : '#f59e0b')
        .attr('fill-opacity', isSelected ? 0.45 : 0.25)
        .attr('stroke', isSelected ? '#38bdf8' : '#10b981')
        .attr('stroke-width', isSelected ? 1.5 : 0.8)
        .attr('stroke-dasharray', isSelected ? '2,2' : 'none');

      // Core Solid Pin Node
      pinG
        .append('circle')
        .attr('r', isSelected ? 5.5 : 3.8)
        .attr('fill', isSelected ? '#ffffff' : suitScore >= 90 ? '#10b981' : '#38bdf8')
        .attr('stroke', '#090d16')
        .attr('stroke-width', 1.5);

      // Micro Score Tag on high zoom or selected
      if (isSelected || suitScore >= 92) {
        pinG
          .append('text')
          .attr('x', 7)
          .attr('y', 3)
          .attr('font-size', '8.5px')
          .attr('font-family', 'ui-monospace, monospace')
          .attr('font-weight', 'bold')
          .attr('fill', isSelected ? '#38bdf8' : '#e2e8f0')
          .text(`${site.name.split(',')[0]} (${suitScore}%)`);
      }
    });

    // Expose Zoom Control Helpers
    (svgRef.current as any).__zoomIn = () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.4);
    };
    (svgRef.current as any).__zoomOut = () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    };
    (svgRef.current as any).__resetZoom = () => {
      svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
    };
  }, [isOpen, gridPoints, filteredSites, selectedSite, activeSystemFilter, metricMode, colorScale]);

  // Apply selected site parameters to active digital twin
  const handleApplySite = () => {
    if (!selectedSite) return;

    onApplySiteClimate({
      systemId: selectedSite.recommendedArchetype,
      climateRegion: selectedSite.climateRegion,
      ambientTempC: selectedSite.baselineTempC,
      solarYieldMultiplier: Number((selectedSite.annualSolarGHI / 1420).toFixed(2)),
      utilityRatePerKWh: selectedSite.gridTariff,
    });

    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-hidden">
      <div
        ref={containerRef}
        className={`relative w-full max-h-[96vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-w-[98vw] h-[95vh]' : 'max-w-6xl'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Global Renewable Energy Heatmap
                </h2>
                <span className="text-xs text-cyan-400 font-mono font-medium px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/60">
                  D3.js Spatial Layer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated global meteorological insolation, degree-day thermodynamics, and regional archetype suitability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand full-width view'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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

        {/* Controls Toolbar (Filters, Metrics, Search) */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Archetype Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-medium mr-1">Archetype:</span>
            <button
              onClick={() => setActiveSystemFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSystemFilter === 'all'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All Systems
            </button>
            <button
              onClick={() => setActiveSystemFilter('heat_pump')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSystemFilter === 'heat_pump'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Heat Pump</span>
            </button>
            <button
              onClick={() => setActiveSystemFilter('smart_building')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSystemFilter === 'smart_building'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3 h-3 text-purple-400" />
              <span>Smart Building</span>
            </button>
            <button
              onClick={() => setActiveSystemFilter('residential_microgrid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSystemFilter === 'residential_microgrid'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-3 h-3 text-emerald-400" />
              <span>Microgrid</span>
            </button>
            <button
              onClick={() => setActiveSystemFilter('industrial_whrs')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSystemFilter === 'industrial_whrs'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Factory className="w-3 h-3 text-blue-400" />
              <span>Industrial WHRS</span>
            </button>
          </div>

          {/* Metric Shading Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Heatmap Shading:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setMetricMode('suitability')}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  metricMode === 'suitability'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Suitability (%)
              </button>
              <button
                onClick={() => setMetricMode('solarGHI')}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  metricMode === 'solarGHI'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Solar GHI
              </button>
              <button
                onClick={() => setMetricMode('hdd')}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  metricMode === 'hdd'
                    ? 'bg-sky-950 text-sky-300 border border-sky-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Heating HDD
              </button>
              <button
                onClick={() => setMetricMode('cdd')}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  metricMode === 'cdd'
                    ? 'bg-red-950 text-red-300 border border-red-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cooling CDD
              </button>
            </div>
          </div>

          {/* City Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, country, region..."
              className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-56"
            />
          </div>

        </div>

        {/* Main Body: D3 SVG Map & Side Inspector Panel */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative min-h-[460px]">
          
          {/* Left/Center: D3 Interactive SVG Canvas */}
          <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center">
            
            <svg
              ref={svgRef}
              viewBox="0 0 960 500"
              className="w-full h-full select-none cursor-grab active:cursor-grabbing"
            />

            {/* In-Map Zoom Controls */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg z-10">
              <button
                onClick={() => (svgRef.current as any)?.__zoomIn?.()}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => (svgRef.current as any)?.__zoomOut?.()}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => (svgRef.current as any)?.__resetZoom?.()}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Continuous Gradient Color Scale Legend */}
            <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl shadow-lg text-xs z-10">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span className="uppercase font-semibold text-slate-300">
                  {metricMode === 'solarGHI'
                    ? 'Solar GHI (kWh/m²)'
                    : metricMode === 'hdd'
                    ? 'Heating Degree Days (HDD)'
                    : metricMode === 'cdd'
                    ? 'Cooling Degree Days (CDD)'
                    : 'System Suitability (%)'}
                </span>
              </div>
              <div
                className="w-48 h-2.5 rounded-md border border-slate-700/80"
                style={{
                  background:
                    metricMode === 'solarGHI'
                      ? 'linear-gradient(to right, #ffffcc, #fd8d3c, #bd0026)'
                      : metricMode === 'hdd'
                      ? 'linear-gradient(to right, #f7fbff, #6baed6, #08306b)'
                      : metricMode === 'cdd'
                      ? 'linear-gradient(to right, #6e40aa, #e23e57, #ff6e4a)'
                      : 'linear-gradient(to right, #30123b, #1ae4b6, #a2fc3c, #e83812)',
                }}
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
                <span>
                  {metricMode === 'solarGHI'
                    ? '800'
                    : metricMode === 'hdd'
                    ? '0'
                    : metricMode === 'cdd'
                    ? '0'
                    : '40%'}
                </span>
                <span>
                  {metricMode === 'solarGHI'
                    ? '1600'
                    : metricMode === 'hdd'
                    ? '4000'
                    : metricMode === 'cdd'
                    ? '2400'
                    : '70%'}
                </span>
                <span>
                  {metricMode === 'solarGHI'
                    ? '2400+'
                    : metricMode === 'hdd'
                    ? '7500+'
                    : metricMode === 'cdd'
                    ? '4800+'
                    : '100%'}
                </span>
              </div>
            </div>

            {/* Hover Tooltip Popup */}
            {hoveredSite && hoverPos && !selectedSite && (
              <div
                className="absolute pointer-events-none bg-slate-900/95 border border-slate-700 rounded-xl p-2.5 shadow-2xl text-xs z-30 transition-all"
                style={{
                  left: Math.min(hoverPos.x + 12, 680),
                  top: Math.max(hoverPos.y - 60, 10),
                }}
              >
                <div className="font-bold text-white flex items-center justify-between gap-3">
                  <span>{hoveredSite.name}</span>
                  <span className="text-[10px] text-cyan-400 font-mono uppercase">
                    {hoveredSite.country}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-2">
                  <span>Metric: <strong className="text-emerald-400 font-mono">{getSiteValue(hoveredSite)}</strong></span>
                  <span>·</span>
                  <span>Climate: <strong className="text-amber-300">{hoveredSite.climateRegion}</strong></span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Optimal Archetype: <strong className="text-cyan-300">{hoveredSite.recommendedArchetype.replace('_', ' ')}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Right: Site Intelligence Inspector Panel */}
          <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto max-h-[500px] lg:max-h-none shrink-0">
            {selectedSite ? (
              <div className="space-y-4">
                
                {/* Site Header */}
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
                      {selectedSite.country}
                    </span>
                    <button
                      onClick={() => setSelectedSite(null)}
                      className="text-slate-500 hover:text-white text-xs cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedSite.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>Lat: {selectedSite.lat.toFixed(2)}°</span>
                    <span>·</span>
                    <span>Lon: {selectedSite.lon.toFixed(2)}°</span>
                    <span>·</span>
                    <span className="capitalize text-amber-300">{selectedSite.climateRegion}</span>
                  </div>
                </div>

                {/* System Suitability Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    System Suitability Index
                  </h4>
                  <div className="space-y-2">
                    {(['heat_pump', 'smart_building', 'residential_microgrid', 'industrial_whrs'] as SystemId[]).map((sysId) => {
                      const score = selectedSite.systemSuitability[sysId];
                      const isRec = selectedSite.recommendedArchetype === sysId;

                      return (
                        <div key={sysId} className="space-y-0.5 text-xs">
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="flex items-center gap-1.5 font-medium">
                              {isRec && <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />}
                              {sysId === 'heat_pump'
                                ? 'Heat Pump & TES'
                                : sysId === 'smart_building'
                                ? 'Smart Building'
                                : sysId === 'residential_microgrid'
                                ? 'Residential Microgrid'
                                : 'Industrial WHRS'}
                            </span>
                            <span className="font-mono font-bold text-white">{score}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${score}%` }}
                              className={`h-full rounded-full ${
                                isRec
                                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                                  : score >= 85
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-600'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Meteorological & Grid Telemetry */}
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Annual Solar GHI</span>
                    <strong className="text-amber-300 font-mono">{selectedSite.annualSolarGHI} kWh/m²</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Heating Degree Days</span>
                    <strong className="text-sky-300 font-mono">{selectedSite.heatingDegreeDays} HDD</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cooling Degree Days</span>
                    <strong className="text-rose-300 font-mono">{selectedSite.coolingDegreeDays} CDD</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Retail Grid Tariff</span>
                    <strong className="text-emerald-400 font-mono">${selectedSite.gridTariff}/kWh</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Grid Carbon Factor</span>
                    <strong className="text-teal-300 font-mono">{selectedSite.gridCarbonIntensity} kg/kWh</strong>
                  </div>
                </div>

                {/* Engineering Analysis Note */}
                <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200">
                  <p className="leading-relaxed">{selectedSite.engineeringNote}</p>
                </div>

                {/* 1-Click Apply to 3D Digital Twin Button */}
                <div className="pt-2">
                  <button
                    onClick={handleApplySite}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {appliedNotice ? (
                      <>
                        <Check className="w-4 h-4 text-slate-950" />
                        <span>Applied to 3D Twin!</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current text-slate-950" />
                        <span>Apply Climate to 3D Twin</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-1">
                    Updates ambient temp, solar yield factor & switches to optimal archetype
                  </p>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-4 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                  <Compass className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Select a Geographic Pin</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Click any world reference site pin to inspect local solar irradiance, thermodynamic degree-days, and 1-click apply real climate conditions to your 3D digital twin.
                </p>
                <div className="text-[11px] text-slate-500 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 w-full text-left">
                  <strong className="text-slate-300 block mb-1">Quick Picks:</strong>
                  <ul className="space-y-1">
                    <li>• Phoenix: 98% Microgrid solar match</li>
                    <li>• Frankfurt: 96% Heat pump & TES COP</li>
                    <li>• Singapore: 99% Smart building chillers</li>
                    <li>• Santiago / Atacama: 2420 kWh/m² Solar</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Status Bar */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Displaying <strong className="text-white">{filteredSites.length}</strong> Global Reference Hubs
            </span>
            <span>·</span>
            <span>
              Selected Archetype: <strong className="text-cyan-400 capitalize">{activeSystemFilter.replace('_', ' ')}</strong>
            </span>
            <span>·</span>
            <span>
              Shading Mode: <strong className="text-emerald-400 capitalize">{metricMode}</strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-500">
            D3 Natural Earth Projection · Pan/Zoom Enabled · Live Simulation Coupled
          </div>
        </div>

      </div>
    </div>
  );
};
