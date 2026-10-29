import * as THREE from 'three';
import { SystemId, SimulationParams } from '../types/energy';

export interface EnergyFlowParticlesInstance {
  points: THREE.Points;
  update: (delta: number, simParams: SimulationParams, currentSystemId: SystemId) => void;
  setVisible: (visible: boolean) => void;
  setSystemId: (sysId: SystemId) => void;
  dispose: () => void;
}

interface ParticlePathway {
  curve: THREE.CatmullRomCurve3;
  color: THREE.Color;
  baseSpeed: number;
  type: 'solar' | 'battery' | 'load' | 'thermal' | 'grid' | 'fluid';
}

export function createEnergyFlowParticles(totalCount = 400): EnergyFlowParticlesInstance {
  const positions = new Float32Array(totalCount * 3);
  const colors = new Float32Array(totalCount * 3);
  const sizes = new Float32Array(totalCount);
  const progress = new Float32Array(totalCount);
  const speeds = new Float32Array(totalCount);
  const pathwayIndices = new Uint8Array(totalCount);

  // System-specific pathways
  const systemPathways: Record<SystemId, ParticlePathway[]> = {
    // 1. Heat Pump & TES Buffer: Refrigerant & Hydronic Energy Flows
    heat_pump: [
      // Ambient heat extraction into microchannel coil (cyan/blue)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.85, 1.8, -1.2),
          new THREE.Vector3(-0.85, 1.2, -0.7),
          new THREE.Vector3(-0.85, 0.95, -0.42),
        ]),
        color: new THREE.Color(0x38bdf8),
        baseSpeed: 0.35,
        type: 'thermal',
      },
      // Compressor discharge to expansion (hot refrigerant - amber/red)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.25, 0.4, 0),
          new THREE.Vector3(-1.1, 0.7, 0.1),
          new THREE.Vector3(-0.6, 0.8, 0.2),
          new THREE.Vector3(0.0, 0.5, 0.2),
        ]),
        color: new THREE.Color(0xf59e0b),
        baseSpeed: 0.5,
        type: 'thermal',
      },
      // Circulator pump into stratified thermal storage tank (hydronic loop - emerald/green)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.45, 0.55, 0.35),
          new THREE.Vector3(0.8, 0.6, 0.2),
          new THREE.Vector3(1.1, 0.8, 0.0),
          new THREE.Vector3(1.1, 1.5, 0.0),
        ]),
        color: new THREE.Color(0x10b981),
        baseSpeed: 0.45,
        type: 'fluid',
      },
      // Inverter electric power drive to compressor motor (electric cyan)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.45, 1.25, 0.44),
          new THREE.Vector3(-0.8, 0.9, 0.3),
          new THREE.Vector3(-1.25, 0.5, 0.1),
        ]),
        color: new THREE.Color(0x06b6d4),
        baseSpeed: 0.6,
        type: 'load',
      },
    ],

    // 2. Net-Zero Commercial Smart Building
    smart_building: [
      // Solar Photons: Sky to Rooftop TOPCon Array (amber gold)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.0, 5.8, 1.5),
          new THREE.Vector3(0.0, 4.6, 0.8),
          new THREE.Vector3(0.0, 3.85, 0.2),
        ]),
        color: new THREE.Color(0xfbbf24),
        baseSpeed: 0.4,
        type: 'solar',
      },
      // Rooftop Generation to Penthouse Central Plant (electric cyan)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.0, 3.8, 0.0),
          new THREE.Vector3(0.4, 3.8, -0.3),
          new THREE.Vector3(0.7, 3.75, -0.6),
        ]),
        color: new THREE.Color(0x06b6d4),
        baseSpeed: 0.55,
        type: 'load',
      },
      // Rooftop Power down to Ground EV Charging Plaza (emerald green)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.0, 3.7, 0.0),
          new THREE.Vector3(1.2, 2.5, 0.8),
          new THREE.Vector3(1.8, 1.2, 1.4),
          new THREE.Vector3(1.8, 0.6, 1.8),
        ]),
        color: new THREE.Color(0x10b981),
        baseSpeed: 0.45,
        type: 'battery',
      },
      // HVAC Chiller Heat Rejection into atmosphere (cool cyan/violet)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.7, 4.6, -0.6),
          new THREE.Vector3(0.7, 5.5, -0.6),
          new THREE.Vector3(1.2, 6.2, -0.4),
        ]),
        color: new THREE.Color(0x818cf8),
        baseSpeed: 0.35,
        type: 'thermal',
      },
    ],

    // 3. Residential Smart Microgrid & BESS
    residential_microgrid: [
      // Solar Photons: Roof Array to Hybrid Inverter (gold)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.0, 2.6, 0.6),
          new THREE.Vector3(1.2, 2.2, 0.2),
          new THREE.Vector3(1.95, 1.7, -0.4),
        ]),
        color: new THREE.Color(0xfbbf24),
        baseSpeed: 0.5,
        type: 'solar',
      },
      // Inverter to LiFePO4 BESS Battery (emerald charging)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.95, 1.6, -0.3),
          new THREE.Vector3(2.0, 1.3, 0.2),
          new THREE.Vector3(1.95, 0.9, 0.6),
        ]),
        color: new THREE.Color(0x10b981),
        baseSpeed: 0.45,
        type: 'battery',
      },
      // Inverter to Smart Subpanel (domestic branch circuits - electric cyan)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.95, 1.6, -0.4),
          new THREE.Vector3(1.95, 1.2, -0.8),
          new THREE.Vector3(1.95, 0.75, -1.2),
        ]),
        color: new THREE.Color(0x06b6d4),
        baseSpeed: 0.5,
        type: 'load',
      },
      // Microgrid to Bidirectional V2H EV Charger (violet / cyan bidirectional)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.8, 0.8, -0.6),
          new THREE.Vector3(0.0, 0.4, 0.2),
          new THREE.Vector3(-1.95, 0.8, 0.8),
        ]),
        color: new THREE.Color(0x8b5cf6),
        baseSpeed: 0.4,
        type: 'battery',
      },
    ],

    // 4. Industrial Waste Heat Recovery Skid & ORC Turbine
    industrial_whrs: [
      // High-temperature flue gas diverter to Shell-and-Tube Vaporizer (fiery orange/red)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.6, 2.0, 0),
          new THREE.Vector3(-1.2, 1.4, 0),
          new THREE.Vector3(-0.6, 1.1, 0),
          new THREE.Vector3(0.0, 0.9, 0),
        ]),
        color: new THREE.Color(0xef4444),
        baseSpeed: 0.55,
        type: 'thermal',
      },
      // High-pressure organic vapor to Expansion Turbine (amber power generation)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.8, 0.9, 0),
          new THREE.Vector3(1.2, 0.9, 0.2),
          new THREE.Vector3(1.6, 0.9, 0.4),
        ]),
        color: new THREE.Color(0xf59e0b),
        baseSpeed: 0.65,
        type: 'fluid',
      },
      // Turbine Exhaust Vapor to Overhead Condenser Bank (purple-cyan)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.6, 1.1, 0.4),
          new THREE.Vector3(1.4, 1.6, 0.2),
          new THREE.Vector3(0.8, 2.0, 0),
          new THREE.Vector3(0.0, 2.1, 0),
        ]),
        color: new THREE.Color(0x06b6d4),
        baseSpeed: 0.45,
        type: 'fluid',
      },
      // Condensed working fluid returned by feed pump back to vaporizer (emerald loop)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.6, 1.9, 0),
          new THREE.Vector3(0.0, 1.1, 0.6),
          new THREE.Vector3(0.6, 0.42, 1.0),
          new THREE.Vector3(0.0, 0.6, 0.0),
        ]),
        color: new THREE.Color(0x10b981),
        baseSpeed: 0.4,
        type: 'fluid',
      },
    ],
  };

  let activeSystemId: SystemId = 'heat_pump';
  let activePathways = systemPathways[activeSystemId];

  // Initialize particle attributes
  const _tempVec = new THREE.Vector3();

  for (let i = 0; i < totalCount; i++) {
    const pathIdx = i % activePathways.length;
    pathwayIndices[i] = pathIdx;
    progress[i] = Math.random();
    speeds[i] = activePathways[pathIdx].baseSpeed * (0.8 + Math.random() * 0.4);
    sizes[i] = 0.18 + Math.random() * 0.12;

    activePathways[pathIdx].curve.getPointAt(progress[i], _tempVec);
    positions[i * 3] = _tempVec.x;
    positions[i * 3 + 1] = _tempVec.y;
    positions[i * 3 + 2] = _tempVec.z;

    const col = activePathways[pathIdx].color;
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Procedural glowing round lens-flare particle texture
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 1, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(125, 211, 252, 0.95)');
  grad.addColorStop(0.6, 'rgba(14, 165, 233, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const particleTex = new THREE.CanvasTexture(canvas);

  const material = new THREE.PointsMaterial({
    size: 0.24,
    map: particleTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'energy_flow_particles';
  points.visible = false;

  function setSystemId(sysId: SystemId) {
    activeSystemId = sysId;
    activePathways = systemPathways[sysId];

    // Re-index particles onto new pathways
    for (let i = 0; i < totalCount; i++) {
      const pathIdx = i % activePathways.length;
      pathwayIndices[i] = pathIdx;
      progress[i] = Math.random();
      speeds[i] = activePathways[pathIdx].baseSpeed * (0.8 + Math.random() * 0.4);

      activePathways[pathIdx].curve.getPointAt(progress[i], _tempVec);
      positions[i * 3] = _tempVec.x;
      positions[i * 3 + 1] = _tempVec.y;
      positions[i * 3 + 2] = _tempVec.z;

      const col = activePathways[pathIdx].color;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  function update(delta: number, simParams: SimulationParams, currentSystemId: SystemId) {
    if (!points.visible) return;

    if (activeSystemId !== currentSystemId) {
      setSystemId(currentSystemId);
    }

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const colAttr = geometry.attributes.color as THREE.BufferAttribute;
    const colArr = colAttr.array as Float32Array;

    // Calculate real-time physical solar factor based on sunAngleHour (6 to 18)
    const sunRatio = Math.max(0, Math.sin(((simParams.sunAngleHour - 6) / 12) * Math.PI));
    const isSolarActive = (simParams.solarCapacityKW ?? 0) > 0 && sunRatio > 0.05;
    const yieldFactor = simParams.solarYieldMultiplier ?? 1.0;
    const solarIntensity = isSolarActive ? sunRatio * (simParams.solarCapacityKW / 10) * yieldFactor : 0;

    // Battery charge vs discharge state
    // Midday (10-15h) with solar: battery charges (particles flow towards BESS)
    // Evening/night: battery discharges to building loads
    const isBatteryCharging = sunRatio > 0.4 && simParams.solarCapacityKW > 4;

    for (let i = 0; i < totalCount; i++) {
      const pIdx = pathwayIndices[i];
      const pathway = activePathways[pIdx];

      // Dynamic flow speed adjustments based on simulation parameters
      let flowRateMultiplier = 1.0;
      if (pathway.type === 'solar') {
        flowRateMultiplier = isSolarActive ? Math.max(0.2, solarIntensity * 1.5) : 0.05;
      } else if (pathway.type === 'battery') {
        flowRateMultiplier = Math.max(0.4, (simParams.batteryCapacityKWh / 15) * 1.2);
      } else if (pathway.type === 'thermal') {
        flowRateMultiplier = Math.max(0.5, (simParams.heatPumpCop / 3.5));
      }

      // Reverse battery flow direction if discharging
      const step = speeds[i] * delta * flowRateMultiplier;
      if (pathway.type === 'battery' && !isBatteryCharging) {
        progress[i] -= step;
        if (progress[i] < 0) progress[i] += 1;
      } else {
        progress[i] += step;
        if (progress[i] > 1) progress[i] -= 1;
      }

      pathway.curve.getPointAt(progress[i], _tempVec);

      // Subtle atmospheric electric oscillation
      const jitter = Math.sin(progress[i] * Math.PI * 6 + i) * 0.012;
      posArr[i * 3] = _tempVec.x + jitter;
      posArr[i * 3 + 1] = _tempVec.y + jitter;
      posArr[i * 3 + 2] = _tempVec.z + jitter;

      // Dynamic particle color modulation
      if (pathway.type === 'solar') {
        // Bright radiant gold when sun is peak, dim amber at dusk
        const brightness = Math.max(0.15, solarIntensity);
        colArr[i * 3] = pathway.color.r * brightness;
        colArr[i * 3 + 1] = pathway.color.g * brightness;
        colArr[i * 3 + 2] = pathway.color.b * brightness;
      } else if (pathway.type === 'battery') {
        // Emerald green when charging, warm cyan when discharging to home
        if (isBatteryCharging) {
          colArr[i * 3] = 0.06;
          colArr[i * 3 + 1] = 0.75;
          colArr[i * 3 + 2] = 0.45;
        } else {
          colArr[i * 3] = 0.02;
          colArr[i * 3 + 1] = 0.71;
          colArr[i * 3 + 2] = 0.83;
        }
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  function setVisible(visible: boolean) {
    points.visible = visible;
  }

  function dispose() {
    geometry.dispose();
    material.dispose();
    particleTex.dispose();
  }

  return {
    points,
    update,
    setVisible,
    setSystemId,
    dispose,
  };
}
