import {
  SmartDeviceSpec,
  SmartDeviceId,
  SmartDeviceUserState,
  SmartDeviceMode,
  SimulationParams,
  SmartDevicesSimulationResult,
} from '../types/energy';

export const SMART_DEVICES_CATALOG: SmartDeviceSpec[] = [
  {
    id: 'ev_charger',
    name: 'Smart Level 2 EV Charger',
    category: 'Mobility',
    description: 'Wi-Fi connected OCPP 2.0.1 EVSE capable of dynamic solar tracking and TOU schedule charging.',
    nominalKW: 7.2,
    minKW: 1.4,
    maxKW: 11.5,
    stepKW: 0.2,
    defaultMode: 'solar_match',
    supportedModes: ['solar_match', 'off_peak_tou', 'always_on', 'off'],
    badgeColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-800/80',
    iconType: 'car',
    smartBenefit: 'Diverts 100% surplus midday solar direct into EV battery, avoiding $85/mo in peak grid tariffs.',
    diurnalScheduleDescription: 'Solar-Match mode dynamically scales charging amperage from 6A to 48A based on live PV excess.',
  },
  {
    id: 'smart_thermostat',
    name: 'Smart Connected Thermostat & AI Pre-Cooling',
    category: 'Climate Control',
    description: 'Learns building thermal envelope. Pre-cools or pre-heats before high-tariff peak windows to shed compressor load.',
    nominalKW: 1.5,
    minKW: 0.5,
    maxKW: 2.5,
    stepKW: 0.1,
    defaultMode: 'eco_shed',
    supportedModes: ['eco_shed', 'solar_match', 'always_on', 'off'],
    badgeColor: 'text-indigo-400 bg-indigo-950/80 border-indigo-800/80',
    iconType: 'thermometer',
    smartBenefit: 'Sheds up to 1.8 kW HVAC load between 4 PM - 9 PM without sacrificing occupant thermal comfort.',
    diurnalScheduleDescription: 'Banks cold air during 11 AM - 3 PM solar window, floats indoor temp during 4 PM - 9 PM peak.',
  },
  {
    id: 'heat_pump_wh',
    name: 'Hybrid Heat Pump Water Heater',
    category: 'Water Heating',
    description: 'Acts as a thermal battery (50-80 gal tank). Overheats water to 140°F during solar noon, tempering at the fixture.',
    nominalKW: 0.9,
    minKW: 0.4,
    maxKW: 4.5,
    stepKW: 0.1,
    defaultMode: 'solar_match',
    supportedModes: ['solar_match', 'off_peak_tou', 'always_on', 'off'],
    badgeColor: 'text-teal-400 bg-teal-950/80 border-teal-800/80',
    iconType: 'droplet',
    smartBenefit: 'Stores 9 kWh of equivalent thermal energy in hot water using 3.8 COP heat pump cycle during solar hours.',
    diurnalScheduleDescription: 'Runs high-temp heating cycle 10:00 AM - 3:00 PM; locks out resistance elements during evening peaks.',
  },
  {
    id: 'v2g_ev_battery',
    name: 'Vehicle-to-Home (V2G) Bi-Directional Power',
    category: 'Energy Storage',
    description: 'Enables bi-directional power flow from compatible EV battery (60-100 kWh pack) to power home during high tariffs or outages.',
    nominalKW: 3.5,
    minKW: 1.0,
    maxKW: 7.2,
    stepKW: 0.5,
    defaultMode: 'off_peak_tou',
    supportedModes: ['off_peak_tou', 'solar_match', 'always_on', 'off'],
    badgeColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80',
    iconType: 'battery-charging',
    smartBenefit: 'Injects up to 3.5 kW into house during 4 PM - 9 PM peak, bringing net grid import to 0 kW.',
    diurnalScheduleDescription: 'Discharges only during high-cost utility peak intervals, reserving 40% minimum state of charge for driving.',
  },
  {
    id: 'smart_pool_pump',
    name: 'Variable-Speed Smart Pool Pump',
    category: 'Utility',
    description: 'Frequency inverter pump tuned to run high-flow turnover only when solar generation is active.',
    nominalKW: 1.2,
    minKW: 0.3,
    maxKW: 2.4,
    stepKW: 0.1,
    defaultMode: 'solar_match',
    supportedModes: ['solar_match', 'off_peak_tou', 'always_on', 'off'],
    badgeColor: 'text-blue-400 bg-blue-950/80 border-blue-800/80',
    iconType: 'waves',
    smartBenefit: 'Cuts pool filtration utility cost by 78% by shifting 6-hour turnover to midday solar curve.',
    diurnalScheduleDescription: 'Ramps up to 3000 RPM at 11:30 AM; throttles down to 1000 RPM off-peak eco flow.',
  },
  {
    id: 'induction_range',
    name: 'Smart Induction Range & Kitchen Hub',
    category: 'Kitchen',
    description: 'Instant electromagnetic induction cooking. Clean electrification replacing methane gas cooking with 90% heat efficiency.',
    nominalKW: 2.4,
    minKW: 0.8,
    maxKW: 3.6,
    stepKW: 0.2,
    defaultMode: 'always_on',
    supportedModes: ['always_on', 'off_peak_tou', 'off'],
    badgeColor: 'text-amber-400 bg-amber-950/80 border-amber-800/80',
    iconType: 'flame',
    smartBenefit: 'Zero indoor combustion emissions, 90% thermal efficiency vs 38% for gas burners.',
    diurnalScheduleDescription: 'Active during breakfast (7:00 - 8:30) and dinner meal prep (17:30 - 19:30).',
  },
  {
    id: 'smart_shading',
    name: 'Automated Solar Shading & Smart Glazing',
    category: 'Climate Control',
    description: 'Motorized exterior louvers and electrochromic glass that dynamically adjust based on solar azimuth.',
    nominalKW: 0.8,
    minKW: 0.3,
    maxKW: 1.5,
    stepKW: 0.1,
    defaultMode: 'solar_match',
    supportedModes: ['solar_match', 'always_on', 'off'],
    badgeColor: 'text-sky-400 bg-sky-950/80 border-sky-800/80',
    iconType: 'sun',
    smartBenefit: 'Blocks up to 82% of radiant solar heat gain, reducing heat pump chiller electrical demand by ~0.8 kW.',
    diurnalScheduleDescription: 'Deploys automatically when solar radiation exceeds 450 W/m²; retracts during winter low-sun for passive heating.',
  },
];

export const DEFAULT_SMART_DEVICES_STATE: Record<SmartDeviceId, SmartDeviceUserState> = {
  ev_charger: {
    enabled: true,
    mode: 'solar_match',
    userPowerKW: 7.2,
  },
  smart_thermostat: {
    enabled: true,
    mode: 'eco_shed',
    userPowerKW: 1.5,
  },
  heat_pump_wh: {
    enabled: true,
    mode: 'solar_match',
    userPowerKW: 0.9,
  },
  v2g_ev_battery: {
    enabled: false,
    mode: 'off_peak_tou',
    userPowerKW: 3.5,
  },
  smart_pool_pump: {
    enabled: true,
    mode: 'solar_match',
    userPowerKW: 1.2,
  },
  induction_range: {
    enabled: false,
    mode: 'always_on',
    userPowerKW: 2.4,
  },
  smart_shading: {
    enabled: true,
    mode: 'solar_match',
    userPowerKW: 0.8,
  },
};

export interface SmartDeviceScenario {
  id: string;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  accentClass: string;
  state: Record<SmartDeviceId, SmartDeviceUserState>;
}

export const SMART_DEVICE_PRESETS: SmartDeviceScenario[] = [
  {
    id: 'solar_maximizer',
    title: '100% Solar Self-Consumption',
    tagline: 'Zero Grid Curtailment',
    description: 'EV Charger, Heat Pump Water Heater, and Pool Pump dynamically track solar generation to soak up every kWh of rooftop PV.',
    badge: 'Solar Sync',
    accentClass: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
    state: {
      ev_charger: { enabled: true, mode: 'solar_match', userPowerKW: 7.2 },
      smart_thermostat: { enabled: true, mode: 'solar_match', userPowerKW: 1.2 },
      heat_pump_wh: { enabled: true, mode: 'solar_match', userPowerKW: 1.2 },
      v2g_ev_battery: { enabled: false, mode: 'off', userPowerKW: 3.5 },
      smart_pool_pump: { enabled: true, mode: 'solar_match', userPowerKW: 1.5 },
      induction_range: { enabled: false, mode: 'off', userPowerKW: 2.4 },
      smart_shading: { enabled: true, mode: 'solar_match', userPowerKW: 0.8 },
    },
  },
  {
    id: 'evening_peak_surge',
    title: 'Unmanaged Evening Peak Surge',
    tagline: 'High Grid Stress & Cost',
    description: 'Simulates what happens without smart coordination: EV charging at full blast, induction cooking, and AC running simultaneously during peak 6 PM utility rates.',
    badge: 'Stress Test',
    accentClass: 'border-red-500/50 bg-red-950/20 text-red-300',
    state: {
      ev_charger: { enabled: true, mode: 'always_on', userPowerKW: 9.6 },
      smart_thermostat: { enabled: true, mode: 'always_on', userPowerKW: 2.0 },
      heat_pump_wh: { enabled: true, mode: 'always_on', userPowerKW: 3.8 },
      v2g_ev_battery: { enabled: false, mode: 'off', userPowerKW: 3.5 },
      smart_pool_pump: { enabled: true, mode: 'always_on', userPowerKW: 1.8 },
      induction_range: { enabled: true, mode: 'always_on', userPowerKW: 3.0 },
      smart_shading: { enabled: false, mode: 'off', userPowerKW: 0.8 },
    },
  },
  {
    id: 'v2g_peak_shave',
    title: 'V2G + Smart Peak Shaving',
    tagline: 'Virtual Power Plant (VPP)',
    description: 'Thermostat pre-cooled load shedding combined with V2G bi-directional discharge eliminates expensive 4 PM - 9 PM grid import entirely.',
    badge: 'Grid Resilient',
    accentClass: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
    state: {
      ev_charger: { enabled: false, mode: 'off', userPowerKW: 7.2 },
      smart_thermostat: { enabled: true, mode: 'eco_shed', userPowerKW: 1.5 },
      heat_pump_wh: { enabled: true, mode: 'off_peak_tou', userPowerKW: 0.9 },
      v2g_ev_battery: { enabled: true, mode: 'off_peak_tou', userPowerKW: 4.5 },
      smart_pool_pump: { enabled: true, mode: 'off_peak_tou', userPowerKW: 0.8 },
      induction_range: { enabled: false, mode: 'off', userPowerKW: 2.4 },
      smart_shading: { enabled: true, mode: 'solar_match', userPowerKW: 0.8 },
    },
  },
  {
    id: 'eco_standby',
    title: 'Eco Baseload Minimum',
    tagline: 'Deep Energy Conservation',
    description: 'All non-essential flexible appliances throttled to ultra-low standby or off-peak windows, minimizing total facility draw.',
    badge: 'Ultra Low Carbon',
    accentClass: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300',
    state: {
      ev_charger: { enabled: false, mode: 'off', userPowerKW: 7.2 },
      smart_thermostat: { enabled: true, mode: 'eco_shed', userPowerKW: 1.0 },
      heat_pump_wh: { enabled: true, mode: 'off_peak_tou', userPowerKW: 0.5 },
      v2g_ev_battery: { enabled: false, mode: 'off', userPowerKW: 3.5 },
      smart_pool_pump: { enabled: false, mode: 'off', userPowerKW: 0.6 },
      induction_range: { enabled: false, mode: 'off', userPowerKW: 2.4 },
      smart_shading: { enabled: true, mode: 'always_on', userPowerKW: 0.8 },
    },
  },
];

/**
 * Calculates physics-grounded net load additions or reductions from all active smart appliances
 * based on current diurnal sun hour, solar generation, and TOU tariff periods.
 */
export function simulateSmartDevicesDemand(
  devicesState: Record<string, SmartDeviceUserState> | undefined,
  simParams: SimulationParams
): SmartDevicesSimulationResult {
  const stateMap = devicesState || DEFAULT_SMART_DEVICES_STATE;
  const hour = simParams.sunAngleHour;
  const isDay = hour >= 5.5 && hour <= 18.5;
  const sunRatio = isDay ? Math.sin(((hour - 5.5) / 13.0) * Math.PI) : 0;
  const yieldFactor = simParams.solarYieldMultiplier ?? 1.0;
  const solarKW = isDay ? Number((simParams.solarCapacityKW * sunRatio * yieldFactor * 0.92).toFixed(2)) : 0;

  // Facility base load without smart devices
  const occupancyFactor = hour >= 8 && hour <= 18 ? 1.0 : hour > 18 && hour <= 22 ? 1.15 : 0.65;
  const baseLoadKW = Number(((simParams.buildingSizeSqFt / 2400) * 1.4 * occupancyFactor).toFixed(2));
  const diurnalTemp = simParams.ambientTempC + 3.5 * Math.sin(((hour - 8.5) / 24) * 2 * Math.PI);
  const tempDelta = Math.abs(diurnalTemp - 21);
  const hvacLoadKW = Number(((tempDelta * 0.35 + 1.2) * (3.8 / simParams.heatPumpCop)).toFixed(2));
  const facilityBaselineLoadKW = baseLoadKW + hvacLoadKW;

  // Peak TOU window is typically 16:00 (4 PM) to 21:00 (9 PM)
  const isPeakTariff = hour >= 16 && hour <= 21;
  const isOffPeakOvernight = hour >= 22 || hour < 6;

  const deviceDrawsKW: Record<SmartDeviceId, number> = {
    ev_charger: 0,
    smart_thermostat: 0,
    heat_pump_wh: 0,
    induction_range: 0,
    smart_pool_pump: 0,
    v2g_ev_battery: 0,
    smart_shading: 0,
  };

  let activeCount = 0;

  // 1. Level 2 EV Charger
  const evState = stateMap.ev_charger || DEFAULT_SMART_DEVICES_STATE.ev_charger;
  if (evState.enabled && evState.mode !== 'off') {
    activeCount++;
    const setPower = evState.userPowerKW ?? 7.2;
    if (evState.mode === 'always_on') {
      deviceDrawsKW.ev_charger = setPower;
    } else if (evState.mode === 'solar_match') {
      // Modulates charging based on available solar surplus over facility baseline
      const solarSurplus = Math.max(0, solarKW - facilityBaselineLoadKW);
      if (solarSurplus > 1.4) {
        deviceDrawsKW.ev_charger = Number(Math.min(setPower, solarSurplus).toFixed(2));
      } else {
        deviceDrawsKW.ev_charger = 0;
      }
    } else if (evState.mode === 'off_peak_tou') {
      // Charges only during overnight super off-peak hours
      if (isOffPeakOvernight) {
        deviceDrawsKW.ev_charger = setPower;
      } else {
        deviceDrawsKW.ev_charger = 0;
      }
    }
  }

  // 2. Smart Thermostat
  const thermoState = stateMap.smart_thermostat || DEFAULT_SMART_DEVICES_STATE.smart_thermostat;
  if (thermoState.enabled && thermoState.mode !== 'off') {
    activeCount++;
    const thermoRating = thermoState.userPowerKW ?? 1.5;
    if (thermoState.mode === 'eco_shed') {
      if (isPeakTariff) {
        // Pre-cooled home lets HVAC float during peak: saves up to thermoRating kW
        deviceDrawsKW.smart_thermostat = -Number(thermoRating.toFixed(2));
      } else if (hour >= 12 && hour < 16) {
        // Pre-cooling window using midday solar
        deviceDrawsKW.smart_thermostat = Number((thermoRating * 0.45).toFixed(2));
      } else {
        deviceDrawsKW.smart_thermostat = 0;
      }
    } else if (thermoState.mode === 'solar_match') {
      if (solarKW > 4) {
        // Sub-cool home to bank thermal inertia
        deviceDrawsKW.smart_thermostat = Number((thermoRating * 0.6).toFixed(2));
      } else if (hour >= 17 && hour <= 21) {
        deviceDrawsKW.smart_thermostat = -Number((thermoRating * 0.8).toFixed(2));
      } else {
        deviceDrawsKW.smart_thermostat = 0;
      }
    } else if (thermoState.mode === 'always_on') {
      deviceDrawsKW.smart_thermostat = 0;
    }
  }

  // 3. Heat Pump Water Heater
  const whState = stateMap.heat_pump_wh || DEFAULT_SMART_DEVICES_STATE.heat_pump_wh;
  if (whState.enabled && whState.mode !== 'off') {
    activeCount++;
    const whRating = whState.userPowerKW ?? 0.9;
    if (whState.mode === 'solar_match') {
      // Heats water tank during peak solar hours
      if (hour >= 10 && hour <= 15) {
        deviceDrawsKW.heat_pump_wh = whRating;
      } else {
        deviceDrawsKW.heat_pump_wh = 0.05; // standby
      }
    } else if (whState.mode === 'off_peak_tou') {
      if (hour >= 1 && hour <= 5) {
        deviceDrawsKW.heat_pump_wh = whRating;
      } else {
        deviceDrawsKW.heat_pump_wh = 0.05;
      }
    } else if (whState.mode === 'always_on') {
      deviceDrawsKW.heat_pump_wh = whRating;
    }
  }

  // 4. V2G Bi-Directional Power
  const v2gState = stateMap.v2g_ev_battery || DEFAULT_SMART_DEVICES_STATE.v2g_ev_battery;
  if (v2gState.enabled && v2gState.mode !== 'off') {
    activeCount++;
    const v2gRating = v2gState.userPowerKW ?? 3.5;
    if (v2gState.mode === 'off_peak_tou') {
      if (isPeakTariff) {
        // Injects power back into the home to shed grid peak
        deviceDrawsKW.v2g_ev_battery = -Number(v2gRating.toFixed(2));
      } else if (isOffPeakOvernight) {
        // Slowly recharges EV at cheap off-peak rates
        deviceDrawsKW.v2g_ev_battery = Number((v2gRating * 0.6).toFixed(2));
      } else {
        deviceDrawsKW.v2g_ev_battery = 0;
      }
    } else if (v2gState.mode === 'solar_match') {
      if (solarKW > facilityBaselineLoadKW + 3.0) {
        deviceDrawsKW.v2g_ev_battery = Number(Math.min(v2gRating, solarKW * 0.5).toFixed(2)); // absorption
      } else if (hour >= 18 && hour <= 22) {
        deviceDrawsKW.v2g_ev_battery = -Number(v2gRating.toFixed(2)); // evening discharge
      } else {
        deviceDrawsKW.v2g_ev_battery = 0;
      }
    } else if (v2gState.mode === 'always_on') {
      deviceDrawsKW.v2g_ev_battery = -Number((v2gRating * 0.5).toFixed(2));
    }
  }

  // 5. Smart Pool Pump
  const poolState = stateMap.smart_pool_pump || DEFAULT_SMART_DEVICES_STATE.smart_pool_pump;
  if (poolState.enabled && poolState.mode !== 'off') {
    activeCount++;
    const poolRating = poolState.userPowerKW ?? 1.2;
    if (poolState.mode === 'solar_match') {
      if (hour >= 10 && hour <= 15) {
        deviceDrawsKW.smart_pool_pump = poolRating;
      } else {
        deviceDrawsKW.smart_pool_pump = 0.15; // low eco trickle
      }
    } else if (poolState.mode === 'off_peak_tou') {
      if (hour >= 23 || hour <= 5) {
        deviceDrawsKW.smart_pool_pump = Number((poolRating * 0.8).toFixed(2));
      } else {
        deviceDrawsKW.smart_pool_pump = 0.1;
      }
    } else if (poolState.mode === 'always_on') {
      deviceDrawsKW.smart_pool_pump = poolRating;
    }
  }

  // 6. Induction Range
  const kitchenState = stateMap.induction_range || DEFAULT_SMART_DEVICES_STATE.induction_range;
  if (kitchenState.enabled && kitchenState.mode !== 'off') {
    activeCount++;
    const rangeRating = kitchenState.userPowerKW ?? 2.4;
    if (kitchenState.mode === 'always_on') {
      // Active whenever enabled, simulated higher during dinner/breakfast
      const isCookingTime = (hour >= 17.5 && hour <= 19.5) || (hour >= 7.0 && hour <= 8.5);
      deviceDrawsKW.induction_range = isCookingTime ? rangeRating : Number((rangeRating * 0.25).toFixed(2));
    } else if (kitchenState.mode === 'off_peak_tou') {
      deviceDrawsKW.induction_range = isPeakTariff ? 0 : rangeRating;
    }
  }

  // 7. Smart Shading / Electrochromic Glazing
  const shadeState = stateMap.smart_shading || DEFAULT_SMART_DEVICES_STATE.smart_shading;
  if (shadeState.enabled && shadeState.mode !== 'off') {
    activeCount++;
    const shadeRating = shadeState.userPowerKW ?? 0.8;
    if (shadeState.mode === 'solar_match') {
      if (sunRatio > 0.35 && diurnalTemp > 20) {
        // Reduces HVAC cooling requirement
        deviceDrawsKW.smart_shading = -Number((shadeRating * sunRatio).toFixed(2));
      } else {
        deviceDrawsKW.smart_shading = 0;
      }
    } else if (shadeState.mode === 'always_on') {
      deviceDrawsKW.smart_shading = -Number((shadeRating * 0.7).toFixed(2));
    }
  }

  // Calculate sum of draws
  let totalSmartLoadKW = 0;
  for (const val of Object.values(deviceDrawsKW)) {
    totalSmartLoadKW += val;
  }
  totalSmartLoadKW = Number(totalSmartLoadKW.toFixed(2));

  // Calculate peak hour shed (how much load was avoided or reversed during 16:00 - 21:00)
  let peakHourShedKW = 0;
  if (isPeakTariff) {
    if (deviceDrawsKW.v2g_ev_battery < 0) peakHourShedKW += Math.abs(deviceDrawsKW.v2g_ev_battery);
    if (deviceDrawsKW.smart_thermostat < 0) peakHourShedKW += Math.abs(deviceDrawsKW.smart_thermostat);
    if (deviceDrawsKW.smart_shading < 0) peakHourShedKW += Math.abs(deviceDrawsKW.smart_shading);
  }

  // Calculate solar self-consumption percentage
  const totalCombinedLoad = Math.max(0.2, facilityBaselineLoadKW + totalSmartLoadKW);
  let solarSelfConsumptionPct = 0;
  if (solarKW > 0) {
    const consumedFromSolar = Math.min(solarKW, totalCombinedLoad);
    solarSelfConsumptionPct = Math.min(100, Math.round((consumedFromSolar / solarKW) * 100));
  } else {
    solarSelfConsumptionPct = 100; // No solar to waste
  }

  // Cost and CO2 calculation
  const currentRate = isPeakTariff
    ? simParams.utilityRatePerKWh * 1.85
    : isOffPeakOvernight
    ? simParams.utilityRatePerKWh * 0.65
    : simParams.utilityRatePerKWh;

  const hourlyCostDelta = Number((totalSmartLoadKW * currentRate).toFixed(2));
  // Annual CO2: if smart load absorbs solar, CO2 reduction is positive; if grid, fossil factor
  const annualCo2DeltaKg = Math.round(
    peakHourShedKW * 365 * 0.385 + (solarSelfConsumptionPct > 80 ? 420 : 0)
  );

  return {
    totalSmartLoadKW,
    deviceDrawsKW,
    activeCount,
    solarSelfConsumptionPct,
    peakHourShedKW: Number(peakHourShedKW.toFixed(2)),
    hourlyCostDelta,
    annualCo2DeltaKg,
  };
}
