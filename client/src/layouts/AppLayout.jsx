import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { testSpeechAnnouncement } from '../utils/speech';
import QuickRoleDrawer from '../components/QuickRoleDrawer';
import { 
  Users, 

  Stethoscope, 
  FlaskConical, 
  Pill, 
  ShieldAlert, 
  Tv, 
  Globe, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Clock,
  Menu,
  X
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { connected, enableAudio, setEnableAudio } = useSocket();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Reception Desk',
      path: '/reception',
      icon: Users,
      roles: ['receptionist', 'super_admin', 'admin'],
      badge: 'OPD'
    },
    {
      name: 'Doctor Portal & EMR',
      path: '/doctor',
      icon: Stethoscope,
      roles: ['doctor', 'super_admin', 'admin'],
      badge: 'EMR'
    },
    {
      name: 'Diagnostic Laboratory',
      path: '/lab',
      icon: FlaskConical,
      roles: ['lab_tech', 'super_admin', 'admin'],
      badge: 'Tests'
    },
    {
      name: 'Pharmacy & POS',
      path: '/pharmacy',
      icon: Pill,
      roles: ['pharmacist', 'super_admin', 'admin'],
      badge: 'Store'
    },
    {
      name: 'Executive Analytics',
      path: '/admin',
      icon: ShieldAlert,
      roles: ['super_admin', 'admin'],
      badge: 'Admin'
    }
  ];

  const userRole = (user?.role || 'guest').toLowerCase().trim();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';
  const visibleNavItems = navItems.filter(item => 
    isAdmin || item.roles.map(r => r.toLowerCase()).includes(userRole)
  );

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/reception': return { title: 'Reception Desk & Token Generation', dept: 'Outpatient Registration' };
      case '/doctor': return { title: 'Doctor Clinical Workstation & EMR', dept: user?.doctorDetails ? `${user.doctorDetails.name} • ${user.doctorDetails.roomNumber}` : 'Consultation' };
      case '/lab': return { title: 'Diagnostic Laboratory Portal', dept: 'Pathology & Specimen Testing' };
      case '/pharmacy': return { title: 'Pharmacy Point of Sale & Stock', dept: 'Dispensing Counter' };
      case '/admin': return { title: 'Executive Hospital Analytics & Oversight', dept: 'Super Admin Control Center' };
      default: return { title: 'Hospital Management System', dept: 'Al-Shafay Hospital' };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans overflow-hidden">
      
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Sidebar (Clean White & Medical Blue) */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-xs no-print ${
          collapsed ? 'w-20' : 'w-68'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        
        {/* Top Branding with 3D Animated Corner Logo */}
        <div>
          <div className="h-20 px-4 flex items-center justify-between border-b border-slate-100">
            <Link to="/" className="flex items-center gap-3 overflow-hidden select-none">
              <div className="logo-3d-wrapper shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="logo-3d-animated w-11 h-11 object-contain shrink-0" 
                />
              </div>
              {!collapsed && (
                <div className="truncate min-w-0">
                  <span className="font-black text-sm tracking-tight text-[#081E48] uppercase block truncate font-outfit">
                    Al-Shafay Hospital
                  </span>
                  <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider block">
                    Fatehpur
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse toggle button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Close button (mobile) */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Department Navigation Links */}
          <nav className="p-3 space-y-1.5">
            <div className={`text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 ${collapsed ? 'text-center' : ''}`}>
              {collapsed ? '•••' : 'Clinical Workstations'}
            </div>

            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0B4F9C] to-[#083B75] text-white shadow-md shadow-blue-900/15'
                        : 'text-slate-600 hover:text-[#0B4F9C] hover:bg-blue-50/70'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <Icon size={18} className="shrink-0 group-hover:scale-105 transition-transform" />
                  {!collapsed && <span className="truncate flex-1">{item.name}</span>}
                  {!collapsed && item.badge && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-[#0B4F9C]">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Public TV & Portal Links */}
            <div className="pt-3 mt-3 border-t border-slate-100">
              <div className={`text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 ${collapsed ? 'text-center' : ''}`}>
                {collapsed ? '•••' : 'Hospital Screens'}
              </div>

              <Link
                to="/screen"
                target="_blank"
                className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition ${
                  collapsed ? 'justify-center' : ''
                }`}
                title={collapsed ? "Open Live TV Screen" : undefined}
              >
                <Tv size={17} className="text-emerald-600 shrink-0" />
                {!collapsed && <span>Waiting TV Screen</span>}
              </Link>

              <Link
                to="/"
                className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#0B4F9C] hover:bg-blue-50 transition ${
                  collapsed ? 'justify-center' : ''
                }`}
                title={collapsed ? "Public Appointment Portal" : undefined}
              >
                <Globe size={17} className="text-[#0B4F9C] shrink-0" />
                {!collapsed && <span>Public Portal</span>}
              </Link>
            </div>
          </nav>
        </div>

        {/* Bottom User Profile Card */}
        <div className="p-3 border-t border-slate-100">
          <div className={`bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between gap-2 ${collapsed ? 'flex-col p-2' : ''}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#0B4F9C] font-black text-xs shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {!collapsed && (
                <div className="truncate">
                  <p className="font-bold text-xs text-slate-800 truncate">{user?.name || user?.username}</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">{user?.role?.replace('_', ' ')}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs no-print">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600"
              >
                <Menu size={18} />
              </button>

              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-outfit">
                  <span>{pageInfo.title}</span>
                </h2>
                <p className="text-[11px] text-[#0B4F9C] font-bold">{pageInfo.dept}</p>
              </div>
            </div>

            {/* Right Header Utilities */}
            <div className="flex items-center gap-3">
              
              {/* Audio Controls & English Voice Test */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  onClick={() => setEnableAudio(!enableAudio)}
                  title={enableAudio ? "English Voice Enabled (Click to Mute)" : "Audio Muted"}
                  className={`p-1.5 rounded-lg transition ${
                    enableAudio ? 'text-emerald-700 bg-emerald-100/80 font-bold' : 'text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {enableAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                  onClick={testSpeechAnnouncement}
                  title="Test English Voice Announcement"
                  className="text-[11px] font-bold text-slate-600 hover:text-[#0B4F9C] px-2.5 py-1 hover:bg-slate-200 rounded-lg transition"
                >
                  Test Voice
                </button>
              </div>

              {/* WebSocket Sync Status */}
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  connected 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className="hidden sm:inline">{connected ? 'Live Sync' : 'Offline'}</span>
              </div>

              {/* Digital Clock */}
              <div className="hidden md:flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 text-slate-700 text-xs font-mono font-bold">
                <Clock size={13} className="text-[#0B4F9C]" />
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>

            </div>

          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 p-2 sm:p-4">
          <Outlet />
        </div>


      </div>

      {/* Floating Demo Role Switcher Drawer */}
      <QuickRoleDrawer />

    </div>
  );
}

