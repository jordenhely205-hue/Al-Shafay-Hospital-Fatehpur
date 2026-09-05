import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  Building2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Stethoscope, 
  ShieldCheck, 
  MapPin, 
  HeartPulse, 
  Tv,
  Volume2,
  Sparkles,
  MessageCircle,
  Activity,
  FlaskConical,
  Pill,
  Shield,
  ArrowRight,
  Send
} from 'lucide-react';
import { announceTokenIssuance } from '../utils/speech';
import { unlockAudioContext } from '../utils/soundEffects';

export default function PublicBooking() {
  const { subscribe } = useSocket();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Booking Form State
  const [form, setForm] = useState({
    patientName: '',
    phone: '',
    cnic: '',
    departmentId: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 10:30 AM',
    notes: ''
  });

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Tracker State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedAppointments, setTrackedAppointments] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  useEffect(() => {
    loadInitialData();

    const unsubscribe = subscribe((event) => {
      if (event.type === 'DOCTORS_UPDATED') {
        loadInitialData();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadInitialData = async () => {
    try {
      const [deptRes, docRes] = await Promise.all([
        api.getDepartments(),
        api.getDoctors(null, true)
      ]);
      if (deptRes.success) setDepartments(deptRes.departments);
      if (docRes.success) {
        setDoctors(docRes.doctors);
        if (docRes.doctors.length > 0) {
          setForm(prev => ({
            ...prev,
            doctorId: docRes.doctors[0].id,
            departmentId: docRes.doctors[0].departmentId
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDepartmentChange = async (deptId) => {
    setForm(prev => ({ ...prev, departmentId: deptId, doctorId: '' }));
    try {
      const docRes = await api.getDoctors(deptId);
      if (docRes.success) {
        setDoctors(docRes.doctors);
        if (docRes.doctors.length > 0) {
          setForm(prev => ({ ...prev, doctorId: docRes.doctors[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Helper to construct WhatsApp Universal API Click-to-Chat URL
   * Endpoint: https://api.whatsapp.com/send?phone=923016167412&text=${encodedMessage}
   */
  const generateWhatsAppUrl = (patientName, phone, doctorName, departmentName, date, timeSlot) => {
    const cleanPatient = (patientName || '').trim();
    const cleanPhone = (phone || '').trim();
    const cleanDoc = (doctorName || 'Consultant').trim();
    const cleanDept = (departmentName || 'General OPD').trim();
    const cleanDate = (date || '').trim();
    const cleanSlot = (timeSlot || '').trim();

    const rawMessage = 
      `السلام علیکم! میں الشافع ہسپتال فتح پور میں آن لائن اپائنٹمنٹ بک کروانا چاہتا/چاہتی ہوں۔\n\n` +
      `*مریض کا نام:* ${cleanPatient}\n` +
      `*رابطہ نمبر:* ${cleanPhone}\n` +
      `*ڈاکٹر کا نام:* ${cleanDoc}\n` +
      `*شعبہ:* ${cleanDept}\n` +
      `*تاریخ و وقت:* ${cleanDate} (${cleanSlot})\n\n` +
      `برائے مہربانی اپائنٹمنٹ کی تصدیق فرما دیں۔ شکریہ!`;

    const encodedMessage = encodeURIComponent(rawMessage);
    return `https://api.whatsapp.com/send?phone=923016167412&text=${encodedMessage}`;

  };

  /**
   * Standard OPD Booking in EMR & WhatsApp Action Dispatch
   */
  const handleBook = async (e, sendToWhatsApp = false) => {
    if (e && e.preventDefault) e.preventDefault();
    unlockAudioContext();

    if (!form.patientName.trim() || !form.phone.trim() || !form.doctorId) {
      setBookingError('Please enter Patient Name, Phone Number, and select a Doctor.');
      return;
    }
    setBookingLoading(true);
    setBookingError('');

    const selectedDoc = doctors.find(d => d.id === form.doctorId);
    const selectedDept = departments.find(d => d.id === form.departmentId) || { name: selectedDoc?.departmentName || 'General OPD' };
    const docName = selectedDoc?.name || 'Dr. Consultant';
    const deptName = selectedDoc?.departmentName || selectedDept.name;

    try {
      const payload = {
        ...form,
        bookingType: 'ONLINE',
        isOnline: true,
        status: 'PENDING',
        source: 'WEBSITE'
      };

      const res = await api.bookAppointment(payload);
      if (res.success && res.appointment) {
        setBookingSuccess(res.appointment);
        
        // Immediate cross-tab master records persistence
        try {
          const cached = JSON.parse(localStorage.getItem('alshafay_master_records') || localStorage.getItem('alshafay_cached_appointments') || '[]');
          const updated = [res.appointment, ...cached.filter(a => (a.id || a.appointmentNumber) !== (res.appointment.id || res.appointment.appointmentNumber))];
          localStorage.setItem('alshafay_master_records', JSON.stringify(updated));
          localStorage.setItem('alshafay_cached_appointments', JSON.stringify(updated));
        } catch (lsErr) {
          console.warn('LocalStorage save failed:', lsErr);
        }

        // Automated Voice Announcement on Token Issuance
        announceTokenIssuance(
          res.appointment.appointmentNumber,
          res.appointment.patientName,
          res.appointment.doctorName,
          res.appointment.doctorRoom
        );

        // If WhatsApp action was triggered, open the pre-filled universal URL immediately
        if (sendToWhatsApp) {
          const waUrl = generateWhatsAppUrl(
            form.patientName,
            form.phone,
            docName,
            deptName,
            form.date,
            form.timeSlot
          );
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }

        setForm({
          patientName: '',
          phone: '',
          cnic: '',
          departmentId: departments[0]?.id || '',
          doctorId: doctors[0]?.id || '',
          date: new Date().toISOString().split('T')[0],
          timeSlot: '10:00 AM - 10:30 AM',
          notes: ''
        });
      } else {
        setBookingError(res.message || 'Failed to book appointment.');
      }
    } catch (err) {
      setBookingError(err.message || 'An error occurred.');
    } finally {
      setBookingLoading(false);
    }
  };


  const handleReplayBookingAudio = () => {
    if (!bookingSuccess) return;
    unlockAudioContext();
    announceTokenIssuance(
      bookingSuccess.appointmentNumber,
      bookingSuccess.patientName,
      bookingSuccess.doctorName,
      bookingSuccess.doctorRoom
    );
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    setTrackLoading(true);
    setTrackError('');
    try {
      const res = await api.trackAppointment(trackQuery);
      if (res.success) {
        setTrackedAppointments(res.appointments);
        if (res.appointments.length === 0) {
          setTrackError('No appointments found for the provided Mobile Number or Appointment ID.');
        }
      }
    } catch (err) {
      setTrackError('Failed to search appointment.');
    } finally {
      setTrackLoading(false);
    }
  };

  const timeSlots = [
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

  const filteredDoctors = doctors.filter(doc => {
    if (selectedDeptFilter === 'ALL') return true;
    return doc.departmentId === selectedDeptFilter || doc.departmentName?.toLowerCase().includes(selectedDeptFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 sm:py-8 px-3.5 sm:px-6 lg:px-8 space-y-10 overflow-x-hidden font-sans">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* HERO BANNER: High-Impact Medical Visual with Clinical Typography & Trust Badges */}
        <div className="relative rounded-3xl overflow-hidden text-white p-6 sm:p-10 lg:p-12 shadow-2xl border border-blue-900/40">
          
          {/* High-Resolution Medical Center Architecture Background with Dark Clinical Gradient Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-20 transform scale-105 filter brightness-40"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-[#081E48]/90 to-[#0B3B82]/85 -z-10 backdrop-blur-xs"></div>
          
          {/* Subtle Ambient Light Orb */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            
            {/* Left Column: Hospital Info, Urdu Title & Live Trust Badges */}
            <div className="max-w-2xl space-y-4 text-center md:text-left">
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-300 text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                  <HeartPulse size={14} className="animate-pulse text-cyan-400" />
                  <span>PHC Certified Hospital Management System</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>24/7 Emergency Active</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase font-outfit leading-tight drop-shadow-md">
                Al-Shafay Hospital <span className="text-cyan-400">Fatehpur</span>
              </h1>

              {/* Bold Urdu Hospital Name & Portal Description */}
              <h2 className="text-lg sm:text-2xl font-bold font-urdu text-amber-300 pt-1 tracking-wide leading-relaxed drop-shadow-sm" dir="rtl">
                الشافع ہسپتال فتح پور - جدید ترین طبی سہولیات اور آن لائن اپائنٹمنٹ پورٹل
              </h2>

              <p className="text-sm sm:text-base text-blue-100 leading-relaxed font-medium">
                Book specialist doctor consultations online, confirm instantly via WhatsApp (<strong className="text-emerald-300">0301-6167412</strong>), and experience automated voice-called queuing at counter reception.
              </p>

              {/* Live Floating Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="bg-white/10 backdrop-blur-md border border-white/15 p-2.5 rounded-2xl flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <span className="font-black text-white block text-[11px]">Qualified Consultants</span>
                    <span className="text-[10px] text-blue-200">FCPS & Senior Specialists</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/15 p-2.5 rounded-2xl flex items-center gap-2">
                  <HeartPulse size={18} className="text-rose-400 shrink-0" />
                  <div className="text-left">
                    <span className="font-black text-white block text-[11px]">24/7 Emergency Care</span>
                    <span className="text-[10px] text-blue-200">Rapid Triage & Trauma</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/15 p-2.5 rounded-2xl flex items-center gap-2">
                  <MessageCircle size={18} className="text-cyan-400 shrink-0" />
                  <div className="text-left">
                    <span className="font-black text-white block text-[11px]">Digital WhatsApp Token</span>
                    <span className="text-[10px] text-blue-200">Automated Audio Screen</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 text-xs text-blue-200 pt-2 font-medium">
                <span className="flex items-center gap-1.5"><MapPin size={15} className="text-cyan-400 shrink-0" /> Hospital Road, Fatehpur</span>
                <span className="flex items-center gap-1.5"><Phone size={15} className="text-cyan-400 shrink-0" /> 24/7 Helpline: 0300-1234567</span>
              </div>

              {/* Action Buttons in Hero */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-3">
                <a
                  href="#booking-section"
                  className="bg-gradient-to-r from-[#0284C7] to-[#06B6D4] hover:from-[#06B6D4] hover:to-[#0284C7] text-white font-black px-5 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition shadow-lg shadow-cyan-900/30 active:scale-95"
                >
                  <Calendar size={16} />
                  <span>Book Appointment Online</span>
                </a>
                
                <a
                  href="https://api.whatsapp.com/send?phone=923016167412"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-950/30 active:scale-95"
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp Booking (0301-6167412)</span>
                </a>

              </div>

            </div>

            {/* Right Column: Clean, Uncluttered Clinical Doctor Visual */}
            <div className="shrink-0 flex items-center justify-center pt-4 md:pt-0 relative">
              
              {/* Clinical Glassmorphic Shield & Arch Frame */}
              <div className="relative w-64 sm:w-72 md:w-80 lg:w-84 rounded-3xl p-3 bg-gradient-to-b from-white/10 via-[#0B2559]/60 to-[#081E48]/90 backdrop-blur-md border border-cyan-400/25 shadow-2xl shadow-blue-950/60 group">
                
                {/* Ambient Soft Cyan/Blue Backlight Glow */}
                <div className="absolute inset-0 bg-radial from-cyan-400/20 via-blue-500/10 to-transparent rounded-3xl filter blur-xl -z-10 group-hover:scale-105 transition-transform duration-500 pointer-events-none"></div>

                {/* Top-Right Single Floating Badge: Verified Specialist */}
                <div className="absolute -top-3 -right-2 sm:-right-3 backdrop-blur-md bg-[#081E48]/90 border border-white/25 rounded-2xl px-3 py-1.5 shadow-xl flex items-center gap-2 text-white select-none z-20">
                  <div className="w-6 h-6 rounded-xl bg-emerald-500/90 border border-emerald-300/40 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300 block leading-tight">Verified Specialist</span>
                    <strong className="text-[10.5px] font-black tracking-tight leading-none text-slate-100">Senior Consultant</strong>
                  </div>
                </div>

                {/* Doctor Portrait Visual Container with Arch & Smooth Bottom Fade */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-cyan-950/40 via-[#0B2559]/30 to-[#081E48] ring-1 ring-cyan-400/20 h-72 sm:h-80 md:h-[420px] lg:h-[450px] flex items-end justify-center shadow-inner">
                  <img 
                    src="/dr-abbas-malik.png" 
                    alt="Dr. Abbas Malik - Chief Medical Consultant" 
                    className="w-full h-full object-contain object-top -scale-x-100 filter contrast-105 brightness-100 group-hover:scale-105 group-hover:-scale-x-105 transition-all duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/dr-abbas-malik.png";
                    }}
                  />

                  {/* Smooth Bottom Fade Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#081E48] via-[#081E48]/80 to-transparent pointer-events-none"></div>

                  {/* Single Clean Anchored Nameplate Badge */}
                  <div className="absolute inset-x-0 bottom-0 p-4 text-center z-10 space-y-0.5">
                    <p className="text-xs font-semibold tracking-wider uppercase text-cyan-300">
                      Chief Medical Consultant
                    </p>
                    <h3 className="text-base sm:text-lg font-bold uppercase text-white font-outfit tracking-wide drop-shadow-sm">
                      Dr. Abbas Malik
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 pt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 tracking-wide">
                        Specialist OPD Available
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>


          </div>

          {/* 4 Clinical Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10 text-center">
            <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-cyan-200 block">Emergency Services</span>
              <strong className="text-sm sm:text-base font-black text-white">24/7 Active Trauma</strong>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-cyan-200 block">Consultation System</span>
              <strong className="text-sm sm:text-base font-black text-white">Digital EMR & Prescriptions</strong>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-cyan-200 block">Diagnostic Pathology</span>
              <strong className="text-sm sm:text-base font-black text-white">Fully Verified Lab</strong>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-cyan-200 block">Queue Calling</span>
              <strong className="text-sm sm:text-base font-black text-white">Live English TV Voice</strong>
            </div>
          </div>

        </div>

        {/* SPECIALIST DOCTORS ROSTER (ZERO PUBLIC DOCTOR FEES) */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="text-[#0B4F9C]" size={20} />
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-outfit">
                  Specialist Doctors & Clinical Roster
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Consultant outpatient schedules, assigned clinical rooms, and specialization details
              </p>
            </div>

            {/* Department Quick Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedDeptFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedDeptFilter === 'ALL'
                    ? 'bg-[#0B4F9C] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Clinics
              </button>
              {departments.slice(0, 4).map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDeptFilter(d.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedDeptFilter === d.id
                      ? 'bg-[#0B4F9C] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Cards Grid - Modern Polish, Hover Elevation & Active Indicator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredDoctors.map((doc, idx) => (
              <div 
                key={doc.id} 
                style={{ animationDelay: `${idx * 80}ms` }}
                className="bg-white border border-slate-200/90 rounded-3xl p-5.5 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-950/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-3"
              >
                {/* Subtle gradient glow backdrop on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none -z-0"></div>

                <div className="relative z-10 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B4F9C] border border-blue-100 uppercase tracking-wide">
                      {doc.departmentName || 'OPD'}
                    </span>
                    <span className="font-mono text-xs font-black text-[#0B4F9C] bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {doc.roomNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0B4F9C] to-cyan-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs border border-white/20">
                      <Stethoscope size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-base font-outfit group-hover:text-[#0B4F9C] transition truncate">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-emerald-700 font-extrabold truncate">{doc.qualification}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{doc.specialization}</p>
                </div>

                <div className="pt-3.5 border-t border-slate-100 space-y-2.5 text-xs relative z-10">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      <span>{doc.timing}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Active OPD</span>
                    </span>
                  </div>

                  <a
                    href="#booking-section"
                    onClick={() => setForm(prev => ({ ...prev, doctorId: doc.id, departmentId: doc.departmentId }))}
                    className="w-full bg-slate-50 hover:bg-[#0B4F9C] hover:text-white text-slate-700 border border-slate-200 font-bold py-2 rounded-xl text-center block transition text-xs shadow-2xs group-hover:border-[#0B4F9C]"
                  >
                    Select for Booking
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* HOSPITAL CLINICAL FACILITIES & DEPARTMENTS */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="text-emerald-600" size={20} />
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-outfit">
                  Advanced Clinical Facilities & Services
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                24/7 dedicated hospital departments equipped with diagnostic instruments, emergency care, and rapid dispensing
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Facility 1: Digital Pathology Lab */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:border-purple-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <FlaskConical size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-outfit group-hover:text-purple-700 transition">
                    Digital Pathology Lab
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                    Automated Hematology, Biochemistry & verified pathology reports with computerized barcoding.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-purple-700">
                <span>Verified Diagnostic Reports</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Facility 2: 24/7 Pharmacy Counter */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:border-amber-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Pill size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-outfit group-hover:text-amber-700 transition">
                    24/7 Pharmacy & POS
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                    100% genuine certified medicines, cold-chain preservation & digital prescription dispensing.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-amber-700">
                <span>Computerized Billing POS</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Facility 3: Pediatric & Child Care */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:border-teal-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <HeartPulse size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-outfit group-hover:text-teal-700 transition">
                    Pediatric & Child Care
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                    Specialized child health, neonatal monitoring, immunization protocols & gentle infant care.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-teal-700">
                <span>Specialist Pediatrician OPD</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Facility 4: Cardiac Care & Monitoring */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:border-rose-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Activity size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-outfit group-hover:text-rose-700 transition">
                    Cardiac Care & ECG Unit
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                    Digital 12-lead ECG, continuous cardiovascular monitoring & expert hypertension treatment.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-rose-700">
                <span>24/7 Cardiac Emergency</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN SECTION: Booking Form with WhatsApp Integration & Live Tracker */}
        <div id="booking-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Online Appointment Booking Form Card */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[#0B4F9C]">
                <Calendar size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 font-outfit uppercase">
                  Online OPD Appointment & WhatsApp Booking
                </h2>
                <p className="text-xs text-slate-500">Book in the hospital queue or dispatch instant confirmation to WhatsApp</p>
              </div>
            </div>

            {/* Booking Success Confirmation with WhatsApp Re-trigger & Audio Voice Replay */}
            {bookingSuccess && (
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-5 sm:p-6 text-emerald-950 shadow-md space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                  <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                    <CheckCircle2 size={20} className="text-emerald-700 shrink-0" />
                    <span>Appointment Token Reserved!</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold border border-emerald-300">
                    <Volume2 size={13} className="animate-pulse text-emerald-700" />
                    <span>English Voice Announced</span>
                  </span>
                </div>

                <div className="bg-white/95 p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Appointment Token Number</span>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-[#0B4F9C]">
                      #{bookingSuccess.appointmentNumber}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleReplayBookingAudio}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      title="Replay Spoken Announcement"
                    >
                      <Volume2 size={14} />
                      <span>Replay Voice</span>
                    </button>
                    
                    <a
                      href={generateWhatsAppUrl(
                        bookingSuccess.patientName,
                        bookingSuccess.patientPhone || 'N/A',
                        bookingSuccess.doctorName,
                        bookingSuccess.departmentName || 'OPD',
                        bookingSuccess.date,
                        bookingSuccess.timeSlot
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <MessageCircle size={14} />
                      <span>Send to WhatsApp (03016167412)</span>
                    </a>
                  </div>
                </div>

                <div className="text-xs space-y-1 font-medium text-slate-800">
                  <p>Patient Name: <strong className="text-slate-900 font-bold uppercase">{bookingSuccess.patientName}</strong></p>
                  <p>Consultant Doctor: <strong className="text-slate-900 font-bold">{bookingSuccess.doctorName}</strong> ({bookingSuccess.doctorRoom})</p>
                  <p>Scheduled Slot: <strong className="text-slate-900 font-bold">{bookingSuccess.date} • {bookingSuccess.timeSlot}</strong></p>
                </div>

                <p className="text-[11px] text-emerald-900 font-bold pt-2 border-t border-emerald-200">
                  ℹ️ Please show your Token #{bookingSuccess.appointmentNumber} at the Reception desk upon arrival.
                </p>
              </div>
            )}

            {bookingError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-center gap-2 font-semibold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Main Booking Input Form */}
            <form onSubmit={(e) => handleBook(e, false)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Patient Full Name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Muhammad Ahmad"
                      value={form.patientName}
                      onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition min-h-[46px] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Contact Number *</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 03001234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition min-h-[46px] text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">CNIC / B-Form (Optional)</label>
                  <div className="relative">
                    <CreditCard size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="32203-XXXXXXX-X"
                      value={form.cnic}
                      onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition min-h-[46px] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department *</label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <select
                      value={form.departmentId}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition font-medium min-h-[46px] text-sm cursor-pointer"
                    >
                      <option value="">-- Choose Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Doctor * (No Public Fee Tag)</label>
                  <div className="relative">
                    <Stethoscope size={15} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <select
                      required
                      value={form.doctorId}
                      onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition font-bold min-h-[46px] text-sm cursor-pointer"
                    >
                      <option value="">-- Choose Doctor --</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} - {doc.specialization} ({doc.roomNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition font-semibold min-h-[46px] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Preferred Time Slot *</label>
                <div className="relative">
                  <Clock size={15} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={form.timeSlot}
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition font-medium min-h-[46px] text-sm cursor-pointer"
                  >
                    {timeSlots.map((slot, i) => (
                      <option key={i} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Visit / Symptoms (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Chest pain, recurring fever, routine checkup"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition text-xs font-medium"
                />
              </div>

              {/* DUAL ACTION BUTTONS: Standard Booking & WhatsApp Instant Booking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                
                {/* 1. Confirm & Send to WhatsApp Button */}
                <button
                  type="button"
                  onClick={(e) => handleBook(e, true)}
                  disabled={bookingLoading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 px-4 rounded-xl transition shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm min-h-[48px] active:scale-[0.99]"
                >
                  <MessageCircle size={18} className="shrink-0 animate-pulse" />
                  <span>Confirm & Send to WhatsApp</span>
                </button>

                {/* 2. Standard EMR Submit Button */}
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="bg-gradient-to-r from-[#0B4F9C] to-[#083B75] hover:from-[#083B75] hover:to-[#0B4F9C] text-white font-black py-3.5 px-4 rounded-xl transition shadow-md shadow-blue-900/15 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm min-h-[48px] active:scale-[0.99]"
                >
                  {bookingLoading ? (
                    <span>Processing Appointment...</span>
                  ) : (
                    <>
                      <Calendar size={18} className="shrink-0" />
                      <span>Confirm & Book OPD Token</span>
                    </>
                  )}
                </button>

              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Live Appointment Tracker & Emergency Hotline */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Tracker Box */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[#0B4F9C]">
                  <Search size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-outfit uppercase">Live Appointment Tracker</h3>
                  <p className="text-xs text-slate-500">Check appointment status via Phone or Token ID</p>
                </div>
              </div>

              <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter Phone or APT-XXXX"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="bg-[#0B4F9C] hover:bg-[#083B75] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-xs min-h-[44px] shrink-0"
                >
                  {trackLoading ? 'Searching...' : 'Track'}
                </button>
              </form>

              {trackError && (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 text-center font-medium">
                  {trackError}
                </div>
              )}

              {trackedAppointments && trackedAppointments.length > 0 && (
                <div className="space-y-3 mt-4">
                  {trackedAppointments.map((apt) => (
                    <div key={apt.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                        <span className="font-mono font-black text-[#0B4F9C]">#{apt.appointmentNumber}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-slate-700">Patient: <strong className="text-slate-900 uppercase">{apt.patientName}</strong></p>
                      <p className="text-slate-700">Doctor: <strong>{apt.doctorName}</strong> ({apt.doctorRoom})</p>
                      <p className="text-slate-500 font-medium">Date/Time: {apt.date} • {apt.timeSlot}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WhatsApp 24/7 Helpline Card */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-200 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm uppercase">
                <MessageCircle size={20} className="text-emerald-700 shrink-0" />
                <span>24/7 WhatsApp Patient Assistance</span>
              </div>
              
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Need immediate doctor availability verification, emergency guidance, or prescription inquiry?
              </p>

              <a
                href="https://api.whatsapp.com/send?phone=923016167412"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-black p-3.5 rounded-2xl text-center block transition shadow-md shadow-emerald-950/20 text-xs sm:text-sm"
              >
                Chat on WhatsApp: 0301-6167412
              </a>

            </div>

            {/* 24/7 Emergency & Trauma Center */}
            <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-red-200 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-red-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={18} className="text-red-600 shrink-0" />
                <span>24/7 Emergency & Trauma Center</span>
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                For critical emergency cases, road traffic trauma, or cardiac ambulance dispatch:
              </p>
              <div className="bg-white border border-red-200 p-3.5 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] text-red-700 uppercase block font-extrabold">Emergency Hotline</span>
                <span className="text-base sm:text-lg font-black text-red-900 font-mono tracking-wide">
                  +92 301 7654321 / 0300 1234567
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

