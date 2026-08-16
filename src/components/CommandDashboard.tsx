import { useState } from 'react';
import {
  ViolationEvent,
  IncidentAlert,
  PatrolUnit,
  CameraFeed,
  SystemMetrics,
  ZambianCity,
  ViewMode
} from '../types';
import { MapView } from './MapView';
import {
  ShieldAlert,
  Car,
  Video,
  Radio,
  BarChart3,
  AlertTriangle,
  ArrowUpRight,
  Maximize2,
  FileText,
  Activity,
  Flame,
  Zap,
  Send
} from 'lucide-react';

interface CommandDashboardProps {
  currentCity: ZambianCity;
  onSelectCity: (city: ZambianCity) => void;
  cameras: CameraFeed[];
  incidents: IncidentAlert[];
  patrolUnits: PatrolUnit[];
  violations: ViolationEvent[];
  metrics: SystemMetrics;
  onSelectCamera: (cam: CameraFeed) => void;
  onSelectIncident: (inc: IncidentAlert) => void;
  onSelectViolationForCitation: (vio: ViolationEvent) => void;
  onSelectView: (view: ViewMode) => void;
  onTriggerEvent: (type: 'SPEEDING' | 'STOLEN' | 'COLLISION' | 'STALLED_TRUCK') => void;
}

export function CommandDashboard({
  currentCity,
  onSelectCity,
  cameras,
  incidents,
  patrolUnits,
  violations,
  metrics,
  onSelectCamera,
  onSelectIncident,
  onSelectViolationForCitation,
  onSelectView,
  onTriggerEvent
}: CommandDashboardProps) {
  const [filterCityOnly, setFilterCityOnly] = useState(false);

  const displayedViolations = filterCityOnly
    ? violations.filter((v) => v.city === currentCity)
    : violations;

  const displayedIncidents = filterCityOnly
    ? incidents.filter((i) => i.city === currentCity)
    : incidents;

  return (
    <div id="command-dashboard-view" class="space-y-4">
      {/* Top Quick Metrics Ribbon */}
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1 */}
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <div class="text-[10px] font-mono text-slate-400 uppercase">Total Scanned</div>
          <div class="text-xl font-extrabold text-cyan-400 font-mono mt-0.5">
            {metrics.totalDetectionsToday.toLocaleString()}
          </div>
          <div class="text-[10px] text-slate-400">All Zambian corridors</div>
        </div>

        {/* Metric 2 */}
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <div class="text-[10px] font-mono text-slate-400 uppercase">Speeding Hits</div>
          <div class="text-xl font-extrabold text-rose-400 font-mono mt-0.5">
            {metrics.totalSpeedViolations}
          </div>
          <div class="text-[10px] text-slate-400">Above statutory limits</div>
        </div>

        {/* Metric 3 */}
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <div class="text-[10px] font-mono text-slate-400 uppercase">Hotlist / Stolen</div>
          <div class="text-xl font-extrabold text-amber-400 font-mono mt-0.5">
            {metrics.totalHotlistHits}
          </div>
          <div class="text-[10px] text-slate-400">ZP Interpol flag matches</div>
        </div>

        {/* Metric 4 */}
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <div class="text-[10px] font-mono text-slate-400 uppercase">Active Incidents</div>
          <div class="text-xl font-extrabold text-indigo-400 font-mono mt-0.5">
            {incidents.filter((i) => i.status === 'NEW' || i.status === 'VERIFIED').length}
          </div>
          <div class="text-[10px] text-slate-400">Awaiting dispatch</div>
        </div>

        {/* Metric 5 */}
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <div class="text-[10px] font-mono text-slate-400 uppercase">Patrol Units</div>
          <div class="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
            {metrics.activePatrols} / {patrolUnits.length}
          </div>
          <div class="text-[10px] text-slate-400">On-duty field cruisers</div>
        </div>

        {/* Metric 6 */}
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <div class="text-[10px] font-mono text-slate-400 uppercase">Edge AI Nodes</div>
          <div class="text-xl font-extrabold text-teal-400 font-mono mt-0.5">
            {metrics.onlineCameras} / {metrics.totalCameras}
          </div>
          <div class="text-[10px] text-slate-400">{metrics.networkLatencyMs}ms edge ping</div>
        </div>
      </div>

      {/* Live Road Scene & Offence Cinema Promo/Selector Banner */}
      <div class="bg-gradient-to-r from-rose-950/40 via-slate-900/90 to-slate-900/90 border border-rose-900/40 rounded-xl p-3.5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <Video class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-bold text-rose-200 uppercase tracking-wide flex items-center gap-2">
              <span>Interactive Scene & Live Offence Cinema</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                NEW 🎬
              </span>
            </div>
            <div class="text-xs text-slate-300">
              Select or place specific Zambian arterial scenes (Arcades Roundabout, Kafue Flyover, Kitwe Dual Carriageway) to observe live speeding, red-light runs, and radar hits in real-time.
            </div>
          </div>
        </div>

        <button
          id="btn-dashboard-open-scene-cinema"
          onClick={() => onSelectView('scenes')}
          class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-rose-900/30"
        >
          <span>Open Live Scene Cinema</span>
          <ArrowUpRight class="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Simulator Quick Trigger Action Bar */}
      <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-2.5">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span class="text-xs font-bold text-slate-200 font-mono">
            EDGE SIMULATOR QUICK INJECTOR ({currentCity}):
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            id="btn-quick-inject-speeding"
            onClick={() => onTriggerEvent('SPEEDING')}
            class="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-rose-200 border border-slate-700 hover:border-rose-600 rounded-lg text-xs font-mono font-medium transition"
          >
            ⚡ Inject Speeding Car
          </button>

          <button
            id="btn-quick-inject-stolen"
            onClick={() => onTriggerEvent('STOLEN')}
            class="px-2.5 py-1 bg-slate-800 hover:bg-amber-900/60 text-slate-200 hover:text-amber-200 border border-slate-700 hover:border-amber-600 rounded-lg text-xs font-mono font-medium transition"
          >
            🚨 Stolen Plate Hit (BCA-8419)
          </button>

          <button
            id="btn-quick-inject-collision"
            onClick={() => onTriggerEvent('COLLISION')}
            class="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-rose-200 border border-slate-700 hover:border-rose-600 rounded-lg text-xs font-mono font-medium transition"
          >
            💥 Collision Hazard
          </button>

          <button
            id="btn-quick-inject-stalled"
            onClick={() => onTriggerEvent('STALLED_TRUCK')}
            class="px-2.5 py-1 bg-slate-800 hover:bg-cyan-900/60 text-slate-200 hover:text-cyan-200 border border-slate-700 hover:border-cyan-600 rounded-lg text-xs font-mono font-medium transition"
          >
            🚧 Stalled Lorry
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Tactical Map & CCTV Previews (7 Cols) */}
        <div class="lg:col-span-7 space-y-4">
          {/* Tactical Map Container */}
          <div class="h-[460px] relative">
            <MapView
              currentCity={currentCity}
              cameras={cameras}
              incidents={incidents}
              patrolUnits={patrolUnits}
              onSelectCity={onSelectCity}
              onSelectCamera={onSelectCamera}
              onSelectIncident={onSelectIncident}
            />
          </div>

          {/* Active CCTV Camera Nodes Strip */}
          <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Video class="w-4 h-4 text-emerald-400" />
                <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Surveillance Nodes in {currentCity}
                </h3>
              </div>

              <button
                onClick={() => onSelectView('cctv')}
                class="text-xs text-emerald-400 hover:underline font-mono flex items-center gap-1"
              >
                <span>Expand Full CCTV Matrix</span>
                <ArrowUpRight class="w-3.5 h-3.5" />
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {cameras
                .filter((c) => c.city === currentCity || cameras.indexOf(c) < 3)
                .slice(0, 3)
                .map((cam) => (
                  <div
                    key={cam.id}
                    onClick={() => onSelectCamera(cam)}
                    class="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl cursor-pointer transition space-y-1.5 group"
                  >
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-bold text-slate-200 truncate group-hover:text-emerald-400">
                        {cam.id}
                      </span>
                      <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {cam.speedLimit} km/h
                      </span>
                    </div>

                    <div class="text-[11px] text-slate-400 truncate">{cam.road}</div>

                    <div class="text-[10px] font-mono text-cyan-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>Detections: {cam.detectedCountToday}</span>
                      <span class="text-rose-400">Vio: {cam.activeViolationsToday}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Side: Live AI Alert Feed & Recent Speed Captures (5 Cols) */}
        <div class="lg:col-span-5 space-y-4">
          {/* Live Alert Feed (WebSocket simulator stream) */}
          <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-[570px]">
            {/* Header */}
            <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <h3 class="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Activity class="w-4 h-4 text-rose-400" />
                  <span>Live AI Alert Stream</span>
                  <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                </h3>
                <p class="text-[11px] text-slate-400">
                  Instantaneous plate OCR, radar speed velocity & hotlist audits.
                </p>
              </div>

              <button
                onClick={() => setFilterCityOnly(!filterCityOnly)}
                class={`px-2 py-1 rounded text-[10px] font-mono font-medium border transition ${
                  filterCityOnly
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {filterCityOnly ? `City: ${currentCity}` : 'All Cities'}
              </button>
            </div>

            {/* Scrollable Feed List */}
            <div id="live-alert-feed-list" class="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {displayedViolations.length === 0 ? (
                <div class="text-xs text-slate-400 text-center py-12">
                  Waiting for incoming road sensor telemetry...
                </div>
              ) : (
                displayedViolations.map((v) => {
                  const isSpeeding = v.speed > v.speedLimit;
                  const isHotlist = v.violationType === 'Stolen Vehicle Detected';

                  return (
                    <div
                      key={v.id}
                      id={`feed-entry-${v.id.toLowerCase()}`}
                      class={`p-3 rounded-xl border text-xs space-y-2 transition ${
                        isHotlist
                          ? 'bg-rose-950/40 border-rose-600/80 shadow-md'
                          : isSpeeding
                          ? 'bg-slate-950 border-rose-500/40 hover:border-rose-400'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="font-mono font-bold text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-amber-300">
                            {v.plateNumber}
                          </span>
                          <span
                            class={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              isHotlist
                                ? 'bg-rose-600 text-white'
                                : isSpeeding
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {isHotlist ? '🚨 STOLEN FLAG' : isSpeeding ? 'SPEEDING' : 'NORMAL'}
                          </span>
                        </div>

                        <span class="text-[11px] font-mono text-slate-400">{v.timestamp}</span>
                      </div>

                      {/* Velocity and Limit */}
                      <div class="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                        <div>
                          <span class="text-slate-400 block text-[10px]">RADAR SPEED:</span>
                          <span
                            class={`font-bold ${
                              isSpeeding ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {v.speed} km/h
                          </span>
                        </div>
                        <div>
                          <span class="text-slate-400 block text-[10px]">SPEED LIMIT:</span>
                          <span class="text-slate-200">{v.speedLimit} km/h</span>
                        </div>
                      </div>

                      {/* Road and City */}
                      <div class="text-[11px] text-slate-300 truncate">
                        📍 {v.road} • <span class="text-slate-400">{v.city}</span>
                      </div>

                      {/* Action buttons */}
                      <div class="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span class="text-[10px] font-mono text-slate-400">
                          {v.vehicleDetails?.makeModel || 'Motorist'}
                        </span>

                        <div class="flex items-center gap-1.5">
                          {isSpeeding && (
                            <button
                              id={`btn-feed-notice-${v.id.toLowerCase()}`}
                              onClick={() => onSelectViolationForCitation(v)}
                              class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition flex items-center gap-1"
                            >
                              <FileText class="w-3 h-3" />
                              <span>Notice</span>
                            </button>
                          )}

                          {isHotlist && (
                            <button
                              onClick={() => onSelectView('dispatch')}
                              class="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold transition flex items-center gap-1 animate-pulse"
                            >
                              <Send class="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Patrol Response Summary */}
          <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
                <Radio class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-bold text-slate-200">Patrol Fleet Response Ready</div>
                <div class="text-[11px] font-mono text-slate-400">
                  {patrolUnits.filter((p) => p.status === 'AVAILABLE').length} units available for dispatch
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectView('dispatch')}
              class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition border border-slate-700"
            >
              Open Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
