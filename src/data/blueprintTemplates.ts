import { BlueprintTemplate } from '../types/energy';

export const BLUEPRINT_TEMPLATES: BlueprintTemplate[] = [
  {
    id: 'suburban_ranch',
    name: 'Suburban Single-Family Ranch',
    category: 'Single Story • 2,400 sq ft',
    sqFt: 2400,
    bedrooms: 3,
    bathrooms: 2.5,
    stories: 1,
    description: 'Classic single-story footprint with attached 2-car garage, dedicated mechanical utility room, south-facing pitched roof, and separated quiet bedroom wing.',
    dimensionsFeet: { width: 60, height: 40 },
    utilityEntrance: { x: 92, y: 35, label: '200A Grid Service Entrance' },
    rooms: [
      { id: 'garage', name: '2-Car Garage', x: 68, y: 20, width: 28, height: 42, type: 'garage' },
      { id: 'utility', name: 'Utility & Mechanical Rm', x: 50, y: 20, width: 18, height: 22, type: 'utility' },
      { id: 'kitchen', name: 'Kitchen & Dining', x: 32, y: 20, width: 18, height: 22, type: 'kitchen' },
      { id: 'living', name: 'Great Living Room', x: 32, y: 42, width: 36, height: 35, type: 'living' },
      { id: 'bed_primary', name: 'Primary Suite', x: 6, y: 20, width: 26, height: 30, type: 'bedroom', noiseSensitive: true },
      { id: 'bed_2', name: 'Bedroom 2', x: 6, y: 50, width: 14, height: 27, type: 'bedroom', noiseSensitive: true },
      { id: 'bed_3', name: 'Bedroom 3 / Office', x: 20, y: 50, width: 12, height: 27, type: 'bedroom', noiseSensitive: true },
      { id: 'patio_south', name: 'South Garden & Yard', x: 25, y: 80, width: 50, height: 16, type: 'patio' },
      { id: 'north_side_yard', name: 'North Exterior Service Yard', x: 45, y: 4, width: 30, height: 14, type: 'outdoor' },
    ],
    roofZones: [
      { id: 'roof_south', name: 'South Main Roof (Optimal)', azimuthDeg: 180, azimuthLabel: 'South (180°)', solarRatingPct: 98, x: 28, y: 45, width: 42, height: 32 },
      { id: 'roof_west', name: 'West Garage Slope', azimuthDeg: 270, azimuthLabel: 'West (270°)', solarRatingPct: 83, x: 70, y: 22, width: 24, height: 38 },
      { id: 'roof_north', name: 'North Roof (Shaded)', azimuthDeg: 0, azimuthLabel: 'North (0°)', solarRatingPct: 48, x: 6, y: 22, width: 32, height: 26 },
    ],
    walls: [
      // Outer perimeter
      { x1: 5, y1: 18, x2: 96, y2: 18, type: 'exterior' },
      { x1: 96, y1: 18, x2: 96, y2: 64, type: 'exterior' },
      { x1: 96, y1: 64, x2: 68, y2: 64, type: 'exterior' },
      { x1: 68, y1: 64, x2: 68, y2: 78, type: 'exterior' },
      { x1: 68, y1: 78, x2: 5, y2: 78, type: 'exterior' },
      { x1: 5, y1: 78, x2: 5, y2: 18, type: 'exterior' },
      // Internal partitioning
      { x1: 68, y1: 18, x2: 68, y2: 64, type: 'interior' },
      { x1: 50, y1: 18, x2: 50, y2: 42, type: 'interior' },
      { x1: 32, y1: 18, x2: 32, y2: 78, type: 'interior' },
      { x1: 32, y1: 42, x2: 68, y2: 42, type: 'interior' },
      { x1: 5, y1: 50, x2: 32, y2: 50, type: 'interior' },
      { x1: 20, y1: 50, x2: 20, y2: 78, type: 'interior' },
    ],
    doors: [
      { x: 68, y: 35, width: 3, height: 1 },
      { x: 50, y: 30, width: 3, height: 1 },
      { x: 32, y: 30, width: 3, height: 1 },
      { x: 32, y: 60, width: 3, height: 1 },
      { x: 20, y: 65, width: 3, height: 1 },
      { x: 50, y: 78, width: 6, height: 1 }, // Patio sliding door
    ],
    windows: [
      { x: 10, y: 18, width: 8, height: 1 },
      { x: 10, y: 78, width: 6, height: 1 },
      { x: 22, y: 78, width: 6, height: 1 },
      { x: 58, y: 78, width: 8, height: 1 },
      { x: 38, y: 18, width: 8, height: 1 },
    ],
    defaultPlacements: {
      solar_pv: { x: 18, y: 32 }, // Suboptimal: north roof
      heat_pump_outdoor: { x: 4, y: 35 }, // Suboptimal: right outside primary bedroom window!
      buffer_tank: { x: 55, y: 30 },
      battery_bess: { x: 15, y: 65 }, // Suboptimal: inside bedroom hallway
      smart_panel: { x: 88, y: 28 },
    },
    optimizedPlacements: {
      solar_pv: { x: 48, y: 60 }, // On high-insolation 180° South roof
      heat_pump_outdoor: { x: 55, y: 10 }, // On North service yard, near utility room & far from bedrooms (<40 dBA)
      buffer_tank: { x: 56, y: 28 }, // Centrally located in utility room, short 18 ft refrigerant run
      battery_bess: { x: 74, y: 25 }, // Safe garage exterior wall, NFPA 855 compliant, close to panel
      smart_panel: { x: 92, y: 26 }, // Directly next to 200A service entrance to cut conduit loss
    },
  },
  {
    id: 'modern_craftsman',
    name: 'Modern 2-Story Craftsman',
    category: 'Two Stories • 3,100 sq ft',
    sqFt: 3100,
    bedrooms: 4,
    bathrooms: 3.5,
    stories: 2,
    description: 'High-performance two-story envelope with walk-out utility zone, southwest roof gable for afternoon peak solar generation, and quiet perimeter setbacks.',
    dimensionsFeet: { width: 54, height: 46 },
    utilityEntrance: { x: 90, y: 68, label: 'Main Utility Meter' },
    rooms: [
      { id: 'garage_attached', name: 'Attached Garage', x: 64, y: 48, width: 30, height: 38, type: 'garage' },
      { id: 'mech_hub', name: 'Ground Mechanical Hub', x: 44, y: 52, width: 20, height: 26, type: 'utility' },
      { id: 'kitchen_open', name: 'Kitchen & Pantry', x: 44, y: 20, width: 20, height: 30, type: 'kitchen' },
      { id: 'living_family', name: 'Open Living & Dining', x: 8, y: 46, width: 36, height: 38, type: 'living' },
      { id: 'office_den', name: 'Study / Guest Suite', x: 8, y: 18, width: 34, height: 26, type: 'bedroom', noiseSensitive: true },
      { id: 'east_breezeway', name: 'East Service Alley', x: 46, y: 82, width: 24, height: 14, type: 'outdoor' },
      { id: 'rear_terrace', name: 'North Shaded Terrace', x: 12, y: 6, width: 40, height: 12, type: 'patio' },
    ],
    roofZones: [
      { id: 'roof_sw', name: 'South-West Gable (Peak TOU Yield)', azimuthDeg: 215, azimuthLabel: 'SW (215°)', solarRatingPct: 96, x: 12, y: 52, width: 32, height: 32 },
      { id: 'roof_south_craft', name: 'South Ridge', azimuthDeg: 180, azimuthLabel: 'South (180°)', solarRatingPct: 99, x: 44, y: 54, width: 24, height: 26 },
      { id: 'roof_ne', name: 'North-East Low Sun', azimuthDeg: 45, azimuthLabel: 'NE (45°)', solarRatingPct: 52, x: 10, y: 20, width: 34, height: 24 },
    ],
    walls: [
      { x1: 6, y1: 16, x2: 95, y2: 16, type: 'exterior' },
      { x1: 95, y1: 16, x2: 95, y2: 88, type: 'exterior' },
      { x1: 95, y1: 88, x2: 6, y2: 88, type: 'exterior' },
      { x1: 6, y1: 88, x2: 6, y2: 16, type: 'exterior' },
      { x1: 64, y1: 46, x2: 64, y2: 88, type: 'interior' },
      { x1: 44, y1: 16, x2: 44, y2: 88, type: 'interior' },
      { x1: 6, y1: 44, x2: 44, y2: 44, type: 'interior' },
      { x1: 44, y1: 50, x2: 64, y2: 50, type: 'interior' },
    ],
    doors: [
      { x: 64, y: 65, width: 3, height: 1 },
      { x: 44, y: 60, width: 3, height: 1 },
      { x: 44, y: 35, width: 3, height: 1 },
      { x: 25, y: 44, width: 3, height: 1 },
      { x: 20, y: 88, width: 6, height: 1 },
    ],
    windows: [
      { x: 15, y: 16, width: 8, height: 1 },
      { x: 50, y: 16, width: 8, height: 1 },
      { x: 14, y: 88, width: 8, height: 1 },
      { x: 28, y: 88, width: 8, height: 1 },
    ],
    defaultPlacements: {
      solar_pv: { x: 18, y: 26 }, // Suboptimal north-east roof
      heat_pump_outdoor: { x: 8, y: 30 }, // Too close to study/guest bedroom window
      buffer_tank: { x: 52, y: 64 },
      battery_bess: { x: 25, y: 70 },
      smart_panel: { x: 72, y: 55 },
    },
    optimizedPlacements: {
      solar_pv: { x: 26, y: 68 }, // High SW peak production
      heat_pump_outdoor: { x: 55, y: 92 }, // East service alley, acoustic isolation
      buffer_tank: { x: 52, y: 64 }, // Short 16 ft run to heat pump condenser
      battery_bess: { x: 68, y: 54 }, // Garage interior partition wall with thermal ventilation
      smart_panel: { x: 88, y: 60 }, // Direct feed from 200A service
    },
  },
  {
    id: 'urban_townhome',
    name: 'Urban Net-Zero Townhome',
    category: 'Rowhome • 1,850 sq ft',
    sqFt: 1850,
    bedrooms: 3,
    bathrooms: 2,
    stories: 3,
    description: 'Compact vertical living with party walls, flat cool-roof solar deck, interior mechanical chase, and sound-attenuated rear courtyard.',
    dimensionsFeet: { width: 28, height: 50 },
    utilityEntrance: { x: 86, y: 18, label: 'Street Utility Conduit' },
    rooms: [
      { id: 'foyer_entry', name: 'Front Foyer & Entry', x: 48, y: 12, width: 38, height: 22, type: 'living' },
      { id: 'stair_core', name: 'Stairwell & MEP Chase', x: 14, y: 12, width: 32, height: 28, type: 'utility' },
      { id: 'kitchen_town', name: 'Kitchen & Dining', x: 14, y: 40, width: 72, height: 22, type: 'kitchen' },
      { id: 'town_living', name: 'Courtyard Living', x: 14, y: 64, width: 72, height: 22, type: 'living' },
      { id: 'rear_courtyard', name: 'Private Rear Courtyard', x: 14, y: 88, width: 72, height: 10, type: 'outdoor' },
    ],
    roofZones: [
      { id: 'roof_flat_solar', name: 'Flat High-Albedo Solar Deck', azimuthDeg: 180, azimuthLabel: 'South / Unshaded', solarRatingPct: 97, x: 18, y: 25, width: 64, height: 50 },
    ],
    walls: [
      { x1: 12, y1: 10, x2: 88, y2: 10, type: 'exterior' },
      { x1: 88, y1: 10, x2: 88, y2: 88, type: 'exterior' },
      { x1: 88, y1: 88, x2: 12, y2: 88, type: 'exterior' },
      { x1: 12, y1: 88, x2: 12, y2: 10, type: 'exterior' },
      { x1: 46, y1: 10, x2: 46, y2: 38, type: 'interior' },
      { x1: 12, y1: 38, x2: 88, y2: 38, type: 'interior' },
      { x1: 12, y1: 62, x2: 88, y2: 62, type: 'interior' },
    ],
    doors: [
      { x: 68, y: 10, width: 5, height: 1 },
      { x: 46, y: 22, width: 3, height: 1 },
      { x: 50, y: 88, width: 6, height: 1 },
    ],
    windows: [
      { x: 20, y: 10, width: 6, height: 1 },
      { x: 25, y: 88, width: 6, height: 1 },
      { x: 65, y: 88, width: 6, height: 1 },
    ],
    defaultPlacements: {
      solar_pv: { x: 50, y: 50 },
      heat_pump_outdoor: { x: 18, y: 85 },
      buffer_tank: { x: 30, y: 24 },
      battery_bess: { x: 70, y: 30 },
      smart_panel: { x: 78, y: 15 },
    },
    optimizedPlacements: {
      solar_pv: { x: 50, y: 48 }, // Maximum coverage on flat roof with 15° tilt
      heat_pump_outdoor: { x: 74, y: 92 }, // Sound-baffled rear courtyard corner away from party walls
      buffer_tank: { x: 28, y: 22 }, // In MEP core chase, 22 ft vertical refrigerant line
      battery_bess: { x: 80, y: 24 }, // Enclosed utility nook under stairs
      smart_panel: { x: 82, y: 14 }, // Direct street entrance hookup
    },
  },
];

export const EQUIPMENT_DEFINITIONS = [
  {
    id: 'solar_pv' as const,
    name: 'Rooftop Solar PV Array',
    shortLabel: 'Solar PV',
    category: 'Renewables' as const,
    color: '#f59e0b', // amber-500
    iconType: 'sun' as const,
    clearanceNote: 'Maintain 3 ft perimeter fire ridge setback (IFC 1204)',
    engineeringRationale: 'Align with South (180°) or South-West (220°) roof planes to maximize kilowatt-hour production and coincide with late afternoon utility peak tariff rates.',
    efficiencyGain: '+18% annual kWh yield compared to shaded/north pitches',
    complianceCode: 'IRC R324 / IFC 1204.2',
  },
  {
    id: 'heat_pump_outdoor' as const,
    name: 'Inverter Heat Pump Condenser',
    shortLabel: 'Outdoor HP',
    category: 'HVAC Thermal' as const,
    color: '#06b6d4', // cyan-500
    iconType: 'wind' as const,
    clearanceNote: '12" rear wall clearance, 24" top clearance, sound isolation pad',
    engineeringRationale: 'Position on north or east exterior wall to avoid direct summer sun derating; keep within 25 ft of indoor buffer tank to keep refrigerant pressure drop < 1.5 psi and COP > 4.0; isolate from bedroom windows (<42 dBA).',
    efficiencyGain: '+0.35 seasonal COP boost & <42 dBA acoustic comfort',
    complianceCode: 'ASHRAE 90.1 / IMC 304',
  },
  {
    id: 'buffer_tank' as const,
    name: 'Thermal Hydro-Buffer Tank & Air Handler',
    shortLabel: 'Buffer Tank',
    category: 'HVAC Thermal' as const,
    color: '#3b82f6', // blue-500
    iconType: 'flame' as const,
    clearanceNote: '30" service clearance in front of valves and expansion tank',
    engineeringRationale: 'Centrally locate in conditioned utility room to prevent jacket standby losses; minimizes radiant distribution hydronic run lengths throughout home zones.',
    efficiencyGain: 'Cuts cycling losses by 22% & preserves 99.2% heat energy',
    complianceCode: 'IPC 501 / ASHRAE 55',
  },
  {
    id: 'battery_bess' as const,
    name: 'LiFePO4 Home Battery Storage (BESS)',
    shortLabel: 'Battery ESS',
    category: 'Energy Storage' as const,
    color: '#10b981', // emerald-500
    iconType: 'battery' as const,
    clearanceNote: 'NFPA 855: 3 ft separation from doors, windows & egress pathways',
    engineeringRationale: 'Install in garage or exterior rated utility alcove on non-combustible backing; keep close to inverter/subpanel to minimize heavy gauge DC copper resistance losses.',
    efficiencyGain: '94.8% round-trip efficiency & prevents emergency egress obstruction',
    complianceCode: 'NFPA 855 / IRC R327',
  },
  {
    id: 'smart_panel' as const,
    name: 'Smart Electrical Subpanel & Hybrid Inverter',
    shortLabel: 'Smart Panel',
    category: 'Electrical Distribution' as const,
    color: '#8b5cf6', // purple-500
    iconType: 'zap' as const,
    clearanceNote: 'NEC 110.26: 36" clear working space depth, 30" width',
    engineeringRationale: 'Place adjacent to main utility service meter to keep 200A feeder conduit under 10 ft, cutting AC line losses to <0.3% and saving up to $1,400 in heavy copper electrical labor.',
    efficiencyGain: '<0.4% total voltage drop and sub-millisecond islanding',
    complianceCode: 'NEC Article 705 & 706',
  },
];
