import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Compass,
  Layers,
  Sun,
  ShieldAlert,
  Brain,
  Sliders,
  Award,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  RotateCcw,
  Leaf,
  Zap,
  BarChart3,
  Camera,
  Globe,
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  spotlightPadding?: number;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'viewport',
    targetSelector: '#tour-3d-viewport',
    title: 'Interactive 3D Digital Twin Canvas',
    description:
      'Explore full-physics clean energy systems in real-time 3D. Orbit, zoom, and click any component—such as heat exchangers, variable compressors, or battery storage—to inspect live thermodynamic telemetry and Energy Star specs.',
    badge: '3D Physics Engine',
    icon: <Eye className="w-4 h-4 text-cyan-400" />,
    placement: 'center',
    spotlightPadding: 0,
  },
  {
    id: 'system_selector',
    targetSelector: '#tour-system-selector',
    title: 'Clean Energy System Selector',
    description:
      'Toggle seamlessly between 4 high-performance archetypes: Commercial Heat Pump & TES, Net-Zero Smart Building, Residential Microgrid & Battery, and Industrial Waste Heat ORC.',
    badge: 'Archetype Selection',
    icon: <Layers className="w-4 h-4 text-cyan-400" />,
    placement: 'top',
    spotlightPadding: 6,
  },
  {
    id: 'sim_controls',
    targetSelector: '#tour-sim-controls',
    title: 'Physics Sliders & Solar Time',
    description:
      'Scrub the Solar Time slider to simulate diurnal PV output and smart shading angles. Pull the Exploded View slider to dissect internal refrigeration circuits, inverters, and piping networks.',
    badge: 'Real-Time Simulation',
    icon: <Sun className="w-4 h-4 text-amber-400" />,
    placement: 'top',
    spotlightPadding: 6,
  },
  {
    id: 'visual_modes',
    targetSelector: '#tour-visual-modes',
    title: 'Visual Modes & Thermal FLIR',
    description:
      'Switch between Photorealistic PBR rendering, Thermal FLIR false-color heat loss inspection, and the live D3.js real-time Sankey power & thermal flow bus.',
    badge: 'Multi-Spectral Shaders',
    icon: <Sliders className="w-4 h-4 text-emerald-400" />,
    placement: 'top',
    spotlightPadding: 6,
  },
  {
    id: 'climate_alerts',
    targetSelector: '#tour-climate-alerts',
    title: 'Real-Time Climate Alert System',
    description:
      'Continuously stress-tests your installation against ASHRAE 99.6% extreme weather events (polar vortex, severe heatwave, blizzard). Warns if heating capacity or battery autonomy is insufficient, with 1-click auto-mitigation.',
    badge: 'Weather Resilience',
    icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
    placement: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'gemini_chat',
    targetSelector: '#tour-gemini-chat',
    title: 'Gemini AI Engineering Copilot',
    description:
      'Engage in multi-turn technical dialogues with your AI Copilot. Powered by Gemini 3.8 Flash, Gemini 3.1 Flash Lite (fast), and Gemini 4 Argon (deep thermodynamic math). It reads your live 3D twin telemetry and provides 1-click physics parameter adjustments.',
    badge: 'Multi-Turn AI Copilot',
    icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: 'blueprint_studio',
    targetSelector: '#tour-blueprint-studio',
    title: 'Blueprint & Floor Plan AI Studio',
    description:
      'Upload residential floor plans or site blueprints. Multimodal Gemini Vision analyzes spatial orientation, room square footage, electrical clearances, and conduit runs to place equipment efficiently.',
    badge: 'Multimodal AI Vision',
    icon: <Compass className="w-4 h-4 text-cyan-400" />,
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: 'intelligence_dock',
    targetSelector: '#tour-intelligence-dock',
    title: 'AI Engineering & Live Web Grounding',
    description:
      'Access Gemini High-Thinking models for complex thermodynamic sizing, Google Search grounding for real-time local utility tariffs and IRA tax credits, and instant appliance energy audits.',
    badge: 'GenAI Intelligence',
    icon: <Brain className="w-4 h-4 text-purple-400" />,
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: 'carbon_calculator',
    targetSelector: '#tour-carbon-calculator',
    title: 'Carbon Footprint & Gauge Calculator',
    description:
      'Compare your selected clean energy system directly against a traditional fossil grid model using an interactive radial arc gauge. Explore net CO₂ avoided, regional grid emissions factors, and EPA environmental equivalencies.',
    badge: 'CO₂ Decarbonization Gauge',
    icon: <Leaf className="w-4 h-4 text-emerald-400" />,
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: 'smart_devices',
    targetSelector: '#tour-smart-devices',
    title: 'Smart Device & EV Integration Simulator',
    description:
      'Model connected smart appliances (Level 2 EV chargers, smart thermostats, heat pump water heaters, variable pool pumps, and V2G bi-directional power). Test solar-match throttling, off-peak TOU shifting, and automated peak-shaving in real-time.',
    badge: 'Demand Flexibility',
    icon: <Zap className="w-4 h-4 text-cyan-400" />,
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: 'daily_report',
    targetSelector: '#tour-daily-report',
    title: 'Daily Energy Summary & Printable PDF Report',
    description:
      'Generate a comprehensive 24-hour diurnal performance audit. Inspect hour-by-hour solar harvest, HVAC and base building power, BESS charge cycles, TOU peak shaving, and download an executive vector PDF or open the printable view.',
    badge: 'Performance & PDF',
    icon: <BarChart3 className="w-4 h-4 text-cyan-400" />,
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: 'capture_scene',
    targetSelector: '#tour-capture-scene',
    title: 'Capture 3D Scene & Branded Snapshot',
    description:
      'Generate high-resolution 2K snapshots of your 3D digital twin design. Automatically composites live thermodynamic telemetry, solar yield, and carbon avoidance badges for sharing or presentations.',
    badge: '2K Graphic Export',
    icon: <Camera className="w-4 h-4 text-cyan-400" />,
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: 'global_heatmap',
    targetSelector: '#tour-global-heatmap',
    title: 'D3.js Global Renewable Energy Heatmap',
    description:
      'Explore an interactive world heatmap showing optimal geographic locations for heat pumps, microgrids, smart buildings, and industrial WHRS. Shaded by solar GHI, heating/cooling degree-days, and 1-click synced directly with your 3D digital twin.',
    badge: 'D3 Spatial Geospatial',
    icon: <Globe className="w-4 h-4 text-cyan-400" />,
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: 'grid_carbon',
    targetSelector: '#tour-grid-carbon',
    title: 'Real-World Local Grid Carbon Intensity',
    description:
      'Pull authoritative emissions data from your local electrical balancing authority (CAISO, PJM, ERCOT, National Grid, ENTSO-E) using GPS geolocation or regional search to ground all carbon savings and charging windows.',
    badge: 'Live Emissions Telemetry',
    icon: <Zap className="w-4 h-4 text-emerald-400" />,
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    id: 'sustainability_scorecard',
    targetSelector: '#tour-sustainability-scorecard',
    title: 'Sustainability Scorecard & 20-Yr ROI',
    description:
      'Export production-ready PDF ESG scorecards with verified carbon offsets, or track 20-year equipment degradation curves, maintenance milestones, and financial break-even periods.',
    badge: 'ESG & Financial Audit',
    icon: <Award className="w-4 h-4 text-emerald-400" />,
    placement: 'bottom',
    spotlightPadding: 6,
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: (completed?: boolean) => void;
  onNavigateAction?: (stepId: string) => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  isOpen,
  onClose,
  onNavigateAction,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = TOUR_STEPS[currentStepIndex];
  const totalSteps = TOUR_STEPS.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Measure target element position
  const updateTargetRect = useCallback(() => {
    if (!isOpen || !step) return;

    if (step.placement === 'center' || step.targetSelector === '#tour-3d-viewport') {
      // Centered fallback/viewport
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step]);

  // Recalculate on window resize, scroll, or step change
  useEffect(() => {
    if (!isOpen) return;

    setIsAnimating(true);
    updateTargetRect();

    const timer = setTimeout(() => {
      updateTargetRect();
      setIsAnimating(false);
    }, 120);

    const handleResizeOrScroll = () => {
      updateTargetRect();
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isOpen, currentStepIndex, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(false);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          onClose(true);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, totalSteps, onClose]);

  const handleNext = () => {
    if (isLastStep) {
      onClose(true);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleJumpToStep = (index: number) => {
    setCurrentStepIndex(index);
  };

  if (!isOpen) return null;

  // Calculate Tooltip Coordinates
  const getTooltipStyle = (): React.CSSProperties => {
    const cardWidth = 380;
    const padding = 16;
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    if (!targetRect || step.placement === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${Math.min(cardWidth, windowW - 32)}px`,
        zIndex: 60,
      };
    }

    const p = step.spotlightPadding ?? 6;
    const targetX = targetRect.left - p;
    const targetY = targetRect.top - p;
    const targetW = targetRect.width + p * 2;
    const targetH = targetRect.height + p * 2;

    let left = targetX + targetW / 2 - cardWidth / 2;
    // Clamp horizontal
    left = Math.max(padding, Math.min(windowW - cardWidth - padding, left));

    let top = 0;
    const placement = step.placement || 'bottom';

    if (placement === 'bottom') {
      top = targetY + targetH + 12;
      // If it overflows the bottom, place above
      if (top + 280 > windowH) {
        top = Math.max(padding, targetY - 290);
      }
    } else if (placement === 'top') {
      top = targetY - 270;
      // If overflows top, place below
      if (top < padding) {
        top = targetY + targetH + 12;
      }
    } else {
      top = targetY + targetH / 2 - 120;
    }

    // Keep within bounds
    top = Math.max(padding, Math.min(windowH - 300, top));

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${Math.min(cardWidth, windowW - 32)}px`,
      zIndex: 60,
    };
  };

  // Spotlight Box styling
  const p = step.spotlightPadding ?? 6;
  const spotlightBox = targetRect
    ? {
        x: Math.max(0, targetRect.left - p),
        y: Math.max(0, targetRect.top - p),
        width: targetRect.width + p * 2,
        height: targetRect.height + p * 2,
      }
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Guided Tour"
      className="fixed inset-0 z-50 pointer-events-auto select-none overflow-hidden animate-in fade-in duration-200"
    >
      {/* SVG Backdrop with Cut-out Mask */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto cursor-pointer"
        onClick={() => onClose(false)}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers entire viewport */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight area */}
            {spotlightBox && (
              <rect
                x={spotlightBox.x}
                y={spotlightBox.y}
                width={spotlightBox.width}
                height={spotlightBox.height}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.78)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Target Highlight Ring & Pulse Glow */}
      {spotlightBox && (
        <div
          style={{
            position: 'absolute',
            left: `${spotlightBox.x}px`,
            top: `${spotlightBox.y}px`,
            width: `${spotlightBox.width}px`,
            height: `${spotlightBox.height}px`,
          }}
          className="pointer-events-none rounded-2xl border-2 border-cyan-400 ring-4 ring-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all duration-300"
        >
          <div className="absolute -inset-1 rounded-2xl border border-cyan-300/40 animate-ping opacity-30" />
        </div>
      )}

      {/* Localized Floating Tooltip Card */}
      <div
        style={getTooltipStyle()}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-slate-200 backdrop-blur-xl transition-all duration-200 animate-in fade-in zoom-in-95"
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/90 border border-cyan-800 flex items-center justify-center shrink-0">
              {step.icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
              {step.badge}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              {currentStepIndex + 1} of {totalSteps}
            </span>
            <button
              onClick={() => onClose(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Tour (Esc)"
              aria-label="Close Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Title */}
        <h3 className="text-base font-bold text-white mb-2 tracking-tight">
          {step.title}
        </h3>

        {/* Step Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Step Dot Progress Indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => handleJumpToStep(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'w-6 bg-cyan-400'
                  : idx < currentStepIndex
                  ? 'w-2 bg-emerald-400/80'
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Jump to step ${idx + 1}: ${s.title}`}
              aria-label={`Jump to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div>
            {!isFirstStep ? (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={() => onClose(true)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 transition-colors"
              >
                Skip Tour
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLastStep ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onClose(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Finish Tour</span>
              </button>
            )}
          </div>
        </div>

        {/* Keyboard Short-cuts Footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800/60">
          <span>Navigate with ← / →</span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
