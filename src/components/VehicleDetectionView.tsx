import { useState } from 'react';
import { ViolationEvent, VehicleRecord, ZambianCity } from '../types';
import {
  Car,
  Search,
  AlertOctagon,
  FileText,
  User,
  Shield,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

interface VehicleDetectionViewProps {
  violations: ViolationEvent[];
  vehicles: VehicleRecord[];
  onSelectViolationForCitation: (vio: ViolationEvent) => void;
}

export function VehicleDetectionView({
  violations,
  vehicles,
  onSelectViolationForCitation
}: VehicleDetectionViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedViolationFilter, setSelectedViolationFilter] = useState<string>('ALL');
  const [activeVehicleModal, setActiveVehicleModal] = useState<VehicleRecord | null>(null);

  // Filtered violations
  const filteredViolations = violations.filter((v) => {
    const matchesSearch =
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.road.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.vehicleDetails && v.vehicleDetails.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedViolationFilter === 'ALL' || v.violationType === selectedViolationFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div id="vehicle-detection-explorer" className="space-y-4">
      {/* Header & Search Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Car className="w-5 h-5 text-amber-400" />
              <span>Automated License Plate Recognition (ALPR) & Vehicle Registry</span>
            </h2>
            <p className="text-xs text-slate-400">
              Live OCR plate scanning across Zambian road corridors with automated RTSA National Database queries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-950 text-emerald-400 border border-slate-800 px-3 py-1.5 rounded-lg">
              {filteredViolations.length} Scans in Cycle
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="alpr-search-input"
              type="text"
              placeholder="Search number plate (e.g. ABC-1234, ZAM-5678), owner name, or corridor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              id="alpr-type-filter"
              value={selectedViolationFilter}
              onChange={(e) => setSelectedViolationFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="ALL">All Detection Types</option>
              <option value="Speeding">Speeding Only</option>
              <option value="Stolen Vehicle Detected">Stolen / Wanted Flags</option>
              <option value="Expired Road Tax">Expired Tax / Fitness</option>
              <option value="Reckless Driving">Reckless / Incident</option>
            </select>
          </div>
        </div>
      </div>

      {/* Detections Table / List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Plate OCR</th>
                <th className="py-3 px-4">Vehicle Model</th>
                <th className="py-3 px-4">Registered Owner</th>
                <th className="py-3 px-4">Velocity / Limit</th>
                <th className="py-3 px-4">Detection Type</th>
                <th className="py-3 px-4">Location & Corridor</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredViolations.map((v) => {
                const isSpeeding = v.speed > v.speedLimit;
                const isHotlist = v.violationType === 'Stolen Vehicle Detected';
                const hasExpiredTax = v.vehicleDetails?.roadTaxStatus === 'EXPIRED';

                return (
                  <tr
                    key={v.id}
                    id={`alpr-row-${v.id.toLowerCase()}`}
                    className="hover:bg-slate-800/50 transition duration-150 group"
                  >
                    {/* Plate */}
                    <td className="py-3 px-4 font-mono font-bold text-sm">
                      <span
                        className={`inline-block px-2.5 py-1 rounded border shadow-sm ${
                          isHotlist
                            ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                            : isSpeeding
                            ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                            : 'bg-slate-950 text-slate-200 border-slate-700'
                        }`}
                      >
                        {v.plateNumber}
                      </span>
                    </td>

                    {/* Vehicle */}
                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-medium text-slate-200">{v.vehicleDetails?.makeModel || 'Toyota Vehicle'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{v.vehicleDetails?.category || 'Sedan'} • {v.vehicleDetails?.color || 'Silver'}</div>
                    </td>

                    {/* Owner */}
                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-medium text-slate-200">{v.vehicleDetails?.ownerName || 'Motorist'}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />
                        <span>{v.vehicleDetails?.ownerPhone || '+260 97 ...'}</span>
                      </div>
                    </td>

                    {/* Velocity */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold text-sm ${
                            isSpeeding ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {v.speed} km/h
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Limit: {v.speedLimit} km/h</span>
                    </td>

                    {/* Violation Type */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                          isHotlist
                            ? 'bg-rose-950 text-rose-300 border-rose-700'
                            : isSpeeding
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-slate-950 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isHotlist && <AlertOctagon className="w-3 h-3 text-rose-400" />}
                        {v.violationType}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-slate-300">
                      <div className="text-xs text-slate-200">{v.road}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{v.city} • {v.location}</div>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {v.timestamp}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        id={`btn-view-owner-${v.id.toLowerCase()}`}
                        onClick={() => v.vehicleDetails && setActiveVehicleModal(v.vehicleDetails)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                        title="View Driver & RTSA Records"
                      >
                        Driver Info
                      </button>

                      <button
                        id={`btn-issue-notice-${v.id.toLowerCase()}`}
                        onClick={() => onSelectViolationForCitation(v)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Citation</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver / Vehicle Details Modal Drawer */}
      {activeVehicleModal && (
        <div className="fixed inset-0 z-[2500] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-400">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    RTSA Motor Vehicle Dossier
                  </h3>
                  <div className="text-xs text-slate-400 font-mono">
                    REG NUMBER: {activeVehicleModal.plateNumber}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveVehicleModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Vehicle Profile */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">MAKE & MODEL:</span>
                <span className="font-bold text-slate-200">{activeVehicleModal.makeModel}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">BODY / COLOR:</span>
                <span className="text-slate-200">{activeVehicleModal.color} ({activeVehicleModal.category})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">REGISTERED OWNER:</span>
                <span className="font-bold text-amber-300">{activeVehicleModal.ownerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">OWNER NRC NO:</span>
                <span className="text-slate-200">{activeVehicleModal.ownerNrc}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">CONTACT PHONE:</span>
                <span className="text-cyan-400">{activeVehicleModal.ownerPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PRIMARY CITY:</span>
                <span className="text-slate-200">{activeVehicleModal.registeredCity}, Zambia</span>
              </div>
            </div>

            {/* Statutory Compliance Cards */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Statutory Road Safety Status
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Road Tax */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">ROAD TAX</span>
                  <span
                    className={`font-bold font-mono text-[11px] ${
                      activeVehicleModal.roadTaxStatus === 'VALID' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {activeVehicleModal.roadTaxStatus}
                  </span>
                </div>

                {/* Fitness */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">RTSA FITNESS</span>
                  <span
                    className={`font-bold font-mono text-[11px] ${
                      activeVehicleModal.fitnessStatus === 'VALID' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {activeVehicleModal.fitnessStatus}
                  </span>
                </div>

                {/* Insurance */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">INSURANCE</span>
                  <span
                    className={`font-bold font-mono text-[11px] ${
                      activeVehicleModal.insuranceStatus === 'VALID' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {activeVehicleModal.insuranceStatus}
                  </span>
                </div>
              </div>
            </div>

            {activeVehicleModal.hotlistFlag && activeVehicleModal.hotlistFlag !== 'NONE' && (
              <div className="bg-rose-950/80 border border-rose-700 p-3 rounded-xl flex items-center gap-2.5 text-rose-200 text-xs">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                <div>
                  <span className="font-bold uppercase tracking-wide">NATIONAL CRIME / TRAFFIC HOTLIST FLAG:</span>
                  <div>Vehicle flagged as <strong>{activeVehicleModal.hotlistFlag}</strong> on Zambia Police central database.</div>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveVehicleModal(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 rounded-xl text-xs transition"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
