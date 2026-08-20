import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Phone, Tv, LogIn, MapPin } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Public Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            
            {/* Hospital Branding with strictly constrained logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/logo.png" 
                alt="Al-Shafay Hospital Logo" 
                className="h-10 w-10 md:h-12 md:w-12 object-contain shrink-0 group-hover:scale-105 transition-transform" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg md:text-xl tracking-tight text-[#0B4F9C] uppercase font-outfit">
                    Al-Shafay Hospital
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 uppercase">
                    Fatehpur
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Care, Compassion & Advanced Quality Healthcare</p>
              </div>
            </Link>

            {/* Public Links & Actions */}
            <div className="flex items-center gap-2.5">
              
              <Link
                to="/screen"
                target="_blank"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#0B4F9C] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition shadow-2xs"
              >
                <Tv size={14} />
                <span>Live TV Screen</span>
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#0B4F9C] to-[#083B75] hover:from-[#083B75] hover:to-[#0B4F9C] transition shadow-sm"
              >
                <LogIn size={14} />
                <span>Staff Portal</span>
              </Link>

            </div>

          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500 no-print space-y-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain opacity-90 shrink-0" />
            <p className="font-medium text-slate-700">© {new Date().getFullYear()} <strong className="text-[#0B4F9C]">Al-Shafay Hospital Fatehpur</strong>. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span className="flex items-center gap-1"><MapPin size={13} className="text-emerald-600" /> Hospital Road, Fatehpur, Layyah</span>
            <span className="flex items-center gap-1"><Phone size={13} className="text-[#0B4F9C]" /> 0300-1234567</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
