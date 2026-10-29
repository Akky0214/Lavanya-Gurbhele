import * as THREE from 'three';

// Procedural Canvas Textures Cache
let solarCellTexture: THREE.CanvasTexture | null = null;
let metalFinTexture: THREE.CanvasTexture | null = null;
let brushedMetalTexture: THREE.CanvasTexture | null = null;
let digitalDisplayTexture: THREE.CanvasTexture | null = null;
let contactShadowTexture: THREE.CanvasTexture | null = null;
let thermalGradientTexture: THREE.CanvasTexture | null = null;

// 1. Solar Photovoltaic Monocrystalline Cell Grid Texture
export function getSolarCellTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  if (solarCellTexture) return solarCellTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep anti-reflective navy blue / obsidian base
  ctx.fillStyle = '#0b192c';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle wafer crystalline shimmer texture
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(20, 45, 80, 0.25)' : 'rgba(5, 12, 25, 0.25)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Cell division grid lines (silicon wafer borders)
  const cols = 4;
  const rows = 4;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH;

      // Cell border
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);

      // Silver conductive busbars (vertical thick tracks)
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      const bb1 = x + cellW * 0.28;
      const bb2 = x + cellW * 0.72;
      ctx.beginPath();
      ctx.moveTo(bb1, y + 3);
      ctx.lineTo(bb1, y + cellH - 3);
      ctx.moveTo(bb2, y + 3);
      ctx.lineTo(bb2, y + cellH - 3);
      ctx.stroke();

      // Ultra-fine silver fingers (horizontal lines across the cell)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 0.5;
      for (let f = 6; f < cellH - 6; f += 5) {
        ctx.beginPath();
        ctx.moveTo(x + 4, y + f);
        ctx.lineTo(x + cellW - 4, y + f);
        ctx.stroke();
      }
    }
  }

  solarCellTexture = new THREE.CanvasTexture(canvas);
  solarCellTexture.colorSpace = THREE.SRGBColorSpace;
  solarCellTexture.wrapS = THREE.RepeatWrapping;
  solarCellTexture.wrapT = THREE.RepeatWrapping;
  solarCellTexture.anisotropy = maxAnisotropy;
  return solarCellTexture;
}

// 2. Heat Exchanger Aluminum / Copper Fin Texture
export function getHeatExchangerFinTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  if (metalFinTexture) return metalFinTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#38bdf8'; // Hydrophilic blue protective coating
  ctx.fillRect(0, 0, 256, 256);

  // Micro louvered slits
  for (let y = 0; y < 256; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? '#0284c7' : '#bae6fd';
    ctx.fillRect(0, y, 256, 2);
  }

  metalFinTexture = new THREE.CanvasTexture(canvas);
  metalFinTexture.colorSpace = THREE.SRGBColorSpace;
  metalFinTexture.wrapS = THREE.RepeatWrapping;
  metalFinTexture.wrapT = THREE.RepeatWrapping;
  metalFinTexture.repeat.set(4, 4);
  metalFinTexture.anisotropy = maxAnisotropy;
  return metalFinTexture;
}

// 3. Brushed Metal Anodized Aluminum Texture
export function getBrushedMetalTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  if (brushedMetalTexture) return brushedMetalTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 256, 256);

  // Anisotropic brush streaks
  for (let i = 0; i < 600; i++) {
    const y = Math.random() * 256;
    const len = 40 + Math.random() * 120;
    const x = Math.random() * 256;
    const alpha = 0.05 + Math.random() * 0.12;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(15, 23, 42, ${alpha})`;
    ctx.fillRect(x, y, len, 1.2);
  }

  brushedMetalTexture = new THREE.CanvasTexture(canvas);
  brushedMetalTexture.colorSpace = THREE.SRGBColorSpace;
  brushedMetalTexture.wrapS = THREE.RepeatWrapping;
  brushedMetalTexture.wrapT = THREE.RepeatWrapping;
  brushedMetalTexture.anisotropy = maxAnisotropy;
  return brushedMetalTexture;
}

// 4. Digital Display HUD Texture
export function getDigitalDisplayTexture(statusText = 'COP 4.2 | 3.8 kW'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#050c14';
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#065f46';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 120);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('ECO-INVERTER', 20, 38);

  ctx.fillStyle = '#34d399';
  ctx.font = '18px monospace';
  ctx.fillText(statusText, 20, 72);

  ctx.fillStyle = '#059669';
  ctx.font = '14px monospace';
  ctx.fillText('GRID: NORMAL | RUN', 20, 102);

  digitalDisplayTexture = new THREE.CanvasTexture(canvas);
  digitalDisplayTexture.colorSpace = THREE.SRGBColorSpace;
  return digitalDisplayTexture;
}

// 5. Soft Radial Contact Shadow Grounding Texture
export function getContactShadowTexture(): THREE.CanvasTexture {
  if (contactShadowTexture) return contactShadowTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.45)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  contactShadowTexture = new THREE.CanvasTexture(canvas);
  return contactShadowTexture;
}

// 6. Thermal Heatmap Gradient Texture (FLIR palette: violet -> blue -> green -> yellow -> orange -> red -> white)
export function getThermalGradientTexture(): THREE.CanvasTexture {
  if (thermalGradientTexture) return thermalGradientTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0.0, '#1e1b4b'); // Deep cold purple
  grad.addColorStop(0.2, '#1d4ed8'); // Blue
  grad.addColorStop(0.4, '#06b6d4'); // Cyan
  grad.addColorStop(0.6, '#10b981'); // Green
  grad.addColorStop(0.75, '#f59e0b'); // Yellow-orange
  grad.addColorStop(0.9, '#ef4444'); // Hot red
  grad.addColorStop(1.0, '#ffffff'); // White-hot

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 1);

  thermalGradientTexture = new THREE.CanvasTexture(canvas);
  thermalGradientTexture.colorSpace = THREE.SRGBColorSpace;
  return thermalGradientTexture;
}

// Factory for Studio PBR Materials
export function createStudioPBRMaterials(maxAnisotropy = 4) {
  const solarTex = getSolarCellTexture(maxAnisotropy);
  const finTex = getHeatExchangerFinTexture(maxAnisotropy);
  const brushedTex = getBrushedMetalTexture(maxAnisotropy);

  return {
    // Structural Chassis (Powder-coat matte, slight sheen)
    chassisPowderCoat: new THREE.MeshStandardMaterial({
      color: 0x242e38,
      metalness: 0.15,
      roughness: 0.55,
      bumpMap: brushedTex,
      bumpScale: 0.002,
    }),

    // High Polish Stainless Steel / Compressor
    stainlessSteel: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.18,
    }),

    // Anodized Architectural Aluminum (Frames, Louvers)
    anodizedAluminum: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.35,
    }),

    // Solar PV Cells (Ultra-glossy anti-reflective monocrystalline)
    solarCell: new THREE.MeshStandardMaterial({
      map: solarTex,
      metalness: 0.3,
      roughness: 0.12,
    }),

    // Copper Piping / Vapor Line
    copperPipe: new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.92,
      roughness: 0.22,
    }),

    // Brass Service Valves
    brassFitting: new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.88,
      roughness: 0.28,
    }),

    // Aerodynamic Fan Blades (Matte polymer)
    fanPolymer: new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.05,
      roughness: 0.45,
    }),

    // Heat Exchanger Fins (Hydrophilic blue)
    condenserFin: new THREE.MeshStandardMaterial({
      map: finTex,
      color: 0x38bdf8,
      metalness: 0.4,
      roughness: 0.4,
    }),

    // Electrochromic Glazing (Double-glazed smart glass)
    smartGlazing: new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      metalness: 0.1,
      roughness: 0.08,
      transmission: 0.75,
      thickness: 0.6,
      transparent: true,
      opacity: 0.82,
      ior: 1.52,
    }),

    // Concrete Equipment Foundation Pad
    concretePad: new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.05,
      roughness: 0.88,
    }),

    // Thermal Insulation Jacket
    thermalInsulation: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.05,
      roughness: 0.75,
    }),

    // LiFePO4 Battery Modules (Dark obsidian with neon emerald indicator lines)
    batteryCellBlock: new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.7,
      roughness: 0.25,
    }),

    // Status Emissive Glow (Green)
    ledActiveGreen: new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    }),

    // Status Emissive Glow (Cyan Energy)
    ledEnergyCyan: new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    }),

    // Biophilic Living Green Wall
    greenVegetation: new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.85,
      metalness: 0.0,
    }),

    // Contact Ground Shadow Material
    contactShadowMat: new THREE.MeshBasicMaterial({
      map: getContactShadowTexture(),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),

    // Selected Component Highlight Outline/Glow
    highlightRim: new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      metalness: 0.5,
      roughness: 0.2,
    }),
  };
}

// Thermal Inspection Palette Materials (FLIR False Color based on surface heat loss/efficiency)
export function createThermalMaterials() {
  return {
    thermalColdLowLoss: new THREE.MeshStandardMaterial({
      color: 0x1e1b4b, // Deep purple-blue: high R-value insulation, low heat loss
      roughness: 0.5,
      metalness: 0.1,
    }),
    thermalCool: new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Cool blue
      roughness: 0.5,
      metalness: 0.1,
    }),
    thermalMedium: new THREE.MeshStandardMaterial({
      color: 0x059669, // Green
      roughness: 0.5,
      metalness: 0.1,
    }),
    thermalWarmLeak: new THREE.MeshStandardMaterial({
      color: 0xd97706, // Amber/Orange: thermal bridge / heat leak
      roughness: 0.5,
      metalness: 0.1,
    }),
    thermalHotActive: new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Red: compressor discharge / heat generation
      emissive: 0x991b1b,
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.1,
    }),
  };
}
