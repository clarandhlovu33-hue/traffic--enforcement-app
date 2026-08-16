import { useState, useRef, useEffect, FormEvent } from 'react';
import { ViewMode, ZambianCity } from '../types';
import {
  MoreVertical,
  Map,
  Video,
  Car,
  FileDigit,
  TrafficCone,
  ShieldAlert,
  Radio,
  BarChart3,
  Building2,
  Settings,
  Volume2,
  VolumeX,
  Play,
  Pause,
  AlertOctagon,
  Search,
  CheckCircle,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { soundManager } from '../utils/sound';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  currentCity: ZambianCity;
  onSelectCity: (city: ZambianCity) => void;
  isSimRunning: boolean;
  onToggleSim: () => void;
  onQuickSearchPlate: (plate: string) => void;
  onTriggerEmergencySiren: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  previousViewName?: string;
}

export function Header({
  currentView,
  onSelectView,
  currentCity,
  onSelectCity,
  isSimRunning,
  onToggleSim,
  onQuickSearchPlate,
  onTriggerEmergencySiren,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  previousViewName
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundManager.setMuted(next);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onQuickSearchPlate(searchInput.trim());
      onSelectView('vehicles');
      setSearchInput('');
    }
  };

  const menuItems: {
    id: ViewMode;
    label: string;
    icon: any;
    color: string;
    description: string;
  }[] = [
    { id: 'dashboard', label: 'Command Dashboard', icon: Layers, color: 'text-cyan-400', description: 'Real-time overview & alert feed' },
    { id: 'scenes', label: 'Live Scene & Offence Cinema', icon: Video, color: 'text-rose-400', description: 'Specific road scenes & live offence playback' },
    { id: 'map', label: 'Zambian Road Map', icon: Map, color: 'text-emerald-400', description: 'Tactical GIS surviellance view' },
    { id: 'cctv', label: 'CCTV Cameras Matrix', icon: Video, color: 'text-blue-400', description: 'Live video streams & AI bounding boxes' },
    { id: 'vehicles', label: 'Vehicle Detection & Speed', icon: Car, color: 'text-amber-400', description: 'Radar velocity & vehicle classes' },
    { id: 'plates', label: 'Number Plate Recognition', icon: FileDigit, color: 'text-purple-400', description: 'ALPR OCR & RTSA Registry' },
    { id: 'traffic', label: 'Traffic Monitoring', icon: TrafficCone, color: 'text-orange-400', description: 'Corridor density & choke points' },
    { id: 'incidents', label: 'Incidents & Alerts', icon: ShieldAlert, color: 'text-rose-400', description: 'Collision & high-risk triage' },
    { id: 'dispatch', label: 'Authorized Dispatch', icon: Radio, color: 'text-indigo-400', description: 'Patrol unit assignment & orders' },
    { id: 'patrols', label: 'Live Patrol Units', icon: Activity, color: 'text-teal-400', description: 'Police & RTSA vehicle fleet' },
    { id: 'analytics', label: 'Traffic Statistics', icon: BarChart3, color: 'text-emerald-400', description: 'Infringements & safety analytics' },
    { id: 'settings', label: 'System Settings', icon: Settings, color: 'text-slate-400', description: 'Edge AI Simulator & RTSP config' }
  ];

  const cities: ZambianCity[] = [
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
    <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-[1500] px-4 py-2.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left Branding & Back / Forward Navigation */}
        <div className="flex items-center gap-2.5">
          {/* Back / Previous History Button */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              id="btn-nav-history-back"
              onClick={onGoBack}
              disabled={!canGoBack}
              className={`p-1.5 rounded-md flex items-center gap-1 transition text-xs font-medium ${
                canGoBack
                  ? 'text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 active:scale-95'
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title={canGoBack ? `Go Back to previous screen (${previousViewName || 'Previous'})` : 'No previous screen'}
              aria-label="Previous / Back screen"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xl:inline text-[11px] font-mono">Back</span>
            </button>

            {/* Forward History Button */}
            <button
              id="btn-nav-history-forward"
              onClick={onGoForward}
              disabled={!canGoForward}
              className={`p-1.5 rounded-md transition ${
                canGoForward
                  ? 'text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 active:scale-95'
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title={canGoForward ? 'Go forward to next screen' : 'No forward history'}
              aria-label="Forward screen"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div
            onClick={() => onSelectView('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-100 uppercase tracking-wide font-display">
                  RTSA TRAFFIC COMMAND
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  LIVE AI NET
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Zambian Road Safety & Automated Enforcement
              </div>
            </div>
          </div>

          {/* Quick View Nav Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 ml-4 pl-4 border-l border-slate-800">
            <button
              id="nav-tab-dashboard"
              onClick={() => onSelectView('dashboard')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                currentView === 'dashboard'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              id="nav-tab-scenes"
              onClick={() => onSelectView('scenes')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1 ${
                currentView === 'scenes'
                  ? 'bg-rose-950/90 text-rose-300 font-bold border border-rose-700'
                  : 'text-rose-400 hover:text-rose-200 hover:bg-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>Live Scene Offence</span>
            </button>
            <button
              id="nav-tab-map"
              onClick={() => onSelectView('map')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                currentView === 'map'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Road Map
            </button>
            <button
              id="nav-tab-cctv"
              onClick={() => onSelectView('cctv')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                currentView === 'cctv'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              CCTV Matrix
            </button>
            <button
              id="nav-tab-vehicles"
              onClick={() => onSelectView('vehicles')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                currentView === 'vehicles' || currentView === 'plates'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              ALPR OCR
            </button>
            <button
              id="nav-tab-dispatch"
              onClick={() => onSelectView('dispatch')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                currentView === 'dispatch' || currentView === 'incidents'
                  ? 'bg-slate-800 text-rose-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Dispatch Center
            </button>
            <button
              id="nav-tab-analytics"
              onClick={() => onSelectView('analytics')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                currentView === 'analytics'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Center Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="header-quick-plate-search"
            type="text"
            placeholder="Quick search plate (e.g. ABC-1234)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          />
        </form>

        {/* Right Action Icons & Three-Dot Menu */}
        <div className="flex items-center gap-2">
          {/* City Selector Pill */}
          <div ref={cityRef} className="relative">
            <button
              id="btn-header-city-dropdown"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentCity}</span>
            </button>

            {isCityDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-2xl z-[1600] space-y-0.5 animate-in fade-in duration-100">
                <div className="px-2 py-1 text-[10px] font-mono text-slate-400 font-bold uppercase border-b border-slate-800">
                  Select Zambian City
                </div>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      onSelectCity(city);
                      setIsCityDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      currentCity === city
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{city}</span>
                    {currentCity === city && <CheckCircle className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Simulator Toggle */}
          <button
            id="btn-toggle-simulator-header"
            onClick={onToggleSim}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition border ${
              isSimRunning
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-amber-950/80 text-amber-300 border-amber-700'
            }`}
            title="Toggle Live Edge AI Traffic Simulator"
          >
            {isSimRunning ? <Pause className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3 text-amber-400" />}
            <span className="hidden sm:inline">{isSimRunning ? 'SIM: RUNNING' : 'SIM: PAUSED'}</span>
          </button>

          {/* Audio Alert Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={toggleSound}
            className={`p-2 rounded-lg transition border ${
              soundMuted
                ? 'bg-slate-900 text-slate-500 border-slate-800'
                : 'bg-slate-900 text-emerald-400 border-slate-700 hover:bg-slate-800'
            }`}
            title={soundMuted ? 'Unmute Command Center Alerts' : 'Mute Command Center Audio'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Emergency Siren Broadcast */}
          <button
            id="btn-emergency-broadcast"
            onClick={onTriggerEmergencySiren}
            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-lg shadow-rose-900/40"
            title="Simulate Major Traffic Emergency"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Emergency Alert</span>
          </button>

          {/* 3-Dot ⋮ Menu (As requested in prompt section 2) */}
          <div ref={menuRef} className="relative">
            <button
              id="btn-three-dot-menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition"
              title="System Navigation Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Three-Dot Dropdown Panel */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-[1600] space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-100 font-display">
                        AI TRAFFIC COMMAND CENTER
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Surveillance & Enforcement Protocol
                      </div>
                    </div>
                    {canGoBack && (
                      <button
                        id="btn-menu-back-shortcut"
                        onClick={() => {
                          if (onGoBack) onGoBack();
                          setIsMenuOpen(false);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-emerald-950/80 text-emerald-400 border border-slate-700 hover:border-emerald-700 rounded-lg text-[10px] font-mono flex items-center gap-1 transition"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Previous</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="py-1 max-h-96 overflow-y-auto space-y-0.5 pr-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                      <button
                        key={item.id}
                        id={`menu-item-${item.id}`}
                        onClick={() => {
                          onSelectView(item.id);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center gap-3 ${
                          isActive
                            ? 'bg-slate-800 border border-emerald-500/50 text-white font-bold'
                            : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center ${item.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-medium text-slate-100 truncate">{item.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800 px-3 py-1 text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>RTSA SYS VERSION</span>
                  <span className="text-emerald-400">v2.4.0-PRO</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
