import { SystemId, SimulationParams } from '../types/energy';

export interface MaintenanceMilestone {
  year: number;
  title: string;
  category: 'Overhaul' | 'Inspection' | 'Rebalance' | 'Fluid Service' | 'Component Swap';
  cost: number;
  description: string;
  impact: string;
  criticality: 'CRITICAL' | 'RECOMMENDED' | 'ROUTINE';
}

export interface YearLifecycleDataPoint {
  year: number;
  cumulativeCashFlow: number;
  annualSavings: number;
  annualOMCost: number;
  netAnnualCashFlow: number;
  systemHealthPercent: number; // 0 - 100
  unmaintainedHealthPercent: number; // 0 - 100
  subsystemRetention: {
    primary: number; // e.g. PV or Compressor
    storageOrAux: number; // e.g. Battery or TES
    controls: number; // e.g. Inverter/BMS
  };
  milestone?: MaintenanceMilestone;
}

export interface SystemLifecycleConfig {
  systemId: SystemId;
  systemName: string;
  grossCapEx: number;
  rebatesAndIncentives: number; // e.g. ITC 30%
  baseAnnualSavings: number;
  annualRoutineOM: number;
  annualCo2ReductionTons: number;
  primaryDegradationPerYear: number; // % e.g. 0.5%
  secondaryDegradationPerYear: number; // % e.g. 1.8%
  tertiaryDegradationPerYear: number; // % e.g. 0.4%
  primaryLabel: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  milestones: MaintenanceMilestone[];
}

export const SYSTEM_LIFECYCLE_CONFIGS: Record<SystemId, SystemLifecycleConfig> = {
  heat_pump: {
    systemId: 'heat_pump',
    systemName: 'Advanced Cold-Climate Inverter Heat Pump & TES Buffer',
    grossCapEx: 19500,
    rebatesAndIncentives: 4000, // IRA 25C tax credit ($2,000) + local electric utility electrification rebate ($2,000)
    baseAnnualSavings: 2750,
    annualRoutineOM: 140,
    annualCo2ReductionTons: 4.8,
    primaryDegradationPerYear: 0.42, // Compressor / thermodynamic COP drift
    secondaryDegradationPerYear: 0.35, // TES Hydronic thermal buffer standing loss
    tertiaryDegradationPerYear: 0.25, // Inverter drive semiconductor efficiency
    primaryLabel: 'Compressor Heat Output COP',
    secondaryLabel: 'Hydronic TES Thermal Retention',
    tertiaryLabel: 'SiC Inverter Electronics',
    milestones: [
      {
        year: 1,
        title: 'Initial Seasonal Commissioning & Thermal Imaging Audit',
        category: 'Inspection',
        cost: 0,
        description: 'Manufacturer warranty initial validation, infrared scan of hydronic joints, and flow balancing calibration.',
        impact: 'Verifies baseline COP rating (4.2)',
        criticality: 'ROUTINE',
      },
      {
        year: 3,
        title: 'Refrigerant Charge Verification & Microchannel Coil Wash',
        category: 'Fluid Service',
        cost: 220,
        description: 'Electronic R32/R290 leak detection test, pressure transducer calibration, and eco-friendly hydrophilic coil detergent rinse.',
        impact: 'Prevents 3-5% seasonal COP degradation',
        criticality: 'RECOMMENDED',
      },
      {
        year: 5,
        title: 'Major 5-Year Overhaul: Glycol PH Test & Expansion Tank Recharge',
        category: 'Overhaul',
        cost: 480,
        description: 'Hydronic buffer closed-loop fluid analysis, corrosion inhibitor replenishment, expansion vessel nitrogen bladder repressurization.',
        impact: 'Protects heat exchanger from internal mineral scaling',
        criticality: 'CRITICAL',
      },
      {
        year: 8,
        title: 'Circulator Pump Impeller Check & Smart Thermostat Telemetry Update',
        category: 'Inspection',
        cost: 260,
        description: 'ECM wet-rotor circulator bearing vibration test and firmware algorithm update for OpenADR dynamic utility pricing.',
        impact: 'Maintains optimal 12 GPM flow rate',
        criticality: 'RECOMMENDED',
      },
      {
        year: 10,
        title: 'Decade Milestone: Inverter Capacitor Refresh & Fan BLDC Bearings',
        category: 'Component Swap',
        cost: 1150,
        description: 'Preventative replacement of power board electrolytic capacitors and outdoor axial fan sealed bearings before mechanical fatigue.',
        impact: 'Extends compressor operating life beyond 20 years',
        criticality: 'CRITICAL',
      },
      {
        year: 12,
        title: 'Hydronic 3-Way Diverter Actuator Replacement',
        category: 'Component Swap',
        cost: 380,
        description: 'Swaps motorized zone diverter valve regulating space heating vs domestic hot water priority.',
        impact: 'Eliminates valve sticking and thermal cross-leakage',
        criticality: 'RECOMMENDED',
      },
      {
        year: 15,
        title: 'Synthetic Polyolester (POE) Compressor Lubricant & Drier Core Flush',
        category: 'Fluid Service',
        cost: 650,
        description: 'Refrigerant evacuation, POE oil moisture analysis and recharge, liquid-line filter drier core renewal.',
        impact: 'Restores compressor thermal COP to 94% of brand-new baseline',
        criticality: 'CRITICAL',
      },
      {
        year: 18,
        title: 'Acoustic Sound Baffle Renewal & Vibration Isolator Bushings',
        category: 'Inspection',
        cost: 320,
        description: 'Replaces neoprene compressor footpads and chassis acoustic foam to maintain quiet <42 dBA operation.',
        impact: 'Dampens chassis acoustic resonance',
        criticality: 'ROUTINE',
      },
      {
        year: 20,
        title: 'End-of-Design-Life Diagnostic Assessment & Repowering Audit',
        category: 'Inspection',
        cost: 290,
        description: 'Complete thermodynamic performance log download, compressor motor winding insulation resistance test (Megger test).',
        impact: 'Enables safe operational extension or targeted repowering rebate',
        criticality: 'RECOMMENDED',
      },
    ],
  },
  residential_microgrid: {
    systemId: 'residential_microgrid',
    systemName: 'Residential Smart Solar Microgrid & BESS',
    grossCapEx: 33500,
    rebatesAndIncentives: 10050, // 30% Federal Residential Clean Energy Credit (Section 25D)
    baseAnnualSavings: 3850,
    annualRoutineOM: 160,
    annualCo2ReductionTons: 9.6,
    primaryDegradationPerYear: 0.50, // Premium N-type TOPCon solar degradation
    secondaryDegradationPerYear: 1.85, // LiFePO4 battery capacity fade per year
    tertiaryDegradationPerYear: 0.30, // Hybrid inverter conversion efficiency
    primaryLabel: 'Rooftop Solar PV Yield',
    secondaryLabel: 'LiFePO4 Battery Usable Capacity',
    tertiaryLabel: 'Hybrid Inverter Conversion',
    milestones: [
      {
        year: 1,
        title: 'Post-Install Interconnection Audit & Rapid Shutdown Test',
        category: 'Inspection',
        cost: 0,
        description: 'NEC 690.12 rapid shutdown compliance confirmation, micro-inverter telemetry check, net-metering sync.',
        impact: 'Guarantees utility interconnection tariff compliance',
        criticality: 'ROUTINE',
      },
      {
        year: 3,
        title: 'Thermal Drone Inspection of Solar PV Modules',
        category: 'Inspection',
        cost: 180,
        description: 'Thermographic drone sweep to detect diode bypass hotspots, micro-cracking, or cell shading irregularities.',
        impact: 'Catches localized cell hotspots before glass delamination',
        criticality: 'RECOMMENDED',
      },
      {
        year: 5,
        title: 'Battery Cell Active Balancing & Coolant Loop Inspection',
        category: 'Rebalance',
        cost: 320,
        description: 'Internal BESS diagnostic cycling, cell pack voltage differential trim (<15mV), dielectric glycol fluid check.',
        impact: 'Preserves LiFePO4 battery cycle life',
        criticality: 'RECOMMENDED',
      },
      {
        year: 8,
        title: 'Smart Subpanel Contactor Inspection & Firmware Security Upgrade',
        category: 'Inspection',
        cost: 240,
        description: 'Torque check on high-amperage lugs, contactor wear cycle audit, cybersecurity encryption update.',
        impact: 'Ensures instantaneous 16ms grid islanding in blackouts',
        criticality: 'ROUTINE',
      },
      {
        year: 10,
        title: 'Mid-Life Milestone: Hybrid Inverter Power Electronics Refurbishment',
        category: 'Overhaul',
        cost: 2200,
        description: 'Scheduled replacement or overhaul of hybrid solar/battery inverter unit following standard 10-year manufacturer warranty period.',
        impact: 'Restores inverter 98% conversion efficiency and adds another 10-year warranty',
        criticality: 'CRITICAL',
      },
      {
        year: 12,
        title: 'Solar Array Anti-Soiling Nanocoating Reapplication',
        category: 'Fluid Service',
        cost: 450,
        description: 'Hydrophobic anti-reflective coating spray to shed pollen, dust, and particulate matter without abrasive scrubbing.',
        impact: 'Recovers +4.2% annual optical solar harvest',
        criticality: 'RECOMMENDED',
      },
      {
        year: 15,
        title: 'BESS Battery Pack Mid-Life Cell Health Optimization',
        category: 'Component Swap',
        cost: 1650,
        description: 'Selective module reconditioning or auxiliary module add-on to keep total usable capacity above 80% baseline.',
        impact: 'Maintains overnight whole-home backup autonomy',
        criticality: 'CRITICAL',
      },
      {
        year: 18,
        title: 'Ground Fault Interrupter (GFCI) & Surge Protective Device (SPD) Refresh',
        category: 'Component Swap',
        cost: 310,
        description: 'Replaces Type 1 and Type 2 AC/DC surge protection cartridges safeguarding solar DC wiring and home appliances.',
        impact: 'Shields microgrid from grid voltage spikes and lightning events',
        criticality: 'RECOMMENDED',
      },
      {
        year: 20,
        title: '20-Year Solar Linear Power Warranty Benchmark',
        category: 'Inspection',
        cost: 250,
        description: 'Independent I-V curve tracer audit measuring 20-year degradation against guaranteed 88.5% nameplate threshold.',
        impact: 'Validates 25-year manufacturer power warranty claim',
        criticality: 'RECOMMENDED',
      },
    ],
  },
  smart_building: {
    systemId: 'smart_building',
    systemName: 'Net-Zero Commercial Smart Building & Microgrid',
    grossCapEx: 92000,
    rebatesAndIncentives: 24500, // Section 179D Energy Efficient Commercial Buildings Tax Deduction + Utility Peak Demand Rebates
    baseAnnualSavings: 16800,
    annualRoutineOM: 950,
    annualCo2ReductionTons: 82.4,
    primaryDegradationPerYear: 0.38, // Centrifugal mag-lev chiller IPLV drift
    secondaryDegradationPerYear: 0.45, // Commercial bifacial rooftop solar PV
    tertiaryDegradationPerYear: 0.32, // Electrochromic glass tint response speed
    primaryLabel: 'Magnetic-Bearing Chiller Efficiency',
    secondaryLabel: 'Commercial Rooftop PV Array',
    tertiaryLabel: 'Electrochromic Dynamic Glazing',
    milestones: [
      {
        year: 1,
        title: 'LEED Continuous Commissioning (Cx) & ASHRAE 90.1 Baseline',
        category: 'Inspection',
        cost: 0,
        description: 'Post-occupancy building envelope pressurization test, BACnet actuator re-tuning, daylight harvesting lux sensor sync.',
        impact: 'Locks in LEED Platinum EUI baseline of 24 kBtu/sq ft',
        criticality: 'ROUTINE',
      },
      {
        year: 3,
        title: 'Kinetic Facade Stepper Motor Torque & Wind Stow Audit',
        category: 'Inspection',
        cost: 650,
        description: 'Aviation-grade motor lubrication, anemometer hurricane stow interlock certification, exterior seal check.',
        impact: 'Prevents mechanical binding in high crosswinds',
        criticality: 'RECOMMENDED',
      },
      {
        year: 5,
        title: 'Waterside Economizer Plate Exchanger Deep Chemical Flushes',
        category: 'Fluid Service',
        cost: 1400,
        description: 'Clean-in-place (CIP) circulation descaling of titanium plate heat exchangers ensuring maximum winter free-cooling.',
        impact: 'Restores approach temperature within 1.2°C of wet bulb',
        criticality: 'CRITICAL',
      },
      {
        year: 8,
        title: 'EV Fast Charging Plaza Power Electronics Overhaul',
        category: 'Component Swap',
        cost: 2200,
        description: 'Replacing DC contactors, liquid-cooled charging cable assemblies, and ISO 15118 Plug&Charge comm modules.',
        impact: 'Restores 96.5% DC conversion and uptime to 99.8%',
        criticality: 'RECOMMENDED',
      },
      {
        year: 10,
        title: 'Major 10-Year Building Plant Overhaul: Central Inverters & Magnetic Bearings',
        category: 'Overhaul',
        cost: 6800,
        description: 'Magnetic levitation bearing capacitor reserve replacement, central 60kW solar string inverter retrofit, cooling tower fan belts.',
        impact: 'Preserves 0.32 kW/ton IPLV rating for the next 10 years',
        criticality: 'CRITICAL',
      },
      {
        year: 12,
        title: 'Electrochromic Dynamic Glass Busbar Seal & Driver Board Inspection',
        category: 'Inspection',
        cost: 1100,
        description: 'Low-voltage DC zone driver test, seal hermeticity check preventing peripheral argon leakage.',
        impact: 'Ensures 0.09 - 0.41 SHGC dynamic tint range',
        criticality: 'RECOMMENDED',
      },
      {
        year: 15,
        title: 'Central Chiller Low-GWP Refrigerant (HFO-1234ze) Purification',
        category: 'Fluid Service',
        cost: 2900,
        description: 'Non-condensable gas purge, acidity testing, moisture neutralization, and filter replacement on central chiller circuit.',
        impact: 'Prevents compressor impeller blade cavitation',
        criticality: 'CRITICAL',
      },
      {
        year: 18,
        title: 'BACnet / IP Building Automation Gateway & Sensor Renewal',
        category: 'Component Swap',
        cost: 1950,
        description: 'Replaces aging carbon dioxide (CO2), VOC, and temperature wireless mesh transmitters throughout all zones.',
        impact: 'Prevents indoor sensor drift causing ventilation overcooling',
        criticality: 'RECOMMENDED',
      },
      {
        year: 20,
        title: 'Comprehensive 20-Year Capital Renewal & Decarbonization Audit',
        category: 'Overhaul',
        cost: 1500,
        description: 'Investment-grade engineering lifecycle report to plan Year 21-30 rooftop PV repowering and thermal storage expansion.',
        impact: 'Unlocks next tier of commercial green bond financing',
        criticality: 'RECOMMENDED',
      },
    ],
  },
  industrial_whrs: {
    systemId: 'industrial_whrs',
    systemName: 'Industrial Waste Heat Recovery ORC Power Plant',
    grossCapEx: 142000,
    rebatesAndIncentives: 38000, // DOE Industrial Decarbonization Grant + State Clean Energy Heat-to-Power Incentive
    baseAnnualSavings: 28400,
    annualRoutineOM: 1800,
    annualCo2ReductionTons: 140.0,
    primaryDegradationPerYear: 0.48, // ORC Radial inflow turbine expander isentropic efficiency
    secondaryDegradationPerYear: 0.52, // Flue gas shell & tube heat exchanger thermal conductance
    tertiaryDegradationPerYear: 0.35, // Organic working fluid thermal decomposition
    primaryLabel: 'Turbine Expander Isentropic Eff.',
    secondaryLabel: 'Flue Gas Exchanger U-Value',
    tertiaryLabel: 'Hydrocarbon Organic Working Fluid',
    milestones: [
      {
        year: 1,
        title: 'Factory Acceptance & Turbomachinery Baseline Vibration Scan',
        category: 'Inspection',
        cost: 0,
        description: 'Laser alignment of high-speed generator shaft, baseline acoustic emission scan, harmonic analysis.',
        impact: 'Establishes ISO 10816 vibration baseline (<1.8 mm/s)',
        criticality: 'ROUTINE',
      },
      {
        year: 3,
        title: 'Exhaust Flue Gas Soot Blowing & Tube Bundle Acoustic Cleaning',
        category: 'Fluid Service',
        cost: 1200,
        description: 'Ultrasonic acoustic horn inspection, particulate descaling on 316L stainless heat exchanger tube banks.',
        impact: 'Restores 450°C heat absorption capacity',
        criticality: 'RECOMMENDED',
      },
      {
        year: 5,
        title: 'Radial Turbine Ceramic Mechanical Seal & Bearing Replacement',
        category: 'Component Swap',
        cost: 4200,
        description: 'Replaces pressurized dual dry-gas mechanical seals preventing organic working fluid leakage to atmosphere.',
        impact: 'Guarantees zero fugitives emissions of cyclopentane/siloxane',
        criticality: 'CRITICAL',
      },
      {
        year: 8,
        title: 'High-Speed Synchronous Generator Winding Varnish & Thermal Scan',
        category: 'Inspection',
        cost: 1500,
        description: 'Dielectric insulation discharge testing (tan delta), rotor re-balancing, automatic voltage regulator check.',
        impact: 'Guarantees 96.8% generator power conversion',
        criticality: 'RECOMMENDED',
      },
      {
        year: 10,
        title: 'Decade Overhaul: Complete Working Fluid Distillation & Expander Rotor Inspection',
        category: 'Overhaul',
        cost: 8900,
        description: 'Vacuum distillation of organic working fluid to remove thermal decomposition polymers, 5-axis titanium expander blade NDT ultrasound.',
        impact: 'Restores ORC cycle thermal efficiency to 98% of day-one spec',
        criticality: 'CRITICAL',
      },
      {
        year: 13,
        title: 'Condenser Air-Cooled Fin Coil High-Pressure Washing',
        category: 'Fluid Service',
        cost: 1800,
        description: 'Removes industrial dust buildup from V-bank air-cooled condensing units to maintain minimum condensing pressure.',
        impact: 'Prevents backpressure loss in peak summer ambient heat',
        criticality: 'RECOMMENDED',
      },
      {
        year: 15,
        title: 'High-Temperature Thermal Oil Circulating Pump Overhaul',
        category: 'Component Swap',
        cost: 3600,
        description: 'Replaces canned motor circulating pump housing, high-temperature silicon carbide bearings and casing gaskets.',
        impact: 'Ensures reliable 280°C thermal oil circulation',
        criticality: 'CRITICAL',
      },
      {
        year: 18,
        title: 'ASME Boiler & Pressure Vessel Code Re-Certification (BPVC Sec VIII)',
        category: 'Inspection',
        cost: 2100,
        description: 'Hydrostatic pressure test, safety relief valve lift pressure calibration, ultrasonic wall thickness scanning.',
        impact: 'Maintains plant operating permit and insurance compliance',
        criticality: 'CRITICAL',
      },
      {
        year: 20,
        title: '20-Year Industrial Turbogenerator Life Extension Assessment',
        category: 'Overhaul',
        cost: 2800,
        description: 'Metallurgical assessment of flue gas casing creep fatigue, economic feasibility of modern high-mach nozzle upgrade.',
        impact: 'Prepares system for another 10-15 years of waste heat capture',
        criticality: 'RECOMMENDED',
      },
    ],
  },
};

/**
 * Calculates a 20-year lifecycle financial and degradation trajectory
 */
export function calculateLifecycleTrajectory(
  systemId: SystemId,
  simParams: SimulationParams,
  energyInflationRate: number = 0.032, // 3.2% annual escalation
  maintenanceStrategy: 'preventative' | 'reactive' = 'preventative'
): {
  dataPoints: YearLifecycleDataPoint[];
  netCapEx: number;
  grossCapEx: number;
  totalIncentives: number;
  breakEvenYear: number | null; // e.g. 5.4
  total20YearSavings: number;
  total20YearOMCost: number;
  net20YearCashFlow: number;
  roi20YearPercent: number;
  irrPercent: number;
  lifetimeCo2AvoidedTons: number;
  year20HealthPercent: number;
} {
  const config = SYSTEM_LIFECYCLE_CONFIGS[systemId] || SYSTEM_LIFECYCLE_CONFIGS.heat_pump;

  // Scale base savings dynamically based on simParams (utility rate, solar kW, climate multiplier)
  const utilityRateRatio = simParams.utilityRatePerKWh > 0 ? simParams.utilityRatePerKWh / 0.18 : 1.0;
  const climateMultiplier = simParams.solarYieldMultiplier || 1.0;
  
  // Custom system scale factors
  let systemScale = 1.0;
  if (systemId === 'residential_microgrid') {
    systemScale = (simParams.solarCapacityKW / 8.5) * 0.7 + (simParams.batteryCapacityKWh / 13.5) * 0.3;
  } else if (systemId === 'heat_pump') {
    systemScale = (simParams.heatPumpCop / 4.2) * (simParams.buildingSizeSqFt / 2400);
  } else if (systemId === 'smart_building') {
    systemScale = (simParams.buildingSizeSqFt / 2400) * 0.4 + 0.6;
  }

  // Adjusted Net CapEx (accounting for system scaling)
  const grossCapEx = Math.round(config.grossCapEx * (0.8 + 0.2 * systemScale));
  const totalIncentives = Math.round(config.rebatesAndIncentives * (0.8 + 0.2 * systemScale));
  const netCapEx = grossCapEx - totalIncentives;

  const initialAnnualSavings = config.baseAnnualSavings * utilityRateRatio * climateMultiplier * systemScale;

  // Milestones lookup by year
  const milestonesByYear = new Map<number, MaintenanceMilestone>();
  config.milestones.forEach((m) => milestonesByYear.set(m.year, m));

  const dataPoints: YearLifecycleDataPoint[] = [];

  let cumulativeCashFlow = -netCapEx;
  let total20YearSavings = 0;
  let total20YearOMCost = 0;
  let breakEvenYear: number | null = null;

  // Initial Year 0
  dataPoints.push({
    year: 0,
    cumulativeCashFlow: -netCapEx,
    annualSavings: 0,
    annualOMCost: 0,
    netAnnualCashFlow: -netCapEx,
    systemHealthPercent: 100,
    unmaintainedHealthPercent: 100,
    subsystemRetention: {
      primary: 100,
      storageOrAux: 100,
      controls: 100,
    },
  });

  // Degradation acceleration factors for reactive/unmaintained scenario
  const reactivePenalty = maintenanceStrategy === 'reactive' ? 1.9 : 1.0;

  for (let y = 1; y <= 20; y++) {
    // Inflation-adjusted utility tariff for this year
    const tariffEscalator = Math.pow(1 + energyInflationRate, y - 1);

    // Primary, Secondary, Tertiary degradation
    // Routine maintenance reduces degradation rate by refreshing components at key milestones
    let primaryDeg = config.primaryDegradationPerYear * reactivePenalty;
    let secondaryDeg = config.secondaryDegradationPerYear * reactivePenalty;
    let tertiaryDeg = config.tertiaryDegradationPerYear * reactivePenalty;

    // Check for major overhaul in previous years that restored performance
    let primaryHealth = Math.max(70, 100 - primaryDeg * y);
    let secondaryHealth = Math.max(55, 100 - secondaryDeg * y);
    let tertiaryHealth = Math.max(75, 100 - tertiaryDeg * y);

    // Preventative maintenance mid-life boost at Year 10
    if (maintenanceStrategy === 'preventative' && y >= 10) {
      primaryHealth = Math.min(98, primaryHealth + 4.5);
      secondaryHealth = Math.min(95, secondaryHealth + 6.0);
      tertiaryHealth = Math.min(99, tertiaryHealth + 5.0);
    }
    if (maintenanceStrategy === 'preventative' && y >= 15) {
      primaryHealth = Math.min(96, primaryHealth + 3.0);
    }

    const systemHealthPercent = Math.min(100, Math.round((primaryHealth * 0.45 + secondaryHealth * 0.35 + tertiaryHealth * 0.20) * 10) / 10);
    
    // Unmaintained degradation curve (steep drop, no midlife refresh)
    const unmaintainedHealthPercent = Math.max(40, Math.round((100 - (config.primaryDegradationPerYear * 2.1 * y * 0.45 + config.secondaryDegradationPerYear * 2.3 * y * 0.35 + config.tertiaryDegradationPerYear * 2.0 * y * 0.20)) * 10) / 10);

    // Effective capacity multiplier for savings
    const capacityFactor = (systemHealthPercent / 100);

    // Savings for year y
    const annualSavings = Math.round(initialAnnualSavings * tariffEscalator * capacityFactor);
    total20YearSavings += annualSavings;

    // O&M for year y
    let omCost = Math.round(config.annualRoutineOM * Math.pow(1 + 0.025, y - 1)); // routine inflated
    
    const milestone = milestonesByYear.get(y);
    if (milestone) {
      if (maintenanceStrategy === 'preventative') {
        omCost += milestone.cost;
      } else {
        // Reactive maintenance skips planned overhauls until catastrophic repair later
        if (y === 7 || y === 13 || y === 17) {
          omCost += Math.round(milestone.cost * 1.8); // expensive breakdown repairs
        } else {
          omCost = Math.round(omCost * 0.3); // minimal routine check
        }
      }
    }
    total20YearOMCost += omCost;

    const netAnnualCashFlow = annualSavings - omCost;
    const prevCashFlow = cumulativeCashFlow;
    cumulativeCashFlow += netAnnualCashFlow;

    // Check for break-even crossing
    if (prevCashFlow < 0 && cumulativeCashFlow >= 0 && breakEvenYear === null) {
      const fraction = -prevCashFlow / (cumulativeCashFlow - prevCashFlow);
      breakEvenYear = Math.round(((y - 1) + fraction) * 10) / 10;
    }

    dataPoints.push({
      year: y,
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      annualSavings,
      annualOMCost: omCost,
      netAnnualCashFlow,
      systemHealthPercent,
      unmaintainedHealthPercent,
      subsystemRetention: {
        primary: Math.round(primaryHealth * 10) / 10,
        storageOrAux: Math.round(secondaryHealth * 10) / 10,
        controls: Math.round(tertiaryHealth * 10) / 10,
      },
      milestone,
    });
  }

  // Calculate overall metrics
  const net20YearCashFlow = cumulativeCashFlow;
  const roi20YearPercent = netCapEx > 0 ? Math.round((net20YearCashFlow / netCapEx) * 100) : 0;
  
  // Approximate IRR using Newton-Raphson approximation
  let irr = 0.12; // Initial guess 12%
  for (let iter = 0; iter < 10; iter++) {
    let npv = -netCapEx;
    let dNpv = 0;
    for (let y = 1; y <= 20; y++) {
      const cf = dataPoints[y].netAnnualCashFlow;
      const discount = Math.pow(1 + irr, y);
      npv += cf / discount;
      dNpv -= (y * cf) / (discount * (1 + irr));
    }
    if (Math.abs(dNpv) < 1e-4) break;
    const nextIrr = irr - npv / dNpv;
    if (isNaN(nextIrr) || nextIrr < -0.5 || nextIrr > 2.0) break;
    irr = nextIrr;
  }
  const irrPercent = Math.max(0, Math.round(irr * 1000) / 10);

  const lifetimeCo2AvoidedTons = Math.round(config.annualCo2ReductionTons * 20 * climateMultiplier * 10) / 10;
  const year20HealthPercent = dataPoints[20].systemHealthPercent;

  return {
    dataPoints,
    netCapEx,
    grossCapEx,
    totalIncentives,
    breakEvenYear,
    total20YearSavings,
    total20YearOMCost,
    net20YearCashFlow,
    roi20YearPercent,
    irrPercent,
    lifetimeCo2AvoidedTons,
    year20HealthPercent,
  };
}
