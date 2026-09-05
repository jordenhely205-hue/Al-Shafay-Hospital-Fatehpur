import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import UrduMarqueeStrip from '../components/UrduMarqueeStrip';
import WhatsAppFloatButton from '../components/WhatsAppFloatButton';
import { Phone, Tv, LogIn, MapPin, Calendar, HeartPulse, Clock } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-x-hidden">
      
      {/* Top Main Navigation Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Hospital Branding with 3D Animated Corner Logo */}
            <Link to="/" className="flex items-center gap-3 group select-none">
              <div className="logo-3d-wrapper shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Al-Shafay Hospital Logo" 
                  className="logo-3d-animated h-11 w-11 md:h-12 md:w-12 object-contain shrink-0" 
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-base sm:text-lg md:text-xl tracking-tight text-[#081E48] uppercase font-outfit truncate group-hover:text-[#0B4F9C] transition">
                    Al-Shafay Hospital
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 uppercase shrink-0">
                    Fatehpur
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block truncate">
                  Care, Compassion & Advanced Clinical Healthcare
                </p>
              </div>
            </Link>

            {/* Public Quick Actions & Links */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              <Link
                to="/book"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition shadow-2xs min-h-[42px]"
              >
                <Calendar size={14} className="text-[#0B4F9C]" />
                <span>Book Doctor</span>
              </Link>

              <Link
                to="/screen"
                target="_blank"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0B4F9C] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition shadow-2xs min-h-[42px]"
                title="Open Live Waiting TV Display (Audio Calling Active)"
              >
                <Tv size={15} className="shrink-0 animate-pulse" />
                <span className="hidden md:inline">Live TV Screen</span>
                <span className="md:hidden text-xs font-black">Live TV</span>
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#0B3B82] to-[#081E48] hover:from-[#081E48] hover:to-[#0B3B82] transition shadow-md shadow-blue-950/20 min-h-[42px]"
              >
                <LogIn size={15} className="shrink-0" />
                <span>Staff Portal</span>
              </Link>

            </div>

          </div>
        </div>

        {/* Integrated Urdu Patient Notice Marquee Bar */}
        <UrduMarqueeStrip />
      </header>

      {/* Main Page Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Floating 24/7 WhatsApp Quick-Help Widget */}
      <WhatsAppFloatButton />

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-xs text-slate-500 no-print space-y-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="logo-3d-wrapper">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain opacity-95 shrink-0" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 text-sm">
                Al-Shafay Hospital <span className="text-[#0B4F9C]">Fatehpur</span>
              </p>
              <p className="text-[11px] text-slate-500">Official Electronic Medical Records & Outpatient Management</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-4 text-slate-600 font-medium text-[11px]">
            <span className="flex items-center gap-1.5"><MapPin size={13} className="text-emerald-600" /> Hospital Road, Fatehpur, Layyah</span>
            <span className="flex items-center gap-1.5"><Phone size={13} className="text-[#0B4F9C]" /> 24/7 Helpline: 0300-1234567</span>
            <a href="https://api.whatsapp.com/send?phone=923016167412" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-700 font-bold hover:underline">
              <span>WhatsApp: 0301-6167412</span>
            </a>

          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} Al-Shafay Hospital Fatehpur. All rights reserved.</p>
          <p className="font-mono text-slate-600 font-semibold">Website Developed By : AM FutureStack 03069141212</p>
          <p className="font-mono">PHC Registered • Digital Queue & Audio Call Enabled</p>
        </div>
      </footer>


    </div>
  );
}

