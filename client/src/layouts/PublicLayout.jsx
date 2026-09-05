import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import UrduMarqueeStrip from '../components/UrduMarqueeStrip';
import WhatsAppFloatButton from '../components/WhatsAppFloatButton';
import Footer from '../components/Footer';
import { Phone, Tv, LogIn, MapPin, Calendar, HeartPulse, Clock } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased selection:bg-emerald-500 selection:text-white flex flex-col font-sans overflow-x-hidden">
      
      {/* Top Main Navigation Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-sm no-print text-slate-900">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-2">
            
            {/* Hospital Branding with 3D Animated Corner Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group select-none min-w-0">
              <div className="logo-3d-wrapper shrink-0 p-1 sm:p-1.5 bg-slate-50 border border-slate-200/80 rounded-xl sm:rounded-2xl shadow-xs">
                <img 
                  src="/logo.png" 
                  alt="Al-Shafay Hospital Logo" 
                  className="logo-3d-animated w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" 
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-base md:text-lg font-extrabold text-slate-900 truncate tracking-tight font-outfit uppercase group-hover:text-[#0B4F9C] transition">
                    AL-SHAFAY HOSPITAL
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[8.5px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-300 uppercase shrink-0 hidden sm:inline">
                    Fatehpur
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 font-urdu leading-none truncate pt-0.5" dir="rtl">
                    الشافع ہسپتال فتح پور
                  </span>
                  <span className="hidden md:inline text-slate-300 text-xs">•</span>
                  <p className="text-[10px] text-slate-500 font-medium hidden md:block truncate">
                    Care, Compassion & Advanced Clinical OPD
                  </p>
                </div>
              </div>
            </Link>

            {/* Public Quick Actions & Links */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              
              <Link
                to="/book"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition shadow-2xs"
              >
                <Calendar size={14} className="text-[#0B4F9C]" />
                <span>Book Doctor</span>
              </Link>

              {/* Live TV Screen Button - Icon on mobile, full on desktop */}
              <Link
                to="/screen"
                target="_blank"
                className="px-2 sm:px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-semibold text-[#0B4F9C] bg-blue-50/80 hover:bg-blue-100 transition shadow-2xs flex items-center gap-1"
                title="Open Live Waiting TV Display (Audio Calling Active)"
              >
                <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0B4F9C] animate-pulse shrink-0" />
                <span className="hidden sm:inline font-bold">Live TV</span>
              </Link>

              {/* Staff Portal - Always visible & prominent on all devices */}
              <Link
                to="/login"
                className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
      <Footer />


    </div>
  );
}

