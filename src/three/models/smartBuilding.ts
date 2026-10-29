import * as THREE from 'three';
import { createStudioPBRMaterials, createThermalMaterials } from '../materials';
import { VisualMode } from '../../types/energy';
import { ProceduralSystemInstance } from './heatPump';

export function createSmartBuildingSystem(maxAnisotropy = 4): ProceduralSystemInstance {
  const group = new THREE.Group();
  group.name = 'smart_building_system';

  const pbr = createStudioPBRMaterials(maxAnisotropy);
  const thermal = createThermalMaterials();

  const explodedParts: Array<{
    mesh: THREE.Object3D;
    basePos: THREE.Vector3;
    explodeDir: THREE.Vector3;
  }> = [];

  // Ground Plaza (Pivoted flush at y = 0)
  const plazaGeo = new THREE.BoxGeometry(6.2, 0.12, 5.2);
  const plazaMesh = new THREE.Mesh(plazaGeo, pbr.concretePad);
  plazaMesh.position.set(0, 0.06, 0);
  plazaMesh.receiveShadow = true;
  group.add(plazaMesh);

  // Soft contact ground shadow
  const shadowGeo = new THREE.PlaneGeometry(7.0, 6.0);
  const shadowMesh = new THREE.Mesh(shadowGeo, pbr.contactShadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.125, 0);
  group.add(shadowMesh);

  // ==========================================
  // PART 1: Main Architectural Core & Podium
  // ==========================================
  const coreGroup = new THREE.Group();
  coreGroup.position.set(0, 0.12, 0);
  coreGroup.userData = { partId: 'glazing', systemId: 'smart_building' };

  // Building Main Volume (3 stories)
  const bldgGeo = new THREE.BoxGeometry(3.2, 3.6, 2.6);
  const bldgMesh = new THREE.Mesh(bldgGeo, pbr.chassisPowderCoat);
  bldgMesh.position.set(0, 1.8, 0);
  bldgMesh.castShadow = true;
  bldgMesh.receiveShadow = true;
  coreGroup.add(bldgMesh);

  // Mullions & Floor slabs (Horizontal anodized bands)
  for (let floor = 1; floor <= 3; floor++) {
    const slabGeo = new THREE.BoxGeometry(3.32, 0.08, 2.72);
    const slabMesh = new THREE.Mesh(slabGeo, pbr.anodizedAluminum);
    slabMesh.position.set(0, floor * 1.15, 0);
    slabMesh.castShadow = true;
    coreGroup.add(slabMesh);
  }

  // ==========================================
  // PART 2: Dynamic Electrochromic Glazing Façade
  // ==========================================
  const glassGeo = new THREE.BoxGeometry(3.1, 3.3, 0.04);
  const glassFront = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(glassGeo, pbr.smartGlazing);
  glassFront.position.set(0, 1.8, 1.32);
  glassFront.castShadow = true;
  coreGroup.add(glassFront);

  const glassBack = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(glassGeo, pbr.smartGlazing);
  glassBack.position.set(0, 1.8, -1.32);
  coreGroup.add(glassBack);

  group.add(coreGroup);
  explodedParts.push({
    mesh: coreGroup,
    basePos: coreGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 0, 0),
  });

  // ==========================================
  // PART 3: Motorized Kinetic Solar Louvers (South Facade)
  // ==========================================
  const louverGroup = new THREE.Group();
  louverGroup.position.set(0, 1.8, 1.55);
  louverGroup.userData = { partId: 'kinetic_shading', systemId: 'smart_building' };

  const louverBlades: THREE.Mesh[] = [];
  const louverCount = 8;
  for (let i = 0; i < louverCount; i++) {
    const y = -1.4 + (i * 2.8) / (louverCount - 1);
    const bladeGeo = new THREE.BoxGeometry(2.9, 0.03, 0.28);
    const bladeMesh = new THREE.Mesh(bladeGeo, pbr.anodizedAluminum);
    bladeMesh.position.set(0, y, 0);
    bladeMesh.castShadow = true;
    louverGroup.add(bladeMesh);
    louverBlades.push(bladeMesh);
  }

  // Vertical support guide rods
  const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 3.2, 12);
  const rod1 = new THREE.Mesh(rodGeo, pbr.stainlessSteel);
  rod1.position.set(-1.3, 0, 0);
  louverGroup.add(rod1);
  const rod2 = new THREE.Mesh(rodGeo, pbr.stainlessSteel);
  rod2.position.set(1.3, 0, 0);
  louverGroup.add(rod2);

  group.add(louverGroup);
  explodedParts.push({
    mesh: louverGroup,
    basePos: louverGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 0, 1.4),
  });

  // ==========================================
  // PART 4: Rooftop Solar Photovoltaic Array (TOPCon bifacial)
  // ==========================================
  const solarGroup = new THREE.Group();
  solarGroup.position.set(0, 3.75, 0);
  solarGroup.userData = { partId: 'solar_rooftop', systemId: 'smart_building' };

  // 3 Tilted Solar Racks
  const rackCount = 3;
  for (let r = 0; r < rackCount; r++) {
    const z = -0.7 + r * 0.7;
    const panelGeo = new THREE.BoxGeometry(2.6, 0.04, 0.52);
    const panelMesh = new THREE.Mesh(panelGeo, pbr.solarCell);
    panelMesh.position.set(0, 0.16, z);
    panelMesh.rotation.x = -0.32; // ~18 degree solar tilt angle
    panelMesh.castShadow = true;
    solarGroup.add(panelMesh);

    // Aluminum mounting struts
    const legGeo = new THREE.BoxGeometry(0.04, 0.24, 0.04);
    const legLeft = new THREE.Mesh(legGeo, pbr.anodizedAluminum);
    legLeft.position.set(-1.1, 0.08, z + 0.15);
    solarGroup.add(legLeft);
    const legRight = new THREE.Mesh(legGeo, pbr.anodizedAluminum);
    legRight.position.set(1.1, 0.08, z + 0.15);
    solarGroup.add(legRight);
  }

  group.add(solarGroup);
  explodedParts.push({
    mesh: solarGroup,
    basePos: solarGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 1.2, 0),
  });

  // ==========================================
  // PART 5: Rooftop HVAC Chiller Penthouse & Economizer
  // ==========================================
  const penthouseGroup = new THREE.Group();
  penthouseGroup.position.set(0.7, 3.75, -0.6);
  penthouseGroup.userData = { partId: 'chiller_penthouse', systemId: 'smart_building' };

  // Enclosure box with louvers
  const phBoxGeo = new THREE.BoxGeometry(1.2, 0.85, 0.95);
  const phBoxMesh = new THREE.Mesh(phBoxGeo, pbr.chassisPowderCoat);
  phBoxMesh.position.y = 0.42;
  phBoxMesh.castShadow = true;
  penthouseGroup.add(phBoxMesh);

  // Cooling tower fan cowl
  const ctFanGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.15, 24);
  const ctFanMesh = new THREE.Mesh(ctFanGeo, pbr.anodizedAluminum);
  ctFanMesh.position.set(0, 0.9, 0);
  penthouseGroup.add(ctFanMesh);

  // Active LED status indicator
  const ctLedGeo = new THREE.SphereGeometry(0.04, 16, 16);
  const ctLed = new THREE.Mesh(ctLedGeo, pbr.ledEnergyCyan);
  ctLed.position.set(0.5, 0.7, 0.48);
  penthouseGroup.add(ctLed);

  group.add(penthouseGroup);
  explodedParts.push({
    mesh: penthouseGroup,
    basePos: penthouseGroup.position.clone(),
    explodeDir: new THREE.Vector3(0.8, 1.4, -0.8),
  });

  // ==========================================
  // PART 6: Biophilic Vertical Living Green Wall
  // ==========================================
  const greenGroup = new THREE.Group();
  greenGroup.position.set(-1.62, 1.8, 0.2);
  greenGroup.userData = { partId: 'green_wall', systemId: 'smart_building' };

  const greenGeo = new THREE.BoxGeometry(0.08, 2.6, 1.4);
  const greenMesh = new THREE.Mesh(greenGeo, pbr.greenVegetation);
  greenMesh.castShadow = true;
  greenGroup.add(greenMesh);

  group.add(greenGroup);
  explodedParts.push({
    mesh: greenGroup,
    basePos: greenGroup.position.clone(),
    explodeDir: new THREE.Vector3(-1.2, 0, 0),
  });

  // ==========================================
  // PART 7: Smart EV Charging Station Plaza
  // ==========================================
  const evGroup = new THREE.Group();
  evGroup.position.set(1.8, 0.12, 1.8);
  evGroup.userData = { partId: 'ev_charging', systemId: 'smart_building' };

  // Dual charger pedestals
  [-0.35, 0.35].forEach((offset) => {
    const postGeo = new THREE.BoxGeometry(0.22, 0.95, 0.22);
    const postMesh = new THREE.Mesh(postGeo, pbr.stainlessSteel);
    postMesh.position.set(offset, 0.48, 0);
    postMesh.castShadow = true;
    evGroup.add(postMesh);

    // Glowing charging indicator strip
    const stripGeo = new THREE.BoxGeometry(0.04, 0.6, 0.02);
    const stripMesh = new THREE.Mesh(stripGeo, pbr.ledActiveGreen);
    stripMesh.position.set(offset, 0.52, 0.115);
    evGroup.add(stripMesh);
  });

  group.add(evGroup);
  explodedParts.push({
    mesh: evGroup,
    basePos: evGroup.position.clone(),
    explodeDir: new THREE.Vector3(0.8, 0, 0.8),
  });

  // Animation update
  function update(delta: number, simParams: any) {
    // Dynamically tilt motorized louvers according to solar time of day
    if (simParams.smartShadingActive && louverBlades.length > 0) {
      const sunRatio = ((simParams.sunAngleHour ?? 12) - 6) / 12; // 0 (morning) to 1 (evening)
      const targetTilt = -0.6 + sunRatio * 1.2;
      louverBlades.forEach((b) => {
        b.rotation.x = THREE.MathUtils.damp(b.rotation.x, targetTilt, 4, delta);
      });
    }

    // Adjust smart electrochromic glass tint based on ambient sun
    if (pbr.smartGlazing) {
      const isPeakSun = simParams.sunAngleHour >= 10 && simParams.sunAngleHour <= 15;
      const targetOpacity = isPeakSun ? 0.92 : 0.75;
      pbr.smartGlazing.opacity = THREE.MathUtils.damp(pbr.smartGlazing.opacity, targetOpacity, 2, delta);
    }
  }

  function setExploded(offset: number) {
    explodedParts.forEach(({ mesh, basePos, explodeDir }) => {
      mesh.position.copy(basePos).addScaledVector(explodeDir, offset);
    });
  }

  function setVisualMode(mode: VisualMode) {
    if (mode === 'thermal') {
      bldgMesh.material = thermal.thermalColdLowLoss;
      glassFront.material = thermal.thermalWarmLeak;
      glassBack.material = thermal.thermalWarmLeak;
      phBoxMesh.material = thermal.thermalHotActive; // HVAC rejection
      greenMesh.material = thermal.thermalCool;
    } else {
      bldgMesh.material = pbr.chassisPowderCoat;
      glassFront.material = pbr.smartGlazing;
      glassBack.material = pbr.smartGlazing;
      phBoxMesh.material = pbr.chassisPowderCoat;
      greenMesh.material = pbr.greenVegetation;
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
