import * as THREE from 'three';
import { createStudioPBRMaterials, createThermalMaterials } from '../materials';
import { VisualMode } from '../../types/energy';
import { ProceduralSystemInstance } from './heatPump';

export function createIndustrialWHRSSystem(maxAnisotropy = 4): ProceduralSystemInstance {
  const group = new THREE.Group();
  group.name = 'industrial_whrs_system';

  const pbr = createStudioPBRMaterials(maxAnisotropy);
  const thermal = createThermalMaterials();

  const explodedParts: Array<{
    mesh: THREE.Object3D;
    basePos: THREE.Vector3;
    explodeDir: THREE.Vector3;
  }> = [];

  // Heavy Equipment Pad (y = 0)
  const padGeo = new THREE.BoxGeometry(5.6, 0.12, 3.8);
  const padMesh = new THREE.Mesh(padGeo, pbr.concretePad);
  padMesh.position.set(0, 0.06, 0);
  padMesh.receiveShadow = true;
  group.add(padMesh);

  // Soft Contact Ground Shadow
  const shadowGeo = new THREE.PlaneGeometry(6.4, 4.4);
  const shadowMesh = new THREE.Mesh(shadowGeo, pbr.contactShadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.125, 0);
  group.add(shadowMesh);

  // Structural Steel I-Beam Skid Base
  const skidGroup = new THREE.Group();
  skidGroup.position.set(0, 0.18, 0);
  const beamGeo = new THREE.BoxGeometry(4.8, 0.12, 0.1);
  [-1.4, 1.4].forEach((z) => {
    const beam = new THREE.Mesh(beamGeo, pbr.chassisPowderCoat);
    beam.position.set(0, 0, z);
    skidGroup.add(beam);
  });
  group.add(skidGroup);

  // ==========================================
  // PART 1: Insulated High-Temp Flue Gas Diverter Duct
  // ==========================================
  const flueGroup = new THREE.Group();
  flueGroup.position.set(-1.6, 1.2, 0);
  flueGroup.userData = { partId: 'exhaust_flue', systemId: 'industrial_whrs' };

  // Vertical industrial chimney stack
  const stackGeo = new THREE.CylinderGeometry(0.35, 0.35, 2.2, 24);
  const stackMesh = new THREE.Mesh(stackGeo, pbr.chassisPowderCoat);
  stackMesh.castShadow = true;
  flueGroup.add(stackMesh);

  // Horizontal diverter duct branching out
  const branchGeo = new THREE.CylinderGeometry(0.24, 0.24, 1.1, 24);
  branchGeo.rotateZ(Math.PI / 2);
  const branchMesh = new THREE.Mesh(branchGeo, pbr.stainlessSteel);
  branchMesh.position.set(0.6, 0.2, 0);
  branchMesh.castShadow = true;
  flueGroup.add(branchMesh);

  // Modulating damper actuator box
  const actGeo = new THREE.BoxGeometry(0.22, 0.25, 0.22);
  const actMesh = new THREE.Mesh(actGeo, pbr.ledEnergyCyan);
  actMesh.position.set(0.6, 0.45, 0.15);
  flueGroup.add(actMesh);

  group.add(flueGroup);
  explodedParts.push({
    mesh: flueGroup,
    basePos: flueGroup.position.clone(),
    explodeDir: new THREE.Vector3(-1.0, 0, 0),
  });

  // ==========================================
  // PART 2: Heavy-Duty Shell-and-Tube Vaporizer
  // ==========================================
  const vprGroup = new THREE.Group();
  vprGroup.position.set(0.0, 0.9, 0);
  vprGroup.userData = { partId: 'heat_exchanger', systemId: 'industrial_whrs' };

  // Main horizontal pressure vessel shell
  const shellGeo = new THREE.CylinderGeometry(0.48, 0.48, 2.2, 32);
  shellGeo.rotateZ(Math.PI / 2);
  const shellMesh = new THREE.Mesh(shellGeo, pbr.stainlessSteel);
  shellMesh.castShadow = true;
  vprGroup.add(shellMesh);

  // Domed end caps (flanged heads)
  const capGeo = new THREE.SphereGeometry(0.48, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  capGeo.rotateZ(-Math.PI / 2);
  const capLeft = new THREE.Mesh(capGeo, pbr.anodizedAluminum);
  capLeft.position.set(-1.1, 0, 0);
  vprGroup.add(capLeft);

  const capGeoRight = capGeo.clone();
  capGeoRight.rotateZ(Math.PI);
  const capRight = new THREE.Mesh(capGeoRight, pbr.anodizedAluminum);
  capRight.position.set(1.1, 0, 0);
  vprGroup.add(capRight);

  // Saddle support brackets
  [-0.6, 0.6].forEach((x) => {
    const saddleGeo = new THREE.BoxGeometry(0.12, 0.55, 0.85);
    const saddleMesh = new THREE.Mesh(saddleGeo, pbr.chassisPowderCoat);
    saddleMesh.position.set(x, -0.4, 0);
    saddleMesh.castShadow = true;
    vprGroup.add(saddleMesh);
  });

  group.add(vprGroup);
  explodedParts.push({
    mesh: vprGroup,
    basePos: vprGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 0, -1.0),
  });

  // ==========================================
  // PART 3: High-Speed ORC Expansion Turbine & Generator
  // ==========================================
  const turbGroup = new THREE.Group();
  turbGroup.position.set(1.6, 0.9, 0.4);
  turbGroup.userData = { partId: 'orc_turbine', systemId: 'industrial_whrs' };

  // Volute casing for radial expander
  const voluteGeo = new THREE.TorusGeometry(0.24, 0.12, 16, 24);
  const voluteMesh = new THREE.Mesh(voluteGeo, pbr.stainlessSteel);
  voluteMesh.castShadow = true;
  turbGroup.add(voluteMesh);

  // High-frequency generator housing
  const genGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.75, 24);
  genGeo.rotateX(Math.PI / 2);
  const genMesh = new THREE.Mesh(genGeo, pbr.anodizedAluminum);
  genMesh.position.set(0, 0, 0.45);
  genMesh.castShadow = true;
  turbGroup.add(genMesh);

  // Grid-tie power electronic inverter box
  const invBoxGeo = new THREE.BoxGeometry(0.35, 0.45, 0.2);
  const invBoxMesh = new THREE.Mesh(invBoxGeo, pbr.ledActiveGreen);
  invBoxMesh.position.set(0.35, 0.1, 0.45);
  turbGroup.add(invBoxMesh);

  group.add(turbGroup);
  explodedParts.push({
    mesh: turbGroup,
    basePos: turbGroup.position.clone(),
    explodeDir: new THREE.Vector3(1.2, 0, 0.6),
  });

  // ==========================================
  // PART 4: Air-Cooled ORC Condenser Bank
  // ==========================================
  const condGroup = new THREE.Group();
  condGroup.position.set(0, 2.0, 0);
  condGroup.userData = { partId: 'condenser_bank', systemId: 'industrial_whrs' };

  // Finned coil V-bank
  const finBankGeo = new THREE.BoxGeometry(2.4, 0.4, 1.4);
  const finBankMesh = new THREE.Mesh(finBankGeo, pbr.condenserFin);
  finBankMesh.castShadow = true;
  condGroup.add(finBankMesh);

  // Top induced draft fans (2 fans)
  const fanRotors: THREE.Mesh[] = [];
  [-0.6, 0.6].forEach((x) => {
    const cowlGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.18, 24);
    const cowlMesh = new THREE.Mesh(cowlGeo, pbr.anodizedAluminum);
    cowlMesh.position.set(x, 0.3, 0);
    condGroup.add(cowlMesh);

    const fBladeGeo = new THREE.BoxGeometry(0.65, 0.02, 0.1);
    const fBlade = new THREE.Mesh(fBladeGeo, pbr.fanPolymer);
    fBlade.position.set(x, 0.3, 0);
    condGroup.add(fBlade);
    fanRotors.push(fBlade);
  });

  group.add(condGroup);
  explodedParts.push({
    mesh: condGroup,
    basePos: condGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, 1.2, 0),
  });

  // ==========================================
  // PART 5: Hermetic Working Fluid Feed Pump
  // ==========================================
  const pumpGroup = new THREE.Group();
  pumpGroup.position.set(0.6, 0.42, 1.0);
  pumpGroup.userData = { partId: 'feed_pump', systemId: 'industrial_whrs' };

  const pBodyGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.45, 16);
  pBodyGeo.rotateZ(Math.PI / 2);
  const pBodyMesh = new THREE.Mesh(pBodyGeo, pbr.stainlessSteel);
  pumpGroup.add(pBodyMesh);

  const pMotorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 16);
  pMotorGeo.rotateZ(Math.PI / 2);
  const pMotorMesh = new THREE.Mesh(pMotorGeo, pbr.ledEnergyCyan);
  pMotorMesh.position.set(0.38, 0, 0);
  pumpGroup.add(pMotorMesh);

  group.add(pumpGroup);
  explodedParts.push({
    mesh: pumpGroup,
    basePos: pumpGroup.position.clone(),
    explodeDir: new THREE.Vector3(0, -0.2, 1.0),
  });

  // Connective high-temp piping loop
  const loopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.1, 0.9, 0),
    new THREE.Vector3(1.4, 0.9, 0.2),
    new THREE.Vector3(1.6, 0.9, 0.4),
    new THREE.Vector3(1.6, 1.6, 0.2),
    new THREE.Vector3(1.2, 2.0, 0),
  ]);
  const loopGeo = new THREE.TubeGeometry(loopCurve, 24, 0.035, 12, false);
  const loopMesh = new THREE.Mesh(loopGeo, pbr.stainlessSteel);
  group.add(loopMesh);

  function update(delta: number, _simParams: any) {
    // Spin cooling tower fans
    fanRotors.forEach((f) => {
      f.rotation.y += delta * 5.0;
    });
  }

  function setExploded(offset: number) {
    explodedParts.forEach(({ mesh, basePos, explodeDir }) => {
      mesh.position.copy(basePos).addScaledVector(explodeDir, offset);
    });
  }

  function setVisualMode(mode: VisualMode) {
    if (mode === 'thermal') {
      stackMesh.material = thermal.thermalHotActive; // 400°C flue gas
      shellMesh.material = thermal.thermalHotActive; // High-pressure superheated vapor
      voluteMesh.material = thermal.thermalMedium; // Expansion cooling
      finBankMesh.material = thermal.thermalCool; // Rejection to ambient
      pBodyMesh.material = thermal.thermalCool; // Subcooled liquid
    } else {
      stackMesh.material = pbr.chassisPowderCoat;
      shellMesh.material = pbr.stainlessSteel;
      voluteMesh.material = pbr.stainlessSteel;
      finBankMesh.material = pbr.condenserFin;
      pBodyMesh.material = pbr.stainlessSteel;
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
