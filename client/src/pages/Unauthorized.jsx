import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthorizedPathForRole } from '../utils/authRoutes';
import { ShieldAlert, Home, LogIn, ArrowRight } from 'lucide-react';

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (!user || !user.role) {
      navigate('/login', { replace: true });
      return;
    }

    const target = getAuthorizedPathForRole(user.role);
    navigate(target, { replace: true });
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 text-slate-800 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 text-center shadow-lg space-y-6">
        
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-3xl mx-auto flex items-center justify-center text-rose-600 shadow-xs">
          <ShieldAlert size={36} />
        </div>

        <div>
          <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight font-outfit">Access Restricted</h1>
          <p className="text-xs text-rose-700 font-bold mt-1 uppercase tracking-wider">
            Permission Required (Role Mismatch)
          </p>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Your current account role <strong className="text-[#0B4F9C] uppercase font-mono font-bold">({user?.role || 'Guest'})</strong> is not assigned to this department view.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 text-left">
          <div className="flex justify-between">
            <span>Signed in as:</span>
            <span className="font-black text-slate-900 uppercase">{user?.name || user?.username || 'Guest'}</span>
          </div>
          <div className="flex justify-between">
            <span>Assigned Workstation:</span>
            <span className="text-[#0B4F9C] font-extrabold uppercase">{getAuthorizedPathForRole(user?.role).replace('/', '') || 'Public Portal'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={handleGoHome}
            className="w-full bg-gradient-to-r from-[#0B4F9C] to-[#083B75] hover:from-[#083B75] hover:to-[#0B4F9C] text-white font-extrabold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md shadow-blue-900/15 cursor-pointer"
          >
            <Home size={16} />
            <span>Go to My Authorized Workstation</span>
            <ArrowRight size={14} />
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

