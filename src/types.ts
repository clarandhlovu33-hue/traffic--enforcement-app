export type ViewMode =
  | 'dashboard'
  | 'scenes'
  | 'map'
  | 'cctv'
  | 'vehicles'
  | 'plates'
  | 'traffic'
  | 'incidents'
  | 'dispatch'
  | 'patrols'
  | 'analytics'
  | 'settings';

export interface TrafficScene {
  id: string;
  name: string;
  city: ZambianCity;
  road: string;
  junctionType: 'ROUNDABOUT' | 'SIGNALIZED_INTERSECTION' | 'HIGHWAY_EXPRESSWAY' | 'FLYOVER_CHOKEPOINT' | 'CROSS_BORDER_CORRIDOR';
  speedLimit: number;
  lanes: number;
  hasTrafficLights: boolean;
  hasCrosswalk: boolean;
  backgroundImage: string;
  defaultOffenceType: 'Speeding' | 'Red Light' | 'Reckless Driving' | 'Stolen Vehicle Detected' | 'Lane Obstruction';
  description: string;
  cameraNodeId: string;
  lat: number;
  lng: number;
}

export type ZambianCity =
  | 'Lusaka'
  | 'Kitwe'
  | 'Ndola'
  | 'Livingstone'
  | 'Chingola'
  | 'Mufulira'
  | 'Kabwe'
  | 'Chipata'
  | 'Solwezi';

export interface CityConfig {
  name: ZambianCity;
  province: string;
  lat: number;
  lng: number;
  zoom: number;
  description: string;
  majorRoads: string[];
  activeCameras: number;
  patrolUnits: number;
}

export interface CameraFeed {
  id: string;
  name: string;
  city: ZambianCity;
  road: string;
  lat: number;
  lng: number;
  speedLimit: number;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  resolution: string;
  fps: number;
  bearing: string; // e.g. "Eastbound", "Inbound City Center"
  capabilities: {
    vehicleDetection: boolean;
    plateOcr: boolean;
    speedRadar: boolean;
    incidentDetection: boolean;
  };
  detectedCountToday: number;
  activeViolationsToday: number;
}

export interface VehicleRecord {
  id: string;
  plateNumber: string;
  makeModel: string;
  color: string;
  category: 'Sedan' | 'SUV' | 'Light Truck' | 'Heavy Truck' | 'Minibus/Hiace' | 'Motorcycle';
  ownerName: string;
  ownerPhone: string;
  ownerNrc: string;
  roadTaxStatus: 'VALID' | 'EXPIRED' | 'PENDING';
  fitnessStatus: 'VALID' | 'EXPIRED';
  insuranceStatus: 'VALID' | 'EXPIRED';
  hotlistFlag?: 'NONE' | 'STOLEN' | 'WANTED' | 'SUSPECT_TRAFFIC_OFFENDER';
  registeredCity: ZambianCity;
}

export interface ViolationEvent {
  id: string;
  plateNumber: string;
  speed: number;
  speedLimit: number;
  location: string;
  road: string;
  city: ZambianCity;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  imageUrl: string;
  violationType: 'Speeding' | 'Red Light' | 'Reckless Driving' | 'Expired Road Tax' | 'Stolen Vehicle Detected' | 'Lane Obstruction';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DETECTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'DISPATCHED' | 'DISMISSED';
  isNotified: boolean;
  fineAmountZMW: number;
  confidence: number;
  vehicleDetails?: VehicleRecord;
  operatorNotes?: string;
  dispatchedUnitId?: string;
}

export interface IncidentAlert {
  id: string;
  title: string;
  type: 'COLLISION' | 'STALLED_VEHICLE' | 'WRONG_WAY' | 'SPEEDING_EXCESSIVE' | 'PEDESTRIAN_HAZARD' | 'HOTLIST_MATCH';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  location: string;
  city: ZambianCity;
  road: string;
  lat: number;
  lng: number;
  cameraId: string;
  timestamp: string;
  status: 'NEW' | 'VERIFIED' | 'DISPATCHED' | 'RESOLVED' | 'FALSE_ALARM' | 'DISMISSED';
  description: string;
  confidenceScore: number;
  assignedPatrolId?: string;
  evidenceSnapshot: string;
}

export interface PatrolUnit {
  id: string;
  callSign: string;
  agency: 'RTSA' | 'ZAMBIA_POLICE' | 'HIGHWAY_PATROL';
  officerInCharge: string;
  phone: string;
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ON_SCENE' | 'BUSY' | 'OFF_DUTY';
  vehicleType: 'Cruiser' | 'Motorcycle' | 'Rapid Response Van';
  city: ZambianCity;
  currentRoad: string;
  lat: number;
  lng: number;
  heading: number;
  assignedIncidentId?: string;
  fuelLevel: number;
  lastUpdated: string;
}

export interface SystemMetrics {
  totalDetectionsToday: number;
  totalSpeedViolations: number;
  totalHotlistHits: number;
  activeDispatches: number;
  onlineCameras: number;
  totalCameras: number;
  activePatrols: number;
  networkLatencyMs: number;
  averageSpeedKmh: number;
}
