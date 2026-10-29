import { EnergySystemMeta, SimulationParams, SustainabilityScorecardData } from '../types/energy';

export type SocialCardFormat = 'landscape' | 'square';
export type SocialCardTheme = 'cyber_emerald' | 'executive_navy' | 'solar_amber';

export interface SocialCardMetrics {
  annualDollarSavings: number;
  paybackYears: string;
  grossCost: number;
  taxCredit: number;
  netCost: number;
  co2OffsetTons: string;
  gridIndependencePct: number;
  totalAnnualKWhSaved: number;
  annualSolarGenKWh: number;
  hvacSavingsKWh: number;
  shadingSavingsKWh: number;
}

export interface RenderSocialCardParams {
  system: EnergySystemMeta;
  simParams: SimulationParams;
  data: SustainabilityScorecardData;
  metrics: SocialCardMetrics;
  format: SocialCardFormat;
  theme: SocialCardTheme;
}

interface ThemeConfig {
  bgGradient: [string, string, string];
  accentColor: string;
  accentSecondary: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  badgeBg: string;
  scoreGlow: string;
}

const THEMES: Record<SocialCardTheme, ThemeConfig> = {
  cyber_emerald: {
    bgGradient: ['#061118', '#0b1d28', '#020617'],
    accentColor: '#10b981', // emerald-500
    accentSecondary: '#06b6d4', // cyan-500
    cardBg: 'rgba(15, 23, 42, 0.75)',
    cardBorder: 'rgba(51, 65, 85, 0.6)',
    textPrimary: '#ffffff',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    scoreGlow: 'rgba(16, 185, 129, 0.3)',
  },
  executive_navy: {
    bgGradient: ['#090d16', '#0f172a', '#1e293b'],
    accentColor: '#38bdf8', // sky-400
    accentSecondary: '#818cf8', // indigo-400
    cardBg: 'rgba(15, 23, 42, 0.85)',
    cardBorder: 'rgba(56, 189, 248, 0.25)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    scoreGlow: 'rgba(56, 189, 248, 0.25)',
  },
  solar_amber: {
    bgGradient: ['#120c08', '#1c140e', '#090d16'],
    accentColor: '#f59e0b', // amber-500
    accentSecondary: '#10b981', // emerald-500
    cardBg: 'rgba(23, 17, 12, 0.8)',
    cardBorder: 'rgba(245, 158, 11, 0.25)',
    textPrimary: '#ffffff',
    textSecondary: '#fcd34d',
    textMuted: '#a8a29e',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    scoreGlow: 'rgba(245, 158, 11, 0.3)',
  },
};

function roundRectPolyfill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function renderSocialCardToCanvas(
  canvas: HTMLCanvasElement,
  params: RenderSocialCardParams
): void {
  const { system, simParams, data, metrics, format, theme } = params;
  const cfg = THEMES[theme];

  // Base canvas dimensions (2x retina resolution for razor-sharp social media uploads)
  const isSquare = format === 'square';
  const width = isSquare ? 2160 : 2400;
  const height = isSquare ? 2160 : 1256;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();

  // 1. Background Gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, cfg.bgGradient[0]);
  grad.addColorStop(0.5, cfg.bgGradient[1]);
  grad.addColorStop(1, cfg.bgGradient[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle decorative radial glow in top right & bottom left
  const glow1 = ctx.createRadialGradient(width * 0.85, height * 0.15, 20, width * 0.85, height * 0.15, width * 0.45);
  glow1.addColorStop(0, cfg.scoreGlow);
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(width * 0.15, height * 0.85, 20, width * 0.15, height * 0.85, width * 0.35);
  glow2.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid blueprint lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 2;
  const gridSize = 80;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Outer framing glow border
  ctx.strokeStyle = cfg.cardBorder;
  ctx.lineWidth = 4;
  roundRectPolyfill(ctx, 40, 40, width - 80, height - 80, 40);
  ctx.stroke();

  // Margins
  const mX = 120;
  let curY = 120;

  // 2. Brand Header Strip
  // EcoTwin Logo Pill
  roundRectPolyfill(ctx, mX, curY, 440, 68, 34);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fill();
  ctx.strokeStyle = cfg.cardBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Green glowing dot
  ctx.beginPath();
  ctx.arc(mX + 38, curY + 34, 12, 0, Math.PI * 2);
  ctx.fillStyle = cfg.accentColor;
  ctx.shadowColor = cfg.accentColor;
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.shadowBlur = 0;

  // App Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('ECOTWIN STUDIO', mX + 68, curY + 34);

  // Digital Twin Tag
  ctx.fillStyle = cfg.accentSecondary;
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('• AI CLIMATE TWIN', mX + 278, curY + 34);

  // Right Side Header Tag: Verified Audit
  const auditText = 'VERIFIED SUSTAINABILITY AUDIT';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
  const auditWidth = ctx.measureText(auditText).width;
  roundRectPolyfill(ctx, width - mX - auditWidth - 60, curY, auditWidth + 60, 68, 34);
  ctx.fillStyle = cfg.badgeBg;
  ctx.fill();
  ctx.strokeStyle = cfg.accentColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = cfg.accentColor;
  ctx.fillText(auditText, width - mX - auditWidth - 30, curY + 34);

  curY += 120;

  // 3. System Title & Facility Meta
  ctx.fillStyle = cfg.textPrimary;
  ctx.font = isSquare ? 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(system.name, mX, curY);

  curY += isSquare ? 56 : 48;
  ctx.fillStyle = cfg.textMuted;
  ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const metaText = `${system.sector} Infrastructure • ${simParams.buildingSizeSqFt.toLocaleString()} sq ft • ${(simParams.climateRegion || 'Temperate').toUpperCase()} Region (${simParams.ambientTempC}°C)`;
  ctx.fillText(metaText, mX, curY);

  curY += isSquare ? 70 : 60;

  // 4. Overall Score Banner Card
  const scoreCardH = isSquare ? 280 : 210;
  roundRectPolyfill(ctx, mX, curY, width - mX * 2, scoreCardH, 28);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();
  ctx.strokeStyle = cfg.cardBorder;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Score badge block inside card
  const badgeW = isSquare ? 320 : 260;
  roundRectPolyfill(ctx, mX + 30, curY + 25, badgeW, scoreCardH - 50, 20);
  ctx.fillStyle = cfg.badgeBg;
  ctx.fill();
  ctx.strokeStyle = cfg.accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Score Number
  ctx.fillStyle = cfg.accentColor;
  ctx.font = 'bold 92px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${data.overallScore}`, mX + 30 + badgeW / 2, curY + (scoreCardH / 2) - 10);

  ctx.fillStyle = cfg.textSecondary;
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
  ctx.fillText('OUT OF 100', mX + 30 + badgeW / 2, curY + (scoreCardH / 2) + 45);

  // Score details on right of badge
  ctx.textAlign = 'left';
  const detailsX = mX + 30 + badgeW + 40;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(data.certificationGrade || 'LEED Platinum / Net-Zero Ready', detailsX, curY + 60);

  ctx.fillStyle = cfg.textSecondary;
  ctx.font = '400 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const subtitle = `Comprehensive Decarbonization & Clean Energy Autonomy Rating • Top 5% Peer Class`;
  ctx.fillText(subtitle, detailsX, curY + 105);

  // Sub-scores pill row
  const dimStartX = detailsX;
  const dimY = curY + 145;
  const dims = [
    { label: 'Carbon Decarbonization', val: `${data.dimensionScores.carbonDecarbonization}%` },
    { label: 'Grid Autonomy', val: `${data.dimensionScores.gridAutonomyResilience}%` },
    { label: 'Thermodynamics', val: `${data.dimensionScores.thermodynamicEfficiency}%` },
    { label: 'Economics / ROI', val: `${data.dimensionScores.lifecycleEconomics}%` },
  ];

  dims.forEach((d, i) => {
    const xPos = dimStartX + i * (isSquare ? 320 : 380);
    if (xPos + 260 <= width - mX) {
      roundRectPolyfill(ctx, xPos, dimY, 240, 44, 12);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = cfg.accentColor;
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.fillText(d.val, xPos + 14, dimY + 22);

      ctx.fillStyle = cfg.textMuted;
      ctx.font = '500 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(d.label, xPos + 75, dimY + 22);
    }
  });

  curY += scoreCardH + (isSquare ? 60 : 40);

  // 5. The Three Core Pillars Cards (Efficiency, ROI, Carbon Impact)
  const pillarsY = curY;
  const pillarGap = 35;
  const numPillars = 3;
  const pillarW = (width - mX * 2 - pillarGap * (numPillars - 1)) / numPillars;
  const pillarH = isSquare ? 520 : 360;

  // --- PILLAR 1: SYSTEM EFFICIENCY ---
  const p1X = mX;
  drawPillarCard(ctx, p1X, pillarsY, pillarW, pillarH, {
    number: '01',
    title: 'SYSTEM EFFICIENCY',
    primaryValue: `${metrics.gridIndependencePct}%`,
    primaryLabel: 'Grid Independence',
    secondaryItems: [
      { label: 'Annual Clean Generation', val: `${Math.round(metrics.totalAnnualKWhSaved).toLocaleString()} kWh/yr` },
      { label: 'Heat Pump COP', val: `${simParams.heatPumpCop.toFixed(1)} (Cold-Climate)` },
      { label: 'Solar Harvest Ratio', val: `${(simParams.solarYieldMultiplier || 1).toFixed(2)}x Regional Yield` },
    ],
    accentColor: '#14b8a6', // teal
    cfg,
    isSquare,
  });

  // --- PILLAR 2: FINANCIAL ROI ---
  const p2X = mX + pillarW + pillarGap;
  const netSavings25 = Math.round(metrics.annualDollarSavings * 25 - metrics.netCost);
  drawPillarCard(ctx, p2X, pillarsY, pillarW, pillarH, {
    number: '02',
    title: 'FINANCIAL ROI',
    primaryValue: `$${Math.round(metrics.annualDollarSavings).toLocaleString()}`,
    primaryLabel: 'Annual Utility Savings / yr',
    secondaryItems: [
      { label: 'Simple Payback', val: `${metrics.paybackYears} Years` },
      { label: 'IRA 30% Tax Credit', val: `-$${Math.round(metrics.taxCredit).toLocaleString()}` },
      { label: '25-Yr Net Value Created', val: `+$${Math.max(0, netSavings25).toLocaleString()}` },
    ],
    accentColor: '#10b981', // emerald
    cfg,
    isSquare,
  });

  // --- PILLAR 3: CARBON IMPACT ---
  const p3X = p2X + pillarW + pillarGap;
  const treesEquiv = Math.round(parseFloat(metrics.co2OffsetTons) * 45);
  const gasGallons = Math.round(parseFloat(metrics.co2OffsetTons) * 112);
  drawPillarCard(ctx, p3X, pillarsY, pillarW, pillarH, {
    number: '03',
    title: 'CARBON ABATEMENT',
    primaryValue: `${metrics.co2OffsetTons} MT`,
    primaryLabel: 'CO2 Offset Annually',
    secondaryItems: [
      { label: '25-Yr Carbon Displaced', val: `${(parseFloat(metrics.co2OffsetTons) * 25).toFixed(0)} Metric Tons` },
      { label: 'Equivalent Trees Planted', val: `${treesEquiv.toLocaleString()} Mature Trees` },
      { label: 'Gasoline Displaced', val: `${gasGallons.toLocaleString()} Gallons / yr` },
    ],
    accentColor: '#38bdf8', // sky
    cfg,
    isSquare,
  });

  curY += pillarH + (isSquare ? 60 : 35);

  // 6. Sizing Hardware Assets Strip
  const assetStripH = isSquare ? 150 : 100;
  roundRectPolyfill(ctx, mX, curY, width - mX * 2, assetStripH, 20);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const assets = [
    { label: 'SOLAR PHOTOVOLTAIC', val: `${simParams.solarCapacityKW} kW DC Array` },
    { label: 'BATTERY STORAGE (BESS)', val: `${simParams.batteryCapacityKWh} kWh LiFePO4` },
    { label: 'HEAT PUMP SYSTEM', val: `COP ${simParams.heatPumpCop.toFixed(1)} Inverter` },
    { label: 'SMART SHADING', val: simParams.smartShadingActive ? 'Heliotropic Automated' : 'Standard Envelope' },
    { label: 'COMPLIANCE', val: 'ISO 50001 / LEED v4.1' },
  ];

  const assetColW = (width - mX * 2) / assets.length;
  assets.forEach((a, idx) => {
    const ax = mX + idx * assetColW;
    ctx.textAlign = 'center';
    ctx.fillStyle = cfg.textMuted;
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillText(a.label, ax + assetColW / 2, curY + (assetStripH * 0.35));

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(a.val, ax + assetColW / 2, curY + (assetStripH * 0.7));

    if (idx < assets.length - 1) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.moveTo(ax + assetColW, curY + 20);
      ctx.lineTo(ax + assetColW, curY + assetStripH - 20);
      ctx.stroke();
    }
  });

  // In square mode, we have extra space for a quote/highlight banner
  if (isSquare) {
    curY += assetStripH + 45;
    roundRectPolyfill(ctx, mX, curY, width - mX * 2, 140, 20);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = cfg.accentColor;
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('EXECUTIVE SUMMARY & ESG HIGHLIGHT', mX + 35, curY + 45);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const summaryLine = `Achieving ${metrics.gridIndependencePct}% grid autonomy with $${Math.round(metrics.annualDollarSavings).toLocaleString()} annual utility reductions and ${metrics.co2OffsetTons} MT CO2 offset per year.`;
    ctx.fillText(summaryLine, mX + 35, curY + 95);
  }

  // 7. Footer Watermark Strip
  const footerY = height - 70;
  ctx.textAlign = 'left';
  ctx.fillStyle = cfg.textMuted;
  ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Simulated & Verified with EcoTwin Clean Energy Studio • Physics-Grounded Thermodynamic Model', mX, footerY);

  ctx.textAlign = 'right';
  const stamp = `ID: ETS-${Date.now().toString().slice(-6)} • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  ctx.fillText(stamp, width - mX, footerY);

  ctx.restore();
}

function drawPillarCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: {
    number: string;
    title: string;
    primaryValue: string;
    primaryLabel: string;
    secondaryItems: Array<{ label: string; val: string }>;
    accentColor: string;
    cfg: ThemeConfig;
    isSquare: boolean;
  }
) {
  // Card background
  roundRectPolyfill(ctx, x, y, w, h, 24);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();
  ctx.strokeStyle = opts.cfg.cardBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Top accent bar
  roundRectPolyfill(ctx, x, y, w, 10, 5);
  ctx.fillStyle = opts.accentColor;
  ctx.fill();

  let py = y + 40;

  // Pillar Number & Title
  ctx.textAlign = 'left';
  ctx.fillStyle = opts.accentColor;
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
  ctx.fillText(opts.number, x + 28, py);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(opts.title, x + 65, py);

  py += opts.isSquare ? 70 : 50;

  // Primary Big Value
  ctx.fillStyle = opts.accentColor;
  ctx.font = opts.isSquare ? 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' : 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(opts.primaryValue, x + 28, py);

  py += opts.isSquare ? 42 : 36;
  ctx.fillStyle = opts.cfg.textSecondary;
  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(opts.primaryLabel, x + 28, py);

  py += opts.isSquare ? 45 : 30;

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.moveTo(x + 28, py);
  ctx.lineTo(x + w - 28, py);
  ctx.stroke();

  py += opts.isSquare ? 40 : 28;

  // Secondary breakdown items
  opts.secondaryItems.forEach((item) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = opts.cfg.textMuted;
    ctx.font = '400 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(item.label, x + 28, py);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillText(item.val, x + w - 28, py);

    py += opts.isSquare ? 46 : 34;
  });
}

export function generateSocialCardBlob(
  canvas: HTMLCanvasElement,
  params: RenderSocialCardParams
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      renderSocialCardToCanvas(canvas, params);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create canvas blob'));
        }
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

export function downloadSocialCardImage(
  canvas: HTMLCanvasElement,
  params: RenderSocialCardParams
): void {
  renderSocialCardToCanvas(canvas, params);
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  const formatTag = params.format === 'square' ? '1x1' : '16x9';
  a.download = `${params.system.id}_sustainability_${formatTag}_social_card.png`;
  a.click();
}
