import React, { useState } from 'react';
import {
  Brain,
  X,
  Sparkles,
  Loader2,
  Download,
  Building,
  ThermometerSnowflake,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import { DeepDesignResult, SimulationParams } from '../types/energy';
import { CLIMATE_REGIONS } from '../data/climateData';

interface DeepDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  simParams?: SimulationParams;
}

export const DeepDesignModal: React.FC<DeepDesignModalProps> = ({
  isOpen,
  onClose,
  simParams,
}) => {
  const [facilityType, setFacilityType] = useState('Single Family Residence');
  const [sizeSqFt, setSizeSqFt] = useState(2500);
  const [climateZone, setClimateZone] = useState('Zone 5A (Cold - Chicago / Midwest)');
  const [location, setLocation] = useState('Midwest USA');
  const [currentMonthlyBill, setCurrentMonthlyBill] = useState(340);
  const [primaryHeatingFuel, setPrimaryHeatingFuel] = useState('Natural Gas Furnace (80% AFUE) + 10 SEER AC');
  const [targetGoals, setTargetGoals] = useState(['Net-Zero Ready', 'Heat Pump Electrification', 'Solar + Battery Peak Shaving']);
  const [budgetTier, setBudgetTier] = useState('Balanced Payback (< 6.5 Years)');
  const [customNotes, setCustomNotes] = useState('Size inverter heat pump for -15°F design temp and calculate solar PV offset.');

  const syncClimate = () => {
    if (!simParams?.climateRegion) return;
    const region = CLIMATE_REGIONS[simParams.climateRegion];
    if (!region) return;

    if (region.id === 'desert') {
      setClimateZone('Zone 2B (Hot Dry - Phoenix / Dubai)');
      setLocation('Southwestern Arid Sun Belt');
    } else if (region.id === 'arctic') {
      setClimateZone('Zone 7/8 (Subarctic / Extreme Cold - Anchorage / Oslo)');
      setLocation('High Latitude Northern Subpolar');
    } else if (region.id === 'tropical') {
      setClimateZone('Zone 1A (Very Hot Humid - Miami / Singapore)');
      setLocation('Equatorial Coastal');
    } else if (region.id === 'maritime') {
      setClimateZone('Zone 4C (Marine - Seattle / Vancouver / London)');
      setLocation('Pacific Northwest Maritime');
    } else if (region.id === 'alpine') {
      setClimateZone('Zone 6B / 7 (High-Altitude Montane - Denver / Alps)');
      setLocation('Alpine Mountain Plateau');
    } else {
      setClimateZone('Zone 5A (Cold - Chicago / Midwest / Frankfurt)');
      setLocation('Temperate Midwest Continental');
    }
    setSizeSqFt(simParams.buildingSizeSqFt || 2400);
    setCurrentMonthlyBill(simParams.monthlyBaselineBill || 320);
  };

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeepDesignResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/deep-design-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityType,
          sizeSqFt,
          climateZone,
          location,
          currentMonthlyBill,
          primaryHeatingFuel,
          targetGoals,
          budgetTier,
          customNotes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate deep engineering design.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.text) return;
    const blob = new Blob([result.text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy_retrofit_specification_${facilityType.toLowerCase().replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950 text-purple-300 border border-purple-800/60">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Deep Energy System Designer & Retrofit PE</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/80">
                  gemini-4-argon • High Thinking
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thermodynamic load balancing, heat pump sizing, solar-plus-storage sizing & 25-yr financial models
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {!result ? (
            /* Engineering Parameters Form */
            <div className="space-y-4">
              {simParams?.climateRegion && (
                <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300">
                      Active Climate: <strong className="text-emerald-400">{CLIMATE_REGIONS[simParams.climateRegion]?.name || simParams.climateRegion}</strong> ({simParams.ambientTempC}°C baseline, {simParams.solarYieldMultiplier}x yield)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={syncClimate}
                    className="px-2.5 py-1 text-[11px] font-medium bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded-lg transition-colors cursor-pointer"
                  >
                    Sync Params
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Facility Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Facility / Building Type</label>
                  <select
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Single Family Residence">Single Family Residence</option>
                    <option value="Multi-Family Apartment Building">Multi-Family Apartment Building</option>
                    <option value="Commercial Office Building">Commercial Office Building</option>
                    <option value="Retail & Shopping Center">Retail & Shopping Center</option>
                    <option value="Light Industrial & Warehouse">Light Industrial & Warehouse</option>
                    <option value="School / Educational Campus">School / Educational Campus</option>
                  </select>
                </div>

                {/* Footprint */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Floor Area ({sizeSqFt.toLocaleString()} sq ft)
                  </label>
                  <input
                    type="range"
                    min="800"
                    max="50000"
                    step="200"
                    value={sizeSqFt}
                    onChange={(e) => setSizeSqFt(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-400 mt-2"
                  />
                </div>

                {/* Climate Zone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Climate Zone</label>
                  <select
                    value={climateZone}
                    onChange={(e) => setClimateZone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Zone 3A (Warm Humid - Atlanta / Dallas)">Zone 3A (Warm Humid - Atlanta / Dallas)</option>
                    <option value="Zone 4A (Mixed Humid - DC / Cincinnati)">Zone 4A (Mixed Humid - DC / Cincinnati)</option>
                    <option value="Zone 5A (Cold - Chicago / Midwest)">Zone 5A (Cold - Chicago / Midwest)</option>
                    <option value="Zone 6A (Very Cold - Minneapolis / Burlington)">Zone 6A (Very Cold - Minneapolis)</option>
                    <option value="Zone 2B (Hot Dry - Phoenix / Vegas)">Zone 2B (Hot Dry - Phoenix / Vegas)</option>
                  </select>
                </div>

                {/* Current Monthly Bill */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Current Monthly Energy Bill ($)</label>
                  <input
                    type="number"
                    value={currentMonthlyBill}
                    onChange={(e) => setCurrentMonthlyBill(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Existing Heating/Cooling */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Existing HVAC & Heating</label>
                  <select
                    value={primaryHeatingFuel}
                    onChange={(e) => setPrimaryHeatingFuel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Natural Gas Furnace (80% AFUE) + 10 SEER AC">Natural Gas Furnace (80% AFUE) + 10 SEER AC</option>
                    <option value="Electric Resistance Baseboards + Window ACs">Electric Resistance Baseboards + Window ACs</option>
                    <option value="Fuel Oil Boiler + Hydronic Baseboards">Fuel Oil Boiler + Hydronic Baseboards</option>
                    <option value="Propane Furnace + Standard Split AC">Propane Furnace + Standard Split AC</option>
                    <option value="Aging Rooftop Packaged Units (RTUs) on Gas">Aging Rooftop Packaged Units (RTUs) on Gas</option>
                  </select>
                </div>

                {/* Budget Tier */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Payback Tier</label>
                  <select
                    value={budgetTier}
                    onChange={(e) => setBudgetTier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Rapid Payback (< 4.5 Years)">Rapid Payback (&lt; 4.5 Years)</option>
                    <option value="Balanced Payback (< 6.5 Years)">Balanced Payback (&lt; 6.5 Years)</option>
                    <option value="Maximum Carbon Abatement (Net-Zero Priority)">Maximum Carbon Abatement (Net-Zero Priority)</option>
                  </select>
                </div>
              </div>

              {/* Custom Technical Requirements */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom Engineering Focus & Specific Constraints
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Trigger Button */}
              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-purple-950/50 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                      <span>Engaging High-Thinking Thermodynamic Reasoning Engine (Gemini 4 Argon)...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 text-purple-300" />
                      <span>Compute Deep Thermodynamic Design & Retrofit Engineering Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Result View */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-800/60">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-300">
                    Engineered Model: {result.modelUsed}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span>Download Report (.md)</span>
                  </button>
                  <button
                    onClick={() => setResult(null)}
                    className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-xs font-medium text-purple-200 transition-colors border border-purple-700"
                  >
                    Edit Inputs
                  </button>
                </div>
              </div>

              {/* Markdown Render */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap space-y-2">
                {result.text}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
              <p className="font-semibold mb-1">Execution Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
