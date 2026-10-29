import { SystemId, ClimateRegionId, SimulationParams } from '../types/energy';

export interface GlobalSiteData {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  climateRegion: ClimateRegionId;
  baselineTempC: number;
  annualSolarGHI: number; // kWh/m²/year
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  gridTariff: number; // $/kWh
  gridCarbonIntensity: number; // kg CO2/kWh
  systemSuitability: Record<SystemId, number>; // 0 to 100%
  recommendedArchetype: SystemId;
  engineeringNote: string;
  incentiveLevel: 'Tier 1 (High)' | 'Tier 2 (Moderate)' | 'Tier 3 (Emerging)';
  typicalPaybackYears: number;
}

export type HeatmapMetricMode = 'suitability' | 'solarGHI' | 'hdd' | 'cdd' | 'carbonOffset';

export interface GridHeatPoint {
  lat: number;
  lon: number;
  solarGHI: number;
  hdd: number;
  cdd: number;
  suitability: number;
  carbonOffset: number;
}

/**
 * 48 Key Meteorological & Clean Energy Reference Hubs worldwide
 */
export const GLOBAL_REFERENCE_SITES: GlobalSiteData[] = [
  // North America
  {
    id: 'phoenix',
    name: 'Phoenix, AZ',
    country: 'United States',
    lat: 33.4484,
    lon: -112.074,
    climateRegion: 'desert',
    baselineTempC: 36,
    annualSolarGHI: 2350,
    heatingDegreeDays: 820,
    coolingDegreeDays: 4100,
    gridTariff: 0.19,
    gridCarbonIntensity: 0.42,
    systemSuitability: {
      heat_pump: 78,
      smart_building: 92,
      residential_microgrid: 98,
      industrial_whrs: 70,
    },
    recommendedArchetype: 'residential_microgrid',
    engineeringNote: 'Premier solar insolation. Demands aggressive battery peak-shaving during 4-9 PM summer chiller spikes.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 4.8,
  },
  {
    id: 'los_angeles',
    name: 'Los Angeles, CA',
    country: 'United States',
    lat: 34.0522,
    lon: -118.2437,
    climateRegion: 'temperate',
    baselineTempC: 22,
    annualSolarGHI: 1980,
    heatingDegreeDays: 1100,
    coolingDegreeDays: 1250,
    gridTariff: 0.32,
    gridCarbonIntensity: 0.28,
    systemSuitability: {
      heat_pump: 88,
      smart_building: 95,
      residential_microgrid: 96,
      industrial_whrs: 65,
    },
    recommendedArchetype: 'residential_microgrid',
    engineeringNote: 'High retail electricity rates ($0.32/kWh) drive highest financial ROI for rooftop PV + BESS arbitrage.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 4.2,
  },
  {
    id: 'chicago',
    name: 'Chicago, IL',
    country: 'United States',
    lat: 41.8781,
    lon: -87.6298,
    climateRegion: 'temperate',
    baselineTempC: 11,
    annualSolarGHI: 1450,
    heatingDegreeDays: 6100,
    coolingDegreeDays: 890,
    gridTariff: 0.16,
    gridCarbonIntensity: 0.48,
    systemSuitability: {
      heat_pump: 92,
      smart_building: 90,
      residential_microgrid: 74,
      industrial_whrs: 88,
    },
    recommendedArchetype: 'heat_pump',
    engineeringNote: 'Severe sub-zero winter spells demand high-efficiency vapor-injected cold climate heat pumps.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 6.4,
  },
  {
    id: 'denver',
    name: 'Denver, CO',
    country: 'United States',
    lat: 39.7392,
    lon: -104.9903,
    climateRegion: 'alpine',
    baselineTempC: 9,
    annualSolarGHI: 2010,
    heatingDegreeDays: 5800,
    coolingDegreeDays: 780,
    gridTariff: 0.15,
    gridCarbonIntensity: 0.52,
    systemSuitability: {
      heat_pump: 91,
      smart_building: 88,
      residential_microgrid: 86,
      industrial_whrs: 82,
    },
    recommendedArchetype: 'heat_pump',
    engineeringNote: 'High altitude and clear atmosphere yield strong solar albedo gain with large diurnal temp swings.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 5.8,
  },
  {
    id: 'seattle',
    name: 'Seattle, WA',
    country: 'United States',
    lat: 47.6062,
    lon: -122.3321,
    climateRegion: 'maritime',
    baselineTempC: 12,
    annualSolarGHI: 1150,
    heatingDegreeDays: 4850,
    coolingDegreeDays: 240,
    gridTariff: 0.12,
    gridCarbonIntensity: 0.12,
    systemSuitability: {
      heat_pump: 94,
      smart_building: 89,
      residential_microgrid: 68,
      industrial_whrs: 76,
    },
    recommendedArchetype: 'heat_pump',
    engineeringNote: 'Mild marine heating conditions maximize seasonal COP (averaging 4.2+ year-round).',
    incentiveLevel: 'Tier 2 (Moderate)',
    typicalPaybackYears: 6.9,
  },
  {
    id: 'miami',
    name: 'Miami, FL',
    country: 'United States',
    lat: 25.7617,
    lon: -80.1918,
    climateRegion: 'tropical',
    baselineTempC: 28,
    annualSolarGHI: 1850,
    heatingDegreeDays: 120,
    coolingDegreeDays: 4300,
    gridTariff: 0.14,
    gridCarbonIntensity: 0.39,
    systemSuitability: {
      heat_pump: 75,
      smart_building: 96,
      residential_microgrid: 90,
      industrial_whrs: 62,
    },
    recommendedArchetype: 'smart_building',
    engineeringNote: 'High latent humidity load favors smart building pre-cooling, variable chillers, and solar shading.',
    incentiveLevel: 'Tier 2 (Moderate)',
    typicalPaybackYears: 5.6,
  },
  {
    id: 'montreal',
    name: 'Montreal, QC',
    country: 'Canada',
    lat: 45.5017,
    lon: -73.5673,
    climateRegion: 'arctic',
    baselineTempC: 6,
    annualSolarGHI: 1320,
    heatingDegreeDays: 7900,
    coolingDegreeDays: 320,
    gridTariff: 0.08,
    gridCarbonIntensity: 0.02,
    systemSuitability: {
      heat_pump: 93,
      smart_building: 84,
      residential_microgrid: 62,
      industrial_whrs: 94,
    },
    recommendedArchetype: 'industrial_whrs',
    engineeringNote: 'Hydropower-dominated grid; high heating degree days make heat recovery and cold heat pumps critical.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 7.2,
  },
  {
    id: 'anchorage',
    name: 'Anchorage, AK',
    country: 'United States',
    lat: 61.2181,
    lon: -149.9003,
    climateRegion: 'arctic',
    baselineTempC: 2,
    annualSolarGHI: 980,
    heatingDegreeDays: 9800,
    coolingDegreeDays: 10,
    gridTariff: 0.24,
    gridCarbonIntensity: 0.46,
    systemSuitability: {
      heat_pump: 89,
      smart_building: 76,
      residential_microgrid: 60,
      industrial_whrs: 96,
    },
    recommendedArchetype: 'industrial_whrs',
    engineeringNote: 'Severe sub-zero climate demands hydronic thermal buffer tanks and low-ambient flash-injection compressors.',
    incentiveLevel: 'Tier 2 (Moderate)',
    typicalPaybackYears: 5.4,
  },

  // Europe
  {
    id: 'frankfurt',
    name: 'Frankfurt',
    country: 'Germany',
    lat: 50.1109,
    lon: 8.6821,
    climateRegion: 'temperate',
    baselineTempC: 11,
    annualSolarGHI: 1180,
    heatingDegreeDays: 4800,
    coolingDegreeDays: 410,
    gridTariff: 0.38,
    gridCarbonIntensity: 0.36,
    systemSuitability: {
      heat_pump: 96,
      smart_building: 92,
      residential_microgrid: 88,
      industrial_whrs: 91,
    },
    recommendedArchetype: 'heat_pump',
    engineeringNote: 'Record grid power costs in central Europe make thermodynamic heat pumps with solar self-consumption exceptionally lucrative.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 3.9,
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    lat: 51.5074,
    lon: -0.1278,
    climateRegion: 'maritime',
    baselineTempC: 11,
    annualSolarGHI: 1080,
    heatingDegreeDays: 4400,
    coolingDegreeDays: 220,
    gridTariff: 0.34,
    gridCarbonIntensity: 0.22,
    systemSuitability: {
      heat_pump: 95,
      smart_building: 91,
      residential_microgrid: 82,
      industrial_whrs: 80,
    },
    recommendedArchetype: 'heat_pump',
    engineeringNote: 'Gas boiler phaseout regulations position hydronic air-to-water heat pumps as the top UK retrofit archetype.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 4.5,
  },
  {
    id: 'madrid',
    name: 'Madrid',
    country: 'Spain',
    lat: 40.4168,
    lon: -3.7038,
    climateRegion: 'desert',
    baselineTempC: 15,
    annualSolarGHI: 1890,
    heatingDegreeDays: 3200,
    coolingDegreeDays: 1400,
    gridTariff: 0.26,
    gridCarbonIntensity: 0.18,
    systemSuitability: {
      heat_pump: 89,
      smart_building: 94,
      residential_microgrid: 96,
      industrial_whrs: 74,
    },
    recommendedArchetype: 'residential_microgrid',
    engineeringNote: 'Superb Mediterranean solar yield with sharp summer cooling peaks; ideal for rooftop solar + storage.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 4.1,
  },
  {
    id: 'oslo',
    name: 'Oslo',
    country: 'Norway',
    lat: 59.9139,
    lon: 10.7522,
    climateRegion: 'arctic',
    baselineTempC: 6,
    annualSolarGHI: 940,
    heatingDegreeDays: 7400,
    coolingDegreeDays: 110,
    gridTariff: 0.18,
    gridCarbonIntensity: 0.03,
    systemSuitability: {
      heat_pump: 96,
      smart_building: 86,
      residential_microgrid: 64,
      industrial_whrs: 92,
    },
    recommendedArchetype: 'heat_pump',
    engineeringNote: 'Scandinavia has the highest heat pump per-capita adoption globally; ground-source & cold-climate air systems dominate.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 5.2,
  },
  {
    id: 'zurich',
    name: 'Zurich / Swiss Alps',
    country: 'Switzerland',
    lat: 47.3769,
    lon: 8.5417,
    climateRegion: 'alpine',
    baselineTempC: 9,
    annualSolarGHI: 1350,
    heatingDegreeDays: 5200,
    coolingDegreeDays: 310,
    gridTariff: 0.28,
    gridCarbonIntensity: 0.04,
    systemSuitability: {
      heat_pump: 97,
      smart_building: 90,
      residential_microgrid: 79,
      industrial_whrs: 87,
    },
    recommendedArchetype: 'heat_pump',
    engineeringNote: 'Strict cantonal building efficiency codes mandate high-COP heat pumps and heat recovery ventilators.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 4.9,
  },

  // Middle East & Africa
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    lat: 25.2048,
    lon: 55.2708,
    climateRegion: 'desert',
    baselineTempC: 38,
    annualSolarGHI: 2280,
    heatingDegreeDays: 50,
    coolingDegreeDays: 5200,
    gridTariff: 0.11,
    gridCarbonIntensity: 0.54,
    systemSuitability: {
      heat_pump: 72,
      smart_building: 98,
      residential_microgrid: 95,
      industrial_whrs: 86,
    },
    recommendedArchetype: 'smart_building',
    engineeringNote: 'Extreme continuous cooling load (CDD > 5000); smart chiller staging, automated louvers, and district cooling lead efficiency.',
    incentiveLevel: 'Tier 2 (Moderate)',
    typicalPaybackYears: 4.6,
  },
  {
    id: 'riyadh',
    name: 'Riyadh',
    country: 'Saudi Arabia',
    lat: 24.7136,
    lon: 46.6753,
    climateRegion: 'desert',
    baselineTempC: 36,
    annualSolarGHI: 2380,
    heatingDegreeDays: 320,
    coolingDegreeDays: 4800,
    gridTariff: 0.09,
    gridCarbonIntensity: 0.58,
    systemSuitability: {
      heat_pump: 74,
      smart_building: 96,
      residential_microgrid: 94,
      industrial_whrs: 88,
    },
    recommendedArchetype: 'smart_building',
    engineeringNote: 'Desert insolation combined with heavy thermal mass construction creates prime potential for diurnal thermal storage.',
    incentiveLevel: 'Tier 2 (Moderate)',
    typicalPaybackYears: 5.1,
  },
  {
    id: 'cairo',
    name: 'Cairo',
    country: 'Egypt',
    lat: 30.0444,
    lon: 31.2357,
    climateRegion: 'desert',
    baselineTempC: 25,
    annualSolarGHI: 2150,
    heatingDegreeDays: 850,
    coolingDegreeDays: 2900,
    gridTariff: 0.07,
    gridCarbonIntensity: 0.49,
    systemSuitability: {
      heat_pump: 82,
      smart_building: 90,
      residential_microgrid: 92,
      industrial_whrs: 78,
    },
    recommendedArchetype: 'residential_microgrid',
    engineeringNote: 'Abundant dry solar radiation; optimal for distributed rooftop PV microgrids with battery backup against grid instability.',
    incentiveLevel: 'Tier 3 (Emerging)',
    typicalPaybackYears: 5.9,
  },
  {
    id: 'nairobi',
    name: 'Nairobi',
    country: 'Kenya',
    lat: -1.2921,
    lon: 36.8219,
    climateRegion: 'tropical',
    baselineTempC: 19,
    annualSolarGHI: 2020,
    heatingDegreeDays: 350,
    coolingDegreeDays: 600,
    gridTariff: 0.22,
    gridCarbonIntensity: 0.15,
    systemSuitability: {
      heat_pump: 81,
      smart_building: 88,
      residential_microgrid: 95,
      industrial_whrs: 72,
    },
    recommendedArchetype: 'residential_microgrid',
    engineeringNote: 'High elevation moderation creates steady annual temperatures and strong equatorial solar irradiance.',
    incentiveLevel: 'Tier 2 (Moderate)',
    typicalPaybackYears: 4.4,
  },
  {
    id: 'johannesburg',
    name: 'Johannesburg',
    country: 'South Africa',
    lat: -26.2041,
    lon: 28.0473,
    climateRegion: 'temperate',
    baselineTempC: 16,
    annualSolarGHI: 2050,
    heatingDegreeDays: 2200,
    coolingDegreeDays: 850,
    gridTariff: 0.17,
    gridCarbonIntensity: 0.88,
    systemSuitability: {
      heat_pump: 89,
      smart_building: 91,
      residential_microgrid: 99,
      industrial_whrs: 84,
    },
    recommendedArchetype: 'residential_microgrid',
    engineeringNote: 'Extreme grid carbon intensity (0.88 kg/kWh) and loadshedding blackouts create world-leading microgrid battery demand.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 3.5,
  },

  // Asia & Oceania
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lon: 139.6503,
    climateRegion: 'temperate',
    baselineTempC: 16,
    annualSolarGHI: 1420,
    heatingDegreeDays: 3200,
    coolingDegreeDays: 1400,
    gridTariff: 0.29,
    gridCarbonIntensity: 0.45,
    systemSuitability: {
      heat_pump: 96,
      smart_building: 97,
      residential_microgrid: 89,
      industrial_whrs: 88,
    },
    recommendedArchetype: 'smart_building',
    engineeringNote: 'High commercial building density; advanced VRF multi-split heat pumps and building IoT automation yield peak efficiency.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 4.8,
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    lat: 1.3521,
    lon: 103.8198,
    climateRegion: 'tropical',
    baselineTempC: 30,
    annualSolarGHI: 1680,
    heatingDegreeDays: 0,
    coolingDegreeDays: 4500,
    gridTariff: 0.23,
    gridCarbonIntensity: 0.41,
    systemSuitability: {
      heat_pump: 74,
      smart_building: 99,
      residential_microgrid: 84,
      industrial_whrs: 82,
    },
    recommendedArchetype: 'smart_building',
    engineeringNote: 'Near-equatorial heat and humidity; BCA Green Mark Platinum standard pushes smart building chillers and facade shading.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 4.3,
  },
  {
    id: 'new_delhi',
    name: 'New Delhi',
    country: 'India',
    lat: 28.6139,
    lon: 77.209,
    climateRegion: 'desert',
    baselineTempC: 26,
    annualSolarGHI: 1980,
    heatingDegreeDays: 1100,
    coolingDegreeDays: 3600,
    gridTariff: 0.11,
    gridCarbonIntensity: 0.72,
    systemSuitability: {
      heat_pump: 84,
      smart_building: 93,
      residential_microgrid: 95,
      industrial_whrs: 89,
    },
    recommendedArchetype: 'residential_microgrid',
    engineeringNote: 'Intense summer solar resource and heavy fossil grid emissions factor offer exceptional carbon mitigation per installed kW.',
    incentiveLevel: 'Tier 2 (Moderate)',
    typicalPaybackYears: 4.7,
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    lat: -33.8688,
    lon: 151.2093,
    climateRegion: 'temperate',
    baselineTempC: 18,
    annualSolarGHI: 1820,
    heatingDegreeDays: 1600,
    coolingDegreeDays: 950,
    gridTariff: 0.28,
    gridCarbonIntensity: 0.58,
    systemSuitability: {
      heat_pump: 93,
      smart_building: 92,
      residential_microgrid: 98,
      industrial_whrs: 76,
    },
    recommendedArchetype: 'residential_microgrid',
    engineeringNote: 'Highest residential solar uptake in the world; negative daytime wholesale prices necessitate high battery storage capacity.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 3.8,
  },
  {
    id: 'perth',
    name: 'Perth',
    country: 'Australia',
    lat: -31.9505,
    lon: 115.8605,
    climateRegion: 'desert',
    baselineTempC: 20,
    annualSolarGHI: 2190,
    heatingDegreeDays: 1400,
    coolingDegreeDays: 1350,
    gridTariff: 0.26,
    gridCarbonIntensity: 0.55,
    systemSuitability: {
      heat_pump: 88,
      smart_building: 93,
      residential_microgrid: 99,
      industrial_whrs: 78,
    },
    recommendedArchetype: 'residential_microgrid',
    engineeringNote: 'Sunny Western Australian climate; islanded grid creates prime economics for standalone microgrid resilience.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 3.6,
  },

  // South America
  {
    id: 'santiago',
    name: 'Santiago / Atacama',
    country: 'Chile',
    lat: -33.4489,
    lon: -70.6693,
    climateRegion: 'desert',
    baselineTempC: 16,
    annualSolarGHI: 2420,
    heatingDegreeDays: 2400,
    coolingDegreeDays: 850,
    gridTariff: 0.18,
    gridCarbonIntensity: 0.31,
    systemSuitability: {
      heat_pump: 90,
      smart_building: 91,
      residential_microgrid: 99,
      industrial_whrs: 86,
    },
    recommendedArchetype: 'residential_microgrid',
    engineeringNote: 'Atacama Desert region registers highest solar irradiance on Earth (>2500 kWh/m²); world-leading PV efficiency.',
    incentiveLevel: 'Tier 1 (High)',
    typicalPaybackYears: 3.4,
  },
  {
    id: 'sao_paulo',
    name: 'São Paulo',
    country: 'Brazil',
    lat: -23.5505,
    lon: -46.6333,
    climateRegion: 'tropical',
    baselineTempC: 21,
    annualSolarGHI: 1720,
    heatingDegreeDays: 850,
    coolingDegreeDays: 1650,
    gridTariff: 0.19,
    gridCarbonIntensity: 0.09,
    systemSuitability: {
      heat_pump: 86,
      smart_building: 94,
      residential_microgrid: 92,
      industrial_whrs: 80,
    },
    recommendedArchetype: 'smart_building',
    engineeringNote: 'High commercial electricity tariffs and temperate-tropical transition make commercial building automation optimal.',
    incentiveLevel: 'Tier 2 (Moderate)',
    typicalPaybackYears: 4.8,
  },
];

/**
 * Generates an interpolated global heat grid mesh of lat/lon points
 * dynamically adjusted by current simulation parameters (ambient temp, solar multiplier).
 */
export function generateGlobalHeatmapGrid(
  simParams: SimulationParams,
  activeSystem: SystemId,
  metricMode: HeatmapMetricMode,
  stepLat = 12,
  stepLon = 15
): GridHeatPoint[] {
  const points: GridHeatPoint[] = [];
  const solarMultiplier = simParams.solarYieldMultiplier ?? 1.0;

  for (let lat = -70; lat <= 70; lat += stepLat) {
    for (let lon = -180; lon <= 180; lon += stepLon) {
      // Calculate latitude-based theoretical solar insolation (cosine of latitude approx)
      const latAbs = Math.abs(lat);
      const latRad = (lat * Math.PI) / 180;

      // Solar GHI baseline by latitude and cloud cover approximation
      let baseGHI = Math.max(700, 2450 * Math.cos(latRad * 0.9) - (latAbs > 45 ? (latAbs - 45) * 22 : 0));
      // Adjust deserts (lat ~20-35)
      if (latAbs >= 15 && latAbs <= 35) {
        baseGHI += 250;
      }
      const solarGHI = Math.round(baseGHI * solarMultiplier);

      // Heating degree days & cooling degree days
      const localMeanTemp = 28 - latAbs * 0.55 + (simParams.ambientTempC - 20) * 0.4;
      const hdd = Math.max(0, Math.round((18 - localMeanTemp) * 180));
      const cdd = Math.max(0, Math.round((localMeanTemp - 18) * 180));

      // Calculate System Suitability score based on active system archetype
      let suitability = 50;
      if (activeSystem === 'heat_pump') {
        // Heat pumps love moderate to cold climates where heating and cooling demands are high
        suitability = Math.min(99, Math.max(35, Math.round(55 + (hdd / 100) * 0.6 + (cdd / 100) * 0.4 + (simParams.heatPumpCop - 3.0) * 8)));
      } else if (activeSystem === 'smart_building') {
        // Smart buildings thrive in high cooling load and high dynamic occupancy zones
        suitability = Math.min(99, Math.max(40, Math.round(50 + (cdd / 100) * 0.8 + (solarGHI / 2400) * 25)));
      } else if (activeSystem === 'residential_microgrid') {
        // Microgrids thrive with strong solar GHI + battery capacity
        suitability = Math.min(99, Math.max(35, Math.round(40 + (solarGHI / 2400) * 50 + (simParams.batteryCapacityKWh / 20) * 12)));
      } else if (activeSystem === 'industrial_whrs') {
        // WHRS thrives where heating demand is continuous or cold ambient increases Carnot efficiency
        suitability = Math.min(99, Math.max(30, Math.round(45 + (hdd / 100) * 0.7 + (latAbs > 35 ? 20 : 5))));
      }

      // Carbon offset potential (t CO2 / yr per standard 10kW equivalent)
      const carbonOffset = Number(((solarGHI * 0.0055 * (activeSystem === 'heat_pump' ? 1.25 : 1.0))).toFixed(1));

      points.push({
        lat,
        lon,
        solarGHI,
        hdd,
        cdd,
        suitability,
        carbonOffset,
      });
    }
  }

  return points;
}

/**
 * Simplified world continent polygons (GeoJSON FeatureCollection)
 * for rapid, crisp, offline-ready D3 map projection without fetching external topojson.
 */
export const WORLD_CONTINENTS_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // North America
    {
      type: 'Feature',
      properties: { name: 'North America', continent: 'NA' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-168, 65], [-160, 71], [-130, 70], [-115, 68], [-85, 75], [-65, 62],
            [-55, 48], [-60, 44], [-70, 42], [-75, 35], [-80, 25], [-82, 23],
            [-88, 21], [-90, 15], [-85, 10], [-77, 8], [-82, 9], [-95, 16],
            [-105, 20], [-110, 24], [-115, 30], [-122, 37], [-124, 48], [-130, 55],
            [-145, 60], [-165, 60], [-168, 65]
          ]
        ]
      }
    },
    // South America
    {
      type: 'Feature',
      properties: { name: 'South America', continent: 'SA' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-77, 8], [-72, 11], [-60, 6], [-50, 0], [-35, -5], [-35, -10],
            [-38, -15], [-42, -22], [-48, -28], [-55, -35], [-65, -45], [-68, -54],
            [-75, -50], [-74, -40], [-72, -30], [-71, -18], [-80, -5], [-80, 2],
            [-77, 8]
          ]
        ]
      }
    },
    // Europe
    {
      type: 'Feature',
      properties: { name: 'Europe', continent: 'EU' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-9, 36], [-9, 43], [0, 43], [-4, 48], [2, 51], [8, 54],
            [12, 56], [10, 63], [18, 70], [28, 71], [40, 68], [55, 65],
            [60, 55], [50, 48], [40, 45], [30, 42], [28, 41], [24, 38],
            [20, 37], [15, 38], [5, 43], [0, 38], [-5, 36], [-9, 36]
          ]
        ]
      }
    },
    // Africa
    {
      type: 'Feature',
      properties: { name: 'Africa', continent: 'AF' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-6, 35], [10, 37], [25, 32], [32, 31], [35, 28], [43, 12],
            [51, 12], [45, 0], [40, -10], [35, -20], [32, -28], [28, -33],
            [18, -34], [15, -28], [12, -15], [10, 0], [4, 5], [-10, 5],
            [-17, 14], [-17, 21], [-10, 30], [-6, 35]
          ]
        ]
      }
    },
    // Asia
    {
      type: 'Feature',
      properties: { name: 'Asia', continent: 'AS' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [60, 55], [55, 65], [70, 73], [100, 77], [130, 73], [170, 67],
            [180, 65], [170, 60], [150, 50], [142, 43], [130, 38], [122, 30],
            [118, 22], [105, 10], [100, 5], [95, 10], [90, 22], [80, 16],
            [75, 24], [68, 24], [60, 25], [50, 30], [45, 35], [40, 45],
            [50, 48], [60, 55]
          ]
        ]
      }
    },
    // Australia & Oceania
    {
      type: 'Feature',
      properties: { name: 'Australia', continent: 'OC' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [114, -22], [120, -15], [130, -12], [136, -12], [142, -11], [148, -20],
            [153, -28], [150, -35], [145, -38], [138, -35], [130, -32], [122, -34],
            [115, -34], [113, -26], [114, -22]
          ]
        ]
      }
    },
    // Greenland
    {
      type: 'Feature',
      properties: { name: 'Greenland', continent: 'NA' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-44, 60], [-50, 65], [-55, 72], [-45, 80], [-20, 82], [-18, 76],
            [-25, 70], [-35, 65], [-44, 60]
          ]
        ]
      }
    },
    // Antarctica
    {
      type: 'Feature',
      properties: { name: 'Antarctica', continent: 'AN' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-180, -78], [-120, -75], [-60, -65], [0, -68], [60, -68],
            [120, -66], [180, -78]
          ]
        ]
      }
    }
  ]
};
