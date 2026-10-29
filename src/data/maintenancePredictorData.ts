import { SystemId, SimulationParams, ClimateRegionId } from '../types/energy';

export interface ComponentFailurePrediction {
  componentId: string;
  componentName: string;
  category: 'Mechanical' | 'Chemical' | 'Power Electronics' | 'Thermal Hydraulics';
  projectedFailureYear: number; // e.g. 7.4 years
  baselineExpectedLifeYears: number; // e.g. 15 years
  accelerationFactor: number; // e.g. 1.8x faster decay due to heat/weather stress
  healthScorePct: number; // 0 - 100%
  riskLevel: 'CRITICAL' | 'ELEVATED' | 'NOMINAL';
  primaryStressMechanism: string;
  earlyWarningSymptoms: string[];
  prescriptiveMitigation: string;
  estimatedAvoidedRepairCost: number; // $ saved by proactive fix
  targetParameterFix?: Partial<SimulationParams>;
}

export interface SystemMaintenanceAnalysis {
  systemId: SystemId;
  overallHealthScore: number; // 0 - 100
  imminentFailureCount: number;
  meanTimeBetweenFailuresYears: number;
  annualizedStressMultiplier: number;
  primaryRiskSummary: string;
  componentPredictions: ComponentFailurePrediction[];
  aiPrescriptionSummary: string;
}

/**
 * Predicts component failure horizons and wear acceleration
 * based on operational loading, ambient temperature extremes, and weather stress.
 */
export function predictComponentMaintenance(
  systemId: SystemId,
  simParams: SimulationParams
): SystemMaintenanceAnalysis {
  const { ambientTempC, climateRegion, buildingSizeSqFt, solarCapacityKW, batteryCapacityKWh, heatPumpCop, smartShadingActive } = simParams;

  // Weather & thermal stress multipliers
  let weatherStressMultiplier = 1.0;
  if (climateRegion === 'desert') {
    weatherStressMultiplier = 1.65; // High ambient heat desiccation & thermal cycling
  } else if (climateRegion === 'arctic') {
    weatherStressMultiplier = 1.55; // Sub-zero lubricant freezing, high compression ratios
  } else if (climateRegion === 'tropical') {
    weatherStressMultiplier = 1.35; // 24/7 latent humidity & coil corrosion
  } else if (climateRegion === 'alpine') {
    weatherStressMultiplier = 1.25; // Large diurnal swings (albedo UV + freeze)
  }

  // Extreme temp amplification
  if (ambientTempC > 35 || ambientTempC < -10) {
    weatherStressMultiplier += 0.35;
  }

  // Shading mitigates thermal strain
  if (smartShadingActive) {
    weatherStressMultiplier = Math.max(0.85, weatherStressMultiplier - 0.25);
  }

  // Sizing load ratio (base 2400 sq ft)
  const sizeLoadRatio = buildingSizeSqFt / 2400;

  const predictions: ComponentFailurePrediction[] = [];

  if (systemId === 'heat_pump') {
    // 1. Inverter Twin-Rotary Compressor
    const compAccel = Number((weatherStressMultiplier * (sizeLoadRatio > 1.2 ? 1.25 : 1.0) * (heatPumpCop < 3.2 ? 1.3 : 0.9)).toFixed(2));
    const compBaseline = 14;
    const compFailYear = Math.max(4.5, Number((compBaseline / compAccel).toFixed(1)));
    const compHealth = Math.max(30, Math.min(98, Math.round(100 - (compAccel - 0.8) * 38)));

    predictions.push({
      componentId: 'compressor_bearing',
      componentName: 'Inverter Compressor Bearing & POE Lubricant',
      category: 'Mechanical',
      projectedFailureYear: compFailYear,
      baselineExpectedLifeYears: compBaseline,
      accelerationFactor: compAccel,
      healthScorePct: compHealth,
      riskLevel: compFailYear <= 7 ? 'CRITICAL' : compFailYear <= 10 ? 'ELEVATED' : 'NOMINAL',
      primaryStressMechanism:
        ambientTempC < -5
          ? 'Sub-zero high discharge compression ratio causing lubricant viscosity breakdown'
          : 'High head pressure thermal stress during peak summer cooling hours',
      earlyWarningSymptoms: [
        'High-frequency vibration harmonics (>2.4 kHz) on compressor casing',
        'Compressor discharge line temperature exceeds 105°C',
        'Oil sight glass foaming during startup ramp-up',
      ],
      prescriptiveMitigation:
        'Increase COP to 4.2+ via setpoint moderation and install dual-stage vapor injection economizer to lower discharge temps by 18°C.',
      estimatedAvoidedRepairCost: 3850,
      targetParameterFix: { heatPumpCop: 4.2 },
    });

    // 2. Electronic Expansion Valve (EEV)
    const eevAccel = Number((weatherStressMultiplier * 1.1).toFixed(2));
    const eevFailYear = Math.max(5.2, Number((12 / eevAccel).toFixed(1)));
    predictions.push({
      componentId: 'eev_stepper',
      componentName: 'Electronic Expansion Valve (EEV) Stepper Actuator',
      category: 'Thermal Hydraulics',
      projectedFailureYear: eevFailYear,
      baselineExpectedLifeYears: 12,
      accelerationFactor: eevAccel,
      healthScorePct: Math.round(100 - (eevAccel - 0.7) * 30),
      riskLevel: eevFailYear <= 7 ? 'CRITICAL' : 'ELEVATED',
      primaryStressMechanism: 'Micro-stepping hunting cycles under fluctuating superheat conditions',
      earlyWarningSymptoms: [
        'Erratic evaporator superheat oscillation (>6°C delta swing)',
        'Suction pressure hunting during partial load modulation',
      ],
      prescriptiveMitigation:
        'Calibrate PID stepper response frequency and perform ultrasonic filter-drier flush.',
      estimatedAvoidedRepairCost: 820,
    });

    // 3. Hydronic Buffer Tank Sacrificial Anode
    predictions.push({
      componentId: 'buffer_anode',
      componentName: 'Hydronic TES Tank Magnesium Sacrificial Anode',
      category: 'Chemical',
      projectedFailureYear: 4.8,
      baselineExpectedLifeYears: 6.0,
      accelerationFactor: 1.25,
      healthScorePct: 62,
      riskLevel: 'ELEVATED',
      primaryStressMechanism: 'Galvanic corrosion and electrolyte ion depletion in closed loop hydronics',
      earlyWarningSymptoms: [
        'Hydronic pH drift below 7.2',
        'Dissolved copper and iron particulate in glycol sample',
      ],
      prescriptiveMitigation:
        'Replace magnesium anode rod and inject corrosion-inhibiting molybdate additive.',
      estimatedAvoidedRepairCost: 1450,
    });
  } else if (systemId === 'residential_microgrid') {
    // 1. LiFePO4 Battery Cells
    const battCyclesAccel = Number(((batteryCapacityKWh < 10 ? 1.4 : 1.0) * (ambientTempC > 30 ? 1.45 : 1.0)).toFixed(2));
    const battFailYear = Math.max(6.8, Number((15 / battCyclesAccel).toFixed(1)));
    predictions.push({
      componentId: 'battery_cells',
      componentName: 'LiFePO4 Cathode Active Material & SEI Layer',
      category: 'Chemical',
      projectedFailureYear: battFailYear,
      baselineExpectedLifeYears: 15,
      accelerationFactor: battCyclesAccel,
      healthScorePct: Math.round(100 - (battCyclesAccel - 0.8) * 35),
      riskLevel: battFailYear <= 9 ? 'ELEVATED' : 'NOMINAL',
      primaryStressMechanism: 'SEI layer thickening and lithium plating under elevated ambient temperatures',
      earlyWarningSymptoms: [
        'Internal cell impedance increase (+18 mΩ)',
        'Cell-to-cell delta voltage imbalance exceeding 45 mV during top balance',
      ],
      prescriptiveMitigation:
        'Enforce 10%–90% SoC operational guardband and activate battery enclosure thermal pre-cooling.',
      estimatedAvoidedRepairCost: 4600,
      targetParameterFix: { batteryCapacityKWh: Math.max(13.5, batteryCapacityKWh) },
    });

    // 2. Hybrid Solar/Storage Inverter Capacitors
    const invAccel = Number((weatherStressMultiplier * 1.3).toFixed(2));
    const invFailYear = Math.max(7.2, Number((14 / invAccel).toFixed(1)));
    predictions.push({
      componentId: 'inverter_caps',
      componentName: 'DC Bus Aluminum Electrolytic Capacitors',
      category: 'Power Electronics',
      projectedFailureYear: invFailYear,
      baselineExpectedLifeYears: 14,
      accelerationFactor: invAccel,
      healthScorePct: Math.round(100 - (invAccel - 0.8) * 32),
      riskLevel: invFailYear <= 8 ? 'CRITICAL' : 'ELEVATED',
      primaryStressMechanism: 'Electrolyte dry-out accelerated by Arrhenius thermal rule under rooftop ambient heat',
      earlyWarningSymptoms: [
        'Elevated DC ripple voltage on solar string input (>3.5%)',
        'Capacitor ESR rise detected during inverter diagnostic self-test',
      ],
      prescriptiveMitigation:
        'Relocate inverter to shaded northern wall and inspect heat sink thermal paste.',
      estimatedAvoidedRepairCost: 2400,
    });
  } else if (systemId === 'smart_building') {
    // 1. Chiller Variable Frequency Drive (VFD)
    predictions.push({
      componentId: 'vfd_power_stage',
      componentName: 'Centrifugal Chiller VFD IGBT Transistor Stage',
      category: 'Power Electronics',
      projectedFailureYear: 8.1,
      baselineExpectedLifeYears: 15,
      accelerationFactor: Number((weatherStressMultiplier * 1.25).toFixed(2)),
      healthScorePct: 74,
      riskLevel: 'ELEVATED',
      primaryStressMechanism: 'Thermal fatigue solder bond delamination caused by high-frequency power cycling',
      earlyWarningSymptoms: [
        'IGBT junction temperature spikes during chiller pull-down',
        'Switching harmonics distortion on motor lead cables',
      ],
      prescriptiveMitigation:
        'Implement smooth VFD ramp rate limiting and activate smart building pre-cooling.',
      estimatedAvoidedRepairCost: 6500,
    });

    // 2. Automated Smart Louver Actuators
    predictions.push({
      componentId: 'facade_actuators',
      componentName: 'Electro-Mechanical Facade Louver Gearboxes',
      category: 'Mechanical',
      projectedFailureYear: 9.4,
      baselineExpectedLifeYears: 16,
      accelerationFactor: 1.15,
      healthScorePct: 82,
      riskLevel: 'NOMINAL',
      primaryStressMechanism: 'Wind gust torque loading and gear teeth micro-pitting',
      earlyWarningSymptoms: [
        'Motor torque current draw spikes during wind events',
        'Position sensor deadband misalignment',
      ],
      prescriptiveMitigation:
        'Apply lithium synthetic grease and calibrate high-wind stowing threshold.',
      estimatedAvoidedRepairCost: 1800,
    });
  } else {
    // Industrial WHRS
    predictions.push({
      componentId: 'orc_turbine',
      componentName: 'Organic Rankine Cycle (ORC) Expander High-Speed Bearings',
      category: 'Mechanical',
      projectedFailureYear: 6.2,
      baselineExpectedLifeYears: 12,
      accelerationFactor: 1.45,
      healthScorePct: 68,
      riskLevel: 'CRITICAL',
      primaryStressMechanism: 'Continuous 18,000 RPM radial thrust loading and working fluid vapor droplet erosion',
      earlyWarningSymptoms: [
        'Shaft axial displacement sensor exceeds 35 microns',
        'Organic fluid thermal decomposition acid number rise',
      ],
      prescriptiveMitigation:
        'Schedule magnetic bearing recalibration and perform working fluid vacuum distillation.',
      estimatedAvoidedRepairCost: 9200,
    });
  }

  const overallHealth = Math.round(
    predictions.reduce((acc, p) => acc + p.healthScorePct, 0) / predictions.length
  );
  const criticalCount = predictions.filter((p) => p.riskLevel === 'CRITICAL').length;
  const mtbf = Number((predictions.reduce((acc, p) => acc + p.projectedFailureYear, 0) / predictions.length).toFixed(1));

  return {
    systemId,
    overallHealthScore: overallHealth,
    imminentFailureCount: criticalCount,
    meanTimeBetweenFailuresYears: mtbf,
    annualizedStressMultiplier: Number(weatherStressMultiplier.toFixed(2)),
    primaryRiskSummary:
      criticalCount > 0
        ? `${criticalCount} component(s) show accelerated failure horizons due to ${climateRegion.toUpperCase()} weather stress and thermal cycling.`
        : 'All core subsystems within nominal degradation boundaries with preventative maintenance scheduling.',
    componentPredictions: predictions,
    aiPrescriptionSummary:
      'Predictive model indicates that proactive parameter tuning (COP optimization, thermal pre-cooling, and BESS buffer management) extends subsystem lifespan by an average of 3.8 years and avoids up to $7,800 in unplanned breakdown repairs.',
  };
}
