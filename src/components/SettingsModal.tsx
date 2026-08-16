import { useState, FormEvent } from 'react';
import { Settings, X, Sliders, Shield, Database, Radio, Check, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [wsUrl, setWsUrl] = useState('ws://localhost:8000/ws/alerts');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.85);
  const [speedTolerance, setSpeedTolerance] = useState(5);
  const [rtspGateway, setRtspGateway] = useState('rtsp://edge-gateway.rtsa.gov.zm:554/live');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div
      id="system-settings-modal"
      class="fixed inset-0 z-[2500] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center text-emerald-400">
              <Settings class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-100">
                Command Center System & Edge Configuration
              </h3>
              <div class="text-xs text-slate-400 font-mono">
                RTSA Network Architecture & AI Ingestion Parameters
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        {saved && (
          <div class="bg-emerald-950 border border-emerald-700 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center gap-2 font-mono">
            <Check class="w-4 h-4 text-emerald-400" />
            <span>Configuration parameters synchronized to RTSA central cluster.</span>
          </div>
        )}

        <form onSubmit={handleSave} class="space-y-3.5 text-xs font-mono">
          {/* API Backend URL */}
          <div>
            <label class="block text-slate-400 mb-1">
              BACKEND API REST ENDPOINT:
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <span class="text-[10px] text-slate-500">Default: http://localhost:8000</span>
          </div>

          {/* WebSocket Alerts Endpoint */}
          <div>
            <label class="block text-slate-400 mb-1">
              LIVE WEBSOCKET STREAM URL:
            </label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <span class="text-[10px] text-slate-500">Endpoint: /ws/alerts</span>
          </div>

          {/* RTSP Stream Gateway */}
          <div>
            <label class="block text-slate-400 mb-1">
              AUTHORIZED RTSP VIDEO GATEWAY:
            </label>
            <input
              type="text"
              value={rtspGateway}
              onChange={(e) => setRtspGateway(e.target.value)}
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <span class="text-[10px] text-slate-500">Secure TLS Tunnel for Zambia CCTV Nodes</span>
          </div>

          {/* AI Confidence Threshold */}
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 mb-1">
                ALPR OCR THRESHOLD: {(confidenceThreshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.60"
                max="0.99"
                step="0.01"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                class="w-full accent-emerald-500 bg-slate-950 rounded"
              />
            </div>

            <div>
              <label class="block text-slate-400 mb-1">
                RADAR TOLERANCE: +{speedTolerance} km/h
              </label>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={speedTolerance}
                onChange={(e) => setSpeedTolerance(parseInt(e.target.value))}
                class="w-full accent-emerald-500 bg-slate-950 rounded"
              />
            </div>
          </div>

          {/* Buttons */}
          <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow-lg shadow-emerald-900/30"
            >
              Save System Parameters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
