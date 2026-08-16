import { useState, useRef, useEffect } from 'react';
import { CameraFeed, ViolationEvent } from '../types';
import {
  X,
  Video,
  ShieldAlert,
  Sliders,
  Radio,
  Maximize2,
  RefreshCw,
  Eye,
  Camera,
  Activity,
  Compass,
  Zap
} from 'lucide-react';

interface CameraStreamModalProps {
  camera: CameraFeed | null;
  recentViolations: ViolationEvent[];
  onClose: () => void;
  onSelectViolation?: (vio: ViolationEvent) => void;
}

export function CameraStreamModal({
  camera,
  recentViolations,
  onClose,
  onSelectViolation
}: CameraStreamModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [ptzLocked, setPtzLocked] = useState(true);
  const [isThermal, setIsThermal] = useState(false);
  const [showAiBoxes, setShowAiBoxes] = useState(true);

  if (!camera) return null;

  const cameraViolations = recentViolations.filter((v) => v.cameraId === camera.id);

  return (
    <div
      id="cctv-hud-modal"
      className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{camera.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {camera.status} • {camera.resolution}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                {camera.city}, Zambia • {camera.road} • Bearing: {camera.bearing}
              </div>
            </div>
          </div>

          <button
            id="btn-close-cctv-hud"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 flex-1 overflow-y-auto">
          {/* Main Video Screen (2 Cols) */}
          <div className="lg:col-span-2 bg-slate-950 p-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* Live Video HUD Area */}
            <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center">
              {/* Simulated High-Res Road Video Image */}
              <img
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1000&auto=format&fit=crop&q=80"
                alt="Live Camera Feed"
                className={`w-full h-full object-cover transition-transform duration-200 ${
                  isThermal ? 'filter invert hue-rotate-180 contrast-150' : ''
                }`}
                style={{
                  transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`
                }}
              />

              {/* Animated AI Bounding Boxes */}
              {showAiBoxes && (
                <>
                  {/* Bounding Box 1 */}
                  <div className="absolute top-1/3 left-1/4 w-36 h-24 border-2 border-emerald-400 bg-emerald-500/10 rounded pointer-events-none animate-pulse">
                    <div className="absolute -top-5 left-0 bg-emerald-500 text-slate-950 font-mono font-bold text-[9px] px-1 rounded">
                      [CAR #104] 56 km/h • OK
                    </div>
                  </div>

                  {/* Bounding Box 2 - Speeding Alert */}
                  <div className="absolute top-1/2 right-1/4 w-44 h-28 border-2 border-rose-500 bg-rose-500/15 rounded pointer-events-none">
                    <div className="absolute -top-5 left-0 bg-rose-600 text-white font-mono font-bold text-[9px] px-1 rounded flex items-center gap-1">
                      <span>[ALPR: ZAM-5678] 92 km/h</span>
                      <span className="bg-white text-rose-600 px-0.5 rounded text-[8px]">VIOLATION</span>
                    </div>
                    <div className="absolute -bottom-4 right-0 bg-slate-900/90 text-rose-300 font-mono text-[9px] px-1 border border-rose-800">
                      Excess: +32 km/h
                    </div>
                  </div>
                </>
              )}

              {/* HUD OSD Layer */}
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-700 px-2.5 py-1 rounded text-[11px] font-mono text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>REC • RTSA EDGE VISION V2.4</span>
              </div>

              <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur border border-slate-700 px-2.5 py-1 rounded text-[11px] font-mono text-slate-300">
                {new Date().toLocaleTimeString()} • 30 FPS
              </div>

              {/* Center Targeting Radar */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-20 h-20 border border-emerald-500/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-400/40 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Camera PTZ & Optics Controls */}
            <div className="mt-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">OPTICAL ZOOM:</span>
                <button
                  id="btn-zoom-1x"
                  onClick={() => setZoomLevel(1)}
                  className={`px-2 py-1 text-xs rounded font-mono ${
                    zoomLevel === 1 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  1.0x
                </button>
                <button
                  id="btn-zoom-15x"
                  onClick={() => setZoomLevel(1.5)}
                  className={`px-2 py-1 text-xs rounded font-mono ${
                    zoomLevel === 1.5 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  1.5x
                </button>
                <button
                  id="btn-zoom-2x"
                  onClick={() => setZoomLevel(2)}
                  className={`px-2 py-1 text-xs rounded font-mono ${
                    zoomLevel === 2 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  2.0x
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-toggle-thermal"
                  onClick={() => setIsThermal(!isThermal)}
                  className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 border transition ${
                    isThermal
                      ? 'bg-amber-950 text-amber-300 border-amber-600'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Thermal Mode</span>
                </button>

                <button
                  id="btn-toggle-hud-boxes"
                  onClick={() => setShowAiBoxes(!showAiBoxes)}
                  className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 border transition ${
                    showAiBoxes
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>AI Overlay</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Telemetry & Recent Detections (1 Col) */}
          <div className="p-4 bg-slate-900/60 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Node Telemetry & Specs</span>
              </h3>

              <div className="space-y-2 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">CAMERA ID:</span>
                  <span className="text-emerald-400 font-bold">{camera.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RADAR VELOCITY:</span>
                  <span className="text-amber-400 font-bold">{camera.speedLimit} km/h Cap</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">LAT / LNG:</span>
                  <span className="text-slate-200">
                    {camera.lat.toFixed(4)}, {camera.lng.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DETECTIONS TODAY:</span>
                  <span className="text-cyan-400">{camera.detectedCountToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ALPR OCR ENGINE:</span>
                  <span className="text-emerald-300">YOLOv8 + LPRNet Active</span>
                </div>
              </div>
            </div>

            {/* Recent Camera Captures */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Recent Captures on this Node</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">LIVE FEED</span>
              </h3>

              <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-64">
                {cameraViolations.length === 0 ? (
                  <div className="text-xs text-slate-400 bg-slate-950 p-4 rounded-xl text-center">
                    No violations recorded on this camera in recent cycle. Traffic flowing within statutory limits.
                  </div>
                ) : (
                  cameraViolations.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => onSelectViolation && onSelectViolation(v)}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer transition flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-300 text-xs">{v.plateNumber}</span>
                          <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                            {v.speed} km/h
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{v.timestamp} • Limit {v.speedLimit} km/h</div>
                      </div>

                      <span className="text-xs font-bold text-emerald-400 font-mono">K{v.fineAmountZMW}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://www.google.com/maps/@${camera.lat},${camera.lng},16z/data=!5m1!1e1`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 font-mono"
              >
                <span>Google Map</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <button
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 rounded-xl text-xs transition"
              >
                Close HUD
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
