import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  FlaskConical, 
  Pill, 
  Calendar, 
  Clock, 
  FileText,
  UserPlus,
  Stethoscope,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Key,
  Shield,
  Phone,
  DoorOpen,
  Power,
  Search,
  X,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { subscribe } = useSocket();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'doctors' | 'staff'

  // Overview Data
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Doctors State
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    qualification: 'MBBS, FCPS',
    departmentId: '',
    specialization: '',
    roomNumber: 'Room 101',
    timing: '09:00 AM - 03:00 PM',
    phone: '+92 300 0000000',
    status: 'AVAILABLE',
    username: '',
    password: ''
  });

  // Staff State
  const [staffUsers, setStaffUsers] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'receptionist',
    department: 'Reception Desk',
    counterDesk: 'Counter 1',
    email: '',
    active: true
  });

  // Feedback Toasts
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadAllData();

    const unsubscribe = subscribe((event) => {
      if (event.type === 'DOCTORS_UPDATED') {
        loadDoctors();
      }
      if (event.type === 'STAFF_UPDATED') {
        loadStaffUsers();
      }
      if (event.type === 'QUEUE_UPDATED' || event.type === 'PRESCRIPTION_CREATED' || event.type === 'LAB_RESULT_READY') {
        loadOverview();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOverview(),
        loadDoctors(),
        loadStaffUsers(),
        loadDepartments()
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadOverview = async () => {
    try {
      const res = await api.getAnalyticsOverview();
      if (res.success) setData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await api.getDoctors();
      if (res.success) setDoctors(res.doctors);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStaffUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.success) setStaffUsers(res.users);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await api.getDepartments();
      if (res.success) {
        setDepartments(res.departments);
        if (res.departments.length > 0 && !doctorForm.departmentId) {
          setDoctorForm(prev => ({
            ...prev,
            departmentId: res.departments[0].id,
            specialization: res.departments[0].name
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (type, text) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg({ type: '', text: '' }), 5000);
  };

  // ==========================================
  // DOCTOR ACTIONS
  // ==========================================
  const handleOpenDoctorModal = (doc = null) => {
    if (doc) {
      setEditingDoctor(doc);
      setDoctorForm({
        name: doc.name || '',
        qualification: doc.qualification || 'MBBS',
        departmentId: doc.departmentId || (departments[0]?.id || ''),
        specialization: doc.specialization || '',
        roomNumber: doc.roomNumber || 'Room 101',
        timing: doc.timing || '09:00 AM - 03:00 PM',
        phone: doc.phone || '',
        status: doc.status || (doc.isAvailable ? 'AVAILABLE' : 'INACTIVE'),
        username: '',
        password: ''
      });
    } else {
      setEditingDoctor(null);
      setDoctorForm({
        name: '',
        qualification: 'MBBS, FCPS',
        departmentId: departments[0]?.id || '',
        specialization: departments[0]?.name || 'Cardiology Specialist',
        roomNumber: 'Room 10' + (doctors.length + 1),
        timing: '09:00 AM - 03:00 PM',
        phone: '+92 300 ',
        status: 'AVAILABLE',
        username: '',
        password: ''
      });
    }
    setShowDoctorModal(true);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        const res = await api.updateDoctor(editingDoctor.id, doctorForm);
        if (res.success) {
          showToast('success', `Doctor ${res.doctor.name} updated successfully! Synced across all workstations.`);
          setShowDoctorModal(false);
          loadDoctors();
        }
      } else {
        const res = await api.addDoctor(doctorForm);
        if (res.success) {
          showToast('success', `Doctor ${res.doctor.name} added successfully! Live across Reception, Public Portal & TV Screen.`);
          setShowDoctorModal(false);
          loadDoctors();
        }
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to save doctor details');
    }
  };

  const handleToggleDoctorStatus = async (docId, newStatus) => {
    try {
      const res = await api.updateDoctorStatus(docId, newStatus);
      if (res.success) {
        showToast('success', `Doctor status updated to ${newStatus}. Immediate real-time sync completed.`);
        loadDoctors();
      }
    } catch (err) {
      showToast('error', 'Status update failed');
    }
  };

  const handleDeleteDoctor = async (doc) => {
    if (!window.confirm(`Are you sure you want to remove ${doc.name}? Their login credentials and clinical clinic records will be archived.`)) {
      return;
    }
    try {
      const res = await api.deleteDoctor(doc.id);
      if (res.success) {
        showToast('success', `Doctor ${doc.name} removed from active roster.`);
        loadDoctors();
      }
    } catch (err) {
      showToast('error', 'Failed to delete doctor');
    }
  };

  // ==========================================
  // STAFF ACTIONS
  // ==========================================
  const handleOpenStaffModal = (user = null) => {
    if (user) {
      setEditingStaff(user);
      setStaffForm({
        name: user.name || '',
        username: user.username || '',
        password: '',
        role: user.role || 'receptionist',
        department: user.department || 'Outpatient Services',
        counterDesk: user.counterDesk || 'Counter 1',
        email: user.email || '',
        active: user.active !== false
      });
    } else {
      setEditingStaff(null);
      setStaffForm({
        name: '',
        username: '',
        password: '',
        role: 'receptionist',
        department: 'Reception Desk',
        counterDesk: 'Counter 1',
        email: '',
        active: true
      });
    }
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        const res = await api.updateUser(editingStaff.id, staffForm);
        if (res.success) {
          showToast('success', `Staff member ${res.user.name} updated successfully!`);
          setShowStaffModal(false);
          loadStaffUsers();
        }
      } else {
        const res = await api.addUser(staffForm);
        if (res.success) {
          showToast('success', `New staff account ${res.user.username} created successfully! Role: ${res.user.role.toUpperCase()}`);
          setShowStaffModal(false);
          loadStaffUsers();
        }
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to save staff account');
    }
  };

  const handleToggleStaffStatus = async (userId, currentActive) => {
    try {
      const res = await api.updateUserStatus(userId, !currentActive);
      if (res.success) {
        showToast('success', `Staff status updated to ${!currentActive ? 'Active' : 'Deactivated'}`);
        loadStaffUsers();
      }
    } catch (err) {
      showToast('error', 'Status update failed');
    }
  };

  const handleDeleteStaff = async (user) => {
    if (!window.confirm(`Are you sure you want to delete staff account ${user.username} (${user.name})?`)) {
      return;
    }
    try {
      const res = await api.deleteUser(user.id);
      if (res.success) {
        showToast('success', `Staff account ${user.username} deleted.`);
        loadStaffUsers();
      }
    } catch (err) {
      showToast('error', 'Failed to delete staff member');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-slate-500 font-bold text-sm">Loading Executive Administration Workstation...</div>
      </div>
    );
  }

  const revenue = data?.revenue || { opd: 0, pharmacy: 0, lab: 0, total: 0 };
  const footfall = data?.footfall || { tokensToday: 0, completedConsultations: 0 };

  const filteredDoctors = doctors.filter(d => 
    !doctorSearch ||
    d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.specialization.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.roomNumber.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.departmentName.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const filteredStaff = staffUsers.filter(u => 
    !staffSearch ||
    u.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(staffSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(staffSearch.toLowerCase()) ||
    u.department.toLowerCase().includes(staffSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B4F9C]">
              <TrendingUp size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 uppercase font-outfit">Super Admin Workstation</h1>
                <span className="bg-blue-50 text-[#0B4F9C] font-mono text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-200">
                  Full CRUD Management
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Al-Shafay Hospital Fatehpur • Real-Time Doctor Management, Staff RBAC, and Executive Analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200 text-center shadow-2xs">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">Hospital Total Revenue</span>
              <span className="text-xl font-black text-emerald-900 font-mono">Rs. {revenue.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Toast Feedback Alert */}
        {toastMsg.text && (
          <div className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-sm ${
            toastMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {toastMsg.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-700 shrink-0" /> : <AlertCircle size={18} className="text-rose-700 shrink-0" />}
              <span>{toastMsg.text}</span>
            </div>
            <button onClick={() => setToastMsg({ type: '', text: '' })} className="text-slate-400 hover:text-slate-700 p-1">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Tab Navigation Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#0B4F9C] text-white shadow-md shadow-blue-900/15'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <TrendingUp size={16} />
              <span>Executive Overview & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer relative ${
                activeTab === 'doctors'
                  ? 'bg-[#0B4F9C] text-white shadow-md shadow-blue-900/15'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Stethoscope size={16} />
              <span>Doctor Management ({doctors.length})</span>
              <span className="bg-emerald-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-black">
                CRUD
              </span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer relative ${
                activeTab === 'staff'
                  ? 'bg-[#0B4F9C] text-white shadow-md shadow-blue-900/15'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users size={16} />
              <span>Staff & User Roles ({staffUsers.length})</span>
            </button>
          </div>

          {activeTab === 'doctors' && (
            <button
              onClick={() => handleOpenDoctorModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-900/15 transition cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Add New Doctor</span>
            </button>
          )}

          {activeTab === 'staff' && (
            <button
              onClick={() => handleOpenStaffModal()}
              className="bg-[#0B4F9C] hover:bg-[#083B75] text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-blue-900/15 transition cursor-pointer"
            >
              <UserPlus size={16} />
              <span>+ Add New Staff Member</span>
            </button>
          )}

        </div>

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-slate-500">OPD Consultation Fees</span>
                  <div className="p-2 bg-blue-50 rounded-xl text-[#0B4F9C]"><Users size={16} /></div>
                </div>
                <p className="text-2xl font-black text-slate-900 font-mono">Rs. {revenue.opd.toLocaleString()}</p>
                <p className="text-[11px] text-emerald-700 font-semibold">{footfall.tokensToday} Tokens Registered Today</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Diagnostic Lab & Radiology</span>
                  <div className="p-2 bg-purple-50 rounded-xl text-purple-700"><FlaskConical size={16} /></div>
                </div>
                <p className="text-2xl font-black text-slate-900 font-mono">Rs. {revenue.lab.toLocaleString()}</p>
                <p className="text-[11px] text-purple-700 font-semibold">{data?.labOrders?.length || 0} Test Orders Processed</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Pharmacy & Store Sales</span>
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-700"><Pill size={16} /></div>
                </div>
                <p className="text-2xl font-black text-slate-900 font-mono">Rs. {revenue.pharmacy.toLocaleString()}</p>
                <p className="text-[11px] text-amber-700 font-semibold">{data?.invoices?.length || 0} Retail Sales Invoices</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Completed Consultations</span>
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700"><Activity size={16} /></div>
                </div>
                <p className="text-2xl font-black text-slate-900 font-mono">{footfall.completedConsultations}</p>
                <p className="text-[11px] text-slate-500 font-semibold">{doctors.length} Registered Doctors</p>
              </div>
            </div>

            {/* Performance & Audit Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h2 className="text-base font-black text-slate-900 uppercase font-outfit">Consultant Doctor Performance</h2>
                  <span className="text-xs text-slate-500 font-semibold">Active clinics</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Doctor</th>
                        <th className="py-2.5 px-3">Specialty</th>
                        <th className="py-2.5 px-3">Room</th>
                        <th className="py-2.5 px-3 font-mono">Patients</th>
                        <th className="py-2.5 px-3 font-mono">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data?.doctorPerformance?.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{doc.name}</td>
                          <td className="py-2.5 px-3 text-slate-600">{doc.specialization}</td>
                          <td className="py-2.5 px-3 font-mono text-[#0B4F9C] font-bold">{doc.roomNumber}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{doc.patientsSeen}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">Rs. {doc.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h2 className="text-base font-black text-slate-900 uppercase font-outfit">Hospital Audit Logs</h2>
                  <span className="text-[10px] text-emerald-700 font-extrabold">Live Stream</span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs">
                  {data?.auditLogs && data.auditLogs.slice(0, 8).map((log, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex justify-between items-center shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{log.action?.replace('_', ' ')}</span>
                        <span className="text-[10px] text-slate-500">{log.user || 'System'} • {log.details}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: DOCTOR MANAGEMENT (FULL CRUD) */}
        {activeTab === 'doctors' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase font-outfit">Doctor Profiles & OPD Clinics</h2>
                <p className="text-xs text-slate-500">Dynamically add, edit room numbers, set schedules, or toggle leave status</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctor by name, specialty, room..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Doctor Name & Qualification</th>
                    <th className="py-3 px-4">Department & Specialty</th>
                    <th className="py-3 px-4">Room #</th>
                    <th className="py-3 px-4">OPD Shift Timing</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Availability Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDoctors.map(doc => {
                    const isAvail = doc.status === 'AVAILABLE' || doc.status === 'ACTIVE' || (doc.isAvailable && !doc.status);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <strong className="text-slate-900 block font-bold text-sm">{doc.name}</strong>
                          <span className="text-[11px] text-[#0B4F9C] font-semibold">{doc.qualification}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">{doc.departmentName}</span>
                          <span className="text-[10px] text-slate-500">{doc.specialization}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-[#0B4F9C]">
                          <span className="bg-blue-50 px-2 py-1 rounded border border-blue-200">{doc.roomNumber}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {doc.timing}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {doc.phone || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={doc.status || (isAvail ? 'AVAILABLE' : 'INACTIVE')}
                            onChange={(e) => handleToggleDoctorStatus(doc.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border cursor-pointer ${
                              isAvail ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              doc.status === 'ON_LEAVE' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                              doc.status === 'SURGERY' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                              'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            <option value="AVAILABLE">Active / Available</option>
                            <option value="ON_LEAVE">On Leave</option>
                            <option value="SURGERY">In OT / Surgery</option>
                            <option value="INACTIVE">Inactive (Hidden)</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenDoctorModal(doc)}
                            className="bg-blue-50 hover:bg-blue-100 text-[#0B4F9C] border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doc)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-lg text-xs transition inline-flex items-center cursor-pointer"
                            title="Remove Doctor"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 3: STAFF & USER ROLES (FULL CRUD) */}
        {activeTab === 'staff' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase font-outfit">Staff & User Role Accounts (RBAC)</h2>
                <p className="text-xs text-slate-500">Create staff credentials for Reception, Lab, Pharmacy, and Super Admin</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff by username, name, role..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Login Username</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Department / Counter</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStaff.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">{u.name}</strong>
                        <span className="text-[10px] text-slate-500">{u.email}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0B4F9C]">
                        {u.username}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          u.role === 'super_admin' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          u.role === 'doctor' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          u.role === 'receptionist' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          u.role === 'lab_tech' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {u.department} {u.counterDesk ? `(${u.counterDesk})` : ''}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStaffStatus(u.id, u.active)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            u.active ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}
                        >
                          {u.active ? 'Active' : 'Deactivated'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenStaffModal(u)}
                          className="bg-blue-50 hover:bg-blue-100 text-[#0B4F9C] border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Key size={13} />
                          <span>Edit / Reset PW</span>
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteStaff(u)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-lg text-xs transition inline-flex items-center cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* DOCTOR CREATE / EDIT MODAL */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 text-slate-900 shadow-2xl space-y-4 my-8">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#0B4F9C]">
                <Stethoscope size={20} />
                <h3 className="font-black text-lg text-slate-900 font-outfit">
                  {editingDoctor ? 'Edit Doctor Profile & Clinic' : '+ Add New Consultant Doctor'}
                </h3>
              </div>
              <button onClick={() => setShowDoctorModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Muhammad Yasir"
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Qualification / Degrees *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBBS, FCPS (Medicine)"
                    value={doctorForm.qualification}
                    onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Clinical Department *</label>
                  <select
                    value={doctorForm.departmentId}
                    onChange={(e) => {
                      const dept = departments.find(d => d.id === e.target.value);
                      setDoctorForm({ 
                        ...doctorForm, 
                        departmentId: e.target.value,
                        specialization: dept ? dept.name : doctorForm.specialization
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Specialty Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Consultant Cardiologist"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 106"
                    value={doctorForm.roomNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, roomNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">OPD Shift Timings *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00 AM - 02:00 PM"
                    value={doctorForm.timing}
                    onChange={(e) => setDoctorForm({ ...doctorForm, timing: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Doctor Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Availability Status</label>
                  <select
                    value={doctorForm.status}
                    onChange={(e) => setDoctorForm({ ...doctorForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  >
                    <option value="AVAILABLE">Active / In OPD Clinic</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="SURGERY">In Surgery / OT</option>
                    <option value="INACTIVE">Inactive (Hidden from Queue & Portal)</option>
                  </select>
                </div>
              </div>

              {/* Login Credentials Section */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-[#0B4F9C] block">Doctor Portal Login Credentials</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Login username (e.g. dr.yasir)"
                      value={doctorForm.username}
                      onChange={(e) => setDoctorForm({ ...doctorForm, username: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder={editingDoctor ? "New Password (optional)" : "Password (default: doctor123)"}
                      value={doctorForm.password}
                      onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#0B4F9C] hover:bg-[#083B75] text-white font-black py-2.5 rounded-xl transition cursor-pointer shadow-md text-xs"
                >
                  {editingDoctor ? 'Save & Sync Doctor Profile' : '+ Add Doctor to Hospital System'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* STAFF CREATE / EDIT MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl space-y-4 my-8">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#0B4F9C]">
                <UserPlus size={20} />
                <h3 className="font-black text-lg text-slate-900 font-outfit">
                  {editingStaff ? 'Edit Staff Account & Password' : '+ Add New Staff Account'}
                </h3>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-700 font-bold mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bilal Ahmad"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">System Role *</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  >
                    <option value="receptionist">RECEPTIONIST (Token Counter)</option>
                    <option value="lab_tech">LAB_TECH (Pathology & Scans)</option>
                    <option value="pharmacist">PHARMACIST (Store & POS)</option>
                    <option value="super_admin">SUPER_ADMIN (Administration)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Counter / Desk Assignment</label>
                  <input
                    type="text"
                    placeholder="e.g. Counter 2"
                    value={staffForm.counterDesk}
                    onChange={(e) => setStaffForm({ ...staffForm, counterDesk: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Login Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. reception2"
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {editingStaff ? 'Reset Password (optional)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingStaff}
                    placeholder={editingStaff ? "Leave blank to keep current" : "••••••••"}
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0B4F9C] focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#0B4F9C] hover:bg-[#083B75] text-white font-black py-2.5 rounded-xl transition cursor-pointer shadow-md text-xs"
                >
                  {editingStaff ? 'Update Staff Account' : '+ Create Staff Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
