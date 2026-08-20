import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { announceTokenCall } from '../utils/speech';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Activity, 
  Clock, 
  Stethoscope, 
  Users, 
  BellRing,
  RotateCcw,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

export default function WaitingRoomScreen() {
  const { subscribe, enableAudio, setEnableAudio } = useSocket();
  const [data, setData] = useState({
    hospitalName: 'Al-Shafay Hospital Fatehpur',
    calling: [],
    inConsultation: [],
    waiting: [],
    completed: [],
    latestCall: null
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadDisplayData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const unsubscribe = subscribe((event) => {
      if (event.type === 'TOKEN_CALLED' || event.type === 'REFERRED_PATIENT_CALLED') {
        loadDisplayData();
        const token = event.token;
        const isReferral = event.type === 'REFERRED_PATIENT_CALLED' || Boolean(token?.referredFromDoctorName);
        
        if (enableAudio && token) {
          announceTokenCall(token.tokenNumber, token.patientName, token.doctorName, token.roomNumber, {
            isReferral,
            playChime: true
          });
        }
      } else if (event.type === 'QUEUE_UPDATED') {
        loadDisplayData();
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [enableAudio]);

  const loadDisplayData = async () => {
    try {
      const res = await api.getLiveDisplay();
      if (res.success) {
        setData(res);
      }
    } catch (e) {
      console.error("Failed to load waiting display feed:", e);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(e => console.log(e));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(e => console.log(e));
    }
  };

  const handleReAnnounce = (token) => {
    if (!token) return;
    const isReferral = Boolean(token.referredFromDoctorName);
    announceTokenCall(token.tokenNumber, token.patientName, token.doctorName, token.roomNumber, {
      isReferral,
      playChime: true
    });
  };

  const activeCall = data.calling && data.calling.length > 0 ? data.calling[data.calling.length - 1] : null;
  const isReferralCall = Boolean(activeCall?.referredFromDoctorName);

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 font-sans flex flex-col justify-between overflow-x-hidden select-none">
      
      {/* Top Header Bar with Official Logo */}
      <div className="bg-white border-b-2 border-[#0B4F9C] px-6 py-3.5 flex justify-between items-center shadow-md">
        
        {/* Hospital Branding */}
        <div className="flex items-center gap-4">
          <img 
            src="/logo.png" 
            alt="Al-Shafay Hospital Logo" 
            className="w-14 h-14 object-contain drop-shadow-sm" 
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#0B4F9C] flex items-center gap-3">
              <span>{data.hospitalName || "Al-Shafay Hospital Fatehpur"}</span>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                LIVE OPD QUEUE TV
              </span>
            </h1>
            <p className="text-xs text-emerald-700 font-bold tracking-wide uppercase">
              Outpatient Consultation & Clinical Calling Screen
            </p>
          </div>
        </div>

        {/* Live Clock & Screen Controls */}
        <div className="flex items-center gap-3">
          
          <div className="text-right bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="font-mono text-xl font-black text-[#0B4F9C]">
              {currentTime.toLocaleTimeString('en-US', { hour12: true })}
            </div>
            <div className="text-[11px] text-slate-500 font-bold">
              {currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEnableAudio(!enableAudio)}
              title={enableAudio ? "English Voice Enabled (Click to Mute)" : "Audio Voice Muted"}
              className={`p-3 rounded-2xl border transition cursor-pointer shadow-xs ${
                enableAudio 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 font-bold' 
                  : 'bg-white text-slate-400 border-slate-200'
              }`}
            >
              {enableAudio ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen TV Mode"
              className="p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>

      </div>

      {/* Main Grid: Calling Token Stage & Queue Stream */}
      <div className="flex-1 p-6 sm:p-8 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN: Ultra-Prominent "NOW CALLING" Screen */}
        <div className="lg:col-span-7 flex flex-col">
          <div className={`flex-1 bg-white border-3 rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col justify-between relative overflow-hidden ${
            isReferralCall ? 'border-purple-600 shadow-purple-600/15' : 'border-[#0B4F9C] shadow-blue-900/10'
          }`}>
            
            {/* Top Call Type Badge */}
            <div className="flex justify-between items-center mb-4">
              <div className={`inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full text-sm font-black uppercase tracking-wider ${
                isReferralCall
                  ? 'bg-purple-100 text-purple-900 border-2 border-purple-400 animate-pulse'
                  : 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400 animate-pulse'
              }`}>
                {isReferralCall ? <ArrowRightLeft size={18} /> : <BellRing size={18} />}
                <span>{isReferralCall ? 'Follow-Up Referral Consultation' : 'Now Calling'}</span>
              </div>

              {activeCall && (
                <button
                  onClick={() => handleReAnnounce(activeCall)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#0B4F9C] text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-300 transition cursor-pointer shadow-xs"
                  title="Repeat English Announcement"
                >
                  <RotateCcw size={14} />
                  <span>Repeat Voice Call</span>
                </button>
              )}
            </div>

            {/* Calling Body */}
            {activeCall ? (
              <div className="text-center my-auto space-y-4 py-2">
                
                <div>
                  <span className="text-sm font-black uppercase tracking-widest text-slate-500 block">
                    Active Patient Token Number
                  </span>
                </div>
                
                {/* Big Bold High-Contrast Token Number */}
                <div className={`inline-block px-12 py-4 bg-slate-50 border-3 rounded-3xl shadow-inner ${
                  isReferralCall ? 'border-purple-300' : 'border-blue-200'
                }`}>
                  <span className="text-7xl sm:text-9xl font-black font-mono tracking-tight text-[#0B4F9C] drop-shadow-xs">
                    #{activeCall.tokenNumber}
                  </span>
                </div>

                {/* Patient Name */}
                <div className="space-y-1 pt-2">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Patient Name</span>
                  <h2 className="text-3xl sm:text-5xl font-black uppercase text-slate-900 tracking-wide">
                    {activeCall.patientName}
                  </h2>
                </div>

                {/* Doctor & Room Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-center shadow-2xs">
                    <span className="text-xs uppercase font-bold text-slate-500 block mb-1">Consulting Doctor</span>
                    <span className="text-xl sm:text-2xl font-black text-[#0B4F9C] block">{activeCall.doctorName}</span>
                    <span className="text-xs text-slate-600 font-semibold">{activeCall.departmentName}</span>
                  </div>

                  <div className="bg-gradient-to-tr from-emerald-50 to-teal-50 border-2 border-emerald-500 p-5 rounded-2xl text-center shadow-2xs">
                    <span className="text-xs uppercase font-extrabold text-emerald-800 block mb-1">Please Proceed To</span>
                    <span className="text-3xl sm:text-4xl font-black text-emerald-900 font-mono block">
                      {activeCall.roomNumber || 'Room 101'}
                    </span>
                    <span className="text-xs text-emerald-700 font-bold block mt-0.5">
                      Doctor Consultation Room
                    </span>
                  </div>

                </div>

              </div>
            ) : (
              <div className="text-center my-auto py-16 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#0B4F9C]/50 shadow-xs">
                  <Activity size={36} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-600 uppercase">Consultations In Progress</h3>
                <p className="text-sm text-slate-500 font-medium">Please have your OPD receipt ready and wait for your token number.</p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500 flex justify-between items-center font-medium">
              <span>Al-Shafay Hospital Automated Queue Engine</span>
              <span className="text-emerald-700 font-bold">Clear English Audio Calling Active</span>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Queue Lists (Waiting & In Consultation) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Section: Next in Line */}
          <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="text-[#0B4F9C]" size={18} />
                <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wide">Next in Line</h3>
              </div>
              <span className="bg-blue-50 text-[#0B4F9C] font-mono font-black text-xs px-3 py-1 rounded-full border border-blue-200">
                {data.waiting?.length || 0} Waiting
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
              {data.waiting && data.waiting.length > 0 ? (
                data.waiting.map((t, idx) => (
                  <div 
                    key={t.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex justify-between items-center transition hover:bg-slate-100 hover:border-slate-300"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xl font-black text-[#0B4F9C] bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                        #{t.tokenNumber}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-slate-900 uppercase truncate max-w-[170px]">{t.patientName}</p>
                        <p className="text-[11px] text-slate-600 font-medium">{t.doctorName} • {t.roomNumber}</p>
                      </div>
                    </div>

                    <span className="text-[11px] uppercase font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      Queue #{idx + 1}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  All waiting tokens have been called.
                </div>
              )}
            </div>
          </div>

          {/* Section: Doctors Active Consultations */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md">
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="text-emerald-600" size={18} />
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">In Consultation</h3>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">● Active Now</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {data.inConsultation && data.inConsultation.length > 0 ? (
                data.inConsultation.map((t) => (
                  <div key={t.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="font-mono text-base font-black text-emerald-700 block">#{t.tokenNumber}</span>
                    <p className="font-bold text-xs text-slate-900 truncate uppercase">{t.patientName}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{t.roomNumber} ({t.doctorName})</p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-4 text-center text-slate-400 text-xs">
                  Doctors are ready for the next patient.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Ticker */}
      <div className="bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-700 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <span className="font-black text-white bg-[#0B4F9C] uppercase tracking-wider text-[10px] px-2 py-0.5 rounded">
            Notice
          </span>
          <span className="font-medium text-slate-700">
            Please present your token receipt upon entering the doctor's room. For inquiries, visit the reception desk.
          </span>
        </div>
        <div className="text-[11px] text-[#0B4F9C] font-bold hidden md:block">
          Al-Shafay Hospital Fatehpur • 24/7 Helpline: 0300-1234567
        </div>
      </div>

    </div>
  );
}
