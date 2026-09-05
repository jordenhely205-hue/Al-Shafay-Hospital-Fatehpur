import React, { useState } from 'react';
import { 
  MessageCircle, 
  X, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Hash, 
  MapPin, 
  User, 
  Phone, 
  Stethoscope, 
  Building2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function AppointmentConfirmationModal({ appointment, onClose, onConfirmed }) {
  if (!appointment) return null;

  const [tokenNumber, setTokenNumber] = useState(
    appointment.confirmedTokenNumber || 
    appointment.appointmentNumber?.replace(/[^0-9]/g, '') || 
    '101'
  );
  const [date, setDate] = useState(appointment.date || new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState(appointment.timeSlot || '10:00 AM - 10:30 AM');
  const [doctorRoom, setDoctorRoom] = useState(appointment.doctorRoom || 'Room 101');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  /**
   * Sanitize Pakistani mobile number to international format 923XXXXXXXXX
   */
  const sanitizePhone = (phoneStr) => {
    if (!phoneStr) return '923016167412';
    let clean = phoneStr.replace(/[^0-9]/g, '');
    if (clean.startsWith('03')) {
      clean = '92' + clean.slice(1);
    } else if (clean.startsWith('3') && clean.length === 10) {
      clean = '92' + clean;
    } else if (!clean.startsWith('92') && clean.length === 10) {
      clean = '92' + clean;
    }
    return clean;
  };

  const patientPhone = appointment.phone || appointment.patientPhone || '';
  const sanitizedPhone = sanitizePhone(patientPhone);
  const emrNumber = appointment.emrNumber || ('EMR-2026-' + String(appointment.appointmentNumber || appointment.tokenNumber || appointment.id || '1001').replace(/\D/g, '').padStart(4, '0'));

  /**
   * Formulate official Urdu WhatsApp confirmation template (Corrected Urdu + 30-min Notice + AM FutureStack Credit)
   */
  const generateUrduMessage = () => {
    return (
      `محترم/محترمہ ${appointment.patientName} صاحب/صاحبہ!\n` +
      `الشافع ہسپتال فتح پور میں آپ کی اپائنٹمنٹ کی تصدیق (Confirm) کر دی گئی ہے۔\n\n` +
      `تفصیلات درج ذیل ہیں:\n` +
      `توثیق شدہ ٹوکن نمبر: #${tokenNumber}\n` +
      `ای ایم آر نمبر: ${emrNumber}\n` +
      `ڈاکٹر کا نام: ${appointment.doctorName}\n` +
      `شعبہ: ${appointment.departmentName || 'General OPD'} (${doctorRoom})\n` +
      `مقررہ تاریخ: ${date}\n` +
      `چیک اپ کا وقت: ${timeSlot}\n\n` +
      `ہدایت: برائے مہربانی دیے گئے وقت سے 30 منٹ پہلے ہسپتال تشریف لائیں اور ریسیپشن ڈیسک پر اپنا ٹوکن نمبر بتائیں۔\n\n` +
      `الشافع ہسپتال، ہسپتال روڈ، فتح پور\n` +
      `ہیلپ لائن: 0301-6167412 / 0300-1234567\n` +
      `Website Developed By : AM FutureStack 03069141212`
    );
  };

  const urduMessage = generateUrduMessage();

  const handleCopyText = () => {
    navigator.clipboard.writeText(urduMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmAndSend = async () => {
    if (!tokenNumber.trim()) {
      setError('Please enter a valid Token Number.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Update appointment in backend database
      const res = await api.confirmAppointment(appointment.id, {
        tokenNumber,
        date,
        timeSlot,
        doctorRoom,
        emrNumber
      });

      // 2. Formulate WhatsApp URL & dispatch to patient
      const encodedMessage = encodeURIComponent(urduMessage);
      const waUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
      
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      if (onConfirmed) {
        onConfirmed(res.appointment || {
          ...appointment,
          confirmedTokenNumber: tokenNumber,
          emrNumber,
          date,
          timeSlot,
          doctorRoom,
          status: 'CONFIRMED'
        });
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update appointment.');
    } finally {
      setLoading(false);
    }
  };


  const timeSlotsList = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '12:00 PM - 12:30 PM',
    '02:00 PM - 02:30 PM',
    '03:00 PM - 03:30 PM',
    '04:00 PM - 04:30 PM'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#081E48] via-[#0B3B82] to-[#081E48] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/90 border border-emerald-300/40 flex items-center justify-center text-white shrink-0 shadow-xs">
              <MessageCircle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Reception Confirmation
                </span>
                <span className="text-xs font-mono font-bold text-cyan-200">#{appointment.appointmentNumber}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Confirm & WhatsApp to Patient
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Auto-Filled Patient & Doctor Details (Read-Only) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <User size={14} className="text-[#0B4F9C]" />
              <span>Patient & Doctor Information (Auto-Filled)</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                <strong className="text-slate-900 font-black text-sm uppercase">{appointment.patientName}</strong>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Mobile Number</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Phone size={13} className="text-emerald-600 shrink-0" />
                  <strong className="text-slate-900 font-mono font-bold text-sm">{patientPhone}</strong>
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono font-bold">
                    +{sanitizedPhone}
                  </span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Consultant Doctor</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Stethoscope size={13} className="text-[#0B4F9C] shrink-0" />
                  <strong className="text-slate-900 font-black">{appointment.doctorName}</strong>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Specialization / Department</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Building2 size={13} className="text-purple-600 shrink-0" />
                  <strong className="text-slate-800 font-bold">{appointment.departmentName || 'General OPD'}</strong>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-blue-200/80 col-span-full">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Universal EMR Record Number</span>
                <strong className="text-[#0B4F9C] font-mono font-black text-sm">{emrNumber}</strong>
              </div>
            </div>
          </div>


          {/* Section 2: Editable Slot & Token Assignment (Receptionist Input) */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-[#0B4F9C] flex items-center gap-1.5">
              <Calendar size={14} />
              <span>Token & Slot Assignment (Editable by Receptionist)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Confirmed Token No. *
                </label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={tokenNumber}
                    onChange={(e) => setTokenNumber(e.target.value)}
                    placeholder="e.g. 101 or 12"
                    className="w-full pl-8.5 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B4F9C] focus:border-transparent font-mono font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Confirmed Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B4F9C] focus:border-transparent font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Doctor Room / Clinic
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={doctorRoom}
                    onChange={(e) => setDoctorRoom(e.target.value)}
                    placeholder="Room 101"
                    className="w-full pl-8.5 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B4F9C] focus:border-transparent font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Check-up Time Slot *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {timeSlotsList.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`py-1.5 px-2 rounded-lg text-[10.5px] font-bold border transition text-center cursor-pointer ${
                      timeSlot === slot
                        ? 'bg-[#0B4F9C] text-white border-[#0B4F9C] shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {slot.split(' - ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: WhatsApp Urdu Message Preview */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <MessageCircle size={14} className="text-emerald-600" />
                <span>Urdu WhatsApp Message Preview</span>
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white border border-emerald-300 px-2 py-0.5 rounded-lg transition shadow-2xs cursor-pointer"
              >
                <Copy size={12} />
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <div 
              className="bg-white border border-emerald-100 rounded-xl p-3 text-[11.5px] font-urdu leading-relaxed text-slate-800 whitespace-pre-line max-h-36 overflow-y-auto shadow-inner"
              dir="rtl"
            >
              {urduMessage}
            </div>
          </div>

        </div>

        {/* Modal Action Buttons */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
            Dispatching opens WhatsApp with this pre-filled message sent to <strong className="text-slate-800 font-mono">+{sanitizedPhone}</strong>
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition text-xs cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAndSend}
              disabled={loading}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
            >
              <MessageCircle size={16} />
              <span>{loading ? 'Confirming...' : 'Send Confirmation on WhatsApp'}</span>
              <ExternalLink size={13} className="opacity-80" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
