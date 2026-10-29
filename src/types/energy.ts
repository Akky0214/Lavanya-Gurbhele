export type SystemId = 'heat_pump' | 'smart_building' | 'residential_microgrid' | 'industrial_whrs';

export type VisualMode = 'realistic' | 'thermal' | 'energy_flow';

export interface ComponentSpec {
  id: string;
  name: string;
  category: string;
  description: string;
  efficiencyMetric: string;
  powerRating: string;
  co2Reduction: string;
  lifecycle: string;
  estimatedCost: string;
  keyTech: string[];
}

export interface EnergySystemMeta {
  id: SystemId;
  name: string;
  subtitle: string;
  sector: 'Residential' | 'Commercial' | 'Industrial';
  standardRating: string;
  co2ReductionAnnual: string;
  typicalPayback: string;
  cameraPreset: {
    position: [number, number, number];
    target: [number, number, number];
  };
  components: Record<string, ComponentSpec>;
}

export type ClimateRegionId = 'temperate' | 'desert' | 'arctic' | 'tropical' | 'maritime' | 'alpine';

export interface ClimateRegionInfo {
  id: ClimateRegionId;
  name: string;
  tagline: string;
  baselineTempC: number;
  solarYieldMultiplier: number;
  annualSolarKWhPerM2: number;
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  primaryLoad: 'Heating Dominated' | 'Cooling Dominated' | 'Balanced Seasonal' | 'Dehumidification Heavy';
  icon: string;
  description: string;
  lightingHue: string;
}

export interface SimulationParams {
  sunAngleHour: number; // 0 to 24 (24-hour diurnal cycle)
  ambientTempC: number; // -15 to 40 C
  buildingSizeSqFt: number; // e.g. 2400
  solarCapacityKW: number; // e.g. 8.5
  batteryCapacityKWh: number; // e.g. 13.5
  utilityRatePerKWh: number; // e.g. 0.18
  monthlyBaselineBill: number; // e.g. 320
  heatPumpCop: number; // e.g. 3.8
  smartShadingActive: boolean;
  explodedOffset: number; // 0 to 1
  climateRegion: ClimateRegionId;
  solarYieldMultiplier: number;
  thermalCapacityMultiplier?: number; // 1.0 baseline, scales compressor & thermal delivery
  autoMitigateClimateShocks?: boolean; // When true, automatically auto-fixes weather stress insufficiencies
  smartDevicesState?: Record<string, SmartDeviceUserState>;
  gridCarbonData?: GridCarbonData;
  gridCarbonIntensityKgPerKWh?: number; // kg CO2 / kWh, defaults to 0.385
}

export interface GridFuelMix {
  solar: number;
  wind: number;
  hydro: number;
  nuclear: number;
  gas: number;
  coal: number;
  other: number;
}

export interface GridCarbonData {
  gridOperator: string;
  locationName: string;
  carbonIntensityGPerKWh: number; // e.g. 385 g/kWh
  carbonIntensityKgPerKWh: number; // e.g. 0.385 kg/kWh
  renewablePercentage: number;
  fossilPercentage: number;
  fuelMix: GridFuelMix;
  carbonRating: 'Very Clean' | 'Moderate' | 'High Carbon' | 'Fossil Intensive';
  summary: string;
  bestOperatingWindow: string;
  peakCarbonWindow: string;
  source: 'gps' | 'climate_region' | 'grounded_search' | 'manual' | 'default';
  lastUpdated: string;
}

export interface GroundedSearchResult {
  text: string;
  sources: Array<{ title: string; uri: string }>;
  searchQueries: string[];
}

export interface DeepDesignResult {
  modelUsed: string;
  text: string;
}

export interface QuickAuditResult {
  modelUsed: string;
  text: string;
}

export interface ScorecardOptimizationSuggestion {
  title: string;
  impact: 'HIGH' | 'VERY_HIGH' | 'MEDIUM';
  category: string;
  description: string;
  estimatedGain: string;
}

export interface ScorecardESGAlignment {
  standard: string;
  status: 'Achieved' | 'On Track' | 'Recommended';
  detail: string;
}

export interface SustainabilityScorecardData {
  overallScore: number;
  certificationGrade: string;
  dimensionScores: {
    carbonDecarbonization: number;
    gridAutonomyResilience: number;
    thermodynamicEfficiency: number;
    lifecycleEconomics: number;
  };
  executiveSummary: string;
  optimizationSuggestions: ScorecardOptimizationSuggestion[];
  esgAlignment: ScorecardESGAlignment[];
  nextMilestones: string[];
}

export type BlueprintEquipmentType =
  | 'solar_pv'
  | 'heat_pump_outdoor'
  | 'buffer_tank'
  | 'battery_bess'
  | 'smart_panel';

export interface EquipmentPlacementPin {
  id: BlueprintEquipmentType;
  name: string;
  shortLabel: string;
  category: 'Renewables' | 'HVAC Thermal' | 'Energy Storage' | 'Electrical Distribution';
  color: string;
  iconType: 'sun' | 'wind' | 'flame' | 'battery' | 'zap' | 'box';
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
  recommendedX: number;
  recommendedY: number;
  zone: string;
  orientation?: string;
  noiseRatingDBA?: number;
  clearanceNote: string;
  engineeringRationale: string;
  efficiencyGain: string;
  complianceCode: string;
}

export interface BlueprintRoom {
  id: string;
  name: string;
  x: number; // 0-100%
  y: number;
  width: number;
  height: number;
  type: 'bedroom' | 'living' | 'kitchen' | 'garage' | 'utility' | 'outdoor' | 'roof' | 'patio' | 'bath';
  noiseSensitive?: boolean;
}

export interface BlueprintRoofZone {
  id: string;
  name: string;
  azimuthDeg: number;
  azimuthLabel: string;
  solarRatingPct: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BlueprintTemplate {
  id: string;
  name: string;
  category: string;
  sqFt: number;
  bedrooms: number;
  bathrooms: number;
  stories: number;
  description: string;
  dimensionsFeet: { width: number; height: number };
  utilityEntrance: { x: number; y: number; label: string };
  rooms: BlueprintRoom[];
  roofZones: BlueprintRoofZone[];
  walls: Array<{ x1: number; y1: number; x2: number; y2: number; type: 'exterior' | 'interior' }>;
  doors: Array<{ x: number; y: number; width: number; height: number }>;
  windows: Array<{ x: number; y: number; width: number; height: number }>;
  defaultPlacements: Record<BlueprintEquipmentType, { x: number; y: number }>;
  optimizedPlacements: Record<BlueprintEquipmentType, { x: number; y: number }>;
}

export interface BlueprintAnalysisResponse {
  summary: string;
  overallEfficiencyScore: number;
  estimatedAnnualSavingsGain: string;
  recommendations: Array<{
    equipmentKey: BlueprintEquipmentType;
    name: string;
    xPercent: number;
    yPercent: number;
    zone: string;
    orientation: string;
    keyBenefit: string;
    engineeringRationale: string;
    complianceCode: string;
    efficiencyGain: string;
  }>;
  metrics: {
    refrigerantLineFt: number;
    refrigerantLossPct: number;
    electricalConduitFt: number;
    voltageDropPct: number;
    acousticNoiseBedroomDBA: number;
    solarYieldEfficiencyPct: number;
    fireCodeCompliance: 'Passed' | 'Warning' | 'Attention Required';
  };
  routingStrategy: string[];
  codeComplianceNotes: string[];
  installationChecklist: string[];
}

export type ClimateAlertSeverity = 'CRITICAL' | 'SEVERE' | 'WARNING' | 'OPTIMAL';

export type WeatherEventType =
  | 'polar_vortex'
  | 'extreme_heatwave'
  | 'dunkelflaute_blizzard'
  | 'desert_superheat'
  | 'tropical_cyclone';

export interface ExtremeWeatherScenario {
  id: WeatherEventType;
  name: string;
  tagline: string;
  regionAffinity: ClimateRegionId[];
  icon: string;
  description: string;
  designTempC: number;
  solarCutPct: number;
  windSpeedMph: number;
  gridOutageHours: number;
  peakDurationDays: number;
  primaryRisk: string;
}

export interface ClimateVulnerabilityMetrics {
  peakLoadKW: number;
  systemCapacityKW: number;
  deficitKW: number;
  effectiveCop: number;
  copDeratePct: number;
  batteryAutonomyHours: number;
  solarAvailableKW: number;
  solarLossPct: number;
  gridStressIndex: number;
  comfortRiskScore: number;
  freezeRisk: boolean;
  overheatRisk: boolean;
  auxiliaryHeatEngaged: boolean;
  auxiliaryPowerKW: number;
}

export interface ClimateAlertItem {
  id: string;
  severity: ClimateAlertSeverity;
  category: 'Thermodynamic' | 'Electrical Autonomy' | 'Renewable Harvest' | 'Grid Resilience';
  title: string;
  description: string;
  engineeringDetail: string;
}

export interface ClimateAlertMitigation {
  title: string;
  description: string;
  impactLabel: string;
  actionableParamUpdate?: Partial<SimulationParams>;
}

export interface ClimateAlertAssessment {
  severity: ClimateAlertSeverity;
  scenarioId?: WeatherEventType;
  scenarioName: string;
  headline: string;
  summary: string;
  isInsufficient: boolean;
  metrics: ClimateVulnerabilityMetrics;
  alerts: ClimateAlertItem[];
  mitigations: ClimateAlertMitigation[];
  recommendedSizing: Partial<SimulationParams>;
}

export type SmartDeviceId =
  | 'ev_charger'
  | 'smart_thermostat'
  | 'heat_pump_wh'
  | 'induction_range'
  | 'smart_pool_pump'
  | 'v2g_ev_battery'
  | 'smart_shading';

export type SmartDeviceCategory =
  | 'Mobility'
  | 'Climate Control'
  | 'Water Heating'
  | 'Kitchen'
  | 'Utility'
  | 'Energy Storage';

export type SmartDeviceMode =
  | 'always_on'
  | 'solar_match'
  | 'off_peak_tou'
  | 'eco_shed'
  | 'off';

export interface SmartDeviceUserState {
  enabled: boolean;
  mode: SmartDeviceMode;
  userPowerKW?: number;
}

export interface SmartDeviceSpec {
  id: SmartDeviceId;
  name: string;
  category: SmartDeviceCategory;
  description: string;
  nominalKW: number;
  minKW: number;
  maxKW: number;
  stepKW: number;
  defaultMode: SmartDeviceMode;
  supportedModes: SmartDeviceMode[];
  badgeColor: string;
  iconType: 'car' | 'thermometer' | 'droplet' | 'flame' | 'waves' | 'battery-charging' | 'sun';
  smartBenefit: string;
  diurnalScheduleDescription: string;
}

export interface SmartDevicesSimulationResult {
  totalSmartLoadKW: number;
  deviceDrawsKW: Record<SmartDeviceId, number>;
  activeCount: number;
  solarSelfConsumptionPct: number;
  peakHourShedKW: number;
  hourlyCostDelta: number;
  annualCo2DeltaKg: number;
}

