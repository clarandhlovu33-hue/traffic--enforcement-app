import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { CameraFeed, IncidentAlert, PatrolUnit, ZambianCity } from '../types';
import { ZAMBIAN_CITIES } from '../data/zambiaData';
import {
  ShieldAlert,
  Radio,
  Video,
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
  ExternalLink,
  MapPin,
  Car,
  Navigation,
  Activity,
  Eye,
  CheckCircle2,
  Sparkles,
  Info,
  Maximize2,
  Globe,
  Satellite,
  Gauge
} from 'lucide-react';

export type GoogleMapType = 'DEFAULT' | 'SATELLITE' | 'HYBRID' | 'TRAFFIC' | 'TERRAIN' | 'DARK';

interface MapViewProps {
  currentCity: ZambianCity;
  cameras: CameraFeed[];
  incidents: IncidentAlert[];
  patrolUnits: PatrolUnit[];
  onSelectCity: (city: ZambianCity) => void;
  onSelectCamera: (camera: CameraFeed) => void;
  onSelectIncident: (incident: IncidentAlert) => void;
  onSelectPatrol?: (patrol: PatrolUnit) => void;
}

export function MapView({
  currentCity,
  cameras,
  incidents,
  patrolUnits,
  onSelectCity,
  onSelectCamera,
  onSelectIncident,
  onSelectPatrol
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const trafficTileLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Map Mode & Google Maps Layer Selection
  const [mapType, setMapType] = useState<GoogleMapType>('DEFAULT');
  const [showTrafficOverlay, setShowTrafficOverlay] = useState<boolean>(true);
  const [showMapDetails, setShowMapDetails] = useState<boolean>(true);

  // Entity Overlay Toggles
  const [showCameras, setShowCameras] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showPatrols, setShowPatrols] = useState(true);
  const [showSpeedTraps, setShowSpeedTraps] = useState(true);

  // UI Panels
  const [activeLayerPanel, setActiveLayerPanel] = useState(false);
  const [activeDetailsPanel, setActiveDetailsPanel] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(12);
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number }>({
    lat: ZAMBIAN_CITIES[currentCity]?.lat || -15.4167,
    lng: ZAMBIAN_CITIES[currentCity]?.lng || 28.2833
  });

  const cityConfig = ZAMBIAN_CITIES[currentCity] || ZAMBIAN_CITIES['Lusaka'];

  // Google Maps Tile URL Generator based on selected Map Type
  const getBaseTileUrl = (type: GoogleMapType): { url: string; attribution: string; maxZoom: number } => {
    switch (type) {
      case 'SATELLITE':
        return {
          url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps Satellite Imagery',
          maxZoom: 20
        };
      case 'HYBRID':
        return {
          url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps Satellite & Road Details',
          maxZoom: 20
        };
      case 'TRAFFIC':
        return {
          url: 'https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps Live Traffic Data',
          maxZoom: 20
        };
      case 'TERRAIN':
        return {
          url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps Physical Terrain',
          maxZoom: 20
        };
      case 'DARK':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CartoDB Dark Tactical Map',
          maxZoom: 19
        };
      case 'DEFAULT':
      default:
        return {
          url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps Standard Roadmap',
          maxZoom: 20
        };
    }
  };

  // Google Maps External URL with live traffic and coordinates
  const googleMapsExternalUrl = useMemo(() => {
    const lat = currentCenter.lat;
    const lng = currentCenter.lng;
    const zoom = currentZoom;
    // !5m1!1e1 activates real-time traffic overlay on Google Maps
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!5m1!1e1`;
  }, [currentCenter, currentZoom]);

  // Google Maps Satellite Link
  const googleMapsSatelliteUrl = useMemo(() => {
    const lat = currentCenter.lat;
    const lng = currentCenter.lng;
    const zoom = currentZoom;
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!3m1!1e3`;
  }, [currentCenter, currentZoom]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCity = ZAMBIAN_CITIES[currentCity] || ZAMBIAN_CITIES['Lusaka'];
    const initLat = Number.isFinite(initialCity?.lat) ? initialCity.lat : -15.4167;
    const initLng = Number.isFinite(initialCity?.lng) ? initialCity.lng : 28.2833;
    const initZoom = Number.isFinite(initialCity?.zoom) ? initialCity.zoom : 13;

    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLng],
      zoom: initZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Default Google Maps Roadmap Base Layer
    const tileConfig = getBaseTileUrl('DEFAULT');
    const baseTileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);
    baseTileLayerRef.current = baseTileLayer;

    // Optional Live Traffic Tile Layer (overlayable on top of any base)
    const trafficLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=h,traffic&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      opacity: 0.85
    });
    trafficTileLayerRef.current = trafficLayer;

    if (showTrafficOverlay && mapType !== 'TRAFFIC') {
      trafficLayer.addTo(map);
    }

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Track zoom and movement for HUD details safely
    map.on('zoomend', () => {
      const z = map.getZoom();
      if (Number.isFinite(z)) {
        setCurrentZoom(z);
      }
    });

    map.on('moveend', () => {
      const center = map.getCenter();
      if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
        setCurrentCenter({ lat: Number(center.lat.toFixed(4)), lng: Number(center.lng.toFixed(4)) });
      }
    });

    // Invalidate size once mounted so Leaflet dimensions compute accurately
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (err) {
        console.warn('Map invalidateSize skipped', err);
      }
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Base Tile Layer Updates when mapType changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove old base layer
    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const tileConfig = getBaseTileUrl(mapType);
    const newBaseLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      subdomains: mapType === 'DARK' ? 'abcd' : ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    baseTileLayerRef.current = newBaseLayer;
  }, [mapType]);

  // Handle Live Traffic Overlay toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !trafficTileLayerRef.current) return;
    const map = mapInstanceRef.current;
    const trafficLayer = trafficTileLayerRef.current;

    // If mapType is already full TRAFFIC, we don't need double overlay
    if (showTrafficOverlay && mapType !== 'TRAFFIC') {
      if (!map.hasLayer(trafficLayer)) {
        trafficLayer.addTo(map);
      }
    } else {
      if (map.hasLayer(trafficLayer)) {
        map.removeLayer(trafficLayer);
      }
    }
  }, [showTrafficOverlay, mapType]);

  // Update map center when city changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const config = ZAMBIAN_CITIES[currentCity] || ZAMBIAN_CITIES['Lusaka'];
    if (config && Number.isFinite(config.lat) && Number.isFinite(config.lng)) {
      mapInstanceRef.current.flyTo([config.lat, config.lng], config.zoom || 13, {
        duration: 1.2
      });
      setCurrentCenter({ lat: config.lat, lng: config.lng });
      setCurrentZoom(config.zoom || 13);
    }
  }, [currentCity]);

  // Render dynamic markers (Cameras, Incidents, Patrols, Speed Traps)
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    // 1. Render CCTV Cameras
    if (showCameras) {
      cameras.forEach((camera) => {
        const lat = Number(camera.lat);
        const lng = Number(camera.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const isOnline = camera.status === 'ONLINE';
        const hasViolations = camera.activeViolationsToday > 20;

        const cameraIconHtml = `
          <div className="relative flex items-center justify-center cursor-pointer group">
            <div className="w-8 h-8 rounded-full ${
              isOnline ? (hasViolations ? 'bg-amber-600' : 'bg-emerald-600') : 'bg-rose-600'
            } text-white flex items-center justify-center shadow-lg border-2 border-slate-900 ring-2 ${
              isOnline ? 'ring-emerald-400/50' : 'ring-rose-500/50'
            } transform transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/>
              </svg>
            </div>
            <div className="absolute -bottom-5 bg-slate-900/90 text-[10px] font-mono text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap shadow">
              ${camera.speedLimit} km/h
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: cameraIconHtml,
          className: 'custom-camera-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([lat, lng], { icon });

        marker.on('click', () => {
          onSelectCamera(camera);
        });

        const gMapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        const gMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

        marker.bindPopup(`
          <div className="space-y-2 text-xs min-w-[210px]">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1">
              <span className="font-bold text-emerald-400">${camera.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono ${
                camera.status === 'ONLINE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300'
              }">${camera.status}</span>
            </div>
            <div className="text-slate-300 font-mono">Road: <span className="text-white">${camera.road}</span></div>
            <div className="text-slate-300 font-mono">Speed Limit: <span className="text-amber-400 font-bold">${camera.speedLimit} km/h</span></div>
            <div className="text-slate-300 font-mono">Bearing: <span className="text-slate-200">${camera.bearing}</span></div>
            <div className="text-slate-300 font-mono">Detections Today: <span className="text-cyan-400 font-bold">${camera.detectedCountToday}</span></div>
            <div className="text-[10px] text-slate-400 font-mono">GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
            
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-700">
              <a href="${gMapsDirectUrl}" target="_blank" rel="noopener noreferrer" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] py-1 px-1.5 rounded flex items-center justify-center gap-1 font-mono transition">
                <span>Google Map</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <a href="${gMapsDirectionsUrl}" target="_blank" rel="noopener noreferrer" className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] py-1 px-1.5 rounded flex items-center justify-center gap-1 font-mono transition font-bold">
                <span>Navigate</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              </a>
            </div>
          </div>
        `);

        layerGroupRef.current?.addLayer(marker);
      });
    }

    // 2. Render Incidents & Road Hazards
    if (showIncidents) {
      incidents.forEach((inc) => {
        if (inc.status === 'RESOLVED' || inc.status === 'FALSE_ALARM') return;
        const lat = Number(inc.lat);
        const lng = Number(inc.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const isCritical = inc.severity === 'CRITICAL';

        const incidentHtml = `
          <div className="relative flex items-center justify-center cursor-pointer animate-bounce">
            <div className="w-9 h-9 rounded-full ${
              isCritical ? 'bg-rose-600' : 'bg-amber-600'
            } text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ${
              isCritical ? 'ring-rose-500/60' : 'ring-amber-500/60'
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
          </div>
        `;

        const icon = L.divIcon({
          html: incidentHtml,
          className: 'custom-incident-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([lat, lng], { icon });

        marker.on('click', () => {
          onSelectIncident(inc);
        });

        const gMapsIncidentUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        const gMapsNavigateIncident = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

        marker.bindPopup(`
          <div className="space-y-2 text-xs min-w-[220px]">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1">
              <span className="font-bold text-rose-400">${inc.title}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-mono">${inc.severity}</span>
            </div>
            <div className="text-slate-300">Location: <span className="text-white">${inc.location}</span></div>
            <div className="text-slate-300 font-mono">Status: <span className="text-amber-400 font-bold">${inc.status}</span></div>
            <div className="text-slate-400 italic text-[11px]">${inc.description}</div>
            
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-700">
              <a href="${gMapsIncidentUrl}" target="_blank" rel="noopener noreferrer" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] py-1 px-1.5 rounded flex items-center justify-center gap-1 font-mono transition">
                <span>Google Map</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <a href="${gMapsNavigateIncident}" target="_blank" rel="noopener noreferrer" className="bg-rose-700 hover:bg-rose-600 text-white text-[11px] py-1 px-1.5 rounded flex items-center justify-center gap-1 font-mono transition font-bold">
                <span>Dispatch Route</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              </a>
            </div>
          </div>
        `);

        layerGroupRef.current?.addLayer(marker);
      });
    }

    // 3. Render Patrol Units
    if (showPatrols) {
      patrolUnits.forEach((patrol) => {
        const lat = Number(patrol.lat);
        const lng = Number(patrol.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const isRtsa = patrol.agency === 'RTSA';
        const isEnRoute = patrol.status === 'EN_ROUTE';

        const patrolHtml = `
          <div className="relative flex items-center justify-center cursor-pointer group">
            <div className="w-8 h-8 rounded-lg ${
              isRtsa ? 'bg-cyan-600' : 'bg-indigo-600'
            } text-white flex items-center justify-center shadow-lg border-2 border-slate-900 ring-2 ${
              isEnRoute ? 'ring-amber-400 animate-pulse' : 'ring-cyan-400/40'
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <div className="absolute -bottom-5 bg-slate-950/90 text-[9px] font-mono text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap shadow">
              ${patrol.callSign}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: patrolHtml,
          className: 'custom-patrol-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([lat, lng], { icon });

        if (onSelectPatrol) {
          marker.on('click', () => onSelectPatrol(patrol));
        }

        const gMapsPatrolUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

        marker.bindPopup(`
          <div className="space-y-2 text-xs min-w-[210px]">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1">
              <span className="font-bold text-cyan-400">${patrol.callSign} (${patrol.agency})</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono ${
                patrol.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300'
              }">${patrol.status}</span>
            </div>
            <div className="text-slate-300">Officer: <span className="text-white font-medium">${patrol.officerInCharge}</span></div>
            <div className="text-slate-300 font-mono">Sector: <span className="text-slate-200">${patrol.currentRoad}</span></div>
            <div className="text-slate-300">Vehicle: <span className="text-slate-200">${patrol.vehicleType}</span></div>
            <div className="text-slate-300 font-mono">Fuel: <span className="text-emerald-400 font-bold">${patrol.fuelLevel}%</span></div>
            
            <div className="pt-1 border-t border-slate-700">
              <a href="${gMapsPatrolUrl}" target="_blank" rel="noopener noreferrer" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] py-1 px-2 rounded flex items-center justify-center gap-1 font-mono transition">
                <span>View Unit on Google Maps</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </div>
        `);

        layerGroupRef.current?.addLayer(marker);
      });
    }
  }, [cameras, incidents, patrolUnits, showCameras, showIncidents, showPatrols, onSelectCamera, onSelectIncident, onSelectPatrol]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const cityList: ZambianCity[] = [
    'Lusaka',
    'Kitwe',
    'Ndola',
    'Livingstone',
    'Chingola',
    'Mufulira',
    'Kabwe',
    'Chipata',
    'Solwezi'
  ];

  return (
    <div id="zambia-tactical-map" className="relative w-full h-full min-h-[560px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Map HUD Bar with City Quick Selector & Google Map Type Switchers */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Region / City Quick Selector */}
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl flex items-center gap-1 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-400 border-r border-slate-700 mr-1 font-mono">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            <span>REGION:</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-[420px] md:max-w-[560px] py-0.5 scrollbar-thin">
            {cityList.map((city) => (
              <button
                key={city}
                id={`map-city-btn-${city.toLowerCase()}`}
                onClick={() => onSelectCity(city)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition whitespace-nowrap ${
                  currentCity === city
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Google Map Types & Details Toolstrip */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Direct Google Maps External Link Button */}
          <a
            id="btn-open-google-maps-external"
            href={googleMapsExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-slate-900/95 hover:bg-slate-800 text-slate-100 border border-slate-700 hover:border-emerald-500/60 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-xl"
            title="Open Current Corridor in Google Maps with Live Traffic Layer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Map Details HUD Toggle Button */}
          <button
            id="btn-toggle-map-details-hud"
            onClick={() => setActiveDetailsPanel(!activeDetailsPanel)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition border shadow-xl ${
              activeDetailsPanel
                ? 'bg-emerald-600 text-slate-950 border-emerald-400'
                : 'bg-slate-900/95 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title="Toggle Map Details HUD"
          >
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Map Details</span>
          </button>
        </div>
      </div>

      {/* Floating Google Maps Layer Selector Bar (Default / Satellite / Hybrid / Traffic / Terrain / Dark) */}
      <div className="absolute top-16 left-3 z-[1000] pointer-events-auto">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl flex items-center gap-1 text-xs font-mono">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 border-r border-slate-800 hidden sm:flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>MAP VIEW:</span>
          </div>

          {/* Default Google Roadmap */}
          <button
            id="btn-map-type-default"
            onClick={() => setMapType('DEFAULT')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              mapType === 'DEFAULT'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Google Maps Default Roadmap View"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Default</span>
          </button>

          {/* Google Satellite */}
          <button
            id="btn-map-type-satellite"
            onClick={() => setMapType('SATELLITE')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              mapType === 'SATELLITE'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Pure Google Satellite Imagery"
          >
            <Satellite className="w-3.5 h-3.5 text-amber-400" />
            <span>Satellite</span>
          </button>

          {/* Google Satellite Hybrid (Satellite + Road Labels) */}
          <button
            id="btn-map-type-hybrid"
            onClick={() => setMapType('HYBRID')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              mapType === 'HYBRID'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Google Satellite with Road Names & Place Details"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hybrid</span>
          </button>

          {/* Google Traffic Layer */}
          <button
            id="btn-map-type-traffic"
            onClick={() => setMapType('TRAFFIC')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              mapType === 'TRAFFIC'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Google Maps Full Real-Time Traffic Conditions"
          >
            <Gauge className="w-3.5 h-3.5 text-rose-400" />
            <span>Traffic</span>
          </button>

          {/* Tactical Dark View */}
          <button
            id="btn-map-type-dark"
            onClick={() => setMapType('DARK')}
            className={`px-2 py-1.5 rounded-lg font-medium transition hidden md:flex items-center gap-1 ${
              mapType === 'DARK'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Command Center High-Contrast Dark Tactical Map"
          >
            <span>Dark</span>
          </button>

          {/* Terrain View */}
          <button
            id="btn-map-type-terrain"
            onClick={() => setMapType('TERRAIN')}
            className={`px-2 py-1.5 rounded-lg font-medium transition hidden lg:flex items-center gap-1 ${
              mapType === 'TERRAIN'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Google Maps Physical Terrain & Contours"
          >
            <span>Terrain</span>
          </button>
        </div>
      </div>

      {/* Layer Control & Overlay Widget (Right Side) */}
      <div className="absolute top-16 right-3 z-[1000] flex flex-col items-end gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-xl p-1 flex items-center gap-1">
          <button
            id="map-toggle-layer-panel"
            onClick={() => setActiveLayerPanel(!activeLayerPanel)}
            className={`px-2.5 py-1.5 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition ${
              activeLayerPanel ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Layers & Overlays</span>
          </button>
        </div>

        {/* Detailed Overlays Popover Panel */}
        {activeLayerPanel && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-3.5 shadow-2xl w-64 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 font-mono">
            <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
              <span>Map Overlays</span>
              <span className="text-[10px] text-emerald-400">RTSA TELEMETRY</span>
            </div>

            {/* Live Traffic Overlay Toggle */}
            <label className="flex items-center justify-between text-slate-200 hover:text-white cursor-pointer select-none py-1 px-1.5 rounded hover:bg-slate-800/60">
              <span className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Google Traffic Overlay</span>
              </span>
              <input
                type="checkbox"
                checked={showTrafficOverlay}
                onChange={(e) => setShowTrafficOverlay(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-800"
              />
            </label>

            {/* CCTV Video Cameras */}
            <label className="flex items-center justify-between text-slate-200 hover:text-white cursor-pointer select-none py-1 px-1.5 rounded hover:bg-slate-800/60">
              <span className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <span>CCTV Optical Radar ({cameras.length})</span>
              </span>
              <input
                type="checkbox"
                checked={showCameras}
                onChange={(e) => setShowCameras(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-800"
              />
            </label>

            {/* Road Hazards & Critical Incidents */}
            <label className="flex items-center justify-between text-slate-200 hover:text-white cursor-pointer select-none py-1 px-1.5 rounded hover:bg-slate-800/60">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Active Incidents ({incidents.filter((i) => i.status !== 'RESOLVED').length})</span>
              </span>
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                className="rounded border-slate-700 text-rose-500 focus:ring-0 bg-slate-800"
              />
            </label>

            {/* Patrol Units Fleet */}
            <label className="flex items-center justify-between text-slate-200 hover:text-white cursor-pointer select-none py-1 px-1.5 rounded hover:bg-slate-800/60">
              <span className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Patrol Fleet Units ({patrolUnits.length})</span>
              </span>
              <input
                type="checkbox"
                checked={showPatrols}
                onChange={(e) => setShowPatrols(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-800"
              />
            </label>
          </div>
        )}

        {/* Map Zoom Controls */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl p-1 flex flex-col gap-1">
          <button
            id="map-btn-zoom-in"
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="map-btn-zoom-out"
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Details HUD Flyout (Telemetry, Traffic Flow, Coordinates & Google Navigation) */}
      {activeDetailsPanel && (
        <div
          id="map-details-hud-card"
          className="absolute top-28 right-3 z-[1000] w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl text-xs space-y-3 font-mono animate-in fade-in slide-in-from-right-2 duration-150 pointer-events-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Google Map Details & Telemetry</span>
            </span>
            <button
              onClick={() => setActiveDetailsPanel(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Sector:</span>
              <span className="font-bold text-emerald-400">{currentCity} Arterial Hub</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">GPS Coordinates:</span>
              <span className="text-white font-mono">{currentCenter.lat}° S, {currentCenter.lng}° E</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Zoom Level:</span>
              <span className="text-cyan-400 font-bold">{currentZoom}x</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Base Map Provider:</span>
              <span className="text-amber-300 font-bold">Google Maps ({mapType})</span>
            </div>
          </div>

          {/* Traffic Flow Status Legend */}
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-300 text-[11px] flex items-center justify-between">
              <span>Google Live Traffic Flow:</span>
              <span className="text-emerald-400 text-[10px]">REAL-TIME</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1">
              <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 py-1 rounded">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-0.5"></div>
                <span>Fast</span>
              </div>
              <div className="bg-amber-950/80 border border-amber-700 text-amber-300 py-1 rounded">
                <div className="w-2 h-2 rounded-full bg-amber-500 mx-auto mb-0.5"></div>
                <span>Moderate</span>
              </div>
              <div className="bg-orange-950/80 border border-orange-700 text-orange-300 py-1 rounded">
                <div className="w-2 h-2 rounded-full bg-orange-500 mx-auto mb-0.5"></div>
                <span>Slow</span>
              </div>
              <div className="bg-rose-950/80 border border-rose-700 text-rose-300 py-1 rounded">
                <div className="w-2 h-2 rounded-full bg-rose-500 mx-auto mb-0.5"></div>
                <span>Congested</span>
              </div>
            </div>
          </div>

          {/* Quick Action Links */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={googleMapsExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 py-1.5 px-2 rounded-lg text-center font-bold flex items-center justify-center gap-1 transition"
            >
              <span>Live Traffic</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <a
              href={googleMapsSatelliteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-cyan-700 hover:bg-cyan-600 text-white py-1.5 px-2 rounded-lg text-center font-bold flex items-center justify-center gap-1 transition"
            >
              <span>Full Satellite</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Bottom Map Legend & Status Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-2xl pointer-events-auto flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/40"></span>
            <span>CCTV Camera Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>Active Hazard / Incident</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
            <span>Patrol Unit (RTSA / ZP)</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-amber-400">
            <Gauge className="w-3 h-3" />
            <span>Google Traffic: Active</span>
          </div>
        </div>

        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-2xl pointer-events-auto text-[11px] font-mono text-slate-400 flex items-center gap-2">
          <span>{currentCity.toUpperCase()} • T2 / T3 / T4 CORRIDOR GEO-SURVEILLANCE</span>
          <span className="text-emerald-400 font-bold">● GOOGLE MAPS</span>
        </div>
      </div>
    </div>
  );
}
