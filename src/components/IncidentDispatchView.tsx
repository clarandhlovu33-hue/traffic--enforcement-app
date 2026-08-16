import { useState, FormEvent } from 'react';
import { IncidentAlert, PatrolUnit, CameraFeed } from '../types';
import {
  ShieldAlert,
  Radio,
  CheckCircle2,
  XCircle,
  Car,
  AlertTriangle,
  UserCheck,
  Send,
  Camera,
  MapPin,
  Clock,
  Check
} from 'lucide-react';
import { soundManager } from '../utils/sound';

interface IncidentDispatchViewProps {
  incidents: IncidentAlert[];
  patrolUnits: PatrolUnit[];
  cameras: CameraFeed[];
  onVerifyIncident: (id: string, action: 'VERIFIED' | 'DISMISSED') => void;
  onDispatchUnit: (incidentId: string, patrolId: string, notes: string) => void;
  onSelectCamera: (camera: CameraFeed) => void;
}

export function IncidentDispatchView({
  incidents,
  patrolUnits,
  cameras,
  onVerifyIncident,
  onDispatchUnit,
  onSelectCamera
}: IncidentDispatchViewProps) {
  const [selectedIncident, setSelectedIncident] = useState<IncidentAlert | null>(
    incidents.length > 0 ? incidents[0] : null
  );
  const [selectedPatrolId, setSelectedPatrolId] = useState<string>('');
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  const activeIncidents = incidents.filter(
    (i) => i.status === 'NEW' || i.status === 'VERIFIED' || i.status === 'DISPATCHED'
  );

  const handleDispatch = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !selectedPatrolId) return;

    onDispatchUnit(selectedIncident.id, selectedPatrolId, operatorNotes);
    soundManager.playCriticalIncidentSiren();

    const patrol = patrolUnits.find((p) => p.id === selectedPatrolId);
    setDispatchSuccessMsg(
      `AUTHORIZED DISPATCH ISSUED: Unit ${patrol?.callSign || selectedPatrolId} dispatched to ${selectedIncident.location}.`
    );

    setTimeout(() => {
      setDispatchSuccessMsg(null);
    }, 5000);
  };

  const getSeverityBadge = (sev: IncidentAlert['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-700';
      case 'WARNING':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      default:
        return 'bg-cyan-950 text-cyan-300 border-cyan-700';
    }
  };

  const getStatusBadge = (status: IncidentAlert['status']) => {
    switch (status) {
      case 'NEW':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      case 'VERIFIED':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'DISPATCHED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'RESOLVED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Find camera for selected incident
  const linkedCamera = cameras.find((c) => c.id === selectedIncident?.cameraId);

  // Available patrol units in city
  const cityPatrols = patrolUnits.filter((p) => !selectedIncident || p.city === selectedIncident.city || p.status === 'AVAILABLE');

  return (
    <div id="incident-dispatch-center" class="space-y-4">
      {/* Top Banner */}
      <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert class="w-5 h-5 text-rose-400" />
            <span>Authorized Incident Triage & Patrol Dispatch Protocol</span>
          </h2>
          <p class="text-xs text-slate-400">
            Two-stage Human-in-the-Loop AI verification for RTSA and Zambia Police tactical response.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-mono bg-rose-950 text-rose-300 border border-rose-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>{activeIncidents.length} Active Incident Protocols</span>
          </span>
        </div>
      </div>

      {dispatchSuccessMsg && (
        <div class="bg-emerald-950 border border-emerald-700 text-emerald-200 p-3 rounded-xl text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <Check class="w-4 h-4 text-emerald-400 shrink-0" />
          <span class="font-mono font-medium">{dispatchSuccessMsg}</span>
        </div>
      )}

      {/* Main 2-Column Incident Review Workspace */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Incident Queue List (4 Cols) */}
        <div class="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col space-y-2.5 max-h-[700px]">
          <div class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between px-1">
            <span>Incoming Detection Queue</span>
            <span class="text-[10px] font-mono text-slate-400">PRIORITY SORTED</span>
          </div>

          <div class="space-y-2 overflow-y-auto pr-1 flex-1">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;

              return (
                <div
                  key={inc.id}
                  id={`incident-item-${inc.id.toLowerCase()}`}
                  onClick={() => setSelectedIncident(inc)}
                  class={`p-3 rounded-xl border transition cursor-pointer text-xs space-y-1.5 ${
                    isSelected
                      ? 'bg-slate-800 border-rose-500/80 shadow-lg ring-1 ring-rose-500/30'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div class="flex items-center justify-between gap-1">
                    <span class="font-bold text-slate-200 truncate">{inc.title}</span>
                    <span
                      class={`px-1.5 py-0.5 rounded text-[10px] font-mono border font-medium ${getStatusBadge(
                        inc.status
                      )}`}
                    >
                      {inc.status}
                    </span>
                  </div>

                  <div class="text-slate-400 flex items-center gap-1 text-[11px]">
                    <MapPin class="w-3 h-3 text-slate-500" />
                    <span class="truncate">{inc.location} ({inc.city})</span>
                  </div>

                  <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>{inc.timestamp}</span>
                    <span class="text-emerald-400">AI Confidence: {(inc.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Incident Detail & Operator Review (7 Cols) */}
        <div class="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          {selectedIncident ? (
            <>
              {/* Header */}
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span
                      class={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(
                        selectedIncident.severity
                      )}`}
                    >
                      {selectedIncident.severity}
                    </span>
                    <span class="text-xs font-mono text-slate-400">ID: {selectedIncident.id}</span>
                  </div>
                  <h3 class="text-base font-bold text-slate-100 mt-1">{selectedIncident.title}</h3>
                </div>

                <div class="flex items-center gap-2">
                  {linkedCamera && (
                    <button
                      id="btn-view-incident-cam"
                      onClick={() => onSelectCamera(linkedCamera)}
                      class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
                    >
                      <Camera class="w-3.5 h-3.5 text-emerald-400" />
                      <span>View Cam {selectedIncident.cameraId}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Snapshot & Telemetry Grid */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Evidence Image */}
                <div class="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 aspect-video">
                  <img
                    src={selectedIncident.evidenceSnapshot}
                    alt="Incident Evidence"
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur text-[10px] font-mono text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                    EVIDENCE FRAME • {selectedIncident.timestamp}
                  </div>
                </div>

                {/* Evidence Data Box */}
                <div class="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
                  <div>
                    <span class="text-slate-400 block text-[10px]">ROAD CORRIDOR:</span>
                    <span class="text-slate-200 font-bold">{selectedIncident.road}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[10px]">DETECTION LOCATION:</span>
                    <span class="text-slate-200">{selectedIncident.location}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[10px]">SURVEILLANCE NODE:</span>
                    <span class="text-emerald-400">{selectedIncident.cameraId}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[10px]">CONFIDENCE SCORE:</span>
                    <span class="text-cyan-400 font-bold">
                      {(selectedIncident.confidenceScore * 100).toFixed(1)}% Automated Agreement
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div class="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                <span class="text-[10px] font-mono text-slate-400 block font-bold uppercase mb-1">
                  AI Computer Vision Event Analysis:
                </span>
                {selectedIncident.description}
              </div>

              {/* Operator Verification Actions (Stage 1) */}
              <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Stage 1: Authorized Operator Evidence Review</span>
                  <span class="text-[10px] text-slate-400 font-mono">STATUS: {selectedIncident.status}</span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    id="btn-verify-incident"
                    onClick={() => onVerifyIncident(selectedIncident.id, 'VERIFIED')}
                    disabled={selectedIncident.status === 'VERIFIED' || selectedIncident.status === 'DISPATCHED'}
                    class="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <CheckCircle2 class="w-4 h-4" />
                    <span>Confirm & Verify Threat</span>
                  </button>

                  <button
                    id="btn-dismiss-incident"
                    onClick={() => onVerifyIncident(selectedIncident.id, 'DISMISSED')}
                    disabled={selectedIncident.status === 'DISMISSED'}
                    class="py-2 px-4 bg-slate-800 hover:bg-rose-900/70 text-slate-300 hover:text-rose-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <XCircle class="w-4 h-4" />
                    <span>Dismiss False Alarm</span>
                  </button>
                </div>
              </div>

              {/* Authorized Dispatch Section (Stage 2) */}
              <form onSubmit={handleDispatch} class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span class="flex items-center gap-1.5 text-rose-400">
                    <Radio class="w-4 h-4" />
                    <span>Stage 2: Tactical Patrol Intercept & Dispatch</span>
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">POLICE / RTSA VHF CHANNEL</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-mono text-slate-400 mb-1">
                      ASSIGN ACTIVE PATROL UNIT:
                    </label>
                    <select
                      id="dispatch-select-unit"
                      required
                      value={selectedPatrolId}
                      onChange={(e) => setSelectedPatrolId(e.target.value)}
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                    >
                      <option value="">Select Nearest Unit...</option>
                      {cityPatrols.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.callSign} ({unit.agency}) - {unit.officerInCharge} [{unit.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label class="block text-[11px] font-mono text-slate-400 mb-1">
                      OPERATOR RADIO DIRECTIVES / NOTES:
                    </label>
                    <input
                      id="dispatch-operator-notes"
                      type="text"
                      placeholder="e.g. Intercept vehicle at roundabout, proceed with caution"
                      value={operatorNotes}
                      onChange={(e) => setOperatorNotes(e.target.value)}
                      class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <button
                  id="btn-execute-dispatch"
                  type="submit"
                  disabled={!selectedPatrolId}
                  class="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-rose-900/30"
                >
                  <Send class="w-4 h-4" />
                  <span>Broadcast Authorized Police/RTSA Dispatch Order</span>
                </button>
              </form>
            </>
          ) : (
            <div class="text-center py-12 text-slate-400 text-xs">
              No incident selected. Choose an alert from the queue to review and dispatch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
