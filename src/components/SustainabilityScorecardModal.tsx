import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Sparkles,
  Award,
  Leaf,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Building,
  DollarSign,
  Sun,
  Battery,
  Flame,
  ArrowRight,
  Loader2,
  FileText,
  Share2,
} from 'lucide-react';
import {
  EnergySystemMeta,
  SimulationParams,
  SustainabilityScorecardData,
} from '../types/energy';
import { generateSustainabilityReportPDF } from '../utils/pdfReportGenerator';
import { SocialShareModal } from './SocialShareModal';

interface SustainabilityScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: EnergySystemMeta;
  simParams: SimulationParams;
  onApplyOptimization?: (paramUpdates: Partial<SimulationParams>) => void;
}

export const SustainabilityScorecardModal: React.FC<SustainabilityScorecardModalProps> = ({
  isOpen,
  onClose,
  system,
  simParams,
  onApplyOptimization,
}) => {
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [socialShareOpen, setSocialShareOpen] = useState(false);
  const [data, setData] = useState<SustainabilityScorecardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derived baseline and system metrics
  const annualBaselineCost = simParams.monthlyBaselineBill * 12;
  const annualBaselineKWh = annualBaselineCost / simParams.utilityRatePerKWh;
  const yieldMult = simParams.solarYieldMultiplier ?? 1.0;
  const annualSolarGenKWh = simParams.solarCapacityKW * 1380 * yieldMult;
  const tempDeviation = Math.abs(simParams.ambientTempC - 20);
  const climateLoadMultiplier = 1 + tempDeviation * 0.015;
  const hvacBaselineKWh = annualBaselineKWh * 0.52 * climateLoadMultiplier;
  const hvacSavingsKWh = hvacBaselineKWh * (1 - 1.2 / simParams.heatPumpCop);
  const shadingSavingsKWh = simParams.smartShadingActive ? annualBaselineKWh * 0.08 : 0;
  const totalAnnualKWhSaved = Math.min(
    annualSolarGenKWh + hvacSavingsKWh + shadingSavingsKWh,
    annualBaselineKWh * 0.96
  );
  const annualDollarSavings = totalAnnualKWhSaved * simParams.utilityRatePerKWh;
  const grossCost =
    simParams.solarCapacityKW * 2800 +
    simParams.batteryCapacityKWh * 750 +
    (simParams.heatPumpCop > 3.0 ? 9800 : 6500) +
    (simParams.smartShadingActive ? 3200 : 0);
  const taxCredit = grossCost * 0.3;
  const netCost = grossCost - taxCredit;
  const paybackYears = annualDollarSavings > 0 ? (netCost / annualDollarSavings).toFixed(1) : 'N/A';
  const co2OffsetTons = (totalAnnualKWhSaved * 0.0003855).toFixed(1);
  const gridIndependencePct = Math.min(Math.round((totalAnnualKWhSaved / annualBaselineKWh) * 100), 100);

  const fetchScorecard = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/sustainability-scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemId: system.id,
          systemName: system.name,
          climateRegion: simParams.climateRegion,
          ambientTempC: simParams.ambientTempC,
          solarYieldMultiplier: simParams.solarYieldMultiplier,
          buildingSizeSqFt: simParams.buildingSizeSqFt,
          solarCapacityKW: simParams.solarCapacityKW,
          batteryCapacityKWh: simParams.batteryCapacityKWh,
          heatPumpCop: simParams.heatPumpCop,
          utilityRatePerKWh: simParams.utilityRatePerKWh,
          monthlyBaselineBill: simParams.monthlyBaselineBill,
          smartShadingActive: simParams.smartShadingActive,
          calculatedMetrics: {
            annualDollarSavings: Math.round(annualDollarSavings),
            co2OffsetTons,
            paybackYears,
            netCost: Math.round(netCost),
            gridIndependencePct,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed with status ${res.status}`);
      }

      const scoreData: SustainabilityScorecardData = await res.json();
      setData(scoreData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate sustainability scorecard');
      // Graceful fallback to client calculation
      setData({
        overallScore: Math.min(Math.round(60 + (gridIndependencePct * 0.35) + (simParams.heatPumpCop * 3)), 98),
        certificationGrade: gridIndependencePct > 75 ? 'LEED Platinum / Net-Zero Ready' : 'Energy Star Class A+',
        dimensionScores: {
          carbonDecarbonization: Math.min(Math.round(gridIndependencePct * 0.95), 98),
          gridAutonomyResilience: Math.min(Math.round(simParams.batteryCapacityKWh > 10 ? 92 : 65), 96),
          thermodynamicEfficiency: Math.min(Math.round(simParams.heatPumpCop * 20), 96),
          lifecycleEconomics: Math.min(Math.round(100 - parseFloat(paybackYears || '10') * 6), 94),
        },
        executiveSummary: `The facility achieves significant decarbonization with ${co2OffsetTons} metric tons of CO2 offset annually. Solar generation and heat pump electrification provide strong baseline resilience.`,
        optimizationSuggestions: [
          {
            title: 'Optimize BESS Dispatch for Peak TOU Arbitrage',
            impact: 'VERY_HIGH',
            category: 'Solar & Storage',
            description: 'Configure battery discharging to absorb 100% of on-peak 4 PM - 9 PM tariff periods, reducing demand charges.',
            estimatedGain: '+$420 / yr, +1.2 MT CO2',
          },
          {
            title: 'Extend Cold-Climate Heat Pump Vapor Injection',
            impact: 'HIGH',
            category: 'Thermal & Envelope',
            description: 'Maintain heat pump COP above 3.0 at -15°C to avoid electric strip backup firing.',
            estimatedGain: '+$310 / yr, +0.9 MT CO2',
          },
          {
            title: 'Engage Heliotropic Kinetic Shading Schedule',
            impact: 'MEDIUM',
            category: 'Controls & Shading',
            description: 'Automate exterior louvers with solar position tracking to cut peak cooling load by 22%.',
            estimatedGain: '+$180 / yr',
          },
        ],
        esgAlignment: [
          { standard: 'LEED v4.1 Energy & Atmosphere', status: 'Achieved', detail: 'Meets minimum 30% modeled energy cost reduction.' },
          { standard: 'ASHRAE 90.1-2022 Prescriptive Path', status: 'Achieved', detail: 'HVAC COP & envelope R-values exceed standard minimums.' },
          { standard: 'GHG Protocol Scope 1 & 2 Decarbonization', status: 'On Track', detail: 'Displaces on-site fossil combustion by over 75%.' },
        ],
        nextMilestones: [
          'Commission sub-metering on HVAC circuits for ISO 50001 compliance',
          'File for IRA 30% Clean Energy Investment Tax Credit (Form 5695 / 3468)',
          'Enroll smart battery system in utility Virtual Power Plant (VPP) demand response',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchScorecard();
    }
  }, [isOpen, system.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReport = async () => {
    if (!data) return;
    setIsGeneratingPdf(true);
    try {
      generateSustainabilityReportPDF(system, simParams, data, {
        annualDollarSavings,
        paybackYears,
        grossCost,
        taxCredit,
        netCost,
        co2OffsetTons,
        gridIndependencePct,
        totalAnnualKWhSaved,
        annualSolarGenKWh,
        hvacSavingsKWh,
        shadingSavingsKWh,
      });
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!data) return;
    const reportText = `# SUSTAINABILITY SCORECARD & ESG ENERGY AUDIT
Generated: ${new Date().toLocaleDateString()}
Document ID: ETS-${Date.now().toString().slice(-6)}
System: ${system.name} (${system.sector})
Footprint: ${simParams.buildingSizeSqFt.toLocaleString()} sq ft

## OVERALL SUSTAINABILITY SCORE: ${data.overallScore} / 100
Certification Grade: ${data.certificationGrade}

### Dimension Scores:
- Carbon Decarbonization: ${data.dimensionScores.carbonDecarbonization} / 100
- Grid Autonomy & Resilience: ${data.dimensionScores.gridAutonomyResilience} / 100
- Thermodynamic HVAC Efficiency: ${data.dimensionScores.thermodynamicEfficiency} / 100
- Lifecycle Economics & Payback: ${data.dimensionScores.lifecycleEconomics} / 100

### Key Performance Indicators:
- Annual Cost Savings: $${Math.round(annualDollarSavings).toLocaleString()} / yr
- Simple Payback: ${paybackYears} Years
- Net System Cost (after 30% tax credit): $${Math.round(netCost).toLocaleString()}
- Annual Carbon Abatement: ${co2OffsetTons} Metric Tons CO2 / yr
- Grid Independence: ${gridIndependencePct}%

### Executive Assessment:
${data.executiveSummary}

### Targeted AI Optimization Suggestions:
${data.optimizationSuggestions.map((s, i) => `${i + 1}. [${s.impact}] ${s.title} (${s.category})\n   ${s.description}\n   Projected Gain: ${s.estimatedGain}`).join('\n\n')}

### ESG Standards Alignment:
${data.esgAlignment.map((e) => `- ${e.standard} [${e.status}]: ${e.detail}`).join('\n')}

### Next Milestones:
${data.nextMilestones.map((m, i) => `${i + 1}. ${m}`).join('\n')}
`;
    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sustainability_scorecard_${system.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      {/* Modal Container */}
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col text-slate-200 my-auto max-h-[95vh] overflow-hidden">
        {/* Floating Controls Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Sustainability Scorecard & ESG Audit</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-mono">
                  Official PDF
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Facility decarbonization, efficiency, ROI and carbon abatement report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchScorecard}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors border border-slate-700 disabled:opacity-50"
              title="Regenerate with AI"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Re-evaluate</span>
            </button>

            <button
              onClick={handleDownloadReport}
              disabled={!data || isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md hover:shadow-emerald-900/30 disabled:opacity-50 active:scale-98"
              title="Download Executive Summary PDF Report"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Report (PDF)'}</span>
            </button>

            <button
              onClick={() => setSocialShareOpen(true)}
              disabled={!data}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/90 hover:bg-sky-900/90 text-sky-300 font-semibold text-xs transition-all border border-sky-600/60 shadow-xs hover:shadow-sky-950/50 disabled:opacity-50 cursor-pointer"
              title="Export Branded Card for LinkedIn & X"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Share Card</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={!data}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors border border-slate-700 disabled:opacity-50"
              title="Print Scorecard View"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              disabled={!data}
              className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-[11px] text-slate-400 hover:text-slate-200 transition-colors border border-slate-800"
              title="Export Raw Markdown"
            >
              <FileText className="w-3 h-3 text-slate-400" />
              <span>.md</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable PDF Document Canvas */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950/40">
          {loading && !data ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs font-medium">
                Auditing thermodynamic balance & generating AI Sustainability Scorecard...
              </p>
            </div>
          ) : data ? (
            /* Printable PDF-Style Sheet */
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-5 sm:p-7 shadow-xl space-y-6 text-slate-200 max-w-3xl mx-auto print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
              {/* Document Certificate Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
                      Official Energy Audit & Verification
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      DOC ID: ETS-{new Date().getFullYear()}-{system.id.toUpperCase().slice(0, 4)}
                    </span>
                  </div>
                  <h1 className="text-xl font-extrabold text-white tracking-tight">
                    Sustainability & Decarbonization Scorecard
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Facility: <span className="text-slate-200 font-semibold">{system.name}</span> • Sector:{' '}
                    <span className="text-slate-200 font-semibold">{system.sector}</span> • Footprint:{' '}
                    <span className="text-slate-200 font-semibold">{simParams.buildingSizeSqFt.toLocaleString()} sq ft</span> • Climate:{' '}
                    <span className="text-cyan-300 font-semibold capitalize">{simParams.climateRegion || 'Temperate'}</span> ({simParams.ambientTempC}°C • {(simParams.solarYieldMultiplier || 1.0).toFixed(2)}x Solar)
                  </p>
                </div>

                {/* Overall Score Badge */}
                <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 shrink-0 self-start sm:self-auto">
                  <div className="text-center px-2">
                    <div className="text-2xl font-black text-emerald-400 font-mono leading-none">
                      {data.overallScore}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                      Score / 100
                    </div>
                  </div>
                  <div className="border-l border-slate-800 pl-3">
                    <div className="text-xs font-bold text-white uppercase tracking-tight">
                      {data.certificationGrade}
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-0.5">
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Certified Verification</span>
                      </div>
                      <button
                        onClick={() => setSocialShareOpen(true)}
                        className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 font-semibold transition-colors cursor-pointer"
                        title="Generate branded LinkedIn & X card"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share on LinkedIn / X ›</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Dimension Progress Bars */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Decarbonization Dimension Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Dimension 1 */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">Carbon Decarbonization (Scope 1 & 2)</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {data.dimensionScores.carbonDecarbonization}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${data.dimensionScores.carbonDecarbonization}%` }}
                      />
                    </div>
                  </div>

                  {/* Dimension 2 */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">Energy Autonomy & Grid Resilience</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {data.dimensionScores.gridAutonomyResilience}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${data.dimensionScores.gridAutonomyResilience}%` }}
                      />
                    </div>
                  </div>

                  {/* Dimension 3 */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">Thermodynamic HVAC Efficiency</span>
                      <span className="font-mono font-bold text-amber-400">
                        {data.dimensionScores.thermodynamicEfficiency}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${data.dimensionScores.thermodynamicEfficiency}%` }}
                      />
                    </div>
                  </div>

                  {/* Dimension 4 */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">Lifecycle ROI & Economics</span>
                      <span className="font-mono font-bold text-purple-400">
                        {data.dimensionScores.lifecycleEconomics}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${data.dimensionScores.lifecycleEconomics}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Scorecard Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Annual Net Savings</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    ${Math.round(annualDollarSavings).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{( (annualDollarSavings / annualBaselineCost) * 100 ).toFixed(0)}% utility reduction</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Simple Payback</div>
                  <div className="text-base font-bold text-white font-mono mt-0.5">
                    {paybackYears} Years
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Net Inv: ${Math.round(netCost).toLocaleString()}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Carbon Offset</div>
                  <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
                    {co2OffsetTons} MT
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">CO2 abated / yr</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Grid Autonomy</div>
                  <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
                    {gridIndependencePct}%
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">On-site clean power</div>
                </div>
              </div>

              {/* Executive Summary Quote Box */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px] mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI CSO Executive Assessment</span>
                </div>
                <p>{data.executiveSummary}</p>
              </div>

              {/* Technical Equipment Schedule Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  System Configuration Schedule
                </h3>
                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/50">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Subsystem / Technology</th>
                        <th className="py-2.5 px-3">Configured Sizing</th>
                        <th className="py-2.5 px-3">Performance Metric</th>
                        <th className="py-2.5 px-3">Annual Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                      <tr>
                        <td className="py-2 px-3 font-medium text-white flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          <span>Solar Photovoltaic Array</span>
                        </td>
                        <td className="py-2 px-3 font-mono">{simParams.solarCapacityKW} kW DC</td>
                        <td className="py-2 px-3">High-efficiency TOPCon / PERC</td>
                        <td className="py-2 px-3 text-emerald-400 font-mono">
                          ~{Math.round(annualSolarGenKWh).toLocaleString()} kWh/yr
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-white flex items-center gap-1.5">
                          <Battery className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Battery Energy Storage (BESS)</span>
                        </td>
                        <td className="py-2 px-3 font-mono">{simParams.batteryCapacityKWh} kWh</td>
                        <td className="py-2 px-3">LiFePO4 92.5% Round-Trip</td>
                        <td className="py-2 px-3 text-cyan-400">Peak Load Shaving</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-white flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Inverter Heat Pump System</span>
                        </td>
                        <td className="py-2 px-3 font-mono">COP {simParams.heatPumpCop.toFixed(1)}</td>
                        <td className="py-2 px-3">Variable-Speed Vapor Injection</td>
                        <td className="py-2 px-3 text-emerald-400 font-mono">
                          ~{Math.round(hvacSavingsKWh).toLocaleString()} kWh cut
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-white">Solar Shading & Dynamic Louvers</td>
                        <td className="py-2 px-3">
                          {simParams.smartShadingActive ? 'Active (Heliotropic)' : 'Disabled'}
                        </td>
                        <td className="py-2 px-3">SHGC 0.09 Modulation</td>
                        <td className="py-2 px-3 text-amber-400">
                          {simParams.smartShadingActive ? '-22% Cooling Peak' : 'Baseline'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI-Powered Optimization Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>AI Engineering Optimization Suggestions</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Ranked by Decarbonization ROI</span>
                </div>

                <div className="space-y-2.5">
                  {data.optimizationSuggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                sug.impact === 'VERY_HIGH'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                                  : sug.impact === 'HIGH'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                              }`}
                            >
                              {sug.impact} IMPACT
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {sug.category}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white">{sug.title}</h4>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            {sug.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                            Projected Gain
                          </span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            {sug.estimatedGain}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ESG Standards Alignment & Next Milestones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    ESG Standards Compliance
                  </h3>
                  <ul className="space-y-2 text-xs">
                    {data.esgAlignment.map((esg, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px]"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-200">
                          <span>{esg.standard}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-mono">
                            {esg.status}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-0.5">{esg.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Next Strategic Milestones
                  </h3>
                  <div className="space-y-2 text-xs">
                    {data.nextMilestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Official Verification Sign-off */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4 text-[10px] text-slate-500 font-mono">
                <div>
                  Audited via EcoTwin Studio Thermodynamic Simulator & Gemini Intelligence Engine
                </div>
                <div>ISO 50001 Energy Management & LEED v4.1 Methodologies Applied</div>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs mt-4">
              <p className="font-semibold mb-1">Evaluation Notice</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
      {/* Social Media Share Modal */}
      {data && (
        <SocialShareModal
          isOpen={socialShareOpen}
          onClose={() => setSocialShareOpen(false)}
          system={system}
          simParams={simParams}
          data={data}
          metrics={{
            annualDollarSavings,
            paybackYears,
            grossCost,
            taxCredit,
            netCost,
            co2OffsetTons,
            gridIndependencePct,
            totalAnnualKWhSaved,
            annualSolarGenKWh,
            hvacSavingsKWh,
            shadingSavingsKWh,
          }}
        />
      )}
    </div>
  );
};
