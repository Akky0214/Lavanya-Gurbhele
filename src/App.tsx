import React, { useState, useRef, useEffect } from 'react';
import { SystemId, VisualMode, SimulationParams, ComponentSpec, WeatherEventType, ClimateRegionId, GridCarbonData } from './types/energy';
import { ENERGY_SYSTEMS } from './data/systemsData';
import { SceneManager } from './three/SceneManager';
import { ThreeCanvas } from './components/ThreeCanvas';
import { BottomControlDock } from './components/BottomControlDock';
import { HeaderNav } from './components/HeaderNav';
import { PartInspectorModal } from './components/PartInspectorModal';
import { SearchGroundingPanel } from './components/SearchGroundingPanel';
import { DeepDesignModal } from './components/DeepDesignModal';
import { QuickAuditModal } from './components/QuickAuditModal';
import { SystemConfiguratorModal } from './components/SystemConfiguratorModal';
import { SustainabilityScorecardModal } from './components/SustainabilityScorecardModal';
import { D3EnergyFlowDiagram } from './components/D3EnergyFlowDiagram';
import { LifecycleTrackerModal } from './components/LifecycleTrackerModal';
import { BlueprintPlacementModal } from './components/BlueprintPlacementModal';
import { ClimateAlertBanner } from './components/ClimateAlertBanner';
import { ClimateAlertModal } from './components/ClimateAlertModal';
import { GuidedTour } from './components/GuidedTour';
import { CarbonCalculatorModal } from './components/CarbonCalculatorModal';
import { SmartDeviceSimulatorModal } from './components/SmartDeviceSimulatorModal';
import { DailyEnergySummaryModal } from './components/DailyEnergySummaryModal';
import { CaptureSceneModal } from './components/CaptureSceneModal';
import { GlobalRenewableHeatmapModal } from './components/GlobalRenewableHeatmapModal';
import { GridCarbonModal } from './components/GridCarbonModal';
import { QuickWinsOverlay } from './components/QuickWinsOverlay';
import { ViewportTelemetryHUD } from './components/ViewportTelemetryHUD';
import { evaluateClimateResilience } from './data/climateAlertData';

export default function App() {
  const [currentSystemId, setCurrentSystemId] = useState<SystemId>('heat_pump');
  const [visualMode, setVisualMode] = useState<VisualMode>('realistic');
  const [explodedOffset, setExplodedOffset] = useState<number>(0);
  const [sunHour, setSunHour] = useState<number>(12);
  const [isCarbonCalcOpen, setIsCarbonCalcOpen] = useState(false);
  const [isTimeLapsePlaying, setIsTimeLapsePlaying] = useState<boolean>(false);
  const [timeLapseSpeed, setTimeLapseSpeed] = useState<number>(2);


  // Simulation Parameters state
  const [simParams, setSimParams] = useState<SimulationParams>(() => {
    let autoMitigate = false;
    try {
      autoMitigate = localStorage.getItem('ecotwin_auto_mitigate') === 'true';
    } catch {
      // ignore
    }
    return {
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
      thermalCapacityMultiplier: 1.0,
      autoMitigateClimateShocks: autoMitigate,
    };
  });

  // Modals & Overlay state
  const [selectedPartSpec, setSelectedPartSpec] = useState<ComponentSpec | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [isDeepDesignOpen, setIsDeepDesignOpen] = useState(false);
  const [isQuickAuditOpen, setIsQuickAuditOpen] = useState(false);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [isD3FlowOpen, setIsD3FlowOpen] = useState(false);
  const [isLifecycleOpen, setIsLifecycleOpen] = useState(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [isClimateAlertOpen, setIsClimateAlertOpen] = useState(false);
  const [initialAlertScenarioId, setInitialAlertScenarioId] = useState<WeatherEventType | undefined>(undefined);
  const [isSmartDevicesOpen, setIsSmartDevicesOpen] = useState(false);
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);
  const [isCaptureSceneOpen, setIsCaptureSceneOpen] = useState(false);
  const [isGlobalHeatmapOpen, setIsGlobalHeatmapOpen] = useState(false);
  const [isGridCarbonOpen, setIsGridCarbonOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Auto-launch Guided Tour for first-time visitors
  useEffect(() => {
    try {
      const tourCompleted = localStorage.getItem('ecotwin_tour_completed');
      if (!tourCompleted) {
        const timer = setTimeout(() => {
          setIsTourOpen(true);
        }, 750);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage restrictions
    }
  }, []);

  const handleCloseTour = (completed = false) => {
    setIsTourOpen(false);
    if (completed) {
      try {
        localStorage.setItem('ecotwin_tour_completed', 'true');
      } catch {
        // Ignore localStorage restrictions
      }
    }
  };

  const handleStartTour = () => {
    setIsTourOpen(true);
  };

  // Auto-resolve climate shocks if enabled from next time
  useEffect(() => {
    if (simParams.autoMitigateClimateShocks) {
      const assessment = evaluateClimateResilience(simParams, currentSystemId);
      if (assessment.isInsufficient) {
        const sizing = Object.keys(assessment.recommendedSizing).length > 0
          ? assessment.recommendedSizing
          : {
              thermalCapacityMultiplier: 1.45,
              heatPumpCop: 4.8,
              batteryCapacityKWh: 40,
            };
        setSimParams((prev) => ({
          ...prev,
          ...sizing,
        }));
      }
    }
  }, [simParams.climateRegion, currentSystemId, simParams.autoMitigateClimateShocks]);

  // Automated 24-hour time-lapse playback runner
  useEffect(() => {
    if (!isTimeLapsePlaying) return;

    const tickIntervalMs = 50;
    // 24 hours per full presentation cycle (scaled by timeLapseSpeed)
    const hoursPerTick = (24 / (36000 / timeLapseSpeed)) * tickIntervalMs;

    const timer = setInterval(() => {
      setSunHour((prev) => {
        const next = (prev + hoursPerTick) % 24;
        const rounded = Math.round(next * 100) / 100;
        setSimParams((p) => ({ ...p, sunAngleHour: rounded }));
        return rounded;
      });
    }, tickIntervalMs);

    return () => clearInterval(timer);
  }, [isTimeLapsePlaying, timeLapseSpeed]);

  const sceneManagerRef = useRef<SceneManager | null>(null);

  const currentSystem = ENERGY_SYSTEMS[currentSystemId];

  // Callback when a 3D component is clicked in Three.js scene
  const handleSelectComponent = (partId: string, systemId: SystemId) => {
    const sys = ENERGY_SYSTEMS[systemId];
    if (sys && sys.components[partId]) {
      setSelectedPartSpec(sys.components[partId]);
    }
  };

  const handleResetCamera = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.resetCameraToPreset();
    }
  };

  const handleUpdateParams = (updated: Partial<SimulationParams>) => {
    setSimParams((prev) => {
      const next = { ...prev, ...updated };
      if (updated.sunAngleHour !== undefined) {
        setSunHour(updated.sunAngleHour);
      }
      return next;
    });
  };

  const handleSunHourChange = (newHour: number) => {
    setSunHour(newHour);
    setSimParams((prev) => ({ ...prev, sunAngleHour: newHour }));
  };

  const handleExplodedChange = (offset: number) => {
    setExplodedOffset(offset);
    setSimParams((prev) => ({ ...prev, explodedOffset: offset }));
  };

  const handleSearchRebatesFromPart = (componentName: string) => {
    setSelectedPartSpec(null);
    setSearchInitialQuery(`Current tax rebates, utility incentives, and Energy Star efficiency standards for ${componentName}`);
    setIsSearchOpen(true);
  };

  const handleApplySiteClimate = (updates: {
    systemId?: SystemId;
    climateRegion: ClimateRegionId;
    ambientTempC: number;
    solarYieldMultiplier: number;
    utilityRatePerKWh?: number;
  }) => {
    if (updates.systemId) {
      setCurrentSystemId(updates.systemId);
    }
    handleUpdateParams({
      climateRegion: updates.climateRegion,
      ambientTempC: updates.ambientTempC,
      solarYieldMultiplier: updates.solarYieldMultiplier,
      ...(updates.utilityRatePerKWh !== undefined ? { utilityRatePerKWh: updates.utilityRatePerKWh } : {}),
    });
  };

  const handleUpdateGridCarbon = (gridData: GridCarbonData) => {
    handleUpdateParams({
      gridCarbonData: gridData,
      gridCarbonIntensityKgPerKWh: gridData.carbonIntensityKgPerKWh,
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Layer (100% full-bleed viewport) */}
      <ThreeCanvas
        currentSystemId={currentSystemId}
        visualMode={visualMode}
        explodedOffset={explodedOffset}
        simParams={simParams}
        onSelectComponent={handleSelectComponent}
        sceneManagerRef={sceneManagerRef}
      />

      {/* Floating 3D Viewport Live Telemetry HUD */}
      <ViewportTelemetryHUD
        currentSystemId={currentSystemId}
        simParams={simParams}
      />

      {/* Top Header Navigation */}
      <HeaderNav
        currentSystem={currentSystem}
        simParams={simParams}
        onOpenSearch={() => {
          setSearchInitialQuery('');
          setIsSearchOpen(true);
        }}
        onOpenDeepDesign={() => setIsDeepDesignOpen(true)}
        onOpenQuickAudit={() => setIsQuickAuditOpen(true)}
        onOpenConfigurator={() => setIsConfiguratorOpen(true)}
        onOpenScorecard={() => setIsScorecardOpen(true)}
        onOpenLifecycleTracker={() => setIsLifecycleOpen(true)}
        onOpenBlueprintStudio={() => setIsBlueprintModalOpen(true)}
        onOpenClimateAlert={() => setIsClimateAlertOpen(true)}
        onOpenCarbonCalc={() => setIsCarbonCalcOpen(true)}
        onOpenSmartDevices={() => setIsSmartDevicesOpen(true)}
        onOpenDailyReport={() => setIsDailyReportOpen(true)}
        onOpenCaptureScene={() => setIsCaptureSceneOpen(true)}
        onOpenGlobalHeatmap={() => setIsGlobalHeatmapOpen(true)}
        onOpenGridCarbon={() => setIsGridCarbonOpen(true)}
        onStartTour={handleStartTour}
      />

      {/* Real-time Climate Alert & Weather Resilience Banner */}
      <ClimateAlertBanner
        simParams={simParams}
        currentSystemId={currentSystemId}
        onOpenAlertModal={(scenarioId) => {
          if (scenarioId) setInitialAlertScenarioId(scenarioId);
          setIsClimateAlertOpen(true);
        }}
        onApplyMitigation={handleUpdateParams}
      />

      {/* Collapsible Unified Bottom Control Dock */}
      <BottomControlDock
        currentSystemId={currentSystemId}
        onSelectSystem={setCurrentSystemId}
        visualMode={visualMode}
        onChangeVisualMode={(mode) => {
          setVisualMode(mode);
          if (mode === 'energy_flow') {
            setIsD3FlowOpen(true);
          }
        }}
        explodedOffset={explodedOffset}
        onChangeExplodedOffset={handleExplodedChange}
        sunHour={sunHour}
        onChangeSunHour={handleSunHourChange}
        onResetCamera={handleResetCamera}
        onOpenConfigurator={() => setIsConfiguratorOpen(true)}
        onOpenScorecard={() => setIsScorecardOpen(true)}
        onOpenLifecycleTracker={() => setIsLifecycleOpen(true)}
        onOpenBlueprintStudio={() => setIsBlueprintModalOpen(true)}
        onOpenClimateAlert={() => setIsClimateAlertOpen(true)}
        onOpenCarbonCalc={() => setIsCarbonCalcOpen(true)}
        onOpenSmartDevices={() => setIsSmartDevicesOpen(true)}
        onOpenDailyReport={() => setIsDailyReportOpen(true)}
        onOpenCaptureScene={() => setIsCaptureSceneOpen(true)}
        onOpenGlobalHeatmap={() => setIsGlobalHeatmapOpen(true)}
        onOpenGridCarbon={() => setIsGridCarbonOpen(true)}
        isD3FlowOpen={isD3FlowOpen}
        onToggleD3Flow={() => setIsD3FlowOpen(!isD3FlowOpen)}
        onStartTour={handleStartTour}
        isTimeLapsePlaying={isTimeLapsePlaying}
        onToggleTimeLapse={() => setIsTimeLapsePlaying((prev) => !prev)}
        timeLapseSpeed={timeLapseSpeed}
        onChangeTimeLapseSpeed={setTimeLapseSpeed}
      />


      {/* D3.js Real-Time Energy Flow Sankey Bus Overlay */}
      <D3EnergyFlowDiagram
        simParams={simParams}
        currentSystemId={currentSystemId}
        onUpdateSunHour={handleSunHourChange}
        isOpen={isD3FlowOpen}
        onToggle={() => setIsD3FlowOpen(!isD3FlowOpen)}
        onOpenSmartDevices={() => setIsSmartDevicesOpen(true)}
        onOpenDailyReport={() => setIsDailyReportOpen(true)}
        onOpenGlobalHeatmap={() => setIsGlobalHeatmapOpen(true)}
      />

      {/* 3D Part Inspector Modal */}
      <PartInspectorModal
        spec={selectedPartSpec}
        onClose={() => setSelectedPartSpec(null)}
        onSearchRebates={handleSearchRebatesFromPart}
      />

      {/* Google Search Grounding Modal (gemini-3.8-flash) */}
      <SearchGroundingPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        initialQuery={searchInitialQuery}
      />

      {/* Deep System Engineering Design Modal (gemini-4-argon with High Thinking) */}
      <DeepDesignModal
        isOpen={isDeepDesignOpen}
        onClose={() => setIsDeepDesignOpen(false)}
        simParams={simParams}
      />

      {/* Quick Appliance & Upgrade Audit Modal (gemini-3.1-flash-lite) */}
      <QuickAuditModal
        isOpen={isQuickAuditOpen}
        onClose={() => setIsQuickAuditOpen(false)}
      />

      {/* Interactive System Configurator & ROI Simulator */}
      <SystemConfiguratorModal
        isOpen={isConfiguratorOpen}
        onClose={() => setIsConfiguratorOpen(false)}
        simParams={simParams}
        onUpdateParams={handleUpdateParams}
        onOpenScorecard={() => setIsScorecardOpen(true)}
        onOpenLifecycleTracker={() => setIsLifecycleOpen(true)}
        onOpenClimateAlert={() => setIsClimateAlertOpen(true)}
        onOpenSmartDevices={() => setIsSmartDevicesOpen(true)}
      />

      {/* Sustainability Scorecard PDF-Like Modal with AI Optimization */}
      <SustainabilityScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        system={currentSystem}
        simParams={simParams}
        onApplyOptimization={handleUpdateParams}
      />

      {/* 20-Year System Lifecycle, Degradation & ROI Tracker (D3.js Line Chart) */}
      <LifecycleTrackerModal
        isOpen={isLifecycleOpen}
        onClose={() => setIsLifecycleOpen(false)}
        systemId={currentSystemId}
        simParams={simParams}
        onSelectSystem={setCurrentSystemId}
        onUpdateParams={handleUpdateParams}
      />

      {/* Interactive Home Blueprint & Site Plan Placement Studio */}
      <BlueprintPlacementModal
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
        currentSystemId={currentSystemId}
        simParams={simParams}
      />

      {/* Real-time Climate Alert & Extreme Weather Stress Studio Modal */}
      <ClimateAlertModal
        isOpen={isClimateAlertOpen}
        onClose={() => setIsClimateAlertOpen(false)}
        simParams={simParams}
        currentSystemId={currentSystemId}
        initialScenarioId={initialAlertScenarioId}
        onUpdateParams={handleUpdateParams}
      />

      {/* Carbon Footprint & Decarbonization Calculator Modal */}
      <CarbonCalculatorModal
        isOpen={isCarbonCalcOpen}
        onClose={() => setIsCarbonCalcOpen(false)}
        system={currentSystem}
        simParams={simParams}
        onUpdateParams={handleUpdateParams}
        onOpenGridCarbon={() => setIsGridCarbonOpen(true)}
      />

      {/* Virtual Smart Device & Appliance Integration Simulator */}
      <SmartDeviceSimulatorModal
        isOpen={isSmartDevicesOpen}
        onClose={() => setIsSmartDevicesOpen(false)}
        simParams={simParams}
        onUpdateParams={handleUpdateParams}
        onOpenFlowDiagram={() => setIsD3FlowOpen(true)}
      />

      {/* Daily Energy Performance Summary & PDF Export Report */}
      <DailyEnergySummaryModal
        isOpen={isDailyReportOpen}
        onClose={() => setIsDailyReportOpen(false)}
        system={currentSystem}
        simParams={simParams}
        onOpenSmartDevices={() => setIsSmartDevicesOpen(true)}
      />

      {/* 3D Scene Snapshot & High-Resolution Branded Export Modal */}
      <CaptureSceneModal
        isOpen={isCaptureSceneOpen}
        onClose={() => setIsCaptureSceneOpen(false)}
        system={currentSystem}
        simParams={simParams}
        sceneManagerRef={sceneManagerRef}
      />

      {/* Interactive Global Renewable Energy Heatmap D3 Visualization Modal */}
      <GlobalRenewableHeatmapModal
        isOpen={isGlobalHeatmapOpen}
        onClose={() => setIsGlobalHeatmapOpen(false)}
        currentSystemId={currentSystemId}
        simParams={simParams}
        onApplySiteClimate={handleApplySiteClimate}
      />

      {/* Local Energy Grid Carbon Intensity Studio Modal */}
      <GridCarbonModal
        isOpen={isGridCarbonOpen}
        onClose={() => setIsGridCarbonOpen(false)}
        simParams={simParams}
        onUpdateGridCarbon={handleUpdateGridCarbon}
      />

      {/* Context-Aware Actionable Quick Wins Notification Overlay */}
      <QuickWinsOverlay
        simParams={simParams}
        currentSystemId={currentSystemId}
        onApplyQuickWin={handleUpdateParams}
      />

      {/* Lightweight Localized Interactive Guided Tour */}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={handleCloseTour}
      />
    </div>
  );
}

