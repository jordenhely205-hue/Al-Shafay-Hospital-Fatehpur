import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Home, LogIn } from 'lucide-react';

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (!user || !user.role) {
      navigate('/login', { replace: true });
      return;
    }

    const roleRoutes = {
      RECEPTIONIST: '/reception',
      receptionist: '/reception',
      DOCTOR: '/doctor',
      doctor: '/doctor',
      LAB_TECH: '/lab',
      lab_tech: '/lab',
      PHARMACIST: '/pharmacy',
      pharmacist: '/pharmacy',
      ADMIN: '/admin',
      admin: '/admin',
      SUPER_ADMIN: '/admin',
      super_admin: '/admin'
    };

    const target = roleRoutes[user.role] || roleRoutes[user.role.toUpperCase()] || '/login';
    navigate(target, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 text-center shadow-md space-y-6">
        
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-3xl mx-auto flex items-center justify-center text-rose-600 shadow-xs">
          <ShieldAlert size={36} />
        </div>

        <div>
          <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight font-outfit">Access Restricted</h1>
          <p className="text-xs text-rose-700 font-bold mt-1 uppercase tracking-wider">
            Permission Required (Role Mismatch)
          </p>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Your current account role <strong className="text-slate-900 uppercase font-mono font-bold">({user?.role || 'Guest'})</strong> is not authorized to access this department or administrative view.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1 text-left">
          <div className="flex justify-between">
            <span>Signed in as:</span>
            <span className="font-black text-slate-900 uppercase">{user?.name || user?.username || 'Guest'}</span>
          </div>
          <div className="flex justify-between">
            <span>Department:</span>
            <span className="text-[#0B4F9C] font-bold">{user?.department || 'Outpatient Services'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleGoHome}
            className="w-full bg-[#0B4F9C] hover:bg-[#083B75] text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md cursor-pointer"
          >
            <Home size={15} />
            <span>Go to My Authorized Workstation</span>
          </button>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <LogIn size={15} />
            <span>Switch Staff Account</span>
          </button>
        </div>

      </div>
    </div>
  );
}
