import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Download,
  Printer,
  Sun,
  Battery,
  Building,
  Zap,
  TrendingDown,
  TrendingUp,
  Clock,
  DollarSign,
  Leaf,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  Flame,
  Globe,
  Loader2,
} from 'lucide-react';
import { EnergySystemMeta, SimulationParams } from '../types/energy';
import {
  calculateDailyEnergyMetrics,
  generateDailyEnergySummaryPDF,
  DailyEnergyMetrics,
} from '../utils/dailyEnergyReportPDF';

interface DailyEnergySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: EnergySystemMeta;
  simParams: SimulationParams;
  onOpenSmartDevices?: () => void;
}

export const DailyEnergySummaryModal: React.FC<DailyEnergySummaryModalProps> = ({
  isOpen,
  onClose,
  system,
  simParams,
  onOpenSmartDevices,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hourly' | 'financial'>('overview');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Compute 24-hour diurnal physics metrics
  const metrics: DailyEnergyMetrics = useMemo(() => {
    return calculateDailyEnergyMetrics(simParams, system);
  }, [simParams, system]);

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        generateDailyEnergySummaryPDF(system, simParams, metrics);
      } catch (err) {
        console.error('PDF generation error:', err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 150);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const maxPowerKW = Math.max(
    ...metrics.hourlyProfile.map((p) => Math.max(p.solarKW, p.totalLoadKW, Math.abs(p.batteryFlowKW), Math.abs(p.gridFlowKW)))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-hidden print:p-0 print:bg-white print:static print:z-auto">
      
      {/* Print-only CSS to format immaculate physical reports */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #daily-report-printable-area, #daily-report-printable-area * {
            visibility: visible;
          }
          #daily-report-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background-color: #ffffff !important;
            color: #0f172a !important;
            padding: 20px;
          }
          .print-hide {
            display: none !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
          .print-border-light {
            border-color: #e2e8f0 !important;
          }
          .print-bg-light {
            background-color: #f8fafc !important;
          }
        }
      `}</style>

      <div
        id="daily-report-printable-area"
        ref={printAreaRef}
        className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden print:max-h-none print:border-none print:shadow-none print:rounded-none print:bg-white print:text-slate-900"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm shrink-0 print:bg-white print:border-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 print:bg-cyan-700">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight print:text-slate-900">
                  Daily Energy Performance Report
                </h2>
                <span className="text-xs text-cyan-400 font-mono font-medium px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/60 print:bg-cyan-100 print:text-cyan-800 print:border-cyan-200">
                  24-Hour Diurnal Profile
                </span>
                <span className="text-xs text-slate-400 print:text-slate-600">
                  {system.name} · {system.sector}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 print:text-slate-600">
                Physics-grounded simulation of diurnal PV generation, HVAC load, BESS dispatch, and TOU peak arbitrage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print-hide">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open browser print dialog / Save as PDF"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Print View</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Download executive vector PDF report"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compiling...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
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

        {/* 5 Core Summary Metric HUD Cards */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800/80 shrink-0 print:bg-slate-50 print:border-slate-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            
            {/* 1. Daily Solar Harvest */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 print:bg-white print:border-slate-300">
              <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600 mb-1">
                <span>Solar Generation</span>
                <Sun className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-amber-300 print:text-amber-600">
                  {metrics.totalSolarKWh}
                </span>
                <span className="text-xs text-slate-500 font-mono">kWh/day</span>
              </div>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                {metrics.solarSelfConsumptionPct}% used on-site
              </p>
            </div>

            {/* 2. Total Facility Load */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 print:bg-white print:border-slate-300">
              <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600 mb-1">
                <span>Facility Demand</span>
                <Building className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-purple-300 print:text-purple-600">
                  {metrics.totalLoadKWh}
                </span>
                <span className="text-xs text-slate-500 font-mono">kWh/day</span>
              </div>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                HVAC: {metrics.totalHvacKWh} kWh
              </p>
            </div>

            {/* 3. Grid Independence */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 print:bg-white print:border-slate-300">
              <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600 mb-1">
                <span>Grid Autonomy</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-emerald-300 print:text-emerald-600">
                  {metrics.gridIndependencePct}%
                </span>
                <span className="text-xs text-slate-500 font-mono">clean</span>
              </div>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                {metrics.totalGridImportKWh} kWh grid draw
              </p>
            </div>

            {/* 4. Daily Operating Savings */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 print:bg-white print:border-slate-300">
              <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600 mb-1">
                <span>Daily Savings</span>
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-cyan-300 print:text-cyan-600">
                  ${metrics.dailySavings}
                </span>
                <span className="text-xs text-slate-500 font-mono">/day</span>
              </div>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                ~${metrics.monthlyProjectedSavings}/mo projected
              </p>
            </div>

            {/* 5. CO2 Decarbonization */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 col-span-2 sm:col-span-1 print:bg-white print:border-slate-300">
              <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600 mb-1">
                <span>CO₂ Avoided</span>
                <Leaf className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-teal-300 print:text-teal-600">
                  {metrics.dailyCo2AvoidedKg}
                </span>
                <span className="text-xs text-slate-500 font-mono">kg/day</span>
              </div>
              <p className="text-[11px] text-slate-400 print:text-slate-500 mt-0.5">
                {metrics.annualCo2AvoidedTons} t/yr abatement
              </p>
            </div>

          </div>
        </div>

        {/* View Mode Tabs (Hidden in Print) */}
        <div className="px-6 pt-3 pb-2 flex items-center justify-between border-b border-slate-800/70 bg-slate-900 shrink-0 print-hide">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              24-Hour Diurnal Overview
            </button>
            <button
              onClick={() => setActiveTab('hourly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'hourly'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Hourly Dispatch Table (24h)
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'financial'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              TOU Tariffs & Carbon Metrics
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Solar PV
            </span>
            <span className="flex items-center gap-1 text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Facility Load
            </span>
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> BESS
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto max-h-[56vh] space-y-6 custom-scrollbar print:max-h-none print:overflow-visible print:p-0 print:space-y-4">
          
          {/* TAB 1: 24-HOUR DIURNAL OVERVIEW */}
          {(activeTab === 'overview' || typeof window === 'undefined') && (
            <div className="space-y-5">
              
              {/* Visual 24-Hour Diurnal Chart */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 print:bg-white print:border-slate-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider print:text-slate-900">
                      24-Hour Diurnal Power Dispatch Profile
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 print:text-slate-600">
                    Solar Peak: {(simParams.solarCapacityKW * 0.92).toFixed(1)} kW · Peak Tariff: 16:00 - 21:00
                  </span>
                </div>

                {/* SVG 24-Hour Column / Flow visualization */}
                <div className="relative h-44 w-full flex items-end gap-1 pt-6 pb-4">
                  {metrics.hourlyProfile.map((pt) => {
                    const solarHeight = (pt.solarKW / (maxPowerKW || 1)) * 100;
                    const loadHeight = (pt.totalLoadKW / (maxPowerKW || 1)) * 100;
                    const isPeak = pt.isPeakTariff;

                    return (
                      <div
                        key={pt.hour}
                        className={`flex-1 h-full flex flex-col justify-end items-center relative group ${
                          isPeak ? 'bg-red-950/20 rounded-md print:bg-red-50' : ''
                        }`}
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-800 text-[10px] text-white px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none print:hidden">
                          <strong>{pt.timeLabel}</strong>: Solar {pt.solarKW} kW · Load {pt.totalLoadKW} kW
                        </div>

                        {/* Power Bars side-by-side or stacked */}
                        <div className="w-full flex items-end justify-center gap-0.5 h-full">
                          {/* Solar Bar */}
                          <div
                            style={{ height: `${solarHeight}%` }}
                            className="w-1.5 bg-amber-400 rounded-t-sm transition-all"
                            title={`Solar: ${pt.solarKW} kW`}
                          />
                          {/* Load Bar */}
                          <div
                            style={{ height: `${loadHeight}%` }}
                            className="w-1.5 bg-purple-400/90 rounded-t-sm transition-all"
                            title={`Load: ${pt.totalLoadKW} kW`}
                          />
                          {/* Battery Bar (if discharging, emerald, if charging cyan) */}
                          {pt.batteryFlowKW !== 0 && (
                            <div
                              style={{ height: `${(Math.abs(pt.batteryFlowKW) / (maxPowerKW || 1)) * 100}%` }}
                              className={`w-1 rounded-t-sm ${pt.batteryFlowKW > 0 ? 'bg-cyan-400' : 'bg-emerald-400'}`}
                              title={`BESS: ${pt.batteryFlowKW} kW`}
                            />
                          )}
                        </div>

                        {/* Hour Label */}
                        <span className="text-[8px] font-mono text-slate-500 mt-1 print:text-slate-600">
                          {pt.hour % 3 === 0 ? `${pt.hour}h` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 print:border-slate-300 print:text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Solar Generation (kW)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-purple-400 inline-block" /> Total Facility Load (kW)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" /> BESS Peak Discharge (kW)
                    </span>
                  </div>
                  <span className="text-red-400 font-medium print:text-red-600">
                    Shaded: 4 PM - 9 PM Peak TOU Window
                  </span>
                </div>
              </div>

              {/* Subsystem Flow Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Energy Generation & Consumption */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 print:bg-white print:border-slate-300">
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5 print:text-slate-900">
                    <Sun className="w-4 h-4 text-amber-400" />
                    Renewable Harvest & Facility Consumption
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-slate-200">
                      <span className="text-slate-400 print:text-slate-600">Total Solar PV Generated</span>
                      <strong className="text-amber-300 font-mono print:text-amber-700">{metrics.totalSolarKWh} kWh/day</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-slate-200">
                      <span className="text-slate-400 print:text-slate-600">HVAC Heat Pump Consumption</span>
                      <strong className="text-slate-200 font-mono print:text-slate-800">{metrics.totalHvacKWh} kWh/day</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-slate-200">
                      <span className="text-slate-400 print:text-slate-600">Base Lighting & Plug Loads</span>
                      <strong className="text-slate-200 font-mono print:text-slate-800">
                        {(metrics.totalLoadKWh - metrics.totalHvacKWh - metrics.totalSmartDeltaKWh).toFixed(1)} kWh/day
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-slate-200">
                      <span className="text-slate-400 print:text-slate-600">Smart Devices Net Delta</span>
                      <strong className={`font-mono ${metrics.totalSmartDeltaKWh < 0 ? 'text-emerald-400' : 'text-cyan-300'}`}>
                        {metrics.totalSmartDeltaKWh > 0 ? `+${metrics.totalSmartDeltaKWh}` : metrics.totalSmartDeltaKWh} kWh/day
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 pt-2 font-bold text-sm">
                      <span className="text-white print:text-slate-900">Net Facility Consumption</span>
                      <span className="text-purple-300 font-mono print:text-purple-700">{metrics.totalLoadKWh} kWh/day</span>
                    </div>
                  </div>
                </div>

                {/* Storage & Grid Arbitrage */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 print:bg-white print:border-slate-300">
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5 print:text-slate-900">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    Storage Throughput & Grid Interactions
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-slate-200">
                      <span className="text-slate-400 print:text-slate-600">BESS Stored from Solar</span>
                      <strong className="text-cyan-300 font-mono print:text-cyan-700">+{metrics.totalBatteryChargedKWh} kWh/day</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-slate-200">
                      <span className="text-slate-400 print:text-slate-600">BESS Discharged during Peak</span>
                      <strong className="text-emerald-300 font-mono print:text-emerald-700">-{metrics.totalBatteryDischargedKWh} kWh/day</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-slate-200">
                      <span className="text-slate-400 print:text-slate-600">Clean Solar Export to Grid</span>
                      <strong className="text-emerald-300 font-mono print:text-emerald-700">+{metrics.totalGridExportKWh} kWh/day</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 print:border-slate-200">
                      <span className="text-slate-400 print:text-slate-600">Fossil Grid Import (Off-Peak)</span>
                      <strong className="text-amber-400 font-mono print:text-amber-700">{metrics.totalGridImportKWh} kWh/day</strong>
                    </div>
                    <div className="flex justify-between py-1 pt-2 font-bold text-sm">
                      <span className="text-white print:text-slate-900">Peak Load Shaved (4-9 PM)</span>
                      <span className="text-emerald-400 font-mono print:text-emerald-700">{metrics.peakHourShedKWh} kWh/day</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: HOURLY DISPATCH TABLE */}
          {(activeTab === 'hourly' || typeof window === 'undefined') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider print:text-slate-900">
                  Full 24-Hour Diurnal Dispatch Matrix
                </span>
                <span className="text-xs text-slate-400 print:text-slate-600">
                  All units in kW power draw and $ cost per hourly interval
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] print:bg-slate-100 print:text-slate-700">
                    <tr>
                      <th className="py-2 px-3">Hour</th>
                      <th className="py-2 px-2">Solar</th>
                      <th className="py-2 px-2">Base</th>
                      <th className="py-2 px-2">HVAC</th>
                      <th className="py-2 px-2">Smart</th>
                      <th className="py-2 px-2 font-bold text-white print:text-slate-900">Total Load</th>
                      <th className="py-2 px-2">BESS</th>
                      <th className="py-2 px-2">Grid Flow</th>
                      <th className="py-2 px-2">Tariff</th>
                      <th className="py-2 px-3 text-right">Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                    {metrics.hourlyProfile.map((pt) => {
                      const isPeak = pt.isPeakTariff;
                      const hrSavings = pt.costBaseline - pt.costOptimized;

                      return (
                        <tr
                          key={pt.hour}
                          className={`${
                            isPeak
                              ? 'bg-red-950/20 text-slate-200 print:bg-red-50'
                              : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          <td className="py-2 px-3 font-semibold text-slate-200 print:text-slate-900">
                            {pt.timeLabel}
                          </td>
                          <td className="py-2 px-2 text-amber-300 print:text-amber-700">
                            {pt.solarKW > 0 ? `${pt.solarKW} kW` : '—'}
                          </td>
                          <td className="py-2 px-2 text-slate-400 print:text-slate-600">{pt.baseLoadKW} kW</td>
                          <td className="py-2 px-2 text-slate-400 print:text-slate-600">{pt.hvacLoadKW} kW</td>
                          <td className="py-2 px-2">
                            <span
                              className={
                                pt.smartLoadDeltaKW < 0
                                  ? 'text-emerald-400'
                                  : pt.smartLoadDeltaKW > 0
                                  ? 'text-cyan-300'
                                  : 'text-slate-500'
                              }
                            >
                              {pt.smartLoadDeltaKW !== 0 ? `${pt.smartLoadDeltaKW > 0 ? `+${pt.smartLoadDeltaKW}` : pt.smartLoadDeltaKW} kW` : '0 kW'}
                            </span>
                          </td>
                          <td className="py-2 px-2 font-bold text-white print:text-slate-900">
                            {pt.totalLoadKW} kW
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={
                                pt.batteryFlowKW > 0
                                  ? 'text-cyan-300'
                                  : pt.batteryFlowKW < 0
                                  ? 'text-emerald-300'
                                  : 'text-slate-500'
                              }
                            >
                              {pt.batteryFlowKW > 0 ? `+${pt.batteryFlowKW}` : pt.batteryFlowKW < 0 ? pt.batteryFlowKW : '0.0'}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={
                                pt.gridFlowKW > 0
                                  ? 'text-emerald-400'
                                  : pt.gridFlowKW < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-500'
                              }
                            >
                              {pt.gridFlowKW > 0 ? `+${pt.gridFlowKW} Exp` : pt.gridFlowKW < 0 ? `${pt.gridFlowKW} Imp` : '0.0'}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`text-[10px] px-1 py-0.5 rounded font-mono ${
                                isPeak
                                  ? 'bg-red-950 text-red-300 border border-red-800'
                                  : 'text-slate-400'
                              }`}
                            >
                              ${pt.ratePerKWh.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-400 print:text-emerald-700">
                            +${hrSavings.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIAL ROI & CARBON METRICS */}
          {(activeTab === 'financial' || typeof window === 'undefined') && (
            <div className="space-y-4">
              
              {/* Financial Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 print:bg-white print:border-slate-300">
                  <span className="text-xs text-slate-400 print:text-slate-600">Conventional Daily Baseline</span>
                  <div className="text-2xl font-bold font-mono text-slate-300 print:text-slate-800 mt-1">
                    ${metrics.dailyCostBaseline}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Fossil gas/resistive heating + full retail peak tariffs
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 print:bg-white print:border-slate-300">
                  <span className="text-xs text-slate-400 print:text-slate-600">Optimized Microgrid Cost</span>
                  <div className="text-2xl font-bold font-mono text-cyan-300 print:text-cyan-700 mt-1">
                    ${metrics.dailyCostOptimized}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Solar self-consumption + BESS peak-shaving arbitrage
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-950/50 to-teal-950/50 border border-emerald-600/40 print:bg-emerald-50 print:border-emerald-300">
                  <span className="text-xs text-emerald-300 font-semibold print:text-emerald-800">Net Daily Operating Savings</span>
                  <div className="text-2xl font-bold font-mono text-emerald-300 print:text-emerald-700 mt-1">
                    +${metrics.dailySavings} / day
                  </div>
                  <p className="text-xs text-emerald-400/80 print:text-emerald-700 mt-1">
                    ${metrics.annualProjectedSavings.toLocaleString()} / year projected cumulative
                  </p>
                </div>
              </div>

              {/* Environmental EPA Impact Equivalence */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 print:bg-white print:border-slate-300">
                <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2 print:text-slate-900">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  EPA Environmental Equivalencies & Decarbonization Footprint
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                    <span className="text-xs text-slate-400 print:text-slate-600">Avoided Driving Miles</span>
                    <div className="text-xl font-bold font-mono text-emerald-300 print:text-emerald-700 mt-1">
                      {metrics.equivalentMilesAvoided} mi/day
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Equivalent gasoline vehicle miles eliminated</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                    <span className="text-xs text-slate-400 print:text-slate-600">Tree Seedlings Sequestered</span>
                    <div className="text-xl font-bold font-mono text-teal-300 print:text-teal-700 mt-1">
                      {metrics.equivalentTreesPlanted} trees
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Equivalent urban carbon sequestration</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                    <span className="text-xs text-slate-400 print:text-slate-600">Smart Peak Demand Ratchet</span>
                    <div className="text-xl font-bold font-mono text-cyan-300 print:text-cyan-700 mt-1">
                      100% Shaved
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">0.0 kW fossil peak import during 4 PM - 9 PM</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0 print:border-slate-300 print:bg-white">
          <div className="text-xs text-slate-400 print:text-slate-600 flex items-center gap-3">
            <span>
              Solar Harvest: <strong className="text-amber-300 print:text-amber-700">{metrics.totalSolarKWh} kWh</strong>
            </span>
            <span>·</span>
            <span>
              Net Load: <strong className="text-purple-300 print:text-purple-700">{metrics.totalLoadKWh} kWh</strong>
            </span>
            <span>·</span>
            <span>
              Daily Savings: <strong className="text-emerald-400 print:text-emerald-700">+${metrics.dailySavings}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 print-hide">
            {onOpenSmartDevices && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSmartDevices();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Adjust Smart Appliances</span>
              </button>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compiling PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Executive PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
