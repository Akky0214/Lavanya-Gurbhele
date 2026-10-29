import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Smartphone,
  Monitor,
} from 'lucide-react';
import {
  EnergySystemMeta,
  SimulationParams,
  SustainabilityScorecardData,
} from '../types/energy';
import {
  SocialCardFormat,
  SocialCardTheme,
  SocialCardMetrics,
  renderSocialCardToCanvas,
  downloadSocialCardImage,
  generateSocialCardBlob,
} from '../utils/socialCardCanvas';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: EnergySystemMeta;
  simParams: SimulationParams;
  data: SustainabilityScorecardData;
  metrics: SocialCardMetrics;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  system,
  simParams,
  data,
  metrics,
}) => {
  const [format, setFormat] = useState<SocialCardFormat>('landscape');
  const [theme, setTheme] = useState<SocialCardTheme>('cyber_emerald');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Redraw canvas whenever format, theme, or props change
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    renderSocialCardToCanvas(canvasRef.current, {
      system,
      simParams,
      data,
      metrics,
      format,
      theme,
    });
  }, [isOpen, format, theme, system, simParams, data, metrics]);

  if (!isOpen) return null;

  // Formatted post templates
  const generatePostCopy = (platform: 'linkedin' | 'x') => {
    const trees = Math.round(parseFloat(metrics.co2OffsetTons) * 45);
    const savings = Math.round(metrics.annualDollarSavings).toLocaleString();
    const cleanKWh = Math.round(metrics.totalAnnualKWhSaved).toLocaleString();

    if (platform === 'x') {
      return `🌿 Our clean energy digital twin achieved a ${data.overallScore}/100 Sustainability Score!

⚡ ${metrics.gridIndependencePct}% Grid Autonomy (${cleanKWh} kWh/yr clean energy)
💰 $${savings}/yr utility savings (${metrics.paybackYears} yr payback)
🌍 ${metrics.co2OffsetTons} MT CO2 offset/yr (~${trees} trees planted)

Audited with EcoTwin Studio #CleanEnergy #Decarbonization #LEED #ESG #Solar #ClimateTech`;
    }

    return `Excited to announce the sustainability and decarbonization milestone for our facility digital twin modeled in EcoTwin Studio! 🌿

📊 Sustainability Index: ${data.overallScore} / 100 (${data.certificationGrade || 'LEED Platinum / Net-Zero Ready'})
⚡ Grid Independence: ${metrics.gridIndependencePct}% self-supplied
🌱 Clean Energy Harvest: ${cleanKWh} kWh generated and conserved annually
💰 Projected Financial ROI: $${savings}/yr savings with a ${metrics.paybackYears}-year simple payback
🌍 Carbon Abatement: ${metrics.co2OffsetTons} Metric Tons CO2 offset/yr (equivalent to planting ${trees} mature trees)

Engineering Specs:
• Solar PV: ${simParams.solarCapacityKW} kW DC Array
• Battery BESS: ${simParams.batteryCapacityKWh} kWh LiFePO4
• Heat Pump Inverter: COP ${simParams.heatPumpCop.toFixed(1)}
• Shading: ${simParams.smartShadingActive ? 'Automated Kinetic' : 'Standard'}

Modeled and verified against ISO 50001 & ASHRAE 90.1 thermodynamic guidelines.

#Sustainability #Decarbonization #CleanEnergy #ESG #NetZero #ClimateTech #Renewables #GreenBuilding`;
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      downloadSocialCardImage(canvasRef.current, {
        system,
        simParams,
        data,
        metrics,
        format,
        theme,
      });
      setStatusNotice('High-res social image downloaded! Ready to attach to your post.');
      setTimeout(() => setStatusNotice(null), 4500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyPostText = async (platform: 'linkedin' | 'x') => {
    const text = generatePostCopy(platform);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setStatusNotice(`Copied formatted ${platform === 'linkedin' ? 'LinkedIn' : 'X'} caption to clipboard!`);
      setTimeout(() => {
        setCopiedText(false);
        setStatusNotice(null);
      }, 4000);
    } catch (err) {
      console.error('Clipboard write failed', err);
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await generateSocialCardBlob(canvasRef.current, {
        system,
        simParams,
        data,
        metrics,
        format,
        theme,
      });
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImage(true);
        setStatusNotice('High-res image copied to clipboard! You can paste (Ctrl+V) directly into LinkedIn or X.');
        setTimeout(() => {
          setCopiedImage(false);
          setStatusNotice(null);
        }, 4500);
      } else {
        handleDownload();
      }
    } catch (err) {
      console.warn('Copy image to clipboard not supported directly, falling back to download', err);
      handleDownload();
    }
  };

  const handleShareToX = () => {
    // 1. Download image so user has it immediately in tray to drag/attach
    handleDownload();
    // 2. Open X intent
    const text = generatePostCopy('x');
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareToLinkedIn = async () => {
    // 1. Copy formatted copy to clipboard
    await handleCopyPostText('linkedin');
    // 2. Download image
    handleDownload();
    // 3. Open LinkedIn share dialog
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col text-slate-100 my-auto max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-950/80 text-sky-400 border border-sky-800/60 shadow-inner">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Social Media Export Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/80 font-mono">
                  LinkedIn & X
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Generate high-resolution, branded summary cards showcasing efficiency, ROI, and carbon impact
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Controls Bar: Format & Theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            {/* Format selection */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Card Aspect Ratio & Destination
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('landscape')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    format === 'landscape'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40 border border-sky-400'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Landscape (1200×628)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('square')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    format === 'square'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40 border border-sky-400'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Square (1080×1080)</span>
                </button>
              </div>
            </div>

            {/* Theme selection */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Branded Visual Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('cyber_emerald')}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    theme === 'cyber_emerald'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-xs" />
                  <span>Cyber Emerald</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('executive_navy')}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    theme === 'executive_navy'
                      ? 'bg-sky-950/80 text-sky-300 border border-sky-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shadow-xs" />
                  <span>Executive Navy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('solar_amber')}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    theme === 'solar_amber'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-xs" />
                  <span>Solar Amber</span>
                </button>
              </div>
            </div>
          </div>

          {/* Status notification toast */}
          {statusNotice && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 text-xs shadow-lg animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Interactive Card Canvas Preview */}
          <div className="flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-slate-300">Live 2X Retina Rendering</span>
                <span className="text-[10px] text-slate-500">
                  ({format === 'square' ? '2160 × 2160 px' : '2400 × 1256 px'})
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Pillars: <span className="text-emerald-400">Efficiency</span> • <span className="text-cyan-400">ROI</span> • <span className="text-sky-400">Carbon Abatement</span>
              </div>
            </div>

            <div className="w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl p-2 sm:p-4 flex items-center justify-center">
              <div className="max-w-full max-h-[50vh] flex items-center justify-center overflow-hidden rounded-xl">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-h-[46vh] object-contain rounded-lg shadow-inner"
                  style={{
                    aspectRatio: format === 'square' ? '1 / 1' : '1200 / 628',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Fast Share Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Action 1: Share to LinkedIn */}
            <button
              onClick={handleShareToLinkedIn}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0a66c2] hover:bg-[#084e96] text-white font-semibold text-xs transition-all shadow-md hover:shadow-sky-900/40 cursor-pointer"
              title="Copies post summary, downloads image, and opens LinkedIn"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
              </svg>
              <span>Share to LinkedIn</span>
              <ExternalLink className="w-3 h-3 text-sky-200 ml-auto" />
            </button>

            {/* Action 2: Share to X */}
            <button
              onClick={handleShareToX}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-black hover:bg-slate-900 text-white font-semibold text-xs border border-slate-700 transition-all shadow-md cursor-pointer"
              title="Pre-fills tweet with scorecard metrics & opens X"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Share to X (Twitter)</span>
              <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
            </button>

            {/* Action 3: Copy Image to Clipboard */}
            <button
              onClick={handleCopyImage}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
              title="Copy 2x PNG directly to clipboard for pasting"
            >
              {copiedImage ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-cyan-400" />
              )}
              <span>{copiedImage ? 'Image Copied!' : 'Copy Image (PNG)'}</span>
            </button>

            {/* Action 4: Download PNG File */}
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md hover:shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download High-Res PNG</span>
            </button>
          </div>

          {/* Social Copy Preview & 1-Click Copy Snippet */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Pre-Formatted Post Caption</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyPostText('linkedin')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-sky-300 border border-slate-700 transition-colors"
                >
                  Copy for LinkedIn
                </button>
                <button
                  onClick={() => handleCopyPostText('x')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 border border-slate-700 transition-colors"
                >
                  Copy for X
                </button>
              </div>
            </div>

            <pre className="text-[11px] font-mono text-slate-400 bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
              {generatePostCopy('linkedin')}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready for LinkedIn, X / Twitter, Instagram & Investor Decks</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
