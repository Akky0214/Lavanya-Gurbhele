import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SystemId, VisualMode, SimulationParams } from '../types/energy';
import { createHeatPumpSystem, ProceduralSystemInstance } from './models/heatPump';
import { createSmartBuildingSystem } from './models/smartBuilding';
import { createResidentialMicrogridSystem } from './models/residentialMicrogrid';
import { createIndustrialWHRSSystem } from './models/industrialWHRS';
import { createEnergyFlowParticles, EnergyFlowParticlesInstance } from './energyParticles';

export interface SceneManagerOptions {
  container: HTMLDivElement;
  onSelectComponent: (partId: string, systemId: SystemId) => void;
}

export class SceneManager {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;
  private pmremGenerator: THREE.PMREMGenerator;

  private isSoftwareGl: boolean;
  private frameId = 0;
  private lastTime = performance.now();

  // Active procedural models
  private currentSystemId: SystemId = 'heat_pump';
  private systemInstances: Partial<Record<SystemId, ProceduralSystemInstance>> = {};
  private energyParticles: EnergyFlowParticlesInstance;

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private onSelectComponent: (partId: string, systemId: SystemId) => void;

  // Camera animation target
  private cameraTargetPos: THREE.Vector3 | null = null;
  private cameraLookTarget: THREE.Vector3 | null = null;

  // State
  private currentMode: VisualMode = 'realistic';
  private currentExplodedOffset = 0;
  private simParams: SimulationParams = {
    sunAngleHour: 12,
    ambientTempC: 22,
    buildingSizeSqFt: 2400,
    solarCapacityKW: 8.5,
    batteryCapacityKWh: 13.5,
    utilityRatePerKWh: 0.18,
    monthlyBaselineBill: 320,
    heatPumpCop: 4.2,
    smartShadingActive: true,
    explodedOffset: 0,
    climateRegion: 'temperate',
    solarYieldMultiplier: 1.0,
  };

  constructor(options: SceneManagerOptions) {
    this.container = options.container;
    this.onSelectComponent = options.onSelectComponent;

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Setup WebGLRenderer with PBR standards
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Horizon Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.035);

    // 4. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(4.8, 3.2, 5.5);

    // 5. OrbitControls with Damping
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath ground pad
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 22.0;
    this.controls.target.set(0, 1.2, 0);

    // 6. Mandatory Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.scene.environment = this.pmremGenerator.fromScene(roomEnv, 0.04).texture;
    this.pmremGenerator.dispose();

    // 7. Studio 3-Point Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.85);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    this.keyLight.position.set(5.0, 7.5, 4.0);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 25;
    const d = 4.5;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    this.rimLight.position.set(-5.0, 4.0, -4.0);
    this.scene.add(this.rimLight);

    // 8. Ground Reference Grid
    const grid = new THREE.GridHelper(20, 20, 0x1e293b, 0x0f172a);
    grid.position.y = 0.001;
    this.scene.add(grid);

    // 9. Energy Flow Particles
    this.energyParticles = createEnergyFlowParticles(220);
    this.scene.add(this.energyParticles.points);

    // 10. Load Initial System
    this.switchSystem('heat_pump');

    // 11. Event Listeners
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);

    // Pre-warm shader pipeline once
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // 12. Start Animation Loop
    this.startLoop();
  }

  // Animation Loop with Software WebGL afterDraw Pacing
  private startLoop = () => {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      const now = performance.now();
      const delta = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      // Camera smooth target transition
      if (this.cameraTargetPos) {
        this.camera.position.lerp(this.cameraTargetPos, delta * 3.5);
        if (this.camera.position.distanceTo(this.cameraTargetPos) < 0.05) {
          this.cameraTargetPos = null;
        }
      }
      if (this.cameraLookTarget) {
        this.controls.target.lerp(this.cameraLookTarget, delta * 3.5);
        if (this.controls.target.distanceTo(this.cameraLookTarget) < 0.05) {
          this.cameraLookTarget = null;
        }
      }

      this.controls.update();

      // Update active model instance
      const activeInst = this.systemInstances[this.currentSystemId];
      if (activeInst) {
        activeInst.update(delta, this.simParams);
      }

      // Update energy flow particles with real-time simulation params and active system
      this.energyParticles.update(delta, this.simParams, this.currentSystemId);

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    tick();
  };

  public switchSystem(sysId: SystemId) {
    // Hide all currently loaded systems
    Object.values(this.systemInstances).forEach((inst) => {
      if (inst) inst.group.visible = false;
    });

    this.currentSystemId = sysId;
    this.energyParticles.setSystemId(sysId);

    // Lazy instantiate system if not already created
    if (!this.systemInstances[sysId]) {
      const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
      switch (sysId) {
        case 'heat_pump':
          this.systemInstances[sysId] = createHeatPumpSystem(maxAnisotropy);
          break;
        case 'smart_building':
          this.systemInstances[sysId] = createSmartBuildingSystem(maxAnisotropy);
          break;
        case 'residential_microgrid':
          this.systemInstances[sysId] = createResidentialMicrogridSystem(maxAnisotropy);
          break;
        case 'industrial_whrs':
          this.systemInstances[sysId] = createIndustrialWHRSSystem(maxAnisotropy);
          break;
      }
      if (this.systemInstances[sysId]) {
        this.scene.add(this.systemInstances[sysId]!.group);
      }
    }

    const current = this.systemInstances[sysId];
    if (current) {
      current.group.visible = true;
      current.setExploded(this.currentExplodedOffset);
      current.setVisualMode(this.currentMode);
    }

    // Adjust camera to optimal preset
    this.resetCameraToPreset();
  }

  public resetCameraToPreset() {
    switch (this.currentSystemId) {
      case 'heat_pump':
        this.setCameraTarget(new THREE.Vector3(4.8, 3.2, 5.5), new THREE.Vector3(0, 1.2, 0));
        break;
      case 'smart_building':
        this.setCameraTarget(new THREE.Vector3(7.5, 6.0, 8.5), new THREE.Vector3(0, 2.5, 0));
        break;
      case 'residential_microgrid':
        this.setCameraTarget(new THREE.Vector3(5.8, 3.8, 6.2), new THREE.Vector3(0, 1.4, 0));
        break;
      case 'industrial_whrs':
        this.setCameraTarget(new THREE.Vector3(7.2, 4.5, 7.8), new THREE.Vector3(0, 1.8, 0));
        break;
    }
  }

  public setCameraTarget(pos: THREE.Vector3, target: THREE.Vector3) {
    this.cameraTargetPos = pos;
    this.cameraLookTarget = target;
  }

  public setExplodedOffset(offset: number) {
    this.currentExplodedOffset = offset;
    const inst = this.systemInstances[this.currentSystemId];
    if (inst) {
      inst.setExploded(offset);
    }
  }

  public setVisualMode(mode: VisualMode) {
    this.currentMode = mode;
    const inst = this.systemInstances[this.currentSystemId];
    if (inst) {
      inst.setVisualMode(mode);
    }
    this.energyParticles.setVisible(mode === 'energy_flow');
  }

  public updateSimParams(params: Partial<SimulationParams>) {
    this.simParams = { ...this.simParams, ...params };

    // Update atmospheric lighting and fog based on Climate Context
    if (params.climateRegion !== undefined) {
      const region = params.climateRegion;
      let fogHex = 0x090d16;
      let hemiSkyHex = 0xe0f2fe;

      if (region === 'desert') {
        fogHex = 0x18130e; // warm dry haze
        hemiSkyHex = 0xfef3c7;
        this.keyLight.color.setHex(0xfffae8);
      } else if (region === 'arctic') {
        fogHex = 0x071120; // frosty subpolar
        hemiSkyHex = 0xbae6fd;
        this.keyLight.color.setHex(0xf0f9ff);
      } else if (region === 'tropical') {
        fogHex = 0x0b1717; // humid equatorial
        hemiSkyHex = 0xdcfce7;
        this.keyLight.color.setHex(0xf8fafc);
      } else if (region === 'maritime') {
        fogHex = 0x0e141c; // overcast coastal
        hemiSkyHex = 0xe2e8f0;
        this.keyLight.color.setHex(0xe2e8f0);
      } else if (region === 'alpine') {
        fogHex = 0x0a0f1d; // crisp high-altitude
        hemiSkyHex = 0xede9fe;
        this.keyLight.color.setHex(0xffffff);
      }

      this.scene.background = new THREE.Color(fogHex);
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.setHex(fogHex);
      }
      this.hemiLight.color.setHex(hemiSkyHex);
    }

    // Update 24-Hour Day-Night Cycle: Solar Sun, Lunar Moon & Atmospheric Lighting
    if (
      params.sunAngleHour !== undefined ||
      params.solarYieldMultiplier !== undefined ||
      params.climateRegion !== undefined
    ) {
      const hour = this.simParams.sunAngleHour; // 0.0 to 24.0
      const isDay = hour >= 5.5 && hour <= 18.5;
      const yieldMult = this.simParams.solarYieldMultiplier ?? 1.0;

      if (isDay) {
        // Daytime: Sun rises in East (~6:00), peaks at zenith (12:00), sets in West (~18:00)
        const sunNorm = (hour - 5.5) / 13.0; // 0.0 at dawn to 1.0 at dusk
        const sunRad = sunNorm * Math.PI; // 0 to PI
        const x = Math.cos(sunRad) * 9.5;
        const y = Math.max(Math.sin(sunRad) * 10.5, 1.2);
        const z = Math.sin(sunRad) * 4.2;
        this.keyLight.position.set(x, y, z);

        // Sinusoidal daytime solar intensity
        const sunSin = Math.sin(sunRad);
        const baseIntensity = Math.max(sunSin * 2.8, 0.45);
        this.keyLight.intensity = baseIntensity * Math.min(1.4, Math.max(0.7, yieldMult));

        // Color temperature shifts: golden sunrise, white midday, warm crimson sunset
        if (hour < 7.5) {
          // Dawn / Sunrise: warm golden amber with rose morning tint
          const t = Math.max(0, (hour - 5.5) / 2.0);
          this.keyLight.color.setRGB(1.0, 0.65 + 0.3 * t, 0.4 + 0.55 * t);
        } else if (hour > 16.5) {
          // Sunset / Golden Hour: rich sunset amber-orange
          const t = Math.max(0, (hour - 16.5) / 2.0);
          this.keyLight.color.setRGB(1.0, 0.95 - 0.4 * t, 0.95 - 0.6 * t);
        } else {
          // Midday: crisp solar white
          this.keyLight.color.setHex(0xffffff);
        }

        // Daytime ambient sky
        this.hemiLight.intensity = 0.85;
      } else {
        // Nighttime: Moon traverses the night sky (East to West)
        const nightHour = hour < 5.5 ? hour + 24 : hour; // 18.5 to 29.5 (center 24 is midnight)
        const moonNorm = (nightHour - 18.5) / 11.0;
        const moonRad = moonNorm * Math.PI;
        const mx = -Math.cos(moonRad) * 7.5;
        const my = Math.max(Math.sin(moonRad) * 8.5, 2.0);
        const mz = -Math.sin(moonRad) * 5.0;
        this.keyLight.position.set(mx, my, mz);

        // Soft cool lunar intensity
        const moonSin = Math.sin(moonRad);
        this.keyLight.intensity = Math.max(0.35, moonSin * 0.75);
        // Cool silvery-blue lunar moonlight
        this.keyLight.color.setHex(0xa5b4fc);

        // Nighttime ambient sky: dimmed deep indigo
        this.hemiLight.intensity = 0.32;
      }

      // Atmospheric Horizon Fog & Scene Background across 24h
      let bgHex = 0x090d16;
      if (hour < 5.0 || hour > 20.0) {
        // Deep Midnight Obsidian Space
        bgHex = 0x030712;
      } else if (hour >= 5.0 && hour < 7.0) {
        // Sunrise Dawn Haze
        bgHex = 0x1a1224;
      } else if (hour >= 7.0 && hour < 17.5) {
        // Daytime (calibrated by climate region)
        const region = this.simParams.climateRegion;
        if (region === 'desert') bgHex = 0x18130e;
        else if (region === 'arctic') bgHex = 0x071120;
        else if (region === 'tropical') bgHex = 0x0b1717;
        else if (region === 'maritime') bgHex = 0x0e141c;
        else if (region === 'alpine') bgHex = 0x0a0f1d;
        else bgHex = 0x090d16;
      } else {
        // Sunset Twilight (17.5 to 20.0)
        bgHex = 0x221226;
      }

      this.scene.background = new THREE.Color(bgHex);
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.setHex(bgHex);
      }

      // Rim & Building Interior Night Emissive Accent
      const isNight = hour < 6.0 || hour > 18.5;
      this.rimLight.intensity = isNight ? 1.5 : 0.85;
      this.rimLight.color.setHex(isNight ? 0x38bdf8 : 0x06b6d4);
    }
  }

  private onPointerUp = (event: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const activeInst = this.systemInstances[this.currentSystemId];
    if (!activeInst) return;

    const intersects = this.raycaster.intersectObjects(activeInst.group.children, true);
    if (intersects.length > 0) {
      // Traverse upward to find tagged part
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.userData?.partId && obj.parent && obj !== activeInst.group) {
        obj = obj.parent;
      }

      if (obj && obj.userData?.partId) {
        this.onSelectComponent(obj.userData.partId, this.currentSystemId);
      }
    }
  };

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public captureSnapshot(options?: { width?: number; height?: number }): string {
    const originalWidth = this.container.clientWidth || window.innerWidth;
    const originalHeight = this.container.clientHeight || window.innerHeight;
    const targetWidth = options?.width || Math.min(2560, Math.max(1920, originalWidth * 1.5));
    const targetHeight = options?.height || Math.round(targetWidth / (this.camera.aspect || 16 / 9));

    // Temporarily adjust projection & render target for high-definition render
    this.camera.aspect = targetWidth / targetHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(targetWidth, targetHeight, false);
    this.renderer.render(this.scene, this.camera);

    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    // Restore viewport display bounds
    this.camera.aspect = originalWidth / originalHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(originalWidth, originalHeight);
    this.renderer.render(this.scene, this.camera);

    return dataUrl;
  }

  public dispose() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    Object.values(this.systemInstances).forEach((inst) => inst?.dispose());
    this.energyParticles.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
