import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import ThermalSlipModal from '../components/ThermalSlipModal';
import LabReportModal from '../components/LabReportModal';
import { announceTokenIssuance } from '../utils/speech';
import { unlockAudioContext } from '../utils/soundEffects';
import { 
  UserPlus, 
  Ticket, 
  Printer, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Stethoscope, 
  FlaskConical, 
  ArrowRight,
  RefreshCw,
  ArrowRightLeft,
  BellRing,
  Volume2
} from 'lucide-react';

export default function ReceptionDashboard() {
  const { subscribe } = useSocket();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [queue, setQueue] = useState([]);
  const [queueStats, setQueueStats] = useState({ total: 0, waiting: 0, calling: 0, completed: 0, referredToReception: 0 });
  const [labOrders, setLabOrders] = useState([]);

  const [activeTab, setActiveTab] = useState('registration');

  // Form State
  const [form, setForm] = useState({
    patientName: '',
    patientPhone: '',
    patientCnic: '',
    patientAge: '',
    patientGender: 'Male',
    departmentId: '',
    doctorId: '',
    priority: 'NORMAL',
    fee: 1000
  });

  const [createdToken, setCreatedToken] = useState(null);
  const [showThermalSlip, setShowThermalSlip] = useState(false);
  const [selectedLabReport, setSelectedLabReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Patient Lookup
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [labQuery, setLabQuery] = useState('');

  useEffect(() => {
    loadData();

    const unsubscribe = subscribe((event) => {
      if (event.type === 'QUEUE_UPDATED' || event.type === 'TOKEN_CALLED' || event.type === 'REFERRED_PATIENT_CALLED') {
        loadQueue();
      }
      if (event.type === 'LAB_ORDER_UPDATED' || event.type === 'LAB_RESULT_READY') {
        loadLabOrders();
      }
      if (event.type === 'DOCTORS_UPDATED') {
        loadData();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const [deptRes, queueRes, labRes] = await Promise.all([
        api.getDepartments(),
        api.getQueue(),
        api.getLabOrders()
      ]);
      if (deptRes.success) {
        setDepartments(deptRes.departments);
        if (deptRes.departments.length > 0) {
          handleDeptChange(deptRes.departments[0].id);
        }
      }
      if (queueRes.success) {
        setQueue(queueRes.tokens);
        setQueueStats(queueRes.stats);
      }
      if (labRes.success) {
        setLabOrders(labRes.orders);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadQueue = async () => {
    try {
      const res = await api.getQueue();
      if (res.success) {
        setQueue(res.tokens);
        setQueueStats(res.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadLabOrders = async () => {
    try {
      const res = await api.getLabOrders();
      if (res.success) {
        setLabOrders(res.orders);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeptChange = async (deptId) => {
    setForm(prev => ({ ...prev, departmentId: deptId, doctorId: '' }));
    try {
      const docRes = await api.getDoctors(deptId);
      if (docRes.success) {
        setDoctors(docRes.doctors);
        if (docRes.doctors.length > 0) {
          setForm(prev => ({
            ...prev,
            doctorId: docRes.doctors[0].id,
            fee: docRes.doctors[0].consultationFee || 1000
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDoctorSelect = (docId) => {
    const doc = doctors.find(d => d.id === docId);
    setForm(prev => ({
      ...prev,
      doctorId: docId,
      fee: doc ? doc.consultationFee : 1000
    }));
  };

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    unlockAudioContext(); // Unlock audio context on user interaction

    if (!form.patientName || !form.doctorId) {
      setMsg({ type: 'error', text: 'Patient Name and Doctor are required.' });
      return;
    }

    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await api.generateToken(form);
      if (res.success) {
        setCreatedToken(res.token);
        setShowThermalSlip(true);
        setMsg({ type: 'success', text: `Token #${res.token.tokenNumber} generated and forwarded to ${res.token.doctorName}!` });
        
        // Automated voice announcement
        announceTokenIssuance(
          res.token.tokenNumber,
          res.token.patientName,
          res.token.doctorName,
          res.token.roomNumber
        );

        setForm(prev => ({
          ...prev,
          patientName: '',
          patientPhone: '',
          patientCnic: '',
          patientAge: '',
          patientGender: 'Male',
          priority: 'NORMAL'
        }));
        loadQueue();
      } else {
        setMsg({ type: 'error', text: res.message || 'Failed to generate token' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleForwardReferredPatient = async (token) => {
    setLoading(true);
    try {
      const res = await api.forwardReferredPatient(token.id, 'EMERGENCY');
      if (res.success) {
        setMsg({ 
          type: 'success', 
          text: `Patient ${token.patientName} (Token #${token.tokenNumber}) forwarded to ${res.token.doctorName} (${res.token.roomNumber})! English Voice announcement triggered on TV screen.` 
        });
        loadQueue();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to forward patient' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPatient = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.searchPatients(searchQuery);
      if (res.success) {
        setSearchResults(res.patients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectExistingPatient = (pat) => {
    setForm(prev => ({
      ...prev,
      patientName: pat.name,
      patientPhone: pat.phone || '',
      patientCnic: pat.cnic || '',
      patientAge: pat.age || '',
      patientGender: pat.gender || 'Male'
    }));
    setActiveTab('registration');
    setMsg({ type: 'success', text: `Loaded details for ${pat.name} (${pat.mrn})` });
  };

  const completedReports = labOrders.filter(o => 
    o.status === 'COMPLETED' &&
    (!labQuery || o.patientName.toLowerCase().includes(labQuery.toLowerCase()) || o.testName.toLowerCase().includes(labQuery.toLowerCase()) || o.id.includes(labQuery))
  );

  const referredPatientsAtReception = queue.filter(t => t.status === 'REFERRED_TO_RECEPTION');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header & Overview Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B4F9C] border border-blue-200 uppercase">
                Front Desk Counter
              </span>
              <span className="text-xs text-slate-500 font-semibold">Reception & Triage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight mt-1">
              Reception Desk & Token Generator
            </h1>
            <p className="text-xs text-slate-500 font-medium">Al-Shafay Hospital Fatehpur • Real-Time Doctor Queue Forwarding</p>
          </div>

          {/* Counters */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-center shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Tokens</span>
              <span className="text-xl font-black text-[#0B4F9C] font-mono">{queueStats.total}</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl px-4 py-2 text-center shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Referred at Desk</span>
              <span className="text-xl font-black text-purple-900 font-mono">{referredPatientsAtReception.length}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 text-center shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Waiting</span>
              <span className="text-xl font-black text-emerald-900 font-mono">{queueStats.waiting}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('registration')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'registration'
                ? 'bg-[#0B4F9C] text-white shadow-md shadow-blue-900/15'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserPlus size={16} />
            <span>New Patient Registration & Token</span>
          </button>

          <button
            onClick={() => setActiveTab('referred-queue')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer relative ${
              activeTab === 'referred-queue'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-900/15'
                : 'bg-white text-slate-600 hover:bg-purple-50 border border-slate-200'
            }`}
          >
            <ArrowRightLeft size={16} />
            <span>Referred Patients Queue</span>
            {referredPatientsAtReception.length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                {referredPatientsAtReception.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-[#0B4F9C] text-white shadow-md shadow-blue-900/15'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Ticket size={16} />
            <span>Live OPD Queue ({queue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('lab-reports')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'lab-reports'
                ? 'bg-[#0B4F9C] text-white shadow-md shadow-blue-900/15'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FlaskConical size={16} />
            <span>Lab Reports Center ({completedReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('patient-search')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'patient-search'
                ? 'bg-[#0B4F9C] text-white shadow-md shadow-blue-900/15'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Search size={16} />
            <span>Patient Search</span>
          </button>
        </div>

        {/* Alerts */}
        {msg.text && (
          <div className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2 ${
            msg.type === 'success' ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              {msg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-700" /> : <AlertCircle size={16} className="text-rose-700" />}
              <span>{msg.text}</span>
            </div>
            <button onClick={() => setMsg({ type: '', text: '' })} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* TAB 1: Patient Registration */}
        {activeTab === 'registration' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[#0B4F9C]">
                    <Ticket size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Generate OPD Slip / Parchi</h2>
                    <p className="text-xs text-slate-500">Issues thermal token and forwards file directly to doctor queue</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('patient-search')}
                  className="text-xs font-bold text-[#0B4F9C] hover:underline flex items-center gap-1"
                >
                  <Search size={14} />
                  <span>Existing Patient Lookup</span>
                </button>
              </div>

              <form onSubmit={handleGenerateToken} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Muhammad Tariq"
                      value={form.patientName}
                      onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phone Number (Mobile)</label>
                    <input
                      type="tel"
                      placeholder="0300-1234567"
                      value={form.patientPhone}
                      onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Age (Years)</label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      value={form.patientAge}
                      onChange={(e) => setForm({ ...form, patientAge: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Gender</label>
                    <select
                      value={form.patientGender}
                      onChange={(e) => setForm({ ...form, patientGender: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition text-xs font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Child">Child</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">CNIC (Optional)</label>
                    <input
                      type="text"
                      placeholder="32203-XXXXXXX-X"
                      value={form.patientCnic}
                      onChange={(e) => setForm({ ...form, patientCnic: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Department *</label>
                    <select
                      value={form.departmentId}
                      onChange={(e) => handleDeptChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition text-xs font-medium"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Assigned Doctor *</label>
                    <select
                      required
                      value={form.doctorId}
                      onChange={(e) => handleDoctorSelect(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition text-xs font-bold"
                    >
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} - {doc.specialization} ({doc.roomNumber}) - Fee: Rs. {doc.consultationFee}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Queue Priority</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['NORMAL', 'EMERGENCY', 'ELDERLY'].map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setForm({ ...form, priority: p })}
                          className={`py-2 rounded-xl text-[11px] font-bold border transition ${
                            form.priority === p
                              ? p === 'EMERGENCY'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : 'bg-[#0B4F9C] text-white border-[#0B4F9C] shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Consultation Fee (PKR)</label>
                    <input
                      type="number"
                      value={form.fee}
                      onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono font-bold text-xs focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#0B4F9C] to-[#083B75] hover:from-[#083B75] hover:to-[#0B4F9C] text-white font-black py-3.5 rounded-xl transition shadow-md shadow-blue-900/10 flex items-center justify-center gap-2 cursor-pointer mt-4 text-sm"
                >
                  {loading ? (
                    <span>Generating Parchi...</span>
                  ) : (
                    <>
                      <Printer size={18} />
                      <span>Generate Token & Print Thermal Parchi (80mm)</span>
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* Quick Preview Card */}
            <div className="lg:col-span-4 space-y-6">
              {createdToken ? (
                <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-[#0B4F9C] uppercase tracking-wider">Latest Issued Parchi</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                      In Doctor Queue
                    </span>
                  </div>

                  <div className="text-center bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4">
                    <span className="text-xs text-slate-500 font-bold uppercase block">Token Number</span>
                    <span className="text-4xl font-black text-[#0B4F9C] font-mono">#{createdToken.tokenNumber}</span>
                    <p className="text-xs font-black text-slate-900 mt-1 uppercase">{createdToken.patientName}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{createdToken.doctorName} • {createdToken.roomNumber}</p>
                  </div>

                  <button
                    onClick={() => setShowThermalSlip(true)}
                    className="w-full bg-[#0B4F9C] hover:bg-[#083B75] text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md cursor-pointer"
                  >
                    <Printer size={15} />
                    <span>Re-print Thermal Slip (80mm)</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center text-slate-500 text-xs shadow-2xs">
                  <Ticket size={32} className="mx-auto mb-2 text-[#0B4F9C]" />
                  <p className="font-bold text-slate-700">Ready to issue token</p>
                  <p className="text-[11px] mt-1 text-slate-500">Generated slips will appear here for instant preview and re-printing.</p>
                </div>
              )}

              {/* Active Duty Doctors */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Stethoscope size={15} className="text-emerald-600" />
                    <span>Active Doctors On Duty</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-extrabold">● Online</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  {doctors.slice(0, 4).map(d => {
                    const waitingCount = queue.filter(q => q.doctorId === d.id && (q.status === 'WAITING' || q.status === 'REFERRED')).length;
                    return (
                      <div key={d.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div>
                          <p className="font-bold text-slate-900">{d.name}</p>
                          <p className="text-[10px] text-slate-500">{d.specialization} ({d.roomNumber})</p>
                        </div>
                        <span className="bg-blue-50 text-[#0B4F9C] text-[10px] font-bold px-2 py-1 rounded-lg border border-blue-200">
                          {waitingCount} waiting
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Referred Patients Queue */}
        {activeTab === 'referred-queue' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="text-purple-700" size={20} />
                  <h2 className="text-lg font-black text-slate-900 uppercase">Referred Patients Intake Queue</h2>
                </div>
                <p className="text-xs text-slate-500">Patients transferred from doctor consultations arriving at reception desk</p>
              </div>
              <span className="bg-purple-100 text-purple-900 px-3 py-1 rounded-full text-xs font-mono font-black border border-purple-300">
                {referredPatientsAtReception.length} Awaiting Forwarding
              </span>
            </div>

            <div className="space-y-3">
              {referredPatientsAtReception.length > 0 ? (
                referredPatientsAtReception.map((patient) => (
                  <div key={patient.id} className="bg-slate-50 border border-purple-200 hover:border-purple-500 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition shadow-2xs">
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-300">
                          #{patient.tokenNumber}
                        </span>
                        <h3 className="font-black text-slate-900 uppercase text-base">{patient.patientName}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          Referred from {patient.referredFromDoctorName || 'Doctor'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700">
                        <span>Forward Target: </span>
                        <strong className="text-[#0B4F9C] font-bold">{patient.referredToDoctorName || patient.doctorName}</strong>
                        <span className="text-slate-500"> ({patient.targetRoomNumber || patient.roomNumber})</span>
                      </div>

                      {patient.referralNotes && (
                        <p className="text-xs text-purple-900 bg-purple-50 p-2 rounded-xl border border-purple-200 font-medium">
                          Notes: "{patient.referralNotes}"
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleForwardReferredPatient(patient)}
                      disabled={loading}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/10 cursor-pointer"
                    >
                      <BellRing size={16} />
                      <span>Forward to Dr. {patient.referredToDoctorName || 'Doctor'} & Announce on TV</span>
                    </button>

                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <ArrowRightLeft size={36} className="mx-auto mb-2 text-purple-400" />
                  <p className="font-bold text-slate-700">No referred patients currently waiting at Reception.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Live OPD Queue */}
        {activeTab === 'queue' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">Live OPD Patient Queue</h2>
                <p className="text-xs text-slate-500">Real-time status across all consultation rooms</p>
              </div>
              <button
                onClick={loadQueue}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition"
              >
                <RefreshCw size={14} />
                <span>Refresh Queue</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Patient Details</th>
                    <th className="py-3 px-4">Department / Doctor</th>
                    <th className="py-3 px-4">Room #</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {queue.length > 0 ? (
                    queue.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-black text-sm text-[#0B4F9C]">
                          #{t.tokenNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 uppercase">{t.patientName}</p>
                          <p className="text-[10px] text-slate-500">{t.patientAge ? `${t.patientAge} Yrs` : ''} • {t.patientGender} • {t.patientPhone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{t.doctorName}</p>
                          <p className="text-[10px] text-slate-500">{t.departmentName}</p>
                        </td>
                        <td className="py-3 px-4 font-black text-[#0B4F9C]">
                          {t.roomNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.priority === 'EMERGENCY' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            t.status === 'CALLING' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse' :
                            t.status === 'IN_CONSULTATION' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            t.status === 'REFERRED_TO_RECEPTION' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            t.status === 'REFERRED' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {t.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setCreatedToken(t);
                              setShowThermalSlip(true);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2 rounded-lg text-xs inline-flex items-center gap-1 transition"
                            title="Print Thermal Slip"
                          >
                            <Printer size={14} />
                            <span className="hidden sm:inline">Parchi</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No tokens generated for today yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Lab Reports Center */}
        {activeTab === 'lab-reports' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">Lab Reports Dispatch Center</h2>
                <p className="text-xs text-slate-500">Print finalized verified diagnostic test reports and scans for patients</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by Patient / Test..."
                  value={labQuery}
                  onChange={(e) => setLabQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedReports.length > 0 ? (
                completedReports.map((report) => (
                  <div key={report.id} className="bg-slate-50 border border-slate-200 hover:border-[#0B4F9C] rounded-2xl p-5 transition space-y-3 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#0B4F9C] uppercase">
                          #{report.id?.slice(-6).toUpperCase()}
                        </span>
                        <h3 className="font-black text-slate-900 text-sm uppercase">{report.patientName}</h3>
                        <p className="text-[11px] text-slate-500">{report.patientAge ? `${report.patientAge} Yrs` : ''} • {report.patientGender}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Verified
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                      <p className="font-bold text-[#0B4F9C]">{report.testName}</p>
                      <p className="text-[11px] text-slate-500">Doctor: {report.doctorName}</p>
                      {report.images && report.images.length > 0 && (
                        <p className="text-[10px] text-purple-700 font-bold">🩻 {report.images.length} Scan Attachment(s)</p>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedLabReport(report)}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-[#0B4F9C] border border-blue-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>View & Print Official A4 Report</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                  <FlaskConical size={32} className="mx-auto mb-2 text-[#0B4F9C]" />
                  <p>No verified completed laboratory reports found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Patient Search */}
        {activeTab === 'patient-search' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Patient Record & MRN Search</h2>
              <p className="text-xs text-slate-500">Search patient database by Phone Number, Name, MRN, or CNIC</p>
            </div>

            <form onSubmit={handleSearchPatient} className="flex gap-2 max-w-xl mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Phone, Name, MRN or CNIC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="bg-[#0B4F9C] hover:bg-[#083B75] text-white text-xs font-bold px-5 rounded-xl transition cursor-pointer"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </form>

            <div className="space-y-3">
              {searchResults.length > 0 ? (
                searchResults.map((pat) => (
                  <div key={pat.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0B4F9C] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {pat.mrn}
                        </span>
                        <h3 className="font-black text-slate-900 uppercase">{pat.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Phone: {pat.phone} • Age: {pat.age || 'N/A'} • Gender: {pat.gender} {pat.cnic ? `• CNIC: ${pat.cnic}` : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectExistingPatient(pat)}
                      className="bg-[#0B4F9C] hover:bg-[#083B75] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Issue Token</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {searchQuery ? 'No matching patients found.' : 'Enter search terms above to lookup past patient history.'}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {showThermalSlip && createdToken && (
        <ThermalSlipModal
          token={createdToken}
          onClose={() => setShowThermalSlip(false)}
        />
      )}

      {selectedLabReport && (
        <LabReportModal
          order={selectedLabReport}
          onClose={() => setSelectedLabReport(null)}
        />
      )}

    </div>
  );
}
