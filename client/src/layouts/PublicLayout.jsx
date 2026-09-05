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
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 shadow-xl no-print text-white">
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
                  <span className="font-black text-base sm:text-lg md:text-xl tracking-tight text-white uppercase font-outfit truncate group-hover:text-cyan-400 transition">
                    Al-Shafay Hospital
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase shrink-0">
                    Fatehpur
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium hidden sm:block truncate">
                  Care, Compassion & Advanced Clinical Healthcare
                </p>
              </div>
            </Link>

            {/* Public Quick Actions & Links */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              <Link
                to="/book"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/15 transition shadow-sm min-h-[42px] backdrop-blur-md"
              >
                <Calendar size={14} className="text-cyan-400" />
                <span>Book Doctor</span>
              </Link>

              <Link
                to="/screen"
                target="_blank"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 transition shadow-sm min-h-[42px] backdrop-blur-md"
                title="Open Live Waiting TV Display (Audio Calling Active)"
              >
                <Tv size={15} className="shrink-0 animate-pulse text-cyan-400" />
                <span className="hidden md:inline">Live TV Screen</span>
                <span className="md:hidden text-xs font-black">Live TV</span>
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-cyan-600 hover:to-blue-600 transition shadow-lg shadow-cyan-950/50 min-h-[42px]"
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

