import { CityConfig, CameraFeed, VehicleRecord, PatrolUnit, IncidentAlert, ZambianCity } from '../types';

export const ZAMBIAN_CITIES: Record<ZambianCity, CityConfig> = {
  Lusaka: {
    name: 'Lusaka',
    province: 'Lusaka Province',
    lat: -15.4167,
    lng: 28.2833,
    zoom: 13,
    description: 'Capital city and primary transportation hub with high-density arterials.',
    majorRoads: [
      'Great East Road (T4)',
      'Cairo Road',
      'Kafue Road (T2)',
      'Lumumba Road',
      'Independence Avenue',
      'Leopards Hill Road',
      'Addis Ababa Drive',
      'Church Road',
      'Ring Road'
    ],
    activeCameras: 18,
    patrolUnits: 8
  },
  Kitwe: {
    name: 'Kitwe',
    province: 'Copperbelt Province',
    lat: -12.8024,
    lng: 28.2132,
    zoom: 13,
    description: 'Copperbelt industrial and commercial center with heavy freight traffic.',
    majorRoads: [
      'Kitwe-Ndola Dual Carriageway (T3)',
      'Independence Avenue',
      'Kantanshi Road',
      'Chibuluma Road',
      'Oxford Road',
      'Central Street'
    ],
    activeCameras: 12,
    patrolUnits: 5
  },
  Ndola: {
    name: 'Ndola',
    province: 'Copperbelt Province',
    lat: -12.9694,
    lng: 28.6366,
    zoom: 13,
    description: 'Copperbelt administrative capital and international transit corridor.',
    majorRoads: [
      'Broadway Avenue',
      'President Avenue',
      'Dag Hammarskjold Drive',
      'Kansenshi Highway',
      'Ndola-Mufulira Road'
    ],
    activeCameras: 10,
    patrolUnits: 4
  },
  Livingstone: {
    name: 'Livingstone',
    province: 'Southern Province',
    lat: -17.8419,
    lng: 25.8543,
    zoom: 13,
    description: 'Tourism capital near Victoria Falls with cross-border tourist & freight flows.',
    majorRoads: [
      'Mosi-oa-Tunya Road',
      'Airport Road',
      'Maramba Road',
      'Livingstone-Sesheke Road (M10)',
      'Nakatindi Road'
    ],
    activeCameras: 8,
    patrolUnits: 3
  },
  Chingola: {
    name: 'Chingola',
    province: 'Copperbelt Province',
    lat: -12.5290,
    lng: 27.8547,
    zoom: 13,
    description: 'Mining transit route connecting Solwezi and DRC borders.',
    majorRoads: ['Solwezi Road (T5)', 'Kabundi Road', 'Fern Avenue', 'Kitwe Road'],
    activeCameras: 6,
    patrolUnits: 3
  },
  Mufulira: {
    name: 'Mufulira',
    province: 'Copperbelt Province',
    lat: -12.5498,
    lng: 28.2407,
    zoom: 13,
    description: 'Border gateway city with heavy cross-border commercial movement.',
    majorRoads: ['Chati Road', 'Ndola Road', 'Kitwe Highway', 'Mokambo Border Rd'],
    activeCameras: 5,
    patrolUnits: 2
  },
  Kabwe: {
    name: 'Kabwe',
    province: 'Central Province',
    lat: -14.4469,
    lng: 28.4464,
    zoom: 13,
    description: 'Central transit spine linking Lusaka and the Copperbelt along the T2 corridor.',
    majorRoads: ['Great North Road (T2)', 'Buntungwa Road', 'Independence Way', 'Mukobeko Road'],
    activeCameras: 7,
    patrolUnits: 3
  },
  Chipata: {
    name: 'Chipata',
    province: 'Eastern Province',
    lat: -13.6333,
    lng: 32.6500,
    zoom: 13,
    description: 'Eastern trade gateway connecting to Malawi via Mchinji border.',
    majorRoads: ['Great East Road (T4)', 'Airport Highway', 'Mwami Border Road', 'Umodzi Highway'],
    activeCameras: 5,
    patrolUnits: 2
  },
  Solwezi: {
    name: 'Solwezi',
    province: 'North-Western Province',
    lat: -12.1833,
    lng: 26.4000,
    zoom: 13,
    description: 'Rapidly expanding mining hub with intense mining haulage trucks.',
    majorRoads: ['Independence Avenue', 'Chingola-Solwezi Road (T5)', 'Kansanshi Mine Rd', 'Lumwana Rd'],
    activeCameras: 6,
    patrolUnits: 3
  }
};

export const INITIAL_CAMERAS: CameraFeed[] = [
  // LUSAKA CAMERAS
  {
    id: 'CAM-LSK-001',
    name: 'Great East Rd / Arcades Mall Intersection',
    city: 'Lusaka',
    road: 'Great East Road (T4)',
    lat: -15.3942,
    lng: 28.3245,
    speedLimit: 60,
    status: 'ONLINE',
    resolution: '4K Ultra-HD',
    fps: 30,
    bearing: 'Eastbound towards UNZA & Airport',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: true,
      incidentDetection: true
    },
    detectedCountToday: 4120,
    activeViolationsToday: 38
  },
  {
    id: 'CAM-LSK-002',
    name: 'Cairo Road / Central Business District (South)',
    city: 'Lusaka',
    road: 'Cairo Road',
    lat: -15.4215,
    lng: 28.2831,
    speedLimit: 50,
    status: 'ONLINE',
    resolution: '1080p 60fps',
    fps: 60,
    bearing: 'Northbound Traffic Core',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: true,
      incidentDetection: true
    },
    detectedCountToday: 5890,
    activeViolationsToday: 19
  },
  {
    id: 'CAM-LSK-003',
    name: 'Kafue Road / Makeni Flyover Junction',
    city: 'Lusaka',
    road: 'Kafue Road (T2)',
    lat: -15.4498,
    lng: 28.2690,
    speedLimit: 70,
    status: 'ONLINE',
    resolution: '4K Ultra-HD',
    fps: 30,
    bearing: 'Southbound to Kafue / Livingstone',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: true,
      incidentDetection: true
    },
    detectedCountToday: 3840,
    activeViolationsToday: 42
  },
  {
    id: 'CAM-LSK-004',
    name: 'Lumumba Road / City Market Intermodal',
    city: 'Lusaka',
    road: 'Lumumba Road',
    lat: -15.4120,
    lng: 28.2710,
    speedLimit: 50,
    status: 'ONLINE',
    resolution: '1080p 30fps',
    fps: 30,
    bearing: 'Northwest Transit Lane',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: false,
      incidentDetection: true
    },
    detectedCountToday: 6200,
    activeViolationsToday: 14
  },
  {
    id: 'CAM-LSK-005',
    name: 'Independence Ave / Woodlands Roundabout',
    city: 'Lusaka',
    road: 'Independence Avenue',
    lat: -15.4285,
    lng: 28.3180,
    speedLimit: 60,
    status: 'ONLINE',
    resolution: '4K Ultra-HD',
    fps: 30,
    bearing: 'Diplomatic Enclave & State House corridor',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: true,
      incidentDetection: true
    },
    detectedCountToday: 2980,
    activeViolationsToday: 9
  },
  {
    id: 'CAM-LSK-006',
    name: 'Leopards Hill Road / Crossroads Mall',
    city: 'Lusaka',
    road: 'Leopards Hill Road',
    lat: -15.4430,
    lng: 28.3450,
    speedLimit: 60,
    status: 'ONLINE',
    resolution: '1080p 30fps',
    fps: 30,
    bearing: 'Outbound to Bauleni & New Kasama',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: true,
      incidentDetection: true
    },
    detectedCountToday: 2140,
    activeViolationsToday: 12
  },

  // KITWE CAMERAS
  {
    id: 'CAM-KTW-001',
    name: 'Kitwe-Ndola Dual Carriageway / Toll Approach',
    city: 'Kitwe',
    road: 'Kitwe-Ndola Dual Carriageway (T3)',
    lat: -12.8250,
    lng: 28.2450,
    speedLimit: 100,
    status: 'ONLINE',
    resolution: '4K Ultra-HD',
    fps: 60,
    bearing: 'Inbound Kitwe Express Lane',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: true,
      incidentDetection: true
    },
    detectedCountToday: 4720,
    activeViolationsToday: 64
  },
  {
    id: 'CAM-KTW-002',
    name: 'Independence Avenue / Copperbelt University (CBU)',
    city: 'Kitwe',
    road: 'Independence Avenue',
    lat: -12.7980,
    lng: 28.2280,
    speedLimit: 50,
    status: 'ONLINE',
    resolution: '1080p 30fps',
    fps: 30,
    bearing: 'Riverside / Campus Zone',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: true,
      incidentDetection: true
    },
    detectedCountToday: 3100,
    activeViolationsToday: 11
  },

  // NDOLA CAMERAS
  {
    id: 'CAM-NDL-001',
    name: 'Broadway Avenue / Levy Mwanawasa Stadium Gate',
    city: 'Ndola',
    road: 'Broadway Avenue',
    lat: -12.9550,
    lng: 28.6180,
    speedLimit: 60,
    status: 'ONLINE',
    resolution: '4K Ultra-HD',
    fps: 30,
    bearing: 'Stadium Hub & CBD Link',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: true,
      incidentDetection: true
    },
    detectedCountToday: 3950,
    activeViolationsToday: 22
  },

  // LIVINGSTONE CAMERAS
  {
    id: 'CAM-LVG-001',
    name: 'Mosi-oa-Tunya Road / Victoria Falls Border Post',
    city: 'Livingstone',
    road: 'Mosi-oa-Tunya Road',
    lat: -17.8680,
    lng: 25.8560,
    speedLimit: 50,
    status: 'ONLINE',
    resolution: '4K Ultra-HD',
    fps: 30,
    bearing: 'Zimbabwe Border Entry / Heritage Park',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: true,
      incidentDetection: true
    },
    detectedCountToday: 1840,
    activeViolationsToday: 8
  },

  // KABWE CAMERAS
  {
    id: 'CAM-KBW-001',
    name: 'Great North Road (T2) / Central Interchange',
    city: 'Kabwe',
    road: 'Great North Road (T2)',
    lat: -14.4390,
    lng: 28.4520,
    speedLimit: 60,
    status: 'ONLINE',
    resolution: '1080p 30fps',
    fps: 30,
    bearing: 'Heavy Transport Cross-Country Line',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: true,
      incidentDetection: true
    },
    detectedCountToday: 3200,
    activeViolationsToday: 31
  },

  // SOLWEZI CAMERAS
  {
    id: 'CAM-SLW-001',
    name: 'Chingola-Solwezi Highway (T5) / Mine Haulage Junction',
    city: 'Solwezi',
    road: 'Chingola-Solwezi Road (T5)',
    lat: -12.1750,
    lng: 26.3920,
    speedLimit: 70,
    status: 'ONLINE',
    resolution: '4K Ultra-HD',
    fps: 30,
    bearing: 'Mining Corridor Heavy Freight',
    capabilities: {
      vehicleDetection: true,
      plateOcr: true,
      speedRadar: true,
      incidentDetection: true
    },
    detectedCountToday: 2450,
    activeViolationsToday: 27
  }
];

export const KNOWN_VEHICLES: VehicleRecord[] = [
  {
    id: 'VEH-001',
    plateNumber: 'ABC-1234',
    makeModel: 'Toyota Hilux GD-6 2.8 Double Cab',
    color: 'Metallic Silver',
    category: 'Light Truck',
    ownerName: 'Chileshe Mwansa',
    ownerPhone: '+260 97 741 8290',
    ownerNrc: '342910/11/1',
    roadTaxStatus: 'VALID',
    fitnessStatus: 'VALID',
    insuranceStatus: 'VALID',
    hotlistFlag: 'NONE',
    registeredCity: 'Lusaka'
  },
  {
    id: 'VEH-002',
    plateNumber: 'ZAM-5678',
    makeModel: 'Mercedes-Benz C200 AMG Line',
    color: 'Obsidian Black',
    category: 'Sedan',
    ownerName: 'Lindiwe Banda',
    ownerPhone: '+260 96 612 3904',
    ownerNrc: '198420/67/1',
    roadTaxStatus: 'EXPIRED',
    fitnessStatus: 'VALID',
    insuranceStatus: 'VALID',
    hotlistFlag: 'SUSPECT_TRAFFIC_OFFENDER',
    registeredCity: 'Lusaka'
  },
  {
    id: 'VEH-003',
    plateNumber: 'LUS-9012',
    makeModel: 'Toyota Hiace Minibus (Commuter)',
    color: 'White & Blue Stripe',
    category: 'Minibus/Hiace',
    ownerName: 'Kondwani Phiri',
    ownerPhone: '+260 95 588 7102',
    ownerNrc: '451209/52/1',
    roadTaxStatus: 'VALID',
    fitnessStatus: 'EXPIRED',
    insuranceStatus: 'VALID',
    hotlistFlag: 'NONE',
    registeredCity: 'Lusaka'
  },
  {
    id: 'VEH-004',
    plateNumber: 'BCA-8419',
    makeModel: 'Range Rover Sport V8 Supercharged',
    color: 'Santorini Black',
    category: 'SUV',
    ownerName: 'Mulenga Tembo',
    ownerPhone: '+260 97 199 4432',
    ownerNrc: '209341/10/1',
    roadTaxStatus: 'VALID',
    fitnessStatus: 'VALID',
    insuranceStatus: 'VALID',
    hotlistFlag: 'STOLEN',
    registeredCity: 'Kitwe'
  },
  {
    id: 'VEH-005',
    plateNumber: 'GRZ-4410',
    makeModel: 'Toyota Land Cruiser Prado VX',
    color: 'Pearl White',
    category: 'SUV',
    ownerName: 'Ministry of Infrastructure (Govt Fleet)',
    ownerPhone: '+260 211 254 000',
    ownerNrc: 'GOV-EXEMPT-09',
    roadTaxStatus: 'VALID',
    fitnessStatus: 'VALID',
    insuranceStatus: 'VALID',
    hotlistFlag: 'NONE',
    registeredCity: 'Lusaka'
  },
  {
    id: 'VEH-006',
    plateNumber: 'ALB-7721',
    makeModel: 'Isuzu D-Max 300 LX 4x4',
    color: 'Dark Grey',
    category: 'Light Truck',
    ownerName: 'Patrick Chinyama',
    ownerPhone: '+260 96 443 8911',
    ownerNrc: '228941/31/1',
    roadTaxStatus: 'VALID',
    fitnessStatus: 'VALID',
    insuranceStatus: 'EXPIRED',
    hotlistFlag: 'NONE',
    registeredCity: 'Ndola'
  },
  {
    id: 'VEH-007',
    plateNumber: 'BAH-2041',
    makeModel: 'Scania R500 Commercial Tri-Axle Hauler',
    color: 'Crimson Red',
    category: 'Heavy Truck',
    ownerName: 'Copper Transport Logistics Ltd',
    ownerPhone: '+260 212 615 890',
    ownerNrc: 'CORP-849102',
    roadTaxStatus: 'VALID',
    fitnessStatus: 'VALID',
    insuranceStatus: 'VALID',
    hotlistFlag: 'NONE',
    registeredCity: 'Chingola'
  },
  {
    id: 'VEH-008',
    plateNumber: 'CB-9921',
    makeModel: 'Subaru Forester XT Turbo',
    color: 'World Rally Blue',
    category: 'SUV',
    ownerName: 'Natasha Lungu',
    ownerPhone: '+260 97 832 1055',
    ownerNrc: '512903/11/1',
    roadTaxStatus: 'VALID',
    fitnessStatus: 'VALID',
    insuranceStatus: 'VALID',
    hotlistFlag: 'WANTED',
    registeredCity: 'Kitwe'
  }
];

export const INITIAL_PATROL_UNITS: PatrolUnit[] = [
  {
    id: 'PATROL-RTSA-01',
    callSign: 'RTSA Eagle-1',
    agency: 'RTSA',
    officerInCharge: 'Inspector B. Sakala',
    phone: '+260 97 900 1101',
    status: 'AVAILABLE',
    vehicleType: 'Cruiser',
    city: 'Lusaka',
    currentRoad: 'Great East Road (T4)',
    lat: -15.3970,
    lng: 28.3200,
    heading: 85,
    fuelLevel: 88,
    lastUpdated: new Date().toLocaleTimeString()
  },
  {
    id: 'PATROL-ZP-09',
    callSign: 'ZP Traffic Unit 9',
    agency: 'ZAMBIA_POLICE',
    officerInCharge: 'Sgt. M. Mulenga',
    phone: '+260 96 811 2202',
    status: 'ON_SCENE',
    vehicleType: 'Cruiser',
    city: 'Lusaka',
    currentRoad: 'Cairo Road',
    lat: -15.4230,
    lng: 28.2820,
    heading: 0,
    fuelLevel: 64,
    lastUpdated: new Date().toLocaleTimeString()
  },
  {
    id: 'PATROL-HWP-04',
    callSign: 'Highway Hawk 4',
    agency: 'HIGHWAY_PATROL',
    officerInCharge: 'Officer T. Zulu',
    phone: '+260 95 722 3303',
    status: 'AVAILABLE',
    vehicleType: 'Motorcycle',
    city: 'Lusaka',
    currentRoad: 'Kafue Road (T2)',
    lat: -15.4450,
    lng: 28.2720,
    heading: 190,
    fuelLevel: 92,
    lastUpdated: new Date().toLocaleTimeString()
  },
  {
    id: 'PATROL-RTSA-CB1',
    callSign: 'RTSA Copper Eagle 1',
    agency: 'RTSA',
    officerInCharge: 'Insp. G. Kaunda',
    phone: '+260 97 633 4404',
    status: 'AVAILABLE',
    vehicleType: 'Cruiser',
    city: 'Kitwe',
    currentRoad: 'Kitwe-Ndola Dual Carriageway (T3)',
    lat: -12.8220,
    lng: 28.2410,
    heading: 120,
    fuelLevel: 75,
    lastUpdated: new Date().toLocaleTimeString()
  },
  {
    id: 'PATROL-ZP-ND1',
    callSign: 'ZP Ndola Interceptor',
    agency: 'ZAMBIA_POLICE',
    officerInCharge: 'Sub-Insp. E. Musonda',
    phone: '+260 96 544 5505',
    status: 'AVAILABLE',
    vehicleType: 'Rapid Response Van',
    city: 'Ndola',
    currentRoad: 'Broadway Avenue',
    lat: -12.9580,
    lng: 28.6210,
    heading: 260,
    fuelLevel: 80,
    lastUpdated: new Date().toLocaleTimeString()
  }
];

export const INITIAL_INCIDENTS: IncidentAlert[] = [
  {
    id: 'INC-2026-081',
    title: 'Multi-Vehicle Stalled Traffic Hazard',
    type: 'STALLED_VEHICLE',
    severity: 'WARNING',
    location: 'Great East Road near UNZA Gate 2',
    city: 'Lusaka',
    road: 'Great East Road (T4)',
    lat: -15.3930,
    lng: 28.3310,
    cameraId: 'CAM-LSK-001',
    timestamp: '16:12:05',
    status: 'NEW',
    description: 'AI Computer Vision detected stationary 20-tonne commercial lorry blocking lane 2 during evening rush hour.',
    confidenceScore: 0.94,
    evidenceSnapshot: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'INC-2026-082',
    title: 'High-Speed Corroborated Stolen Vehicle Hit',
    type: 'HOTLIST_MATCH',
    severity: 'CRITICAL',
    location: 'Kitwe-Ndola Dual Carriageway Toll Area',
    city: 'Kitwe',
    road: 'Kitwe-Ndola Dual Carriageway (T3)',
    lat: -12.8250,
    lng: 28.2450,
    cameraId: 'CAM-KTW-001',
    timestamp: '16:24:19',
    status: 'VERIFIED',
    description: 'ALPR match: Range Rover BCA-8419 flagged as STOLEN on Interpol/Zambia Police National Crime Registry.',
    confidenceScore: 0.98,
    assignedPatrolId: 'PATROL-RTSA-CB1',
    evidenceSnapshot: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'INC-2026-083',
    title: 'Excessive Speeding (124 km/h in 60 km/h Zone)',
    type: 'SPEEDING_EXCESSIVE',
    severity: 'CRITICAL',
    location: 'Kafue Road Makeni Flyover',
    city: 'Lusaka',
    road: 'Kafue Road (T2)',
    lat: -15.4498,
    lng: 28.2690,
    cameraId: 'CAM-LSK-003',
    timestamp: '16:31:40',
    status: 'NEW',
    description: 'Radar + Edge vision calibrated speed capture: 124.6 km/h. Exceeds limit by +64.6 km/h.',
    confidenceScore: 0.99,
    evidenceSnapshot: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=600&auto=format&fit=crop&q=80'
  }
];
