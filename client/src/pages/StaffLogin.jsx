import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthorizedPathForRole, isRouteAllowedForRole } from '../utils/authRoutes';
import { 
  Lock, 
  User, 
  LogIn, 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  ShieldAlert, 
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function StaffLogin() {
  const { login, quickSwitchRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get('redirect');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resolveDestination = (userRole) => {
    if (rawRedirect && isRouteAllowedForRole(userRole, rawRedirect)) {
      return rawRedirect;
    }
    return getAuthorizedPathForRole(userRole);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter your staff username and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await login(username, password);
      if (res.success && res.user) {
        const dest = resolveDestination(res.user.role);
        navigate(dest, { replace: true });
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role, doctorId, targetPath) => {
    setLoading(true);
    setError('');
    try {
      await quickSwitchRole(role, doctorId);
      const dest = targetPath || getAuthorizedPathForRole(role);
      navigate(dest, { replace: true });
    } catch (err) {
      setError('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    {
      title: 'Reception Desk',
      sub: 'Token Generation & Patient Registration',
      role: 'receptionist',
      path: '/reception',
      icon: Users,
      color: 'hover:border-[#0B4F9C] hover:bg-blue-50/80 text-[#0B4F9C]'
    },
    {
      title: 'Dr. Imran Tahir',
      sub: 'Consultant Cardiologist (Room 101)',
      role: 'doctor',
      doctorId: 'doc-1',
      path: '/doctor',
      icon: Stethoscope,
      color: 'hover:border-emerald-500 hover:bg-emerald-50 text-emerald-700'
    },
    {
      title: 'Dr. Fatima Noor',
      sub: 'Senior Physician (Room 102)',
      role: 'doctor',
      doctorId: 'doc-2',
      path: '/doctor',
      icon: Stethoscope,
      color: 'hover:border-teal-500 hover:bg-teal-50 text-teal-700'
    },
    {
      title: 'Diagnostic Laboratory',
      sub: 'Pathology & Specimen Tests',
      role: 'lab_tech',
      path: '/lab',
      icon: FlaskConical,
      color: 'hover:border-purple-500 hover:bg-purple-50 text-purple-700'
    },
    {
      title: 'Pharmacy & Store',
      sub: 'Prescription POS & Inventory',
      role: 'pharmacist',
      path: '/pharmacy',
      icon: Pill,
      color: 'hover:border-amber-500 hover:bg-amber-50 text-amber-700'
    },
    {
      title: 'Super Admin Control Center',
      sub: 'Hospital Analytics & Oversight',
      role: 'super_admin',
      path: '/admin',
      icon: ShieldAlert,
      color: 'hover:border-rose-500 hover:bg-rose-50 text-rose-700'
    }
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Login Form Card */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            
            {/* Header with constrained 3D Logo */}
            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
              <div className="logo-3d-wrapper">
                <img 
                  src="/logo.png" 
                  alt="Al-Shafay Logo" 
                  className="logo-3d-animated h-11 w-11 object-contain shrink-0" 
                />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase text-[#0B4F9C] tracking-tight font-outfit">Staff Portal Login</h1>
                <p className="text-xs text-emerald-700 font-extrabold uppercase">Al-Shafay Hospital Fatehpur</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-6 font-medium">
              Sign in with your assigned hospital credentials to access your designated workstation.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-semibold">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Staff Username / Email</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. reception or dr.imran"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white transition text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#0B4F9C] to-[#083B75] hover:from-[#083B75] hover:to-[#0B4F9C] text-white font-black py-3 rounded-xl transition shadow-md shadow-blue-900/15 flex items-center justify-center gap-2 cursor-pointer mt-2 text-xs"
              >
                <LogIn size={16} />
                <span>{loading ? 'Authenticating...' : 'Sign In to Workstation'}</span>
              </button>
            </form>

          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500">
            <span>Are you a patient? </span>
            <Link to="/" className="text-[#0B4F9C] hover:underline font-bold">
              Visit Public Appointment Portal
            </Link>
          </div>
        </div>

        {/* Right: Quick One-Click Demo Role Cards */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between space-y-4">
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-[#0B4F9C]" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide font-outfit">
                Instant Demo Workstation Access
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Select any hospital role below to immediately sign in and jump to authorized workstation:
            </p>

            <div className="space-y-2.5">
              {quickRoles.map((qr, idx) => {
                const Icon = qr.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickLogin(qr.role, qr.doctorId, qr.path)}
                    disabled={loading}
                    className={`w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left flex items-center justify-between transition group cursor-pointer ${qr.color}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:scale-105 transition shadow-2xs">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-extrabold text-xs text-slate-900">{qr.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{qr.sub}</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-[#0B4F9C] group-hover:translate-x-1 transition" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2 font-medium">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>Role-Based Access Control (RBAC) securely active across all routes.</span>
          </div>

        </div>

      </div>
    </div>
  );
}

