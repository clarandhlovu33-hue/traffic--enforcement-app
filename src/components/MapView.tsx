import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CameraFeed, IncidentAlert, PatrolUnit, ZambianCity } from '../types';
import { ZAMBIAN_CITIES } from '../data/zambiaData';
import { Eye, ShieldAlert, Radio, Video, Sliders, Layers, ZoomIn, ZoomOut, Compass } from 'lucide-react';

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
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [showCameras, setShowCameras] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showPatrols, setShowPatrols] = useState(true);
  const [showSpeedTraps, setShowSpeedTraps] = useState(true);
  const [activeLayerPanel, setActiveLayerPanel] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const cityConfig = ZAMBIAN_CITIES[currentCity] || ZAMBIAN_CITIES['Lusaka'];

    const map = L.map(mapContainerRef.current, {
      center: [cityConfig.lat, cityConfig.lng],
      zoom: cityConfig.zoom,
      zoomControl: false,
      attributionControl: false
    });

    // Dark-themed high-contrast map tiles from CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map center when city changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const cityConfig = ZAMBIAN_CITIES[currentCity];
    if (cityConfig) {
      mapInstanceRef.current.flyTo([cityConfig.lat, cityConfig.lng], cityConfig.zoom, {
        duration: 1.2
      });
    }
  }, [currentCity]);

  // Render dynamic markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    // 1. Render Cameras
    if (showCameras) {
      cameras.forEach((camera) => {
        const isOnline = camera.status === 'ONLINE';
        const hasViolations = camera.activeViolationsToday > 20;

        const cameraIconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-8 h-8 rounded-full ${
              isOnline ? (hasViolations ? 'bg-amber-600' : 'bg-emerald-600') : 'bg-rose-600'
            } text-white flex items-center justify-center shadow-lg border-2 border-slate-900 ring-2 ${
              isOnline ? 'ring-emerald-400/50' : 'ring-rose-500/50'
            } transform transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/>
              </svg>
            </div>
            <div class="absolute -bottom-5 bg-slate-900/90 text-[10px] font-mono text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap shadow">
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

        const marker = L.marker([camera.lat, camera.lng], { icon });

        marker.on('click', () => {
          onSelectCamera(camera);
        });

        marker.bindPopup(`
          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1">
              <span class="font-bold text-emerald-400">${camera.name}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] ${
                camera.status === 'ONLINE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300'
              }">${camera.status}</span>
            </div>
            <div class="text-slate-300 font-mono">Road: <span class="text-white">${camera.road}</span></div>
            <div class="text-slate-300 font-mono">Speed Limit: <span class="text-amber-400 font-bold">${camera.speedLimit} km/h</span></div>
            <div class="text-slate-300 font-mono">Bearing: <span class="text-slate-200">${camera.bearing}</span></div>
            <div class="text-slate-300 font-mono">Detections Today: <span class="text-cyan-400">${camera.detectedCountToday}</span></div>
            <button id="btn-view-cam-${camera.id}" class="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-1 px-2 rounded text-xs transition flex items-center justify-center gap-1">
              <span>View Live CCTV Feed</span>
            </button>
          </div>
        `);

        layerGroupRef.current?.addLayer(marker);
      });
    }

    // 2. Render Incidents
    if (showIncidents) {
      incidents.forEach((inc) => {
        if (inc.status === 'RESOLVED' || inc.status === 'FALSE_ALARM') return;
        const isCritical = inc.severity === 'CRITICAL';

        const incidentHtml = `
          <div class="relative flex items-center justify-center cursor-pointer animate-bounce">
            <div class="w-9 h-9 rounded-full ${
              isCritical ? 'bg-rose-600' : 'bg-amber-600'
            } text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ${
              isCritical ? 'ring-rose-500/60' : 'ring-amber-500/60'
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
          </div>
        `;

        const icon = L.divIcon({
          html: incidentHtml,
          className: 'custom-incident-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([inc.lat, inc.lng], { icon });

        marker.on('click', () => {
          onSelectIncident(inc);
        });

        marker.bindPopup(`
          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1">
              <span class="font-bold text-rose-400">${inc.title}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800">${inc.severity}</span>
            </div>
            <div class="text-slate-300">Location: <span class="text-white">${inc.location}</span></div>
            <div class="text-slate-300">Status: <span class="text-amber-400 font-bold">${inc.status}</span></div>
            <div class="text-slate-400 italic">${inc.description}</div>
            <button class="w-full mt-2 bg-rose-600 hover:bg-rose-500 text-white font-medium py-1 px-2 rounded text-xs transition">
              Open Authorized Dispatch Workflow
            </button>
          </div>
        `);

        layerGroupRef.current?.addLayer(marker);
      });
    }

    // 3. Render Patrol Units
    if (showPatrols) {
      patrolUnits.forEach((patrol) => {
        const isRtsa = patrol.agency === 'RTSA';
        const isEnRoute = patrol.status === 'EN_ROUTE';

        const patrolHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-8 h-8 rounded-lg ${
              isRtsa ? 'bg-cyan-600' : 'bg-indigo-600'
            } text-white flex items-center justify-center shadow-lg border-2 border-slate-900 ring-2 ${
              isEnRoute ? 'ring-amber-400 animate-pulse' : 'ring-cyan-400/40'
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <div class="absolute -bottom-5 bg-slate-950/90 text-[9px] font-mono text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap shadow">
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

        const marker = L.marker([patrol.lat, patrol.lng], { icon });

        marker.bindPopup(`
          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1">
              <span class="font-bold text-cyan-400">${patrol.callSign} (${patrol.agency})</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] ${
                patrol.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300'
              }">${patrol.status}</span>
            </div>
            <div class="text-slate-300">Officer: <span class="text-white font-medium">${patrol.officerInCharge}</span></div>
            <div class="text-slate-300">Current Sector: <span class="text-slate-200">${patrol.currentRoad}</span></div>
            <div class="text-slate-300">Vehicle Type: <span class="text-slate-200">${patrol.vehicleType}</span></div>
            <div class="text-slate-300">Fuel Level: <span class="text-emerald-400 font-bold">${patrol.fuelLevel}%</span></div>
            <div class="text-slate-400 text-[10px]">Direct Contact: ${patrol.phone}</div>
          </div>
        `);

        layerGroupRef.current?.addLayer(marker);
      });
    }
  }, [cameras, incidents, patrolUnits, showCameras, showIncidents, showPatrols]);

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
    <div id="zambia-tactical-map" class="relative w-full h-full min-h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Map HUD Bar */}
      <div class="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
        {/* City Quick Selector */}
        <div class="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 shadow-xl flex items-center gap-1">
          <div class="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-emerald-400 border-r border-slate-700 mr-1">
            <Compass class="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            <span>REGION:</span>
          </div>
          <div class="flex items-center gap-1 overflow-x-auto max-w-[500px] py-0.5">
            {cityList.map((city) => (
              <button
                key={city}
                id={`map-city-btn-${city.toLowerCase()}`}
                onClick={() => onSelectCity(city)}
                class={`px-2.5 py-1 text-xs rounded font-medium transition ${
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
      </div>

      {/* Layer Control Widget */}
      <div class="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">
        <div class="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-xl p-1 flex items-center gap-1">
          <button
            id="map-toggle-layer-panel"
            onClick={() => setActiveLayerPanel(!activeLayerPanel)}
            class={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition ${
              activeLayerPanel ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers class="w-3.5 h-3.5" />
            <span>Map Layers</span>
          </button>
        </div>

        {activeLayerPanel && (
          <div class="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl w-60 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div class="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
              <span>Active Overlays</span>
              <span class="text-[10px] text-emerald-400 font-mono">LIVE GPS</span>
            </div>

            <label class="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
              <span class="flex items-center gap-2">
                <Video class="w-3.5 h-3.5 text-emerald-400" />
                CCTV Video Feeds
              </span>
              <input
                type="checkbox"
                checked={showCameras}
                onChange={(e) => setShowCameras(e.target.checked)}
                class="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-800"
              />
            </label>

            <label class="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
              <span class="flex items-center gap-2">
                <ShieldAlert class="w-3.5 h-3.5 text-rose-400" />
                Road Incidents & Hazards
              </span>
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                class="rounded border-slate-700 text-rose-500 focus:ring-0 bg-slate-800"
              />
            </label>

            <label class="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
              <span class="flex items-center gap-2">
                <Radio class="w-3.5 h-3.5 text-cyan-400" />
                Patrol Fleet (RTSA/ZP)
              </span>
              <input
                type="checkbox"
                checked={showPatrols}
                onChange={(e) => setShowPatrols(e.target.checked)}
                class="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-800"
              />
            </label>
          </div>
        )}

        {/* Map Zoom Controls */}
        <div class="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-xl p-1 flex flex-col gap-1">
          <button
            id="map-btn-zoom-in"
            onClick={handleZoomIn}
            class="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Zoom In"
          >
            <ZoomIn class="w-4 h-4" />
          </button>
          <button
            id="map-btn-zoom-out"
            onClick={handleZoomOut}
            class="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            title="Zoom Out"
          >
            <ZoomOut class="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div ref={mapContainerRef} class="w-full h-full flex-1 z-0" />

      {/* Bottom Map Legend Bar */}
      <div class="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none flex items-center justify-between">
        <div class="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-xl pointer-events-auto flex items-center gap-4 text-xs font-mono text-slate-300">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/40"></span>
            <span>CCTV Camera Online</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>Active Incident</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span>
            <span>Police / RTSA Patrol Unit</span>
          </div>
        </div>

        <div class="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-xl pointer-events-auto text-[11px] font-mono text-slate-400">
          ZAMBIA ROAD NETWORK GEO-SURVEILLANCE • T2 / T3 / T4 CORRIDORS
        </div>
      </div>
    </div>
  );
}
