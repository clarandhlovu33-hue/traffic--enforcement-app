import { useState } from 'react';
import { ViolationEvent } from '../types';
import {
  FileText,
  X,
  Printer,
  Download,
  Send,
  ShieldCheck,
  QrCode,
  Check,
  AlertCircle
} from 'lucide-react';

interface CitationModalProps {
  violation: ViolationEvent | null;
  onClose: () => void;
}

export function CitationModal({ violation, onClose }: CitationModalProps) {
  const [smsSent, setSmsSent] = useState(false);

  if (!violation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendSms = () => {
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 4000);
  };

  const noticeNumber = `RTSA-INF-${violation.id.replace('VIO-', '')}`;

  return (
    <div
      id="citation-notice-modal"
      class="fixed inset-0 z-[2600] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Actions */}
        <div class="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <FileText class="w-5 h-5 text-emerald-400" />
            <span class="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
              Official RTSA Traffic Infringement Notice
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              onClick={handlePrint}
              class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Notice Sheet */}
        <div class="p-6 overflow-y-auto space-y-4 text-xs font-sans bg-slate-950">
          {/* Official Header */}
          <div class="text-center border-b border-slate-800 pb-4 space-y-1">
            <div class="text-[11px] font-bold font-mono text-emerald-400 tracking-widest uppercase">
              REPUBLIC OF ZAMBIA
            </div>
            <div class="text-base font-extrabold text-slate-100 uppercase tracking-tight">
              ROAD TRANSPORT AND SAFETY AGENCY (RTSA)
            </div>
            <div class="text-[11px] text-slate-400 font-mono">
              In conjunction with Zambia Police Service • Traffic & Highway Patrol Division
            </div>
            <div class="text-xs font-mono font-bold text-amber-400 mt-2 bg-slate-900 inline-block px-3 py-1 rounded border border-slate-800">
              NOTICE OF STATUTORY TRAFFIC INFRINGEMENT • REF: {noticeNumber}
            </div>
          </div>

          {/* Offense Overview Grid */}
          <div class="grid grid-cols-2 gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 font-mono text-[11px]">
            <div>
              <span class="text-slate-400 block text-[10px]">VEHICLE REGISTRATION:</span>
              <span class="text-sm font-bold text-amber-400">{violation.plateNumber}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">REGISTERED OWNER:</span>
              <span class="text-slate-200 font-bold">{violation.vehicleDetails?.ownerName || 'Motorist'}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">VEHICLE MODEL:</span>
              <span class="text-slate-200">{violation.vehicleDetails?.makeModel || 'Motor Vehicle'}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">OWNER CONTACT:</span>
              <span class="text-slate-200">{violation.vehicleDetails?.ownerPhone || '+260 97 ...'}</span>
            </div>
          </div>

          {/* Photographic Evidence & Radar Speeds */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900 aspect-video">
              <img src={violation.imageUrl} alt="Violation Snapshot" class="w-full h-full object-cover" />
              <div class="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur text-[9px] font-mono text-emerald-300 px-1.5 py-0.5 rounded">
                EVIDENCE CAPTURE: {violation.timestamp}
              </div>
            </div>

            <div class="bg-slate-900/90 p-3.5 rounded-lg border border-slate-800 font-mono text-[11px] space-y-2 flex flex-col justify-between">
              <div>
                <span class="text-slate-400 block text-[10px]">CAPTURING CAMERA NODE:</span>
                <span class="text-slate-200 font-bold">{violation.cameraName} ({violation.cameraId})</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">CORRIDOR & LOCATION:</span>
                <span class="text-slate-200">{violation.road}, {violation.city}</span>
              </div>
              <div class="flex justify-between border-t border-slate-800 pt-1">
                <span class="text-slate-400">DETECTED VELOCITY:</span>
                <span class="text-rose-400 font-bold">{violation.speed} km/h</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">STATUTORY SPEED LIMIT:</span>
                <span class="text-amber-400 font-bold">{violation.speedLimit} km/h</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">EXCESS OVER LIMIT:</span>
                <span class="text-rose-400 font-bold">+{(violation.speed - violation.speedLimit).toFixed(1)} km/h</span>
              </div>
            </div>
          </div>

          {/* Statutory Act Statement & Fine Amount */}
          <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <div class="text-xs text-slate-300 font-medium">
                Statutory Offense: <strong>{violation.violationType}</strong>
                <div class="text-[10px] text-slate-400">Pursuant to the Road Traffic Act No. 11 of 2002 (Laws of Zambia)</div>
              </div>

              <div class="text-right font-mono">
                <span class="text-[10px] text-slate-400 block">TOTAL FINE PAYABLE:</span>
                <span class="text-lg font-extrabold text-emerald-400">ZMW {violation.fineAmountZMW}</span>
              </div>
            </div>

            <div class="text-[11px] text-slate-400 border-t border-slate-800 pt-2 leading-relaxed">
              Failure to settle this infringement notice within 14 statutory days may result in vehicle registration impoundment, court summons, or demerit point deduction on driver's license.
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div class="bg-slate-950 p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button
              id="btn-send-sms-notice"
              onClick={handleSendSms}
              class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <Send class="w-3.5 h-3.5" />
              <span>{smsSent ? 'SMS Dispatched to Driver!' : 'Send SMS Notice to Registered Driver'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
