import { SimulationParams, SystemId } from '../types/energy';

export interface GridEmissionProfile {
  id: string;
  name: string;
  shortLabel: string;
  gPerKWh: number; // grams of CO2 per kWh
  description: string;
  regionExample: string;
}

export const GRID_EMISSION_PROFILES: Record<string, GridEmissionProfile> = {
  clean_hydro: {
    id: 'clean_hydro',
    name: 'Clean Renewables & Nuclear Grid',
    shortLabel: 'Clean Grid (150g)',
    gPerKWh: 150,
    description: 'High hydro, nuclear, wind & solar penetration with low fossil peakers.',
    regionExample: 'Pacific Northwest, Scandinavia, Ontario, France',
  },
  us_average: {
    id: 'us_average',
    name: 'US National Average (EPA eGRID)',
    shortLabel: 'US Average (386g)',
    gPerKWh: 386,
    description: 'Standard national mixed generation portfolio (Natural gas 42%, Renewables 22%, Nuclear 19%, Coal 17%).',
    regionExample: 'National standard benchmark',
  },
  fossil_heavy: {
    id: 'fossil_heavy',
    name: 'Fossil / Peaking Gas & Coal Grid',
    shortLabel: 'Coal/Gas Heavy (720g)',
    gPerKWh: 720,
    description: 'High dependency on subbituminous coal units and open-cycle gas turbine peakers.',
    regionExample: 'Midwest ISO, Australia NEM, Poland, West Virginia',
  },
  global_coal: {
    id: 'global_coal',
    name: 'Unmitigated Subcritical Coal Grid',
    shortLabel: 'High Coal (880g)',
    gPerKWh: 880,
    description: 'Legacy coal-fired thermal fleet with minimal renewable penetration.',
    regionExample: 'Developing industrial corridors',
  },
};

export interface BaselineThermalSource {
  id: string;
  name: string;
  shortLabel: string;
  kgCO2PerKWhThermal: number;
  efficiencyPct: number;
  description: string;
}

export const BASELINE_THERMAL_SOURCES: Record<string, BaselineThermalSource> = {
  natural_gas: {
    id: 'natural_gas',
    name: 'Standard Natural Gas Furnace (80% AFUE)',
    shortLabel: 'Gas Furnace (80%)',
    kgCO2PerKWhThermal: 0.226,
    efficiencyPct: 80,
    description: 'Standard atmospheric draft methane combustion furnace emitting 53.1 kg CO2/MMBtu.',
  },
  high_eff_gas: {
    id: 'high_eff_gas',
    name: 'Condensing Gas Boiler (92% AFUE)',
    shortLabel: 'Condensing Gas (92%)',
    kgCO2PerKWhThermal: 0.198,
    efficiencyPct: 92,
    description: 'Modern modulating condensing natural gas furnace with flue heat recuperation.',
  },
  heating_oil: {
    id: 'heating_oil',
    name: 'Heating Fuel Oil #2 Furnace',
    shortLabel: 'Fuel Oil #2',
    kgCO2PerKWhThermal: 0.298,
    efficiencyPct: 78,
    description: 'Distillate petroleum heating fuel common in legacy cold-climate regions.',
  },
  propane: {
    id: 'propane',
    name: 'Bulk Propane (LPG) System',
    shortLabel: 'LPG Propane',
    kgCO2PerKWhThermal: 0.258,
    efficiencyPct: 82,
    description: 'Stored liquefied petroleum gas combustion unit.',
  },
  electric_resistance: {
    id: 'electric_resistance',
    name: 'Electric Resistance Strip / Baseboard (COP 1.0)',
    shortLabel: 'Baseboard (COP 1.0)',
    kgCO2PerKWhThermal: 0.386, // Direct grid electricity at average intensity
    efficiencyPct: 100,
    description: 'Direct electric Joule heating without thermodynamic heat pump multiplication.',
  },
};

export interface CarbonFootprintMetrics {
  // Annual emissions in Metric Tons CO2e
  baselineTotalMT: number;
  baselineElectricityMT: number;
  baselineHeatingMT: number;
  
  cleanSystemTotalMT: number;
  cleanSystemGridMT: number;
  cleanSystemOnSiteMT: number;

  annualCO2SavedMT: number;
  reductionPercentage: number;
  twentyYearLifetimeSavedMT: number;

  // Breakdown of where savings come from
  solarPVOffsetMT: number;
  heatPumpDisplacementMT: number;
  storagePeakDisplacementMT: number;
  efficiencyEnvelopeMT: number;

  // Tangible real-world equivalencies (EPA Greenhouse Gas Equivalencies standards)
  treesPlantedSeedlings10Yr: number;
  gasolineGallonsSaved: number;
  passengerVehicleMilesAvoided: number;
  passengerFlightsAvoided: number;
  homesElectricityPoweredForYear: number;
  smartphonesChargedThousands: number;

  // Status and grade
  decarbonizationGrade: 'Net Zero Ready' | 'Deep Decarbonization' | 'High Decarbonization' | 'Moderate Reduction';
  colorTheme: string;
}

export interface CarbonCalculationInputs {
  systemId: SystemId;
  simParams: SimulationParams;
  gridProfileId: string;
  customGridGPerKWh?: number;
  baselineThermalId: string;
  annualGridKWhOverride?: number;
}

export function calculateCarbonFootprint(inputs: CarbonCalculationInputs): CarbonFootprintMetrics {
  const { systemId, simParams, gridProfileId, customGridGPerKWh, baselineThermalId, annualGridKWhOverride } = inputs;

  // 1. Determine Grid Emission Factor (kg CO2 per kWh)
  const gridProfile = GRID_EMISSION_PROFILES[gridProfileId] || GRID_EMISSION_PROFILES.us_average;
  const gridKgPerKWh = (customGridGPerKWh ?? gridProfile.gPerKWh) / 1000;

  // 2. Determine Baseline Thermal Source
  const thermalSource = BASELINE_THERMAL_SOURCES[baselineThermalId] || BASELINE_THERMAL_SOURCES.natural_gas;

  // 3. Base Annual Energy Consumption
  // Base electricity derived from utility bill or override
  const annualElectricityKWh = annualGridKWhOverride ?? ((simParams.monthlyBaselineBill * 12) / Math.max(simParams.utilityRatePerKWh, 0.05));
  
  // Scale energy demand based on system type & building size
  let buildingAreaSqFt = simParams.buildingSizeSqFt || 2400;
  let totalHeatingThermalKWh = 0;
  let totalCoolingKWh = 0;
  let totalBaseElectricKWh = annualElectricityKWh;

  // Sector multiplier
  if (systemId === 'smart_building') {
    // Commercial scale (e.g. 25,000 to 50,000 sq ft)
    const commercialFactor = Math.max(buildingAreaSqFt / 2400, 1) * 8.5;
    totalBaseElectricKWh = annualElectricityKWh * commercialFactor;
    totalHeatingThermalKWh = totalBaseElectricKWh * 0.45;
    totalCoolingKWh = totalBaseElectricKWh * 0.35;
  } else if (systemId === 'industrial_whrs') {
    // Industrial scale: 1,200 kWth waste flue gas baseline
    totalBaseElectricKWh = 850000; // 850 MWh industrial baseline
    totalHeatingThermalKWh = 1200 * 2500; // 3,000,000 kWhth of process heat
    totalCoolingKWh = 0;
  } else {
    // Residential (Heat Pump or Microgrid)
    const areaFactor = buildingAreaSqFt / 2400;
    totalHeatingThermalKWh = totalBaseElectricKWh * 0.58 * areaFactor;
    totalCoolingKWh = totalBaseElectricKWh * 0.22 * areaFactor;
  }

  // 4. Calculate Traditional Grid-Only & Fossil Baseline Emissions
  // Baseline electricity: 100% purchased from traditional grid
  const baselineElectricityMT = (totalBaseElectricKWh * gridKgPerKWh) / 1000;

  // Baseline heating: Fossil fuel combustion
  const baselineHeatingMT = (totalHeatingThermalKWh * thermalSource.kgCO2PerKWhThermal) / 1000;

  const baselineTotalMT = baselineElectricityMT + baselineHeatingMT;

  // 5. Calculate Clean System Energy Performance
  const yieldMult = simParams.solarYieldMultiplier || 1.0;
  
  // Solar generation
  let annualSolarGenKWh = 0;
  if (systemId === 'smart_building') {
    annualSolarGenKWh = 65 * 1420 * yieldMult; // 65 kW commercial bifacial rooftop
  } else if (systemId === 'industrial_whrs') {
    annualSolarGenKWh = 250 * 5200; // 250 kWe net electric output from waste heat ORC turbine (~1,300,000 kWh/yr)
  } else {
    annualSolarGenKWh = (simParams.solarCapacityKW || 8.5) * 1400 * yieldMult;
  }

  // Heat pump or thermal efficiency savings
  let heatingElectricityWithCleanSystemKWh = 0;
  let cleanSystemHeatingMT = 0;

  if (systemId === 'industrial_whrs') {
    // Recovers waste heat, zero combustion
    cleanSystemHeatingMT = 0;
    heatingElectricityWithCleanSystemKWh = 0;
  } else {
    // Heat pump delivers totalHeatingThermalKWh with COP
    const effectiveCOP = Math.max(simParams.heatPumpCop || 4.2, 1.5);
    heatingElectricityWithCleanSystemKWh = totalHeatingThermalKWh / effectiveCOP;
    // Displaces direct fossil fuel combustion with electricity
    cleanSystemHeatingMT = 0; // zero on-site combustion!
  }

  // Battery ESS peak shifting & self-consumption boost
  const batteryKWh = simParams.batteryCapacityKWh || 13.5;
  const storageBoostFactor = Math.min(1.0, 0.70 + (batteryKWh / 50) * 0.25);
  const selfConsumedSolarKWh = Math.min(annualSolarGenKWh * storageBoostFactor, totalBaseElectricKWh + heatingElectricityWithCleanSystemKWh);

  // Smart shading savings (reduces cooling load by 18-25%)
  const smartShadingCoolingSavedKWh = simParams.smartShadingActive ? totalCoolingKWh * 0.22 : 0;

  // Net grid electricity needed by Clean System
  const grossElectricDemand = totalBaseElectricKWh + heatingElectricityWithCleanSystemKWh - smartShadingCoolingSavedKWh;
  const netGridElectricityPurchasedKWh = Math.max(0, grossElectricDemand - selfConsumedSolarKWh);

  // Excess solar exported to grid (credits displaced marginal fossil generation at grid factor)
  const excessSolarExportedKWh = Math.max(0, annualSolarGenKWh - selfConsumedSolarKWh);
  const solarExportCreditMT = (excessSolarExportedKWh * gridKgPerKWh * 0.85) / 1000;

  // Clean system remaining emissions
  const cleanSystemGridMT = (netGridElectricityPurchasedKWh * gridKgPerKWh) / 1000;
  const cleanSystemTotalMT = Math.max(0, cleanSystemGridMT + cleanSystemHeatingMT - solarExportCreditMT);

  // Savings
  const annualCO2SavedMT = Math.max(0, baselineTotalMT - cleanSystemTotalMT);
  const reductionPercentage = baselineTotalMT > 0 ? Math.min(100, Math.max(0, (annualCO2SavedMT / baselineTotalMT) * 100)) : 0;

  // 20-Year Lifetime Savings (accounting for 0.5%/yr PV degradation)
  const twentyYearFactor = 18.2; // sum of (1 - 0.005)^t for 20 years
  const twentyYearLifetimeSavedMT = annualCO2SavedMT * twentyYearFactor;

  // Savings Breakdown
  const solarPVOffsetMT = (annualSolarGenKWh * gridKgPerKWh) / 1000;
  const heatPumpDisplacementMT = Math.max(0, baselineHeatingMT - (heatingElectricityWithCleanSystemKWh * gridKgPerKWh) / 1000);
  const storagePeakDisplacementMT = (batteryKWh * 320 * gridKgPerKWh * 0.35) / 1000;
  const efficiencyEnvelopeMT = (smartShadingCoolingSavedKWh * gridKgPerKWh) / 1000;

  // EPA GHG Equivalencies:
  // 1 metric ton CO2 = 1,000 kg CO2
  const kgCO2Saved = annualCO2SavedMT * 1000;
  
  // 1 tree absorbs ~21.77 kg CO2/year over 10 years of growth (EPA Greenhouse Gas Equivalencies Calculator)
  const treesPlantedSeedlings10Yr = Math.round(kgCO2Saved / 21.77);

  // 1 gallon gasoline = 8.887 kg CO2
  const gasolineGallonsSaved = Math.round(kgCO2Saved / 8.887);

  // Average passenger ICE car = 0.404 kg CO2 per mile (EPA)
  const passengerVehicleMilesAvoided = Math.round(kgCO2Saved / 0.404);

  // Passenger flight (1 seat transatlantic NYC-LON ~ 0.90 Metric Tons CO2)
  const passengerFlightsAvoided = parseFloat((annualCO2SavedMT / 0.90).toFixed(1));

  // Average US household electricity use = ~7.4 Metric Tons CO2/yr
  const homesElectricityPoweredForYear = parseFloat((annualCO2SavedMT / 7.4).toFixed(1));

  // 1 smartphone charge = ~0.00822 kg CO2 -> in thousands of charges
  const smartphonesChargedThousands = Math.round(kgCO2Saved / 8.22);

  // Decarbonization grade
  let decarbonizationGrade: CarbonFootprintMetrics['decarbonizationGrade'] = 'Moderate Reduction';
  let colorTheme = '#f59e0b'; // amber

  if (reductionPercentage >= 85) {
    decarbonizationGrade = 'Net Zero Ready';
    colorTheme = '#10b981'; // emerald
  } else if (reductionPercentage >= 70) {
    decarbonizationGrade = 'Deep Decarbonization';
    colorTheme = '#06b6d4'; // cyan
  } else if (reductionPercentage >= 45) {
    decarbonizationGrade = 'High Decarbonization';
    colorTheme = '#38bdf8'; // sky
  }

  return {
    baselineTotalMT: parseFloat(baselineTotalMT.toFixed(2)),
    baselineElectricityMT: parseFloat(baselineElectricityMT.toFixed(2)),
    baselineHeatingMT: parseFloat(baselineHeatingMT.toFixed(2)),
    cleanSystemTotalMT: parseFloat(cleanSystemTotalMT.toFixed(2)),
    cleanSystemGridMT: parseFloat(cleanSystemGridMT.toFixed(2)),
    cleanSystemOnSiteMT: parseFloat(cleanSystemHeatingMT.toFixed(2)),
    annualCO2SavedMT: parseFloat(annualCO2SavedMT.toFixed(2)),
    reductionPercentage: parseFloat(reductionPercentage.toFixed(1)),
    twentyYearLifetimeSavedMT: parseFloat(twentyYearLifetimeSavedMT.toFixed(1)),
    solarPVOffsetMT: parseFloat(solarPVOffsetMT.toFixed(2)),
    heatPumpDisplacementMT: parseFloat(heatPumpDisplacementMT.toFixed(2)),
    storagePeakDisplacementMT: parseFloat(storagePeakDisplacementMT.toFixed(2)),
    efficiencyEnvelopeMT: parseFloat(efficiencyEnvelopeMT.toFixed(2)),
    treesPlantedSeedlings10Yr,
    gasolineGallonsSaved,
    passengerVehicleMilesAvoided,
    passengerFlightsAvoided,
    homesElectricityPoweredForYear,
    smartphonesChargedThousands,
    decarbonizationGrade,
    colorTheme,
  };
}
