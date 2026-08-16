import { useState, useEffect } from 'react';
import {
  ViewMode,
  ZambianCity,
  CameraFeed,
  IncidentAlert,
  PatrolUnit,
  ViolationEvent,
  SystemMetrics,
  VehicleRecord
} from './types';
import { simulator } from './services/simulatorService';
import { soundManager } from './utils/sound';

import { Header } from './components/Header';
import { CommandDashboard } from './components/CommandDashboard';
import { MapView } from './components/MapView';
import { CctvGrid } from './components/CctvGrid';
import { VehicleDetectionView } from './components/VehicleDetectionView';
import { IncidentDispatchView } from './components/IncidentDispatchView';
import { PatrolUnitsView } from './components/PatrolUnitsView';
import { AnalyticsView } from './components/AnalyticsView';
import { LiveOffenceSceneView } from './components/LiveOffenceSceneView';
import { CameraStreamModal } from './components/CameraStreamModal';
import { CitationModal } from './components/CitationModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [currentCity, setCurrentCity] = useState<ZambianCity>('Lusaka');

  // Navigation History Stack (Back / Forward feature)
  const [history, setHistory] = useState<ViewMode[]>(['dashboard']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Simulator Data State
  const [cameras, setCameras] = useState<CameraFeed[]>(simulator.getCameras());
  const [incidents, setIncidents] = useState<IncidentAlert[]>(simulator.getIncidents());
  const [patrolUnits, setPatrolUnits] = useState<PatrolUnit[]>(simulator.getPatrolUnits());
  const [violations, setViolations] = useState<ViolationEvent[]>(simulator.getViolations());
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(simulator.getVehicles());
  const [metrics, setMetrics] = useState<SystemMetrics>(simulator.getMetrics());
  const [isSimRunning, setIsSimRunning] = useState<boolean>(simulator.getIsRunning());

  // Modals
  const [selectedCameraForStream, setSelectedCameraForStream] = useState<CameraFeed | null>(null);
  const [selectedViolationForCitation, setSelectedViolationForCitation] = useState<ViolationEvent | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Keyboard navigation shortcuts: Alt+Left / Backspace (when not in input) / Alt+Right
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if ((e.altKey && e.key === 'ArrowLeft') || (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey)) {
        if (historyIndex > 0) {
          e.preventDefault();
          handleGoBack();
        }
      } else if (e.altKey && e.key === 'ArrowRight') {
        if (historyIndex < history.length - 1) {
          e.preventDefault();
          handleGoForward();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Subscribe to real-time simulation updates
  useEffect(() => {
    const unsubViolations = simulator.onViolation((newVio) => {
      setViolations((prev) => [newVio, ...prev.slice(0, 199)]);
      if (newVio.speed > newVio.speedLimit) {
        soundManager.playSpeedingAlert();
      } else {
        soundManager.playScanBeep();
      }
    });

    const unsubIncidents = simulator.onIncident((newInc) => {
      setIncidents((prev) => [newInc, ...prev.slice(0, 49)]);
      if (newInc.severity === 'CRITICAL') {
        soundManager.playCriticalIncidentSiren();
      }
    });

    const unsubPatrols = simulator.onPatrols((units) => {
      setPatrolUnits(units);
    });

    const unsubCameras = simulator.onCameras((cams) => {
      setCameras(cams);
    });

    const unsubMetrics = simulator.onMetrics((m) => {
      setMetrics(m);
    });

    return () => {
      unsubViolations();
      unsubIncidents();
      unsubPatrols();
      unsubCameras();
      unsubMetrics();
    };
  }, []);

  const handleToggleSimulation = () => {
    const state = simulator.toggleSimulation();
    setIsSimRunning(state);
  };

  const handleTriggerEmergencySiren = () => {
    soundManager.playCriticalIncidentSiren();
    simulator.triggerManualEvent('COLLISION', currentCity);
    handleSelectView('dispatch');
  };

  const handleQuickSearchPlate = (plate: string) => {
    // lookup or ensure vehicle is loaded
    simulator.lookupVehicle(plate);
    setVehicles(simulator.getVehicles());
  };

  const handleVerifyIncident = (id: string, action: 'VERIFIED' | 'DISMISSED') => {
    simulator.verifyIncident(id, action);
    setIncidents(simulator.getIncidents());
  };

  const handleDispatchPatrol = (incidentId: string, patrolId: string, notes: string) => {
    simulator.dispatchPatrol(incidentId, patrolId, notes);
    setIncidents(simulator.getIncidents());
    setPatrolUnits(simulator.getPatrolUnits());
    setViolations(simulator.getViolations());
  };

  const handleSelectView = (view: ViewMode) => {
    if (view === 'settings') {
      setIsSettingsOpen(true);
      return;
    }

    if (view === currentView) return;

    // Push new view to history stack up to current index and advance
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(view);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setCurrentView(view);
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setCurrentView(history[prevIdx]);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setCurrentView(history[nextIdx]);
    }
  };

  // Helper map for view friendly display names
  const viewNames: Record<ViewMode, string> = {
    dashboard: 'Command Dashboard',
    scenes: 'Live Scene Cinema',
    map: 'Road Map',
    cctv: 'CCTV Matrix',
    vehicles: 'Vehicle Radar',
    plates: 'ALPR Plates',
    traffic: 'Traffic Monitor',
    incidents: 'Incidents Feed',
    dispatch: 'Dispatch Center',
    patrols: 'Patrol Units',
    analytics: 'Analytics',
    settings: 'Settings'
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  const previousViewName = canGoBack ? viewNames[history[historyIndex - 1]] : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Header with Back / Previous Button, Breadcrumb & 3-Dot ⋮ Menu */}
      <Header
        currentView={currentView}
        onSelectView={handleSelectView}
        currentCity={currentCity}
        onSelectCity={setCurrentCity}
        isSimRunning={isSimRunning}
        onToggleSim={handleToggleSimulation}
        onQuickSearchPlate={handleQuickSearchPlate}
        onTriggerEmergencySiren={handleTriggerEmergencySiren}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        previousViewName={previousViewName}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {/* Back / Previous breadcrumb bar for non-dashboard views */}
        {currentView !== 'dashboard' && (
          <div className="mb-3 flex items-center justify-between bg-slate-900/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <button
                id="btn-subview-back-button"
                onClick={handleGoBack}
                disabled={!canGoBack}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition ${
                  canGoBack
                    ? 'bg-slate-800 hover:bg-emerald-950/80 text-emerald-400 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700'
                    : 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
                title={canGoBack ? `Return to previous view: ${previousViewName}` : 'No previous view in history'}
              >
                <span className="font-bold">← Previous / Back</span>
                {previousViewName && (
                  <span className="hidden sm:inline text-slate-400 font-mono text-[11px]">
                    ({previousViewName})
                  </span>
                )}
              </button>

              <span className="text-slate-600 hidden sm:inline">•</span>

              <button
                id="btn-subview-home-dashboard"
                onClick={() => handleSelectView('dashboard')}
                className="text-slate-400 hover:text-slate-200 transition font-mono text-[11px] hidden sm:inline"
              >
                Return to Dashboard Overview
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Current: <span className="text-emerald-400 font-semibold">{viewNames[currentView]}</span>
            </div>
          </div>
        )}

        {/* VIEW 1: Command Dashboard (Default Split Overview) */}
        {currentView === 'dashboard' && (
          <CommandDashboard
            currentCity={currentCity}
            onSelectCity={setCurrentCity}
            cameras={cameras}
            incidents={incidents}
            patrolUnits={patrolUnits}
            violations={violations}
            metrics={metrics}
            onSelectCamera={(cam) => setSelectedCameraForStream(cam)}
            onSelectIncident={(inc) => {
              handleSelectView('dispatch');
            }}
            onSelectViolationForCitation={(vio) => setSelectedViolationForCitation(vio)}
            onSelectView={handleSelectView}
            onTriggerEvent={(type) => simulator.triggerManualEvent(type, currentCity)}
          />
        )}

        {/* VIEW 1.5: Live Scene & Offence Cinema (Specific Road Scenes & Live Offence Playback) */}
        {currentView === 'scenes' && (
          <LiveOffenceSceneView
            currentCity={currentCity}
            onSelectCity={setCurrentCity}
            onSelectViolationForCitation={(vio) => setSelectedViolationForCitation(vio)}
            onDispatchUnit={handleDispatchPatrol}
            patrolUnits={patrolUnits}
            cameras={cameras}
            violations={violations}
          />
        )}

        {/* VIEW 2: Zambian Road Map View */}
        {currentView === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
              <div>
                <h2 className="text-base font-bold text-slate-100 font-display">
                  Zambian Road Network Tactical GIS Map ({currentCity})
                </h2>
                <p className="text-xs text-slate-400">
                  Surveillance of arterial corridors: Great East Road (T4), Kafue Road (T2), Kitwe-Ndola Dual Carriageway (T3).
                </p>
              </div>
              <div className="text-xs font-mono text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                18 CAMERAS • {patrolUnits.length} SQUADS ACTIVE
              </div>
            </div>

            <div className="h-[680px] w-full">
              <MapView
                currentCity={currentCity}
                cameras={cameras}
                incidents={incidents}
                patrolUnits={patrolUnits}
                onSelectCity={setCurrentCity}
                onSelectCamera={(cam) => setSelectedCameraForStream(cam)}
                onSelectIncident={() => handleSelectView('dispatch')}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: CCTV Surveillance Matrix */}
        {currentView === 'cctv' && (
          <CctvGrid
            cameras={cameras}
            selectedCity={currentCity}
            onSelectCamera={(cam) => setSelectedCameraForStream(cam)}
          />
        )}

        {/* VIEW 4: Vehicle Detection & Plate OCR Explorer */}
        {(currentView === 'vehicles' || currentView === 'plates' || currentView === 'traffic') && (
          <VehicleDetectionView
            violations={violations}
            vehicles={vehicles}
            onSelectViolationForCitation={(vio) => setSelectedViolationForCitation(vio)}
          />
        )}

        {/* VIEW 5: Incident Center & Authorized Operator Dispatch */}
        {(currentView === 'incidents' || currentView === 'dispatch') && (
          <IncidentDispatchView
            incidents={incidents}
            patrolUnits={patrolUnits}
            cameras={cameras}
            onVerifyIncident={handleVerifyIncident}
            onDispatchUnit={handleDispatchPatrol}
            onSelectCamera={(cam) => setSelectedCameraForStream(cam)}
          />
        )}

        {/* VIEW 6: Patrol Fleet Tracking */}
        {currentView === 'patrols' && (
          <PatrolUnitsView patrolUnits={patrolUnits} currentCity={currentCity} />
        )}

        {/* VIEW 7: Traffic Safety Analytics */}
        {currentView === 'analytics' && (
          <AnalyticsView violations={violations} cameras={cameras} metrics={metrics} />
        )}
      </main>

      {/* MODALS */}
      {/* CCTV HUD Live Stream Modal */}
      {selectedCameraForStream && (
        <CameraStreamModal
          camera={selectedCameraForStream}
          recentViolations={violations}
          onClose={() => setSelectedCameraForStream(null)}
          onSelectViolation={(v) => setSelectedViolationForCitation(v)}
        />
      )}

      {/* Official RTSA Digital Citation Modal */}
      {selectedViolationForCitation && (
        <CitationModal
          violation={selectedViolationForCitation}
          onClose={() => setSelectedViolationForCitation(null)}
        />
      )}

      {/* System Settings & Ingestion Parameters Modal */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}
