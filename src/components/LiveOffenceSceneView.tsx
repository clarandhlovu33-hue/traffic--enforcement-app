import { useState, useRef, useEffect, useCallback, MouseEvent, useMemo } from 'react';
import { TrafficScene, ViolationEvent, PatrolUnit, CameraFeed, ZambianCity } from '../types';
import { ZAMBIAN_SCENES } from '../data/scenesData';
import { soundManager } from '../utils/sound';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Eye,
  Sliders,
  Send,
  FileText,
  MapPin,
  Car,
  Radio,
  Layers,
  Camera,
  CheckCircle2,
  ChevronDown,
  Navigation,
  Crosshair,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Sparkles,
  Flame,
  Clock,
  Calendar,
  History,
  RadioTower,
  Image as ImageIcon,
  SplitSquareVertical,
  Activity,
  ArrowRight,
  Maximize2,
  RefreshCw
} from 'lucide-react';

interface LiveOffenceSceneViewProps {
  currentCity: ZambianCity;
  onSelectCity: (city: ZambianCity) => void;
  onSelectViolationForCitation: (vio: ViolationEvent) => void;
  onDispatchUnit: (incidentId: string, patrolId: string, notes: string) => void;
  patrolUnits: PatrolUnit[];
  cameras: CameraFeed[];
  violations: ViolationEvent[];
}

interface SimulatedVehicle {
  id: string;
  plate: string;
  make: string;
  color: string;
  type: 'sedan' | 'suv' | 'minibus' | 'truck' | 'police';
  x: number; // 0 to 100% across canvas width
  y: number; // lane position
  speed: number; // km/h
  targetSpeed: number;
  lane: number; // 0, 1, 2...
  direction: 1 | -1; // 1 = left to right / rightwards, -1 = leftwards
  isOffender: boolean;
  offenceType?: 'Speeding' | 'Red Light' | 'Reckless Driving' | 'Stolen Vehicle' | 'Lane Obstruction';
  offenceSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  fineZMW?: number;
  driverName?: string;
  driverPhone?: string;
  taxStatus?: 'VALID' | 'EXPIRED';
  hasTriggeredAlert?: boolean;
}

export function LiveOffenceSceneView({
  currentCity,
  onSelectCity,
  onSelectViolationForCitation,
  onDispatchUnit,
  patrolUnits,
  cameras,
  violations
}: LiveOffenceSceneViewProps) {
  // Scene Selection State
  const [selectedScene, setSelectedScene] = useState<TrafficScene>(() => {
    const cityScene = ZAMBIAN_SCENES.find((s) => s.city === currentCity);
    return cityScene || ZAMBIAN_SCENES[0];
  });
  const [isSceneMenuOpen, setIsSceneMenuOpen] = useState(false);
  const [isPlacingSensor, setIsPlacingSensor] = useState(false);
  const [placedSensors, setPlacedSensors] = useState<{ x: number; y: number; label: string }[]>([
    { x: 50, y: 35, label: 'Speed Radar #1' },
    { x: 75, y: 65, label: 'ALPR Optical Node #2' }
  ]);

  // Video Optics & HUD State
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isThermal, setIsThermal] = useState<boolean>(false);
  const [showAiHud, setShowAiHud] = useState<boolean>(true);
  const [showRadarVectors, setShowRadarVectors] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [displayMode, setDisplayMode] = useState<'CANVAS' | 'EVIDENCE_PHOTO' | 'SPLIT'>('CANVAS');

  // Timeline Scrub Bar & Historical Violation State
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [scrubIndex, setScrubIndex] = useState<number>(0);
  const [selectedHistoricalViolation, setSelectedHistoricalViolation] = useState<ViolationEvent | null>(null);
  const [filterCurrentCorridorOnly, setFilterCurrentCorridorOnly] = useState<boolean>(false);

  // Traffic Light & Offence State
  const [trafficLightColor, setTrafficLightColor] = useState<'GREEN' | 'YELLOW' | 'RED'>('GREEN');
  const [activeOffence, setActiveOffence] = useState<SimulatedVehicle | null>(null);
  const [offenceNotification, setOffenceNotification] = useState<{
    id: string;
    title: string;
    description: string;
    plate: string;
    speed: number;
    limit: number;
    fine: number;
    driver: string;
    timestamp: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    imageUrl?: string;
  } | null>(null);

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vehiclesRef = useRef<SimulatedVehicle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());

  // Merge and sort violations for timeline scrubber
  const timelineViolations = useMemo(() => {
    // Collect all violations, filter by corridor if selected, or provide rich sample historical events
    let list = [...violations];

    // If corridor filter enabled
    if (filterCurrentCorridorOnly) {
      const filtered = list.filter((v) => v.road === selectedScene.road || v.city === selectedScene.city);
      if (filtered.length > 0) {
        list = filtered;
      }
    }

    // Ensure we have at least sample historical events for timeline scrubbing
    if (list.length < 5) {
      const fallbackEvents: ViolationEvent[] = [
        {
          id: 'VIO-HIST-01',
          plateNumber: 'ABC-9831',
          speed: 108.4,
          speedLimit: selectedScene.speedLimit,
          location: selectedScene.name,
          road: selectedScene.road,
          city: selectedScene.city,
          cameraId: selectedScene.cameraNodeId,
          cameraName: selectedScene.name,
          timestamp: '16:48:15',
          imageUrl: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200&auto=format&fit=crop&q=80',
          violationType: 'Speeding',
          severity: 'HIGH',
          status: 'VERIFIED',
          isNotified: true,
          fineAmountZMW: 750,
          confidence: 0.98,
          vehicleDetails: {
            id: 'REC-ABC-9831',
            plateNumber: 'ABC-9831',
            makeModel: 'Mercedes-Benz C200 AMG',
            color: '#e11d48',
            category: 'Sedan',
            ownerName: 'Grace Phiri',
            ownerPhone: '+260 97 712 9901',
            ownerNrc: '391029/11/1',
            roadTaxStatus: 'VALID',
            fitnessStatus: 'VALID',
            insuranceStatus: 'VALID',
            registeredCity: selectedScene.city
          }
        },
        {
          id: 'VIO-HIST-02',
          plateNumber: 'ALP-4102',
          speed: 62.0,
          speedLimit: selectedScene.speedLimit,
          location: selectedScene.name,
          road: selectedScene.road,
          city: selectedScene.city,
          cameraId: selectedScene.cameraNodeId,
          cameraName: selectedScene.name,
          timestamp: '16:41:20',
          imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
          violationType: 'Red Light',
          severity: 'HIGH',
          status: 'DETECTED',
          isNotified: false,
          fineAmountZMW: 500,
          confidence: 0.96,
          vehicleDetails: {
            id: 'REC-ALP-4102',
            plateNumber: 'ALP-4102',
            makeModel: 'Toyota Hiace Commuter Minibus',
            color: '#3b82f6',
            category: 'Minibus/Hiace',
            ownerName: 'Joseph Zulu (PSV Driver)',
            ownerPhone: '+260 96 612 8840',
            ownerNrc: '451928/52/1',
            roadTaxStatus: 'VALID',
            fitnessStatus: 'EXPIRED',
            insuranceStatus: 'VALID',
            registeredCity: selectedScene.city
          }
        },
        {
          id: 'VIO-HIST-03',
          plateNumber: 'BCA-8419',
          speed: 114.5,
          speedLimit: selectedScene.speedLimit,
          location: selectedScene.name,
          road: selectedScene.road,
          city: selectedScene.city,
          cameraId: selectedScene.cameraNodeId,
          cameraName: selectedScene.name,
          timestamp: '16:32:05',
          imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80',
          violationType: 'Stolen Vehicle Detected',
          severity: 'CRITICAL',
          status: 'DISPATCHED',
          isNotified: true,
          fineAmountZMW: 1500,
          confidence: 0.99,
          vehicleDetails: {
            id: 'REC-BCA-8419',
            plateNumber: 'BCA-8419',
            makeModel: 'Range Rover Sport V8 (Flagged Stolen)',
            color: '#0f172a',
            category: 'SUV',
            ownerName: 'WANTED: Interpol Hotlist Match',
            ownerPhone: '+260 97 500 0000',
            ownerNrc: 'STOLEN/ZP/2026',
            roadTaxStatus: 'EXPIRED',
            fitnessStatus: 'EXPIRED',
            insuranceStatus: 'EXPIRED',
            registeredCity: selectedScene.city
          }
        },
        {
          id: 'VIO-HIST-04',
          plateNumber: 'KAB-7721',
          speed: 95.0,
          speedLimit: selectedScene.speedLimit,
          location: selectedScene.name,
          road: selectedScene.road,
          city: selectedScene.city,
          cameraId: selectedScene.cameraNodeId,
          cameraName: selectedScene.name,
          timestamp: '16:21:45',
          imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&auto=format&fit=crop&q=80',
          violationType: 'Reckless Driving',
          severity: 'CRITICAL',
          status: 'VERIFIED',
          isNotified: true,
          fineAmountZMW: 900,
          confidence: 0.94,
          vehicleDetails: {
            id: 'REC-KAB-7721',
            plateNumber: 'KAB-7721',
            makeModel: 'Subaru WRX STI Turbo',
            color: '#8b5cf6',
            category: 'Sedan',
            ownerName: 'Mwape Musonda',
            ownerPhone: '+260 95 519 2200',
            ownerNrc: '519201/11/1',
            roadTaxStatus: 'VALID',
            fitnessStatus: 'VALID',
            insuranceStatus: 'VALID',
            registeredCity: selectedScene.city
          }
        },
        {
          id: 'VIO-HIST-05',
          plateNumber: 'TZA-5501',
          speed: 0.0,
          speedLimit: selectedScene.speedLimit,
          location: selectedScene.name,
          road: selectedScene.road,
          city: selectedScene.city,
          cameraId: selectedScene.cameraNodeId,
          cameraName: selectedScene.name,
          timestamp: '16:08:30',
          imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
          violationType: 'Lane Obstruction',
          severity: 'MEDIUM',
          status: 'DETECTED',
          isNotified: false,
          fineAmountZMW: 350,
          confidence: 0.97,
          vehicleDetails: {
            id: 'REC-TZA-5501',
            plateNumber: 'TZA-5501',
            makeModel: 'Volvo Multi-Axle Haulage Lorry',
            color: '#eab308',
            category: 'Heavy Truck',
            ownerName: 'Patrick Lungu (Freight Logistics)',
            ownerPhone: '+260 97 410 8821',
            ownerNrc: '291044/11/1',
            roadTaxStatus: 'VALID',
            fitnessStatus: 'VALID',
            insuranceStatus: 'VALID',
            registeredCity: selectedScene.city
          }
        }
      ];
      list = [...list, ...fallbackEvents];
    }

    return list;
  }, [violations, filterCurrentCorridorOnly, selectedScene]);

  // Current dynamic scene background image
  const currentSceneImage = useMemo(() => {
    if (!isLiveMode && selectedHistoricalViolation?.imageUrl) {
      return selectedHistoricalViolation.imageUrl;
    }
    return selectedScene.backgroundImage;
  }, [isLiveMode, selectedHistoricalViolation, selectedScene]);

  // When currentCity changes from outside, switch to matching scene if applicable
  useEffect(() => {
    const matching = ZAMBIAN_SCENES.find((s) => s.city === currentCity);
    if (matching && matching.id !== selectedScene.id) {
      setSelectedScene(matching);
    }
  }, [currentCity]);

  // Initialize Scene Vehicles for Live Mode
  const initSceneVehicles = useCallback(() => {
    const laneCount = selectedScene.lanes || 2;
    const baseLimit = selectedScene.speedLimit;
    const list: SimulatedVehicle[] = [];

    // Background normal vehicles
    for (let i = 0; i < 4; i++) {
      const lane = i % laneCount;
      const direction: 1 | -1 = lane % 2 === 0 ? 1 : -1;
      const speed = Math.round(baseLimit * (0.8 + Math.random() * 0.15));
      list.push({
        id: `VEH-NORM-${i + 1}`,
        plate: `BAA-${Math.floor(1000 + Math.random() * 8999)}`,
        make: ['Toyota Corolla', 'Isuzu D-Max', 'Nissan X-Trail', 'Mazda Demio'][i % 4],
        color: ['#94a3b8', '#38bdf8', '#cbd5e1', '#f8fafc'][i % 4],
        type: i === 1 ? 'suv' : 'sedan',
        x: (i * 24 + 10) % 90,
        y: 40 + lane * 18,
        speed: speed,
        targetSpeed: speed,
        lane: lane,
        direction: direction,
        isOffender: false
      });
    }

    // Add an initial active offender vehicle based on scene default or historical selection
    const offenderPlate = selectedHistoricalViolation
      ? selectedHistoricalViolation.plateNumber
      : `BCA-${Math.floor(2000 + Math.random() * 7000)}`;

    const isSpeedingScene = selectedScene.defaultOffenceType === 'Speeding';
    const offenderSpeed = selectedHistoricalViolation
      ? selectedHistoricalViolation.speed
      : isSpeedingScene
      ? selectedScene.speedLimit + 42
      : selectedScene.speedLimit - 5;

    list.push({
      id: 'VEH-OFFENDER-PRIMARY',
      plate: offenderPlate,
      make: selectedHistoricalViolation?.vehicleDetails?.makeModel || (isSpeedingScene ? 'BMW 3-Series Sport' : 'Toyota Hiace Commuter'),
      color: isSpeedingScene ? '#e11d48' : '#3b82f6',
      type: isSpeedingScene ? 'sedan' : 'minibus',
      x: 5,
      y: 40,
      speed: offenderSpeed,
      targetSpeed: offenderSpeed,
      lane: 0,
      direction: 1,
      isOffender: true,
      offenceType: (selectedHistoricalViolation?.violationType as any) || selectedScene.defaultOffenceType,
      offenceSeverity: selectedHistoricalViolation?.severity || (isSpeedingScene ? 'HIGH' : 'MEDIUM'),
      fineZMW: selectedHistoricalViolation?.fineAmountZMW || (isSpeedingScene ? 650 : 450),
      driverName: selectedHistoricalViolation?.vehicleDetails?.ownerName || 'Kelvin Mwansa',
      driverPhone: selectedHistoricalViolation?.vehicleDetails?.ownerPhone || '+260 97 782 1109',
      taxStatus: 'VALID',
      hasTriggeredAlert: false
    });

    vehiclesRef.current = list;
    setActiveOffence(list.find((v) => v.isOffender) || null);
  }, [selectedScene, selectedHistoricalViolation]);

  useEffect(() => {
    initSceneVehicles();
  }, [initSceneVehicles]);

  // Traffic Light Cycle Timer
  useEffect(() => {
    if (!selectedScene.hasTrafficLights) return;

    const interval = setInterval(() => {
      setTrafficLightColor((prev) => {
        if (prev === 'GREEN') return 'YELLOW';
        if (prev === 'YELLOW') return 'RED';
        return 'GREEN';
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [selectedScene]);

  // JUMP TO HISTORICAL VIOLATION VIA TIMELINE SCRUB
  const handleJumpToViolation = useCallback(
    (index: number) => {
      if (index < 0 || index >= timelineViolations.length) return;

      const targetVio = timelineViolations[index];
      setScrubIndex(index);
      setIsLiveMode(false);
      setSelectedHistoricalViolation(targetVio);

      // Check if this violation matches a known scene
      const matchingScene = ZAMBIAN_SCENES.find((s) => s.city === targetVio.city || s.road === targetVio.road);
      if (matchingScene && matchingScene.id !== selectedScene.id) {
        setSelectedScene(matchingScene);
      }

      // Construct simulated offender based on this historical event
      const mappedOffenceType: 'Speeding' | 'Red Light' | 'Reckless Driving' | 'Stolen Vehicle' | 'Lane Obstruction' =
        targetVio.violationType === 'Stolen Vehicle Detected'
          ? 'Stolen Vehicle'
          : targetVio.violationType === 'Expired Road Tax'
          ? 'Speeding'
          : (targetVio.violationType as any) || 'Speeding';

      const reconstructedOffender: SimulatedVehicle = {
        id: `OFFENDER-HIST-${targetVio.id}`,
        plate: targetVio.plateNumber,
        make: targetVio.vehicleDetails?.makeModel || 'Target Vehicle',
        color: '#f43f5e',
        type: targetVio.vehicleDetails?.category === 'Minibus/Hiace' ? 'minibus' : targetVio.vehicleDetails?.category === 'Heavy Truck' ? 'truck' : 'sedan',
        x: 48, // Position vehicle right in camera view focus
        y: 42,
        speed: targetVio.speed,
        targetSpeed: targetVio.speed,
        lane: 0,
        direction: 1,
        isOffender: true,
        offenceType: mappedOffenceType,
        offenceSeverity: targetVio.severity,
        fineZMW: targetVio.fineAmountZMW,
        driverName: targetVio.vehicleDetails?.ownerName || 'Motorist',
        driverPhone: targetVio.vehicleDetails?.ownerPhone || '+260 97 000 0000',
        taxStatus: 'VALID',
        hasTriggeredAlert: true
      };

      vehiclesRef.current = [
        reconstructedOffender,
        ...vehiclesRef.current.filter((v) => !v.isOffender).slice(0, 3)
      ];

      setActiveOffence(reconstructedOffender);

      // Show toast banner
      setOffenceNotification({
        id: targetVio.id,
        title: `HISTORICAL RECORD: ${targetVio.violationType.toUpperCase()}`,
        description: `${targetVio.vehicleDetails?.makeModel || 'Vehicle'} [${targetVio.plateNumber}] captured at ${targetVio.timestamp} (${targetVio.location}).`,
        plate: targetVio.plateNumber,
        speed: targetVio.speed,
        limit: targetVio.speedLimit,
        fine: targetVio.fineAmountZMW,
        driver: targetVio.vehicleDetails?.ownerName || 'Registered Owner',
        timestamp: targetVio.timestamp,
        severity: targetVio.severity,
        imageUrl: targetVio.imageUrl
      });

      if (soundEnabled) {
        soundManager.playScanBeep();
      }
    },
    [timelineViolations, selectedScene, soundEnabled]
  );

  // Return to LIVE mode
  const handleReturnToLive = () => {
    setIsLiveMode(true);
    setSelectedHistoricalViolation(null);
    initSceneVehicles();
    if (soundEnabled) {
      soundManager.playScanBeep();
    }
  };

  // Step backward to previous violation
  const handleStepPrevViolation = () => {
    if (isLiveMode) {
      handleJumpToViolation(0);
    } else {
      const nextIdx = Math.min(timelineViolations.length - 1, scrubIndex + 1);
      handleJumpToViolation(nextIdx);
    }
  };

  // Step forward to next violation
  const handleStepNextViolation = () => {
    if (scrubIndex <= 0) {
      handleReturnToLive();
    } else {
      const prevIdx = Math.max(0, scrubIndex - 1);
      handleJumpToViolation(prevIdx);
    }
  };

  // Trigger Dynamic Live Offence
  const triggerOffence = (
    type: 'Speeding' | 'Red Light' | 'Reckless Driving' | 'Stolen Vehicle' | 'Lane Obstruction'
  ) => {
    setIsLiveMode(true);
    setSelectedHistoricalViolation(null);

    if (soundEnabled) {
      if (type === 'Stolen Vehicle' || type === 'Reckless Driving') {
        soundManager.playCriticalIncidentSiren();
      } else {
        soundManager.playSpeedingAlert();
      }
    }

    const lane = 0;
    const limit = selectedScene.speedLimit;
    let speed = limit;
    let fine = 450;
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH';
    let make = 'Toyota Land Cruiser';
    let color = '#ef4444';
    let typeModel: 'sedan' | 'suv' | 'minibus' | 'truck' = 'suv';
    let driver = 'Brian Chanda';
    let plate = `BAZ-${Math.floor(1000 + Math.random() * 8999)}`;
    let imgUrl = selectedScene.backgroundImage;

    if (type === 'Speeding') {
      speed = limit + 48;
      fine = 750;
      severity = 'HIGH';
      make = 'Mercedes-Benz C200';
      color = '#f43f5e';
      typeModel = 'sedan';
      driver = 'Grace Phiri';
      plate = `ABC-9831`;
      imgUrl = 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=1200&auto=format&fit=crop&q=80';
    } else if (type === 'Red Light') {
      speed = limit + 12;
      fine = 500;
      severity = 'HIGH';
      make = 'Toyota Hiace Commuter Minibus';
      color = '#3b82f6';
      typeModel = 'minibus';
      driver = 'Joseph Zulu (Public PSV Driver)';
      plate = `ALP-4102`;
      imgUrl = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80';
      setTrafficLightColor('RED');
    } else if (type === 'Stolen Vehicle') {
      speed = limit + 18;
      fine = 1200;
      severity = 'CRITICAL';
      make = 'Ford Ranger Wildtrak (Flagged Stolen)';
      color = '#0f172a';
      typeModel = 'suv';
      driver = 'WANTED: Interpol Red Flag Match';
      plate = `BCA-8419`;
      imgUrl = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80';
    } else if (type === 'Reckless Driving') {
      speed = limit + 35;
      fine = 900;
      severity = 'CRITICAL';
      make = 'Subaru WRX Turbo';
      color = '#8b5cf6';
      typeModel = 'sedan';
      driver = 'Mwape Musonda';
      plate = `KAB-7721`;
      imgUrl = 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&auto=format&fit=crop&q=80';
    } else if (type === 'Lane Obstruction') {
      speed = 0;
      fine = 350;
      severity = 'MEDIUM';
      make = 'Volvo Multi-Axle Haulage Lorry';
      color = '#eab308';
      typeModel = 'truck';
      driver = 'Patrick Lungu (Freight Logistics)';
      plate = `TZA-5501`;
      imgUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80';
    }

    const newOffender: SimulatedVehicle = {
      id: `OFFENDER-${Date.now()}`,
      plate: plate,
      make: make,
      color: color,
      type: typeModel,
      x: type === 'Lane Obstruction' ? 52 : 2,
      y: 42,
      speed: speed,
      targetSpeed: speed,
      lane: lane,
      direction: 1,
      isOffender: true,
      offenceType: type,
      offenceSeverity: severity,
      fineZMW: fine,
      driverName: driver,
      driverPhone: '+260 97 512 8834',
      taxStatus: 'VALID',
      hasTriggeredAlert: false
    };

    vehiclesRef.current = [
      newOffender,
      ...vehiclesRef.current.filter((v) => v.id !== 'VEH-OFFENDER-PRIMARY').slice(0, 4)
    ];

    setActiveOffence(newOffender);

    setOffenceNotification({
      id: newOffender.id,
      title: `LIVE OFFENCE DETECTED: ${type.toUpperCase()}`,
      description: `${make} [${plate}] clocked at ${speed} km/h in statutory ${limit} km/h zone (${selectedScene.road}).`,
      plate: plate,
      speed: speed,
      limit: limit,
      fine: fine,
      driver: driver,
      timestamp: new Date().toLocaleTimeString(),
      severity: severity,
      imageUrl: imgUrl
    });
  };

  // Convert current offence into Official Citation
  const handleGenerateCitationFromLiveOffence = () => {
    if (!activeOffence) return;

    const vio: ViolationEvent = selectedHistoricalViolation || {
      id: `VIO-SCENE-${Date.now().toString().slice(-6)}`,
      plateNumber: activeOffence.plate,
      speed: activeOffence.speed,
      speedLimit: selectedScene.speedLimit,
      location: selectedScene.name,
      road: selectedScene.road,
      city: selectedScene.city,
      cameraId: selectedScene.cameraNodeId,
      cameraName: selectedScene.name,
      timestamp: new Date().toLocaleTimeString(),
      imageUrl: currentSceneImage,
      violationType:
        activeOffence.offenceType === 'Stolen Vehicle'
          ? 'Stolen Vehicle Detected'
          : activeOffence.offenceType || 'Speeding',
      severity: activeOffence.offenceSeverity || 'HIGH',
      status: 'DETECTED',
      isNotified: false,
      fineAmountZMW: activeOffence.fineZMW || 650,
      confidence: 0.96,
      vehicleDetails: {
        id: `REC-${activeOffence.plate}`,
        plateNumber: activeOffence.plate,
        makeModel: activeOffence.make,
        color: activeOffence.color,
        category:
          activeOffence.type === 'minibus'
            ? 'Minibus/Hiace'
            : activeOffence.type === 'truck'
            ? 'Heavy Truck'
            : 'Sedan',
        ownerName: activeOffence.driverName || 'Motorist',
        ownerPhone: activeOffence.driverPhone || '+260 97 123 4567',
        ownerNrc: '459128/11/1',
        roadTaxStatus: 'VALID',
        fitnessStatus: 'VALID',
        insuranceStatus: 'VALID',
        registeredCity: selectedScene.city
      }
    };

    onSelectViolationForCitation(vio);
  };

  // Dispatch Patrol to this scene
  const handleDispatchPatrolToScene = () => {
    if (!activeOffence) return;
    const availablePatrol =
      patrolUnits.find((p) => p.city === selectedScene.city && p.status === 'AVAILABLE') || patrolUnits[0];
    if (availablePatrol) {
      onDispatchUnit(
        `INC-${selectedScene.id}`,
        availablePatrol.id,
        `Intercept offending vehicle ${activeOffence.plate} (${activeOffence.make}) at ${selectedScene.road}. Offence: ${activeOffence.offenceType}`
      );
      if (soundEnabled) {
        soundManager.playCriticalIncidentSiren();
      }
    }
  };

  // Custom Sensor Placement Handler
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isPlacingSensor) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setPlacedSensors((prev) => [
      ...prev,
      { x, y, label: `Custom Sensor Node #${prev.length + 1}` }
    ]);
    setIsPlacingSensor(false);
    if (soundEnabled) {
      soundManager.playScanBeep();
    }
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // 1. Clear background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Roadway & Asphalt
      const roadTop = height * 0.28;
      const roadHeight = height * 0.55;
      const roadBottom = roadTop + roadHeight;
      const laneCount = selectedScene.lanes || 2;
      const laneHeight = roadHeight / laneCount;

      // Asphalt base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, roadTop, width, roadHeight);

      // Road shoulder curbing
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, roadTop - 6, width, 6);
      ctx.fillRect(0, roadBottom, width, 6);

      // Road grass/embankment markings
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, width, roadTop - 6);
      ctx.fillRect(0, roadBottom + 6, width, height - roadBottom - 6);

      // 3. Draw Lane Dividers (Dashed / Solid)
      for (let i = 1; i < laneCount; i++) {
        const laneY = roadTop + i * laneHeight;
        ctx.beginPath();
        if (i === Math.floor(laneCount / 2)) {
          // Center double line (white or yellow)
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
          ctx.moveTo(0, laneY - 2);
          ctx.lineTo(width, laneY - 2);
          ctx.moveTo(0, laneY + 2);
          ctx.lineTo(width, laneY + 2);
          ctx.stroke();
        } else {
          // Dashed lane line
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 2;
          ctx.setLineDash([20, 15]);
          ctx.moveTo(0, laneY);
          ctx.lineTo(width, laneY);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]); // reset

      // 4. Draw Crosswalk / Zebra Markings if present
      if (selectedScene.hasCrosswalk) {
        const zebraX = width * 0.75;
        const zebraWidth = 40;
        ctx.fillStyle = '#f8fafc';
        for (let y = roadTop + 5; y < roadBottom - 5; y += 16) {
          ctx.fillRect(zebraX, y, zebraWidth, 8);
        }
      }

      // 5. Draw Traffic Light Pole if applicable
      if (selectedScene.hasTrafficLights) {
        const lightX = width * 0.85;
        const lightY = roadTop - 45;

        // Pole
        ctx.fillStyle = '#64748b';
        ctx.fillRect(lightX + 8, lightY + 30, 4, 35);

        // Housing
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(lightX, lightY, 20, 42, 4);
        ctx.fill();
        ctx.stroke();

        // Red Light
        ctx.fillStyle = trafficLightColor === 'RED' ? '#ef4444' : '#450a0a';
        ctx.beginPath();
        ctx.arc(lightX + 10, lightY + 8, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Yellow Light
        ctx.fillStyle = trafficLightColor === 'YELLOW' ? '#facc15' : '#422006';
        ctx.beginPath();
        ctx.arc(lightX + 10, lightY + 20, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Green Light
        ctx.fillStyle = trafficLightColor === 'GREEN' ? '#10b981' : '#064e3b';
        ctx.beginPath();
        ctx.arc(lightX + 10, lightY + 32, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Glowing bloom on active light
        if (trafficLightColor === 'RED') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.beginPath();
          ctx.arc(lightX + 10, lightY + 8, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 6. Placed Sensor Markers
      placedSensors.forEach((sensor) => {
        const sx = (sensor.x / 100) * width;
        const sy = (sensor.y / 100) * height;

        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '9px monospace';
        ctx.fillText(sensor.label, sx + 10, sy - 5);
      });

      // 7. Update & Draw Vehicles
      const vehicles = vehiclesRef.current;
      vehicles.forEach((veh) => {
        if (isPlaying && isLiveMode) {
          // Speed to position delta
          const speedFactor = (veh.speed / 60) * 12 * playbackSpeed;
          veh.x += speedFactor * delta * veh.direction;

          // Loop vehicles across screen
          if (veh.direction === 1 && veh.x > 105) {
            veh.x = -8;
          } else if (veh.direction === -1 && veh.x < -8) {
            veh.x = 105;
          }

          // Trigger Alert when offender reaches center if not already
          if (veh.isOffender && veh.x >= 40 && veh.x <= 65 && !veh.hasTriggeredAlert) {
            veh.hasTriggeredAlert = true;
            if (soundEnabled) {
              if (veh.offenceType === 'Stolen Vehicle' || veh.offenceType === 'Reckless Driving') {
                soundManager.playCriticalIncidentSiren();
              } else {
                soundManager.playSpeedingAlert();
              }
            }
          }
        }

        const vx = (veh.x / 100) * width;
        const vy = roadTop + veh.lane * laneHeight + laneHeight / 2 - 14;
        const vWidth = veh.type === 'truck' ? 70 : veh.type === 'minibus' ? 52 : 44;
        const vHeight = 24;

        // Vehicle Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(vx - 2, vy + 4, vWidth + 4, vHeight + 2);

        // Vehicle Body
        ctx.fillStyle = veh.color;
        ctx.beginPath();
        ctx.roundRect(vx, vy, vWidth, vHeight, 5);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Windshield & Windows
        ctx.fillStyle = '#0f172a';
        if (veh.direction === 1) {
          ctx.fillRect(vx + vWidth - 14, vy + 3, 6, vHeight - 6); // Front windshield
          ctx.fillRect(vx + 6, vy + 4, 8, vHeight - 8); // Rear window
        } else {
          ctx.fillRect(vx + 8, vy + 3, 6, vHeight - 6); // Front windshield
          ctx.fillRect(vx + vWidth - 14, vy + 4, 8, vHeight - 8);
        }

        // Headlights / Taillights
        if (veh.direction === 1) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(vx + vWidth - 2, vy + 2, 2, 4);
          ctx.fillRect(vx + vWidth - 2, vy + vHeight - 6, 2, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(vx, vy + 2, 2, 4);
          ctx.fillRect(vx, vy + vHeight - 6, 2, 4);
        } else {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(vx, vy + 2, 2, 4);
          ctx.fillRect(vx, vy + vHeight - 6, 2, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(vx + vWidth - 2, vy + 2, 2, 4);
          ctx.fillRect(vx + vWidth - 2, vy + vHeight - 6, 2, 4);
        }

        // 8. AI Overlay & Radar Vectors
        if (showAiHud) {
          const isVio = veh.isOffender;
          const boxColor = isVio ? '#f43f5e' : '#10b981';

          // Bounding Box
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = isVio ? 2.5 : 1.5;
          ctx.strokeRect(vx - 4, vy - 6, vWidth + 8, vHeight + 12);

          // Top Tag Pill
          ctx.fillStyle = isVio ? '#e11d48' : '#059669';
          ctx.fillRect(vx - 4, vy - 20, vWidth + 8, 14);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          const speedLabel = `${veh.speed} km/h`;
          ctx.fillText(speedLabel, vx - 1, vy - 10);

          // Plate Tag Bottom
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(vx - 4, vy + vHeight + 8, vWidth + 8, 12);
          ctx.fillStyle = isVio ? '#fecdd3' : '#a7f3d0';
          ctx.font = '8px monospace';
          ctx.fillText(veh.plate, vx - 1, vy + vHeight + 17);

          // If Speeding Radar or Offence Vector
          if (showRadarVectors && isVio) {
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(vx + vWidth / 2, vy - 6);
            ctx.lineTo(width * 0.5, roadTop - 25);
            ctx.stroke();
            ctx.setLineDash([]);

            // Warning Marker Ring
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(vx + vWidth / 2, vy + vHeight / 2, 26, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });

      // 9. Camera HUD Watermark
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(12, 12, 320, 52);
      ctx.strokeStyle = isLiveMode ? '#334155' : '#f43f5e';
      ctx.lineWidth = isLiveMode ? 1 : 1.5;
      ctx.strokeRect(12, 12, 320, 52);

      ctx.fillStyle = isLiveMode ? '#10b981' : '#f43f5e';
      ctx.beginPath();
      ctx.arc(24, 28, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      const hudTitle = isLiveMode
        ? `LIVE RTSA RADAR • ${selectedScene.cameraNodeId}`
        : `RECORDED EVIDENCE ARCHIVE • ${selectedHistoricalViolation?.timestamp || 'HISTORICAL'}`;
      ctx.fillText(hudTitle, 34, 30);

      ctx.fillStyle = isLiveMode ? '#94a3b8' : '#fca5a5';
      ctx.font = '10px sans-serif';
      const hudSub = isLiveMode
        ? `${selectedScene.name} (${selectedScene.city})`
        : `RECONSTRUCTED EVENT: ${selectedHistoricalViolation?.violationType || 'OFFENCE'} [${selectedHistoricalViolation?.plateNumber}]`;
      ctx.fillText(hudSub, 24, 50);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    selectedScene,
    isPlaying,
    isLiveMode,
    selectedHistoricalViolation,
    playbackSpeed,
    showAiHud,
    showRadarVectors,
    trafficLightColor,
    soundEnabled,
    placedSensors
  ]);

  return (
    <div id="live-offence-scene-workspace" class="space-y-4">
      {/* Top Header & Scene Placement Selector Menu */}
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-rose-950 border border-rose-700 flex items-center justify-center text-rose-400">
              <Video class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-100 font-display flex items-center gap-2">
                <span>Zambian Road Scene & Live Traffic Offence Cinema</span>
                {isLiveMode ? (
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>LIVE STREAMING</span>
                  </span>
                ) : (
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 animate-pulse">
                    <History class="w-3 h-3 text-amber-400" />
                    <span>TIMELINE ARCHIVE: {selectedHistoricalViolation?.timestamp}</span>
                  </span>
                )}
              </h2>
              <p class="text-xs text-slate-400">
                Witness live violations in real-time or scrub through past violation timestamps with dynamic CCTV scene image updating.
              </p>
            </div>
          </div>
        </div>

        {/* Scene Selection Dropdown Menu & View Controls */}
        <div class="flex flex-wrap items-center gap-2 relative">
          {/* Display Mode Switcher (Canvas vs Optical CCTV Evidence Photo vs Split) */}
          <div class="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              id="btn-view-canvas"
              onClick={() => setDisplayMode('CANVAS')}
              class={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition ${
                displayMode === 'CANVAS'
                  ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Simulation Canvas View"
            >
              <Activity class="w-3.5 h-3.5 text-cyan-400" />
              <span>Sim Canvas</span>
            </button>

            <button
              id="btn-view-cctv-photo"
              onClick={() => setDisplayMode('EVIDENCE_PHOTO')}
              class={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition ${
                displayMode === 'EVIDENCE_PHOTO'
                  ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dynamic Camera Snapshot View"
            >
              <ImageIcon class="w-3.5 h-3.5 text-rose-400" />
              <span>CCTV Photo</span>
            </button>

            <button
              id="btn-view-split"
              onClick={() => setDisplayMode('SPLIT')}
              class={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition ${
                displayMode === 'SPLIT'
                  ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split Screen View"
            >
              <SplitSquareVertical class="w-3.5 h-3.5 text-amber-400" />
              <span>Split</span>
            </button>
          </div>

          {/* Main Scene Selection Button / Menu */}
          <div class="relative">
            <button
              id="btn-scene-picker-menu"
              onClick={() => setIsSceneMenuOpen(!isSceneMenuOpen)}
              class="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 border border-slate-700 hover:border-emerald-500/60 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition shadow-lg"
            >
              <Navigation class="w-4 h-4 text-emerald-400" />
              <span class="truncate max-w-[140px] sm:max-w-[200px]">Scene: {selectedScene.name}</span>
              <ChevronDown class="w-4 h-4 text-slate-400" />
            </button>

            {/* Scene Selector Menu Dropdown */}
            {isSceneMenuOpen && (
              <div
                id="scene-selection-dropdown"
                class="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-[2200] space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[480px] overflow-y-auto"
              >
                <div class="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-200 uppercase font-mono">
                    Select Specific Zambian Scene
                  </span>
                  <span class="text-[10px] font-mono text-emerald-400">
                    {ZAMBIAN_SCENES.length} SCENES
                  </span>
                </div>

                {ZAMBIAN_SCENES.map((scene) => {
                  const isCurrent = scene.id === selectedScene.id;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => {
                        setSelectedScene(scene);
                        onSelectCity(scene.city);
                        setIsSceneMenuOpen(false);
                      }}
                      class={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-start gap-3 ${
                        isCurrent
                          ? 'bg-slate-800 border-emerald-500/80 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div class="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden border border-slate-700 shrink-0">
                        <img
                          src={scene.backgroundImage}
                          alt={scene.name}
                          class="w-full h-full object-cover"
                        />
                      </div>

                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-slate-100 truncate">{scene.name}</span>
                          <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {scene.speedLimit} km/h
                          </span>
                        </div>
                        <div class="text-[11px] text-slate-400 truncate mt-0.5">
                          {scene.city} • {scene.junctionType.replace(/_/g, ' ')}
                        </div>
                        <div class="text-[10px] font-mono text-rose-400 mt-1">
                          Default Offence: {scene.defaultOffenceType}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Place Sensor / Camera Tool */}
          <button
            id="btn-place-sensor-tool"
            onClick={() => setIsPlacingSensor(!isPlacingSensor)}
            class={`px-3 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition border ${
              isPlacingSensor
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-900/50 animate-pulse'
                : 'bg-slate-950 hover:bg-slate-800 text-cyan-300 border-slate-700'
            }`}
            title="Click on the road canvas to place a custom radar or ALPR camera node"
          >
            <Crosshair class="w-3.5 h-3.5" />
            <span>{isPlacingSensor ? 'Click Road to Place...' : 'Place Sensor'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIMELINE SCRUB BAR: JUMP BETWEEN PAST VIOLATION TIMESTAMPS */}
      {/* ========================================================================= */}
      <div
        id="timeline-scrub-workspace"
        class="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3"
      >
        {/* Timeline Top Control Strip */}
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800 text-xs">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-cyan-400" />
              <span class="font-bold text-slate-200 uppercase font-mono tracking-wider">
                Violation Timeline Scrub Bar
              </span>
            </div>

            {/* Current Scrubbed Timestamp Badge */}
            <div class="flex items-center gap-1.5 font-mono text-xs">
              {isLiveMode ? (
                <span class="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-bold flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>NOW: {new Date().toLocaleTimeString()} (LIVE)</span>
                </span>
              ) : (
                <span class="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-300 font-bold flex items-center gap-1.5">
                  <History class="w-3.5 h-3.5 text-rose-400" />
                  <span>SCRUBBED TIMESTAMP: {selectedHistoricalViolation?.timestamp} CAT</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Jump Controls & Corridor Filter */}
          <div class="flex items-center gap-2 flex-wrap">
            <label class="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer font-mono mr-2">
              <input
                type="checkbox"
                checked={filterCurrentCorridorOnly}
                onChange={(e) => setFilterCurrentCorridorOnly(e.target.checked)}
                class="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>Filter this Corridor</span>
            </label>

            {/* Previous Violation */}
            <button
              id="btn-timeline-prev-violation"
              onClick={handleStepPrevViolation}
              class="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition"
              title="Jump to Previous Past Offence"
            >
              <Rewind class="w-3.5 h-3.5 text-cyan-400" />
              <span>Prev Offence</span>
            </button>

            {/* Next Violation */}
            <button
              id="btn-timeline-next-violation"
              onClick={handleStepNextViolation}
              class="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition"
              title="Jump to Next Offence"
            >
              <span>Next Offence</span>
              <FastForward class="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* Return to Live Button */}
            <button
              id="btn-timeline-jump-live"
              onClick={handleReturnToLive}
              class={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 shadow ${
                isLiveMode
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 cursor-default'
                  : 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              }`}
            >
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{isLiveMode ? 'LIVE REAL-TIME' : 'Return to LIVE (NOW)'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Scrub Range Slider with Marker Indicators */}
        <div class="space-y-2 pt-1">
          <div class="relative w-full py-2">
            {/* Background Track with Color Severity Ticks */}
            <div class="h-3 w-full bg-slate-950 rounded-full border border-slate-800 relative overflow-hidden flex items-center">
              {/* Event Marker Dots along scrub track */}
              {timelineViolations.map((vio, idx) => {
                const total = timelineViolations.length;
                const posPercent = total > 1 ? ((total - 1 - idx) / (total - 1)) * 96 + 2 : 50;
                const isSelected = !isLiveMode && scrubIndex === idx;

                const markerColor =
                  vio.violationType === 'Stolen Vehicle Detected'
                    ? 'bg-purple-500'
                    : vio.violationType === 'Red Light'
                    ? 'bg-amber-400'
                    : vio.violationType === 'Reckless Driving'
                    ? 'bg-rose-500'
                    : 'bg-cyan-400';

                return (
                  <button
                    key={vio.id}
                    onClick={() => handleJumpToViolation(idx)}
                    style={{ left: `${posPercent}%` }}
                    class={`absolute -translate-x-1/2 w-2.5 h-2.5 rounded-full ${markerColor} transition-transform hover:scale-150 z-10 ${
                      isSelected ? 'ring-2 ring-white scale-125' : 'opacity-80'
                    }`}
                    title={`${vio.timestamp} - ${vio.plateNumber} (${vio.violationType})`}
                  />
                );
              })}

              {/* Live Position Marker on far right */}
              <div
                style={{ right: '4px' }}
                class="absolute w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75 z-10"
              />
            </div>

            {/* Slider Range Input */}
            <input
              id="timeline-scrubber-range-slider"
              type="range"
              min="0"
              max={Math.max(1, timelineViolations.length)}
              step="1"
              value={isLiveMode ? timelineViolations.length : timelineViolations.length - 1 - scrubIndex}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= timelineViolations.length) {
                  handleReturnToLive();
                } else {
                  const targetIdx = timelineViolations.length - 1 - val;
                  handleJumpToViolation(targetIdx);
                }
              }}
              class="w-full absolute inset-0 opacity-0 cursor-pointer h-full z-20"
            />
          </div>

          {/* Timeline Range Footnotes */}
          <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <div class="flex items-center gap-1.5">
              <span class="text-slate-500">PAST EVENTS:</span>
              <span>{timelineViolations[timelineViolations.length - 1]?.timestamp || '16:00:00'}</span>
            </div>

            <div class="flex items-center gap-3 text-[10px]">
              <span class="flex items-center gap-1 text-cyan-400">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Speeding
              </span>
              <span class="flex items-center gap-1 text-amber-400">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Red Light
              </span>
              <span class="flex items-center gap-1 text-rose-400">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Reckless
              </span>
              <span class="flex items-center gap-1 text-purple-400">
                <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Stolen
              </span>
            </div>

            <div class="flex items-center gap-1 text-emerald-400 font-bold">
              <span>LIVE CURRENT TIME (NOW)</span>
            </div>
          </div>
        </div>

        {/* Quick-Jump Event Carousel Strip */}
        <div class="pt-1 overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-800">
          <span class="text-[10px] font-mono uppercase text-slate-400 shrink-0 font-bold flex items-center gap-1">
            <History class="w-3 h-3 text-cyan-400" />
            <span>Recorded Incidents ({timelineViolations.length}):</span>
          </span>

          {timelineViolations.map((vio, index) => {
            const isSelected = !isLiveMode && scrubIndex === index;
            return (
              <button
                key={vio.id}
                onClick={() => handleJumpToViolation(index)}
                class={`px-2.5 py-1.5 rounded-xl border text-xs font-mono shrink-0 transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-rose-950 border-rose-500 text-white shadow-lg ring-1 ring-rose-500'
                    : 'bg-slate-950/80 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                {/* Event Thumbnail Preview */}
                <div class="w-6 h-6 rounded-md overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                  <img
                    src={vio.imageUrl || selectedScene.backgroundImage}
                    alt={vio.plateNumber}
                    class="w-full h-full object-cover"
                  />
                </div>

                <div class="text-left">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-slate-200">{vio.timestamp}</span>
                    <span
                      class={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        vio.violationType === 'Stolen Vehicle Detected'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : vio.violationType === 'Red Light'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {vio.violationType}
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400">
                    {vio.plateNumber} • {vio.speed} km/h
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN LIVE SCENE CINEMA & DYNAMIC IMAGE DISPLAY */}
      {/* ========================================================================= */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Live Animated Scene Screen / Dynamic Snapshot (8 Cols) */}
        <div class="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col space-y-3">
          {/* Top Canvas Toolbar */}
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="text-slate-400">CORRIDOR:</span>
              <span class="text-slate-200 font-bold">{selectedScene.road}</span>
              <span class="text-slate-500">|</span>
              <span class="text-amber-400 font-bold">Limit: {selectedScene.speedLimit} km/h</span>
              {!isLiveMode && (
                <span class="px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold">
                  TIMESTAMP: {selectedHistoricalViolation?.timestamp}
                </span>
              )}
            </div>

            {/* Optics Mode Toggles */}
            <div class="flex items-center gap-1.5">
              <button
                id="btn-toggle-scene-ai-hud"
                onClick={() => setShowAiHud(!showAiHud)}
                class={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition flex items-center gap-1 ${
                  showAiHud
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Eye class="w-3 h-3" />
                <span>AI HUD</span>
              </button>

              <button
                id="btn-toggle-scene-radar-lines"
                onClick={() => setShowRadarVectors(!showRadarVectors)}
                class={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition flex items-center gap-1 ${
                  showRadarVectors
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Zap class="w-3 h-3" />
                <span>Radar Lines</span>
              </button>

              <button
                id="btn-toggle-scene-sound"
                onClick={() => setSoundEnabled(!soundEnabled)}
                class={`p-1.5 rounded-lg border transition ${
                  soundEnabled
                    ? 'bg-slate-950 text-emerald-400 border-slate-700'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
                title="Toggle Radar Audio Chimes"
              >
                {soundEnabled ? <Volume2 class="w-3.5 h-3.5" /> : <VolumeX class="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Interactive Simulation Canvas / Dynamic Optical Image View */}
          <div class="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner min-h-[360px] sm:min-h-[400px] flex items-center justify-center">
            {/* View Mode: CANVAS or SPLIT */}
            {(displayMode === 'CANVAS' || displayMode === 'SPLIT') && (
              <div class={displayMode === 'SPLIT' ? 'w-1/2 h-full' : 'w-full h-full'}>
                <canvas
                  ref={canvasRef}
                  width={displayMode === 'SPLIT' ? 400 : 800}
                  height={380}
                  onClick={handleCanvasClick}
                  class={`w-full h-[360px] sm:h-[400px] object-cover cursor-${
                    isPlacingSensor ? 'crosshair' : 'default'
                  } ${isThermal ? 'filter invert hue-rotate-180 contrast-150' : ''}`}
                />
              </div>
            )}

            {/* View Mode: EVIDENCE_PHOTO (Dynamic High-Res Scene & Violation Image) */}
            {(displayMode === 'EVIDENCE_PHOTO' || displayMode === 'SPLIT') && (
              <div
                class={`relative ${
                  displayMode === 'SPLIT' ? 'w-1/2 h-[360px] sm:h-[400px]' : 'w-full h-[360px] sm:h-[400px]'
                } overflow-hidden bg-slate-950`}
              >
                {/* Dynamically Loaded Scene Image based on current selected violation event */}
                <img
                  src={currentSceneImage}
                  alt={selectedScene.name}
                  class="w-full h-full object-cover transition-opacity duration-300"
                />

                {/* Optical Evidence HUD Overlay */}
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/60 p-3 flex flex-col justify-between pointer-events-none">
                  <div class="flex items-center justify-between">
                    <div class="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-100 flex items-center gap-2">
                      <Camera class="w-3.5 h-3.5 text-emerald-400" />
                      <span>{selectedScene.cameraNodeId} • OPTICAL ALPR 4K</span>
                    </div>

                    <div class="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-mono text-amber-300">
                      {isLiveMode ? 'LIVE OPTICAL FEED' : `EVIDENCE: ${selectedHistoricalViolation?.timestamp}`}
                    </div>
                  </div>

                  {/* AI OCR Bounding Box on Image */}
                  {activeOffence && showAiHud && (
                    <div class="absolute top-1/3 left-1/3 p-3 border-2 border-rose-500 bg-rose-950/30 rounded-lg animate-pulse pointer-events-auto">
                      <div class="bg-rose-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded -mt-6 -ml-2 w-max shadow">
                        ALPR MATCH: {activeOffence.plate} • {activeOffence.speed} km/h
                      </div>
                      <div class="text-[10px] font-mono text-rose-200 mt-1">
                        Offence: {activeOffence.offenceType || 'Infraction'}
                      </div>
                    </div>
                  )}

                  <div class="flex items-center justify-between text-xs font-mono text-slate-300">
                    <div>{selectedScene.name}</div>
                    <div class="text-rose-400 font-bold">
                      {activeOffence ? `CLOCK: ${activeOffence.speed} km/h (Limit: ${selectedScene.speedLimit})` : ''}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live / Historical Offence Floating Alert Toast */}
            {offenceNotification && (
              <div class="absolute bottom-3 left-3 right-3 bg-rose-950/95 backdrop-blur-md border border-rose-600 text-slate-100 p-3 rounded-xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in slide-in-from-bottom-2 duration-200 z-30">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white shrink-0 animate-pulse">
                    <ShieldAlert class="w-4 h-4" />
                  </div>
                  <div>
                    <div class="text-xs font-bold text-rose-200 flex items-center gap-2">
                      <span>{offenceNotification.title}</span>
                      <span class="font-mono bg-slate-900 px-1.5 py-0.2 rounded text-amber-300 text-[10px]">
                        {offenceNotification.plate}
                      </span>
                      <span class="text-[10px] font-mono text-slate-400">
                        ({offenceNotification.timestamp})
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-300">{offenceNotification.description}</div>
                  </div>
                </div>

                <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    id="btn-live-toast-issue-notice"
                    onClick={handleGenerateCitationFromLiveOffence}
                    class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-mono transition flex items-center gap-1"
                  >
                    <FileText class="w-3.5 h-3.5" />
                    <span>Issue Citation (K{offenceNotification.fine})</span>
                  </button>

                  <button
                    id="btn-live-toast-dispatch"
                    onClick={handleDispatchPatrolToScene}
                    class="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold font-mono transition flex items-center gap-1"
                  >
                    <Radio class="w-3.5 h-3.5" />
                    <span>Dispatch Patrol</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Playback Controls & Replay Speed */}
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2">
              <button
                id="btn-scene-play-pause"
                onClick={() => setIsPlaying(!isPlaying)}
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg font-medium flex items-center gap-1.5 transition"
              >
                {isPlaying ? (
                  <Pause class="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Play class="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{isPlaying ? 'Pause Feed' : 'Resume Feed'}</span>
              </button>

              <button
                id="btn-scene-restart-sim"
                onClick={initSceneVehicles}
                class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                title="Reset Scene Traffic"
              >
                <RotateCcw class="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Playback Speeds */}
            <div class="flex items-center gap-1.5 font-mono">
              <span class="text-slate-400 text-[11px]">SPEED:</span>
              {[0.25, 0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  class={`px-2 py-1 rounded text-xs transition ${
                    playbackSpeed === spd
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <div class="text-[11px] font-mono text-slate-400">
              FRAME CAPTURE: 30 FPS • RTSA AI ENGINE V2.4
            </div>
          </div>
        </div>

        {/* Right Side: Live Offence Trigger Deck & Offender Telemetry (4 Cols) */}
        <div class="lg:col-span-4 space-y-4">
          {/* Active Offender Telemetry Dossier */}
          {activeOffence && (
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <span class="text-xs font-bold font-mono text-slate-200 uppercase flex items-center gap-1.5">
                  <Car class="w-4 h-4 text-cyan-400" />
                  <span>Target Offender Dossier</span>
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  {activeOffence.offenceType || 'SPEEDING'}
                </span>
              </div>

              {/* Dynamic Snapshot of Offender */}
              <div class="w-full h-28 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                <img
                  src={currentSceneImage}
                  alt={activeOffence.plate}
                  class="w-full h-full object-cover"
                />
                <div class="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-sm p-1.5 text-[10px] font-mono text-slate-200 flex justify-between">
                  <span>PLATE: {activeOffence.plate}</span>
                  <span class="text-emerald-400 font-bold">RADAR MATCH: 98%</span>
                </div>
              </div>

              <div class="space-y-2 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div class="flex justify-between">
                  <span class="text-slate-400">VEHICLE PLATE:</span>
                  <span class="text-amber-400 font-bold">{activeOffence.plate} (ZM)</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">MODEL & MAKE:</span>
                  <span class="text-slate-200 truncate max-w-[170px]">{activeOffence.make}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">CLOCK SPEED:</span>
                  <span class="text-rose-400 font-bold">
                    {activeOffence.speed} km/h (Limit: {selectedScene.speedLimit})
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">REGISTERED OWNER:</span>
                  <span class="text-slate-200 truncate max-w-[170px]">{activeOffence.driverName}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">STATUTORY FINE:</span>
                  <span class="text-emerald-400 font-bold">ZMW {activeOffence.fineZMW}</span>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-1">
                <button
                  id="btn-dossier-generate-citation"
                  onClick={handleGenerateCitationFromLiveOffence}
                  class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition shadow"
                >
                  <FileText class="w-3.5 h-3.5" />
                  <span>Generate Citation</span>
                </button>

                <button
                  id="btn-dossier-dispatch-patrol"
                  onClick={handleDispatchPatrolToScene}
                  class="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition shadow"
                  title="Dispatch Nearest Highway Squad"
                >
                  <Radio class="w-3.5 h-3.5" />
                  <span>Dispatch</span>
                </button>
              </div>
            </div>
          )}

          {/* Instant Offence Injection Deck */}
          <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div class="flex items-center gap-2">
                <Flame class="w-4 h-4 text-rose-400" />
                <h3 class="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Live Offence Injector Deck
                </h3>
              </div>
              <span class="text-[10px] font-mono text-emerald-400">INTERACTIVE</span>
            </div>

            <p class="text-[11px] text-slate-400 leading-relaxed">
              Inject specific statutory traffic infractions into this scene to test radar detection and timeline recording:
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              <button
                id="btn-inject-excess-speed"
                onClick={() => triggerOffence('Speeding')}
                class="w-full p-2.5 bg-slate-950 hover:bg-rose-950/70 border border-slate-800 hover:border-rose-600/80 rounded-xl text-xs text-left transition flex items-center justify-between group"
              >
                <div>
                  <div class="font-bold text-slate-200 group-hover:text-rose-300 flex items-center gap-1.5">
                    <span>⚡ Excessive Speeding (+48 km/h)</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono">Radar Laser Clocking • Fine: ZMW 750</div>
                </div>
                <Zap class="w-4 h-4 text-rose-400" />
              </button>

              <button
                id="btn-inject-red-light"
                onClick={() => triggerOffence('Red Light')}
                class="w-full p-2.5 bg-slate-950 hover:bg-amber-950/70 border border-slate-800 hover:border-amber-600/80 rounded-xl text-xs text-left transition flex items-center justify-between group"
              >
                <div>
                  <div class="font-bold text-slate-200 group-hover:text-amber-300 flex items-center gap-1.5">
                    <span>🛑 Red Light Signal Breach</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono">Public Minibus Violation • Fine: ZMW 500</div>
                </div>
                <AlertTriangle class="w-4 h-4 text-amber-400" />
              </button>

              <button
                id="btn-inject-stolen-car"
                onClick={() => triggerOffence('Stolen Vehicle')}
                class="w-full p-2.5 bg-slate-950 hover:bg-rose-950/70 border border-slate-800 hover:border-rose-600/80 rounded-xl text-xs text-left transition flex items-center justify-between group"
              >
                <div>
                  <div class="font-bold text-slate-200 group-hover:text-rose-300 flex items-center gap-1.5">
                    <span>🚨 Flagged Stolen Vehicle / Interpol</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono">Instant Tactical Police Dispatch Order</div>
                </div>
                <ShieldAlert class="w-4 h-4 text-rose-500" />
              </button>

              <button
                id="btn-inject-reckless-overtake"
                onClick={() => triggerOffence('Reckless Driving')}
                class="w-full p-2.5 bg-slate-950 hover:bg-purple-950/70 border border-slate-800 hover:border-purple-600/80 rounded-xl text-xs text-left transition flex items-center justify-between group"
              >
                <div>
                  <div class="font-bold text-slate-200 group-hover:text-purple-300 flex items-center gap-1.5">
                    <span>⚠️ Double Solid Line Overtake</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono">Dangerous Wrong-Way Maneuver</div>
                </div>
                <FastForward class="w-4 h-4 text-purple-400" />
              </button>

              <button
                id="btn-inject-stalled-truck"
                onClick={() => triggerOffence('Lane Obstruction')}
                class="w-full p-2.5 bg-slate-950 hover:bg-cyan-950/70 border border-slate-800 hover:border-cyan-600/80 rounded-xl text-xs text-left transition flex items-center justify-between group"
              >
                <div>
                  <div class="font-bold text-slate-200 group-hover:text-cyan-300 flex items-center gap-1.5">
                    <span>🚧 Stalled Haulage Truck Hazard</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono">Lane Chokepoint & Tow Service Needed</div>
                </div>
                <Car class="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
