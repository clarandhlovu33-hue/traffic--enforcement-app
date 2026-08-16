import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { ViolationEvent, CameraFeed, SystemMetrics } from '../types';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Banknote, MapPin } from 'lucide-react';

interface AnalyticsViewProps {
  violations: ViolationEvent[];
  cameras: CameraFeed[];
  metrics: SystemMetrics;
}

export function AnalyticsView({ violations, cameras, metrics }: AnalyticsViewProps) {
  // 1. Hourly violation pattern
  const hourlyData = [
    { hour: '06:00', violations: 12, avgSpeed: 52 },
    { hour: '08:00', violations: 48, avgSpeed: 64 },
    { hour: '10:00', violations: 31, avgSpeed: 59 },
    { hour: '12:00', violations: 26, avgSpeed: 57 },
    { hour: '14:00', violations: 38, avgSpeed: 62 },
    { hour: '16:00', violations: 56, avgSpeed: 68 },
    { hour: '18:00', violations: 74, avgSpeed: 75 },
    { hour: '20:00', violations: 62, avgSpeed: 78 },
    { hour: '22:00', violations: 35, avgSpeed: 71 }
  ];

  // 2. High Risk Corridors
  const corridorData = [
    { name: 'Kitwe-Ndola T3', violations: 64, limit: 100 },
    { name: 'Kafue Rd T2', violations: 42, limit: 70 },
    { name: 'Great East Rd T4', violations: 38, limit: 60 },
    { name: 'Great North Rd T2', violations: 31, limit: 60 },
    { name: 'Solwezi T5', violations: 27, limit: 70 },
    { name: 'Cairo Rd (CBD)', violations: 19, limit: 50 }
  ];

  // 3. Violation Type Breakdown
  const typeDistribution = [
    { name: 'Speeding Infringements', value: 68, color: '#f43f5e' },
    { name: 'Expired Road Tax / Fitness', value: 18, color: '#fbbf24' },
    { name: 'Stolen / Hotlist Matches', value: 8, color: '#818cf8' },
    { name: 'Lane / Red Light Hazard', value: 6, color: '#38bdf8' }
  ];

  const totalFinesCalculated = violations.reduce((sum, v) => sum + (v.fineAmountZMW || 450), 0);

  return (
    <div id="traffic-analytics-dashboard" className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Zambia National Traffic Safety & Enforcement Analytics</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated intelligence on traffic velocity distributions, high-risk arterial corridors, and statutory road safety compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span>PERIOD: TODAY'S 24H SURVEILLANCE CYCLE</span>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="text-xs font-mono text-slate-400">TOTAL SCANNED VEHICLES</div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
            {metrics.totalDetectionsToday.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across 18 national camera nodes</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="text-xs font-mono text-slate-400">SPEEDING RATE OVER LIMIT</div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
            {violations.length} <span className="text-xs font-normal text-slate-400">captures</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Avg vehicle speed: {metrics.averageSpeedKmh} km/h</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="text-xs font-mono text-slate-400">ESTIMATED CITATION LEVY</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            ZMW {totalFinesCalculated.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Statutory fines payable to RTSA</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="text-xs font-mono text-slate-400">HOTLIST / STOLEN HITS</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {metrics.totalHotlistHits} <span className="text-xs font-normal text-slate-400">flags</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Instant police dispatch triggered</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Traffic & Velocity Trend */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span>Hourly Violation Count & Average Velocity</span>
            <span className="text-[10px] text-slate-400 font-mono">24H TIMELINE</span>
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="violations" stroke="#f43f5e" strokeWidth={2} name="Violations Count" />
                <Line type="monotone" dataKey="avgSpeed" stroke="#38bdf8" strokeWidth={2} name="Avg Speed (km/h)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top High-Risk Corridors */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span>High-Risk Zambian Transport Corridors</span>
            <span className="text-[10px] text-slate-400 font-mono">TOTAL INFRACTIONS</span>
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={corridorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="violations" fill="#10b981" radius={[0, 4, 4, 0]} name="Violations Recorded" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violation Type Pie Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Offense Classification Breakdown
          </h3>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statutory Enforcement Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 text-xs">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Zambia Road Traffic Act Compliance Report
          </h3>

          <div className="space-y-2.5 font-mono text-slate-300">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-slate-400">PRIMARY SPEED COMPLIANCE:</span>
              <span className="text-emerald-400 font-bold">86.4% of vehicles within statutory limit</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-slate-400">RTSA ROAD TAX COMPLIANCE:</span>
              <span className="text-cyan-400 font-bold">92.1% valid tax certificates</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-slate-400">AUTOMATED CITATION DELIVERY:</span>
              <span className="text-amber-400 font-bold">SMS / Digital Dispatch Ready</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between">
              <span className="text-slate-400">SURVEILLANCE UPTIME:</span>
              <span className="text-emerald-400 font-bold">99.8% across 18 edge CCTV nodes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
