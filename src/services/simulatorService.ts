import {
  ViolationEvent,
  IncidentAlert,
  PatrolUnit,
  CameraFeed,
  VehicleRecord,
  SystemMetrics,
  ZambianCity
} from '../types';
import {
  INITIAL_CAMERAS,
  KNOWN_VEHICLES,
  INITIAL_PATROL_UNITS,
  INITIAL_INCIDENTS,
  ZAMBIAN_CITIES
} from '../data/zambiaData';

type Listener<T> = (data: T) => void;

class SimulatorService {
  private cameras: CameraFeed[] = [...INITIAL_CAMERAS];
  private vehicles: VehicleRecord[] = [...KNOWN_VEHICLES];
  private patrolUnits: PatrolUnit[] = [...INITIAL_PATROL_UNITS];
  private violations: ViolationEvent[] = [];
  private incidents: IncidentAlert[] = [...INITIAL_INCIDENTS];

  private isRunning: boolean = true;
  private intervalTimer: any = null;
  private patrolTimer: any = null;
  private intervalMs: number = 4000; // default 4s tick
  private soundEnabled: boolean = true;

  private violationListeners: Set<Listener<ViolationEvent>> = new Set();
  private incidentListeners: Set<Listener<IncidentAlert>> = new Set();
  private patrolListeners: Set<Listener<PatrolUnit[]>> = new Set();
  private cameraListeners: Set<Listener<CameraFeed[]>> = new Set();
  private metricsListeners: Set<Listener<SystemMetrics>> = new Set();

  constructor() {
    this.seedInitialViolations();
    this.startSimulation();
    this.startPatrolMovement();
  }

  private seedInitialViolations() {
    const seedData: Partial<ViolationEvent>[] = [
      {
        plateNumber: 'ZAM-5678',
        speed: 92.4,
        speedLimit: 60,
        location: 'Great East Rd / Arcades Mall Intersection',
        road: 'Great East Road (T4)',
        city: 'Lusaka',
        cameraId: 'CAM-LSK-001',
        cameraName: 'Great East Rd / Arcades Mall',
        timestamp: new Date(Date.now() - 3 * 60000).toLocaleTimeString(),
        violationType: 'Speeding',
        severity: 'HIGH',
        status: 'VERIFIED',
        isNotified: true,
        fineAmountZMW: 600,
        confidence: 0.98,
        imageUrl: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=600&auto=format&fit=crop&q=80'
      },
      {
        plateNumber: 'BCA-8419',
        speed: 114.2,
        speedLimit: 100,
        location: 'Kitwe-Ndola Dual Carriageway / Toll Approach',
        road: 'Kitwe-Ndola Dual Carriageway (T3)',
        city: 'Kitwe',
        cameraId: 'CAM-KTW-001',
        cameraName: 'Kitwe-Ndola Dual Carriageway Toll',
        timestamp: new Date(Date.now() - 6 * 60000).toLocaleTimeString(),
        violationType: 'Stolen Vehicle Detected',
        severity: 'CRITICAL',
        status: 'DISPATCHED',
        isNotified: true,
        fineAmountZMW: 1500,
        confidence: 0.99,
        dispatchedUnitId: 'PATROL-RTSA-CB1',
        imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80'
      },
      {
        plateNumber: 'LUS-9012',
        speed: 54.0,
        speedLimit: 50,
        location: 'Lumumba Road / City Market Intermodal',
        road: 'Lumumba Road',
        city: 'Lusaka',
        cameraId: 'CAM-LSK-004',
        cameraName: 'Lumumba Road / City Market',
        timestamp: new Date(Date.now() - 11 * 60000).toLocaleTimeString(),
        violationType: 'Expired Road Tax',
        severity: 'MEDIUM',
        status: 'DETECTED',
        isNotified: false,
        fineAmountZMW: 450,
        confidence: 0.92,
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
      },
      {
        plateNumber: 'ABC-1234',
        speed: 84.5,
        speedLimit: 70,
        location: 'Kafue Road / Makeni Flyover Junction',
        road: 'Kafue Road (T2)',
        city: 'Lusaka',
        cameraId: 'CAM-LSK-003',
        cameraName: 'Kafue Road / Makeni Flyover',
        timestamp: new Date(Date.now() - 18 * 60000).toLocaleTimeString(),
        violationType: 'Speeding',
        severity: 'MEDIUM',
        status: 'VERIFIED',
        isNotified: true,
        fineAmountZMW: 450,
        confidence: 0.97,
        imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80'
      }
    ];

    this.violations = seedData.map((v, i) => {
      const veh = this.lookupVehicle(v.plateNumber || 'ABC-1234');
      return {
        id: `VIO-2026-${1000 + i}`,
        plateNumber: v.plateNumber || 'ABC-1234',
        speed: v.speed || 65,
        speedLimit: v.speedLimit || 60,
        location: v.location || 'Lusaka Arterial',
        road: v.road || 'Cairo Road',
        city: v.city || 'Lusaka',
        cameraId: v.cameraId || 'CAM-LSK-001',
        cameraName: v.cameraName || 'CCTV Camera',
        timestamp: v.timestamp || new Date().toLocaleTimeString(),
        imageUrl: v.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
        violationType: v.violationType || 'Speeding',
        severity: v.severity || 'MEDIUM',
        status: v.status || 'DETECTED',
        isNotified: v.isNotified || false,
        fineAmountZMW: v.fineAmountZMW || 450,
        confidence: v.confidence || 0.95,
        vehicleDetails: veh,
        dispatchedUnitId: v.dispatchedUnitId
      };
    });
  }

  public startSimulation() {
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    this.isRunning = true;
    this.intervalTimer = setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  public pauseSimulation() {
    this.isRunning = false;
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }

  public toggleSimulation(): boolean {
    if (this.isRunning) {
      this.pauseSimulation();
    } else {
      this.startSimulation();
    }
    return this.isRunning;
  }

  public setSpeed(multiplier: number) {
    this.intervalMs = Math.max(800, Math.floor(4000 / multiplier));
    if (this.isRunning) {
      this.startSimulation();
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public lookupVehicle(plate: string): VehicleRecord {
    const clean = plate.trim().toUpperCase();
    const found = this.vehicles.find((v) => v.plateNumber === clean);
    if (found) return found;

    // Generate registered fallback
    const categories: VehicleRecord['category'][] = ['Sedan', 'SUV', 'Light Truck', 'Minibus/Hiace', 'Motorcycle'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const newRecord: VehicleRecord = {
      id: `VEH-GEN-${Math.floor(Math.random() * 9000 + 1000)}`,
      plateNumber: clean,
      makeModel: randomCategory === 'Minibus/Hiace' ? 'Toyota Hiace 3.0D' : 'Toyota Allion 1.8 VVTi',
      color: 'Silver Metallic',
      category: randomCategory,
      ownerName: `Motorist (${clean})`,
      ownerPhone: `+260 97 ${Math.floor(Math.random() * 899 + 100)} ${Math.floor(Math.random() * 8999 + 1000)}`,
      ownerNrc: `${Math.floor(Math.random() * 899999 + 100000)}/11/1`,
      roadTaxStatus: Math.random() > 0.15 ? 'VALID' : 'EXPIRED',
      fitnessStatus: Math.random() > 0.1 ? 'VALID' : 'EXPIRED',
      insuranceStatus: 'VALID',
      hotlistFlag: 'NONE',
      registeredCity: 'Lusaka'
    };
    this.vehicles.push(newRecord);
    return newRecord;
  }

  private generateRandomPlate(): { plate: string; isKnown: boolean } {
    if (Math.random() < 0.65) {
      const known = this.vehicles[Math.floor(Math.random() * this.vehicles.length)];
      return { plate: known.plateNumber, isKnown: true };
    }
    const prefixes = ['ABC', 'BCA', 'ALB', 'BAH', 'LUS', 'KTW', 'NDL', 'GRZ', 'CB', 'AEL'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(Math.random() * 9000 + 1000);
    return { plate: `${prefix}-${num}`, isKnown: false };
  }

  private tick() {
    // Pick random active camera
    const onlineCameras = this.cameras.filter((c) => c.status === 'ONLINE');
    if (onlineCameras.length === 0) return;
    const camera = onlineCameras[Math.floor(Math.random() * onlineCameras.length)];

    // Generate vehicle speed
    const isSpeeding = Math.random() < 0.42;
    let speed: number;
    if (isSpeeding) {
      // 10% to 60% over the limit
      const over = Math.random() * 45 + 10;
      speed = Number((camera.speedLimit + over).toFixed(1));
    } else {
      speed = Number((camera.speedLimit - Math.random() * 18).toFixed(1));
    }

    const { plate } = this.generateRandomPlate();
    const vehicleRecord = this.lookupVehicle(plate);

    // Check hotlist
    const isHotlist = vehicleRecord.hotlistFlag && vehicleRecord.hotlistFlag !== 'NONE';

    camera.detectedCountToday += 1;
    if (isSpeeding || isHotlist || vehicleRecord.roadTaxStatus === 'EXPIRED') {
      camera.activeViolationsToday += 1;
    }

    let violationType: ViolationEvent['violationType'] = 'Speeding';
    let severity: ViolationEvent['severity'] = 'LOW';
    let fine = 0;

    if (isHotlist) {
      violationType = vehicleRecord.hotlistFlag === 'STOLEN' ? 'Stolen Vehicle Detected' : 'Reckless Driving';
      severity = 'CRITICAL';
      fine = 2000;
    } else if (isSpeeding) {
      violationType = 'Speeding';
      const excess = speed - camera.speedLimit;
      if (excess > 35) {
        severity = 'CRITICAL';
        fine = 900;
      } else if (excess > 20) {
        severity = 'HIGH';
        fine = 600;
      } else {
        severity = 'MEDIUM';
        fine = 450;
      }
    } else if (vehicleRecord.roadTaxStatus === 'EXPIRED') {
      violationType = 'Expired Road Tax';
      severity = 'LOW';
      fine = 300;
    }

    const newViolation: ViolationEvent = {
      id: `VIO-2026-${Math.floor(Math.random() * 90000 + 10000)}`,
      plateNumber: plate,
      speed,
      speedLimit: camera.speedLimit,
      location: camera.name,
      road: camera.road,
      city: camera.city,
      cameraId: camera.id,
      cameraName: camera.name,
      timestamp: new Date().toLocaleTimeString(),
      imageUrl: this.getCarImageUrl(vehicleRecord.category),
      violationType,
      severity,
      status: isSpeeding || isHotlist ? 'DETECTED' : 'VERIFIED',
      isNotified: isSpeeding || isHotlist,
      fineAmountZMW: fine,
      confidence: Number((0.92 + Math.random() * 0.07).toFixed(2)),
      vehicleDetails: vehicleRecord
    };

    // Add to violations history
    this.violations.unshift(newViolation);
    if (this.violations.length > 200) {
      this.violations.pop();
    }

    // Trigger listeners
    this.notifyViolation(newViolation);
    this.notifyCameras();
    this.notifyMetrics();

    // Trigger incident if critical
    if (isHotlist || (isSpeeding && speed > camera.speedLimit + 40)) {
      this.triggerIncidentFromViolation(newViolation);
    }
  }

  private getCarImageUrl(category: VehicleRecord['category']): string {
    const images: Record<VehicleRecord['category'], string[]> = {
      'Sedan': [
        'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&auto=format&fit=crop&q=80'
      ],
      'SUV': [
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&auto=format&fit=crop&q=80'
      ],
      'Light Truck': [
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600&auto=format&fit=crop&q=80'
      ],
      'Heavy Truck': [
        'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&auto=format&fit=crop&q=80'
      ],
      'Minibus/Hiace': [
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80'
      ],
      'Motorcycle': [
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80'
      ]
    };
    const list = images[category] || images['Sedan'];
    return list[Math.floor(Math.random() * list.length)];
  }

  private triggerIncidentFromViolation(vio: ViolationEvent) {
    const isStolen = vio.violationType === 'Stolen Vehicle Detected';
    const incident: IncidentAlert = {
      id: `INC-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      title: isStolen
        ? `WANTED/STOLEN Vehicle (${vio.plateNumber}) Intercept Notice`
        : `Extreme Speed Hazard (${vio.speed} km/h in ${vio.speedLimit} km/h zone)`,
      type: isStolen ? 'HOTLIST_MATCH' : 'SPEEDING_EXCESSIVE',
      severity: 'CRITICAL',
      location: vio.location,
      city: vio.city,
      road: vio.road,
      lat: this.cameras.find((c) => c.id === vio.cameraId)?.lat || -15.4167,
      lng: this.cameras.find((c) => c.id === vio.cameraId)?.lng || 28.2833,
      cameraId: vio.cameraId,
      timestamp: vio.timestamp,
      status: 'NEW',
      description: isStolen
        ? `Real-time ALPR matched high-priority hotlist flag for vehicle ${vio.plateNumber} at ${vio.location}. Immediate dispatch advised.`
        : `Edge camera ${vio.cameraName} captured vehicle traveling at ${vio.speed} km/h (+${(vio.speed - vio.speedLimit).toFixed(1)} km/h over statutory limit).`,
      confidenceScore: vio.confidence,
      evidenceSnapshot: vio.imageUrl
    };
    this.incidents.unshift(incident);
    this.notifyIncident(incident);
    this.notifyMetrics();
  }

  public triggerManualEvent(type: 'SPEEDING' | 'STOLEN' | 'COLLISION' | 'STALLED_TRUCK', city: ZambianCity = 'Lusaka') {
    const cityCameras = this.cameras.filter((c) => c.city === city);
    const camera = cityCameras.length > 0 ? cityCameras[0] : this.cameras[0];

    if (type === 'COLLISION') {
      const inc: IncidentAlert = {
        id: `INC-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        title: 'Multi-Vehicle Collision Alert',
        type: 'COLLISION',
        severity: 'CRITICAL',
        location: `${camera.road} near Junction`,
        city: camera.city,
        road: camera.road,
        lat: camera.lat + 0.0015,
        lng: camera.lng + 0.0015,
        cameraId: camera.id,
        timestamp: new Date().toLocaleTimeString(),
        status: 'NEW',
        description: 'Edge Computer Vision detected rapid deceleration and vehicle collision trajectory on lane 1 & 2.',
        confidenceScore: 0.96,
        evidenceSnapshot: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80'
      };
      this.incidents.unshift(inc);
      this.notifyIncident(inc);
      this.notifyMetrics();
      return;
    }

    if (type === 'STALLED_TRUCK') {
      const inc: IncidentAlert = {
        id: `INC-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        title: 'Heavy Truck Stalled Obstruction',
        type: 'STALLED_VEHICLE',
        severity: 'WARNING',
        location: `${camera.road} - Inbound lane`,
        city: camera.city,
        road: camera.road,
        lat: camera.lat - 0.002,
        lng: camera.lng + 0.001,
        cameraId: camera.id,
        timestamp: new Date().toLocaleTimeString(),
        status: 'NEW',
        description: 'Commercial tri-axle truck stationary > 3 minutes causing severe downstream arterial congestion.',
        confidenceScore: 0.93,
        evidenceSnapshot: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80'
      };
      this.incidents.unshift(inc);
      this.notifyIncident(inc);
      this.notifyMetrics();
      return;
    }

    const plate = type === 'STOLEN' ? 'BCA-8419' : 'ZAM-5678';
    const veh = this.lookupVehicle(plate);
    const speed = type === 'STOLEN' ? 108.5 : 98.2;

    const vio: ViolationEvent = {
      id: `VIO-2026-${Math.floor(Math.random() * 90000 + 10000)}`,
      plateNumber: plate,
      speed,
      speedLimit: camera.speedLimit,
      location: camera.name,
      road: camera.road,
      city: camera.city,
      cameraId: camera.id,
      cameraName: camera.name,
      timestamp: new Date().toLocaleTimeString(),
      imageUrl: this.getCarImageUrl(veh.category),
      violationType: type === 'STOLEN' ? 'Stolen Vehicle Detected' : 'Speeding',
      severity: 'CRITICAL',
      status: 'DETECTED',
      isNotified: true,
      fineAmountZMW: type === 'STOLEN' ? 2000 : 750,
      confidence: 0.99,
      vehicleDetails: veh
    };

    this.violations.unshift(vio);
    this.notifyViolation(vio);
    this.triggerIncidentFromViolation(vio);
    this.notifyMetrics();
  }

  // Patrol Movement Simulation
  private startPatrolMovement() {
    this.patrolTimer = setInterval(() => {
      this.patrolUnits = this.patrolUnits.map((unit) => {
        if (unit.status === 'AVAILABLE' || unit.status === 'EN_ROUTE') {
          // slight random jitter along coordinates to simulate patrolling
          const deltaLat = (Math.random() - 0.5) * 0.0012;
          const deltaLng = (Math.random() - 0.5) * 0.0012;
          const newFuel = Math.max(10, unit.fuelLevel - (Math.random() < 0.1 ? 1 : 0));
          return {
            ...unit,
            lat: unit.lat + deltaLat,
            lng: unit.lng + deltaLng,
            fuelLevel: newFuel,
            lastUpdated: new Date().toLocaleTimeString()
          };
        }
        return unit;
      });
      this.notifyPatrols();
    }, 5000);
  }

  public dispatchPatrol(incidentId: string, patrolId: string, operatorNotes?: string) {
    const incident = this.incidents.find((i) => i.id === incidentId);
    const patrol = this.patrolUnits.find((p) => p.id === patrolId);

    if (incident && patrol) {
      incident.status = 'DISPATCHED';
      incident.assignedPatrolId = patrolId;

      patrol.status = 'EN_ROUTE';
      patrol.assignedIncidentId = incidentId;

      // Also mark linked violation if exists
      const relatedVio = this.violations.find((v) => v.cameraId === incident.cameraId);
      if (relatedVio) {
        relatedVio.status = 'DISPATCHED';
        relatedVio.dispatchedUnitId = patrolId;
        relatedVio.operatorNotes = operatorNotes || `Authorized dispatch unit ${patrol.callSign} assigned.`;
      }

      this.notifyIncident(incident);
      this.notifyPatrols();
      this.notifyMetrics();
    }
  }

  public verifyIncident(incidentId: string, action: 'VERIFIED' | 'DISMISSED') {
    const incident = this.incidents.find((i) => i.id === incidentId);
    if (incident) {
      incident.status = action;
      this.notifyIncident(incident);
      this.notifyMetrics();
    }
  }

  public verifyViolation(violationId: string, verified: boolean) {
    const vio = this.violations.find((v) => v.id === violationId);
    if (vio) {
      vio.status = verified ? 'VERIFIED' : 'DISMISSED';
      this.notifyViolation(vio);
      this.notifyMetrics();
    }
  }

  // Subscriptions
  public onViolation(listener: Listener<ViolationEvent>) {
    this.violationListeners.add(listener);
    return () => this.violationListeners.delete(listener);
  }

  public onIncident(listener: Listener<IncidentAlert>) {
    this.incidentListeners.add(listener);
    return () => this.incidentListeners.delete(listener);
  }

  public onPatrols(listener: Listener<PatrolUnit[]>) {
    this.patrolListeners.add(listener);
    listener(this.patrolUnits);
    return () => this.patrolListeners.delete(listener);
  }

  public onCameras(listener: Listener<CameraFeed[]>) {
    this.cameraListeners.add(listener);
    listener(this.cameras);
    return () => this.cameraListeners.delete(listener);
  }

  public onMetrics(listener: Listener<SystemMetrics>) {
    this.metricsListeners.add(listener);
    listener(this.getMetrics());
    return () => this.metricsListeners.delete(listener);
  }

  private notifyViolation(v: ViolationEvent) {
    this.violationListeners.forEach((fn) => fn(v));
  }

  private notifyIncident(i: IncidentAlert) {
    this.incidentListeners.forEach((fn) => fn(i));
  }

  private notifyPatrols() {
    this.patrolListeners.forEach((fn) => fn([...this.patrolUnits]));
  }

  private notifyCameras() {
    this.cameraListeners.forEach((fn) => fn([...this.cameras]));
  }

  private notifyMetrics() {
    const metrics = this.getMetrics();
    this.metricsListeners.forEach((fn) => fn(metrics));
  }

  public getViolations(): ViolationEvent[] {
    return [...this.violations];
  }

  public getIncidents(): IncidentAlert[] {
    return [...this.incidents];
  }

  public getCameras(): CameraFeed[] {
    return [...this.cameras];
  }

  public getPatrolUnits(): PatrolUnit[] {
    return [...this.patrolUnits];
  }

  public getVehicles(): VehicleRecord[] {
    return [...this.vehicles];
  }

  public getMetrics(): SystemMetrics {
    const totalSpeedViolations = this.violations.filter((v) => v.violationType === 'Speeding').length;
    const totalHotlistHits = this.violations.filter((v) => v.violationType === 'Stolen Vehicle Detected').length;
    const activeDispatches = this.patrolUnits.filter((p) => p.status === 'EN_ROUTE' || p.status === 'ON_SCENE').length;
    const onlineCameras = this.cameras.filter((c) => c.status === 'ONLINE').length;
    const totalDetections = this.cameras.reduce((sum, c) => sum + c.detectedCountToday, 0) + this.violations.length * 12;

    const speeds = this.violations.map((v) => v.speed);
    const avgSpeed = speeds.length > 0 ? Number((speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1)) : 62.4;

    return {
      totalDetectionsToday: totalDetections,
      totalSpeedViolations,
      totalHotlistHits,
      activeDispatches,
      onlineCameras,
      totalCameras: this.cameras.length,
      activePatrols: this.patrolUnits.filter((p) => p.status === 'AVAILABLE' || p.status === 'EN_ROUTE').length,
      networkLatencyMs: 14 + Math.floor(Math.random() * 6),
      averageSpeedKmh: avgSpeed
    };
  }
}

export const simulator = new SimulatorService();
