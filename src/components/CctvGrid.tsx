import React, { useEffect, useRef, useState } from 'react';
import { CameraFeed, ZambianCity } from '../types';
import { Video, ShieldCheck, Zap, Maximize2, RefreshCw, Sliders, AlertTriangle } from 'lucide-react';

interface CctvGridProps {
  cameras: CameraFeed[];
  selectedCity: ZambianCity;
  onSelectCamera: (camera: CameraFeed) => void;
}

// Canvas-based real-time computer vision stream emulator
function SimulatedCameraCanvas({
  camera,
  nightMode = false,
  showAiOverlay = true
}: {
  camera: CameraFeed;
  nightMode?: boolean;
  showAiOverlay?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let time = 0;

    // Simulated moving objects in lane
    const cars = [
      { id: 'CAR-01', x: -50, y: 70, speed: 2.2, color: '#38bdf8', plate: 'ABC-1234', isSpeeding: false, kmh: 58 },
      { id: 'SUV-02', x: 200, y: 110, speed: 3.4, color: '#f43f5e', plate: 'ZAM-5678', isSpeeding: true, kmh: 92 },
      { id: 'BUS-03', x: 380, y: 80, speed: 1.8, color: '#fbbf24', plate: 'LUS-9012', isSpeeding: false, kmh: 52 }
    ];

    const render = () => {
      time += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Draw Road Background
      ctx.fillStyle = nightMode ? '#030712' : '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Asphalt road lanes
      ctx.fillStyle = nightMode ? '#0a0f1d' : '#1e293b';
      ctx.fillRect(0, 45, width, 100);

      // Lane dividers
      ctx.strokeStyle = nightMode ? '#22c55e' : '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(0, 95);
      ctx.lineTo(width, 95);
      ctx.stroke();
      ctx.setLineDash([]);

      // Road shoulder
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 47);
      ctx.lineTo(width, 47);
      ctx.moveTo(0, 143);
      ctx.lineTo(width, 143);
      ctx.stroke();

      // 2. Draw Moving Vehicles
      cars.forEach((car) => {
        car.x += car.speed;
        if (car.x > width + 60) {
          car.x = -60;
          car.kmh = car.isSpeeding ? Math.floor(Math.random() * 30 + 85) : Math.floor(Math.random() * 20 + 45);
        }

        // Draw Vehicle Body
        ctx.fillStyle = car.color;
        ctx.shadowColor = car.color;
        ctx.shadowBlur = nightMode ? 8 : 2;
        ctx.fillRect(car.x, car.y - 12, 44, 24);
        ctx.shadowBlur = 0;

        // Vehicle windshield & roof
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(car.x + 10, car.y - 8, 20, 16);

        // Headlights / Taillights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(car.x + 40, car.y - 10, 4, 6);
        ctx.fillRect(car.x + 40, car.y + 4, 4, 6);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(car.x, car.y - 10, 3, 6);
        ctx.fillRect(car.x, car.y + 4, 3, 6);

        // 3. AI Computer Vision Overlay
        if (showAiOverlay) {
          // Bounding Box
          ctx.strokeStyle = car.isSpeeding ? '#ef4444' : '#10b981';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(car.x - 4, car.y - 18, 52, 36);

          // Corner tags
          ctx.fillStyle = car.isSpeeding ? '#ef4444' : '#10b981';
          ctx.fillRect(car.x - 4, car.y - 28, 52, 10);

          // Plate OCR text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7px "JetBrains Mono", monospace';
          ctx.fillText(`${car.plate}`, car.x - 2, car.y - 21);

          // Speed tag underneath
          ctx.fillStyle = car.isSpeeding ? '#ef4444' : '#38bdf8';
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillText(`${car.kmh} km/h`, car.x - 2, car.y + 26);
        }
      });

      // 4. Optical Camera HUD Telemetry
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(4, 4, width - 8, 18);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`CAM: ${camera.id} • ${camera.resolution}`, 8, 16);

      const timeStr = new Date().toLocaleTimeString();
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${timeStr}`, width - 70, 16);

      // Radar Crosshair in center
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 15, height / 2);
      ctx.lineTo(width / 2 + 15, height / 2);
      ctx.moveTo(width / 2, height / 2 - 15);
      ctx.lineTo(width / 2, height / 2 + 15);
      ctx.stroke();

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [camera, nightMode, showAiOverlay]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={180}
      className="w-full h-auto rounded-lg bg-slate-950 border border-slate-800 shadow-inner"
    />
  );
}

export function CctvGrid({ cameras, selectedCity, onSelectCamera }: CctvGridProps) {
  const [filterCity, setFilterCity] = useState<string>('ALL');
  const [nightVision, setNightVision] = useState(false);
  const [showAiTags, setShowAiTags] = useState(true);

  const displayedCameras = cameras.filter((cam) => {
    if (filterCity === 'ALL') return true;
    return cam.city === filterCity;
  });

  return (
    <div id="cctv-surveillance-matrix" className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-400" />
            <span>Zambia CCTV AI Surveillance Matrix</span>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
              {displayedCameras.length} Active Feeds
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time optical flow, Automated License Plate Recognition (ALPR), and radar velocity estimation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* City Filter */}
          <select
            id="cctv-city-filter"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Zambian Cities</option>
            <option value="Lusaka">Lusaka</option>
            <option value="Kitwe">Kitwe</option>
            <option value="Ndola">Ndola</option>
            <option value="Livingstone">Livingstone</option>
            <option value="Kabwe">Kabwe</option>
            <option value="Solwezi">Solwezi</option>
          </select>

          {/* AI Overlay toggle */}
          <button
            id="cctv-toggle-ai-boxes"
            onClick={() => setShowAiTags(!showAiTags)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border ${
              showAiTags
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AI Bounding Boxes: {showAiTags ? 'ON' : 'OFF'}</span>
          </button>

          {/* Night Mode toggle */}
          <button
            id="cctv-toggle-night-vision"
            onClick={() => setNightVision(!nightVision)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border ${
              nightVision
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>IR / Night Vision: {nightVision ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Grid Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCameras.map((camera) => (
          <div
            key={camera.id}
            id={`cctv-card-${camera.id.toLowerCase()}`}
            className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3.5 shadow-xl transition duration-200 group flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-200 truncate group-hover:text-emerald-400 transition">
                    {camera.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {camera.city} • {camera.road}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      camera.status === 'ONLINE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    {camera.status}
                  </span>
                </div>
              </div>

              {/* Video Stream Canvas */}
              <div className="relative overflow-hidden rounded-lg">
                <SimulatedCameraCanvas
                  camera={camera}
                  nightMode={nightVision}
                  showAiOverlay={showAiTags}
                />

                <button
                  id={`btn-maximize-cam-${camera.id.toLowerCase()}`}
                  onClick={() => onSelectCamera(camera)}
                  className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-md backdrop-blur border border-slate-700 transition"
                  title="Expand Camera Feed"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Camera Metrics & Stats */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">SPEED LIMIT</span>
                  <span className="font-bold text-amber-400">{camera.speedLimit} km/h</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SCANNED TODAY</span>
                  <span className="font-bold text-cyan-400">{camera.detectedCountToday}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">VIOLATIONS</span>
                  <span className={`font-bold ${camera.activeViolationsToday > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {camera.activeViolationsToday}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                FPS: {camera.fps} | PTZ: LOCK
              </span>
              <button
                id={`btn-inspect-cam-${camera.id.toLowerCase()}`}
                onClick={() => onSelectCamera(camera)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded text-xs font-medium transition flex items-center gap-1"
              >
                <span>Live Feed HUD</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
