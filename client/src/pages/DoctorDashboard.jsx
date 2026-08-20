import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PrescriptionPrintModal from '../components/PrescriptionPrintModal';
import LabReportModal from '../components/LabReportModal';
import ScanLightboxModal from '../components/ScanLightboxModal';
import { 
  Stethoscope, 
  Users, 
  Bell, 
  Play, 
  CheckCircle2, 
  FileText, 
  Plus, 
  Trash2, 
  FlaskConical, 
  HeartPulse, 
  AlertCircle,
  Pill,
  ArrowRightLeft,
  Image as ImageIcon,
  Eye,
  Settings,
  X,
  Phone,
  Clock
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  const doctorId = user?.doctorId || 'doc-1';
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [allDoctors, setAllDoctors] = useState([]);
  const [labCatalog, setLabCatalog] = useState([]);
  const [medicineInventory, setMedicineInventory] = useState([]);

  // Queue State
  const [myQueue, setMyQueue] = useState([]);
  const [activeToken, setActiveToken] = useState(null);
  const [patientEmr, setPatientEmr] = useState(null);
  const [emrLoading, setEmrLoading] = useState(false);

  // Form State
  const [vitals, setVitals] = useState({ bp: '120/80', pulse: '76', temp: '98.6', spo2: '99', weight: '70' });
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Medicines & Labs
  const [prescribedMeds, setPrescribedMeds] = useState([
    { name: 'Panadol 500mg', dosage: '1 Tab', frequency: '1-0-1', duration: '5 Days', instructions: 'After meal' }
  ]);
  const [orderedLabTests, setOrderedLabTests] = useState([]);

  // Referral Modal
  const [showReferModal, setShowReferModal] = useState(false);
  const [referTargetDocId, setReferTargetDocId] = useState('');
  const [referralNotes, setReferralNotes] = useState('');

  // Self Profile Edit Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    status: 'AVAILABLE',
    timing: '',
    qualification: ''
  });

  // Modals
  const [savedPrescription, setSavedPrescription] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [lightboxData, setLightboxData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadInitialData();

    const unsubscribe = subscribe((event) => {
      if (event.type === 'QUEUE_UPDATED' || event.type === 'REFERRED_PATIENT_CALLED') {
        loadQueue();
      }
      if (event.type === 'LAB_RESULT_READY') {
        if (activeToken) loadPatientEmr(activeToken.patientId);
      }
      if (event.type === 'DOCTORS_UPDATED') {
        loadInitialData();
      }
    });

    return () => unsubscribe();
  }, [doctorId, activeToken?.patientId]);

  const loadInitialData = async () => {
    try {
      const [docsRes, catalogRes, medRes] = await Promise.all([
        api.getDoctors(),
        api.getLabCatalog(),
        api.getInventory()
      ]);
      if (docsRes.success) {
        setAllDoctors(docsRes.doctors);
        const current = docsRes.doctors.find(d => d.id === doctorId) || docsRes.doctors[0];
        if (current) {
          setDoctorProfile(current);
          setProfileForm({
            phone: current.phone || '',
            status: current.status || 'AVAILABLE',
            timing: current.timing || '',
            qualification: current.qualification || ''
          });
          const otherDocs = docsRes.doctors.filter(d => d.id !== current.id);
          if (otherDocs.length > 0) setReferTargetDocId(otherDocs[0].id);
        }
      }
      if (catalogRes.success) setLabCatalog(catalogRes.catalog);
      if (medRes.success) setMedicineInventory(medRes.medicines);

      await loadQueue();
    } catch (e) {
      console.error(e);
    }
  };

  const loadQueue = async () => {
    try {
      const res = await api.getQueue({ doctorId: doctorProfile?.id || doctorId });
      if (res.success) {
        setMyQueue(res.tokens);
        if (!activeToken && res.tokens.length > 0) {
          const inProgress = res.tokens.find(t => t.status === 'CALLING' || t.status === 'IN_CONSULTATION') || res.tokens[0];
          selectPatient(inProgress);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectPatient = async (token) => {
    setActiveToken(token);
    if (token.patientId) {
      loadPatientEmr(token.patientId);
    }
  };

  const loadPatientEmr = async (patientId) => {
    setEmrLoading(true);
    try {
      const res = await api.getPatientEmr(patientId);
      if (res.success) {
        setPatientEmr(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEmrLoading(false);
    }
  };

  const handleCallPatient = async (token) => {
    try {
      const res = await api.updateTokenStatus(token.id, 'CALLING', doctorProfile?.id || doctorId);
      if (res.success) {
        setActiveToken(res.token);
        setAlertMsg({ type: 'success', text: `Calling Token #${token.tokenNumber} (${token.patientName}) to ${doctorProfile?.roomNumber || 'Room'} with Natural English Voice!` });
        loadQueue();
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to call token' });
    }
  };

  const addMedicineRow = () => {
    setPrescribedMeds([
      ...prescribedMeds,
      { name: '', dosage: '1 Tab', frequency: '1-0-1', duration: '5 Days', instructions: 'After meal' }
    ]);
  };

  const updateMedicineRow = (index, field, value) => {
    const updated = [...prescribedMeds];
    updated[index][field] = value;
    setPrescribedMeds(updated);
  };

  const removeMedicineRow = (index) => {
    setPrescribedMeds(prescribedMeds.filter((_, i) => i !== index));
  };

  const toggleLabTest = (test) => {
    const exists = orderedLabTests.find(t => t.testId === test.id);
    if (exists) {
      setOrderedLabTests(orderedLabTests.filter(t => t.testId !== test.id));
    } else {
      setOrderedLabTests([
        ...orderedLabTests,
        { testId: test.id, testName: test.name, priority: 'NORMAL', clinicalNotes: diagnosis || '' }
      ]);
    }
  };

  const handleReferPatient = async (e) => {
    e.preventDefault();
    if (!activeToken || !referTargetDocId) return;

    try {
      const res = await api.referPatient(activeToken.id, referTargetDocId, referralNotes);
      if (res.success) {
        setShowReferModal(false);
        setAlertMsg({ 
          type: 'success', 
          text: `Patient referred to ${res.token.referredToDoctorName}. Patient instructed to proceed to the Reception desk for queue forwarding.` 
        });
        setActiveToken(null);
        loadQueue();
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message || 'Referral failed' });
    }
  };

  const handleSaveSelfProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateDoctorProfile({
        doctorId: doctorProfile?.id || doctorId,
        ...profileForm
      });
      if (res.success) {
        setDoctorProfile(res.doctor);
        setShowProfileModal(false);
        setAlertMsg({ type: 'success', text: 'Your clinical profile and consultation status updated successfully!' });
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const handleSavePrescription = async () => {
    if (!activeToken) {
      setAlertMsg({ type: 'error', text: 'No active patient selected.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tokenId: activeToken.id,
        patientId: activeToken.patientId,
        patientName: activeToken.patientName,
        patientAge: activeToken.patientAge,
        patientGender: activeToken.patientGender,
        doctorId: doctorProfile?.id || doctorId,
        doctorName: doctorProfile?.name || 'Dr. Consultant',
        vitals,
        chiefComplaints,
        diagnosis,
        clinicalNotes,
        medicines: prescribedMeds.filter(m => m.name.trim() !== ''),
        labTests: orderedLabTests,
        followUpDate
      };

      const res = await api.createPrescription(payload);
      if (res.success) {
        setSavedPrescription(res.prescription);
        setShowPrescriptionModal(true);
        setAlertMsg({ type: 'success', text: 'Prescription finalized! Synced to Pharmacy POS and Lab Portal.' });
        
        setChiefComplaints('');
        setDiagnosis('');
        setClinicalNotes('');
        setFollowUpDate('');
        setOrderedLabTests([]);
        loadQueue();
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to save prescription' });
    } finally {
      setSubmitting(false);
    }
  };

  const patientScans = [];
  if (patientEmr?.emr?.labOrders) {
    patientEmr.emr.labOrders.forEach(lo => {
      if (lo.images && lo.images.length > 0) {
        lo.images.forEach(img => {
          patientScans.push({
            imageUrl: img,
            testName: lo.testName,
            date: lo.completedAt || lo.createdAt,
            orderId: lo.id
          });
        });
      }
    });
  }

  const waitingTokens = myQueue.filter(t => t.status === 'WAITING' || t.status === 'REFERRED');
  const completedTokens = myQueue.filter(t => t.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Doctor Header Banner with Assigned Room & Profile Settings */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B4F9C]">
              <Stethoscope size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 font-outfit">{doctorProfile?.name || 'Dr. Consultant'}</h1>
                <span className="bg-emerald-100 text-emerald-800 font-mono text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {doctorProfile?.roomNumber || 'Room 101'}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  doctorProfile?.status === 'SURGERY' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                  doctorProfile?.status === 'ON_LEAVE' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {doctorProfile?.status || 'Active in OPD'}
                </span>
              </div>
              <p className="text-xs text-[#0B4F9C] font-bold">{doctorProfile?.qualification} • {doctorProfile?.specialization}</p>
              <p className="text-[11px] text-slate-500">Al-Shafay Hospital Fatehpur • Electronic Medical Records (EMR)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">In Waiting Queue</span>
              <span className="text-xl font-black text-[#0B4F9C] font-mono">{waitingTokens.length}</span>
            </div>
            <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200 text-center shadow-2xs">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">Completed Today</span>
              <span className="text-xl font-black text-emerald-900 font-mono">{completedTokens.length}</span>
            </div>
            
            <button
              onClick={() => setShowProfileModal(true)}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#0B4F9C] border border-slate-200 transition shadow-2xs cursor-pointer"
              title="My Clinical Settings & Status"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {alertMsg.text && (
          <div className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-2xs ${
            alertMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              {alertMsg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-700" /> : <AlertCircle size={16} className="text-rose-700" />}
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg({ type: '', text: '' })} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Workstation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Live Patient Queue */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#0B4F9C]" />
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide font-outfit">Doctor Patient Queue</h3>
                </div>
                <span className="text-xs bg-blue-50 text-[#0B4F9C] px-2 py-0.5 rounded-full font-mono font-bold border border-blue-200">
                  {myQueue.length} Total
                </span>
              </div>

              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {myQueue.length > 0 ? (
                  myQueue.map((token) => {
                    const isSelected = activeToken?.id === token.id;
                    const isCalling = token.status === 'CALLING';
                    const isDone = token.status === 'COMPLETED';

                    return (
                      <div
                        key={token.id}
                        onClick={() => selectPatient(token)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer relative ${
                          isSelected
                            ? 'bg-blue-50/70 border-[#0B4F9C] shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`font-mono text-base font-black ${isCalling ? 'text-emerald-700 animate-pulse' : 'text-[#0B4F9C]'}`}>
                            #{token.tokenNumber}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isCalling ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            token.status === 'REFERRED' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                            token.status === 'REFERRED_TO_RECEPTION' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                            isDone ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {token.status?.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="font-black text-xs text-slate-900 uppercase truncate font-outfit">{token.patientName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {token.patientAge ? `${token.patientAge} Yrs` : ''} • {token.patientGender} • {token.patientPhone}
                        </p>

                        {token.referralNotes && (
                          <p className="mt-1 text-[10px] text-purple-900 bg-purple-50 p-1.5 rounded-lg border border-purple-200 font-medium">
                            Ref: {token.referralNotes}
                          </p>
                        )}

                        {!isDone && (
                          <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 font-bold">Priority: {token.priority}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCallPatient(token);
                              }}
                              className="bg-[#0B4F9C] hover:bg-[#083B75] text-white font-bold px-3 py-1 rounded-lg text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer"
                            >
                              <Play size={12} />
                              <span>Call Patient</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No patients currently assigned to your queue.
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostic Scans Gallery */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-[#0B4F9C]" />
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase font-outfit">Radiology Scans & X-Rays</h3>
                </div>
                <span className="text-[10px] font-mono bg-blue-50 text-[#0B4F9C] px-2 py-0.5 rounded-full font-bold border border-blue-200">
                  {patientScans.length} Scans
                </span>
              </div>

              {patientScans.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {patientScans.map((scan, idx) => (
                    <div
                      key={idx}
                      onClick={() => setLightboxData({
                        images: patientScans.map(s => s.imageUrl),
                        initialIndex: idx,
                        title: scan.testName,
                        patientName: activeToken?.patientName || 'Patient'
                      })}
                      className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 hover:border-[#0B4F9C] transition cursor-pointer aspect-video shadow-2xs"
                    >
                      <img src={scan.imageUrl} alt={scan.testName} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-1.5 opacity-90 group-hover:opacity-100 transition">
                        <span className="text-[10px] font-bold text-white truncate">{scan.testName}</span>
                        <span className="text-[9px] text-emerald-300 flex items-center gap-0.5">
                          <Eye size={10} /> Inspect Zoom
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs text-center py-4 italic">
                  No radiology scans or X-rays on file for this patient.
                </p>
              )}
            </div>

          </div>

          {/* RIGHT: Patient EMR & Prescription Pad */}
          <div className="lg:col-span-8 space-y-6">
            
            {activeToken ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                
                {/* Active Patient Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-black text-[#0B4F9C] bg-blue-50 px-3 py-0.5 rounded-xl border border-blue-200">
                        #{activeToken.tokenNumber}
                      </span>
                      <h2 className="text-xl font-black text-slate-900 uppercase font-outfit">{activeToken.patientName}</h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Age: {activeToken.patientAge || 'N/A'} Yrs • Gender: {activeToken.patientGender} • Phone: {activeToken.patientPhone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCallPatient(activeToken)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Bell size={14} />
                      <span>Call Patient (Female Voice)</span>
                    </button>

                    <button
                      onClick={() => setShowReferModal(true)}
                      className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <ArrowRightLeft size={14} />
                      <span>Refer Doctor</span>
                    </button>
                  </div>
                </div>

                {/* Patient Vitals */}
                <div>
                  <h3 className="text-xs font-extrabold text-[#0B4F9C] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-outfit">
                    <HeartPulse size={14} className="text-emerald-600" />
                    <span>Patient Vital Signs</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Blood Pressure</label>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={vitals.bp}
                        onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                        className="w-full bg-transparent text-slate-900 font-black font-mono focus:outline-none"
                      />
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Pulse (bpm)</label>
                      <input
                        type="text"
                        placeholder="76"
                        value={vitals.pulse}
                        onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                        className="w-full bg-transparent text-slate-900 font-black font-mono focus:outline-none"
                      />
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Temp (°F)</label>
                      <input
                        type="text"
                        placeholder="98.6"
                        value={vitals.temp}
                        onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                        className="w-full bg-transparent text-slate-900 font-black font-mono focus:outline-none"
                      />
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">SpO2 (%)</label>
                      <input
                        type="text"
                        placeholder="99"
                        value={vitals.spo2}
                        onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                        className="w-full bg-transparent text-slate-900 font-black font-mono focus:outline-none"
                      />
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Weight (kg)</label>
                      <input
                        type="text"
                        placeholder="70"
                        value={vitals.weight}
                        onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                        className="w-full bg-transparent text-slate-900 font-black font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Chief Complaints & Clinical Diagnosis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Chief Complaints / Symptoms</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Chest discomfort, cough, fatigue"
                      value={chiefComplaints}
                      onChange={(e) => setChiefComplaints(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Clinical Diagnosis & Findings *</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Essential Hypertension Grade-II"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white text-xs font-black"
                    />
                  </div>
                </div>

                {/* Digital Prescription Pad (Rx Medicines) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Pill size={16} className="text-[#0B4F9C]" />
                      <h3 className="font-extrabold text-xs text-slate-900 uppercase font-outfit">Prescribed Medicines (Rx)</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addMedicineRow}
                      className="bg-blue-50 hover:bg-blue-100 text-[#0B4F9C] border border-blue-200 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add Medicine</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {prescribedMeds.map((med, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 grid grid-cols-12 gap-2 items-center text-xs">
                        
                        <div className="col-span-12 sm:col-span-4">
                          <input
                            type="text"
                            list={`med-options-${idx}`}
                            placeholder="Medicine Name / Brand"
                            value={med.name}
                            onChange={(e) => updateMedicineRow(idx, 'name', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold text-xs focus:outline-none focus:border-[#0B4F9C]"
                          />
                          <datalist id={`med-options-${idx}`}>
                            {medicineInventory.map(m => (
                              <option key={m.id} value={m.brandName}>{m.genericName} - Stock: {m.stockQuantity}</option>
                            ))}
                          </datalist>
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Dosage (1 Tab)"
                            value={med.dosage}
                            onChange={(e) => updateMedicineRow(idx, 'dosage', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 text-xs font-medium"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <select
                            value={med.frequency}
                            onChange={(e) => updateMedicineRow(idx, 'frequency', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 text-xs font-bold"
                          >
                            <option value="1-0-1">1-0-1 (Twice Daily)</option>
                            <option value="1-1-1">1-1-1 (Thrice Daily)</option>
                            <option value="1-0-0">1-0-0 (Morning)</option>
                            <option value="0-0-1">0-0-1 (Night)</option>
                            <option value="1-0-0-1">1-0-0-1 (4 Times)</option>
                            <option value="SOS">SOS (As needed)</option>
                          </select>
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Duration (5 Days)"
                            value={med.duration}
                            onChange={(e) => updateMedicineRow(idx, 'duration', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 text-xs font-medium"
                          />
                        </div>

                        <div className="col-span-10 sm:col-span-1">
                          <input
                            type="text"
                            placeholder="Instructions"
                            value={med.instructions}
                            onChange={(e) => updateMedicineRow(idx, 'instructions', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 text-xs"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeMedicineRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* Diagnostic Laboratory Requisition */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical size={16} className="text-purple-700" />
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase font-outfit">Diagnostic Lab & Radiology Requisitions</h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {labCatalog.map(test => {
                      const isSelected = orderedLabTests.some(t => t.testId === test.id);
                      return (
                        <button
                          type="button"
                          key={test.id}
                          onClick={() => toggleLabTest(test)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{test.name}</span>
                          {isSelected && <CheckCircle2 size={14} className="text-purple-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Next Follow-up Checkup Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Next Follow-up Checkup Date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Special Advice / Dietary Precautions</label>
                    <input
                      type="text"
                      placeholder="e.g. Low salt diet, regular walking 30 mins, avoid oily food"
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Finalize Prescription Button */}
                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSavePrescription}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-[#0B4F9C] to-[#083B75] hover:from-[#083B75] hover:to-[#0B4F9C] text-white font-black py-3.5 rounded-2xl transition shadow-md shadow-blue-900/15 flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <FileText size={18} />
                    <span>{submitting ? 'Finalizing Prescription...' : 'Finalize Prescription & Complete Consultation'}</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center text-slate-500 text-xs shadow-2xs">
                <Stethoscope size={40} className="mx-auto mb-3 text-[#0B4F9C]" />
                <h3 className="text-base font-bold text-slate-700 uppercase font-outfit">Select a Patient to Begin Consultation</h3>
                <p className="mt-1 max-w-sm mx-auto text-slate-500">
                  Click on any patient in your queue to view electronic medical records, inspect radiology scans, and write digital prescriptions.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* DOCTOR SELF PROFILE EDIT MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#0B4F9C]">
                <Settings size={18} />
                <h3 className="font-black text-base text-slate-900 font-outfit">Doctor Profile & Clinic Settings</h3>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSelfProfile} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-700 font-bold mb-1">Active Consultation Status *</label>
                <select
                  value={profileForm.status}
                  onChange={(e) => setProfileForm({ ...profileForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                >
                  <option value="AVAILABLE">🟢 Available in OPD Clinic</option>
                  <option value="SURGERY">🟣 In OT / Emergency Surgery</option>
                  <option value="ON_LEAVE">🟡 On Break / Away</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">OPD Shift Timings</label>
                <input
                  type="text"
                  placeholder="09:00 AM - 02:00 PM"
                  value={profileForm.timing}
                  onChange={(e) => setProfileForm({ ...profileForm, timing: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Qualification / Degrees</label>
                <input
                  type="text"
                  placeholder="MBBS, FCPS"
                  value={profileForm.qualification}
                  onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-[11px] text-blue-900 font-medium">
                Assigned Clinic: <strong>{doctorProfile?.roomNumber || 'Room 101'}</strong> ({doctorProfile?.departmentName || 'Cardiology'}). Contact Super Admin to reassign rooms.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#0B4F9C] hover:bg-[#083B75] text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Save Profile Settings
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Referral Modal */}
      {showReferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 font-outfit">Refer Patient to 2nd Specialist</h3>
              <p className="text-xs text-slate-500">Patient: {activeToken?.patientName} (#{activeToken?.tokenNumber})</p>
            </div>

            <form onSubmit={handleReferPatient} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Specialist Doctor *</label>
                <select
                  value={referTargetDocId}
                  onChange={(e) => setReferTargetDocId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white font-bold"
                >
                  {allDoctors.filter(d => d.id !== (doctorProfile?.id || doctorId)).map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialization} - {doc.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Referral Clinical Handover Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Referred for cardiac evaluation / specialized ultrasound review"
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white font-medium"
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-[11px] text-purple-900 font-medium">
                ℹ️ Patient will be routed to the <strong>Reception Desk</strong>, where the receptionist will forward the file and trigger the TV screen English announcement.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Send to Reception Desk
                </button>
                <button
                  type="button"
                  onClick={() => setShowReferModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPrescriptionModal && savedPrescription && (
        <PrescriptionPrintModal
          prescription={savedPrescription}
          onClose={() => setShowPrescriptionModal(false)}
        />
      )}

      {lightboxData && (
        <ScanLightboxModal
          images={lightboxData.images}
          initialIndex={lightboxData.initialIndex || 0}
          title={lightboxData.title}
          patientName={lightboxData.patientName}
          onClose={() => setLightboxData(null)}
        />
      )}

    </div>
  );
}
