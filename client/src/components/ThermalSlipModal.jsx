import React, { useEffect } from 'react';
import { Printer, X, Volume2, CheckCircle2 } from 'lucide-react';
import { announceTokenIssuance, replayLastAnnouncement } from '../utils/speech';
import { unlockAudioContext } from '../utils/soundEffects';

export default function ThermalSlipModal({ token, onClose }) {
  if (!token) return null;

  useEffect(() => {
    // Automatically trigger voice announcement on mount
    announceTokenIssuance(
      token.tokenNumber,
      token.patientName,
      token.doctorName,
      token.roomNumber
    );
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const handleReplayAudio = () => {
    unlockAudioContext();
    announceTokenIssuance(
      token.tokenNumber,
      token.patientName,
      token.doctorName,
      token.roomNumber
    );
  };

  const formattedDate = new Date(token.createdAt || token.date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = new Date(token.createdAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
        
        <div className="flex justify-between items-center no-print">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase text-[#0B4F9C]">Thermal Parchi Preview</span>
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
              <Volume2 size={11} className="animate-pulse" />
              <span>Voice Active</span>
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Printable 80mm Container */}
        <div className="thermal-slip-container bg-white border border-slate-200 p-4 rounded-xl font-mono text-xs space-y-2">
          
          <div className="text-center space-y-1">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain mx-auto mb-1" />
            <h1 className="font-black text-sm uppercase text-slate-900 tracking-tight">Al-Shafay Hospital</h1>
            <p className="text-[10px] font-bold text-slate-700 uppercase">Hospital Road, Fatehpur • 0300-1234567</p>
            <p className="text-[9px] text-slate-600">Outpatient Department (OPD) Slip</p>
          </div>

          <div className="divider border-b border-dashed border-slate-400 my-2"></div>

          {/* Large Token Badge */}
          <div className="token-badge border-2 border-dashed border-slate-900 py-3 text-center rounded-lg bg-slate-50">
            <div className="text-[10px] uppercase font-bold text-slate-600">Token Number</div>
            <div className="text-4xl font-black font-mono text-slate-900 tracking-tight">#{token.tokenNumber}</div>
            <div className="text-[10px] font-bold text-emerald-800 uppercase mt-0.5">
              {token.priority === 'EMERGENCY' ? '⚠ PRIORITY EMERGENCY' : 'REGULAR OPD'}
            </div>
          </div>

          <div className="divider border-b border-dashed border-slate-400 my-2"></div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Date/Time:</span>
              <span className="font-bold">{formattedDate} {formattedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Patient:</span>
              <span className="font-bold uppercase">{token.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Age / Gender:</span>
              <span>{token.patientAge ? `${token.patientAge} Yrs` : '-'} / {token.patientGender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Phone:</span>
              <span>{token.patientPhone || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Department:</span>
              <span className="font-bold">{token.departmentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Doctor:</span>
              <span className="font-bold">{token.doctorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Room:</span>
              <span className="font-black text-xs text-[#0B4F9C]">{token.roomNumber}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-dotted border-slate-300">
              <span className="text-slate-600 font-bold">Consultation Fee:</span>
              <span className="font-black font-mono">Rs. {token.fee || 1000}</span>
            </div>
          </div>

          <div className="divider border-b border-dashed border-slate-400 my-2"></div>

          <div className="text-center text-[9px] text-slate-600 space-y-0.5 pt-1">
            <p>Please wait for your token to be called on TV screen.</p>
            <p className="font-bold">Thank you for visiting Al-Shafay Hospital!</p>
          </div>

        </div>

        {/* Action Buttons with Voice Replay */}
        <div className="space-y-2 no-print pt-1">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 bg-[#0B4F9C] hover:bg-[#083B75] text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md cursor-pointer"
            >
              <Printer size={15} />
              <span>Print Slip (80mm)</span>
            </button>
            <button
              onClick={handleReplayAudio}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 text-xs shadow-md cursor-pointer"
              title="Replay Voice Announcement"
            >
              <Volume2 size={15} />
              <span>Replay Audio</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
