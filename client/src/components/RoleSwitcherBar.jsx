import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Stethoscope, FlaskConical, Pill, ShieldAlert, Tv, Globe, UserCheck } from 'lucide-react';

export default function RoleSwitcherBar() {
  const { user, quickSwitchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roles = [
    {
      id: 'reception',
      label: 'Reception Desk',
      role: 'receptionist',
      path: '/reception',
      icon: Users,
      color: 'bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30'
    },
    {
      id: 'doc-imran',
      label: 'Dr. Imran (Cardio)',
      role: 'doctor',
      doctorId: 'doc-1',
      path: '/doctor',
      icon: Stethoscope,
      color: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30'
    },
    {
      id: 'doc-fatima',
      label: 'Dr. Fatima (Physician)',
      role: 'doctor',
      doctorId: 'doc-2',
      path: '/doctor',
      icon: Stethoscope,
      color: 'bg-teal-600/20 text-teal-300 border-teal-500/30 hover:bg-teal-600/30'
    },
    {
      id: 'lab',
      label: 'Lab Portal',
      role: 'lab_tech',
      path: '/lab',
      icon: FlaskConical,
      color: 'bg-purple-600/20 text-purple-300 border-purple-500/30 hover:bg-purple-600/30'
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy POS',
      role: 'pharmacist',
      path: '/pharmacy',
      icon: Pill,
      color: 'bg-amber-600/20 text-amber-300 border-amber-500/30 hover:bg-amber-600/30'
    },
    {
      id: 'admin',
      label: 'Super Admin',
      role: 'super_admin',
      path: '/admin',
      icon: ShieldAlert,
      color: 'bg-rose-600/20 text-rose-300 border-rose-500/30 hover:bg-rose-600/30'
    },
    {
      id: 'screen',
      label: 'Waiting TV Screen',
      role: 'public',
      path: '/screen',
      icon: Tv,
      color: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-600/30'
    },
    {
      id: 'public',
      label: 'Public Booking',
      role: 'public',
      path: '/book',
      icon: Globe,
      color: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/30'
    }
  ];

  const handleSwitch = async (item) => {
    if (item.role !== 'public') {
      await quickSwitchRole(item.role, item.doctorId);
    }
    navigate(item.path);
  };

  return (
    <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2 text-xs no-print overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-max">
        
        <div className="flex items-center gap-2 text-slate-400 font-medium">
          <UserCheck size={15} className="text-teal-400" />
          <span className="uppercase text-[10px] tracking-wider text-slate-400 font-bold">Quick Role Switcher:</span>
        </div>

        <div className="flex items-center gap-2">
          {roles.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path && 
              (item.role === 'public' || (user?.role === item.role && (!item.doctorId || user?.doctorId === item.doctorId)));

            return (
              <button
                key={item.id}
                onClick={() => handleSwitch(item)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                  isActive 
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20 font-bold' 
                    : item.color
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
