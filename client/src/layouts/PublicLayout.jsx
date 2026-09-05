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
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Hospital Branding with 3D Animated Corner Logo */}
            <Link to="/" className="flex items-center gap-3 group select-none">
              <div className="logo-3d-wrapper shrink-0 p-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs">
                <img 
                  src="/logo.png" 
                  alt="Al-Shafay Hospital Logo" 
                  className="logo-3d-animated h-9 w-9 md:h-11 md:w-11 object-contain shrink-0" 
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
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-bold font-urdu text-slate-800 tracking-wide leading-none pt-0.5" dir="rtl">
                    الشافع ہسپتال فتح پور
                  </p>
                  <span className="hidden sm:inline text-slate-300 text-xs">•</span>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block truncate">
                    Care, Compassion & Advanced Clinical OPD
                  </p>
                </div>
              </div>
            </Link>

            {/* Public Quick Actions & Links */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              <Link
                to="/book"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition shadow-2xs min-h-[42px]"
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
                <Tv size={15} className="shrink-0 animate-pulse text-[#0B4F9C]" />
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
      <Footer />


    </div>
  );
}

