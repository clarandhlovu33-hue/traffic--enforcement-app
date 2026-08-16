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
    setCurrentView('dispatch');
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
    } else {
      setCurrentView(view);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Header with 3-Dot ⋮ Menu */}
      <Header
        currentView={currentView}
        onSelectView={handleSelectView}
        currentCity={currentCity}
        onSelectCity={setCurrentCity}
        isSimRunning={isSimRunning}
        onToggleSim={handleToggleSimulation}
        onQuickSearchPlate={handleQuickSearchPlate}
        onTriggerEmergencySiren={handleTriggerEmergencySiren}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
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
              setCurrentView('dispatch');
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
                onSelectIncident={() => setCurrentView('dispatch')}
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
