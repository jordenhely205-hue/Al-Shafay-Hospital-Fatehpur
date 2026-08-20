import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  X, 
  Users, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  ShieldAlert, 
  ArrowRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export default function QuickRoleDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, quickSwitchRole } = useAuth();
  const navigate = useNavigate();

  const demoRoles = [
    {
      id: 'reception',
      label: 'Reception Desk',
      sub: 'Token Generator & Registration',
      role: 'receptionist',
      path: '/reception',
      icon: Users,
      color: 'hover:border-blue-500 hover:bg-blue-50 text-[#0B4F9C]'
    },
    {
      id: 'doc-imran',
      label: 'Dr. Imran (Cardiology)',
      sub: 'Consultant (Room 101)',
      role: 'doctor',
      doctorId: 'doc-1',
      path: '/doctor',
      icon: Stethoscope,
      color: 'hover:border-emerald-500 hover:bg-emerald-50 text-emerald-700'
    },
    {
      id: 'doc-fatima',
      label: 'Dr. Fatima (Internal Med)',
      sub: 'Physician (Room 102)',
      role: 'doctor',
      doctorId: 'doc-2',
      path: '/doctor',
      icon: Stethoscope,
      color: 'hover:border-teal-500 hover:bg-teal-50 text-teal-700'
    },
    {
      id: 'lab',
      label: 'Laboratory Portal',
      sub: 'Pathology & Scans',
      role: 'lab_tech',
      path: '/lab',
      icon: FlaskConical,
      color: 'hover:border-purple-500 hover:bg-purple-50 text-purple-700'
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy POS',
      sub: 'Dispensing & Inventory',
      role: 'pharmacist',
      path: '/pharmacy',
      icon: Pill,
      color: 'hover:border-amber-500 hover:bg-amber-50 text-amber-700'
    },
    {
      id: 'admin',
      label: 'Super Admin',
      sub: 'Executive Analytics',
      role: 'super_admin',
      path: '/admin',
      icon: ShieldAlert,
      color: 'hover:border-rose-500 hover:bg-rose-50 text-rose-700'
    }
  ];

  const handleSelectRole = async (item) => {
    await quickSwitchRole(item.role, item.doctorId);
    navigate(item.path);
    setIsOpen(false);
  };

  return (
    <div className="quick-role-drawer no-print fixed bottom-4 right-4 z-50">
      
      {/* Expanded Popup Menu */}
      {isOpen && (
        <div className="bg-white border border-slate-300 rounded-3xl p-4 shadow-2xl mb-2 w-80 text-slate-800 space-y-3">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-[#0B4F9C] font-black text-xs">
              <Sparkles size={14} />
              <span>Instant Demo Role Switcher</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Switch staff identity & jump to authorized dashboard:
          </p>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {demoRoles.map((item) => {
              const Icon = item.icon;
              const isCurrent = user?.role === item.role && (!item.doctorId || user?.doctorId === item.doctorId);

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectRole(item)}
                  className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                    isCurrent 
                      ? 'border-[#0B4F9C] bg-blue-50/80 text-[#0B4F9C]' 
                      : `border-slate-200 bg-slate-50 ${item.color}`
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    <div>
                      <p className="font-bold text-xs text-slate-900">{item.label}</p>
                      <p className="text-[10px] text-slate-500">{item.sub}</p>
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="text-[9px] font-black uppercase bg-[#0B4F9C] text-white px-2 py-0.5 rounded">Active</span>
                  ) : (
                    <ArrowRight size={13} className="text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>

        </div>
      )}

      {/* Collapsed Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-[#0B4F9C] to-[#083B75] hover:from-[#083B75] hover:to-[#0B4F9C] text-white font-black px-4.5 py-3 rounded-full shadow-xl shadow-blue-900/20 flex items-center gap-2 text-xs transition transform hover:scale-105 cursor-pointer border border-white/20"
      >
        <Sparkles size={15} />
        <span>⚡ Quick Role Switcher</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

    </div>
  );
}
