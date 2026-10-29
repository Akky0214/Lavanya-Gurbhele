import * as THREE from 'three';
import { createStudioPBRMaterials, createThermalMaterials } from '../materials';
import { VisualMode } from '../../types/energy';

export interface ProceduralSystemInstance {
  group: THREE.Group;
  update: (delta: number, simParams: any) => void;
  setExploded: (offset: number) => void;
  setVisualMode: (mode: VisualMode) => void;
  dispose: () => void;
}

export function createHeatPumpSystem(maxAnisotropy = 4): ProceduralSystemInstance {
  const group = new THREE.Group();
  group.name = 'heat_pump_system';

  const pbr = createStudioPBRMaterials(maxAnisotropy);
  const thermal = createThermalMaterials();

  // Keep track of parts for exploded view
  const explodedParts: Array<{
    mesh: THREE.Object3D;
    basePos: THREE.Vector3;
    explodeDir: THREE.Vector3;
  }> = [];

  // Ground equipment pad (Bottom flush at y = 0)
  const padGeo = new THREE.BoxGeometry(4.2, 0.12, 2.6);
  const padMesh = new THREE.Mesh(padGeo, pbr.concretePad);
  padMesh.position.set(0, 0.06, 0);
  padMesh.receiveShadow = true;
  group.add(padMesh);

  // Soft contact ground shadow plane
  const shadowGeo = new THREE.PlaneGeometry(5.0, 3.4);
  const shadowMesh = new THREE.Mesh(shadowGeo, pbr.contactShadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.125, 0);
  group.add(shadowMesh);

  // ==========================================
  // PART 1: Galvanized Acoustic Chassis (Outer Unit)
  // ==========================================
  const chassisGroup = new THREE.Group();
  chassisGroup.position.set(-0.85, 0.12, 0);
  chassisGroup.userData = { partId: 'chassis', systemId: 'heat_pump' };

  // Main cabinet box
  const cabinetGeo = new THREE.BoxGeometry(1.8, 1.6, 0.85);
  const cabinetMesh = new THREE.Mesh(cabinetGeo, pbr.chassisPowderCoat);
  cabinetMesh.position.set(0, 0.8, 0);
  cabinetMesh.castShadow = true;
  cabinetMesh.receiveShadow = true;
  chassisGroup.add(cabinetMesh);

  // Top beveled lid
  const lidGeo = new THREE.BoxGeometry(1.86, 0.08, 0.91);
  const lidMesh = new THREE.Mesh(lidGeo, pbr.anodizedAluminum);
  lidMesh.position.set(0, 1.64, 0);
  lidMesh.castShadow = true;
  chassisGroup.add(lidMesh);

  // 4 Anti-vibration rubber damper feet
  const footGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.08, 16);
  const footPositions = [
    [-0.8, 0.04, -0.35],
    [0.8, 0.04, -0.35],
    [-0.8, 0.04, 0.35],
    [0.8, 0.04, 0.35],
  ];
  footPositions.forEach(([fx, fy, fz]) => {
    const foot = new THREE.Mesh(footGeo, pbr.fanPolymer);
    foot.position.set(fx, fy, fz);
    chassisGroup.add(foot);
  });

  group.add(chassisGroup);
  explodedParts.push({
    mesh: chassisGroup,
    basePos: chassisGroup.position.clone(),
    explodeDir: new THREE.Vector3(-0.4, 0, -0.4),
  });

  // ==========================================
  // PART 2: Aerodynamic Variable-Speed Fan & Cowl
  // ==========================================
  const fanGroup = new THREE.Group();
  fanGroup.position.set(-0.85, 0.95, 0.44);
  fanGroup.userData = { partId: 'fan', systemId: 'heat_pump' };

  // Protective outer cowl ring
  const cowlGeo = new THREE.TorusGeometry(0.55, 0.04, 16, 32);
  const cowlMesh = new THREE.Mesh(cowlGeo, pbr.anodizedAluminum);
  cowlMesh.castShadow = true;
  fanGroup.add(cowlMesh);

  // Fan Rotor Assembly (rotates)
  const rotorGroup = new THREE.Group();
  const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 24);
  hubGeo.rotateX(Math.PI / 2);
  const hubMesh = new THREE.Mesh(hubGeo, pbr.anodizedAluminum);
  rotorGroup.add(hubMesh);

  // 3 Aerodynamic Airfoil Blades
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const bladeGeo = new THREE.BoxGeometry(0.14, 0.42, 0.02);
    const bladeMesh = new THREE.Mesh(bladeGeo, pbr.fanPolymer);
    bladeMesh.position.set(
      Math.sin(angle) * 0.28,
      Math.cos(angle) * 0.28,
      0
    );
    bladeMesh.rotation.z = -angle;
    bladeMesh.rotation.y = 0.28; // Airfoil pitch
    rotorGroup.add(bladeMesh);
  }
  fanGroup.add(rotorGroup);

  group.add(fanGroup);
  explodedParts.push({
    mesh: fanGroup,
    basePos: fanGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 0, 1.2),
  });

  // ==========================================
  // PART 3: Scroll Compressor & Suction Accumulator
  // ==========================================
  const compGroup = new THREE.Group();
  compGroup.position.set(-1.25, 0.4, 0);
  compGroup.userData = { partId: 'compressor', systemId: 'heat_pump' };

  // Main hermetic scroll canister
  const canisterGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.72, 24);
  const canisterMesh = new THREE.Mesh(canisterGeo, pbr.stainlessSteel);
  canisterMesh.castShadow = true;
  compGroup.add(canisterMesh);

  // Top dome
  const domeGeo = new THREE.SphereGeometry(0.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMesh = new THREE.Mesh(domeGeo, pbr.stainlessSteel);
  domeMesh.position.y = 0.36;
  compGroup.add(domeMesh);

  // Suction accumulator (side canister)
  const accumGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.52, 16);
  const accumMesh = new THREE.Mesh(accumGeo, pbr.chassisPowderCoat);
  accumMesh.position.set(0.3, 0.05, 0.12);
  accumMesh.castShadow = true;
  compGroup.add(accumMesh);

  // U-tube copper connector
  const compPipeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.4, 0),
    new THREE.Vector3(0.15, 0.48, 0.06),
    new THREE.Vector3(0.3, 0.35, 0.12),
  ]);
  const compPipeGeo = new THREE.TubeGeometry(compPipeCurve, 16, 0.025, 12, false);
  const compPipeMesh = new THREE.Mesh(compPipeGeo, pbr.copperPipe);
  compGroup.add(compPipeMesh);

  group.add(compGroup);
  explodedParts.push({
    mesh: compGroup,
    basePos: compGroup.position.clone(),
    explodeDir: new THREE.Vector3(-1.0, 0, 0),
  });

  // ==========================================
  // PART 4: Hydrophilic Microchannel Condenser Coil
  // ==========================================
  const coilGroup = new THREE.Group();
  coilGroup.position.set(-0.85, 0.95, -0.42);
  coilGroup.userData = { partId: 'condenser_coil', systemId: 'heat_pump' };

  const coilGeo = new THREE.BoxGeometry(1.68, 1.4, 0.06);
  const coilMesh = new THREE.Mesh(coilGeo, pbr.condenserFin);
  coilMesh.castShadow = true;
  coilGroup.add(coilMesh);

  group.add(coilGroup);
  explodedParts.push({
    mesh: coilGroup,
    basePos: coilGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 0, -1.2),
  });

  // ==========================================
  // PART 5: Stratified Hydronic Thermal Buffer Tank (Indoor Unit)
  // ==========================================
  const tankGroup = new THREE.Group();
  tankGroup.position.set(1.1, 0.12, 0);
  tankGroup.userData = { partId: 'buffer_tank', systemId: 'heat_pump' };

  // Main insulated cylinder
  const tankGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.8, 32);
  const tankMesh = new THREE.Mesh(tankGeo, pbr.thermalInsulation);
  tankMesh.position.y = 0.9;
  tankMesh.castShadow = true;
  tankMesh.receiveShadow = true;
  tankGroup.add(tankMesh);

  // Top domed cap
  const tankCapGeo = new THREE.SphereGeometry(0.48, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const tankCapMesh = new THREE.Mesh(tankCapGeo, pbr.stainlessSteel);
  tankCapMesh.position.y = 1.8;
  tankGroup.add(tankCapMesh);

  // Automatic air vent on top
  const ventGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.14, 16);
  const ventMesh = new THREE.Mesh(ventGeo, pbr.brassFitting);
  ventMesh.position.y = 2.3;
  tankGroup.add(ventMesh);

  // Stainless steel decorative wrap bands
  const bandGeo = new THREE.CylinderGeometry(0.485, 0.485, 0.04, 32);
  const band1 = new THREE.Mesh(bandGeo, pbr.stainlessSteel);
  band1.position.y = 0.45;
  tankGroup.add(band1);
  const band2 = new THREE.Mesh(bandGeo, pbr.stainlessSteel);
  band2.position.y = 1.35;
  tankGroup.add(band2);

  group.add(tankGroup);
  explodedParts.push({
    mesh: tankGroup,
    basePos: tankGroup.position.clone(),
    explodeDir: new THREE.Vector3(0.9, 0, 0),
  });

  // ==========================================
  // PART 6: High-Efficiency ECM Hydronic Circulator Pump
  // ==========================================
  const pumpGroup = new THREE.Group();
  pumpGroup.position.set(0.45, 0.55, 0.35);
  pumpGroup.userData = { partId: 'circ_pump', systemId: 'heat_pump' };

  // Volute casting
  const voluteGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 16);
  const voluteMesh = new THREE.Mesh(voluteGeo, pbr.stainlessSteel);
  pumpGroup.add(voluteMesh);

  // Green ECM motor canister
  const motorGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.22, 24);
  motorGeo.rotateX(Math.PI / 2);
  const motorMesh = new THREE.Mesh(motorGeo, pbr.ledActiveGreen);
  motorMesh.position.set(0, 0, 0.14);
  pumpGroup.add(motorMesh);

  // Brass union nuts
  const nutGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 6);
  const nutTop = new THREE.Mesh(nutGeo, pbr.brassFitting);
  nutTop.position.y = 0.11;
  pumpGroup.add(nutTop);
  const nutBot = new THREE.Mesh(nutGeo, pbr.brassFitting);
  nutBot.position.y = -0.11;
  pumpGroup.add(nutBot);

  group.add(pumpGroup);
  explodedParts.push({
    mesh: pumpGroup,
    basePos: pumpGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, -0.2, 0.6),
  });

  // ==========================================
  // PART 7: Digital Inverter Controller & Telemetry
  // ==========================================
  const invGroup = new THREE.Group();
  invGroup.position.set(-0.45, 1.25, 0.44);
  invGroup.userData = { partId: 'inverter_controller', systemId: 'heat_pump' };

  // Inverter enclosure
  const invBoxGeo = new THREE.BoxGeometry(0.42, 0.55, 0.12);
  const invBoxMesh = new THREE.Mesh(invBoxGeo, pbr.anodizedAluminum);
  invBoxMesh.castShadow = true;
  invGroup.add(invBoxMesh);

  // Digital status display screen
  const screenGeo = new THREE.PlaneGeometry(0.32, 0.22);
  const screenMesh = new THREE.Mesh(screenGeo, pbr.ledActiveGreen);
  screenMesh.position.set(0, 0.08, 0.062);
  invGroup.add(screenMesh);

  // Cooling heatsink fins on rear
  for (let f = -0.16; f <= 0.16; f += 0.04) {
    const finGeo = new THREE.BoxGeometry(0.02, 0.5, 0.05);
    const finMesh = new THREE.Mesh(finGeo, pbr.stainlessSteel);
    finMesh.position.set(f, 0, -0.07);
    invGroup.add(finMesh);
  }

  group.add(invGroup);
  explodedParts.push({
    mesh: invGroup,
    basePos: invGroup.position.clone(),
    explodeDir: new THREE.Vector3(0.3, 0.3, 0.8),
  });

  // ==========================================
  // Interconnecting Hydronic & Refrigerant Piping
  // ==========================================
  const pipeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.6, 0.45, 0.1),
    new THREE.Vector3(0.0, 0.45, 0.2),
    new THREE.Vector3(0.45, 0.55, 0.35),
    new THREE.Vector3(0.8, 0.6, 0.2),
    new THREE.Vector3(0.95, 0.6, 0.0),
  ]);
  const pipeGeo = new THREE.TubeGeometry(pipeCurve, 32, 0.03, 12, false);
  const pipeMesh = new THREE.Mesh(pipeGeo, pbr.copperPipe);
  pipeMesh.castShadow = true;
  group.add(pipeMesh);

  // Animation update logic
  function update(delta: number, simParams: any) {
    // Rotate fan blades based on operating state
    rotorGroup.rotation.z += delta * 6.5;
  }

  // Exploded View Interpolation
  function setExploded(offset: number) {
    explodedParts.forEach(({ mesh, basePos, explodeDir }) => {
      mesh.position.copy(basePos).addScaledVector(explodeDir, offset);
    });
  }

  // Visual Mode Switcher (Realistic PBR vs Thermal Heatmap)
  function setVisualMode(mode: VisualMode) {
    if (mode === 'thermal') {
      cabinetMesh.material = thermal.thermalCool;
      cowlMesh.material = thermal.thermalCool;
      canisterMesh.material = thermal.thermalHotActive; // Compressor is hot
      coilMesh.material = thermal.thermalMedium;
      tankMesh.material = thermal.thermalColdLowLoss; // Well insulated
      motorMesh.material = thermal.thermalWarmLeak;
      pipeMesh.material = thermal.thermalWarmLeak;
    } else {
      // Restore PBR
      cabinetMesh.material = pbr.chassisPowderCoat;
      cowlMesh.material = pbr.anodizedAluminum;
      canisterMesh.material = pbr.stainlessSteel;
      coilMesh.material = pbr.condenserFin;
      tankMesh.material = pbr.thermalInsulation;
      motorMesh.material = pbr.ledActiveGreen;
      pipeMesh.material = pbr.copperPipe;
    }
  }

  function dispose() {
    // Geometries & materials cleanup
  }

  return {
    group,
    update,
    setExploded,
    setVisualMode,
    dispose,
  };
}
