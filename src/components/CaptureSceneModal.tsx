import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Layers,
  Sparkles,
  Share2,
  Eye,
  Sun,
  Battery,
  Flame,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import { EnergySystemMeta, SimulationParams } from '../types/energy';
import { SceneManager } from '../three/SceneManager';
import {
  compositeSceneSnapshot,
  SnapshotAspectRatio,
  SnapshotTheme,
} from '../utils/sceneSnapshotCompositor';

interface CaptureSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: EnergySystemMeta;
  simParams: SimulationParams;
  sceneManagerRef: React.MutableRefObject<SceneManager | null>;
}

export const CaptureSceneModal: React.FC<CaptureSceneModalProps> = ({
  isOpen,
  onClose,
  system,
  simParams,
  sceneManagerRef,
}) => {
  const [aspectRatio, setAspectRatio] = useState<SnapshotAspectRatio>('16:9');
  const [theme, setTheme] = useState<SnapshotTheme>('cyber_cyan');
  const [showKpiOverlay, setShowKpiOverlay] = useState(true);
  const [showTechnicalSpecs, setShowTechnicalSpecs] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(true);

  const [rawSnapshot, setRawSnapshot] = useState<string | null>(null);
  const [compositedImage, setCompositedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Capture fresh 3D raw render from SceneManager
  const captureRawRender = useCallback(() => {
    if (!sceneManagerRef.current) return;
    try {
      setIsProcessing(true);
      const dataUrl = sceneManagerRef.current.captureSnapshot({
        width: aspectRatio === '1:1' ? 1440 : aspectRatio === '9:16' ? 1080 : 1920,
        height: aspectRatio === '1:1' ? 1440 : aspectRatio === '9:16' ? 1920 : 1080,
      });
      setRawSnapshot(dataUrl);
    } catch (err) {
      console.error('Failed to capture WebGL 3D scene:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [aspectRatio, sceneManagerRef]);

  // Whenever modal opens or aspect ratio changes, capture raw 3D scene
  useEffect(() => {
    if (isOpen) {
      captureRawRender();
    }
  }, [isOpen, captureRawRender]);

  // Whenever raw snapshot or options change, run overlay compositor
  useEffect(() => {
    if (!rawSnapshot) return;

    let isMounted = true;
    setIsProcessing(true);

    compositeSceneSnapshot(rawSnapshot, system, simParams, {
      aspectRatio,
      theme,
      showKpiOverlay,
      showTechnicalSpecs,
      showTimestamp,
    })
      .then((res) => {
        if (isMounted) {
          setCompositedImage(res.dataUrl);
          setIsProcessing(false);
        }
      })
      .catch((err) => {
        console.error('Snapshot composition error:', err);
        if (isMounted) setIsProcessing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rawSnapshot, system, simParams, aspectRatio, theme, showKpiOverlay, showTechnicalSpecs, showTimestamp]);

  // Download high-resolution PNG
  const handleDownload = () => {
    if (!compositedImage) return;
    const link = document.createElement('a');
    link.href = compositedImage;
    link.download = `EcoTwin_${system.id}_3D_Snapshot_${Date.now().toString().slice(-6)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy to clipboard
  const handleCopyClipboard = async () => {
    if (!compositedImage) return;
    try {
      const res = await fetch(compositedImage);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Direct clipboard image write failed, falling back:', err);
      // Fallback: copy data URL
      try {
        await navigator.clipboard.writeText(compositedImage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (e) {
        console.error('Clipboard copy failed:', e);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Capture 3D Scene Snapshot</h2>
                <span className="text-xs text-cyan-400 font-mono font-medium px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/60">
                  High-Res 2K Export
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Branded 3D digital twin render with live thermodynamic HUD metrics & energy specs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={captureRawRender}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Re-render 3D scene from current camera orientation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Retake Frame</span>
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

        {/* Customization Options Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Format:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  aspectRatio === '16:9'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                16:9 Landscape
              </button>
              <button
                onClick={() => setAspectRatio('1:1')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  aspectRatio === '1:1'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1:1 Square
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  aspectRatio === '9:16'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                9:16 Story
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Palette:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setTheme('cyber_cyan')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  theme === 'cyber_cyan'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cyber Cyan
              </button>
              <button
                onClick={() => setTheme('emerald_clean')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  theme === 'emerald_clean'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Clean Emerald
              </button>
              <button
                onClick={() => setTheme('sunset_amber')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  theme === 'sunset_amber'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sunset Gold
              </button>
              <button
                onClick={() => setTheme('minimalist')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  theme === 'minimalist'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Minimalist
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showKpiOverlay}
                onChange={(e) => setShowKpiOverlay(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span>KPI HUD</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showTechnicalSpecs}
                onChange={(e) => setShowTechnicalSpecs(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span>Technical Specs</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showTimestamp}
                onChange={(e) => setShowTimestamp(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span>Timestamp</span>
            </label>
          </div>

        </div>

        {/* Image Preview Canvas Area */}
        <div className="flex-1 p-6 flex items-center justify-center bg-slate-950/80 overflow-auto min-h-[360px] max-h-[58vh]">
          {isProcessing && !compositedImage ? (
            <div className="flex flex-col items-center gap-3 text-slate-400 py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
              <span className="text-xs font-medium">Compositing 3D scene & overlays...</span>
            </div>
          ) : compositedImage ? (
            <div className="relative max-h-full max-w-full flex items-center justify-center group shadow-2xl rounded-2xl overflow-hidden border border-slate-800/80">
              <img
                src={compositedImage}
                alt="3D Scene Snapshot Preview"
                className="max-h-[52vh] max-w-full object-contain rounded-2xl"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 text-xs">No preview available</div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="text-slate-300 font-semibold">{system.name}</span>
            <span>·</span>
            <span>Climate: {simParams.climateRegion.toUpperCase()}</span>
            <span>·</span>
            <span>{aspectRatio === '16:9' ? '1920 × 1080' : aspectRatio === '1:1' ? '1440 × 1440' : '1080 × 1920'} px</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyClipboard}
              disabled={!compositedImage}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copied Image!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={!compositedImage}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Branded PNG</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
