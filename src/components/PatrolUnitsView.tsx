import { useState } from 'react';
import { PatrolUnit, ZambianCity } from '../types';
import {
  Radio,
  Car,
  Phone,
  Fuel,
  Shield,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send
} from 'lucide-react';

interface PatrolUnitsViewProps {
  patrolUnits: PatrolUnit[];
  currentCity: ZambianCity;
}

export function PatrolUnitsView({ patrolUnits, currentCity }: PatrolUnitsViewProps) {
  const [filterAgency, setFilterAgency] = useState<string>('ALL');
  const [radioPingSuccess, setRadioPingSuccess] = useState<string | null>(null);

  const filteredPatrols = patrolUnits.filter((p) => {
    if (filterAgency === 'ALL') return true;
    return p.agency === filterAgency;
  });

  const handleRadioPing = (callSign: string) => {
    setRadioPingSuccess(`Radio handshake sent to ${callSign} on frequency 154.250 MHz.`);
    setTimeout(() => setRadioPingSuccess(null), 4000);
  };

  const getStatusBadge = (status: PatrolUnit['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'EN_ROUTE':
        return 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse';
      case 'ON_SCENE':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div id="patrol-fleet-manager" class="space-y-4">
      {/* Header */}
      <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-100 flex items-center gap-2">
            <Radio class="w-5 h-5 text-cyan-400" />
            <span>Zambia Highway Patrol & RTSA Tactical Fleet Tracking</span>
          </h2>
          <p class="text-xs text-slate-400">
            Live GPS telemetry, status tracking, and VHF comms link for on-duty road enforcement squads.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <select
            id="patrol-agency-filter"
            value={filterAgency}
            onChange={(e) => setFilterAgency(e.target.value)}
            class="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
          >
            <option value="ALL">All Law Enforcement Agencies</option>
            <option value="RTSA">RTSA Highway Patrol</option>
            <option value="ZAMBIA_POLICE">Zambia Police Traffic</option>
            <option value="HIGHWAY_PATROL">National Highway Squad</option>
          </select>
        </div>
      </div>

      {radioPingSuccess && (
        <div class="bg-cyan-950 border border-cyan-700 text-cyan-200 p-3 rounded-xl text-xs flex items-center gap-2 font-mono shadow-lg animate-in fade-in">
          <Radio class="w-4 h-4 text-cyan-400" />
          <span>{radioPingSuccess}</span>
        </div>
      )}

      {/* Grid of Patrol Units */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatrols.map((unit) => {
          const isRtsa = unit.agency === 'RTSA';

          return (
            <div
              key={unit.id}
              id={`patrol-card-${unit.id.toLowerCase()}`}
              class="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 shadow-xl transition space-y-3 flex flex-col justify-between"
            >
              <div>
                {/* Card Top */}
                <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <div class="text-xs font-mono text-cyan-400 font-bold uppercase">{unit.agency.replace('_', ' ')}</div>
                    <div class="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{unit.callSign}</span>
                    </div>
                  </div>

                  <span
                    class={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getStatusBadge(
                      unit.status
                    )}`}
                  >
                    {unit.status}
                  </span>
                </div>

                {/* Info List */}
                <div class="space-y-2 mt-3 text-xs font-mono">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">OFFICER IN CHARGE:</span>
                    <span class="text-slate-200 font-bold">{unit.officerInCharge}</span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">ASSIGNED SECTOR:</span>
                    <span class="text-slate-200 truncate max-w-[170px]">{unit.currentRoad}</span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">STATION / CITY:</span>
                    <span class="text-slate-200">{unit.city}, Zambia</span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">VEHICLE CLASS:</span>
                    <span class="text-slate-200">{unit.vehicleType}</span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">FUEL LEVEL:</span>
                    <span class="text-emerald-400 font-bold flex items-center gap-1">
                      <Fuel class="w-3 h-3" />
                      {unit.fuelLevel}%
                    </span>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">DIRECT RADIO/PHONE:</span>
                    <span class="text-cyan-300 font-medium">{unit.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div class="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                <span class="text-[10px] font-mono text-slate-400">GPS Ping: {unit.lastUpdated}</span>

                <button
                  id={`btn-ping-unit-${unit.id.toLowerCase()}`}
                  onClick={() => handleRadioPing(unit.callSign)}
                  class="px-2.5 py-1 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1 border border-slate-700"
                >
                  <Send class="w-3 h-3" />
                  <span>Radio Ping</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
