import * as THREE from 'three';
import { createStudioPBRMaterials, createThermalMaterials } from '../materials';
import { VisualMode } from '../../types/energy';
import { ProceduralSystemInstance } from './heatPump';

export function createResidentialMicrogridSystem(maxAnisotropy = 4): ProceduralSystemInstance {
  const group = new THREE.Group();
  group.name = 'residential_microgrid_system';

  const pbr = createStudioPBRMaterials(maxAnisotropy);
  const thermal = createThermalMaterials();

  const explodedParts: Array<{
    mesh: THREE.Object3D;
    basePos: THREE.Vector3;
    explodeDir: THREE.Vector3;
  }> = [];

  // Concrete Foundation Pad (y = 0)
  const padGeo = new THREE.BoxGeometry(5.4, 0.12, 4.4);
  const padMesh = new THREE.Mesh(padGeo, pbr.concretePad);
  padMesh.position.set(0, 0.06, 0);
  padMesh.receiveShadow = true;
  group.add(padMesh);

  // Soft Contact Ground Shadow
  const shadowGeo = new THREE.PlaneGeometry(6.2, 5.0);
  const shadowMesh = new THREE.Mesh(shadowGeo, pbr.contactShadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.125, 0);
  group.add(shadowMesh);

  // ==========================================
  // PART 1: Architectural High-Efficiency Home Structure
  // ==========================================
  const houseGroup = new THREE.Group();
  houseGroup.position.set(0, 0.12, -0.4);
  houseGroup.userData = { partId: 'solar_roof', systemId: 'residential_microgrid' };

  // Main dwelling walls
  const wallGeo = new THREE.BoxGeometry(3.6, 2.0, 2.8);
  const wallMesh = new THREE.Mesh(wallGeo, pbr.chassisPowderCoat);
  wallMesh.position.set(0, 1.0, 0);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  houseGroup.add(wallMesh);

  // Vaulted Roof Pitch
  const roofGeo = new THREE.ConeGeometry(2.7, 1.1, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roofMesh = new THREE.Mesh(roofGeo, pbr.anodizedAluminum);
  roofMesh.position.set(0, 2.55, 0);
  roofMesh.scale.set(1.0, 1.0, 0.8);
  roofMesh.castShadow = true;
  houseGroup.add(roofMesh);

  // Solar Array Modules on South Roof Slope
  const panelPitch = new THREE.Group();
  panelPitch.position.set(0, 2.45, 0.6);
  panelPitch.rotation.x = 0.55;

  const solarPanelGeo = new THREE.BoxGeometry(2.8, 0.03, 1.2);
  const solarPanelMesh = new THREE.Mesh(solarPanelGeo, pbr.solarCell);
  solarPanelMesh.castShadow = true;
  panelPitch.add(solarPanelMesh);
  houseGroup.add(panelPitch);

  group.add(houseGroup);
  explodedParts.push({
    mesh: houseGroup,
    basePos: houseGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 0.5, -0.6),
  });

  // ==========================================
  // PART 2: Wall-Mounted LiFePO4 BESS Battery (13.5 kWh)
  // ==========================================
  const batteryGroup = new THREE.Group();
  batteryGroup.position.set(1.95, 0.9, 0.6);
  batteryGroup.userData = { partId: 'bess_battery', systemId: 'residential_microgrid' };

  // Battery enclosure cabinet
  const batGeo = new THREE.BoxGeometry(0.35, 1.25, 0.75);
  const batMesh = new THREE.Mesh(batGeo, pbr.batteryCellBlock);
  batMesh.castShadow = true;
  batteryGroup.add(batMesh);

  // Vertical LED State-of-Charge (SoC) indicator bar
  const socGeo = new THREE.BoxGeometry(0.02, 0.85, 0.04);
  const socMesh = new THREE.Mesh(socGeo, pbr.ledActiveGreen);
  socMesh.position.set(0.18, 0, 0.25);
  batteryGroup.add(socMesh);

  // Aluminum heat dissipation side fins
  for (let y = -0.5; y <= 0.5; y += 0.12) {
    const finGeo = new THREE.BoxGeometry(0.04, 0.02, 0.7);
    const finMesh = new THREE.Mesh(finGeo, pbr.anodizedAluminum);
    finMesh.position.set(-0.16, y, 0);
    batteryGroup.add(finMesh);
  }

  group.add(batteryGroup);
  explodedParts.push({
    mesh: batteryGroup,
    basePos: batteryGroup.position.clone(),
    explodeDir: new THREE.Vector3(1.2, 0, 0),
  });

  // ==========================================
  // PART 3: Hybrid Solar & Storage Inverter
  // ==========================================
  const inverterGroup = new THREE.Group();
  inverterGroup.position.set(1.95, 1.7, -0.4);
  inverterGroup.userData = { partId: 'hybrid_inverter', systemId: 'residential_microgrid' };

  // Inverter body
  const invGeo = new THREE.BoxGeometry(0.3, 0.7, 0.5);
  const invMesh = new THREE.Mesh(invGeo, pbr.anodizedAluminum);
  invMesh.castShadow = true;
  inverterGroup.add(invMesh);

  // LCD digital monitor
  const lcdGeo = new THREE.PlaneGeometry(0.2, 0.14);
  const lcdMesh = new THREE.Mesh(lcdGeo, pbr.ledEnergyCyan);
  lcdMesh.rotation.y = Math.PI / 2;
  lcdMesh.position.set(0.155, 0.1, 0);
  inverterGroup.add(lcdMesh);

  // DC Isolator safety switch
  const switchGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16);
  switchGeo.rotateZ(Math.PI / 2);
  const switchMesh = new THREE.Mesh(switchGeo, pbr.brassFitting);
  switchMesh.position.set(0.16, -0.18, 0.12);
  inverterGroup.add(switchMesh);

  group.add(inverterGroup);
  explodedParts.push({
    mesh: inverterGroup,
    basePos: inverterGroup.position.clone(),
    explodeDir: new THREE.Vector3(1.4, 0.4, 0),
  });

  // ==========================================
  // PART 4: Smart Circuit Breaker Subpanel
  // ==========================================
  const panelGroup = new THREE.Group();
  panelGroup.position.set(1.95, 0.75, -1.2);
  panelGroup.userData = { partId: 'smart_subpanel', systemId: 'residential_microgrid' };

  const pnlGeo = new THREE.BoxGeometry(0.22, 0.85, 0.45);
  const pnlMesh = new THREE.Mesh(pnlGeo, pbr.stainlessSteel);
  pnlMesh.castShadow = true;
  panelGroup.add(pnlMesh);

  // Circuit status LED row
  for (let c = -0.3; c <= 0.3; c += 0.1) {
    const ledGeo = new THREE.BoxGeometry(0.02, 0.04, 0.04);
    const led = new THREE.Mesh(ledGeo, pbr.ledActiveGreen);
    led.position.set(0.115, c, 0);
    panelGroup.add(led);
  }

  group.add(panelGroup);
  explodedParts.push({
    mesh: panelGroup,
    basePos: panelGroup.position.clone(),
    explodeDir: new THREE.Vector3(1.2, -0.2, -0.6),
  });

  // ==========================================
  // PART 5: Bidirectional Vehicle-to-Home (V2H) EV Wallbox
  // ==========================================
  const v2hGroup = new THREE.Group();
  v2hGroup.position.set(-1.95, 0.9, 0.8);
  v2hGroup.userData = { partId: 'v2h_charger', systemId: 'residential_microgrid' };

  // Charger pedestal / wall unit
  const chgGeo = new THREE.BoxGeometry(0.24, 0.65, 0.32);
  const chgMesh = new THREE.Mesh(chgGeo, pbr.stainlessSteel);
  chgMesh.castShadow = true;
  v2hGroup.add(chgMesh);

  // Illuminated ring
  const ringGeo = new THREE.TorusGeometry(0.08, 0.02, 16, 24);
  ringGeo.rotateY(Math.PI / 2);
  const ringMesh = new THREE.Mesh(ringGeo, pbr.ledEnergyCyan);
  ringMesh.position.set(-0.125, 0.08, 0);
  v2hGroup.add(ringMesh);

  // Coiled heavy-duty cable
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.1, -0.25, 0),
    new THREE.Vector3(-0.25, -0.4, 0.1),
    new THREE.Vector3(-0.1, -0.55, 0.05),
    new THREE.Vector3(-0.25, -0.65, -0.1),
    new THREE.Vector3(-0.15, -0.3, -0.1),
  ]);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 24, 0.02, 12, false);
  const cableMesh = new THREE.Mesh(cableGeo, pbr.fanPolymer);
  v2hGroup.add(cableMesh);

  group.add(v2hGroup);
  explodedParts.push({
    mesh: v2hGroup,
    basePos: v2hGroup.position.clone(),
    explodeDir: new THREE.Vector3(-1.2, 0, 0.6),
  });

  function update(delta: number, simParams: any) {
    // Dynamic battery pulse intensity based on solar charging
    const isDay = simParams.sunAngleHour >= 8 && simParams.sunAngleHour <= 17;
    if (socMesh.material instanceof THREE.MeshStandardMaterial) {
      socMesh.material.emissiveIntensity = isDay ? 1.0 : 0.4;
    }
  }

  function setExploded(offset: number) {
    explodedParts.forEach(({ mesh, basePos, explodeDir }) => {
      mesh.position.copy(basePos).addScaledVector(explodeDir, offset);
    });
  }

  function setVisualMode(mode: VisualMode) {
    if (mode === 'thermal') {
      wallMesh.material = thermal.thermalColdLowLoss; // High R-value insulation
      roofMesh.material = thermal.thermalCool;
      solarPanelMesh.material = thermal.thermalWarmLeak; // Warms in sun
      batMesh.material = thermal.thermalMedium;
      invMesh.material = thermal.thermalHotActive; // Heat dissipation fins
    } else {
      wallMesh.material = pbr.chassisPowderCoat;
      roofMesh.material = pbr.anodizedAluminum;
      solarPanelMesh.material = pbr.solarCell;
      batMesh.material = pbr.batteryCellBlock;
      invMesh.material = pbr.anodizedAluminum;
    }
  }

  function dispose() {}

  return {
    group,
    update,
    setExploded,
    setVisualMode,
    dispose,
  };
}
