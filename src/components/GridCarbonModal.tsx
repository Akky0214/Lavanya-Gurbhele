import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  MapPin,
  Compass,
  Search,
  RefreshCw,
  Check,
  AlertCircle,
  Leaf,
  Layers,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sun,
  Wind,
  Flame,
  Radio,
  Navigation,
} from 'lucide-react';
import { SimulationParams, GridCarbonData, ClimateRegionId } from '../types/energy';
import { fetchGridCarbonData, fetchUserGpsGridCarbon } from '../utils/gridCarbonFetcher';

interface GridCarbonModalProps {
  isOpen: boolean;
  onClose: () => void;
  simParams: SimulationParams;
  onUpdateGridCarbon: (gridData: GridCarbonData) => void;
}

export const GridCarbonModal: React.FC<GridCarbonModalProps> = ({
  isOpen,
  onClose,
  simParams,
  onUpdateGridCarbon,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [currentGridData, setCurrentGridData] = useState<GridCarbonData | null>(
    simParams.gridCarbonData || null
  );
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Load initial grid carbon on open if not already set
  useEffect(() => {
    if (isOpen && !currentGridData) {
      loadByClimateRegion(simParams.climateRegion);
    }
  }, [isOpen]);

  const loadByClimateRegion = async (climateRegion: ClimateRegionId) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchGridCarbonData({ climateRegion });
      setCurrentGridData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch regional grid carbon data');
    } finally {
      setLoading(false);
    }
  };

  const handleGpsFetch = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchUserGpsGridCarbon();
      setCurrentGridData(res.data);
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Geolocation access failed. Please select a climate region or search by city.'
      );
      // Fallback to active climate region
      loadByClimateRegion(simParams.climateRegion);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchGridCarbonData({
        city: manualQuery,
        climateRegion: simParams.climateRegion,
      });
      setCurrentGridData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Search failed. Reverting to regional benchmark.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToSimulation = () => {
    if (!currentGridData) return;
    onUpdateGridCarbon(currentGridData);
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  const data = currentGridData;
  const ratingColor =
    data?.carbonRating === 'Very Clean'
      ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80'
      : data?.carbonRating === 'Moderate'
      ? 'text-cyan-400 bg-cyan-950/80 border-cyan-800/80'
      : data?.carbonRating === 'High Carbon'
      ? 'text-amber-400 bg-amber-950/80 border-amber-800/80'
      : 'text-rose-400 bg-rose-950/80 border-rose-800/80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-2xl flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Local Grid Carbon Intensity Data
                </h2>
                <span className="text-[10px] text-emerald-400 font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60">
                  Real-World Grid Feeds
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Fetch real-time emissions data for your exact location or balancing authority to ground carbon calculations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Query Selector Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 space-y-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGpsFetch}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 hover:text-white border border-cyan-800/80 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Use My GPS Location</span>
            </button>

            <button
              onClick={() => loadByClimateRegion(simParams.climateRegion)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Sync with {simParams.climateRegion.toUpperCase()}</span>
            </button>

            <span className="text-xs text-slate-500">or search:</span>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="e.g. Austin, Texas · London, UK · Frankfurt, Germany · California CAISO..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !manualQuery.trim()}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              Fetch Grid
            </button>
          </form>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[55vh] space-y-5 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-xs font-medium">
                Querying electric grid telemetry & emissions database...
              </span>
            </div>
          ) : data ? (
            <div className="space-y-5">
              
              {/* Primary Grid Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                      Local Balancing Authority / ISO
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{data.gridOperator}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{data.locationName}</span>
                    </p>
                  </div>

                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border ${ratingColor}`}>
                    {data.carbonRating}
                  </span>
                </div>

                {/* Big Metric Display */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Carbon Intensity
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold font-mono text-emerald-300">
                        {data.carbonIntensityGPerKWh}
                      </span>
                      <span className="text-xs font-mono text-slate-500">g CO₂/kWh</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      ({data.carbonIntensityKgPerKWh} kg/kWh)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Renewable Share
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold font-mono text-cyan-300">
                        {data.renewablePercentage}%
                      </span>
                      <span className="text-xs font-mono text-slate-500">clean</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {data.fossilPercentage}% fossil fuel
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Data Origin
                    </span>
                    <div className="text-sm font-semibold text-slate-200 mt-1 capitalize">
                      {data.source === 'gps'
                        ? 'Hyper-Local GPS'
                        : data.source === 'grounded_search'
                        ? 'Grounded Search'
                        : 'Regional eGRID'}
                    </div>
                    <span className="text-[11px] text-emerald-400 block mt-0.5">
                      Verified Telemetry
                    </span>
                  </div>
                </div>
              </div>

              {/* Generation Fuel Mix Breakdown Bar */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Generation Fuel Mix Breakdown</span>
                  <span className="text-slate-400 text-[11px]">Real-World Power Generation</span>
                </div>

                {/* Multi-Segment Color Bar */}
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                  {data.fuelMix.solar > 0 && (
                    <div style={{ width: `${data.fuelMix.solar}%` }} className="bg-amber-400 h-full" title={`Solar: ${data.fuelMix.solar}%`} />
                  )}
                  {data.fuelMix.wind > 0 && (
                    <div style={{ width: `${data.fuelMix.wind}%` }} className="bg-cyan-400 h-full" title={`Wind: ${data.fuelMix.wind}%`} />
                  )}
                  {data.fuelMix.hydro > 0 && (
                    <div style={{ width: `${data.fuelMix.hydro}%` }} className="bg-blue-500 h-full" title={`Hydro: ${data.fuelMix.hydro}%`} />
                  )}
                  {data.fuelMix.nuclear > 0 && (
                    <div style={{ width: `${data.fuelMix.nuclear}%` }} className="bg-purple-500 h-full" title={`Nuclear: ${data.fuelMix.nuclear}%`} />
                  )}
                  {data.fuelMix.gas > 0 && (
                    <div style={{ width: `${data.fuelMix.gas}%` }} className="bg-orange-500 h-full" title={`Natural Gas: ${data.fuelMix.gas}%`} />
                  )}
                  {data.fuelMix.coal > 0 && (
                    <div style={{ width: `${data.fuelMix.coal}%` }} className="bg-slate-600 h-full" title={`Coal: ${data.fuelMix.coal}%`} />
                  )}
                </div>

                {/* Fuel Mix Legend Badges */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                  {data.fuelMix.solar > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Solar {data.fuelMix.solar}%
                    </span>
                  )}
                  {data.fuelMix.wind > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Wind {data.fuelMix.wind}%
                    </span>
                  )}
                  {data.fuelMix.hydro > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Hydro {data.fuelMix.hydro}%
                    </span>
                  )}
                  {data.fuelMix.nuclear > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Nuclear {data.fuelMix.nuclear}%
                    </span>
                  )}
                  {data.fuelMix.gas > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Gas {data.fuelMix.gas}%
                    </span>
                  )}
                  {data.fuelMix.coal > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" /> Coal {data.fuelMix.coal}%
                    </span>
                  )}
                </div>
              </div>

              {/* Grid Carbon Dispatch Timing Windows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold mb-1">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Best Clean Charging Window</span>
                  </div>
                  <p className="text-emerald-100/90 font-mono text-[11px]">{data.bestOperatingWindow}</p>
                  <p className="text-[10px] text-emerald-400/80 mt-1">
                    Lowest emissions window: charge EV, heat water tanks & pre-cool
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-xs">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span>Peak Carbon Peaker Window</span>
                  </div>
                  <p className="text-rose-100/90 font-mono text-[11px]">{data.peakCarbonWindow}</p>
                  <p className="text-[10px] text-rose-400/80 mt-1">
                    Highest fossil emissions: discharge BESS battery & shed loads
                  </p>
                </div>
              </div>

              {/* Engineering Summary */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Grid Dynamic Note: </strong>
                {data.summary}
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            Active Factor:{' '}
            <strong className="text-emerald-300 font-mono">
              {simParams.gridCarbonIntensityKgPerKWh ?? 0.385} kg CO₂/kWh
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleApplyToSimulation}
              disabled={!data || loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {appliedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Applied to Digital Twin!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-slate-950" />
                  <span>Apply to 3D Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
