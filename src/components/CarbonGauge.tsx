import React from 'react';
import { Leaf, ArrowDownRight, TrendingDown } from 'lucide-react';
import { CarbonFootprintMetrics } from '../data/carbonCalculatorData';

interface CarbonGaugeProps {
  metrics: CarbonFootprintMetrics;
  size?: number;
  className?: string;
}

export const CarbonGauge: React.FC<CarbonGaugeProps> = ({
  metrics,
  size = 320,
  className = '',
}) => {
  const { reductionPercentage, annualCO2SavedMT, baselineTotalMT, cleanSystemTotalMT, decarbonizationGrade } = metrics;

  // Semicircular arc geometry
  // Angle range: 140 degrees (start) to 400 degrees (end) -> total sweep = 260 degrees
  const sweepAngle = 260;
  const startAngle = 140; // in degrees
  const strokeWidth = 22;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;

  // Arc length for circumference calculation
  const totalArcLength = (sweepAngle / 360) * (2 * Math.PI * radius);
  const clampedPercent = Math.min(100, Math.max(0, reductionPercentage));
  const progressLength = (clampedPercent / 100) * totalArcLength;
  const strokeDashoffset = totalArcLength - progressLength;

  // Needle angle in degrees
  const needleAngle = startAngle + (clampedPercent / 100) * sweepAngle;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 16;
  const needleX = center + needleLength * Math.cos(needleRad);
  const needleY = center + needleLength * Math.sin(needleRad);

  // Helper for polar to cartesian arc path
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAng: number, endAng: number) => {
    const start = polarToCartesian(x, y, r, endAng);
    const end = polarToCartesian(x, y, r, startAng);
    const largeArcFlag = endAng - startAng <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const arcPath = describeArc(center, center, radius, startAngle, startAngle + sweepAngle);

  // Tick marks
  const tickSteps = [0, 25, 50, 75, 100];

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* SVG Arc Gauge */}
      <div className="relative" style={{ width: size, height: size * 0.78 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          <defs>
            {/* Color Gradient Track */}
            <linearGradient id="carbon-gauge-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f59e0b" />
              <stop offset="55%" stopColor="#06b6d4" />
              <stop offset="90%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            {/* Glowing Drop Shadow filter for needle & arc */}
            <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Dark Track */}
          <path
            d={arcPath}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Inner Accent Track Rim */}
          <path
            d={describeArc(center, center, radius - strokeWidth / 2 - 4, startAngle, startAngle + sweepAngle)}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="2,6"
            opacity="0.6"
          />

          {/* Colored Progress Arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#carbon-gauge-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${totalArcLength} ${totalArcLength}`}
            strokeDashoffset={strokeDashoffset}
            filter="url(#gauge-glow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Tick Marks & Labels */}
          {tickSteps.map((tick) => {
            const angle = startAngle + (tick / 100) * sweepAngle;
            const outerPoint = polarToCartesian(center, center, radius + strokeWidth / 2 + 5, angle);
            const innerPoint = polarToCartesian(center, center, radius - strokeWidth / 2 - 5, angle);
            const labelPoint = polarToCartesian(center, center, radius + strokeWidth / 2 + 18, angle);

            return (
              <g key={tick}>
                <line
                  x1={innerPoint.x}
                  y1={innerPoint.y}
                  x2={outerPoint.x}
                  y2={outerPoint.y}
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Gauge Center Needle Indicator */}
          <g className="transition-all duration-700 ease-out">
            {/* Needle Line */}
            <line
              x1={center}
              y1={center}
              x2={needleX}
              y2={needleY}
              stroke="#f8fafc"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
            />
            {/* Needle Accent Line in theme color */}
            <line
              x1={center}
              y1={center}
              x2={center + (needleLength * 0.7) * Math.cos(needleRad)}
              y2={center + (needleLength * 0.7) * Math.sin(needleRad)}
              stroke="#22d3ee"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Center Pivot Hub */}
            <circle cx={center} cy={center} r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
            <circle cx={center} cy={center} r="6" fill="#38bdf8" />
          </g>
        </svg>

        {/* Center Readout Overlay (Positioned in bottom-center cavity of semicircular arc) */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex flex-col items-center text-center pointer-events-none">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono drop-shadow-md">
              {reductionPercentage.toFixed(0)}%
            </span>
            <span className="text-sm font-bold text-emerald-400">CUT</span>
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
            CO₂ Emissions Saved
          </span>

          <div className="flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/40 shadow-inner">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-mono font-bold text-emerald-300">
              -{annualCO2SavedMT} MT / year
            </span>
          </div>
        </div>
      </div>

      {/* Grade Pill */}
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm ${
            reductionPercentage >= 85
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
              : reductionPercentage >= 70
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
              : reductionPercentage >= 45
              ? 'bg-sky-950/80 text-sky-300 border-sky-500/60'
              : 'bg-amber-950/80 text-amber-300 border-amber-500/60'
          }`}
        >
          {decarbonizationGrade}
        </span>
      </div>

      {/* Comparative Carbon Stack Bar */}
      <div className="w-full max-w-sm mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex justify-between items-center mb-1 text-slate-300 font-medium">
          <span className="text-slate-400">Traditional Grid Model:</span>
          <span className="font-mono text-red-400 font-bold">{baselineTotalMT} MT CO₂/yr</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
          <div className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full w-full" />
        </div>

        <div className="flex justify-between items-center mb-1 text-slate-300 font-medium">
          <span className="text-slate-400">EcoTwin Clean System:</span>
          <span className="font-mono text-emerald-400 font-bold">{cleanSystemTotalMT} MT CO₂/yr</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(4, Math.min(100, (cleanSystemTotalMT / Math.max(0.1, baselineTotalMT)) * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
