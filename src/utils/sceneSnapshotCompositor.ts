import { EnergySystemMeta, SimulationParams } from '../types/energy';

export type SnapshotAspectRatio = '16:9' | '1:1' | '9:16';
export type SnapshotTheme = 'cyber_cyan' | 'emerald_clean' | 'sunset_amber' | 'minimalist';

export interface SceneCompositorOptions {
  aspectRatio: SnapshotAspectRatio;
  theme: SnapshotTheme;
  showKpiOverlay: boolean;
  showTechnicalSpecs: boolean;
  showTimestamp: boolean;
  customTitle?: string;
  watermarkText?: string;
}

export interface CompositedSceneResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Composites a raw 3D WebGL render with high-definition branded graphics,
 * physics-coupled KPI overlays, and clean typographic metadata.
 */
export async function compositeSceneSnapshot(
  raw3dDataUrl: string,
  system: EnergySystemMeta,
  simParams: SimulationParams,
  options: SceneCompositorOptions
): Promise<CompositedSceneResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // Target canvas resolution
        let width = 1920;
        let height = 1080;

        if (options.aspectRatio === '1:1') {
          width = 1440;
          height = 1440;
        } else if (options.aspectRatio === '9:16') {
          width = 1080;
          height = 1920;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context not supported');
        }

        // Enable high quality image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. Draw base 3D background render (fitted with cover aspect)
        const imgAspect = img.width / img.height;
        const targetAspect = width / height;
        let renderW = width;
        let renderH = height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > targetAspect) {
          renderW = height * imgAspect;
          offsetX = (width - renderW) / 2;
        } else {
          renderH = width / imgAspect;
          offsetY = (height - renderH) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

        // 2. Soft cinematic ambient vignettes (gradient overlays for contrast)
        const topGrad = ctx.createLinearGradient(0, 0, 0, Math.min(280, height * 0.28));
        topGrad.addColorStop(0, 'rgba(5, 10, 20, 0.92)');
        topGrad.addColorStop(0.65, 'rgba(5, 10, 20, 0.60)');
        topGrad.addColorStop(1, 'rgba(5, 10, 20, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, height * 0.35);

        const bottomGrad = ctx.createLinearGradient(0, height - Math.min(360, height * 0.38), 0, height);
        bottomGrad.addColorStop(0, 'rgba(5, 10, 20, 0)');
        bottomGrad.addColorStop(0.4, 'rgba(5, 10, 20, 0.75)');
        bottomGrad.addColorStop(1, 'rgba(5, 10, 20, 0.96)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, height - Math.min(360, height * 0.38), width, Math.min(360, height * 0.38));

        // Color theme palettes
        let primaryColor = '#06b6d4'; // Cyan
        let secondaryColor = '#10b981'; // Emerald
        let accentGradStart = 'rgba(6, 182, 212, 0.25)';

        if (options.theme === 'emerald_clean') {
          primaryColor = '#10b981';
          secondaryColor = '#06b6d4';
          accentGradStart = 'rgba(16, 185, 129, 0.25)';
        } else if (options.theme === 'sunset_amber') {
          primaryColor = '#f59e0b';
          secondaryColor = '#f43f5e';
          accentGradStart = 'rgba(245, 158, 11, 0.25)';
        } else if (options.theme === 'minimalist') {
          primaryColor = '#ffffff';
          secondaryColor = '#94a3b8';
          accentGradStart = 'rgba(255, 255, 255, 0.15)';
        }

        // 3. Top Header Branding Bar
        const topPadding = width * 0.035;

        // Top Accent Stripe
        const stripeGrad = ctx.createLinearGradient(topPadding, 0, width - topPadding, 0);
        stripeGrad.addColorStop(0, primaryColor);
        stripeGrad.addColorStop(0.5, secondaryColor);
        stripeGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = stripeGrad;
        ctx.fillRect(topPadding, topPadding * 0.5, Math.min(600, width * 0.5), 4);

        // EcoTwin Studio Brand Title
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'top';
        ctx.fillText('ECOTWIN STUDIO', topPadding, topPadding * 0.7);

        // Subtitle / Archetype
        ctx.font = 'normal 15px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = primaryColor;
        const subTitle = options.customTitle || `${system.name.toUpperCase()} · ${system.sector.toUpperCase()} 3D TWIN`;
        ctx.fillText(subTitle, topPadding, topPadding * 0.7 + 28);

        // Right-aligned Metadata (Climate & Diurnal Time)
        if (options.showTechnicalSpecs) {
          const hour = simParams.sunAngleHour;
          const h = Math.floor(hour);
          const m = Math.floor((hour - h) * 60);
          const period = h >= 12 ? 'PM' : 'AM';
          const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
          const timeStr = `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
          const isPeak = hour >= 16 && hour <= 21;

          ctx.textAlign = 'right';
          ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`Climate: ${simParams.climateRegion.toUpperCase()}`, width - topPadding, topPadding * 0.7);

          ctx.font = 'normal 13px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#94a3b8';
          const climateDetail = `Temp: ${simParams.ambientTempC > 0 ? `+${simParams.ambientTempC}` : simParams.ambientTempC}°C · Solar Hour: ${timeStr} ${isPeak ? '(Peak TOU)' : ''}`;
          ctx.fillText(climateDetail, width - topPadding, topPadding * 0.7 + 22);

          ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = secondaryColor;
          ctx.fillText(`Facility: ${simParams.buildingSizeSqFt.toLocaleString()} sq ft · COP ${simParams.heatPumpCop.toFixed(1)}`, width - topPadding, topPadding * 0.7 + 42);

          ctx.textAlign = 'left';
        }

        // 4. Floating KPI HUD Overlays (at the bottom)
        if (options.showKpiOverlay) {
          const cardCount = options.aspectRatio === '9:16' ? 2 : 4;
          const bottomMargin = height * 0.08;
          const cardGap = 16;
          const totalWidth = width - topPadding * 2;
          const cardW = (totalWidth - (cardCount - 1) * cardGap) / cardCount;
          const cardH = 88;
          const startY = height - bottomMargin - cardH;

          // Compute KPI values
          const yieldFactor = simParams.solarYieldMultiplier ?? 1.0;
          const annualSolarKWh = Math.round(simParams.solarCapacityKW * 1380 * yieldFactor);
          const co2SavedTons = (annualSolarKWh * 0.0003855 + (simParams.heatPumpCop > 3.5 ? 2.4 : 1.2)).toFixed(1);

          const kpis = [
            {
              label: 'SOLAR PHOTOVOLTAIC',
              val: `${simParams.solarCapacityKW} kW DC`,
              sub: `${annualSolarKWh.toLocaleString()} kWh/yr yield`,
              accent: '#fbbf24',
            },
            {
              label: 'LIFEPO4 STORAGE (BESS)',
              val: `${simParams.batteryCapacityKWh} kWh`,
              sub: 'Peak shaving buffer',
              accent: '#10b981',
            },
            {
              label: 'HEAT PUMP SYSTEM COP',
              val: `COP ${simParams.heatPumpCop.toFixed(1)}`,
              sub: `${simParams.smartShadingActive ? '82% Shading' : 'Direct Sun'}`,
              accent: primaryColor,
            },
            {
              label: 'DECARBONIZATION IMPACT',
              val: `${co2SavedTons} t CO₂/yr`,
              sub: 'Avoided fossil emissions',
              accent: secondaryColor,
            },
          ].slice(0, cardCount);

          kpis.forEach((kpi, idx) => {
            const cardX = topPadding + idx * (cardW + cardGap);

            // Frosted glass dark card background
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.75)';
            ctx.lineWidth = 1.5;

            // Draw rounded rectangle
            ctx.beginPath();
            ctx.roundRect(cardX, startY, cardW, cardH, 12);
            ctx.fill();
            ctx.stroke();

            // Accent left bar
            ctx.fillStyle = kpi.accent;
            ctx.beginPath();
            ctx.roundRect(cardX, startY, 4, cardH, [12, 0, 0, 12]);
            ctx.fill();

            // Card Label
            ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(kpi.label, cardX + 14, startY + 16);

            // Card Value
            ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(kpi.val, cardX + 14, startY + 44);

            // Card Subtitle
            ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = kpi.accent;
            ctx.fillText(kpi.sub, cardX + 14, startY + 68);
          });
        }

        // 5. Bottom Watermark & Timestamp
        const footerY = height - height * 0.03;
        ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.textBaseline = 'middle';

        const watermark = options.watermarkText || 'EcoTwin Studio · Physics-Calibrated Clean Energy Digital Twin Architecture';
        ctx.fillText(watermark, topPadding, footerY);

        if (options.showTimestamp) {
          const dateStr = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          ctx.textAlign = 'right';
          ctx.fillText(`Rendered: ${dateStr}`, width - topPadding, footerY);
          ctx.textAlign = 'left';
        }

        // Generate high-resolution PNG
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        resolve({
          dataUrl,
          width,
          height,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(new Error('Failed to load WebGL render for snapshot composition: ' + e));
    img.src = raw3dDataUrl;
  });
}
