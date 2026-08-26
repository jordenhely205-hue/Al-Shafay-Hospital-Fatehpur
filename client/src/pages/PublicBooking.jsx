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
  Tv 
} from 'lucide-react';

export default function PublicBooking() {
  const { subscribe } = useSocket();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);

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

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.patientName || !form.phone || !form.doctorId) {
      setBookingError('Please enter Patient Name, Phone Number, and select a Doctor.');
      return;
    }
    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await api.bookAppointment(form);
      if (res.success) {
        setBookingSuccess(res.appointment);
        setForm({
          patientName: '',
          phone: '',
          cnic: '',
          departmentId: '',
          doctorId: '',
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
          setTrackError('No appointments found for the provided Mobile Number or ID.');
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Hero Section with strictly constrained circular emblem on the right */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0B4F9C] via-[#083B75] to-[#0A2E5C] text-white p-6 sm:p-10 shadow-lg">
          <div className="max-w-2xl relative z-10 space-y-3">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <HeartPulse size={14} />
              <span>Official OPD & Consultation Booking</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase font-outfit">
              Al-Shafay Hospital <span className="text-emerald-400">Fatehpur</span>
            </h1>

            <p className="text-sm sm:text-base text-blue-100 leading-relaxed font-medium">
              Schedule specialist consultations online, track your live queue status, and access verified digital healthcare services.
            </p>

            <div className="flex flex-wrap gap-4 text-xs text-blue-200 pt-2 font-medium">
              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-emerald-400" /> Hospital Road, Fatehpur, Layyah</span>
              <span className="flex items-center gap-1.5"><Phone size={14} className="text-emerald-400" /> 24/7 Helpline: 0300-1234567</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> PHC Certified</span>
            </div>

          </div>

          {/* Clean High-Contrast White Logo Asset */}
          <div className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden md:flex items-center justify-center">
            <img 
              src="/images/al-shafay-logo.png" 
              alt="Al-Shafay Hospital Fatehpur" 
              className="w-28 md:w-36 lg:w-44 h-auto object-contain drop-shadow-lg" 
            />
          </div>
        </div>

        {/* Specialist Doctors Roster (COMPLETELY FREE OF CONSULTATION FEES) */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Specialist Doctors & OPD Roster</h2>
              <p className="text-xs text-slate-500 font-medium">Consultant availability and clinical outpatient clinics</p>
            </div>
            <Link
              to="/screen"
              target="_blank"
              className="text-xs font-bold text-[#0B4F9C] bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl hover:bg-blue-100 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Tv size={14} />
              <span>Open Live TV Screen</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {doctors.slice(0, 4).map(doc => (
              <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#0B4F9C] hover:shadow-md transition space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B4F9C] border border-blue-100 uppercase">
                    {doc.departmentName}
                  </span>
                  <span className="font-mono text-xs font-black text-[#0B4F9C] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {doc.roomNumber}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm font-outfit">{doc.name}</h3>
                  <p className="text-xs text-emerald-700 font-bold">{doc.qualification}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{doc.specialization}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                  <span className="text-slate-600 font-medium flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    <span>{doc.timing}</span>
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Available OPD
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid: Booking Form & Live Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Online Appointment Booking Card */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[#0B4F9C]">
                <Calendar size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 font-outfit">Online OPD Doctor Appointment</h2>
                <p className="text-xs text-slate-500">Reserve an appointment slot in advance to skip long waiting queues</p>
              </div>
            </div>

            {bookingSuccess && (
              <div className="mb-6 bg-emerald-50 border border-emerald-300 rounded-2xl p-5 text-emerald-900">
                <div className="flex items-center gap-2 font-black text-sm mb-2 text-emerald-800">
                  <CheckCircle2 size={18} />
                  <span>Appointment Confirmed!</span>
                </div>
                <div className="text-xs space-y-1 font-medium">
                  <p>Appointment ID: <strong className="text-slate-900 font-mono font-bold">{bookingSuccess.appointmentNumber}</strong></p>
                  <p>Patient: <strong className="text-slate-900 font-bold">{bookingSuccess.patientName}</strong></p>
                  <p>Doctor: <strong className="text-slate-900 font-bold">{bookingSuccess.doctorName}</strong> ({bookingSuccess.doctorRoom})</p>
                  <p>Slot: <strong className="text-slate-900 font-bold">{bookingSuccess.date} at {bookingSuccess.timeSlot}</strong></p>
                </div>
                <p className="mt-3 text-[11px] text-emerald-800 font-bold">
                  Please show your Appointment ID at Reception counter upon arrival to collect your fast-track token.
                </p>
              </div>
            )}

            {bookingError && (
              <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-center gap-2 font-semibold">
                <AlertCircle size={16} />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Patient Full Name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Muhammad Ahmad"
                      value={form.patientName}
                      onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone Number *</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 03001234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">CNIC / B-Form (Optional)</label>
                  <div className="relative">
                    <CreditCard size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="32203-XXXXXXX-X"
                      value={form.cnic}
                      onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Department *</label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-3 text-slate-400" />
                    <select
                      value={form.departmentId}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition font-medium"
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
                  <label className="block text-slate-700 font-bold mb-1">Select Doctor *</label>
                  <div className="relative">
                    <Stethoscope size={15} className="absolute left-3 top-3 text-slate-400" />
                    <select
                      required
                      value={form.doctorId}
                      onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition font-bold"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Preferred Time Slot *</label>
                <div className="relative">
                  <Clock size={15} className="absolute left-3 top-3 text-slate-400" />
                  <select
                    value={form.timeSlot}
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition font-medium"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full bg-gradient-to-r from-[#0B4F9C] to-[#083B75] hover:from-[#083B75] hover:to-[#0B4F9C] text-white font-black py-3.5 rounded-xl transition shadow-md shadow-blue-900/10 flex items-center justify-center gap-2 cursor-pointer mt-4 text-sm"
              >
                {bookingLoading ? (
                  <span>Processing Appointment...</span>
                ) : (
                  <>
                    <Calendar size={16} />
                    <span>Confirm & Book OPD Appointment</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Tracker & Emergency Box */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[#0B4F9C]">
                  <Search size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-outfit">Live Appointment Tracker</h3>
                  <p className="text-xs text-slate-500">Check appointment status via Mobile Number or ID</p>
                </div>
              </div>

              <form onSubmit={handleTrack} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter Phone or APT-XXXX"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="bg-[#0B4F9C] hover:bg-[#083B75] text-white text-xs font-bold px-4.5 py-2.5 rounded-xl transition cursor-pointer shadow-xs"
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
                        <span className="font-mono font-black text-[#0B4F9C]">{apt.appointmentNumber}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-slate-700">Patient: <strong className="text-slate-900">{apt.patientName}</strong></p>
                      <p className="text-slate-700">Doctor: <strong>{apt.doctorName}</strong> ({apt.doctorRoom})</p>
                      <p className="text-slate-500 font-medium">Date/Time: {apt.date} • {apt.timeSlot}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-red-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-red-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldCheck size={16} className="text-red-600" />
                <span>24/7 Emergency & Trauma Center</span>
              </h3>
              <p className="text-xs text-slate-700 mb-3 font-medium">
                For urgent trauma, critical surgery, cardiac emergency, or ambulance dispatch:
              </p>
              <div className="bg-white border border-red-200 p-3.5 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] text-red-700 uppercase block font-extrabold">Emergency Hotline</span>
                <span className="text-lg font-black text-red-900 font-mono tracking-wide">
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
